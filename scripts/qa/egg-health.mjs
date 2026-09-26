// Manual migration checks; run only when explicitly requested.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave,parseSave,migrateEggHealth}=await vite.ssrLoadModule('/src/game.ts');
 const {exportRuntime,restoreRuntime}=await vite.ssrLoadModule('/src/online-state.ts');
 const {EGGS,EGG_HEALTH,eggMaxHp}=await vite.ssrLoadModule('/src/data.ts');
 const now=1800000060000;
 for(let type=0;type<EGGS.length;type++)for(const stageId of [undefined,1,2,4,5,10,20])for(const hpVersion of [undefined,2]){
  const def=EGGS[type],oldMax=Math.round(EGG_HEALTH.legacyRegionBase[def.region]*(1+def.tier*.6))/(hpVersion===2?1:10);
  const save=freshSave(now);save.eggs=[{id:'half',type,stageId,hpVersion,hp:oldMax/2,distance:30},{id:'ready',type,stageId,hpVersion,hp:0,distance:30}];save.selected='half';
  const restored=parseSave(JSON.stringify(save),now);
  assert.equal(restored.eggs[0].hp,eggMaxHp({type,stageId})/2);assert.equal(restored.eggs[1].hp,0);
  assert.equal(restored.selected,'half');assert.equal(restored.eggs[0].hpVersion,3);
  assert.deepEqual(parseSave(JSON.stringify(restored),now).eggs,restored.eggs,'reload must not rescale again');
 }
 for(let stageId=2;stageId<=20;stageId++)assert.ok(eggMaxHp({type:0,stageId})>eggMaxHp({type:0,stageId:stageId-1}));
 assert.equal(eggMaxHp({type:0,stageId:1}),12);
 const g=new GameState(freshSave(now),()=>now,()=>.5);assert.equal(g.speed,2);assert.equal(g.movementSpeed,2);
 const state=exportRuntime(g),world=structuredClone(g.world),bosses=structuredClone(g.bosses);
 for(const egg of world){const def=EGGS[egg.type];egg.hp=Math.round(EGG_HEALTH.legacyRegionBase[def.region]*(1+def.tier*.6))/10;delete egg.hpVersion;}
 state.fields.carried={...world[0]};state.save.eggs=[{id:'stored',type:0,hp:15,distance:30}];
 restoreRuntime(g,state,world,bosses);
 assert.equal(g.save.eggs[0].hp,6);assert.equal(g.carried.hp,eggMaxHp(g.carried));
 assert.equal(world[0].hp,eggMaxHp(world[0]));
 migrateEggHealth([world[0],world[0]]);assert.equal(world[0].hp,eggMaxHp(world[0]));
 assert.throws(()=>migrateEggHealth([{id:'bad',type:0,hp:31,distance:0}]),'invalid old health is not silently clamped');
 const starter=new GameState(freshSave(now),()=>now,()=>.5);starter.save.eggs=[{id:'first',type:0,stageId:1,hp:12,hpVersion:3,distance:14}];starter.save.selected='first';for(let i=0;i<4;i++)starter.damage(starter.tapDamage);assert.equal(starter.selected.hp,0);
 console.log('PASS: egg progress migration, zero HP, repeated load, runtime/world/carried eggs and initial speed');
}finally{await vite.close();}
