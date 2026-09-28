// Permanent appearance IDs: 0..4 original, 5 dragon seal, 6 weekly ribbon.
// New ordinary eggs append at 7 so saved special eggs retain their identity.
export const NORMAL_EGG_VARIANTS=Array.from({length:30},(_,i)=>i<5?i:i+2);
export const isStageEggVariant=(id:number)=>Number.isInteger(id)&&id>=0&&id<=32&&id!==6;
export const normalEggIndex=(variant:number)=>variant<5?variant:variant-2;
export const randomNormalEggVariant=(random:()=>number)=>NORMAL_EGG_VARIANTS[Math.min(29,Math.floor(random()*30))];
export function normalEggSelection(random:()=>number,count:number){
 const pool=[...NORMAL_EGG_VARIANTS];
 return Array.from({length:count},()=>pool.splice(Math.min(pool.length-1,Math.floor(random()*pool.length)),1)[0]);
}
