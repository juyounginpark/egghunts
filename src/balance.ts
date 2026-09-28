/** Shared progression, economy and combat rules. All values are independent of equipment prices. */
export const OVERHAUL={
 version:2,
 speedBases:[1.4,3.2,5.2,7.2,10.4,15.6,26,42,68,104,188,332,624,1144,2080,4160,7800,14560,27040,52000,80000],
 waits:[120,120,90,180,600,900,1800,3600,7200,14400,21600,43200,64800,86400,129600,172800,432000,604800,691200,518400],
 costShares:{speed:1,health:.35,training:.35,carry:.45,tap:.35,damage:.5,rate:.55,time:.35},
 costScale:.8,
 petIncomeBase:2,stageIncomeGrowth:1.55,tierIncome:[1,1.1,1.25,1.45,1.8,2.2,2.6],baselineTier:1.25,baselineProduction:1.25,
 productionPerLevel:.01,productionCap:1.8,
 trainingCap:.3,trainingSeconds:600,trainingRatePerLevel:.025,
 levelSpeedPerLevel:.002,levelSpeedCap:1.12,
 trailProgression:[1,1.01,1.02,1.03],trailMovement:[1,1.12,1.24,1.38],trailStages:[1,5,10,15],trailWaits:[0,600,7200,21600],
 mountBonusRate:.35,mountBonusCap:.08,
 carrySlow:[.12,.17,.22,.28,.35,.43,.52],carryReductionPerLevel:.022,minimumCarrySlow:[.06,.08,.1,.13,.17,.22,.28],
 hatchSeconds:[5,8,12,22,36,65,135],tapBase:3,tapGrowth:1.1,autoBase:4,autoGrowth:1.08,ratePerLevel:.03,
 recoveryRatio:[1.2,1.2,1.2,1.2,1.35,1.35,1.35,1.35,1.35,1.55,1.55,1.55,1.55,1.55,1.75,1.75,1.75,1.75,1.75,1.75],
 offlineFullSeconds:28800,offlineTailEfficiency:.5,offlineCap:172800,
 rewardMinutes:{egg:.35,saleEgg:.14,salePet:.3,discovery:.5,stage:15,collection:180,ad:5},weeklyMinutes:[3,4,5,7,9,12,15],adDailyLimit:3,
};
export const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export const upgradeBaseSpeed=(level:number)=>OVERHAUL.speedBases[clamp(Math.floor(level),0,20)];
export function progressionSpeedValue(base:number,training:number,trail:number,companion:number,level:number){
 return base*(1+OVERHAUL.trainingCap*clamp(training,0,1))*OVERHAUL.trailProgression[trail]*companion*Math.min(OVERHAUL.levelSpeedCap,1+OVERHAUL.levelSpeedPerLevel*(level-1));
}
export const incomeValue=(value:number)=>Math.max(0,value);
export const combatDamage=(value:number)=>Math.max(0,value);
export const petIncomeValue=(stage:number,tier:number)=>OVERHAUL.petIncomeBase*OVERHAUL.stageIncomeGrowth**(clamp(stage,1,20)-1)*OVERHAUL.tierIncome[tier];
export const baselineIncome=(stage:number)=>3*petIncomeValue(stage,0)*OVERHAUL.baselineTier*OVERHAUL.baselineProduction;
export function productionUpgradeMultiplier(levels:{health:number;training:number;damage:number;rate:number}){
 return clamp(1+OVERHAUL.productionPerLevel*(levels.health+levels.training+levels.damage+levels.rate),1,OVERHAUL.productionCap);
}
export function upgradePrice(kind:string,level:number){
 const share=OVERHAUL.costShares[kind as keyof typeof OVERHAUL.costShares];
 return Math.max(1,Math.ceil(baselineIncome(clamp(level+1,1,20))*OVERHAUL.waits[clamp(level,0,19)]*share*OVERHAUL.costScale));
}
export const trainingProgressAfter=(progress:number,seconds:number,level:number)=>clamp(progress+Math.max(0,seconds)*(1+level*OVERHAUL.trainingRatePerLevel)/OVERHAUL.trainingSeconds,0,1);
export function offlineSeconds(seconds:number){const t=clamp(seconds,0,OVERHAUL.offlineCap);return Math.min(t,OVERHAUL.offlineFullSeconds)+Math.max(0,t-OVERHAUL.offlineFullSeconds)*OVERHAUL.offlineTailEfficiency;}
export const tapDamageValue=(level:number,bonus=1)=>combatDamage(OVERHAUL.tapBase*OVERHAUL.tapGrowth**level*bonus);
export const autoDamageValue=(damage:number,rate:number,bonus=1)=>combatDamage(OVERHAUL.autoBase*OVERHAUL.autoGrowth**damage*(1+OVERHAUL.ratePerLevel*rate)*bonus);
export const hatchHealth=(stage:number,tier:number)=>Math.round((tapDamageValue(stage-1)*1.5+autoDamageValue(stage-1,stage-1))*OVERHAUL.hatchSeconds[tier]*1.2);
export const stageReward=(stage:number,minutes:number,tier=0)=>Math.max(1,Math.floor(baselineIncome(stage)*60*minutes*OVERHAUL.tierIncome[tier]));
export function carryingRatio(tier:number,level:number,weightRatio:number){
 const slow=Math.max(OVERHAUL.minimumCarrySlow[tier],OVERHAUL.carrySlow[tier]*(1-level*OVERHAUL.carryReductionPerLevel));
 return clamp(1-slow*weightRatio,.2,.97);
}
export const walkingSpeedValue=(progression:number)=>Math.min(22,3+1.1*Math.log2(1+Math.max(0,progression)));
export const stableRecoveryRatio=(stage:number)=>OVERHAUL.recoveryRatio[clamp(stage,1,20)-1];
export const collectionEligible=(pet:{tier:number})=>pet.tier<=3;
