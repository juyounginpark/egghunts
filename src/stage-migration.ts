import {OLD_TO_STAGE,STAGE_ORDER_VERSION} from './stage-order';
import type {Save,WorldEgg,Boss} from './game';
const mapped=(n:number)=>OLD_TO_STAGE[n]??n;
function position(z:number,old:number,start=1){return z<-6?z-(mapped(old)-old+start-1)*96:z;}
export function migrateStageWorld(world:WorldEgg[],bosses:Boss[],start=1,seen=new Set<WorldEgg|Boss>()){
 for(const e of world){if(seen.has(e))continue;seen.add(e);const old=e.stageId;if(!old)continue;e.stageId=mapped(old);e.z=position(e.z,old,start);if(e.homeZ!==undefined)e.homeZ=position(e.homeZ,old,start);e.guardian=e.special?20:e.stageId-1;}
 for(const b of bosses){if(seen.has(b))continue;seen.add(b);const old=b.stageId;if(!old)continue;b.stageId=mapped(old);b.z=position(b.z,old,start);if(b.homeZ!==undefined)b.homeZ=position(b.homeZ,old,start);if(b.loot)migrateStageWorld([b.loot],[],start,seen);}
 bosses.sort((a,b)=>(a.final?21:a.stageId??0)-(b.final?21:b.stageId??0));
}
/** One-time permutation, never a reset. IDs, counts, tiers, weights and HP stay intact. */
export function migrateStageSave(s:Save){
 if(s.stageOrderVersion===STAGE_ORDER_VERSION)return;
 if(s.stageOrderVersion!==undefined)throw Error('Unsupported stage order');
 const start=s.progression?.stage??1;
 // Normalize the older 32-unit routes before permuting 96-unit stage offsets.
 if(s.routeVersion===1){
  const stretch=(z:number)=>z<-6?-6+(z+6)*3:z;
  const objects=new Set<WorldEgg|Boss>([...(s.world??[]),...(s.bosses??[]),...(s.expedition?.carried?[s.expedition.carried]:[]),...(s.bosses??[]).flatMap(b=>b.loot?[b.loot]:[])]);
  for(const o of objects){o.z=stretch(o.z);if(o.homeZ!==undefined)o.homeZ=stretch(o.homeZ);}
  if(s.expedition)s.expedition.z=stretch(s.expedition.z);
  if(s.progression)s.progression.distanceRecord=-stretch(-s.progression.distanceRecord);
  s.routeVersion=2;
 }
 for(const e of s.eggs??[])if(e.stageId)e.stageId=mapped(e.stageId);
 const seen=new Set<WorldEgg|Boss>();migrateStageWorld(s.world??[],s.bosses??[],start,seen);
 if(s.expedition?.carried)migrateStageWorld([s.expedition.carried],[],start,seen);
 if(s.expedition&&s.expedition.z<-6){const old=Math.min(20,start+Math.floor((-s.expedition.z-6)/96));s.expedition.z=position(s.expedition.z,old,start);}
 if(s.progression){s.progression.stage=1;s.progression.completedStages=s.progression.completedStages.map(mapped);}
 if(s.visitedStages)s.visitedStages=s.visitedStages.map(mapped);
 if(s.claimedStages)s.claimedStages=s.claimedStages.map(mapped);
 if(s.dragonClues){
  const garden=s.dragonClues['20'];
  const memories=garden?structuredClone(garden):undefined;
  if(garden)for(const list of ['avoided','carried','escaped'] as const)garden[list]=garden[list].filter(id=>id==='creation-wave');
  const abyss=s.dragonClues['5'];
  if(abyss)abyss.avoided=abyss.avoided.map(id=>id==='tentacle'?'void-hand':id==='sweep'?'memory-tentacle':id);
  s.dragonClues=Object.fromEntries(Object.entries(s.dragonClues).map(([key,value])=>[mapped(Number(key)),value]));
  if(memories){
   const target=s.dragonClues['19']??={...memories,avoided:[],carried:[],escaped:[],claimed:false};
   for(const list of ['avoided','carried','escaped'] as const)target[list]=[...new Set([...target[list],...memories[list].filter(id=>['void-hand','memory-tentacle','memory-lightning','memory-meteor'].includes(id))])];
  }
 }
 s.stageOrderVersion=STAGE_ORDER_VERSION;
}
