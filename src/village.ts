// Stable slots: local +Z faces the circular public promenade.
export const VILLAGE={x:0,z:9,radius:14,walkRadius:13.25};
export const FARM_PLOTS=[-115,-57,0,57,115].map(deg=>{
 const a=deg*Math.PI/180,x=Math.sin(a)*10.3,z=VILLAGE.z+Math.cos(a)*10.3;
 return {x,z,rotation:Math.atan2(-x,VILLAGE.z-z)};
});
export const farmPlot=(slot:number)=>FARM_PLOTS[slot]??FARM_PLOTS[0];
export function farmLocal(slot:number,x:number,z:number){const p=farmPlot(slot),c=Math.cos(p.rotation),s=Math.sin(p.rotation);return {x:p.x+x*c+z*s,z:p.z-x*s+z*c};}
export const farmGym=(slot:number)=>farmLocal(slot,2.1,2.3);
export const FARM_PEN={halfWidth:2.85,back:-2.35,front:3.25,gateHalfWidth:.85};
// Eggs occupy the left beds; pets roam the right lawn, away from the front gym.
export function farmEggPosition(slot:number,index:number,count:number){
 const columns=3,rows=Math.max(1,Math.ceil(count/columns));
 return farmLocal(slot,-2.15+(index%columns)*.58,-1.55+Math.floor(index/columns)*Math.min(.7,2.9/Math.max(1,rows-1)));
}
export function farmPetPose(slot:number,index:number,time:number,reduced=false){
 const phase=index*2.399,cycle=(time+index*1.7)%12;
 const moving=!reduced&&cycle<8;
 const travel=reduced?0:Math.floor((time+index*1.7)/12)*8+Math.min(8,cycle);
 const a=phase+travel*.22,rx=.45+(index%3)*.19,rz=.55+(index%4)*.19;
 const p=farmLocal(slot,1.15+Math.sin(a)*rx,-.5+Math.cos(a)*rz);
 return {...p,rotation:farmPlot(slot).rotation+Math.atan2(Math.cos(a)*rx,-Math.sin(a)*rz),moving};
}
// Segment diagonal rails instead of filling their entire bounding rectangle.
export const villageColliders=()=>FARM_PLOTS.flatMap((_,slot)=>Array.from({length:7},(_,i)=>{
 const p=farmLocal(slot,1.5+i*.2,1.6);
 return {minX:p.x-.12,maxX:p.x+.12,minZ:p.z-.12,maxZ:p.z+.12};
}));
export function clampVillage(x:number,z:number){
 if(z<-4.4||(Math.abs(x)<1.5&&z<0))return {x,z};
 const dx=x-VILLAGE.x,dz=z-VILLAGE.z,d=Math.hypot(dx,dz);
 return d>VILLAGE.walkRadius?{x:VILLAGE.x+dx/d*VILLAGE.walkRadius,z:VILLAGE.z+dz/d*VILLAGE.walkRadius}:{x,z};
}
