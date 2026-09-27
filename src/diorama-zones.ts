export type DioramaZone={x:number;z:number;height:number;side:number;index:number};
const cache=new Map<number,DioramaZone[]>();
/** Eight scenes share anchors across terrain, props, ground litter and scenery. */
export function dioramaZones(stage:number){
 let zones=cache.get(stage);if(zones)return zones;
 const length=stage===20?225:48;
 zones=Array.from({length:8},(_,i)=>({
  index:i,side:i%2?1:-1,x:(i%2?1:-1)*(8.5+(i===6?.4:0)),
  z:-6-length*([.14,.19,.36,.42,.57,.63,.77,.8][i]),
  height:[.32,0,0,.32,-.16,0,.32,0][i],
 }));
 cache.set(stage,zones);return zones;
}
/** Decorative relief remains walkable; the central corridor is always level. */
export function dioramaHeight(stage:number,x:number,z:number,center:number){
 // Match the rendered one-unit ground cells, including the lowered floor.
 x=Math.round(x);z=Math.floor(z)+.5;
 const distance=Math.abs(x-center);
 if(distance<3||Math.abs(x)>12.5)return 0;
 const depthScale=stage===20?225/48:1;
 const q=dioramaZones(stage).find(q=>q.height!==0&&Math.abs(x-q.x)<3.6&&Math.abs(z-q.z)/depthScale<5.2&&Math.abs(x-q.x)+Math.abs(z-q.z)/depthScale<7.4);
 if(q)return q.height;
 const progress=(-z-6)/(48*depthScale);
 // Leave openings into the side scenes and a level approach to eggs/bosses.
 const opening=[.25,.5,.7].some(p=>Math.abs(progress-p)<.035);
 if(progress<.06||progress>.85||opening)return 0;
 return distance<4.3?.16:distance<5.5?.32:0;
}
