import type {GameState} from './game';
import {MONGLES,REGIONS} from './data';
import {STAGES} from './stage-data';
import {collectionEligible} from './balance';

export function collectionRewardReady(game:GameState,stage?:number):boolean{
 const found=(id:number)=>game.hasDiscoveredPet(id);
 if(MONGLES.some((m,i)=>(stage===undefined||m.stageId===stage)&&found(i)&&!game.save.claimedPets?.includes(i)))return true;
 const complete=(ids:number[])=>ids.length>0&&ids.every(found);
 if(stage===undefined||stage===0){
  const legacy=MONGLES.flatMap((m,i)=>i<100&&m.stageId===0?[i]:[]);
  if(!game.save.claimedCollection&&complete(legacy))return true;
  if(REGIONS.some((_,r)=>!game.save.claimedRegions?.includes(r)&&complete(legacy.filter(i=>MONGLES[i].region===r))))return true;
 }
 const ids=MONGLES.flatMap((m,i)=>m.stageId>0&&collectionEligible(m)?[i]:[]);
 if(stage===undefined&&!game.save.claimedStageCollection&&complete(ids))return true;
 return STAGES.some(s=>(stage===undefined||stage===s.id)&&!game.save.claimedStages?.includes(s.id)&&complete(ids.filter(i=>MONGLES[i].stageId===s.id)));
}
