// Manual host integration checks. Isolated fake Auth/cloud, no production accounts.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {HostStore} from '../../server/ec2-store.mjs';
import WebSocket from 'ws';
const folder=await mkdtemp(join(tmpdir(),'egghunts-host-')),path=join(folder,'game.sqlite');
const seed=new HostStore(path),owner=seed.owner;seed.close();
const profiles=new Map(),users=new Map();let authCalls=0;
for(let i=0;i<6;i++){const token=`test.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600,i})).toString('base64url')}.signature`;users.set(token,randomUUID());}
const cloud=createServer(async(req,res)=>{
 let raw='';for await(const c of req)raw+=c;
 res.setHeader('Content-Type','application/json');
 if(req.url==='/auth/v1/user'){authCalls++;const user=users.get(req.headers.authorization?.slice(7));res.statusCode=user?200:401;res.end(JSON.stringify(user?{id:user,is_anonymous:true}:{}));return;}
 if(req.url.startsWith('/rest/v1/game_backend')){res.end(JSON.stringify([{mode:'ec2',owner}]));return;}
 if(req.url.startsWith('/rest/v1/game_profiles')){res.end('[]');return;}
 if(req.url.startsWith('/rest/v1/game_ec2_versions')){res.end('[]');return;}
 if(req.url==='/rest/v1/rpc/game_ec2_checkpoint'){const body=JSON.parse(raw);for(const p of body.p_profiles)profiles.set(p.user_id,p);res.end('null');return;}
 res.statusCode=404;res.end('{}');
});
cloud.listen(0,'127.0.0.1');await once(cloud,'listening');
let child,output='';
async function start(){
 child=spawn(process.execPath,['dist-server/host.mjs'],{env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${cloud.address().port}`,SUPABASE_SERVICE_ROLE_KEY:'fixture',GAME_ALLOWED_ORIGINS:'http://127.0.0.1',GAME_DATA_PATH:path,GAME_MAX_ROOMS:'1',PORT:'4346',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',d=>{output+=d;});child.stderr.on('data',d=>{output+=d;});
 for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,50));try{if((await fetch('http://127.0.0.1:4346/readyz')).ok)return;}catch{}}
 throw Error(`Host startup failed: ${output}`);
}
async function request(token,body){const response=await fetch('http://127.0.0.1:4346/game',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};}
const command=operation=>({operation,id:randomUUID(),input:{x:0,z:0},commands:[]});
const tokens=[...users.keys()];
try{
 await start();const a=await request(tokens[0],{...command('join'),commands:[{id:randomUUID(),kind:'name',value:'서버검사'}]});assert.equal(a.status,200);assert.equal(a.body.runtime.save.playerName,'서버검사');
 for(let i=1;i<5;i++){await new Promise(r=>setTimeout(r,150));const b=await request(tokens[i],command('join'));assert.equal(b.status,200);assert.equal(b.body.slot,i);assert.deepEqual(b.body.world.map(e=>e.id),a.body.world.map(e=>e.id));}
 const full=await request(tokens[5],command('join'));assert.equal(full.body.error,'SERVER_FULL');
 const ws=new WebSocket('ws://127.0.0.1:4346/game');await once(ws,'open');
 const packet={token:tokens[0],request:command('update'),stream:1};ws.send(JSON.stringify(packet));const [data]=await once(ws,'message');const update=JSON.parse(data);assert.equal(update.status,200);assert.equal(update.format,'sections-v1');assert.equal(update.body.count,5);ws.close();
 await new Promise(r=>setTimeout(r,200));const bad=await request('invalid',command('update'));assert.equal(bad.status,401);const before=authCalls;await request('invalid',command('update'));assert.equal(authCalls,before);
 await new Promise(r=>setTimeout(r,200));assert.equal((await request(tokens[4],{operation:'leave'})).status,200);
 await new Promise(r=>setTimeout(r,200));assert.equal((await request(tokens[0],command('update'))).body.count,4);
 await new Promise(r=>setTimeout(r,5100));assert.equal(profiles.get(users.get(tokens[0])).state.save.playerName,'서버검사');
 child.kill('SIGTERM');await once(child,'exit');await start();
 const restored=await request(tokens[0],command('update'));assert.equal(restored.status,200);assert.equal(restored.body.runtime.save.playerName,'서버검사');
 console.log('PASS: 5-seat matchmaking, shared eggs, capacity, stream, invalid auth cache, leave, checkpoint, restart preservation');
}finally{if(child?.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}cloud.closeAllConnections();await new Promise(r=>cloud.close(r));}
