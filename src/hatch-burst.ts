import * as T from 'three';
import {RARITIES} from './data';

/** One gentle shell opening at reveal; pooled geometry, no per-tap debris. */
export class HatchBurst extends T.Group {
 private material=new T.MeshBasicMaterial({transparent:true,depthWrite:false});
 private sparks=new T.InstancedMesh(new T.BoxGeometry(.08,.08,.08),this.material,96);
 private rings:T.Mesh[]=[];
 private shellMaterial=new T.MeshLambertMaterial({color:0xf7eed7,transparent:true,depthWrite:false});
 private shells=new T.InstancedMesh(new T.BoxGeometry(.24,.25,.14),this.shellMaterial,12);
 private dummy=new T.Object3D();
 private warmWhite=new T.Color(0xfff4cf);
 constructor(){
  super();this.visible=false;this.sparks.frustumCulled=false;this.shells.frustumCulled=false;this.add(this.sparks,this.shells);
  const geometry=new T.TorusGeometry(1,.024,4,48);
  for(let i=0;i<3;i++){const ring=new T.Mesh(geometry,this.material.clone());this.rings.push(ring);this.add(ring);}
 }
 anticipate(progress:number,time:number,tier:number,reduced:boolean,low:boolean){
  this.visible=progress>=.8;this.shells.visible=false;if(!this.visible)return;
  const intensity=Math.min(1,(progress-.8)/.2),color=RARITIES[tier].color;
  this.material.color.set(color).lerp(this.warmWhite,.55);
  this.material.opacity=.45+intensity*.5;
  this.sparks.count=reduced?6:Math.round((low?12:24)+intensity*(low?12:56));
  for(let i=0;i<this.sparks.count;i++){
   const phase=(i*.61803398875+(reduced?0:time*(.3+intensity*.65)))%1;
   const angle=i*2.39996+(reduced?0:time*(.5+intensity));
   const radius=.6+(i%5)*.1+Math.sin(phase*Math.PI)*.3;
   this.dummy.position.set(Math.cos(angle)*radius,.15+phase*2.1,Math.sin(angle)*radius);
   this.dummy.rotation.set(angle,angle,angle);
   this.dummy.scale.setScalar((.4+Math.sin(phase*Math.PI))*(.6+intensity*.6));
   this.dummy.updateMatrix();this.sparks.setMatrixAt(i,this.dummy.matrix);
  }
  this.sparks.instanceMatrix.needsUpdate=true;
  this.rings.forEach((ring,i)=>{
   const phase=(time*(.55+intensity*.4)+i/3)%1;
   ring.visible=!reduced;ring.position.y=.15+i*.3;ring.rotation.set(Math.PI/2,0,0);
   ring.scale.setScalar(.5+phase*(.6+intensity*.5));
   const material=ring.material as T.MeshBasicMaterial;
   material.color.copy(this.material.color);material.opacity=(1-phase)*(.12+intensity*.3);
  });
 }
 update(age:number,tier:number,reduced:boolean,low:boolean){
  this.visible=age>=0&&age<2.7;if(!this.visible)return;
  const color=RARITIES[tier].color;
  this.material.color.set(color);this.material.opacity=.85*Math.min(1,Math.max(0,(2.7-age)*2));
  this.sparks.count=reduced?4:low?20:64;
  for(let i=0;i<this.sparks.count;i++){
   const burst=Math.max(0,age-1.05-(i%3)*.12),angle=i*2.39996+age*(reduced?0:.3);
   const r=burst>0?.4+burst*(.4+i%5*.06):.7*(1-age*.2);
   this.dummy.position.set(Math.cos(angle)*r,.6+(i%7)*.18+burst*.8,Math.sin(angle)*r);
   this.dummy.rotation.set(angle,angle+age*3,angle);
   this.dummy.scale.setScalar(reduced?.6:burst>0?Math.max(.1,1.8-burst):.5+age);
   this.dummy.updateMatrix();this.sparks.setMatrixAt(i,this.dummy.matrix);
  }
  const opening=Math.max(0,age-1.05);
  this.shells.visible=!reduced&&opening>0&&opening<.9;
  if(this.shells.visible){
   this.shellMaterial.opacity=Math.max(0,1-opening/.9);
   for(let i=0;i<12;i++){
    const side=i<6?-1:1,part=i%6,angle=(part/5-.5)*Math.PI*.8;
    this.dummy.position.set(side*(.25+opening*.75),.65+Math.sin(opening*Math.PI)*.28+Math.cos(angle)*.3,Math.sin(angle)*.4);
    this.dummy.rotation.set(angle,side*.4,side*opening*.9);
    this.dummy.scale.setScalar(1);this.dummy.updateMatrix();this.shells.setMatrixAt(i,this.dummy.matrix);
   }
   this.shells.instanceMatrix.needsUpdate=true;
  }
  this.sparks.instanceMatrix.needsUpdate=true;
  this.rings.forEach((ring,i)=>{
   const t=age-1.05-i*.14;ring.visible=!reduced&&i===0&&t>0&&t<1;
   ring.position.y=.75+i*.35;ring.rotation.set(Math.PI/2+i*.45,0,i*.7);
   ring.scale.setScalar(.4+t*1.2);
   const mat=ring.material as T.MeshBasicMaterial;mat.color.set(color);mat.opacity=Math.max(0,1-t)*.65;
  });
 }
}
