import * as T from 'three';
import {RARITIES} from './data';

/** Reused scene geometry: at most four draw calls, no per-voxel objects or lights. */
export class HatchBurst extends T.Group {
 private material=new T.MeshBasicMaterial({transparent:true,depthWrite:false});
 private sparks=new T.InstancedMesh(new T.BoxGeometry(.08,.08,.08),this.material,96);
 private rings:T.Mesh[]=[];
 private dummy=new T.Object3D();
 constructor(){
  super();this.visible=false;this.sparks.frustumCulled=false;this.add(this.sparks);
  const geometry=new T.TorusGeometry(1,.024,4,48);
  for(let i=0;i<3;i++){const ring=new T.Mesh(geometry,this.material.clone());this.rings.push(ring);this.add(ring);}
 }
 update(age:number,tier:number,reduced:boolean,low:boolean){
  this.visible=age>=0&&age<2.7;if(!this.visible)return;
  const color=RARITIES[tier].color;
  this.material.color.set(color);this.material.opacity=.85*Math.min(1,Math.max(0,(2.7-age)*2));
  this.sparks.count=reduced?12:Math.min(low?40:96,20+tier*12);
  for(let i=0;i<this.sparks.count;i++){
   const burst=Math.max(0,age-1.05-(i%3)*.12),angle=i*2.39996+age*(reduced?0:1.5);
   const r=burst>0?.4+burst*(1.3+i%5*.22):1.2*(1-age*.45);
   this.dummy.position.set(Math.cos(angle)*r,.6+(i%7)*.18+burst*.8,Math.sin(angle)*r);
   this.dummy.rotation.set(angle,angle+age*3,angle);
   this.dummy.scale.setScalar(reduced?.6:burst>0?Math.max(.1,1.8-burst):.5+age);
   this.dummy.updateMatrix();this.sparks.setMatrixAt(i,this.dummy.matrix);
  }
  this.sparks.instanceMatrix.needsUpdate=true;
  this.rings.forEach((ring,i)=>{
   const t=age-1.05-i*.14;ring.visible=!reduced&&i<=Math.floor(tier/2)&&t>0&&t<1;
   ring.position.y=.75+i*.35;ring.rotation.set(Math.PI/2+i*.45,0,i*.7);
   ring.scale.setScalar(.4+t*(2+tier*.18));
   const mat=ring.material as T.MeshBasicMaterial;mat.color.set(color);mat.opacity=Math.max(0,1-t)*.65;
  });
 }
}
