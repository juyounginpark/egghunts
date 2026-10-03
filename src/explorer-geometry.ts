import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Colored boxes are merged per animated part, never drawn as individual voxels. */
export class ExplorerGeometry{
 private pieces:T.BufferGeometry[]=[];
 constructor(private unit=1){}
 box(x:number,y:number,z:number,w:number,h:number,d:number,color:T.ColorRepresentation,rz=0,ry=0){
  const g=new T.BoxGeometry(w/this.unit,h/this.unit,d/this.unit).toNonIndexed();
  g.rotateZ(rz);g.rotateY(ry);g.translate(x/this.unit,y/this.unit,z/this.unit);
  const c=new T.Color(color),rgb=new Float32Array(g.getAttribute('position').count*3);
  for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(rgb,3));g.deleteAttribute('uv');this.pieces.push(g);
 }
 add(g:T.BufferGeometry){g.deleteAttribute('uv');this.pieces.push(g);}
 finish(){
  const g=mergeGeometries(this.pieces)??new T.BufferGeometry();
  this.pieces.forEach(p=>p.dispose());this.pieces=[];
  if(g.getAttribute('position'))g.computeBoundingSphere();return g;
 }
}
