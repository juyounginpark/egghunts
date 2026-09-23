import { PROGRESSION, TRAITS } from "./data";
export type TraitId=keyof typeof TRAITS;
export type Progression={level:number;xp:number;requiredXP:number;hp:number;maxHP:number;pendingXP:number;seenEggs:number[];hatchedPets:number[];distanceRecord:number;completedStages:number[];healthUnlocked:boolean;stage:number;traits:Partial<Record<TraitId,number>>;firstHitUsed:boolean;lastStandUsed?:boolean;immunity:number;slowRemaining:number;slowMultiplier:number};
export const requiredXP=(level:number)=>Math.round(PROGRESSION.xpBase*level**PROGRESSION.xpExponent);
export const levelHP=(level:number)=>PROGRESSION.baseHP+PROGRESSION.hpPerLevel*(level-1)+PROGRESSION.hpMilestoneBonus*Math.floor((level-1)/PROGRESSION.hpMilestone);
export const levelSpeed=(level:number)=>Math.min(PROGRESSION.maxLevelSpeed,1+PROGRESSION.speedPerLevel*(level-1));
export function newProgression():Progression{return {level:1,xp:0,requiredXP:requiredXP(1),hp:PROGRESSION.baseHP,maxHP:PROGRESSION.baseHP,pendingXP:0,seenEggs:[],hatchedPets:[],distanceRecord:0,completedStages:[],healthUnlocked:false,stage:1,traits:{},firstHitUsed:false,immunity:0,slowRemaining:0,slowMultiplier:1};}
export function awardXP(p:Progression,amount:number){
  if(!Number.isFinite(amount)||amount<0)return 0;
  p.xp+=Math.floor(amount);let levels=0;
  while(p.xp>=requiredXP(p.level)){p.xp-=requiredXP(p.level);p.level++;levels++;}
  p.requiredXP=requiredXP(p.level);return levels;
}
export const traitPoints=(p:Progression)=>Math.floor(p.level/PROGRESSION.traitInterval)-Object.values(p.traits).reduce((n,v)=>n+(v??0),0);
export function chooseTrait(p:Progression,id:TraitId){
  if(!TRAITS[id]||traitPoints(p)<=0||(p.traits[id]??0)>=TRAITS[id].max)return false;
  p.traits[id]=(p.traits[id]??0)+1;return true;
}
export function validateProgression(p:Progression){
  if(!Number.isSafeInteger(p.level)||p.level<1||!Number.isFinite(p.xp)||p.xp<0||p.xp>=requiredXP(p.level)||!Number.isFinite(p.pendingXP)||p.pendingXP<0||!Number.isFinite(p.hp)||p.hp<0||!Number.isFinite(p.distanceRecord)||p.distanceRecord<0||!Number.isInteger(p.stage)||p.stage<1||p.stage>20)throw Error('Invalid progression');
  for(const ids of [p.seenEggs,p.hatchedPets,p.completedStages])if(!Array.isArray(ids)||ids.some(i=>!Number.isInteger(i)||i<0)||new Set(ids).size!==ids.length)throw Error('Invalid XP record');
  if(!p.traits||Object.entries(p.traits).some(([id,n])=>!TRAITS[id as TraitId]||!Number.isInteger(n)||n!<0||n!>TRAITS[id as TraitId].max)||traitPoints(p)<0)throw Error('Invalid trait selection');
  for(const n of [p.immunity,p.slowRemaining,p.slowMultiplier])if(!Number.isFinite(n)||n<0)throw Error('Invalid status');
  p.requiredXP=requiredXP(p.level);
}
export function reducedDamage(flat:number,percent:number,maxHP:number,reduction=0){
  return Math.min(maxHP*PROGRESSION.singleHitCap,Math.max(0,flat+maxHP*percent)*(1-Math.min(PROGRESSION.damageReductionCap,Math.max(0,reduction))));
}
