import {GameState,type Save,type WorldEgg,type Boss} from './game';
import type {HazardManager} from './hazards';

export type RuntimeState={save:Save;fields:Record<string,unknown>;hazards:ReturnType<HazardManager['snapshot']>};
const omitted=new Set(['save','world','bosses','hazards','mapCollision','now','random','events','routeCache','routeStart']);
// Only the trusted server produces this format. Clients never upload a save.
export function exportRuntime(game:GameState):RuntimeState{
 const save=game.snapshot();delete save.world;delete save.bosses;
 const fields=Object.fromEntries(Object.entries(game).filter(([key,value])=>!omitted.has(key)&&typeof value!=='function'));
 return structuredClone({save,fields,hazards:game.hazards.snapshot()});
}
export function restoreRuntime(game:GameState,state:RuntimeState,world:WorldEgg[],bosses:Boss[]){
 const known=game as unknown as Record<string,unknown>;
 for(const [key,value] of Object.entries(state.fields)){
  if(omitted.has(key)||!Object.hasOwn(game,key))continue;
  // JSON represents infinite initial timestamps as null.
  known[key]=value===null&&typeof known[key]==='number'&&!Number.isFinite(known[key])?known[key]:value;
 }
 game.save=structuredClone(state.save);game.save.dragonClues??={};game.world=world;game.bosses=bosses;game.hazards.restore(state.hazards);
 game.roomManaged=true;
}
