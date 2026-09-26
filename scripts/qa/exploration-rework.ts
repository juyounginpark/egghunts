import assert from 'node:assert/strict';
import {GameState,freshSave} from '../../src/game';
import {BALANCE,EGGS} from '../../src/data';
import {STAGE_REQUIRED_SPEED,stagePatterns,environmentPlacement} from '../../src/stage-data';
import {mainPath,routePoint,routeProgress,shortcut,terrainAt} from '../../src/exploration-route';
import {migrateExploration} from '../../src/exploration-migration';
import {HazardManager,contains} from '../../src/hazards';
import {runRoom} from '../../server/room-engine';
import {exportRuntime} from '../../src/online-state';
import {validateDragonClues,newDragonClue} from '../../src/dragon-discovery';
const now=1800000060000,make=()=>new GameState(freshSave(now),()=>now,()=>.5);
const stat=(g:GameState,n:number)=>{g.save.trainingSpeed=(n<=1000?n:1000*10**(n/1000-1))-BALANCE.speed;};
const walk=(g:GameState,x:number,z:number)=>{
 for(let i=0;i<10000;i++){
  const dx=x-g.x,dz=z-g.z,l=Math.hypot(dx,dz);if(l<.025)return;
  const before={x:g.x,z:g.z};g.push(dx/l*Math.min(.08,l),dz/l*Math.min(.08,l));
  assert.ok(Math.hypot(g.x-before.x,g.z-before.z)>.001,`blocked at ${g.x},${g.z} toward ${x},${z}`);
 }
 throw Error('route did not finish');
};
const g=make();assert.equal(g.world.length,101);assert.equal(g.bosses.length,21);
validateDragonClues({'1':{...newDragonClue(),avoided:['hay','explore-1-0']}});
for(let stage=1;stage<=20;stage++){
 const offset=(stage-1)*48,path=mainPath(stage).slice(0,-1),required=STAGE_REQUIRED_SPEED[stage-1];
 const eggs=g.world.filter(e=>e.stageId===stage);
 assert.equal(eggs.length,stage===20?6:5);
 for(const e of eggs){const t=routeProgress(stage,e.x,e.z+offset).progress;assert.ok(t>=.85&&t<=1,`egg ${stage} at ${t}`);}
 for(const b of g.bosses.filter(b=>b.stageId===stage)){const t=routeProgress(stage,b.x,b.z+offset).progress;assert.ok(t>=.6&&t<=.85,`boss ${stage} at ${t}`);}
 g.carried=null;g.x=path[0].x;g.z=path[0].z-offset;
 for(const p of path.slice(1))walk(g,p.x,p.z-offset);
 const e=eggs[2];walk(g,e.x,e.z);stat(g,required-.01);const hp=g.hp;g.pickup(e);assert.equal(g.carried,null);assert.equal(g.hp,hp);
 stat(g,required+.000001);g.pickup(e);assert.equal(g.carried?.id,e.id);stat(g,0.5);assert.ok(g.carried,'no repeated qualification after pickup');
 for(const p of [...path].reverse())walk(g,p.x,p.z-offset);
 g.interact();assert.equal(g.carried,null);
 const troll=routePoint(stage,.35);g.x=troll.x;g.z=troll.z-offset;g.knockedUntil=0;
 assert.equal(g.receiveBat(1,0),true);g.push(BALANCE.knockback,0);assert.ok(terrainAt(stage,g.x,g.z+offset).walk);g.knockback.remaining=0;g.knockedUntil=0;walk(g,troll.x,troll.z-offset);
 if(stage<=5)for(const d of stagePatterns(stage))assert.equal(d.damage+d.damagePercent,0);
 if(stage===11||stage===19){const h=new HazardManager(),p=environmentPlacement(stage,0,offset);h.tick(.01,stage,{...p,vx:0,vz:0,facing:{x:0,z:1},carrying:true,metal:false,moving:false,stageOffset:offset},()=>{},()=>{},()=>{},false,now);}
 console.log(`stage ${stage}: round trip, carried return, placement, speed gate, bat landing`);
}
const a=make();a.z=-12;stat(a,50000);assert.equal(a.movementSpeed,10);const egg=a.world[2];a.pickup(egg);assert.ok(a.movementSpeed<=20);assert.notEqual(a.speed,100000);
const old=make(),dropped=old.world[0];dropped.x+=1;const before={id:dropped.id,x:dropped.x,z:dropped.z};migrateExploration(old.world,old.bosses);assert.deepEqual({id:dropped.id,x:dropped.x,z:dropped.z},before);
const defs=stagePatterns(11),definition=defs[0];const wall={definition,target:{x:0,z:0},elapsed:0} as any;assert.equal(contains(wall,{x:0,z:0}),false);assert.equal(contains(wall,{x:3,z:0}),true);
const members=['a','b'].map((user_id,slot)=>({user_id,slot,last_seen:new Date(now).toISOString()}));
let room=runRoom(null,members,[],'a',{id:'join'},now).room;
const gate=shortcut(5)!;for(const id of ['a','b']){const p=make();p.x=gate.x;p.z=gate.z-4*48;room.players[id].runtime=exportRuntime(p);}
room=runRoom(room,members,[],'a',{id:'open',commands:[{id:'gate-a',kind:'shortcut'}]},now+100).room;
assert.deepEqual(room.openedShortcuts,[5]);assert.deepEqual(room.players.b.runtime.fields.openedShortcuts,[5]);
room=runRoom(room,members,[],'b',{id:'open-b',commands:[{id:'gate-b',kind:'shortcut'}]},now+200).room;assert.deepEqual(room.openedShortcuts,[5]);
const h1=new HazardManager(),h2=new HazardManager(),p={...environmentPlacement(6,0),vx:0,vz:0,facing:{x:0,z:1},carrying:false,metal:false,moving:false};
h1.tick(.1,6,p,()=>{},()=>{},()=>{},false,now);h2.tick(.02,6,{...p,carrying:true},()=>{},()=>{},()=>{},false,now);assert.deepEqual(h1.attacks,h2.attacks);
console.log('PASS: 20 routes, 101 eggs/21 guardians, speed gates, 10/20 movement caps, migration, shared shortcut and hazard clock');
