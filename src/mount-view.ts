import {WEIGHT_BALANCE} from './weight';
import {addPetAura,animateEgg} from './visuals';
import {MONGLES} from './data';
import * as T from 'three';
import {loadVoxels,voxelModel} from './voxel';
import {animatePet} from './pet-animation';

type Mount={id:number;size:number;root:T.Group;model?:T.Group;surfaces:T.Mesh[];lift:number;loading:boolean;retryAt:number};
/** The rider and mount share one transform, including concealment and peer visibility. */
export class MountView{
 private mounts=new WeakMap<T.Group,Mount>();
 private inverse=new T.Matrix4();
 private transform=new T.Matrix4();
 private surface=new T.Box3();
 private updateSeat(entry:Mount){
  // Measure animated physical parts in mount-local space, never world Y or aura bounds.
  entry.root.updateWorldMatrix(true,true);
  this.inverse.copy(entry.root.matrixWorld).invert();
  let top=-Infinity,highest=0;
  for(const mesh of entry.surfaces){
   this.transform.multiplyMatrices(this.inverse,mesh.matrixWorld);
   this.surface.copy(mesh.geometry.boundingBox!).applyMatrix4(this.transform);
   highest=Math.max(highest,this.surface.max.y);
   // Include the seated player's body and forward-folded legs, not just a single point.
   if(this.surface.max.x>=-.25&&this.surface.min.x<=.25&&this.surface.max.z>=-.35&&this.surface.min.z<=.35)
    top=Math.max(top,this.surface.max.y);
  }
  const seat=Number.isFinite(top)?top:highest;
  entry.lift=Math.max(.12,seat-.23+.06);
  entry.root.position.y=-entry.lift;
 }
 private async load(entry:Mount){
  entry.loading=true;
  try{
   await loadVoxels([`pet-${entry.id}`]);
   const model=voxelModel(`pet-${entry.id}`,true);
   const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3());
   model.traverse(part=>{if(part instanceof T.Mesh){part.geometry.computeBoundingBox();entry.surfaces.push(part);}});
   addPetAura(model,entry.id);
   const scale=MONGLES[entry.id].scale*entry.size*WEIGHT_BALANCE.petVisualScale;
   model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);model.updateMatrixWorld(true);
   entry.model=model;entry.root.add(model);this.updateSeat(entry);
  }catch{entry.retryAt=performance.now()+5000;}
  finally{entry.loading=false;}
 }
 update(avatar:T.Group,id:number|null,enabled:boolean,time:number,walking:boolean,reduced:boolean,size=1){
  let entry=this.mounts.get(avatar);
  if(entry&&(entry.id!==id||entry.size!==size)){entry.model?.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});avatar.remove(entry.root);this.mounts.delete(avatar);entry=undefined;}
  if(id===null)return 0;
  if(!entry){entry={id,size,root:new T.Group(),surfaces:[],lift:0,loading:false,retryAt:0};entry.root.name='riding-pet';avatar.add(entry.root);this.mounts.set(avatar,entry);}
  entry.root.visible=enabled;
  if(!entry.model&&!entry.loading&&performance.now()>=entry.retryAt)void this.load(entry);
  if(!enabled||!entry.model)return 0;
  animatePet(entry.model,id,time,walking,reduced);
  animateEgg(entry.model,reduced?0:time);
  if(walking&&!reduced)for(const [i,name] of ['left_leg','right_leg'].entries()){
   const leg=entry.model.getObjectByName(name);if(leg)leg.rotation.x+=Math.sin(time*9+i*Math.PI)*.25;
  }
  this.updateSeat(entry);
  return entry.lift;
 }
}
