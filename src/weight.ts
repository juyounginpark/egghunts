import {EGGS,MONGLES,eggCarryMultiplier} from './data';
export const WEIGHT_BALANCE={standardGrams:[250,1000,5000,20000,100000,500000,2000000],normalDeviation:.3,rareChance:.01,rareMin:.4,rareMax:.5,sizeExponent:.5,petVisualScale:.6};
export type Weighted={weightG?:number;standardWeightG?:number};
export type PetLot={key:string;species:number;weightG:number;standardWeightG:number;count:number};
type Inventory={mongles:number[];active:number[];mountPet?:number|null;petLots?:PetLot[];activeLots?:string[];mountLot?:string|null};
export function standardEggWeight(e:{type:number;stageId?:number;variant?:number}){
 const base=WEIGHT_BALANCE.standardGrams[EGGS[e.type]?.tier??0];
 return Math.round(base*(.9+(((e.stageId??0)*17+(e.variant??0)*7)%21)/100));
}
export function rollEggWeight(e:{type:number;stageId?:number;variant?:number},random:()=>number):Required<Weighted>{
 const standardWeightG=standardEggWeight(e),rare=random()<WEIGHT_BALANCE.rareChance;
 const deviation=rare?WEIGHT_BALANCE.rareMin+random()*(WEIGHT_BALANCE.rareMax-WEIGHT_BALANCE.rareMin):random()*WEIGHT_BALANCE.normalDeviation;
 return {standardWeightG,weightG:Math.max(1,Math.round(standardWeightG*(1+(random()<.5?-1:1)*deviation)))};
}
export function ensureEggWeight(e:({type:number;stageId?:number;variant?:number}&Weighted)|null|undefined){
 if(!e)return;
 e.standardWeightG??=standardEggWeight(e);e.weightG??=e.standardWeightG;
 if(!Number.isSafeInteger(e.weightG)||e.weightG<=0||!Number.isSafeInteger(e.standardWeightG)||e.standardWeightG<=0)throw Error('Invalid egg weight');
}
export function weightSize(w:Weighted){return ((w.weightG??w.standardWeightG??1)/(w.standardWeightG??w.weightG??1))**WEIGHT_BALANCE.sizeExponent;}
export function carryMultiplier(e:{type:number}&Weighted,level:number){
 const normal=eggCarryMultiplier(e.type,level),ratio=(e.weightG??1)/(e.standardWeightG??e.weightG??1);
 return Math.max(.05,Math.min(1,1-(1-normal)*ratio));
}
export function weightText(g:number){const unit=g>=1000000?'T':g>=1000?'KG':'G',n=g/(unit==='T'?1000000:unit==='KG'?1000:1);return `${Number(n.toFixed(unit==='G'?0:3))} ${unit}`;}
export function addPetLot(s:Inventory,species:number,w:Required<Weighted>,count=1){
 const key=`${species}-${w.weightG}-${w.standardWeightG}`,lots=s.petLots??=[];let lot=lots.find(l=>l.key===key);
 if(lot)lot.count+=count;else {lot={key,species,...w,count};lots.push(lot);}return lot;
}
export function ensurePetLots(s:Inventory){
 s.petLots??=[];
 if(!Array.isArray(s.petLots)||new Set(s.petLots.map(l=>l.key)).size!==s.petLots.length)throw Error('Invalid pet lots');
 for(const lot of s.petLots)if(lot.key!==`${lot.species}-${lot.weightG}-${lot.standardWeightG}`||!MONGLES[lot.species]||!Number.isSafeInteger(lot.count)||lot.count<0||!Number.isSafeInteger(lot.weightG)||lot.weightG<=0||!Number.isSafeInteger(lot.standardWeightG)||lot.standardWeightG<=0)throw Error('Invalid pet weight');
 const counts=new Map<number,number>();
 for(const lot of s.petLots)counts.set(lot.species,(counts.get(lot.species)??0)+lot.count);
 for(let id=0;id<s.mongles.length;id++){
  const missing=s.mongles[id]-(counts.get(id)??0);
  if(missing>0){const g=WEIGHT_BALANCE.standardGrams[MONGLES[id].tier];addPetLot(s,id,{weightG:g,standardWeightG:g},missing);}
  if(missing<0)throw Error('Pet weight inventory mismatch');
 }
 const used=new Map<string,number>(),reserve=(id:number,key?:string|null)=>{
  const available=(l:PetLot)=>l.species===id&&l.count>(used.get(l.key)??0);
  const lot=s.petLots!.find(l=>l.key===key&&available(l))??s.petLots!.find(available);
  if(!lot)return '';used.set(lot.key,(used.get(lot.key)??0)+1);return lot.key;
 };
 s.activeLots=s.active.map((id,i)=>reserve(id,s.activeLots?.[i]));
 s.mountLot=s.mountPet==null?null:reserve(s.mountPet,s.mountLot)||null;
}
