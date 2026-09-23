import { STAGES } from "./stage-data";
import * as T from "three";
import { ConnectedRegionArt } from "./region-art";
import { RegionGuardian } from "./region-guardian";
import type {GameState} from "./game";
/** Shared cube pools: no mesh per voxel, no allocation per attack. */
export class HazardView{
 group=new T.Group();
 regions=new ConnectedRegionArt();guardians=new RegionGuardian();
 private warnings=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({transparent:true,opacity:.75,depthWrite:false,depthTest:false}),1536);
 private actors=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial(),1024);
 private dummy=new T.Object3D();private color=new T.Color();private warningCount=0;private actorCount=0;
 constructor(){this.group.add(this.regions.group,this.guardians.group,this.warnings,this.actors);for(const m of [this.warnings,this.actors])m.frustumCulled=false;this.warnings.renderOrder=10;this.actors.castShadow=true;}
 private put(mesh:T.InstancedMesh,index:number,x:number,y:number,z:number,w:number,h:number,d:number,color:number,rotation=0){
  if(index>=mesh.instanceMatrix.count)return;
  this.dummy.position.set(x,y,z);this.dummy.scale.set(w,h,d);this.dummy.rotation.set(0,rotation,0);this.dummy.updateMatrix();mesh.setMatrixAt(index,this.dummy.matrix);mesh.setColorAt(index,this.color.setHex(color));
 }
 render(game:GameState,visible:boolean,time:number){
  this.group.visible=visible;if(!visible)return;this.regions.render(game,time,true);this.guardians.render(game,time,true);
  this.warningCount=this.actorCount=0;
  for(const h of game.hazards.attacks){
   if(!['Telegraph','Active','Recovery'].includes(h.phase)||h.elapsed<0)continue;
   const d=h.definition,active=h.phase==='Active',recover=h.phase==='Recovery',color=d.damage+d.damagePercent===0?0x7bcfe3:d.visual==='creation'?0xffd454:active?0xff654c:0xffbd65;
   const cube=(x:number,z:number,w=.15,depth=.15)=>{if(!recover)this.put(this.warnings,this.warningCount++,x,.07,z,w,.06,depth,color);};
   if(d.shape==='ellipse'||d.shape==='ring')for(let i=0;i<40;i++){const a=i/40*Math.PI*2;if(d.shape==='ring'&&Math.abs(Math.atan2(Math.sin(a-h.angle),Math.cos(a-h.angle)))<.8)continue;const r=d.shape==='ring'&&active?d.radius*h.elapsed/d.activeDuration:d.radius;cube(h.target.x+Math.cos(a)*r,h.target.z+Math.sin(a)*r*(d.shape==='ellipse'?.75:1));}
   if(d.shape==='line')for(let i=-20;i<=20;i++){for(const side of [-1,1]){const along=i/20*d.length/2;cube(h.target.x+Math.cos(h.angle)*along-Math.sin(h.angle)*d.width*side,h.target.z+Math.sin(h.angle)*along+Math.cos(h.angle)*d.width*side);}}
   if(d.shape==='cone')for(let i=0;i<=30;i++){const a=h.angle-Math.PI/3+i/30*Math.PI*2/3;cube(h.origin.x+Math.cos(a)*d.radius,h.origin.z+Math.sin(a)*d.radius);}
   if(!active&&!recover){const left=Math.max(0,1-h.elapsed/h.warning);this.put(this.actors,this.actorCount++,h.target.x,2.6,h.target.z,.15,left*.7+.05,.15,color);}
   const progress=Math.min(1,h.elapsed/h.warning),fall=T.MathUtils.smoothstep(progress,.65,1),a=active||recover?1:Math.max(.15,progress),y=active||recover?.3:1.8*(1-fall)+.3;
   const fade=recover?Math.max(0,1-h.elapsed/.4):1;
   const piece=(x:number,yy:number,z:number,w:number,hh:number,dd:number,c=STAGES[d.stageId-1].accent)=>this.put(this.actors,this.actorCount++,x,yy,z,w*fade,hh*fade,dd*fade,c);
   if(['tentacle','sweep','vine','hand','void','scorpion'].includes(d.visual)){
    for(let j=0;j<10;j++){
     const bend=Math.sin(j*.35+(1-fall)*.8)*.65,xx=h.target.x+bend,yy=y+j*.2*a;
     piece(xx,yy,h.target.z,.48-j*.027,.27,.48-j*.027);
     if(d.visual==='tentacle'||d.visual==='sweep')piece(xx,yy,h.target.z+.25,.15,.12,.08,0xffdfc0);
     if(d.visual==='vine'&&j%2===0)piece(xx+.28,yy,h.target.z,.5,.1,.3,0xa0c975);
    }
    if(d.visual==='hand'||d.visual==='void'){piece(h.target.x+.4,y+1.7*a,h.target.z,.9,.55,.3);for(let j=0;j<4;j++)piece(h.target.x+(j-1)*.23,y+2.1*a,h.target.z,.17,.65,.2);}
    if(d.visual==='scorpion')piece(h.target.x+.6,y+2*a,h.target.z,.18,.35,.18,0x39344a);
   }else if(d.visual==='mantis'){
    for(const side of [-1,1]){piece(h.origin.x+side*.7,1.1,h.origin.z,.2,1.4,.25);for(let j=0;j<6;j++)piece(h.origin.x+side*(.7-j*.08),y,h.origin.z+j*.25,.18,.15,.3,0xffedcf);}
   }else if(d.visual==='steam'||d.visual==='coral'){
    if(active)for(let j=0;j<14;j++){const t=time*2+j*.6,r=d.visual==='steam'?.3:j*.12;piece(h.target.x+Math.sin(t)*r,d.visual==='steam'?(j*.25+time*.7)%2.8:.15,h.target.z+Math.cos(t)*r,.3+j*.025,d.visual==='steam'?.25:.08,.3+j*.025,d.visual==='steam'?0xe1d9cc:0xcaefe1);}
   }else if(['lightning','laser','solar'].includes(d.visual)){
    if(active)for(let j=0;j<10;j++){const along=(j/9-.5)*d.length;piece(h.target.x+Math.cos(h.angle)*along,d.shape==='ellipse'?j*.4:.5,h.target.z+Math.sin(h.angle)*along,.25,.8,.25,color);}
   }else if(['ufo','magnet','drone'].includes(d.visual)){
    const bob=Math.sin(time*1.8)*.08;
    if(d.visual==='magnet'){piece(h.target.x,3+bob,h.target.z,1.3,.25,.4,0xc3a46d);for(const side of [-1,1])piece(h.target.x+side*.55,2.65+bob,h.target.z,.25,.7,.4,0xc9796b);}
    else {piece(h.target.x,2.8+bob,h.target.z,1.7,.3,d.visual==='drone'?.6:1.7);piece(h.target.x,3.1+bob,h.target.z,.7,.4,.7);if(d.visual==='drone')for(const side of [-1,1])piece(h.target.x+side,3+bob,h.target.z,.8,.05,.2,0x88e7e5);}
    if(active)for(let j=0;j<6;j++)piece(h.target.x,.3+j*.4,h.target.z,.2,.2,.2,color);
   }else if(['book','train','gear','raptor','hay','orb'].includes(d.visual)){
    const x=d.visual==='orb'?h.origin.x:h.target.x,z=d.visual==='orb'?h.origin.z:h.target.z;
    if(d.visual==='book'){piece(x,y,z,.8,.15,.6,0xc18583);piece(x,y+.1,z,.72,.08,.53,0xffefcf);piece(x-.37,y+.06,z,.08,.22,.62,0x8a677c);}
    else if(d.visual==='train'){piece(x,y+.25,z,1.5,.55,.7,0xe7b966);piece(x+.4,y+.75,z,.5,.6,.75,0xcc8275);piece(x-.45,y+.75,z,.16,.6,.18,0x48495d);for(const dx of [-.5,.5])for(const dz of [-.4,.4])piece(x+dx,y-.1,z+dz,.32,.3,.15,0x465164);}
    else if(d.visual==='gear'){for(let j=0;j<12;j++)piece(x+Math.cos(j*Math.PI/6+time*2)*.7,y,z+Math.sin(j*Math.PI/6+time*2)*.7,.3,.3,.3,0xe2b767);piece(x,y,z,.85,.25,.85,0xa58b70);}
    else if(d.visual==='raptor'){piece(x,y+.35,z,1.1,.55,.55,0x7d996b);piece(x+.55,y+.7,z,.5,.5,.45);for(const side of [-1,1]){piece(x-.2,y-.05,z+side*.28,.2,.7,.2,0x7d996b);piece(x-.75,y+.35,z+side*.05,.7,.2,.15);}piece(x+.81,y+.8,z+.15,.06,.1,.1,0xffffff);}
    else {piece(x,y,z,1,.7,1,d.visual==='hay'?0xe4c97a:game.stage.accent);for(let j=0;j<4;j++)piece(x+Math.cos(j*1.57+time)*.55,y-.2,z+Math.sin(j*1.57+time)*.55,.2,.2,.2);}
   }else if(['ice','icicle','meteor','dinosaur','crusher','club'].includes(d.visual)){
    const x=h.target.x,z=h.target.z;
    if(d.visual==='ice'){for(let j=0;j<6;j++)piece(x+Math.sin(j*2)*.65,.1,z+Math.cos(j*2)*.5,.6,.12,.5,0xbfe8f2);}
    else if(d.visual==='icicle'){for(let j=0;j<6;j++)piece(x,y+.2+j*.22,z,.15+j*.09,.25,.15+j*.09,0xbdebf2);}
    else if(d.visual==='crusher'){piece(x,y+.5,z,2,.7,1.3,0x6d7a80);for(let j=0;j<5;j++)piece(x+(j-2)*.35,y+.9,z,.18,.1,1.35,j%2?0xe9bb68:0x424659);}
    else if(d.visual==='dinosaur'){piece(x,y+.3,z,1.1,.7,1.3,0x7c9971);for(let j=0;j<3;j++)piece(x+(j-1)*.35,y,z+.7,.22,.2,.4,0xffe8bb);}
    else if(d.visual==='club'){piece(x,y+.6,z,.6,1.6,.6,0x9a7a61);for(let j=0;j<4;j++)piece(x+.35,y+.2+j*.35,z,.18,.15,.3,0xf1d394);}
    else {piece(x,y+.35,z,.85,.9,.85,0xa698bf);piece(x-.18,y+.8,z,.5,.25,.6,0xd9c1e3);}
   }else if(d.visual==='clock'){
    for(let j=0;j<12;j++){const t=j*Math.PI/6;piece(h.target.x+Math.sin(t)*.6,1.3+Math.cos(t)*.6,h.target.z,.18,.18,.15,0xe9bb75);}
    piece(h.target.x,1.3,h.target.z,.9,.9,.08,0xffebd4);
    for(let j=1;j<=4;j++)piece(h.target.x+Math.sin(-time)*j*.1,1.3+Math.cos(-time)*j*.1,h.target.z+.1,.07,.07,.05,0x645375);
   }else if(d.visual==='statue'){
    piece(h.target.x,.8,h.target.z,.7,1.4,.6,0xb4bab0);piece(h.target.x,1.7,h.target.z,.65,.6,.6,0xd6d6ba);
    for(let j=0;j<7;j++){const t=j*Math.PI/3.5;piece(h.target.x+Math.sin(t)*.45,2+Math.cos(t)*.25,h.target.z,.15,.5,.18,0x829b79);}
    for(const side of [-1,1])piece(h.target.x+side*.18,1.75,h.target.z+.34,.12,.1,.06,active?0xf3d077:0x597661);
   }else if(d.visual==='flame'){
    const bob=Math.sin(time*3+h.member)*.13;for(let j=0;j<5;j++)piece(h.target.x+Math.sin(time*2+j)*j*.05,1+bob+j*.17,h.target.z,.6-j*.09,.2,.6-j*.09,j<2?0xffcf82:0x83c7c1);
    for(const side of [-1,1])piece(h.target.x+side*.15,1.2+bob,h.target.z+.31,.1,.1,.06,0xfff0d2);
   }else if(['web','puddle','sand','ink'].includes(d.visual)){
    for(let j=0;j<24;j++){const r=(j%4+1)*.23,t=j*2.4;piece(h.target.x+Math.cos(t)*r,.12,h.target.z+Math.sin(t)*r,.28,.035,.28,d.visual==='web'?0xeee3c7:d.visual==='puddle'?0xa9cd63:d.visual==='ink'?0x51496b:0xd5be8b);}
   }else if(d.visual!=='creation'){piece(h.target.x,y,h.target.z,.7,.7,.7);piece(h.target.x-.22,y+.35,h.target.z+.35,.15,.15,.1,0xffffff);piece(h.target.x+.22,y+.35,h.target.z+.35,.15,.15,.1,0xffffff);}
  }
  for(const d of game.dustDrops)this.put(this.actors,this.actorCount++,d.x,.3,d.z,.2,.2,.2,0xffda58);
  const age=(game.now()-game.hitAt)/1000;if(age>=0&&age<.6)for(let i=0;i<12;i++){const a=i/12*Math.PI*2;this.put(this.actors,this.actorCount++,game.x+Math.cos(a)*age*2,.6+Math.sin(age*5),game.z+Math.sin(a)*age*2,.12,.12,.12,0xffea9c);}
  for(const [m,n] of [[this.warnings,this.warningCount],[this.actors,this.actorCount]] as const){m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
 }
 dispose(){this.regions.dispose();this.guardians.dispose();for(const m of [this.warnings,this.actors]){m.geometry.dispose();(m.material as T.Material).dispose();}this.group.removeFromParent();}
}
