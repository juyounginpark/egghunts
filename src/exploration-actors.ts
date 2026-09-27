import * as T from 'three';
import type {GameState} from './game';
import {stagePatterns,environmentPlacement} from './stage-data';
import {environmentState} from './environment-state';
import {speedPads} from './speed-pads';
/** Shared instance pools for authoritative environmental hazard states. */
export class ExplorationActors{
 group=new T.Group();
 private mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial(),4096);
 private marks=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({transparent:true,opacity:.85,depthWrite:false}),4096);
 private dummy=new T.Object3D();private color=new T.Color();private count=0;private marked=0;
 constructor(){this.group.add(this.mesh,this.marks);this.mesh.castShadow=true;this.mesh.frustumCulled=this.marks.frustumCulled=false;this.mesh.count=this.marks.count=0;}
 private block(x:number,y:number,z:number,w:number,h:number,d:number,c:number,angle=0,mark=false){
  const mesh=mark?this.marks:this.mesh,index=mark?this.marked++:this.count++;if(index>=mesh.instanceMatrix.count)return;
  this.dummy.position.set(x,y,z);this.dummy.scale.set(w,h,d);this.dummy.rotation.set(0,angle,0);this.dummy.updateMatrix();mesh.setMatrixAt(index,this.dummy.matrix);mesh.setColorAt(index,this.color.setHex(c));
 }
 private ring(x:number,z:number,r:number,c:number,y=.08,rz=r){for(let i=0;i<32;i++){const t=i*Math.PI/16;this.block(x+Math.cos(t)*r,y,z+Math.sin(t)*rz,.12,.035,.08,c,0,true);}}
 render(g:GameState,time:number,visible:boolean){
  this.group.visible=visible;if(!visible)return;this.count=this.marked=0;
  const now=g.environmentTime??g.now(),orange=0xffb665,red=0xe76e59,cream=0xe5d9b8,dark=0x323c49;
  for(const [lane,d] of stagePatterns(g.stage.id).entries()){
   const base=environmentPlacement(g.stage.id,lane,g.stageOffset);if(Math.abs(base.z-g.z)>32)continue;
   const h=environmentState(d,lane,g.stageOffset,now),active=h.phase==='Active',warning=h.phase==='Telegraph',recovery=h.phase==='Recovery';
   const col=active?red:orange,x=h.target.x,z=h.target.z;
   if(d.movement==='wall'){
    if(active||warning)for(const side of [-1,1]){const cx=x+side*2.8;this.block(cx,.06,z,2.4,.05,d.width*2,col,0,true);if(active)this.block(cx,.8,z,2.4,1.6,d.width*2,d.visual==='void'?0x716078:0x86cacc);}
   }else{
    if(active||warning)this.ring(x,z,d.radius,col,.09,d.radius*.75);
    if(warning&&d.movement==='cross')for(let j=-6;j<=6;j++)this.block(base.x+j*.5,.07,base.z,.3,.03,.1,orange,0,true);
    if(d.movement==='floor'){
     this.block(x,.02,z,d.radius*1.7,.04,d.radius*1.3,d.visual==='lava'?0xf28c57:0xc595ab);
     for(let j=0;j<5;j++)this.block(x+Math.sin(j*2)*.4,.1+Math.sin(time+j)*.015,z+Math.cos(j*2)*.3,.2,.08,.15,d.visual==='lava'?0xffc478:0xe7bec8);
    }else if(d.movement==='drop'){
     const falling=warning?Math.max(0,1-(d.telegraphDuration-h.elapsed)/(d.visual==='meteor'?.5:.18)):0;
     const y=active?.25:recovery?.25+2.5*Math.min(1,h.elapsed/Math.max(.1,d.recoveryDuration??.4)):2.75-2.5*falling*falling+(warning?Math.sin(time*13)*.025:0);
     if(d.visual==='dinosaur'){this.block(x,y+.3,z,1.6,.6,1.3,0x859c70);for(const dx of [-.5,0,.5])this.block(x+dx,y,z+.6,.35,.2,.5,cream);}
     else if(d.visual==='pillow'){this.block(x,y+.15,z,1.8,.3,1.3,0xd8bed4);this.block(x,y+.35,z,1.45,.15,1,cream);}
     else if(d.visual==='book'){this.block(x,y+.15,z,1.4,.3,1,0x947367);this.block(x,y+.32,z,1.3,.1,.9,cream);}
     else if(d.visual==='icicle'){this.block(x,y+.3,z,.8,.65,.8,0xa5d6de);this.block(x,y+.7,z,.4,.3,.4,0xdae8e7);}
     else {this.block(x,y+.35,z,1.7,.7,1.2,d.visual==='meteor'?0x9994a6:0x768188);this.block(x,y+.75,z,1.3,.15,.85,cream);}
    }else if(d.movement==='cross'&&(active||warning)){
     const color=g.stage.id===13?0xe4eeee:g.stage.id===7?0xc4ad84:g.stage.id===20?0xa98a65:g.stage.accent;
     this.block(x,.55,z,1.2,1.05,1,color,time*2);
     for(const sign of [-1,1])this.block(x+sign*.25,.7,z+.52,.14,.18,.04,dark);
    }else if(active){
     // Visible plume stays strictly inside the contact ellipse.
     for(let j=0;j<7;j++)this.block(x+Math.sin(j*2)*.4,.2+j*.2,z+Math.cos(j*2)*.25,.3,.3,.25,d.visual==='lightning'?0xf1c975:0xbbcdbf);
    }
   }
  }
  if(g.speedPad.blend>1.005&&!g.death&&!g.isAtBase){
   for(let i=1;i<=3;i++)this.block(g.x-g.facing.x*i*.2,.08,g.z-g.facing.z*i*.2,.3,.04,.12,0xb4edda,0,true);
  }
  for(const p of speedPads(g.stage.id))if(g.speedPad.inside.includes(p.id)){
   const z=p.z-g.stageOffset;for(const side of [-1,1])this.block(p.x+side*1.15,p.height+.09,z,.07,.025,1.3,0xb4edda,0,true);
  }
  for(const [mesh,count] of [[this.mesh,this.count],[this.marks,this.marked]] as const){mesh.count=Math.min(count,mesh.instanceMatrix.count);mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 }
 dispose(){for(const m of [this.mesh,this.marks]){m.geometry.dispose();(m.material as T.Material).dispose();}this.group.removeFromParent();}
}
