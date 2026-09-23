import * as T from "three";
import { EGGS, RARITIES, MONGLES } from "./data";
import {appearanceOf,stageEggCells,type EggAppearance} from "./stage-eggs";
import { voxelModel, proceduralVoxelModel } from "./voxel";
const cube = new T.BoxGeometry(1, 1, 1);
const materials = RARITIES.map(r => new T.MeshBasicMaterial({color:r.color,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false}));
const dummy = new T.Object3D();
function aura(g:T.Group,tier:number) {
  g.userData.tier=tier;
  const sparks = new T.InstancedMesh(cube,materials[tier],[2,4,8,16,28,48,80][tier]);
  sparks.name='sparks'; sparks.frustumCulled=false;g.add(sparks);
  if(tier>=4){
    const beam=new T.Mesh(cube,materials[tier]);beam.name='beam';beam.scale.set(.13,2.4,.13);beam.position.y=1.4;g.add(beam);
  }
  return g;
}
export function eggVisual(type:number,appearance?:EggAppearance){
 const a=appearance&&appearanceOf(appearance);if(!a)return aura(voxelModel(`egg-${type}`),EGGS[type].tier);
 const data=stageEggCells(a.stage,a.variant),model=proceduralVoxelModel(`stage-egg:${a.stage}:${a.variant}`,data.cells,data.colors);model.userData.appearance=`${a.stage}:${a.variant}`;return aura(model,EGGS[type].tier);
}
export function animateEgg(g:T.Object3D,time:number,low=false){
  const sparks=g.getObjectByName('sparks') as T.InstancedMesh|undefined;
  if(!sparks)return;
  const tier=g.userData.tier??0,count=low?Math.ceil(sparks.instanceMatrix.count/3):sparks.instanceMatrix.count;
  sparks.count=count;
  for(let i=0;i<count;i++){
    const a=i*2.399+time*(.4+tier*.1),radius=.4+(i%3)*.12;
    dummy.position.set(Math.cos(a)*radius,.1+((i/count+time*.18)%1)*(tier>=4?2:1),Math.sin(a)*radius);
    dummy.scale.setScalar((tier>=4?.065:.035)*(1+(i%3)*.3));dummy.rotation.set(a,0,a);dummy.updateMatrix();sparks.setMatrixAt(i,dummy.matrix);
  }
  sparks.instanceMatrix.needsUpdate=true;
  const beam=g.getObjectByName('beam');if(beam)beam.scale.x=beam.scale.z=.08+Math.sin(time*3)*.03;
}
export function petVisual(id:number,rig=true){
  const pet=voxelModel(`pet-${id}`,rig);
  // Measure the actual body before adding tall beams and particles.
  const bounds=new T.Box3().setFromObject(pet);
  pet.userData.labelHeight=bounds.max.y;
  return aura(pet,MONGLES[id].tier);
}
export function bossVisual(region:number){const g=voxelModel(`boss-${region}`,true);g.scale.setScalar(2.1);return g;}
