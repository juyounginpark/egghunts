import type {WorldEgg,Boss} from './game';
import {eggAnchor,bossAnchor,specialEggAnchor} from './exploration-route';
/** Relocate only natural nest occupants. Dropped/held IDs and positions survive. */
export function migrateExploration(world:WorldEgg[],bosses:Boss[]){
 for(const boss of bosses){
  const stage=boss.stageId??1,p=bossAnchor(stage,!!boss.final),offset=(stage-1)*48;
  boss.homeX=p.x;boss.homeZ=p.z-offset;
  if(boss.mode==='idle'){boss.x=boss.homeX;boss.z=boss.homeZ;}
 }
 for(const egg of world){
  if(!egg.stageId||egg.secured||bosses.some(b=>b.loot?.id===egg.id))continue;
  const atHome=egg.x===egg.homeX&&egg.z===egg.homeZ;
  const raw=Number(egg.id.split('-')[1]),slot=Number.isInteger(raw)&&raw>=0&&raw<5?raw:2;
  const p=egg.special?specialEggAnchor():eggAnchor(egg.stageId,slot);
  egg.homeX=p.x;egg.homeZ=p.z-(egg.stageId-1)*48;
  if(atHome){egg.x=egg.homeX;egg.z=egg.homeZ;egg.distance=Math.abs(egg.z);}
 }
}
