import {legacyTheme} from './stage-order';
import * as T from 'three';
import { ROUTE } from './stage-data';
import { buildRegionLayout,type Block,type Motion } from './region-layout';
import type { GameState } from './game';

export class RegionArt {
 group=new T.Group();
 private ground=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial(),18000);
 private moving=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial(),2400);
 private blocks:Block[]=[];private motions:Motion[]=[];private stage=0;private dummy=new T.Object3D();private color=new T.Color();
 private buckets=new Map<number,Block[]>();private visibleBand=Infinity;
 private count=0;
 constructor(){this.group.add(this.ground,this.moving);this.ground.receiveShadow=true;this.moving.castShadow=true;this.ground.frustumCulled=this.moving.frustumCulled=false;this.ground.count=this.moving.count=0;}
 private put(mesh:T.InstancedMesh,i:number,b:Block,x=0,y=0,z=0,angle=0,roll=0){
  if(i>=mesh.instanceMatrix.count)throw Error('Region instance budget exceeded');
  const cs=Math.cos(angle),sn=Math.sin(angle),px=b.x*Math.cos(roll)-b.y*Math.sin(roll),py=b.x*Math.sin(roll)+b.y*Math.cos(roll);this.dummy.position.set(x+px*cs-b.z*sn,y+py,z+px*sn+b.z*cs);this.dummy.scale.set(b.w,b.h,b.d);this.dummy.rotation.set(0,-angle-(b.angle??0),roll+(b.roll??0));this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);mesh.setColorAt(i,this.color.setHex(b.c));
 }
 private build(stage:number,length=ROUTE.length){
  this.stage=stage;const layout=buildRegionLayout(stage,length);this.blocks=layout.blocks;this.motions=layout.motions;
  this.buckets.clear();this.visibleBand=Infinity;
  for(const p of this.blocks){const key=Math.floor(p.z/16);if(!this.buckets.has(key))this.buckets.set(key,[]);this.buckets.get(key)!.push(p);}
 }
 renderSection(stage:number,offset:number,length:number,playerZ:number,time:number){
  this.group.visible=true;this.group.position.z=-offset;
  if(this.stage!==stage)this.build(stage,length);
  const band=Math.floor((playerZ+offset)/16);
  if(band!==this.visibleBand){
   this.visibleBand=band;let count=0;
   for(let key=band-3;key<=band+3;key++)for(const p of this.buckets.get(key)??[])this.put(this.ground,count++,p);
   this.ground.count=count;this.ground.instanceMatrix.needsUpdate=true;if(this.ground.instanceColor)this.ground.instanceColor.needsUpdate=true;
  }
  this.count=0;
  for(const m of this.motions){
   if(Math.abs(m.z-offset-playerZ)>32)continue;
   const slow=[5,14,15,19,20].includes(legacyTheme(stage)),t=time*(slow?.45:stage===2?.8:1)+m.phase;
   const turn=stage===2?Math.floor(t*4)/4:t;
   const angle=m.kind==='spin'?turn*.4:m.kind==='windmill'?0:Math.sin(t*.8)*.09;
   const rising=[4,13,16].includes(legacyTheme(stage)),phase=(t*.22)%1;
   const y=m.y+(m.kind==='float'?(rising?Math.sin(phase*Math.PI)*.5:Math.sin(t*1.1)*.18):0);
   const x=m.x+(m.kind==='float'?Math.sin(t*.6)*.3:0);
   for(const p of m.blocks)this.put(this.moving,this.count++,p,x,y,m.z,angle,m.kind==='windmill'?t*.5:0);
  }
  this.moving.count=this.count;this.moving.instanceMatrix.needsUpdate=true;if(this.moving.instanceColor)this.moving.instanceColor.needsUpdate=true;
 }
 metrics(){return {stage:this.stage,blocks:this.ground.count,moving:this.moving.count,assemblies:this.motions.length,elementTypes:15,endWall:this.stage===20};}
 dispose(){for(const m of [this.ground,this.moving]){m.geometry.dispose();(m.material as T.Material).dispose();}this.group.removeFromParent();}
}

/** Three recycled sections keep both sides of a boundary in view without loading 20 worlds. */
export class ConnectedRegionArt {
 group=new T.Group();private sections=Array.from({length:3},()=>new RegionArt());private active=0;
 constructor(){this.group.add(...this.sections.map(s=>s.group));}
 render(game:GameState,time:number,visible:boolean){
  this.group.visible=visible;if(!visible)return;this.active=game.stage.id;
  const nearby=game.route.filter(r=>r.stage>=this.active-1&&r.stage<=this.active+1);
  for(const s of this.sections)s.group.visible=false;
  for(const r of nearby)this.sections[r.stage%3].renderSection(r.stage,r.offset,r.end-r.start,game.z,time);
 }
 metrics(){const current=this.sections[this.active%3].metrics();return {...current,sections:this.sections.filter(s=>s.group.visible).map(s=>s.metrics().stage)};}
 dispose(){for(const s of this.sections)s.dispose();this.group.removeFromParent();}
}
