// Manual real EC2 transport measurement, NOT a browser/rendering benchmark.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {mkdir,writeFile} from 'node:fs/promises';
import {loadEnvFile} from 'node:process';
import WebSocket from 'ws';
loadEnvFile('dist-server/.env.production');
const base='https://egghunts.54-180-115-11.sslip.io/game';
const auth=process.env.SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
const apikey='sb_publishable_2KTon_WzPAci5G4dLyZ5Ww_bPgwmiig';
const sessions=[],sockets=[],samples=[];
const request=operation=>({operation,id:randomUUID(),input:{x:0,z:0},commands:[]});
const post=async(session,body)=>{
 const res=await fetch(base,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal(res.status,200);return res.json();
};
try{
 for(let i=0;i<2;i++){
  const res=await fetch(`${auth}/auth/v1/signup`,{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:'{}'});assert.equal(res.status,200);
  const session=await res.json();sessions.push(session);
  await post(session,{...request('join'),commands:[{id:randomUUID(),kind:'name',value:i?'진단둘':'진단하나'}]});
  const ws=new WebSocket(base.replace('https:','wss:'));sockets.push(ws);await once(ws,'open');
 }
 for(let i=0;i<180;i++){
  await Promise.all(sockets.map(async(ws,index)=>{
   const pending=request('update');pending.input={x:0,z:i<60?-.3:i<120?.3:0};
   const started=performance.now();ws.send(JSON.stringify({token:sessions[index].access_token,request:pending,stream:1}));
   const [data]=await Promise.race([once(ws,'message'),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Stream timeout')),5000);timer.unref();})]);
   const message=JSON.parse(data);assert.equal(message.status,200);assert.equal(message.id,pending.id);
   samples.push({peer:index,rtt:performance.now()-started,server:Number(message.timing?.match(/total;dur=([\d.]+)/)?.[1]??0)});
  }));
  await new Promise(r=>setTimeout(r,200));
 }
 const summary=[0,1].map(peer=>{const subset=samples.filter(x=>x.peer===peer),rtt=subset.map(x=>x.rtt).sort((a,b)=>a-b),server=subset.map(x=>x.server).sort((a,b)=>a-b);return {peer,samples:rtt.length,median:rtt[Math.floor(rtt.length*.5)],p95:rtt[Math.floor(rtt.length*.95)],max:rtt.at(-1),serverP95:server[Math.floor(server.length*.95)]};});
 await mkdir('artifacts/performance',{recursive:true});await writeFile('artifacts/performance/ec2-live.json',JSON.stringify({at:new Date().toISOString(),summary,samples,limits:'2 Node clients, approximately 40 seconds, no mobile renderer or 5-player load measurement'},null,2));
 console.log(JSON.stringify(summary));
}finally{
 for(const ws of sockets)ws.close();
 for(const s of sessions){try{await post(s,{operation:'leave'});}catch{} }
 // Let cloud checkpoint drain before deleting only the disposable diagnostic accounts.
 await new Promise(r=>setTimeout(r,6500));
 for(const s of sessions){const res=await fetch(`${auth}/auth/v1/admin/users/${s.user.id}`,{method:'DELETE',headers:{apikey:service,Authorization:`Bearer ${service}`}});if(!res.ok)console.error('Diagnostic account cleanup requires retry');}
}
