import {runRoom} from '../_shared/room-engine.js';
import postgres from 'npm:postgres@3.4.7';

const url=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sql=postgres(Deno.env.get('SUPABASE_DB_URL')!,{prepare:false,max:1,idle_timeout:20,connect_timeout:5});
const verified=new Map<string,{user:string;until:number;guest:boolean}>();
const allowed=(Deno.env.get('GAME_ALLOWED_ORIGINS')??'https://juyounginpark.github.io,http://localhost:4317,http://127.0.0.1:4317,http://localhost:4320,http://127.0.0.1:4320').split(',');
async function rpc(name:string,body:unknown){
 const response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok)throw Error('DATABASE_ERROR');return response.json();
}
async function handle(req:Request,stream=false){
 const timing:string[]=[];
 const mark=(name:string,start:number)=>timing.push(`${name};dur=${(performance.now()-start).toFixed(1)}`);
 const origin=req.headers.get('origin')??'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Max-Age':'600','Access-Control-Expose-Headers':'Server-Timing,x-sb-edge-region'};
 const send=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Server-Timing':timing.join(',')}});
 if(origin&&!allowed.includes(origin))return send(403,{error:'ORIGIN_NOT_ALLOWED'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return send(405,{error:'POST_REQUIRED'});
 try{
  const authorization=req.headers.get('authorization')??'';
  if(!authorization.startsWith('Bearer '))return send(401,{error:'SIGN_IN'});
  // Never trust an unverified JWT payload or a user ID from the request body.
  const authStart=performance.now();let identity=verified.get(authorization);
  if(!identity||identity.until<=Date.now()){
   const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:service,Authorization:authorization}});
   if(!auth.ok)return send(401,{error:'SIGN_IN'});
   const account=await auth.json(),user=account.id;
   const payload=JSON.parse(atob(authorization.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
   identity={user,guest:account.is_anonymous===true,until:Math.min(Date.now()+10000,Number(payload.exp)*1000)};
   if(!Number.isFinite(identity.until)||identity.until<=Date.now())return send(401,{error:'SIGN_IN'});
   verified.set(authorization,identity);if(verified.size>256)verified.delete(verified.keys().next().value!);
  }
  mark('auth',authStart);const user=identity.user;
  const raw=await req.text();if(raw.length>8192)return send(413,{error:'REQUEST_TOO_LARGE'});
  const request=JSON.parse(raw);
  if(request.operation==='leave'){await rpc('game_leave',{p_user:user});return send(200,{});}
  if(request.operation==='join'){
   await rpc('game_join',{p_user:user});
  }else if(request.operation!=='update')return send(400,{error:'INVALID_OPERATION'});
  // HTTP remains the compatibility/reconnect path. A new DB connection on
  // every short-lived HTTP worker measured slower than the existing RPC path.
  if(!stream){
   for(let attempt=0;attempt<5;attempt++){
    const readStart=performance.now(),record=await rpc('game_read',{p_user:user});mark('read',readStart);
    if(!record)throw Error('ROOM_EXPIRED');
    const simulationStart=performance.now(),result=runRoom(record.state,record.members,record.profiles,user,request,Date.now(),{guest:identity.guest});mark('simulation',simulationStart);
    const commitStart=performance.now(),committed=await rpc('game_commit',{p_room:record.id,p_revision:record.revision,p_state:result.room,p_user:user});mark('commit',commitStart);
    if(committed)return send(200,result.response);
   }
   throw Error('RETRY');
  }
  const transactionStart=performance.now();
  const response=await sql.begin(async transaction=>{
   await transaction`set local statement_timeout = '5s'`;
   const readStart=performance.now();
   const [{record}]=await transaction`select public.game_read(${user}::uuid) as record`;
   mark('read',readStart);
   if(!record)throw Error('ROOM_EXPIRED');
   const simulationStart=performance.now();const result=runRoom(record.state,record.members,record.profiles,user,request,Date.now(),{guest:identity.guest});
   mark('simulation',simulationStart);const commitStart=performance.now();
   const [{committed}]=await transaction`select public.game_commit(${record.id}::uuid,${record.revision}::bigint,${transaction.json(result.room)},${user}::uuid) as committed`;
   mark('commit',commitStart);
   if(!committed)throw Error('RETRY');
   return result.response;
  });
  mark('transaction',transactionStart);
  return send(200,response);
 }catch(error){
  const message=error instanceof Error?error.message:'INVALID_REQUEST';
  const known=['ROOM_EXPIRED','RETRY','RATE_LIMIT','INVALID_REQUEST','INVALID_INPUT','INVALID_COMMAND'];
  if(!known.includes(message))console.error('Game transaction failed',error instanceof Error?error.name:'UNKNOWN');
  return send(known.includes(message)?409:503,{error:known.includes(message)?message:'SERVER_NOT_READY'});
 }
}

Deno.serve(req=>{
 if(req.headers.get('upgrade')?.toLowerCase()!=='websocket')return handle(req);
 const origin=req.headers.get('origin')??'';
 if(origin&&!allowed.includes(origin))return new Response('Forbidden',{status:403});
 const {socket,response}=Deno.upgradeWebSocket(req);
 let busy=false;
 // Reconnect before the hosted worker lifetime expires. Requests retain IDs.
 const lifetime=setTimeout(()=>socket.close(1000,'Reconnect'),110000);
 const authenticationDeadline=setTimeout(()=>socket.close(1008,'Authentication required'),5000);
 socket.onclose=()=>{clearTimeout(lifetime);clearTimeout(authenticationDeadline);};
 socket.onmessage=async event=>{
  if(busy){socket.close(1008,'One request at a time');return;}
  if(typeof event.data!=='string'||event.data.length>12000){socket.close(1009,'Too large');return;}
  busy=true;
  try{
   const packet=JSON.parse(event.data);
   if(typeof packet.token!=='string'||!packet.request||packet.request.operation!=='update'){socket.close(1008,'Invalid message');return;}
   const result=await handle(new Request(req.url,{method:'POST',headers:{origin,authorization:`Bearer ${packet.token}`},body:JSON.stringify(packet.request)}),true);
   const body=await result.json();
   clearTimeout(authenticationDeadline);
   if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({id:packet.request.id,status:result.status,body,timing:result.headers.get('Server-Timing')}));
   if(result.status===401)socket.close(1008,'Authentication required');
  }catch{if(socket.readyState===WebSocket.OPEN)socket.close(1011,'Request failed');}
  finally{busy=false;}
 };
 return response;
});
