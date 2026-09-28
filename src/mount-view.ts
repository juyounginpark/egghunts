import {addPetAura,animateEgg} from './visuals';
import {MONGLES} from './data';
import * as T from 'three';
import {loadVoxels,voxelModel} from './voxel';
import {animatePet} from './pet-animation';

type Mount={id:number;size:number;root:T.Group;model?:T.Group;lift:number;loading:boolean;retryAt:number};
/** The rider and mount share one transform, including concealment and peer visibility. */
export class MountView{
 private mounts=new WeakMap<T.Group,Mount>();
 private async load(entry:Mount){
  entry.loading=true;
  try{
   await loadVoxels([`pet-${entry.id}`]);
   const model=voxelModel(`pet-${entry.id}`,true);
   const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
   addPetAura(model,entry.id);
   const scale=MONGLES[entry.id].scale*entry.size;
   model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);model.updateMatrixWorld(true);
   // Only torso geometry defines the saddle height; horns, heads and wings do not.
   const torso=model.getObjectByName('body'),back=new T.Box3();
   torso?.children.forEach(child=>{if(child instanceof T.Mesh)back.union(new T.Box3().setFromObject(child));});
   const seat=back.isEmpty()?size.y*scale*.6:back.max.y;
   entry.lift=Math.max(.12,seat-.23);
   entry.model=model;entry.root.add(model);entry.root.position.y=-entry.lift;
  }catch{entry.retryAt=performance.now()+5000;}
  finally{entry.loading=false;}
 }
 update(avatar:T.Group,id:number|null,enabled:boolean,time:number,walking:boolean,reduced:boolean,size=1){
  let entry=this.mounts.get(avatar);
  if(entry&&(entry.id!==id||entry.size!==size)){entry.model?.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});avatar.remove(entry.root);this.mounts.delete(avatar);entry=undefined;}
  if(id===null)return 0;
  if(!entry){entry={id,size,root:new T.Group(),lift:0,loading:false,retryAt:0};entry.root.name='riding-pet';avatar.add(entry.root);this.mounts.set(avatar,entry);}
  entry.root.visible=enabled;
  if(!entry.model&&!entry.loading&&performance.now()>=entry.retryAt)void this.load(entry);
  if(!enabled||!entry.model)return 0;
  animatePet(entry.model,id,time,walking,reduced);
  animateEgg(entry.model,reduced?0:time);
  if(walking&&!reduced)for(const [i,name] of ['left_leg','right_leg'].entries()){
   const leg=entry.model.getObjectByName(name);if(leg)leg.rotation.x+=Math.sin(time*9+i*Math.PI)*.25;
  }
  return entry.lift;
 }
}
