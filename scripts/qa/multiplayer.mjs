import assert from 'node:assert/strict';
import {multiplayerServer} from '../multiplayer-server.mjs';
import {report} from './lib.mjs';
let now=1800000010000;
const server=multiplayerServer(()=>now);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
const request=async(path,data={},token)=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
try{
 const a=await(await request('/login')).json(),b=await(await request('/login')).json();assert.notEqual(a.id,b.id);
 assert.equal((await request('/state',{x:1,z:0,rotation:0,appearance:0})).status,401);
 assert.equal((await request('/state',{x:Infinity,z:0,rotation:0,appearance:0},a.token)).status,400);
 const first=await(await request('/state',{x:1,z:0,rotation:1,appearance:2},a.token)).json();assert.equal(first.players[0].id,b.id);
 const second=await(await request('/state',{x:-1,z:0,rotation:0,appearance:1},b.token)).json();assert.equal(second.players[0].id,a.id);assert.equal(second.players[0].appearance,2);
 assert.equal(second.players[0].x,1);assert.equal(second.serverTime,now);
 assert.equal((await(await request('/attack',{},a.token)).json()).hits,0,'Behind attacker is safe');
 now+=1000;
 await request('/state',{x:1,z:0,rotation:-Math.PI/2,appearance:2,carried:null},a.token);
 await request('/state',{x:-1,z:0,rotation:0,appearance:1,carried:0},b.token);
 assert.equal((await(await request('/attack',{},a.token)).json()).hits,1);
 assert.equal((await request('/attack',{},a.token)).status,429,'Cooldown enforced by server');
 now+=100;const hit=await(await request('/state',{x:-1,z:0,rotation:0,appearance:1,carried:0},b.token)).json();
 assert.equal(hit.hit.x,-3);assert.equal(hit.drops.length,1);assert.equal(hit.drops[0].type,0);
 await request('/state',{x:-.5,z:0,rotation:0,appearance:2,carried:null},a.token);
 assert.equal((await request('/claim',{id:hit.drops[0].id},a.token)).status,200);
 assert.equal((await request('/claim',{id:hit.drops[0].id},b.token)).status,409,'One claimant per dropped egg');
 await request('/logout',{},a.token);assert.equal((await request('/state',{x:0,z:0,rotation:0,appearance:0},a.token)).status,401);
 await report('multiplayer',{passed:11,coverage:['unique guest sessions','missing token rejected','invalid position rejected','two clients share positions and appearance','server time/night','logout invalidates session','bat direction/range','server attack cooldown','knockback/down state','carried egg drop','exclusive dropped egg claim']});console.log('PASS multiplayer: 11 server integration checks');
}finally{await new Promise(resolve=>server.close(resolve));}
