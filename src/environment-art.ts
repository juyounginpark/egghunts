import type {Block,Motion} from './region-layout';
import {ENVIRONMENT_ART,zoneIndex} from './environment-art-data';
import {dioramaZones} from './diorama-zones';
import {pathX,terrainAt,routeLength} from './exploration-route';
import {explorationLandmark} from './exploration-landmarks';
import {sceneModel,type SceneModel} from './environment-props';
import {toyDioramas} from './toy-dioramas';

export type EnvironmentAssembly=SceneModel&{id:string;kind:string};
const backgroundColor=(c:number)=>{
 const r=c>>16&255,g=c>>8&255,b=c&255,gray=(r+g+b)/3;
 return (Math.round(r*.65+gray*.35)<<16)|(Math.round(g*.65+gray*.35)<<8)|Math.round(b*.65+gray*.35);
};
function append(out:SceneModel,model:SceneModel,x:number,y:number,z:number,s:number,angle=0,background=false){
 const cs=Math.cos(angle),sn=Math.sin(angle),color=(c:number)=>background?backgroundColor(c):c;
 for(const p of model.blocks)out.blocks.push({...p,x:x+(p.x*cs-p.z*sn)*s,y:y+p.y*s,z:z+(p.x*sn+p.z*cs)*s,w:p.w*s,h:p.h*s,d:p.d*s,c:color(p.c),angle:(p.angle??0)+angle,solid:false});
 for(const m of model.motions)out.motions.push({...m,x:x+(m.x*cs-m.z*sn)*s,y:y+m.y*s,z:z+(m.x*sn+m.z*cs)*s,
  travel:m.travel?{x:(m.travel.x*cs-m.travel.z*sn)*s,y:m.travel.y*s,z:(m.travel.x*sn+m.travel.z*cs)*s}:undefined,
  blocks:m.blocks.map(p=>({...p,x:(p.x*cs-p.z*sn)*s,y:p.y*s,z:(p.x*sn+p.z*cs)*s,w:p.w*s,h:p.h*s,d:p.d*s,c:color(p.c),angle:(p.angle??0)+angle,solid:false}))});
}
function footprint(model:SceneModel){
 const blocks=[...model.blocks,...model.motions.flatMap(m=>m.blocks.map(p=>({...p,x:p.x+m.x,z:p.z+m.z})))];
 return {x:Math.max(.15,...blocks.map(p=>Math.abs(p.x)+Math.hypot(p.w,p.d)/2)),z:Math.max(.15,...blocks.map(p=>Math.abs(p.z)+Math.hypot(p.w,p.d)/2))};
}
function place(out:SceneModel,model:SceneModel,stage:number,side:number,x:number,z:number,s:number,angle=0){
 const size=footprint(model),clearance=(-z-6)/routeLength(stage)>.85?6:3;
 const roadEdge=Math.max(...[-size.z*s,0,size.z*s].map(d=>side*pathX(stage,z+d)))+clearance;
 s=Math.min(s,Math.max(.2,(12.25-roadEdge)/(size.x*2)));
 const radius=size.x*s;
 x=side*Math.max(roadEdge+radius,Math.min(side*x,12.25-radius));
 append(out,model,x,terrainAt(stage,x,z).height,z,s,angle);
}

/** Production scenes follow the approved plan, not a global prop scatter. */
export function environmentAssemblies(stage:number):EnvironmentAssembly[]{
 if(stage===2)return toyDioramas();
 const plan=ENVIRONMENT_ART[stage-1],zones=dioramaZones(stage),out:EnvironmentAssembly[]=[];
 const make=(id:string,kind:string)=>{const a:EnvironmentAssembly={id,kind,blocks:[],motions:[]};out.push(a);return a;};
 const hero=make(`landmark-${stage}`,'landmark'),anchor=zones[6];
 place(hero,{blocks:explorationLandmark(stage),motions:[]},stage,anchor.side,anchor.x,anchor.z,1.33);
 for(const [i,entry] of plan.mediums.split(' ').entries()){
  const [letter,kind]=entry.split(':'),q=zones[zoneIndex(letter)],assembly=make(`structure-${stage}-${i}`,kind);
  // Structures sit at the back of their 3–5m scene; related props face the route.
  place(assembly,sceneModel(kind,stage),stage,q.side,q.x+q.side*.45,q.z-.9,1.05);
 }
 for(const [i,group] of plan.clusters.entries()){
  const q=zones[zoneIndex(group.zone)],assembly=make(`cluster-${stage}-${i}`,group.name);
  const items=group.items.split(' ').flatMap(token=>{const [kind,count]=token.split('*');return Array.from({length:Number(count??1)},()=>kind);});
  for(const [j,kind] of items.entries()){
   const ring=Math.floor(j/6),t=(j%6)*1.01+i*.31;
   const dx=Math.cos(t)*(1.05+ring*.4),dz=.9+Math.sin(t)*(.65+ring*.25);
   const s=j===0?.67:.3+(j%3)*.065;
   place(assembly,sceneModel(kind,stage),stage,q.side,q.x+dx,q.z+dz,s,(j%5-2)*.15);
  }
 }
 return out;
}

/** Background-only silhouettes extend beyond the existing solid canyon edge. */
export function environmentBackdrops(stage:number):SceneModel{
 const out:SceneModel={blocks:[],motions:[]},zones=dioramaZones(stage);
 for(const [i,kind] of ENVIRONMENT_ART[stage-1].backdrops.split(' ').entries()){
  const q=zones[[2,5,7][i]],model=sceneModel(kind,stage);
  const top=Math.max(1,...model.blocks.map(p=>p.y+p.h/2),...model.motions.flatMap(m=>m.blocks.map(p=>m.y+p.y+p.h/2+.4)));
  append(out,model,q.side*(15.5+i*.35),2.2,q.z-1,Math.min(1.55+i*.12,5/top),0,true);
 }
 if(stage===4)for(const side of [-1,1])for(let i=0;i<2;i++){
  const x=side*13.1,z=-6-routeLength(stage)*(.3+i*.34);
  out.blocks.push({x,y:1.4,z,w:.35,h:2.8,d:.8,c:0xaa4f32,solid:false});
  out.motions.push({x:x-side*.19,y:2.5,z,kind:'drift',phase:i+side,travel:{x:0,y:-2.3,z:0},blocks:[{x:0,y:0,z:0,w:.06,h:.55,d:.45,c:0xe4a354,solid:false}]});
 }
 return out;
}

export function environmentGroundDetails(stage:number):Block[]{
 const out:Block[]=[],plan=ENVIRONMENT_ART[stage-1],zones=dioramaZones(stage);
 for(const [i,group] of plan.clusters.entries()){
  const q=zones[zoneIndex(group.zone)],base=plan.floor[2],ink=plan.accents[i%3];
  for(let j=0;j<9;j++){
   const edge=j<3,localZ=q.z+(edge?0:1.2)+Math.sin(j*1.8+i)*.7;
   const x=edge?pathX(stage,localZ)+q.side*(2.8+j*.3):q.x+Math.cos(j*2.3)*1.6;
   const y=terrainAt(stage,x,localZ).height+.025,angle=(j%5-2)*.23;
   if(plan.detail==='crack'||plan.detail==='grain'||plan.detail==='sand'){
    for(let k=0;k<3;k++)out.push({x:x+k*.16,y,z:localZ+Math.sin(k+i)*.1,w:.2,h:.02,d:plan.detail==='sand'?.08:.045,c:base,angle,solid:false});
   }else if(plan.detail==='tile'){
    out.push({x,y,z:localZ,w:.6,h:.025,d:.035,c:base,angle,solid:false});
    if(j%2===0)out.push({x:x+.3,y,z:localZ+.22,w:.035,h:.025,d:.45,c:base,solid:false});
   }else{
    const leaf=plan.detail==='leaf'||plan.detail==='vein';
    out.push({x,y,z:localZ,w:leaf?.32:.4,h:.035,d:leaf?.2:.3,c:j%3?base:ink,angle,solid:false});
    if(leaf)out.push({x,y:y+.02,z:localZ,w:.25,h:.018,d:.03,c:plan.floor[0],angle,solid:false});
   }
  }
 }
 return out;
}
