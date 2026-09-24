import { buildRegionLayout,type Block } from './region-layout';
import { routeSegments,stagePatterns,environmentPlacement } from './stage-data';
import {villageArt} from './world-art';
import {villageColliders,clampVillage} from './village';

export type MapCollider={minX:number;maxX:number;minZ:number;maxZ:number};
const radius=.24,epsilon=.0001,bandSize=4;
export function blockCollider(p:Block,offset=0):MapCollider|null{
 const roll=p.roll??0,angle=p.angle??0;
 const halfY=(Math.abs(Math.sin(roll))*p.w+Math.abs(Math.cos(roll))*p.h)/2;
 if(p.y+halfY<.3||p.y-halfY>1.1||p.w*p.d<.012)return null;
 const width=Math.abs(Math.cos(roll))*p.w+Math.abs(Math.sin(roll))*p.h;
 const hx=(Math.abs(Math.cos(angle))*width+Math.abs(Math.sin(angle))*p.d)/2;
 const hz=(Math.abs(Math.sin(angle))*width+Math.abs(Math.cos(angle))*p.d)/2;
 return {minX:p.x-hx,maxX:p.x+hx,minZ:p.z-offset-hz,maxZ:p.z-offset+hz};
}
function buckets(boxes:MapCollider[]){
 const bands=new Map<number,MapCollider[]>();
 for(const box of boxes)for(let k=Math.floor(box.minZ/bandSize);k<=Math.floor(box.maxZ/bandSize);k++){
  if(!bands.has(k))bands.set(k,[]);bands.get(k)!.push(box);
 }
 return bands;
}
const sharedSections=new Map<string,ReturnType<typeof buckets>>();
const farmBuckets=new WeakMap<MapCollider[],ReturnType<typeof buckets>>();
let villageBoxes:MapCollider[]|undefined;
export function villageMapColliders(){return villageBoxes??= [...villageColliders(),...villageArt().flatMap(p=>{const box=blockCollider(p,0);return box?[box]:[];})];}
/** Swept player footprint: even a fast move or knockback cannot skip a thin prop. */
export class MapCollision{
 private farm=buckets([]);
 private sections=sharedSections;
 setFarm(boxes:MapCollider[]){let cached=farmBuckets.get(boxes);if(!cached){cached=buckets(boxes);farmBuckets.set(boxes,cached);}this.farm=cached;}
 private nearby(x:number,z:number,dx:number,dz:number,start:number){
  const minZ=Math.min(z,z+dz)-radius-2,maxZ=Math.max(z,z+dz)+radius+2;
  const minX=Math.min(x,x+dx)-radius-2,maxX=Math.max(x,x+dx)+radius+2;
  const sources=[this.farm];
  for(const r of routeSegments(start)){
   if(-r.end>maxZ||-r.start<minZ)continue;
   const key=`${start}:${r.stage}`;
   if(!this.sections.has(key)){
    const layout=buildRegionLayout(r.stage,r.end-r.start),boxes:MapCollider[]=[];
    for(const p of layout.blocks){const box=blockCollider(p,r.offset);if(box&&box.minX<7&&box.maxX>-7)boxes.push(box);}
    // Swaying grounded sculptures keep a stable footprint; floating effects have none.
    for(const motion of layout.motions)if(motion.kind==='sway')for(const p of motion.blocks){
     const box=blockCollider({...p,x:p.x+motion.x,y:p.y+motion.y,z:p.z+motion.z},r.offset);if(box)boxes.push(box);
    }
    for(const [lane,hazard] of stagePatterns(r.stage).entries()){
     if(['hay','train','book','raptor','gear','orb'].includes(hazard.visual))continue;
     const {x,z}=environmentPlacement(r.stage,lane,r.offset);
     if([2,6,7,12,13,18].includes(r.stage))for(const side of [-1,1]){
      boxes.push({minX:x+side*.55-.1,maxX:x+side*.55+.1,minZ:z-.35,maxZ:z+.35});
     }
    }
    this.sections.set(key,buckets(boxes));
    if(this.sections.size>24)this.sections.delete(this.sections.keys().next().value!);
   }
   sources.push(this.sections.get(key)!);
  }
  const result=new Set<MapCollider>();
  for(const source of sources)for(let k=Math.floor(minZ/bandSize);k<=Math.floor(maxZ/bandSize);k++)for(const box of source.get(k)??[]){
   if(box.maxX>=minX&&box.minX<=maxX)result.add(box);
  }
  return [...result];
 }
 move(x:number,z:number,dx:number,dz:number,start:number){
  const boxes=this.nearby(x,z,dx,dz,start);
  // Old saves may already overlap a newly solid object. Allow them to leave it.
  const overlaps=(px:number,pz:number,b:MapCollider)=>px>b.minX-radius&&px<b.maxX+radius&&pz>b.minZ-radius&&pz<b.maxZ+radius;
  const initial=boxes.filter(b=>overlaps(x,z,b));
  if(initial.length){
   const candidates=initial.flatMap(b=>[
    {x:b.minX-radius-epsilon,z},{x:b.maxX+radius+epsilon,z},
    {x,z:b.minZ-radius-epsilon},{x,z:b.maxZ+radius+epsilon},
   ]).filter(p=>Math.abs(p.x)<=(p.z>=-4.4?14:6.5)&&!boxes.some(b=>overlaps(p.x,p.z,b)));
   candidates.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));
   if(candidates[0]){x=candidates[0].x;z=candidates[0].z;}
  }
  for(let slide=0;slide<3&&(Math.abs(dx)+Math.abs(dz)>epsilon);slide++){
   let hit=1,nx=0,nz=0;
   for(const b of boxes){
    if(overlaps(x,z,b))continue;
    let enter=-Infinity,leave=Infinity,ax=0,az=0,miss=false;
    for(const axis of ['x','z'] as const){
     const pos=axis==='x'?x:z,delta=axis==='x'?dx:dz;
     const lo=(axis==='x'?b.minX:b.minZ)-radius,hi=(axis==='x'?b.maxX:b.maxZ)+radius;
     if(Math.abs(delta)<1e-12){if(pos<=lo||pos>=hi){miss=true;break;}continue;}
     const near=Math.min((lo-pos)/delta,(hi-pos)/delta),far=Math.max((lo-pos)/delta,(hi-pos)/delta);
     if(near>enter){enter=near;ax=axis==='x'?-Math.sign(delta):0;az=axis==='z'?-Math.sign(delta):0;}
     leave=Math.min(leave,far);
    }
    if(!miss&&enter>=0&&enter<=leave&&enter<hit){hit=enter;nx=ax;nz=az;}
   }
   const travel=Math.max(0,hit-epsilon/Math.max(epsilon,Math.hypot(dx,dz)));
   x+=dx*(hit===1?1:travel);z+=dz*(hit===1?1:travel);
   if(hit===1)break;
   dx*=1-hit;dz*=1-hit;
   const into=dx*nx+dz*nz;if(into<0){dx-=into*nx;dz-=into*nz;}
  }
  return clampVillage(x,z);
 }
}
