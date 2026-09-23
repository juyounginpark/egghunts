import * as T from 'three';
import { STAGES, ROUTE } from './stage-data';
import type { GameState } from './game';

type Part={x:number;y:number;z:number;w:number;h:number;d:number;color:number;joint:number;eye?:boolean};
/** Articulated guardians; melee timing comes from the same state as collision. */
export class RegionGuardian {
 group=new T.Group();
 private mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial(),1200);
 private recipes=new Map<number,Part[]>();
 private parts:Part[]=[];private stage=0;private dummy=new T.Object3D();private color=new T.Color();
 private headings=Array<number>(20).fill(NaN);private roots=Array.from({length:20},()=>({x:NaN,z:NaN}));private lastTime=0;
 constructor(){this.group.add(this.mesh);this.mesh.castShadow=true;this.mesh.frustumCulled=false;this.mesh.count=0;}
 private build(stage:number){
  this.stage=stage;this.parts=[];const s=STAGES[stage-1],c=s.color,a=s.accent,cream=0xffefd0,dark=0x353347,gold=0xe8bc68;
  const b=(x:number,y:number,z:number,w:number,h:number,d:number,color=c,joint=0)=>this.parts.push({x,y,z,w,h,d,color,joint});
  const eyes=(y:number,z:number,spread=.3)=>{for(const side of [-1,1]){b(side*spread,y,z,.23,.24,.12,cream);this.parts.at(-1)!.eye=true;b(side*spread,y,z+.07,.09,.13,.06,dark);this.parts.at(-1)!.eye=true;}};
  const legs=(n:number,col=c)=>{for(let j=0;j<n;j++){const side=j%2?1:-1;b(side*.5,.45,Math.floor(j/2)*.65-.3,.3,.9,.35,col,j+1);b(side*.5,.12,Math.floor(j/2)*.65-.15,.4,.2,.5,col,j+1);}};
  const crown=(y:number)=>{b(0,y,0,1.1,.2,.8,gold);for(const x of [-.4,0,.4])b(x,y+.2,0,.18,.4,.25,gold);};
  const arms=(y:number,col=c)=>{for(const side of [-1,1]){b(side*.85,y,0,.4,1,.4,col,side<0?1:2);b(side*.85,y-.5,.1,.45,.4,.5,col,side<0?1:2);}};
  switch(stage){
  case 1: // Garden tortoise: low shell, four feet, flowering back.
   b(0,.8,0,1.7,.8,1.8,0x8eac67);b(0,1.25,-.15,1.3,.5,1.3,0xbed184);b(0,.8,1,.8,.65,.65,0xc8bc83);legs(4,0xb8aa7b);eyes(.95,1.36);
   for(let j=0;j<5;j++){const x=Math.sin(j*2.4)*.5,z=Math.cos(j*2.4)*.5;b(x,1.6,z,.12,.3,.12,0x729253);b(x,1.8,z,.3,.14,.3,j%2?0xffc1bd:gold);}
   break;
  case 2: // Clockwork bear, wind-up key and wheeled feet.
   b(0,1.05,0,1.2,1.1,.9,0xc89367);b(0,1.9,0,1.15,.8,.9,0xd5aa7b);for(const x of [-.5,.5])b(x,2.35,0,.35,.4,.35,0xc89367);b(0,1.7,.55,.5,.35,.25,cream);eyes(2,.49);crown(2.5);arms(1.2,0xc89367);legs(2,dark);b(0,1.2,-.7,.8,.15,.2,gold,3);b(0,1.2,-.7,.15,.8,.2,gold,3);
   break;
  case 3: // Shallow-water umbrella octopus: rounded bell, fins and short webbed arms.
   for(let j=0;j<4;j++)b(0,1.05+j*.22,0,1.55-j*.25,.25,1.3-j*.18,j%2?0xefb9b2:0xe6a7a3);
   eyes(1.25,.69,.35);
   for(const side of [-1,1]){b(side*.85,1.6,-.05,.55,.18,.65,a,side<0?1:2);b(side*1.08,1.7,-.05,.18,.15,.45,cream,side<0?1:2);}
   for(let j=0;j<8;j++){const t=j*Math.PI/4;for(let k=0;k<3;k++){const r=.45+k*.22;b(Math.cos(t)*r,.85-k*.12,Math.sin(t)*r,.35,.18,.35,0xefb7ad,j+1);}}
   break;
  case 5: // Tall mantle and eight long, separately phased, sucker-lined tentacles.
   b(0,1.8,0,1.7,1.5,1.5,0x72659b);b(0,2.55,-.1,1.2,.3,1.1,a);eyes(1.8,.79,.43);
   for(let j=0;j<8;j++){const t=j*Math.PI/4;for(let k=0;k<5;k++){const r=.7+k*.26;b(Math.cos(t)*r,.8-k*.11,Math.sin(t)*r,.4-k*.045,.32,.4-k*.045,0x8c79b2,j+1);if(k%2===0)b(Math.cos(t)*r,.65-k*.11,Math.sin(t)*r,.16,.08,.16,cream,j+1);}}
   break;
  case 4:
   b(0,.75,0,1.2,.9,1.8,0x716974);b(0,1.05,.9,.9,.65,.8,0x8a7c7c);eyes(1.2,1.33);legs(4,0x68606a);for(let j=0;j<4;j++)b(0,1.3,-.6+j*.4,.3,.5,.3,a);for(let j=0;j<4;j++)b(.1*j,.6-j*.08,-1-j*.28,.5-j*.08,.4,.4,c,j+1);
   break;
  case 6: // Haunted headmaster: book head, cloak and ruler.
   b(0,1.1,0,1.1,1.5,.6,0x586572);b(0,2.15,0,1.1,.8,.6,0x8b7486);b(0,2.15,.33,.85,.65,.08,cream);eyes(2.3,.4);arms(1.5,0x586572);b(-1,1.5,.1,.13,1.6,.14,gold,1);b(0,2.6,0,1.4,.16,.8,dark);b(0,.5,0,1.45,.4,.8,0x78838b);break;
  case 7: // Patrol drone with four independently tilting rotors.
   b(0,1.7,0,1.3,.55,1,0x526381);b(0,1.65,.56,.85,.16,.12,a);b(0,1.62,.64,.2,.12,.06,cream);
   for(let j=0;j<4;j++){const x=j%2?1:-1,z=j<2?-.7:.7;b(x*.7,1.75,z,.65,.15,.18,dark);b(x*1.1,1.9,z,.75,.08,.15,a,j+1);b(x*1.1,1.85,z,.18,.18,.4,dark);}break;
  case 8: // Scorpion: six legs, two pincers, arched segmented tail.
   b(0,.7,0,1.1,.6,1.5,gold);eyes(.85,.8);for(let j=0;j<6;j++){const x=j%2?1:-1,z=Math.floor(j/2)*.5-.5;b(x*.85,.35,z,.9,.18,.18,gold,j+1);}
   for(const side of [-1,1]){b(side*.9,.8,.9,.35,.3,.9,gold,side<0?1:2);for(const dx of [-.16,.16])b(side*.9+dx,.85,1.4,.16,.35,.45,a,side<0?1:2);}
   for(let j=0;j<6;j++)b(0,.8+j*.24,-.9-Math.sin(j*.55)*.55,.35,.35,.35,gold,j+1);b(0,2.3,-.7,.2,.35,.2,dark,6);break;
  case 9:
   b(0,1.3,0,1.4,1.5,1.5,0x719569);b(0,2.2,.75,1.1,.9,1.4,0x89a579);eyes(2.35,1.48,.35);b(0,1.95,1.3,.9,.2,.55,cream);legs(2,0x61865c);arms(1.4,0x89a579);for(let j=0;j<5;j++)b(Math.sin(j*.4)*.15,1-j*.12,-1-j*.33,.65-j*.1,.5-j*.07,.5,c,j+1);break;
  case 10:
   b(0,1,0,1.25,1.2,1,0x829ea0);b(0,1.95,0,1.3,.85,1,0x99b6b4);eyes(2.1,.54,.36);for(const x of [-.45,.45])b(x,2.5,0,.23,.55,.23,gold);b(0,1.7,.6,.5,.2,.2,cream);legs(2,dark);arms(1.3,0x829ea0);b(1.1,1.4,.15,.35,1.8,.35,0x997a65,2);for(let j=0;j<4;j++)b(1.1,1+j*.3,.38,.55,.12,.12,gold,2);break;
  case 11:
   b(0,1.2,0,1.1,1.8,.8,cream);b(0,2.35,0,.8,.8,.7,0xd4b79a);eyes(2.4,.4);b(0,2.05,.48,.65,.5,.2,cream);arms(1.6,cream);crown(2.8);b(-1.1,1.5,0,.12,2.5,.12,gold,1);for(let j=0;j<4;j++)b(-1.1+(j%2)*.2,2.9-j*.22,0,.3,.25,.15,gold,1);break;
  case 12:
   b(0,1.8,0,2.7,.3,2.2,0x939bab);b(0,2.15,0,1.3,.6,1.1,0x94c6ae);for(let j=0;j<8;j++){const t=j*Math.PI/4;b(Math.cos(t)*1.1,1.68,Math.sin(t)*.85,.2,.15,.2,a,j+1);}b(0,1.5,0,.5,.3,.5,a);eyes(2.2,.6);break;
  case 13:
   b(0,1.15,0,1.35,1.45,.9,0xa1805d);b(0,2.2,0,.95,.7,.8,gold);eyes(2.25,.45);b(0,2.65,0,1.3,.16,1,dark);b(0,2.85,0,.75,.4,.65,dark);arms(1.4,gold);legs(2,dark);for(const x of [-.35,.35]){b(x,1.2,.5,.3,.5,.12,cream);b(x,2,-.6,.2,1.6,.2,gold);}break;
  case 14:
   b(0,1,0,1.6,1.2,1.3,0xaacfdc);b(0,1.95,.25,1.25,.85,1,0xe4eeee);eyes(2,.81,.35);legs(4,0x96bbc9);for(const side of [-1,1]){b(side*.65,1.6,.9,.18,.8,.18,cream);b(side*.65,1.3,1.12,.18,.2,.45,cream);}for(let j=0;j<3;j++)b((j-1)*.4,1.8,-.4,.25,.8,.3,a);break;
  case 15:
   b(0,1.4,0,1.4,1.2,1,0xb19ac5);b(0,2.25,.1,1.1,.85,.8,0xd6bddc);eyes(2.3,.55);for(const x of [-.4,.4])b(x,2.9,0,.25,.7,.3,c,x<0?1:2);arms(1.5,c);b(0,.8,0,1.65,.35,1.1,a);for(let j=0;j<4;j++)b(Math.sin(j*2)*.6,.5-j*.08,Math.cos(j*2)*.3,.3,.3,.3,c,j+1);break;
  case 16:
   b(0,.55,0,1.2,.9,1.2,0x71865c);b(0,1.2,0,.45,1.1,.45,0x819960);b(0,1.9,0,1.5,.75,1.1,a);eyes(2,.6,.38);b(0,1.65,.62,.95,.2,.12,dark);for(let j=0;j<7;j++){const t=j*Math.PI*2/7;b(Math.sin(t),1.9+Math.cos(t)*.65,0,.6,.55,.4,0xc9cb76,j+1);}for(let j=0;j<6;j++)b(Math.sin(j*2)*1.1,.2,Math.cos(j*2)*1.1,.8,.2,.3,c,j+1);break;
  case 17:
   b(0,1.35,0,.55,1.6,.65,0x92b06b);b(0,2.3,.2,1,.55,.6,0xafc77e);eyes(2.35,.55,.35);for(const side of [-1,1]){b(side*.3,2.8,.1,.08,.6,.08,dark);b(side*.75,1.7,.2,.3,.9,.25,c,side<0?1:2);b(side*.8,1.35,.6,.15,.2,1,cream,side<0?1:2);}for(let j=0;j<4;j++){const side=j%2?1:-1;b(side*.65,.55,Math.floor(j/2)*.65-.4,.2,1.2,.18,c,j+3);}b(0,1,-.7,.8,.5,1.2,c);break;
  case 18:
   b(0,1.3,0,1.5,1.4,1,dark);b(0,2.35,0,1,.65,.8,0xa2aba9);eyes(2.4,.45);b(0,1.4,.55,.8,.65,.1,gold);legs(2,0x89908f);for(const side of [-1,1]){b(side*1.1,1.6,0,.5,1,.5,gold,side<0?1:2);for(const dx of [-.2,.2])b(side*1.1+dx,1,.1,.17,.5,.35,0xc77969,side<0?1:2);}break;
  case 19:
   b(0,1.65,0,1.1,1.6,.8,0x8c94bd);b(0,2.7,0,.8,.75,.8,cream);eyes(2.7,.44);arms(1.9,0x939bc4);b(0,1,0,1.6,.3,1.2,c);for(let j=0;j<12;j++){const t=j*Math.PI/6;b(Math.sin(t)*1.5,1.6,Math.cos(t)*1.1,.17,.17,.17,gold,j+1);}crown(3.15);break;
  case 20:
   b(0,1.6,0,1.05,1.8,.65,cream);b(0,2.75,0,.75,.75,.65,gold);eyes(2.8,.4);arms(1.9,cream);for(const side of [-1,1])for(let j=0;j<5;j++)b(side*(.9+j*.3),2.3-j*.22,-.2,.35,1-j*.12,.18,j%2?gold:cream,side<0?1:2);for(let j=0;j<9;j++){const t=j*Math.PI*2/9;b(Math.cos(t)*.65,3.4+Math.sin(t)*.15,Math.sin(t)*.3,.16,.16,.16,gold);}break;
  }
  this.recipes.set(stage,this.parts);
 }
 render(game:GameState,time:number,visible:boolean){
  this.group.visible=visible;if(!visible)return;this.stage=game.stage.id;
  let index=0;const dt=Math.max(0,Math.min(.1,time-this.lastTime));this.lastTime=time;
  for(let k=0;k<game.bosses.length;k++){
   const state=game.bosses[k],stage=state.stageId??game.stage.id,chasing=state.mode==='chase',sleeping=state.mode==='idle',root=this.roots[k];
   const tx=state.x+(sleeping?-2.6:0),tz=state.z+(sleeping?-4:0);
   if(!Number.isFinite(root.x)||Math.hypot(root.x-tx,root.z-tz)>30){root.x=tx;root.z=tz;}
   root.x=tx;root.z=tz;
   const z=root.z;if(Math.abs(z-game.z)>23)continue;
   if(!this.recipes.has(stage))this.build(stage);
   this.parts=this.recipes.get(stage)!;
   const x=root.x+Math.sin(time*.35+k)*.12,hover=[3,5,6,7,12,15,19,20].includes(stage);
   const u=chasing?Math.min(1,(state.windup??0)/ROUTE.bossWindup):0;
   const charge=u*u*(3-2*u),breath=Math.sin(time*1.5+k)*.035;
   const target=sleeping?0:Math.atan2(game.x-x,game.z-z);
   if(!Number.isFinite(this.headings[k]))this.headings[k]=target;
   const delta=Math.atan2(Math.sin(target-this.headings[k]),Math.cos(target-this.headings[k]));
   this.headings[k]+=delta*(1-Math.exp(-dt*4));
   const angle=this.headings[k],cs=Math.cos(angle),sn=Math.sin(angle);
   for(const p of this.parts){
    const swing=p.joint?Math.sin(time*(sleeping?.7:stage===7?16:chasing?7:1.8)+p.joint*.85)*(chasing?.2:.11):0;
    const px=p.x+ (p.joint?Math.sign(p.x)*charge*.15:0),py=p.y*(sleeping?.78:1)+breath+swing+(hover&&!sleeping?Math.sin(time*1.2+k)*.14:0),pz=p.z+(p.joint?Math.sin(time*1.5+p.joint)*.09:0)-charge*.15;
    const voidPart=stage===20&&z+(stage-game.progression.stage)*ROUTE.length>-35,partColor=voidPart?(p.color===0xe8bc68?0x9d86bd:0x3b344b):p.color;
    this.dummy.position.set(x+px*cs+pz*sn,py,z-px*sn+pz*cs);this.dummy.rotation.set(p.joint?swing-charge*.18:0,angle,0);this.dummy.scale.set(p.w,sleeping&&p.eye?.04:p.h,p.d);this.dummy.updateMatrix();this.mesh.setMatrixAt(index,this.dummy.matrix);this.mesh.setColorAt(index++,this.color.setHex(sleeping&&p.eye?0x353347:partColor));
   }
   // Sleeping Zs become a red anger mark as the guardian wakes.
   const glyph=(xx:number,yy:number,w:number,h:number,c:number)=>{this.dummy.position.set(x+xx,yy,z);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(w,h,.1);this.dummy.updateMatrix();this.mesh.setMatrixAt(index,this.dummy.matrix);this.mesh.setColorAt(index++,this.color.setHex(c));};
   if(sleeping){for(let j=0;j<2;j++){const xx=.7+j*.35,yy=2.9+j*.4+Math.sin(time+j)*.08;glyph(xx,yy,.3,.06,0xe9edd6);glyph(xx,yy+.22,.3,.06,0xe9edd6);for(let k=0;k<3;k++)glyph(xx-.1+k*.1,yy+.05+k*.06,.09,.07,0xe9edd6);}}
   else if(chasing){glyph(0,3.5,.15,.45,0xff6658);glyph(0,3.13,.15,.12,0xff6658);}
  }
  this.stage=game.stage.id;
  this.mesh.count=index;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
 }
 metrics(){return {stage:this.stage,parts:this.parts.length,visibleParts:this.mesh.count,pose:Array.from(this.mesh.instanceMatrix.array.slice(0,Math.min(this.mesh.count,12)*16))};}
 dispose(){this.mesh.geometry.dispose();(this.mesh.material as T.Material).dispose();this.group.removeFromParent();}
}
