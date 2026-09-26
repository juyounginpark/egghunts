import {GameState,migrateEggHealth,type Save,type WorldEgg,type Boss} from './game';
import {migrateStageSave,compactRouteZ} from './stage-migration';
import {migrateBalance} from './balance-migration';
import {MONGLES} from './data';
import {validateWeekly} from './weekly';
import type {HazardManager} from './hazards';

export type RuntimeState={save:Save;fields:Record<string,unknown>;hazards:ReturnType<HazardManager['snapshot']>};
const omitted=new Set(['save','world','bosses','hazards','roomSnapshotTime','mapCollision','now','random','events','routeCache','routeStart']);
export function migrateStageRuntime(state:RuntimeState){
 if(state.save.stageOrderVersion===2&&state.save.routeVersion===3)return;
 const oldZ=state.fields.z;
 migrateStageSave(state.save);
 const e=state.save.expedition;
 if(e){state.fields.x=e.x;state.fields.z=e.z;state.fields.carried=e.carried;}
 else if(typeof oldZ==='number')state.fields.z=compactRouteZ(oldZ);
 if(state.save.death)state.fields.death=structuredClone(state.save.death);
 state.fields.launch=null;state.fields.knockback={x:0,z:0,remaining:0};
 // In-flight attack geometry belongs to the previous world layout; restart its
 // normal telegraph rather than applying an old coordinate to a relocated player.
 state.hazards={...state.hazards,attacks:[],next:[],stage:0};
}
// Only the trusted server produces this format. Clients never upload a save.
export function exportRuntime(game:GameState):RuntimeState{
 const save=game.snapshot();delete save.world;delete save.bosses;
 const fields=Object.fromEntries(Object.entries(game).filter(([key,value])=>!omitted.has(key)&&typeof value!=='function'));
 return structuredClone({save,fields,hazards:game.hazards.snapshot()});
}
export function restoreRuntime(game:GameState,state:RuntimeState,world:WorldEgg[],bosses:Boss[],migrateHealth=true){
 // Live snapshots already have authoritative coordinates. Only persisted room
 // and profile records are migrated by runRoom; never permute a network frame.
 const known=game as unknown as Record<string,unknown>;
 for(const [key,value] of Object.entries(state.fields)){
  if(omitted.has(key)||!Object.hasOwn(game,key))continue;
  // JSON represents infinite initial timestamps as null.
  known[key]=value===null&&typeof known[key]==='number'&&!Number.isFinite(known[key])?known[key]:value;
 }
 game.save=structuredClone(state.save);game.save.dragonClues??={};game.world=world;game.bosses=bosses;game.hazards.restore(state.hazards);
 if(migrateHealth)migrateEggHealth([...game.save.eggs,...world,game.carried,...bosses.flatMap(b=>b.loot?[b.loot]:[])]);
 if(migrateHealth){migrateBalance(game.save,game.now());validateWeekly(game.save.weekly);game.save.mongles=Array.from({length:MONGLES.length},(_,i)=>game.save.mongles[i]??0);}
 if(game.save.progression)delete game.save.progression.traits;
 game.hp=Math.min(game.hp,game.maxHp);
 game.roomManaged=true;
}
