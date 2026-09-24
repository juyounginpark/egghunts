// Stable slots: local +Z faces the circular public promenade.
export const VILLAGE={x:0,z:9,radius:14,walkRadius:13.25};
export const FARM_PLOTS=[-115,-57,0,57,115].map(deg=>{
 const a=deg*Math.PI/180,x=Math.sin(a)*10.3,z=VILLAGE.z+Math.cos(a)*10.3;
 return {x,z,rotation:Math.atan2(-x,VILLAGE.z-z)};
});
export const farmPlot=(slot:number)=>FARM_PLOTS[slot]??FARM_PLOTS[0];
export function farmLocal(slot:number,x:number,z:number){const p=farmPlot(slot),c=Math.cos(p.rotation),s=Math.sin(p.rotation);return {x:p.x+x*c+z*s,z:p.z-x*s+z*c};}
export const farmGym=(slot:number)=>farmLocal(slot,2.1,2.3);
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
