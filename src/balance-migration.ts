import {upgradeBaseSpeed,OVERHAUL} from './balance';
import {validMoney,type Money} from './money';
import type {Save} from './game';
export type BalanceAdjustment={at:number;dust:Money;trainingSpeed:number;pending:Money};
/** Preserve currency, ownership, lot references and original training values. */
export function migrateBalance(save:Save,_now:number){
 if([save.productionAt,save.productionActiveAt].some(value=>value!==undefined&&(!Number.isFinite(value)||value<0)))throw Error('Invalid production timestamp');
 if(save.balanceVersion===2){
  if(!Number.isFinite(save.trainingProgress)||save.trainingProgress!<0||save.trainingProgress!>1)throw Error('Invalid training progress');
  if(!Number.isInteger(save.highestStage)||save.highestStage!<1||save.highestStage!>20)throw Error('Invalid highest stage');
  if(save.adRewards&&(!Number.isInteger(save.adRewards.day)||!Number.isInteger(save.adRewards.count)||save.adRewards.count<0||save.adRewards.count>OVERHAUL.adDailyLimit))throw Error('Invalid ad rewards');
  return;
 }
 if(save.balanceVersion!==undefined&&save.balanceVersion!==1)throw Error('Invalid balance version');
 if(!validMoney(save.dust)||!Number.isFinite(save.trainingSpeed??0)||(save.trainingSpeed??0)<0)throw Error('Invalid balance migration');
 const legacy=save.trainingSpeed??0;
 save.legacyTrainingSpeed??=legacy;
 save.trainingProgress=Math.min(1,legacy/(upgradeBaseSpeed(save.upgrades.speed)*OVERHAUL.trainingCap));
 save.highestStage=Math.max(1,...(save.visitedStages??[]),...(save.progression?.completedStages??[]));
 save.balanceVersion=2;
}
