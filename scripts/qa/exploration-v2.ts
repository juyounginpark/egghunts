import assert from 'node:assert/strict';
import {GameState,freshSave} from '../../src/game';
import {BALANCE} from '../../src/data';
import {STAGE_REQUIRED_SPEED,stagePatterns,environmentPlacement} from '../../src/stage-data';
import {mainPath,routePoint,routeProgress,terrainAt,shortcut} from '../../src/exploration-route';
import {explorationObjects,speedPadArt} from '../../src/exploration-object-art';
import {EXPLORATION_OBJECTS,MOB_TYPES} from '../../src/exploration-catalog';
import {speedPads,freshPads,updatePads} from '../../src/speed-pads';
import {HazardManager} from '../../src/hazards';
import {environmentState} from '../../src/environment-state';
import {mobSpawn,hitMobs,tickMobs,mobProjectiles} from '../../src/mobs';
import {runRoom} from '../../server/room-engine';
import {exportRuntime} from '../../src/online-state';
const now=1800000060000,make=()=>new GameState(freshSave(now),()=>now,()=>.5);
const stat=(g:GameState,n:number)=>{g.save.trainingSpeed=(n<=1000?n:1000*10**(n/1000-1))-BALANCE.speed;};
const walk=(g:GameState,x:number,z:number)=>{
 for(let i=0;i<10000;i++){
  const dx=x-g.x,dz=z-g.z,l=Math.hypot(dx,dz);if(l<.025)return;
  const old={x:g.x,z:g.z};g.push(dx/l*Math.min(.08,l),dz/l*Math.min(.08,l));
  assert.ok(Math.hypot(g.x-old.x,g.z-old.z)>.001,`blocked ${g.stage.id}: ${g.x},${g.z} -> ${x},${z}`);
 }throw Error('route unfinished');
};
assert.equal(EXPLORATION_OBJECTS.length,400);assert.equal(MOB_TYPES.length,40);
let pads=0;const g=make();assert.equal(g.world.length,101);assert.equal(g.bosses.length,21);
for(let stage=1;stage<=20;stage++){
 const art=explorationObjects(stage);assert.equal(art.length,20);assert.ok(art.every(o=>o.blocks.length+o.motions.length>0));
 assert.equal(EXPLORATION_OBJECTS.slice((stage-1)*20,stage*20).filter(r=>r[3]==='troll').length,1);
 pads+=speedPads(stage).length;assert.ok(speedPadArt(stage).blocks.length);
 const offset=(stage-1)*48,path=mainPath(stage).slice(0,-1);
 for(const boss of g.bosses.filter(b=>b.stageId===stage)){const p=routeProgress(stage,boss.homeX!,boss.homeZ!+offset).progress;assert.ok(p>=.6&&p<=.85,`boss ${stage} ${p}`);}
 const eggs=g.world.filter(e=>e.stageId===stage);assert.equal(eggs.length,stage===20?6:5);
 for(const egg of eggs){const p=routeProgress(stage,egg.x,egg.z+offset).progress;assert.ok(p>=.85&&p<=1,`egg ${stage} ${p}`);}
 g.carried=null;g.x=path[0].x;g.z=path[0].z-offset;
 for(const p of path.slice(1))walk(g,p.x,p.z-offset);
 const egg=eggs[2];walk(g,egg.x,egg.z);stat(g,STAGE_REQUIRED_SPEED[stage-1]-.01);g.pickup(egg);assert.equal(g.carried,null);assert.ok(g.hp>0);
 stat(g,STAGE_REQUIRED_SPEED[stage-1]+.001);g.pickup(egg);assert.equal(g.carried?.id,egg.id);stat(g,1);assert.ok(g.carried);
 for(const p of [...path].reverse())walk(g,p.x,p.z-offset);g.interact();
 for(const p of speedPads(stage))assert.ok(terrainAt(stage,p.x,p.z).walk,`pad floor ${p.id}`);
 console.log(`stage ${stage}: 20 objects, egg/boss positions, carried round trip, pads`);
}
assert.equal(pads,48);
for(const stage of [2,3,4,5,6,8,10,11,12,14,15,17,18,19,20]){
 const counts:number[]=[];
 for(const fps of [30,60,120]){
  const hm=new HazardManager(),hits=new Map<string,number>(),d=stagePatterns(stage)[0],base=environmentPlacement(stage,0);
  for(let i=0;i<fps*30;i++){
   const clock=now+i*1000/fps,a=environmentState(d,0,0,clock);
   // Stationary contact for floors; follow the true hitbox for moving attacks.
   const p={...a.target,x:a.target.x+(d.shape==='wall'?2.5:0),vx:0,vz:0,facing:{x:0,z:1},carrying:true,metal:false,moving:false};
   hm.tick(1/fps,stage,p,h=>{const k=h.definition.id+':'+h.serial;hits.set(k,(hits.get(k)??0)+1);assert.equal(h.phase,'Active');},()=>{},()=>{},false,clock);
  }
  if(!d.tickInterval)assert.ok([...hits.values()].every(n=>n===1),`duplicate attack ${stage}`);
  counts.push([...hits.values()].reduce((a,b)=>a+b,0));
 }
 assert.ok(Math.max(...counts)-Math.min(...counts)<=1,`fps-dependent ticks ${stage}: ${counts}`);
}
const high=make(),low=make();high.z=low.z=-20;high.save.upgrades.health=20;
const attack={serial:1,origin:{x:0,z:-20},definition:{...stagePatterns(4)[0],damage:3}} as any;
high.hp=high.maxHp;low.hp=low.maxHp;const before=[high.hp,low.hp];high.applyHazard(attack);low.applyHazard(attack);assert.equal(before[0]-high.hp,before[1]-low.hp);
const pad=speedPads(1)[0],s=freshPads();updatePads(s,1,pad.x,pad.z,now,.2);assert.equal(s.effects.length,1);const until=s.effects[0].until;
for(let t=1;t<600;t++)updatePads(s,1,pad.x,pad.z,now+t*10,.01);assert.equal(s.effects.length,0);
updatePads(s,1,pad.x+3,pad.z,now+6100,.1);updatePads(s,1,pad.x,pad.z,now+6200,.2);assert.ok(s.effects[0].until>until);
updatePads(s,2,0,-10,now+6300,.1);assert.equal(s.effects.length,0);assert.equal(s.blend,1);
const user=make(),m=mobSpawn(0,0,1,now);user.x=m.x;user.z=m.z+1;user.facing={x:0,z:-1};user.mobs=[m];
hitMobs(user,'same-swing');assert.equal(m.hp,0);assert.equal(m.phase,'dead');hitMobs(user,'same-swing');assert.equal(m.hp,0);
const interrupted=mobSpawn(1,1,1,now);user.mobs=[interrupted];user.x=interrupted.x;user.z=interrupted.z+1;interrupted.phase='warning';interrupted.target='p';
hitMobs(user,'interrupt');assert.equal(interrupted.phase,'hit');assert.equal(interrupted.target,null);
const hp=user.hp;tickMobs(user.mobs,new Map([['p',user]]),now+100,.1);assert.equal(user.hp,hp);
const members=['a','b'].map((user_id,slot)=>({user_id,slot,last_seen:new Date(now).toISOString()}));
let room=runRoom(null,members,[],'a',{id:'join'},now).room;
const shared=mobSpawn(0,0,1,now);room.mobs=[shared];
for(const id of ['a','b']){const p=make();p.x=shared.x;p.z=shared.z+1;p.facing={x:0,z:-1};room.players[id].runtime=exportRuntime(p);}
room=runRoom(room,members,[],'a',{id:'hit-a',commands:[{id:'swing-a',kind:'attack'}]},now+100).room;
room=runRoom(room,members,[],'b',{id:'hit-b',commands:[{id:'swing-b',kind:'attack'}]},now+200).room;
assert.deepEqual(room.mobs,[]);
assert.deepEqual(room.players.a.runtime.fields.mobs,[]);
assert.deepEqual(room.players.b.runtime.fields.mobs,[]);
// Every attack type deals damage only during its active period, once per target.
for(let type=0;type<MOB_TYPES.length;type++){
 const d=MOB_TYPES[type],p=make(),enemy=mobSpawn(type,0,1,now),offset=(d.stage-1)*48;
 const point=routePoint(d.stage,.78);enemy.x=enemy.homeX=point.x;enemy.z=enemy.homeZ=point.z-offset;
 p.x=enemy.x;p.z=enemy.z+.8;p.immunity=0;
 enemy.target='p';enemy.fromX=enemy.x;enemy.fromZ=enemy.z;enemy.aimX=p.x;enemy.aimZ=p.z;enemy.phase='warning';enemy.at=now;
 const mobs=[enemy],players=new Map([['p',p]]),before=p.hp;
 tickMobs(mobs,players,now+d.warning*500,.01);assert.equal(p.hp,before,`warning damage ${d.id}`);
 enemy.phase='active';enemy.at=now;enemy.hit=[];
 tickMobs(mobs,players,now+Math.min(333,d.active*500),.033);assert.ok(p.hp<before,`active did not hit ${d.id}`);
 const after=p.hp;p.immunity=0;tickMobs(mobs,players,now+350,.017);assert.equal(p.hp,after,`repeat ${d.id}`);
 enemy.hp=0;enemy.phase='dead';enemy.at=now+350;enemy.respawnAt=now+32350;p.immunity=0;
 tickMobs(mobs,players,now+500,.15);assert.equal(p.hp,after);assert.deepEqual(mobProjectiles(enemy,now+500),[]);
 p.x=enemy.homeX+10;tickMobs(mobs,players,now+33000,.03);assert.equal(enemy.hp,enemy.maxHp);assert.equal(enemy.phase,'idle');
}
// Lava's shared tick deadline survives quick exits, tile boundaries and snapshots.
const lava=stagePatterns(4)[0],floor=environmentPlacement(4,0),hm=new HazardManager();let lavaHits=0;
const touch=(x:number,z:number,t:number)=>hm.tick(.01,4,{x,z,vx:0,vz:0,facing:{x:0,z:1},carrying:false,metal:false,moving:true},()=>lavaHits++,()=>{},()=>{},false,now+t);
touch(floor.x,floor.z,0);touch(floor.x+3,floor.z,50);touch(floor.x+.01,floor.z,100);touch(floor.x-.01,floor.z,200);assert.equal(lavaHits,1);
const saved=hm.snapshot();hm.restore(structuredClone(saved));touch(floor.x,floor.z,1049);assert.equal(lavaHits,1);touch(floor.x,floor.z,1050);assert.equal(lavaHits,2);
touch(floor.x+3,floor.z,2200);assert.equal(lavaHits,2);assert.equal(lava.tickInterval,1.05);
// Both players receive independent boosts; qualification and forced motion are unchanged.
const boosted=make(),plain=make();for(const p of [boosted,plain]){p.x=pad.x;p.z=pad.z;p.move(0,0,.2);assert.ok(p.speedPad.blend>1);assert.equal(p.speed,2);}
plain.speedPad=freshPads();for(const p of [boosted,plain]){p.receiveBat(1,0);p.tick(.05);}assert.equal(boosted.knockback.x,plain.knockback.x);assert.equal(boosted.x,plain.x);
boosted.failExpedition('test');assert.equal(boosted.speedPad.blend,1);
// Opening has a real delay for all four optional gates; two clients share it.
for(const stage of [5,8,14,17]){
 let t=now;const p=new GameState(freshSave(now),()=>t,()=>.5),gate=shortcut(stage)!;
 p.x=gate.x;p.z=gate.z-(stage-1)*48;assert.ok(p.openShortcut());assert.ok(!p.openedShortcuts.includes(stage));assert.equal(p.openShortcut(),false);
 t+=649;p.tick(.01);assert.ok(!p.openedShortcuts.includes(stage));t++;p.tick(.01);assert.ok(p.openedShortcuts.includes(stage));
}
// Online environments no longer advance on the server; clients submit contacts.
let clientRoom=runRoom(null,members,[],'a',{id:'environment-join'},now).room;
const visitor=make(),contact=environmentPlacement(4,0,3*48);visitor.x=contact.x;visitor.z=contact.z;visitor.immunity=0;
clientRoom.players.a.runtime=exportRuntime(visitor);
clientRoom=runRoom(clientRoom,members,[],'a',{id:'environment-idle'},now+100).room;
assert.equal(clientRoom.players.a.runtime.fields.hp,visitor.hp,'no server environmental damage');
const hitAt=now+200,attackState=environmentState(stagePatterns(4)[0],0,3*48,hitAt);
const report={id:'client-lava-contact',kind:'environmentHit',value:{id:attackState.definition.id,serial:attackState.serial,at:hitAt,stage:4,...contact}};
clientRoom=runRoom(clientRoom,members,[],'a',{id:'environment-contact',commands:[report]},hitAt).room;
const damaged=clientRoom.players.a.runtime.fields.hp as number;assert.ok(damaged<visitor.hp);
clientRoom=runRoom(clientRoom,members,[],'a',{id:'environment-retry',commands:[report]},now+300).room;
assert.equal(clientRoom.players.a.runtime.fields.hp,damaged,'contact retries cannot double damage');
console.log('PASS 400 objects / 48 pads; carried routes, archived enemy unit behavior, fixed damage, 30/60/120Hz, lava re-entry, pad lifecycle, retired room mobs, timed gates, client environmental contact receipts');
