import * as T from "three";
import { EGGS, RARITIES, MONGLES } from "./data";
import {appearanceOf,stageEggCells,type EggAppearance} from "./stage-eggs";
import { voxelModel, proceduralVoxelModel } from "./voxel";
const cube = new T.BoxGeometry(1, 1, 1);
const materials = RARITIES.map(() => new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));
const dummy = new T.Object3D();
const tint=new T.Color(),accent=new T.Color();
const palettes=[[0xaaff88,0xffa1cb,0xffef95],[0x7cf8ff,0xffd16b,0xb59aff],[0x67dfff,0xb7fff0,0xe2bcff],[0xff7a35,0xffd67c,0xff608e],[0x9e9aff,0xfff3b2,0x8cffff]];
const reducedMotion=typeof window!=='undefined'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
function aura(g:T.Group,tier:number,seed:number,family:number) {
  g.userData.tier=tier;g.userData.effectSeed=seed;g.userData.effectFamily=family;
  const sparks = new T.InstancedMesh(cube,materials[tier],g.userData.petId>=100?[2,3,4,6,8,10,14][tier]:[2,4,10,24,40,64,96][tier]);
  sparks.name='sparks'; sparks.frustumCulled=false;g.add(sparks);
  for(let i=0;i<sparks.instanceMatrix.count;i++){
    tint.set(RARITIES[tier].color).lerp(accent.setHex(palettes[family][(i+seed)%3]),tier>=3?.65:.2);
    if(tier===6&&i%5===0)tint.setHSL((i*.13+seed*.07)%1,.85,.72);
    sparks.setColorAt(i,tint);
  }
  // InstancedMesh starts with identity transforms: initialize before its first
  // render so an unanimated aura never covers the model with unit-sized cubes.
  animateEgg(g,0);
  return g;
}
export function eggVisual(type:number,appearance?:EggAppearance){
 const a=appearance&&appearanceOf(appearance);if(!a)return aura(voxelModel(`egg-${type}`),EGGS[type].tier,type,EGGS[type].region);
 const data=stageEggCells(a.stage,a.variant),model=proceduralVoxelModel(`stage-egg:${a.stage}:${a.variant}`,data.cells,data.colors);model.userData.appearance=`${a.stage}:${a.variant}`;return aura(model,EGGS[type].tier,a.stage*7+a.variant,(a.stage-1)%5);
}
export function animateEgg(g:T.Object3D,time:number,low=false){
  const sparks=g.getObjectByName('sparks') as T.InstancedMesh|undefined;
  if(!sparks)return;
  const tier=g.userData.tier??0,seed=g.userData.effectSeed??0,family=g.userData.effectFamily??0;
  const count=low?Math.ceil(sparks.instanceMatrix.count/3):sparks.instanceMatrix.count;
  if(reducedMotion?.matches)time=0;
  const t=time*(.65+(seed%5)*.08)+seed*.37,body=Math.max(1,g.userData.labelHeight??1);
  sparks.count=count;
  for(let i=0;i<count;i++){
    const a=i*2.399+t,phase=(i/count+t*.16)%1,r=.48+(i%3)*.12,size=tier>=3?.045:.03;
    let x=Math.cos(a)*r,y=.15+phase*body,z=Math.sin(a)*r,sx=size,sy=size,sz=size;
    if(tier>=3){
      if(family===0){ // Blossoms: five-lobed petal spirals.
        const petal=.5+.22*Math.cos(a*5);x=Math.cos(a)*petal;z=Math.sin(a)*petal;y=.2+phase*body*1.2;sx=size*2.4;sy=size*.6;
      }else if(family===1){ // Clockwork: tilted satellite belts and spokes.
        x=Math.cos(a)*.75;z=Math.sin(a)*.65;y=body*.65+Math.sin(a+(i%2)*Math.PI)*.4;sx=size*.6;sy=size*2.5;
      }else if(family===2){ // Tides: rising pearl helices and low ripples.
        const wave=.45+Math.sin(phase*Math.PI)*.4;x=Math.cos(a)*wave;z=Math.sin(a)*wave;y=.12+phase*body*1.5;sy=size*1.5;
      }else if(family===3){ // Embers: tapered flames with drifting comet tails.
        x=Math.cos(i*2.399)*(.7-phase*.4);z=Math.sin(i*2.399)*(.7-phase*.4);y=.1+phase*body*1.6;sx=size*(1-phase*.6);sy=size*(2+phase*3);sz=sx;
      }else{ // Constellations: intersecting star orbits.
        x=Math.cos(a)*.85;y=body*.65+Math.sin(a)*.6;z=Math.sin(a*.5+(i%3)*2)*.5;sx=i%4===0?size*3:size;sy=i%4===1?size*3:size;
      }
      if(tier>=4&&i%4===0){ // A segmented ground seal distinguishes rare nests.
        const seal=i/count*Math.PI*8-t*.4;x=Math.cos(seal)*.9;z=Math.sin(seal)*.9;y=.045;sx=.11;sy=.025;sz=.04;
      }
      if(tier>=5&&i%4===1){ // Twin luminous wings unfurl beside the body.
        const wing=(i%12)/12,side=i%2?1:-1;
        x=(i%8<4?-1:1)*(.4+wing*.7);y=body*(.6+wing*.7);z=-.25+Math.sin(t*.9)*.1*side;sx=.07;sy=.18+wing*.15;sz=.035;
      }
      if(tier===6&&i%4===2){ // Secret crowns and an upper celestial ring.
        const crown=i/count*Math.PI*8+t*.35;x=Math.cos(crown)*.5;z=Math.sin(crown)*.5;y=body*1.6+.1*Math.sin(crown*3);sx=.06;sy=i%3===0?.2:.08;sz=.06;
      }
    }
    if(g.userData.petId>=100){x=Math.cos(a)*.95;z=Math.sin(a)*.95;y=.04+(i%3)*.035;sy=.025;}
    dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(a*.4,a,a*.25);dummy.updateMatrix();sparks.setMatrixAt(i,dummy.matrix);
  }
  sparks.instanceMatrix.needsUpdate=true;
}
export function petVisual(id:number,rig=true){
  const pet=voxelModel(`pet-${id}`,rig);
  pet.userData.petId=id;
  // Measure the actual body before adding tall beams and particles.
  const bounds=new T.Box3().setFromObject(pet);
  pet.userData.labelHeight=bounds.max.y;
  return aura(pet,MONGLES[id].tier,id,(MONGLES[id].species+MONGLES[id].region)%5);
}
export function bossVisual(region:number){const g=voxelModel(`boss-${region}`,true);g.scale.setScalar(2.1);return g;}
