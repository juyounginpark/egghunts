import {pathX,routeLength,terrainAt} from './exploration-route';
import {BRUSH_TERRAIN} from './stage-data';
import {ENVIRONMENT_ART} from './environment-art-data';
import type {Block} from './region-layout';
const cache=new Map<number,{x:number;z:number;radius:number}[]>();
export function brushRegions(stage:number){
 let regions=cache.get(stage);if(regions)return regions;
 regions=BRUSH_TERRAIN.progress.map((p,i)=>{
  const z=-6-routeLength(stage)*p,side=(stage+i)%2?1:-1;
  return {x:pathX(stage,z)+side*BRUSH_TERRAIN.offset,z,radius:BRUSH_TERRAIN.radius};
 });cache.set(stage,regions);return regions;
}
export function inBrush(stage:number,x:number,z:number){
 return brushRegions(stage).some(p=>Math.hypot(x-p.x,(z-p.z)*.85)<p.radius);
}
export function concealedAt(x:number,z:number,start=1){
 if(z>=-6)return false;
 const stage=Math.min(20,start+Math.max(0,Math.floor((-z-6)/48)));
 return inBrush(stage,x,z+(stage-start)*48);
}
export function brushArt(stage:number):Block[]{
 const out:Block[]=[],plan=ENVIRONMENT_ART[stage-1];
 for(const [i,p] of brushRegions(stage).entries())for(let j=0;j<30;j++){
  const angle=j*2.4,r=Math.sqrt((j+.5)/30)*p.radius,x=p.x+Math.cos(angle)*r,z=p.z+Math.sin(angle)*r/ .85;
  const y=terrainAt(stage,x,z).height,h=.65+(j%4)*.13;
  out.push({x,y:y+h/2,z,w:.13,h,d:.16,c:j%3?0x779b79:plan.accents[1],solid:false});
  for(const side of [-1,1])out.push({x:x+side*.14,y:y+h*.65,z,w:.38,h:.13,d:.28,c:j%3?0x92b18b:plan.accents[1],roll:side*.3,solid:false});
  if(j===i+2)out.push({x,y:y+h,z,w:.22,h:.15,d:.22,c:plan.accents[0],solid:false});
 }
 for(const p of brushRegions(stage)){
  const x=p.x+1.3,z=p.z+.4,y=terrainAt(stage,x,z).height;
  out.push({x,y:y+.1,z,w:.32,h:.2,d:.32,c:plan.floor[2],solid:false},{x,y:y+.24,z,w:.08,h:.12,d:.08,c:0x779b79,solid:false});
 }
 return out;
}
