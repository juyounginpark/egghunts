import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {PresenceRoom} from './presence-room.mjs';
export function presenceServer({origins=[],maxRooms=Number(process.env.PRESENCE_MAX_ROOMS??60),authenticate=async()=>({id:randomUUID(),guest:true}),path='/presence'}={}){
 const rooms=new Map(),members=new Map(),audiences=new Map(),allowed=new Set(origins),connections=new Map();
 const http=createServer((req,res)=>{const health=['/healthz','/readyz'].includes(req.url);res.writeHead(health?200:404,{'Content-Type':'application/json'});res.end(JSON.stringify(health?{service:'egghunts-presence',ready:true,rooms:rooms.size,players:members.size}:{error:'NOT_FOUND'}));});
 http.maxConnections=maxRooms*5*2;http.headersTimeout=10000;
 const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:false});
 const send=(ws,message)=>{if(ws.readyState!==WebSocket.OPEN)return;if(ws.bufferedAmount>65536){ws.close(1008,'Slow receiver');return;}ws.send(JSON.stringify(message));};
 const broadcast=(room,message,except)=>{for(const ws of audiences.get(room)??[])if(ws!==except)send(ws,message);};
 http.on('upgrade',(req,socket,head)=>{
  const ip=req.headers['x-real-ip']??req.socket.remoteAddress;
  if(req.url!==path||(allowed.size&&!allowed.has(req.headers.origin))||(connections.get(ip)??0)>=12||wss.clients.size>=maxRooms*5*2){socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>{connections.set(ip,(connections.get(ip)??0)+1);wss.emit('connection',ws,ip);});
 });
 wss.on('connection',(ws,ip)=>{
  let joined=false,busy=false,windowAt=Date.now(),count=0,seen=Date.now();
  const timeout=setTimeout(()=>{if(!joined)ws.close(1008,'Join required');},5000);
  ws.on('error',()=>{});
  ws.on('message',async raw=>{
   if(Date.now()-windowAt>1000){windowAt=Date.now();count=0;}
   if(++count>10||busy){ws.close(1008,'Rate limited');return;}seen=Date.now();
   try{
    const packet=JSON.parse(raw.toString());
    if(packet.type==='join'&&!joined){
     busy=true;const identity=await authenticate(packet.token);if(ws.readyState!==WebSocket.OPEN)return;
     const id=identity.id;if([...members.values()].some(m=>m.id===id))throw Error('ACCOUNT_ALREADY_CONNECTED');
     let room=[...rooms.values()].find(r=>r.players.size<5);
     if(!room){if(rooms.size>=maxRooms)throw Error('SERVER_FULL');room=new PresenceRoom();rooms.set(room.id,room);}
     const player=room.join(id,packet.state,identity.guest);members.set(ws,{id,room});joined=true;clearTimeout(timeout);
     if(!audiences.has(room))audiences.set(room,new Set());audiences.get(room).add(ws);
     send(ws,{type:'welcome',id,players:[...room.players.values()].filter(p=>p.id!==id),sharedEvents:[...room.sharedEvents.values()]});broadcast(room,{type:'peer',player,joined:true},ws);return;
    }
    const member=members.get(ws);if(!member)throw Error('NOT_JOINED');const {room,id}=member;
    if(packet.type==='ping'){send(ws,{type:'pong'});return;}
    if(packet.type==='position'){
     const previous=room.players.get(id),player=room.update(id,packet.state);
     const delta=Object.fromEntries(Object.entries(player).filter(([key,value])=>key==='id'||JSON.stringify(previous[key])!==JSON.stringify(value)));
     broadcast(room,{type:'peer',player:delta,delta:true},ws);
    }
    else if(packet.type==='chat'){const message=room.chat(id,packet.text);broadcast(room,{type:'chat',playerId:id,message},ws);send(ws,{type:'chat',playerId:id,message,self:true});}
    else if(packet.type==='claimShared'){room.claim(id,packet.id);broadcast(room,{type:'shared',events:[...room.sharedEvents.values()]});}
    else throw Error('UNKNOWN_PACKET');
   }catch(e){send(ws,{type:'error',message:e.message});}finally{busy=false;}
  });
  const lease=setInterval(()=>{if(Date.now()-seen>30000)ws.close(1008,'Lease expired');},10000);
  ws.on('close',()=>{clearTimeout(timeout);clearInterval(lease);connections.set(ip,Math.max(0,(connections.get(ip)??1)-1));if(!connections.get(ip))connections.delete(ip);const m=members.get(ws);if(m){m.room.leave(m.id);members.delete(ws);audiences.get(m.room)?.delete(ws);broadcast(m.room,{type:'leave',id:m.id});if(!m.room.players.size){rooms.delete(m.room.id);audiences.delete(m.room);}}});
 });
 return {http,wss,rooms,close:async()=>{for(const ws of wss.clients)ws.terminate();await new Promise(resolve=>http.close(resolve));}};
}
export async function startPresenceHost(){
 const supabase=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
 const host=presenceServer({origins:(process.env.GAME_ALLOWED_ORIGINS??'').split(',').filter(Boolean),authenticate:async token=>{
  if(!token)return {id:randomUUID(),guest:true};
  if(!supabase||!key)throw Error('AUTH_NOT_CONFIGURED');
  const response=await fetch(`${supabase}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(3000)});
  if(!response.ok)throw Error('SIGN_IN');const user=await response.json();return {id:user.id,guest:user.is_anonymous===true};
 }});
 host.http.listen(Number(process.env.PORT??4330),process.env.HOST??'127.0.0.1');
 process.on('SIGTERM',()=>void host.close());process.on('SIGINT',()=>void host.close());return host;
}
