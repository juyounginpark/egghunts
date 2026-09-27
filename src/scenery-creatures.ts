import * as T from 'three';
import type {GameState} from './game';
import {BALANCE} from './data';
import {STAGE_PET_ROWS} from './stage-pet-catalog';
import {pathX,routeLength,terrainAt} from './exploration-route';
import {loadVoxels,voxelModel} from './voxel';
import {animatePet} from './pet-animation';

// Existing official same-stage designs; these are scenery instances, not owned pets.
const slots=[
 [0,1,3,4,8],[0,2,3,5,9],[0,1,3,4,6],[0,2,3,5,8],
 [1,2,4,5,8],[0,1,2,6,8],[0,1,3,4,9],[0,1,4,6,8],
 [0,1,2,5,7],[0,1,3,6,8],[0,2,3,5,9],[0,2,4,6,9],
 [0,1,2,3,7],[0,2,4,8,9],[0,1,3,5,8],[0,1,3,5,8],
 [0,1,2,4,6],[0,1,2,4,8],[0,1,3,4,6],[0,1,3,6,7],
];
export function sceneryCreatureIds(stage:number){
 return slots[stage-1].map(slot=>100+STAGE_PET_ROWS.findIndex(p=>p.stageId===stage&&p.slot===slot));
}
type Creature={id:number;root:T.Group;model:T.Group;x:number;z:number;homeX:number;homeZ:number;targetX:number;targetZ:number;wait:number;down:number;fallSide:number;recoilX:number;recoilZ:number;phase:number;seed:number;center:number;side:number;ground:number;legs:(T.Object3D|undefined)[]};
type StageScene={stage:number;group:T.Group;creatures:Creature[];loading:boolean;retryAt:number};

/** Client-only decorative wildlife. No GameState mutation, commands or persistence. */
export class SceneryCreatures{
 readonly group=new T.Group();
 private stages=new Map<number,StageScene>();
 private start=0;
 private lastSwing=-Infinity;
 private random(c:Creature){c.seed=(Math.imul(c.seed,1664525)+1013904223)>>>0;return c.seed/4294967296;}
 private async populate(scene:StageScene){
  scene.loading=true;
  try{
   const ids=sceneryCreatureIds(scene.stage);
   await loadVoxels(ids.map(id=>`pet-${id}`));
   if(this.stages.get(scene.stage)!==scene)return;
   for(const [i,id] of ids.entries()){
    const model=voxelModel(`pet-${id}`,true),root=new T.Group();root.add(model);
    const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    const scale=Math.min((.85+i*.06)/Math.max(.01,size.y),1.35/Math.max(.01,size.x,size.z));
    model.scale.setScalar(scale);model.position.copy(center).multiplyScalar(-scale);
    const z=-6-routeLength(scene.stage)*[.15,.31,.47,.64,.79][i],x=pathX(scene.stage,z)+(i%2?1:-1)*3.7;
    root.name=`scenery-${scene.stage}-${i}`;root.userData.petId=id;scene.group.add(root);
    scene.creatures.push({id,root,model,x,z,homeX:x,homeZ:z,targetX:x,targetZ:z,wait:.5+i*.3,down:0,fallSide:1,recoilX:0,recoilZ:0,phase:i,seed:scene.stage*101+i*7919,center:size.y*scale/2,side:size.x*scale/2,ground:terrainAt(scene.stage,x,z).height,legs:['left_leg','right_leg'].map(n=>model.getObjectByName(n))});
   }
  }catch{scene.group.clear();scene.creatures=[];scene.retryAt=performance.now()/1000+5;}
  finally{scene.loading=false;}
 }
 update(game:GameState,dt:number,time:number,visible:boolean,swingAt:number,reduced:boolean){
  this.group.visible=visible&&!game.isAtBase;
  if(this.start!==game.progression.stage){
   this.group.clear();this.stages.clear();this.start=game.progression.stage;this.lastSwing=swingAt;
  }
  const hit=Number.isFinite(swingAt)&&swingAt!==this.lastSwing&&game.now()-swingAt>=0&&game.now()-swingAt<350;
  this.lastSwing=swingAt;
  if(!this.group.visible)return;
  const localZ=game.z+game.stageOffset,active=[game.stage.id];
  if(localZ>-21&&game.stage.id>this.start)active.push(game.stage.id-1);
  if(localZ<-6-routeLength(game.stage.id)+15&&game.stage.id<20)active.push(game.stage.id+1);
  for(const [stage,scene] of this.stages)if(!active.includes(stage)){this.group.remove(scene.group);scene.group.clear();this.stages.delete(stage);}
  for(const stage of active){
   let scene=this.stages.get(stage);
   if(!scene){scene={stage,group:new T.Group(),creatures:[],loading:false,retryAt:0};this.stages.set(stage,scene);this.group.add(scene.group);}
   if(!scene.loading&&!scene.creatures.length&&performance.now()/1000>=scene.retryAt)void this.populate(scene);
   const offset=(stage-this.start)*48;
   for(const c of scene.creatures){
    const dx=c.x-game.x,dz=c.z-offset-game.z,distance=Math.hypot(dx,dz);
    if(hit&&!game.carried&&!game.death&&c.down<=0&&distance<=BALANCE.batRange&&(distance<.01||(dx*game.facing.x+dz*game.facing.z)/distance>=BALANCE.batFacingThreshold)){
     c.down=2.1;c.fallSide=dx<0?-1:1;c.recoilX=dx/(distance||1)*.45;c.recoilZ=dz/(distance||1)*.45;
    }
    let walking=false,roll=0;
    if(c.down>0){
     const before=c.down;c.down=Math.max(0,c.down-dt);
     const fall=Math.min(1,(2.1-c.down)/.18),rise=Math.min(1,c.down/.45);
     roll=c.fallSide*Math.PI/2*Math.min(fall,rise);
     const shove=Math.max(0,Math.min(before,2.1)-Math.max(c.down,1.92))/.18;
     c.x+=c.recoilX*shove;c.z+=c.recoilZ*shove;
     c.targetX=c.x;c.targetZ=c.z;c.wait=.6;
    }else if(c.wait>0)c.wait=Math.max(0,c.wait-dt);
    else{
     let tx=c.targetX-c.x,tz=c.targetZ-c.z,l=Math.hypot(tx,tz);
     if(l<.08){
      const a=this.random(c)*Math.PI*2,r=.7+this.random(c)*1.1;
      c.targetX=c.homeX+Math.cos(a)*r;c.targetZ=c.homeZ+Math.sin(a)*r;c.wait=.8+this.random(c)*1.8;
     }else{
      const step=Math.min(l,dt*(.45+(c.id%5)*.08));c.x+=tx/l*step;c.z+=tz/l*step;walking=true;
      const yaw=Math.atan2(tx,tz),difference=Math.atan2(Math.sin(yaw-c.root.rotation.y),Math.cos(yaw-c.root.rotation.y));
      c.root.rotation.y+=difference*(1-Math.exp(-dt*7));
     }
    }
    c.root.visible=Math.abs(c.z-offset-game.z)<18;
    if(!c.root.visible)continue;
    const ground=terrainAt(stage,c.x,c.z).height;c.ground+=(ground-c.ground)*(1-Math.exp(-dt*15));
    c.phase+=dt*(walking?9:1.5);
    const hop=!reduced&&walking?Math.abs(Math.sin(c.phase))*.035:0;
    c.root.position.set(c.x,c.ground+c.center+(c.side-c.center)*Math.abs(Math.sin(roll))+hop,c.z-offset);
    c.root.rotation.z=roll;
    animatePet(c.model,c.id,time+c.id*.17,walking,reduced||c.down>0);
    if(walking&&!reduced)for(const [i,leg] of c.legs.entries())if(leg)leg.rotation.x+=Math.sin(c.phase+i*Math.PI)*.22;
   }
  }
 }
}
