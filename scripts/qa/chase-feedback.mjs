// Manual regression suite; run only when validation is explicitly requested.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {GameState,freshSave,parseSave}=await server.ssrLoadModule('/src/game.ts');
 const {exportRuntime,restoreRuntime,migrateStageRuntime}=await server.ssrLoadModule('/src/online-state.ts');
 const {guardianPursuitSpeed,guardianChaseSpeed,ROUTE,BOSS_MOVEMENT}=await server.ssrLoadModule('/src/stage-data.ts');
 const {DAMAGE_OVER_TIME}=await server.ssrLoadModule('/src/data.ts');
 const now=1800000030000,make=()=>new GameState(freshSave(now),()=>now,()=>.2);
 // Each independent old-host packet must retain the server's coordinates.
 const client=make();
 for(const z of [-388,-390,-391,-402]){
  const g=make();g.z=z;g.deadline=now+60000;
  const packet=exportRuntime(g);delete packet.save.stageOrderVersion;
  const original=JSON.stringify(packet);
  restoreRuntime(client,packet,g.world,g.bosses);
  assert.equal(client.z,z);assert.equal(JSON.stringify(packet),original);
 }
 const legacy=exportRuntime(make());delete legacy.save.stageOrderVersion;
 legacy.save.expedition={x:0,z:-400,deadline:now+60000,carried:null};legacy.fields.z=-400;
 migrateStageRuntime(legacy);assert.equal(legacy.fields.z,-1744);
 const once=JSON.stringify(legacy);migrateStageRuntime(legacy);assert.equal(JSON.stringify(legacy),once);
 // Distance feedback closes a 50m gap for every stage without teleporting.
 for(let stage=1;stage<=20;stage++){
  let distance=50;const reach=ROUTE.bossReach*ROUTE.bossAngryScale;
  for(let i=0;i<1800;i++){
   const speed=guardianPursuitSpeed(stage,1e9,distance,20,reach);
   assert.ok(speed<=BOSS_MOVEMENT.maxSpeed);
   distance+=(20-speed)/60;
  }
  assert.ok(distance<=reach+BOSS_MOVEMENT.catchupTargetGap+.05);
  assert.equal(guardianPursuitSpeed(stage,1e9,reach+1,20,reach),guardianChaseSpeed(stage,1e9));
 }
 const isolated=g=>{g.hazards.tick=()=>{};g.tickBosses=()=>{};return g;};
 const g=isolated(make());g.z=-20;g.deadline=now+60000;
 const hp=g.hp,damage=g.bossDamage(0);g.receiveHit(0);
 assert.equal(g.hp,hp);assert.equal(g.damageTicks.length,1);
 assert.deepEqual(g.hitSource,{x:0,z:-21,at:now});
 g.receiveHit(0);assert.equal(g.damageTicks.length,1,'immunity prevents duplicate scheduling');
 g.tick(DAMAGE_OVER_TIME.interval);assert.ok(g.hp<hp&&g.hp>hp-damage);
 const h=isolated(new GameState(parseSave(JSON.stringify(g.snapshot()),now),()=>now,()=>.2));
 h.tick(DAMAGE_OVER_TIME.ticks*DAMAGE_OVER_TIME.interval);
 assert.ok(Math.abs(h.hp-(hp-damage))<1e-8);assert.equal(h.damageTicks.length,0);
 h.immunity=0;h.hp=1;h.receiveHit(0);assert.equal(h.death,null);
 h.tick(DAMAGE_OVER_TIME.interval);assert.ok(h.death);assert.equal(h.damageTicks.length,0);
 console.log('PASS: live coordinates, one-time legacy migration, pursuit gap, deferred damage, persistence, immunity and death');
}finally{await server.close();}
