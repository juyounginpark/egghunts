import * as T from 'three';
import { ROUTE,FINAL_GUARDIAN } from './stage-data';
import type { GameState, Boss } from './game';
import { voxelModel } from './voxel';
import {GuardianMotion} from './guardian-motion';


/** Articulated guardians; melee timing comes from the same state as collision. */
export class RegionGuardian {
 group=new T.Group();
 private mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial(),1200);
 private rimMaterial=new T.MeshBasicMaterial({color:0xff263e,side:T.BackSide,depthWrite:false});
 private effects=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({transparent:true,opacity:.65,depthWrite:false}),768);
 private reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 private modes=Array<string>(21).fill('idle');private wakeAt=Array<number>(21).fill(-Infinity);
 private gait=Array<number>(21).fill(0);
 private characters=new Map<number,T.Group>();
 private stage=0;private dummy=new T.Object3D();private color=new T.Color();
 private headings=Array<number>(21).fill(NaN);private roots=Array.from({length:21},()=>({x:NaN,z:NaN}));private lastTime=0;
 private samples=new Map<number,{state:Boss;stage:number;at:number}>();
 private motion=Array.from({length:21},()=>new GuardianMotion());
 constructor(){this.group.add(this.mesh,this.effects);this.mesh.castShadow=true;this.mesh.frustumCulled=this.effects.frustumCulled=false;this.mesh.count=this.effects.count=0;}
 render(game:GameState,time:number,visible:boolean){
  this.group.visible=visible;if(!visible)return;this.stage=game.stage.id;
  for(const character of this.characters.values())character.visible=false;
  let index=0,effectIndex=0;const dt=Math.max(0,Math.min(.1,time-this.lastTime)),reduced=this.reducedMotion.matches;this.lastTime=time;
  for(let k=0;k<game.bosses.length;k++){
   const state=game.bosses[k],stage=state.stageId??game.stage.id,chasing=state.mode==='chase',sleeping=state.mode==='idle'||state.mode==='waking',root=this.roots[k];
   if(chasing&&this.modes[k]!=='chase')this.wakeAt[k]=time;
   this.modes[k]=state.mode;
   let sample=this.samples.get(k);
   const reset=!Number.isFinite(root.x)||sample?.stage!==stage||Math.hypot(root.x-state.x,root.z-state.z)>30;
   if(reset){root.x=state.x;root.z=state.z;this.headings[k]=NaN;this.motion[k].reset();}
   if(!sample||sample.state!==state||reset){
    sample={state,stage,at:time};
    this.samples.set(k,sample);
    if(game.roomManaged)this.motion[k].sample(state.x,state.z,game.roomSnapshotTime||time,time);
   }
   const sampleAge=Math.max(0,time-sample.at);
   const waking=state.mode==='waking',wakeRemaining=Math.max(0,(state.wakeRemaining??ROUTE.bossWakeSeconds)-(game.roomManaged?Math.min(sampleAge,.5):0));
   const wakeProgress=waking?Math.max(0,Math.min(1,1-wakeRemaining/ROUTE.bossWakeSeconds)):chasing?1:0;
   const rise=wakeProgress*wakeProgress*(3-2*wakeProgress);
   const scale=ROUTE.bossBaseScale*(state.final?FINAL_GUARDIAN.scale:1)*(1+(ROUTE.bossAngryScale-1)*rise);
   const tx=state.x,tz=state.z;
   const moveX=tx-root.x,moveZ=tz-root.z;
   const displayed=game.roomManaged?this.motion[k].position(dt,time):{x:tx,z:tz};
   root.x=displayed.x;root.z=displayed.z;
   const z=root.z;if(Math.abs(z-game.z)>(state.final?40:23))continue;


   const x=root.x,hover=[3,5,6,7,12,15,19,20].includes(stage);
   const u=chasing?Math.min(1,(state.windup??0)/ROUTE.bossWindup):0;
   const charge=u*u*(3-2*u),breath=reduced?0:Math.sin(time*1.5+k)*.035;
   this.gait[k]+=dt*(sleeping?.7+10.3*rise:chasing?11:1.8);
   const stride=this.gait[k]+k,bounce=!reduced?Math.abs(Math.sin(stride))*.13*rise:0;
   let target=sleeping&&!waking?0:Math.atan2(game.x-x,game.z-z);
   if(state.mode==='return'){
    const dx=state.loot?(state.loot.homeX??0)-x:moveX;
    const dz=state.loot?(state.loot.homeZ??state.homeZ??-17)-z:moveZ;
    target=Math.hypot(dx,dz)>.001?Math.atan2(dx,dz):Number.isFinite(this.headings[k])?this.headings[k]:0;
   }
   if(!Number.isFinite(this.headings[k]))this.headings[k]=target;
   const delta=Math.atan2(Math.sin(target-this.headings[k]),Math.cos(target-this.headings[k]));
   this.headings[k]+=delta*(1-Math.exp(-dt*(waking?rise*4:state.mode==='return'?12:4)));
   const angle=this.headings[k],cs=Math.cos(angle),sn=Math.sin(angle);
   const characterKey=state.final?20:stage-1;
   let character=this.characters.get(characterKey);
   if(!character){
    character=voxelModel(state.final?'guardian-final':`guardian-${stage}`,true);
    character.userData.stage=stage;
    const meshes:T.Mesh[]=[];character.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
    character.userData.surfacePatches=meshes.reduce((n,m)=>n+m.geometry.getAttribute('position').count/6,0);
    for(const mesh of meshes){const rim=new T.Mesh(mesh.geometry,this.rimMaterial);rim.name='anger-rim';rim.scale.setScalar(1.055);mesh.add(rim);}
    this.characters.set(characterKey,character);this.group.add(character);
   }
   character.visible=true;
   character.position.set(x,(breath+bounce+(hover&&!reduced?Math.sin(time*1.2+k)*.14*rise:0))*scale,z);
   character.rotation.set(-charge*.1,angle,0);
   character.scale.set(2.8*scale,2.8*scale*(sleeping?.78+.22*rise:1),2.8*scale);
   character.traverse(part=>{
    if(!(part instanceof T.Group))return;
    const side=part.name.startsWith('left_')?-1:1;
    const limb=/_(leg|arm|wing)$/.test(part.name);
    part.rotation.x=limb&&!reduced?Math.sin(stride+side)*(.08+.22*rise):0;
    if(part.name==='head')part.rotation.x=-charge*.15;
    if(part.name==='crown'||part.name==='tail')part.rotation.y=reduced?0:Math.sin(time*(.6+stage*.025))*.055*(sleeping?.4:1);
   });
   const eyes=character.getObjectByName('eyes');if(eyes)eyes.scale.y=sleeping?.12+.88*rise:1;
   character.traverse(o=>{if(o.name==='anger-rim')o.visible=rise>.05;});
   // Sleeping Zs become a red anger mark as the guardian wakes.
   const glyph=(xx:number,yy:number,w:number,h:number,c:number)=>{this.dummy.position.set(x+xx*scale,yy*scale,z);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(w*scale,h*scale,.1*scale);this.dummy.updateMatrix();this.mesh.setMatrixAt(index,this.dummy.matrix);this.mesh.setColorAt(index++,this.color.setHex(c));};
   if(state.final){glyph(0,3.8,1.8,.18,0xffd36b);for(const xx of [-.7,0,.7])glyph(xx,4,.18,.45,0xffd36b);}
   if(sleeping&&rise<.5){for(let j=0;j<2;j++){const xx=.7+j*.35,yy=2.9+j*.4+(reduced?0:Math.sin(time+j)*.08);glyph(xx,yy,.3,.06,0xe9edd6);glyph(xx,yy+.22,.3,.06,0xe9edd6);for(let k=0;k<3;k++)glyph(xx-.1+k*.1,yy+.05+k*.06,.09,.07,0xe9edd6);}}
   else if(chasing){for(const xx of [-.32,0,.32]){glyph(xx,3.5,.16,.5,0xff6658);glyph(xx,3.1,.16,.13,0xff6658);}}
   if(chasing&&!reduced){
    const effect=(xx:number,yy:number,zz:number,w:number,h:number,d:number,color:number)=>{
     this.dummy.position.set(xx,yy,zz);this.dummy.rotation.set(0,angle,0);this.dummy.scale.set(w,h,d);this.dummy.updateMatrix();
     this.effects.setMatrixAt(effectIndex,this.dummy.matrix);this.effects.setColorAt(effectIndex++,this.color.setHex(color));
    };
    const age=time-this.wakeAt[k];
    if(age>=0&&age<.85){
     const radius=(.6+age*5)*scale;
     for(let j=0;j<20;j++){const a=j*Math.PI/10;effect(x+Math.sin(a)*radius,.12,z+Math.cos(a)*radius,.38*scale,.12*scale,.38*scale,j%2?0xff643c:0xffca6a);}
    }
    const dustCount=game.save.settings.quality==='low'?4:10;
    for(let j=0;j<dustCount;j++){
     const phase=(time*1.7+j/dustCount)%1,back=(.8+phase*2.8)*scale,side=(j%2?1:-1)*(.5+phase*.6)*scale,size=(1-phase)*.3*scale;
     effect(x-sn*back+cs*side,(.12+phase*.45)*scale,z-cs*back-sn*side,size,size*.7,size*(j%3===0?3:1),j%3===0?0xff9155:0xe4bd8a);
    }
   }
  }
  this.stage=game.stage.id;
  this.mesh.count=index;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
  this.effects.count=effectIndex;this.effects.instanceMatrix.needsUpdate=true;if(this.effects.instanceColor)this.effects.instanceColor.needsUpdate=true;
 }
 metrics(){const visible=Array.from(this.characters.values()).filter(c=>c.visible);return {stage:this.stage,parts:visible.find(c=>c.userData.stage===this.stage)?.userData.surfacePatches??0,visibleParts:visible.reduce((n,c)=>n+c.userData.surfacePatches,0),pose:visible.flatMap(c=>{c.updateMatrix();return c.matrix.toArray();})};}
 dispose(){for(const mesh of [this.mesh,this.effects]){mesh.geometry.dispose();(mesh.material as T.Material).dispose();}this.rimMaterial.dispose();this.characters.clear();this.group.removeFromParent();}
}
