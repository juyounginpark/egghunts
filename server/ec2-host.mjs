import {createServer} from 'node:http';
import {randomUUID,createHash} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {HostStore} from './ec2-store.mjs';
import {runRoom,snapshotSections} from './room-engine.ts';

const required=name=>{const value=process.env[name];if(!value)throw Error(`Missing ${name}`);return value;};
const supabase=required('SUPABASE_URL'),service=required('SUPABASE_SERVICE_ROLE_KEY');
const origins=new Set(required('GAME_ALLOWED_ORIGINS').split(',').map(s=>s.trim()));
const store=new HostStore(process.env.GAME_DATA_PATH??'/var/lib/egghunts/game.sqlite');
const rooms=new Map(store.rooms().map(r=>[r.id,r])),membership=new Map();
for(const r of rooms.values())for(const m of r.members)membership.set(m.user_id,r.id);
const identities=new Map(),verifying=new Map(),loading=new Map();
const connections=new Map();
let active=false,cloudSeen=0,stopping=false,cloudBusy=false;
const maxRooms=Number(process.env.GAME_MAX_ROOMS??4);
let transferMonth=store.metadata('transferMonth')??'',transferBytes=Number(store.metadata('transferBytes')??0);
const transferLimit=Number(process.env.GAME_MONTHLY_PAYLOAD_MB??10240)*1024*1024;
function transferAvailable(bytes=0){
 const month=new Date().toISOString().slice(0,7);
 if(month!==transferMonth){transferMonth=month;transferBytes=0;}
 return transferBytes+bytes<=transferLimit;
}
const ready=()=>active&&!stopping&&Date.now()-cloudSeen<60000&&transferAvailable();
function socketSend(socket,packet){
 const text=JSON.stringify(packet),bytes=Buffer.byteLength(text);
 if(socket.bufferedAmount>262144||!transferAvailable(bytes)){socket.close(1008,'Capacity limit');return;}
 transferBytes+=bytes;socket.send(text);
}
const known=new Set(['SIGN_IN','ROOM_EXPIRED','SERVER_NOT_READY','SERVER_FULL','RATE_LIMIT','INVALID_REQUEST','INVALID_INPUT','INVALID_COMMAND','INVALID_OPERATION']);
const buckets=new Map(),negative=new Map();
function allow(key,rate,burst){
 const now=Date.now(),old=buckets.get(key)??{tokens:burst,at:now};
 old.tokens=Math.min(burst,old.tokens+(now-old.at)*rate/1000);old.at=now;
 const ok=old.tokens>=1;if(ok)old.tokens--;buckets.set(key,old);
 if(buckets.size>4096)buckets.delete(buckets.keys().next().value);
 return ok;
}
// Only loopback nginx can supply X-Real-IP; the game port is never public.
const remoteIP=req=>req.headers['x-real-ip']??req.socket.remoteAddress??'unknown';

async function cloud(path,body){
 const result=await fetch(`${supabase}${path}`,{method:body===undefined?'GET':'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(5000)});
 if(!result.ok)throw Error('CLOUD_UNAVAILABLE');
 const text=await result.text();return text?JSON.parse(text):null;
}
async function checkpoint(){
 if(cloudBusy)return;cloudBusy=true;
 try{
  store.setMetadata('transferMonth',transferMonth);store.setMetadata('transferBytes',transferBytes);
  const [backend]=await cloud('/rest/v1/game_backend?select=mode,owner&id=eq.true');
  active=backend?.mode==='ec2'&&backend.owner===store.owner;
  if(!active)return;
  const rows=store.pending();
  if(rows.length){await cloud('/rest/v1/rpc/game_ec2_checkpoint',{p_owner:store.owner,p_profiles:rows});store.acknowledge(rows);}
  cloudSeen=Date.now();
 }catch{console.error('Cloud checkpoint unavailable');}finally{cloudBusy=false;}
}
async function verify(token){
 if(typeof token!=='string'||token.length>8192)throw Error('SIGN_IN');
 const saved=identities.get(token);
 if(saved&&saved.until>Date.now()){
  if(saved.until-Date.now()<3000)void refreshIdentity(token).catch(()=>{});
  return saved;
 }
 return refreshIdentity(token);
}
function refreshIdentity(token){
 if(verifying.has(token))return verifying.get(token);
 const key=createHash('sha256').update(token).digest('hex');
 if((negative.get(key)??0)>Date.now())return Promise.reject(Error('SIGN_IN'));
 if(verifying.size>=4||!allow('auth',4,20))return Promise.reject(Error('RATE_LIMIT'));
 const task=(async()=>{
  const response=await fetch(`${supabase}/auth/v1/user`,{headers:{apikey:service,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(3000)});
  if(!response.ok){identities.delete(token);negative.set(key,Date.now()+10000);if(negative.size>512)negative.delete(negative.keys().next().value);throw Error('SIGN_IN');}
  const account=await response.json();
  const payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
  const until=Math.min(Date.now()+10000,Number(payload.exp)*1000);
  if(!account.id||!Number.isFinite(until)||until<=Date.now())throw Error('SIGN_IN');
  const identity={user:account.id,guest:account.is_anonymous===true,until};
  identities.set(token,identity);if(identities.size>512)identities.delete(identities.keys().next().value);
  return identity;
 })().finally(()=>verifying.delete(token));
 verifying.set(token,task);return task;
}
async function loadProfile(user){
 if(store.profile(user))return;
 if(loading.has(user))return loading.get(user);
 const task=(async()=>{
  const rows=await cloud(`/rest/v1/game_profiles?user_id=eq.${encodeURIComponent(user)}&select=state`);
  const versions=await cloud(`/rest/v1/game_ec2_versions?user_id=eq.${encodeURIComponent(user)}&select=owner,revision`);
  const revision=versions[0]?.owner===store.owner?Number(versions[0].revision):0;
  store.seed(user,rows[0]?.state??null,revision);
 })().finally(()=>loading.delete(user));loading.set(user,task);return task;
}
function detach(user){
 const room=rooms.get(membership.get(user));if(!room)return;
 const next=structuredClone(room),player=next.state?.players[user];
 if(player){
  // Save the last personal state before removing it from the shared world.
  store.commit(next);
  const egg=player.runtime.fields.carried;
  if(egg&&!next.state.world.some(e=>e.id===egg.id))next.state.world.push({...egg,x:egg.homeX??egg.x,z:egg.homeZ??egg.z});
  delete next.state.players[user];
 }
 next.members=next.members.filter(m=>m.user_id!==user);store.commit(next);
 membership.delete(user);if(next.members.length)rooms.set(next.id,next);else rooms.delete(next.id);
}
function prune(){
 const now=Date.now();
 for(const room of [...rooms.values()])for(const m of room.members)if(now-Date.parse(m.last_seen)>15000)detach(m.user_id);
}
async function operate(identity,request){
 if(!ready())throw Error('SERVER_NOT_READY');
 const user=identity.user;
 if(!allow(`user:${user}`,20,30))throw Error('RATE_LIMIT');
 if(!request||typeof request!=='object')throw Error('INVALID_REQUEST');
 if(request.operation==='leave'){detach(user);return {};}
 if(request.operation!=='join'&&request.operation!=='update')throw Error('INVALID_OPERATION');
 if(request.operation==='join'){
  if(!allow('join',1,10)||!allow(`join:${user}`,0.2,3))throw Error('RATE_LIMIT');
  await loadProfile(user);
 }
 // No await from here through local commit: one process owns the room.
 if(!ready())throw Error('SERVER_NOT_READY');
 let room=rooms.get(membership.get(user));
 if(!room){
  if(request.operation!=='join')throw Error('ROOM_EXPIRED');
  prune();
  room=[...rooms.values()].filter(r=>r.members.length<5).sort((a,b)=>b.members.length-a.members.length)[0];
  if(!room){if(rooms.size>=maxRooms)throw Error('SERVER_FULL');room={id:randomUUID(),members:[],state:null};}
 }
 const next=structuredClone(room),now=Date.now();
 let member=next.members.find(m=>m.user_id===user);
 if(!member){const slot=[0,1,2,3,4].find(s=>!next.members.some(m=>m.slot===s));member={user_id:user,slot,last_seen:new Date(now).toISOString()};next.members.push(member);}
 member.last_seen=new Date(now).toISOString();
 const result=runRoom(next.state,next.members,[{user_id:user,state:store.profile(user)}],user,request,now,{guest:identity.guest});
 next.state=result.room;
 store.commit(next);rooms.set(next.id,next);membership.set(user,next.id);
 return result.response;
}
function cors(origin){return {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Expose-Headers':'Server-Timing'};}
function failure(e){const message=known.has(e.message)?e.message:'SERVER_NOT_READY';return {status:message==='SIGN_IN'?401:message==='SERVER_NOT_READY'?503:409,body:{error:message}};}
const server=createServer(async(req,res)=>{
 const started=performance.now(),origin=req.headers.origin??'';
 const send=(status,body)=>{let text=JSON.stringify(body);const bytes=Buffer.byteLength(text);if(status===200&&req.method==='POST'){if(!transferAvailable(bytes)){status=503;text=JSON.stringify({error:'SERVER_NOT_READY'});}else transferBytes+=bytes;}res.writeHead(status,{...cors(origin),'Server-Timing':`total;dur=${(performance.now()-started).toFixed(1)}`});res.end(text);};
 if(origin&&!origins.has(origin))return send(403,{error:'ORIGIN_NOT_ALLOWED'});
 if(req.method==='GET'&&(req.url==='/healthz'||req.url==='/readyz'))return send(req.url==='/readyz'&&!ready()?503:200,{service:'egghunts',ready:ready()});
 if(req.url!=='/game')return send(404,{error:'NOT_FOUND'});
 if(req.method==='OPTIONS')return send(204,null);
 if(req.method!=='POST')return send(405,{error:'POST_REQUIRED'});
 if(!ready())return send(503,{error:'SERVER_NOT_READY'});
 if(!allow('http',40,80)||!allow(`http:${remoteIP(req)}`,10,20))return send(429,{error:'RATE_LIMIT'});
 try{
  let raw='';for await(const part of req){raw+=part;if(Buffer.byteLength(raw)>12000)return send(413,{error:'TOO_LARGE'});}
  const identity=await verify((req.headers.authorization??'').replace(/^Bearer /,''));
  send(200,await operate(identity,JSON.parse(raw)));
 }catch(e){const {status,body}=failure(e);send(status,body);}
});
server.requestTimeout=10000;server.headersTimeout=10000;
server.maxConnections=128;
const wss=new WebSocketServer({noServer:true,maxPayload:12000,perMessageDeflate:false});
server.on('upgrade',(req,socket,head)=>{
 if(!ready()||req.url!=='/game'||(req.headers.origin&&!origins.has(req.headers.origin))||wss.clients.size>=maxRooms*5*2||!allow('upgrade',2,20)||!allow(`upgrade:${remoteIP(req)}`,0.5,6)){socket.destroy();return;}
 wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,remoteIP(req)));
});
wss.on('connection',(socket,ip)=>{
 let busy=false,user=null,baselineToken='',alive=true;
 const baseline=new Map(),deadline=setTimeout(()=>socket.close(1008,'Authentication required'),5000);
 socket.on('error',()=>{});socket.on('pong',()=>{alive=true;});
 const heartbeat=setInterval(()=>{if(!alive)return socket.terminate();alive=false;socket.ping();},10000);
 socket.on('close',()=>{clearTimeout(deadline);clearInterval(heartbeat);if(user){const group=connections.get(user);group?.delete(socket);if(!group?.size){connections.delete(user);/* Grace allows transport reconnect; HTTP leave removes immediately. */}}});
 socket.on('message',async(data,binary)=>{
  if(binary||busy||!allow('messages',200,300)||!allow(`messages:${ip}`,100,150)){socket.close(1008,'Rate limited');return;}busy=true;
  let id;
  const started=performance.now();
  try{
   const packet=JSON.parse(data.toString());id=packet.request?.id;
   const identity=await verify(packet.token);
   if(user&&user!==identity.user){socket.close(1008,'Identity changed');return;}
   if(!user){user=identity.user;const group=connections.get(user)??new Set();group.add(socket);connections.set(user,group);}
   clearTimeout(deadline);
   if(packet.hello===true){socketSend(socket,{ready:true});return;}
   if(packet.request?.operation!=='update')throw Error('INVALID_OPERATION');
   id=packet.request.id;const body=await operate(identity,packet.request);
   if(packet.token!==baselineToken){baseline.clear();baselineToken=packet.token;}
   if(socket.readyState===WebSocket.OPEN)socketSend(socket,{id,status:200,body:packet.stream===1?snapshotSections(body,baseline):body,format:packet.stream===1?'sections-v1':undefined,timing:`total;dur=${(performance.now()-started).toFixed(1)}`});
  }catch(e){const {status,body}=failure(e);if(socket.readyState===WebSocket.OPEN){socketSend(socket,{id,status,body});if(status===401)socket.close(1008,'Authentication required');}}
  finally{busy=false;}
 });
});
const cloudTimer=setInterval(()=>void checkpoint(),5000),pruneTimer=setInterval(()=>{try{prune();}catch{console.error('Local prune failed');}},1000);
void checkpoint();
server.listen(Number(process.env.PORT??4330),process.env.HOST??'127.0.0.1',()=>console.log('Game host listening; owner',store.owner));
async function shutdown(){
 if(stopping)return;stopping=true;clearInterval(cloudTimer);clearInterval(pruneTimer);
 server.close();for(const ws of wss.clients)ws.close(1001,'Server restarting');
 const deadline=setTimeout(()=>process.exit(1),15000);deadline.unref();
 while(cloudBusy)await new Promise(r=>setTimeout(r,50));
 await checkpoint();store.close();process.exit(0);
}
process.on('SIGTERM',()=>void shutdown());process.on('SIGINT',()=>void shutdown());
