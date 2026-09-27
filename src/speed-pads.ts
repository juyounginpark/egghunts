import {routePoint,pathX,terrainAt} from './exploration-route';
export function speedPads(stage:number){
 const entry=routePoint(stage,.08),back=routePoint(stage,.67),outer=routePoint(stage,.55);
 const positions=[entry,{x:(stage%2?1:-1)*7,z:back.z},...(stage>=13?[{x:pathX(stage,outer.z)+(stage%2?6:-6),z:outer.z}]:[])];
 return positions.map((p,i)=>({...p,id:`pad-${stage}-${i}`,stage,height:terrainAt(stage,p.x,p.z).height,multiplier:stage<=5?1.2:stage<=12?1.25:1.3,duration:stage<=5?2500:stage<=12?3000:3500}));
}
export type SpeedPadState={stage:number;inside:string[];cooldowns:Record<string,number>;effects:{multiplier:number;until:number}[];blend:number};
export const freshPads=():SpeedPadState=>({stage:0,inside:[],cooldowns:{},effects:[],blend:1});
export function updatePads(s:SpeedPadState,stage:number,x:number,z:number,now:number,dt:number,disabled=false){
 if(disabled||s.stage!==stage){Object.assign(s,freshPads(),{stage});if(disabled)return;}
 const inside=speedPads(stage).filter(p=>Math.abs(x-p.x)<=1.2&&Math.abs(z-p.z)<=.65);
 for(const p of inside)if(!s.inside.includes(p.id)&&now>=(s.cooldowns[p.id]??0)){
  s.cooldowns[p.id]=now+4000;s.effects=s.effects.filter(e=>e.multiplier!==p.multiplier);s.effects.push({multiplier:p.multiplier,until:now+p.duration});
 }
 s.inside=inside.map(p=>p.id);s.effects=s.effects.filter(e=>e.until>now);
 const target=Math.max(1,...s.effects.map(e=>e.multiplier));
 s.blend+=Math.max(-dt*1.5,Math.min(dt*1.5,target-s.blend));
}
