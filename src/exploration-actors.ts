import * as T from 'three';
import type {GameState} from './game';
import {MOB_TYPES} from './exploration-catalog';
import {stagePatterns,environmentPlacement,STAGES} from './stage-data';
import {environmentState} from './environment-state';
import {explorationHeight} from './exploration-route';
import {mobProjectiles,mobSight} from './mobs';
import {speedPads} from './speed-pads';
/** Shared instance pools for forty enemy designs and authoritative hazard states. */
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
  const now=g.now(),orange=0xffb665,red=0xe76e59,cream=0xe5d9b8,dark=0x323c49;
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
  for(const m of g.mobs){
   if(Math.abs(m.z-g.z)>28||Math.abs(m.stage-g.stage.id)>1)continue;
   const dead=m.phase==='dead',age=(now-m.at)/1000;if(dead&&age>.6)continue;
   const d=MOB_TYPES[m.type],s=STAGES[m.stage-1],scale=dead?Math.max(0,1-age/.6):1;
   const y=explorationHeight(m.x,m.z,g.progression.stage),angle=Math.atan2(m.aimX-m.x,m.aimZ-m.z),cs=Math.cos(angle),sn=Math.sin(angle);
   const pulse=m.phase==='warning'?Math.sin(age*9)*.035:m.phase==='hit'?-Math.max(0,.18-age*.3):0;
   const part=(x:number,yy:number,z:number,w:number,h:number,depth:number,c:number)=>this.block(m.x+(x*cs+z*sn)*scale,y+(yy+pulse)*scale,m.z+(-x*sn+z*cs)*scale,w*scale,h*scale,depth*scale,c,angle);
   const color=['snow','pillow'].includes(d.form)?cream:['robot','drone','turret','gear','eye'].includes(d.form)?0x7b8990:s.accent;
   part(0,.45,0,.7,.6,.65,color);part(0,.8,.15,.55,.4,.45,color);
   for(const side of [-1,1]){part(side*.15,.84,.39,.09,.1,.04,dark);part(side*.16,.95,.4,.18,.04,.04,red);}
   switch(d.form){
    case 'sprout':case 'vine':case 'seed':for(const side of [-1,1]){part(side*.25,1.2,0,.5,.12,.22,0x779b66);part(side*.43,.5,.2,.25,.15,.15,0x8b7351);}break;
    case 'bug':case 'ant':case 'gear':for(const side of [-1,1])for(const z of [-.25,0,.25])part(side*.45,.18,z,.35,.12,.1,dark);part(0,.55,-.35,.55,.55,.6,d.form==='gear'?0xb29665:0x98704c);break;
    case 'crab':for(const side of [-1,1]){part(side*.6,.55,.25,.45,.35,.4,color);part(side*.6,.68,.45,.08,.18,.12,dark);part(side*.4,.15,-.1,.5,.15,.12,dark);}break;
    case 'bird':case 'moth':case 'drone':case 'star':for(const side of [-1,1])part(side*.6,.65+Math.sin(time*3)*.05,0,.65,.15,.5,color);part(0,.8,.5,.18,.15,.25,cream);break;
    case 'dog':case 'lizard':for(const side of [-1,1]){part(side*.25,.15,.1,.15,.3,.2,dark);part(side*.22,1.15,0,.16,.3,.15,color);}part(0,.4,-.6,.2,.15,.7,color);break;
    case 'jar':case 'cup':case 'kettle':part(0,1.1,0,.8,.15,.6,cream);part(.5,.65,0,.2,.5,.15,color);if(d.form==='kettle')part(-.5,.7,.15,.4,.2,.2,color);break;
    case 'book':case 'goblin':case 'ghost':part(0,.5,0,.9,.65,.15,cream);for(const side of [-1,1])part(side*.5,.55,.1,.4,.13,.1,color);break;
    case 'eye':case 'turret':part(0,.75,.4,.45,.35,.15,dark);part(0,.8,.5,.18,.18,.1,red);if(d.form==='turret')part(0,.75,.65,.25,.2,.45,color);break;
    case 'soldier':case 'robot':part(0,1.1,0,.75,.2,.55,dark);for(const side of [-1,1])part(side*.4,.55,.1,.18,.4,.18,cream);break;
    case 'squid':case 'jelly':for(const side of [-1,1])for(const z of [-.2,.2])part(side*.3,.15,z,.15,.3,.15,color);break;
    case 'flame':case 'liquid':part(0,1.1,0,.35,.5,.3,color);break;
    case 'snow':case 'sand':case 'rock':part(0,.3,0,.9,.5,.85,color);break;
    case 'pillow':case 'block':part(0,.5,0,1,.6,.8,color);part(0,.86,0,.75,.13,.65,cream);break;
   }
   if(!dead){this.block(m.x,y+1.5,m.z,.95,.08,.06,dark);this.block(m.x-(1-m.hp/m.maxHp)*.475,y+1.5,m.z,.95*m.hp/m.maxHp,.08,.07,0xe69a76);}
   if(m.phase==='warning'){
    const dx=m.aimX-m.fromX,dz=m.aimZ-m.fromZ,l=Math.hypot(dx,dz)||1;
    if(d.kind==='projectile'||d.kind==='dash'){
     const reach=d.kind==='dash'?d.active*3+1.15:l;
     for(let i=0;i<=16;i++)for(const side of [-1,1])this.block(m.fromX+dx/l*i*reach/16-dz/l*side*.45,y+.07,m.fromZ+dz/l*i*reach/16+dx/l*side*.45,.1,.04,.1,orange,0,true);
    }else{
     const r=d.kind==='cone'?1.6:1.15,a=Math.atan2(dz,dx);
     for(let i=0;i<=24;i++){const t=a-Math.PI/3+i*Math.PI/36;this.block(m.x+Math.cos(t)*r,y+.07,m.z+Math.sin(t)*r,.1,.04,.1,orange,0,true);}
     for(const side of [-1,1])for(let i=1;i<8;i++)this.block(m.x+Math.cos(a+side*Math.PI/3)*r*i/8,y+.07,m.z+Math.sin(a+side*Math.PI/3)*r*i/8,.1,.04,.1,orange,0,true);
    }
   }
   for(const p of mobProjectiles(m,now))if(mobSight(g,{x:m.fromX,z:m.fromZ},p))this.block(p.x,y+.55,p.z,.45,.4,.45,s.accent);
   if(m.phase==='active'&&d.kind!=='projectile')part(0,.5,.8,.8,.25,.3,red);
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
