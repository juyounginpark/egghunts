import {runRoom} from '../_shared/room-engine.js';

const url=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const verified=new Map<string,{user:string;until:number}>();
const allowed=(Deno.env.get('GAME_ALLOWED_ORIGINS')??'https://juyounginpark.github.io,http://localhost:4317,http://127.0.0.1:4317,http://localhost:4320,http://127.0.0.1:4320').split(',');
async function db(path:string,method='GET',body?:unknown){
 const response=await fetch(`${url}/rest/v1/${path}`,{method,headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!response.ok)throw Error('DATABASE_ERROR');return response.status===204?null:response.json();
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')??'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const send=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!allowed.includes(origin))return send(403,{error:'ORIGIN_NOT_ALLOWED'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return send(405,{error:'POST_REQUIRED'});
 try{
  const authorization=req.headers.get('authorization')??'';
  if(!authorization.startsWith('Bearer '))return send(401,{error:'SIGN_IN'});
  // Never trust an unverified JWT payload or a user ID from the request body.
  let identity=verified.get(authorization);
  if(!identity||identity.until<=Date.now()){
   const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:service,Authorization:authorization}});
   if(!auth.ok)return send(401,{error:'SIGN_IN'});
   const user=(await auth.json()).id;
   const payload=JSON.parse(atob(authorization.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
   identity={user,until:Math.min(Date.now()+10000,Number(payload.exp)*1000)};
   if(!Number.isFinite(identity.until)||identity.until<=Date.now())return send(401,{error:'SIGN_IN'});
   verified.set(authorization,identity);if(verified.size>256)verified.delete(verified.keys().next().value!);
  }
  const user=identity.user;
  const raw=await req.text();if(raw.length>8192)return send(413,{error:'REQUEST_TOO_LARGE'});
  const request=JSON.parse(raw);
  if(request.operation==='leave'){await db('rpc/game_leave','POST',{p_user:user});return send(200,{});}
  if(request.operation==='join'){
   await db('rpc/game_join','POST',{p_user:user});
  }else if(request.operation!=='update')return send(400,{error:'INVALID_OPERATION'});
  for(let attempt=0;attempt<5;attempt++){
   const record=await db('rpc/game_read','POST',{p_user:user});
   if(!record)return send(409,{error:'ROOM_EXPIRED'});
   const result=runRoom(record.state,record.members,record.profiles,user,request,Date.now());
   const committed=await db('rpc/game_commit','POST',{p_room:record.id,p_revision:record.revision,p_state:result.room,p_user:user});
   if(committed)return send(200,result.response);
  }
  return send(409,{error:'RETRY'});
 }catch(error){
  const message=error instanceof Error?error.message:'INVALID_REQUEST';
  console.error(message);
  return send(message==='DATABASE_ERROR'?503:400,{error:message==='DATABASE_ERROR'?'SERVER_NOT_READY':message});
 }
});
