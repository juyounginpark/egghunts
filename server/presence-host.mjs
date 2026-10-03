import {createServer} from 'node:http';
import {randomUUID,randomInt} from 'node:crypto';
import {isIP} from 'node:net';
import {WebSocketServer,WebSocket} from 'ws';
import {PresenceRoom} from './presence-room.mjs';
import {transferBudget} from './transfer-budget.mjs';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function presenceServer({origins=[],maxRooms=Number(process.env.PRESENCE_MAX_ROOMS??60),authenticate=async()=>({id:randomUUID(),guest:true}),path='/presence',budget=null}={}){
 const rooms=new Map(),members=new Map(),audiences=new Map(),allowed=new Set(origins),connections=new Map(),joiningIds=new Set();
 const http=createServer((req,res)=>{const health=['/healthz','/readyz'].includes(req.url);res.writeHead(health?200:404,{'Content-Type':'application/json'});res.end(JSON.stringify(health?{service:'egghunts-friends',ready:true,rooms:rooms.size,players:members.size}:{error:'NOT_FOUND'}));});
 http.maxConnections=maxRooms*10;http.headersTimeout=10000;
 const wss=new WebSocketServer({noServer:true,maxPayload:32768,perMessageDeflate:false});
 const send=(ws,message)=>{if(ws.readyState!==WebSocket.OPEN)return;if(ws.bufferedAmount>65536){ws.close(1008,'Slow receiver');return;}const text=JSON.stringify(message);if(budget&&!budget.charge(Buffer.byteLength(text))){ws.close(1008,'Monthly payload limit');return;}ws.send(text);};
 const broadcast=(room,message,except)=>{for(const ws of audiences.get(room)??[])if(ws!==except)send(ws,message);};
 const hostState=room=>({type:'host',hostId:room.hostId,epoch:room.epoch,snapshots:room.handover(),players:[...room.bots.values()]});
 http.on('upgrade',(req,socket,head)=>{
  const remote=req.socket.remoteAddress,forwarded=req.headers['x-real-ip'];
  // nginx overwrites X-Real-IP; only a loopback proxy may provide it.
  const ip=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)&&typeof forwarded==='string'&&isIP(forwarded)?forwarded:remote;
  if(req.url!==path||(allowed.size&&!allowed.has(req.headers.origin))||(connections.get(ip)??0)>=20||wss.clients.size>=maxRooms*10||(budget&&!budget.available())){socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>{connections.set(ip,(connections.get(ip)??0)+1);wss.emit('connection',ws,ip);});
 });
 wss.on('connection',(ws,ip)=>{
  let joined=false,busy=false,windowAt=Date.now(),count=0,seen=Date.now(),pendingRoom=null,pendingSlot=null,pendingId=null;const timeout=setTimeout(()=>{if(!joined)ws.close(1008,'Join required');},8000);
  ws.on('error',()=>{});
  ws.on('message',async raw=>{
   if(Date.now()-windowAt>1000){windowAt=Date.now();count=0;}if(++count>25){ws.close(1008,'Rate limited');return;}if(busy)return;seen=Date.now();
   try{
    const packet=JSON.parse(raw.toString());
    if(packet.type==='join'&&!joined){
     busy=true;const identity=await authenticate(packet.token);if(ws.readyState!==WebSocket.OPEN)return;
     const id=identity.id;if(joiningIds.has(id)||[...members.values()].some(m=>m.id===id))throw Error('ACCOUNT_ALREADY_CONNECTED');joiningIds.add(id);pendingId=id;
     let room;if(packet.mode==='create'){
      if(rooms.size>=maxRooms)throw Error('SERVER_FULL');let code;do{code=Array.from({length:5},()=>alphabet[randomInt(alphabet.length)]).join('');}while(rooms.has(code));room=new PresenceRoom(code);rooms.set(code,room);
     }else if(packet.mode==='join'&&typeof packet.code==='string')room=rooms.get(packet.code.toUpperCase());else throw Error('ROOM_CODE_REQUIRED');
     if(!room&&packet.recover===true&&/^[A-HJ-NP-Z2-9]{5}$/.test(packet.code)&&rooms.size<maxRooms){room=new PresenceRoom(packet.code);rooms.set(room.id,room);}if(!room)throw Error('ROOM_NOT_FOUND');if(room.humanCount+room.pendingSlots.size>=5)throw Error('ROOM_FULL');
     const slot=[0,1,2,3,4].find(s=>!room.pendingSlots.has(s)&&![...room.players.values()].some(p=>p.kind==='human'&&p.slot===s));room.pendingSlots.add(slot);pendingRoom=room;pendingSlot=slot;const bot=[...room.bots.values()].find(p=>p.slot===slot);
     if(bot){broadcast(room,{type:'evict',id:bot.id,deadline:Date.now()+1500});await new Promise(resolve=>setTimeout(resolve,1500));if(ws.readyState!==WebSocket.OPEN)return;}
     const {player,evicted}=room.join(id,packet.state,identity.guest,slot);if(evicted)broadcast(room,{type:'leave',id:evicted.id});
     members.set(ws,{id,room});joined=true;clearTimeout(timeout);if(!audiences.has(room))audiences.set(room,new Set());audiences.get(room).add(ws);
     send(ws,{type:'welcome',id,slot:player.slot,code:room.id,drops:[...room.drops.values()],hostId:room.hostId,epoch:room.epoch,players:[...room.players.values()].filter(p=>p.id!==id),snapshots:room.handover()});broadcast(room,{type:'peer',player,joined:true},ws);broadcast(room,hostState(room));return;
    }
    const member=members.get(ws);if(!member)throw Error('NOT_JOINED');const {room,id}=member;
    if(packet.type==='ping'){send(ws,{type:'pong'});return;}
    if(packet.type==='position'){const previous=room.players.get(id),player=room.update(id,packet.state),delta=Object.fromEntries(Object.entries(player).filter(([key,value])=>key==='id'||JSON.stringify(previous[key])!==JSON.stringify(value)));broadcast(room,{type:'peer',player:delta},ws);}
    else if(packet.type==='ai'){const previous=new Map(room.bots),players=room.ai(id,packet.epoch,packet.players,packet.snapshots);const delta=players.map(p=>Object.fromEntries(Object.entries(p).filter(([k,v])=>k==='id'||k==='slot'||k==='at'||JSON.stringify(previous.get(p.id)?.[k])!==JSON.stringify(v))));broadcast(room,{type:'ai',players:delta},ws);}
    else if(packet.type==='availability'){room.players.get(id).available=packet.available===true;if(room.assignHost())broadcast(room,hostState(room));}
    else if(packet.type==='attack'){
     if(!room.owns(id,packet.actor))throw Error('NOT_OWNER');const actor=room.players.get(packet.actor),target=room.players.get(packet.target),now=Date.now();
     if(!target||target.id===actor.id||actor.carried!==null||actor.training||now-(actor.lastAttack??0)<700||Math.hypot(actor.x-target.x,actor.z-target.z)>3.5)throw Error('INVALID_ATTACK');actor.lastAttack=now;
     broadcast(room,{type:'attack',actor:actor.id,target:target.id,eventId:randomUUID()});
    }else if(packet.type==='drop'){
     if(!room.owns(id,packet.actor)||room.drops.size>=30)throw Error('INVALID_DROP');const egg=packet.egg,actor=room.players.get(packet.actor);
     if(!egg||typeof egg.id!=='string'||egg.id.length>160||room.drops.has(egg.id)||!Number.isInteger(egg.type)||egg.type<0||egg.type>=36||!Number.isFinite(egg.hp)||egg.hp<0||!Number.isFinite(egg.weightG)||egg.weightG<=0||!Number.isSafeInteger(egg.standardWeightG)||egg.standardWeightG<=0||!Number.isSafeInteger(egg.weightG)||egg.weightG>1e9||egg.hpVersion!==5||!Number.isInteger(egg.stageId)||egg.stageId<1||egg.stageId>20)throw Error('INVALID_EGG');
     const drop={actor:packet.actor,egg:{id:egg.id.slice(0,160),type:egg.type,hp:egg.hp,hpVersion:5,weightG:egg.weightG,standardWeightG:egg.standardWeightG,stageId:egg.stageId,variant:Number.isInteger(egg.variant)&&egg.variant>=0&&egg.variant<=6?egg.variant:0,region:egg.type%5,guardian:Number.isInteger(egg.guardian)&&egg.guardian>=0&&egg.guardian<21?egg.guardian:0,special:egg.special===true,distance:Math.abs(actor.z),expires:Date.now()+60000,x:actor.x,z:actor.z},expiresAt:Date.now()+60000};room.drops.set(egg.id,drop);broadcast(room,{type:'drop',...drop});
    }else if(packet.type==='collect'){
     if(!room.owns(id,packet.actor))throw Error('NOT_OWNER');const drop=room.drops.get(packet.eggId),actor=room.players.get(packet.actor);
     if(!drop||drop.expiresAt<Date.now()||actor.carried!==null||Math.hypot(actor.x-drop.egg.x,actor.z-drop.egg.z)>4)throw Error('EGG_UNAVAILABLE');room.drops.delete(packet.eggId);broadcast(room,{type:'collected',actor:actor.id,egg:drop.egg});
    }else throw Error('UNKNOWN_PACKET');
   }catch(e){send(ws,{type:'error',message:e.message});}finally{busy=false;if(pendingRoom){pendingRoom.pendingSlots.delete(pendingSlot);if(!pendingRoom.humanCount&&!pendingRoom.pendingSlots.size)rooms.delete(pendingRoom.id);pendingRoom=null;pendingSlot=null;}if(pendingId){joiningIds.delete(pendingId);pendingId=null;}}
  });
  const lease=setInterval(()=>{if(Date.now()-seen>30000)ws.close(1008,'Lease expired');},10000);
  ws.on('close',()=>{clearTimeout(timeout);clearInterval(lease);connections.set(ip,Math.max(0,(connections.get(ip)??1)-1));if(!connections.get(ip))connections.delete(ip);const m=members.get(ws);if(m){const oldHost=m.room.hostId;m.room.leave(m.id);members.delete(ws);audiences.get(m.room)?.delete(ws);broadcast(m.room,{type:'leave',id:m.id});if(m.room.hostId!==oldHost)broadcast(m.room,hostState(m.room));if(!m.room.humanCount){rooms.delete(m.room.id);audiences.delete(m.room);}}});
 });
 const watchdog=setInterval(()=>{for(const room of rooms.values()){for(const [id,drop]of room.drops)if(drop.expiresAt<Date.now())room.drops.delete(id);if(room.hostId&&room.humanCount>1&&Date.now()-room.aiSeen>8000){room.players.get(room.hostId).available=false;if(room.assignHost())broadcast(room,hostState(room));}}},1000);
 return {http,wss,rooms,close:async()=>{clearInterval(watchdog);for(const ws of wss.clients)ws.terminate();await new Promise(resolve=>http.close(resolve));budget?.close();}};
}
export async function startPresenceHost(){
 const supabase=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
 const budget=process.env.PRESENCE_TRANSFER_PATH?transferBudget(process.env.PRESENCE_TRANSFER_PATH,Number(process.env.GAME_MONTHLY_PAYLOAD_MB??10240)*1024*1024):null;
 const host=presenceServer({budget,origins:(process.env.GAME_ALLOWED_ORIGINS??'').split(',').filter(Boolean),authenticate:async token=>{
  if(!token)return {id:randomUUID(),guest:true};if(!supabase||!key)throw Error('AUTH_NOT_CONFIGURED');
  const response=await fetch(`${supabase}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(3000)});
  if(!response.ok)throw Error('SIGN_IN');const user=await response.json();return {id:user.id,guest:user.is_anonymous===true};
 }});host.http.listen(Number(process.env.PORT??4330),process.env.HOST??'127.0.0.1');process.on('SIGTERM',()=>void host.close());process.on('SIGINT',()=>void host.close());return host;
}
