// Manual migration checks; run only when explicitly requested.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave,parseSave,migrateEggHealth}=await vite.ssrLoadModule('/src/game.ts');
 const {exportRuntime,restoreRuntime}=await vite.ssrLoadModule('/src/online-state.ts');
 const {EGGS}=await vite.ssrLoadModule('/src/data.ts');
 const now=1800000060000;
 for(let type=0;type<EGGS.length;type++){
  const save=freshSave(now);save.eggs=[{id:'half',type,hp:EGGS[type].hp/20,distance:30},{id:'ready',type,hp:0,distance:30}];save.selected='half';
  const restored=parseSave(JSON.stringify(save),now);
  assert.equal(restored.eggs[0].hp,EGGS[type].hp/2);assert.equal(restored.eggs[1].hp,0);
  assert.equal(restored.selected,'half');assert.equal(restored.eggs[0].hpVersion,2);
  assert.deepEqual(parseSave(JSON.stringify(restored),now).eggs,restored.eggs,'reload must not multiply again');
 }
 const g=new GameState(freshSave(now),()=>now,()=>.5);assert.equal(g.speed,2);assert.equal(g.movementSpeed,2);
 const state=exportRuntime(g),world=structuredClone(g.world),bosses=structuredClone(g.bosses);
 for(const egg of world){egg.hp/=10;delete egg.hpVersion;}
 state.fields.carried={...world[0]};state.save.eggs=[{id:'stored',type:0,hp:15,distance:30}];
 restoreRuntime(g,state,world,bosses);
 assert.equal(g.save.eggs[0].hp,150);assert.equal(g.carried.hp,EGGS[g.carried.type].hp);
 assert.equal(world[0].hp,EGGS[world[0].type].hp);
 migrateEggHealth([world[0],world[0]]);assert.equal(world[0].hp,EGGS[world[0].type].hp);
 assert.throws(()=>migrateEggHealth([{id:'bad',type:0,hp:31,distance:0}]),'invalid old health is not silently clamped');
 console.log('PASS: egg progress migration, zero HP, repeated load, runtime/world/carried eggs and initial speed');
}finally{await vite.close();}
