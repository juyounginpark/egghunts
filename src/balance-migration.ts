import {BALANCE,ECONOMY,growthCost,recommendedIncome} from './data';
import {compare,validMoney,type Money} from './money';
import type {Save} from './game';
export type BalanceAdjustment={at:number;dust:Money;trainingSpeed:number;pending:Money};
/** One-time correction at persisted-save boundaries, never on incoming live frames. */
export function migrateBalance(save:Save,now:number){
 if(save.balanceVersion===1)return;
 if(save.balanceVersion!==undefined)throw Error('Invalid balance version');
 const level=save.upgrades?.speed;
 if(!Number.isInteger(level)||level<0||level>BALANCE.maxUpgrade||!validMoney(save.dust))throw Error('Invalid balance migration');
 const training=save.trainingSpeed??0,pending=save.petIncome?.pending??0;
 if(!Number.isFinite(training)||training<0||!validMoney(pending))throw Error('Invalid balance migration');
 const walletLimit=Math.max(ECONOMY.migrationWalletMinimum,growthCost('speed',level)*ECONOMY.migrationWalletGoals);
 const trainingLimit=BALANCE.speed*ECONOMY.speedGrowth**level*ECONOMY.migrationTrainingMultiple;
 const pendingLimit=recommendedIncome(Math.min(20,level+1))*BALANCE.petIncomeSeconds;
 if(compare(save.dust,walletLimit)>0||training>trainingLimit||compare(pending,pendingLimit)>0){
  save.balanceAdjustment={at:now,dust:save.dust,trainingSpeed:training,pending};
  if(compare(save.dust,walletLimit)>0)save.dust=walletLimit;
  save.trainingSpeed=Math.min(training,trainingLimit);
  if(save.petIncome&&compare(pending,pendingLimit)>0)save.petIncome.pending=pendingLimit;
 }
 save.balanceVersion=1;
}
