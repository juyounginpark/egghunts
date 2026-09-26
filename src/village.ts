// Stable slots: local +Z faces the circular public promenade.
export const VILLAGE={x:0,z:9,radius:14,walkRadius:13.25};
// Seat top is .66; the seated avatar's lowest limb is 3/18 above its root.
export const CAMPFIRE={x:0,z:9,seatRadius:3.2,interactionRadius:1.5,sittingHeight:.5,exitOffset:1};
export const CAMP_SEATS=Array.from({length:4},(_,index)=>{
 const angle=index*Math.PI/2;
 return {x:CAMPFIRE.x+Math.sin(angle)*CAMPFIRE.seatRadius,z:CAMPFIRE.z+Math.cos(angle)*CAMPFIRE.seatRadius,rotation:angle+Math.PI};
});
export const FARM_PLOTS=[-115,-57,0,57,115].map(deg=>{
 const a=deg*Math.PI/180,x=Math.sin(a)*10.3,z=VILLAGE.z+Math.cos(a)*10.3;
 return {x,z,rotation:Math.atan2(-x,VILLAGE.z-z)};
});
export const farmPlot=(slot:number)=>FARM_PLOTS[slot]??FARM_PLOTS[0];
export function farmLocal(slot:number,x:number,z:number){const p=farmPlot(slot),c=Math.cos(p.rotation),s=Math.sin(p.rotation);return {x:p.x+x*c+z*s,z:p.z-x*s+z*c};}
export const farmGym=(slot:number)=>farmLocal(slot,2.1,2.3);
export const FARM_PEN={halfWidth:2.85,back:-2.35,front:3.25,gateHalfWidth:.85};
// Eggs occupy the left beds; resting pets may roam throughout their owner's pen.
export function farmEggPosition(slot:number,index:number,count:number){
 const columns=3,rows=Math.max(1,Math.ceil(count/columns));
 return farmLocal(slot,-2.15+(index%columns)*.58,-1.55+Math.floor(index/columns)*Math.min(.7,2.9/Math.max(1,rows-1)));
}
export function farmPetPose(slot:number,index:number,time:number,reduced=false){
 const seed=slot*131+index*37,elapsed=reduced?0:time+index*2.7;
 const leg=Math.floor(elapsed/6),phase=elapsed%6,t=Math.min(1,phase/5);
 const random=(n:number)=>{const value=Math.sin(n*127.1+seed*311.7)*43758.5453;return value-Math.floor(value);};
 const point=(step:number)=>({x:(random(step*2)-.5)*(FARM_PEN.halfWidth*2-.9),z:FARM_PEN.back+.45+random(step*2+1)*(FARM_PEN.front-FARM_PEN.back-.9)});
 const from=point(leg),to=point(leg+1),blend=t*t*(3-2*t);
 // Interpolate inside the rectangle: even a long frame cannot cross a fence.
 const p=farmLocal(slot,from.x+(to.x-from.x)*blend,from.z+(to.z-from.z)*blend);
 const heading=Math.atan2(to.x-from.x,to.z-from.z),previous=point(leg-1);
 const oldHeading=Math.atan2(from.x-previous.x,from.z-previous.z);
 const turn=Math.atan2(Math.sin(heading-oldHeading),Math.cos(heading-oldHeading));
 return {...p,rotation:farmPlot(slot).rotation+oldHeading+turn*Math.min(1,t*5),moving:!reduced&&t<1};
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
