import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Solid={lo:number[];hi:number[];color:T.Color};
type Rect=[number,number,number,number];
const EPS=1e-7;
function subtract(rect:Rect,cut:Rect):Rect[]{
 const [u0,v0,u1,v1]=rect,a=Math.max(u0,cut[0]),b=Math.max(v0,cut[1]),c=Math.min(u1,cut[2]),d=Math.min(v1,cut[3]);
 if(c-a<EPS||d-b<EPS)return [rect];
 return [[u0,v0,a,v1],[c,v0,u1,v1],[a,v0,c,b],[a,d,c,v1]].filter(r=>r[2]-r[0]>EPS&&r[3]-r[1]>EPS) as Rect[];
}

/** Colored boxes are merged per animated part, never drawn as individual voxels. */
export class ExplorerGeometry{
 private pieces:T.BufferGeometry[]=[];
 private solids:Solid[]=[];
 constructor(private unit=1){}
 box(x:number,y:number,z:number,w:number,h:number,d:number,color:T.ColorRepresentation,rz=0,ry=0){
  if(!rz&&!ry){
   this.solids.push({lo:[x-w/2,y-h/2,z-d/2],hi:[x+w/2,y+h/2,z+d/2],color:new T.Color(color)});return;
  }
  const g=new T.BoxGeometry(w/this.unit,h/this.unit,d/this.unit).toNonIndexed();
  g.rotateZ(rz);g.rotateY(ry);g.translate(x/this.unit,y/this.unit,z/this.unit);
  const c=new T.Color(color),rgb=new Float32Array(g.getAttribute('position').count*3);
  for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(rgb,3));g.deleteAttribute('uv');this.pieces.push(g);
 }
 add(g:T.BufferGeometry){g.deleteAttribute('uv');this.pieces.push(g);}
 finish(){
  // Trim hidden rectangles rather than merging intact, intersecting box faces.
  // Coincident exposed surfaces belong to the last authored box (e.g. cloth trim).
  const position:number[]=[],normal:number[]=[],color:number[]=[];
  this.solids.forEach((s,i)=>{
   for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
    const u=(axis+1)%3,v=(axis+2)%3,plane=sign>0?s.hi[axis]:s.lo[axis];
    let faces:Rect[]=[[s.lo[u],s.lo[v],s.hi[u],s.hi[v]]];
    this.solids.forEach((other,j)=>{
     if(i===j||!faces.length||plane<other.lo[axis]-EPS||plane>other.hi[axis]+EPS)return;
     const beyond=sign>0?other.hi[axis]-plane:plane-other.lo[axis];
     if(beyond<EPS&&j<i)return;
     faces=faces.flatMap(r=>subtract(r,[other.lo[u],other.lo[v],other.hi[u],other.hi[v]]));
    });
    for(const [a,b,c,d]of faces){
     const corners=[[a,b],[c,b],[c,d],[a,d]];
     for(const k of sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]){
      const p=[0,0,0],n=[0,0,0];p[axis]=plane;p[u]=corners[k][0];p[v]=corners[k][1];n[axis]=sign;
      position.push(...p.map(x=>x/this.unit));normal.push(...n);color.push(s.color.r,s.color.g,s.color.b);
     }
    }
   }
  });
  if(position.length){const surface=new T.BufferGeometry();surface.setAttribute('position',new T.Float32BufferAttribute(position,3));surface.setAttribute('normal',new T.Float32BufferAttribute(normal,3));surface.setAttribute('color',new T.Float32BufferAttribute(color,3));this.pieces.push(surface);}
  this.solids=[];
  const g=mergeGeometries(this.pieces)??new T.BufferGeometry();
  this.pieces.forEach(p=>p.dispose());this.pieces=[];
  if(g.getAttribute('position'))g.computeBoundingSphere();return g;
 }
}
