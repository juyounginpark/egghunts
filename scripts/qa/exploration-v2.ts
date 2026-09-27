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
 const art=explorationObjects(stage);assert.equal(art.length,stage===2?8:20);assert.ok(art.every(o=>o.blocks.length+o.motions.length>0));
 assert.equal(EXPLORATION_OBJECTS.slice((stage-1)*20,stage*20).filter(r=>r[3]==='troll').length,1);
 pads+=speedPads(stage).length;assert.deepEqual(speedPadArt(stage),{blocks:[],motions:[]});
 assert.deepEqual(stagePatterns(stage),[]);assert.ok(art.every(o=>o.blocks.every(b=>b.solid===false)));
 for(const x of [-10,0,10]){const t=terrainAt(stage,x,-25);assert.equal(t.walk,true);assert.equal(t.slow,1);assert.ok([-.16,0,.32].includes(t.height));}
 for(const point of mainPath(stage))assert.equal(terrainAt(stage,point.x,point.z).height,0);
 const offset=(stage-1)*48,path=mainPath(stage).slice(0,-1);
 for(const boss of g.bosses.filter(b=>b.stageId===stage)){const p=routeProgress(stage,boss.homeX!,boss.homeZ!+offset).progress;assert.ok(p>(stage===20?.92:.94)&&p<=1,`boss behind eggs ${stage} ${p}`);}
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
assert.equal(pads,0);
// Retired pads cannot grant or restore a movement boost.
const s=freshPads();s.blend=2;s.effects=[{multiplier:2,until:now+60000}];
updatePads(s,1,0,-20,now,.2);assert.deepEqual(s,freshPads());
const restored=new HazardManager();restored.restore({...restored.snapshot(),attacks:[{environment:true} as any]});assert.deepEqual(restored.attacks,[]);
for(let stage=1;stage<=20;stage++){
 const hm=new HazardManager();let hits=0;
 hm.tick(1,stage,{x:0,z:-25,vx:0,vz:0,facing:{x:0,z:1},carrying:true,metal:false,moving:false},()=>hits++,()=>{},()=>{},false,now);
 assert.equal(hits,0);assert.deepEqual(hm.attacks,[]);
}
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
// Optional gate interactions and old client damage reports are retired.
for(const stage of [5,8,14,17]){
 const p=make(),gate=shortcut(stage)!;p.x=gate.x;p.z=gate.z-(stage-1)*48;
 assert.equal(p.nearShortcut,null);assert.equal(p.openShortcut(),false);
}
let clientRoom=runRoom(null,members,[],'a',{id:'environment-join'},now).room;
const visitor=make();visitor.x=0;visitor.z=-160;visitor.immunity=0;
clientRoom.players.a.runtime=exportRuntime(visitor);
clientRoom=runRoom(clientRoom,members,[],'a',{id:'environment-contact',commands:[{id:'old-contact',kind:'environmentHit',value:{stage:4,id:'explore-4-0',serial:1,at:now}}]},now+100).room;
assert.equal(clientRoom.players.a.runtime.fields.hp,visitor.hp);
console.log('PASS open scenery routes, 20 types per stage, no environmental obstacles/pads/gates, archived enemy behavior, retired room mobs and stale damage reports');
