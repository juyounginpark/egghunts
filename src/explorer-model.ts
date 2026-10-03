import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {APPEARANCE_OPTIONS,appearanceIndex,normalizeAppearance,type ExplorerAppearance} from './explorer-appearance';

/** Reuse the existing rig and merge decorations into its meshes: no per-voxel draws. */
export function applyExplorerAppearance(rig:T.Object3D,value:ExplorerAppearance){
 const a=normalizeAppearance(value),color=(key:'skinId'|'hairColorId'|'accentColorId')=>APPEARANCE_OPTIONS[key].find(o=>o.id===a[key])!.color!;
 const skin=color('skinId'),hair=color('hairColorId'),accent=color('accentColorId'),outfit=appearanceIndex(a,'outfitId'),style=appearanceIndex(a,'hairId'),face=appearanceIndex(a,'faceId'),accessory=appearanceIndex(a,'accessoryId'),pack=appearanceIndex(a,'backpackId');
 const cloth=['#b9bc87','#65854d','#aa895b','#536c94','#ad6d65','#748796','#dbc358','#deddd1'][outfit],ink='#34362e';
 const palette=['#FFF0CA','#789851','#384A36','#986D48','#F5AC99','#CEE291','#FFFFFF','#E8B855'].map(c=>new T.Color(c));
 const parts=['body','head','left_arm','right_arm','left_leg','right_leg','left_hand','right_hand','left_foot','right_foot'];
 for(const part of parts){
  const group=rig.getObjectByName(part);const mesh=group?.children.find(o=>o instanceof T.Mesh) as T.Mesh|undefined;if(!mesh)continue;
  const original=(mesh.userData.explorerSource??=mesh.geometry) as T.BufferGeometry;
  const pieces:T.BufferGeometry[]=[];
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:string)=>{const g=new T.BoxGeometry(w/18,h/18,d/18).toNonIndexed();g.translate(x/18,y/18,z/18);const rgb=new T.Color(c),data=[];for(let i=0;i<g.getAttribute('position').count;i++)data.push(rgb.r,rgb.g,rgb.b);g.setAttribute('color',new T.Float32BufferAttribute(data,3));g.deleteAttribute('uv');pieces.push(g);};
  if(part==='head'){
   box(0,3,0,10,7,9,skin);
   box(0,7,0,11,2,10,hair);
   // Chunky blocks share the same fixed head pivot and silhouette budget.
   if([0,1,2,3,8,9,10].includes(style))box(style===10?-3:0,5.7,4.4,style===2?4:10,style===1?3:1.5,1.5,hair);
   if([4,5,6,7,11].includes(style)){box(-5,3,-.5,2,style===5?9:6,8,hair);box(5,3,-.5,2,style===5?9:6,8,hair);}
   if(style===2||style===10)box(3,6,4.6,3,2,1.5,hair);
   if(style===3)for(let i=0;i<5;i++)box(-4+i*2,8+(i%2),0,2,2,10,hair);
   if(style===6)for(const x of [-7,7])box(x,2,-1,3,6,4,hair);
   if(style===7)box(0,3,-6,4,7,3,hair);
   if(style===9)for(const x of [-3,0,3])box(x,8.5+(x===0?1:0),0,2,3,7,hair);
   if(style===11)box(0,9,-2,5,3,5,hair);
   const eyeHeight=face===1||face===3?0.6:face===7?2:1.2;
   for(const x of [-2.3,2.3]){box(x,3.4,4.6,face===2?1.8:1.1,eyeHeight,.3,ink);if(face===5)box(x,4.5,4.7,2,.5,.3,ink);if(face===6||face===2)box(x*1.5,2.2,4.7,1.5,.6,.3,'#d89287');}
   box(face===4?1:0,1.6,4.7,face===1?2:1.4,face===2?1.2:.5,.3,ink);
   if(face===6){box(-.9,2,4.7,.5,.6,.3,ink);box(.9,2,4.7,.5,.6,.3,ink);}
   if(accessory===1||accessory===2){box(0,8.2,0,12,2,11,accent);box(0,7,accessory===1?4:0,accessory===1?12:14,1,accessory===1?7:13,accent);}
   if(accessory===3||accessory===6){for(const x of [-2.5,2.5]){box(x,3.5,4.9,4,3,.7,ink);box(x,3.5,5.3,2.7,1.7,.15,accessory===3?'#aecbd0':skin);}box(0,3.5,5,1,.5,.5,ink);}
   if(accessory===4){box(0,9,0,13,1,3,ink);for(const x of [-6,6])box(x,4,0,2,4,3,accent);}
   if(accessory===7)for(const x of [-4,4])box(x,10,0,3,4,3,accent);
  }else{
   const g=original.clone(),rgb=g.getAttribute('color');
   for(let i=0;i<rgb.count;i++){
    const source=new T.Color(rgb.getX(i),rgb.getY(i),rgb.getZ(i));let nearest=0,distance=Infinity;
    palette.forEach((c,k)=>{const d=(c.r-source.r)**2+(c.g-source.g)**2+(c.b-source.b)**2;if(d<distance){distance=d;nearest=k;}});
    const c=new T.Color(nearest===0?skin:nearest===1?cloth:nearest===3?(part==='body'?cloth:'#60564a'):nearest===2?accent:palette[nearest]);rgb.setXYZ(i,c.r,c.g,c.b);
   }
   g.deleteAttribute('uv');pieces.push(g);
   if(part==='body'){
    box(0,3,3.7,1,5,.5,accent);box(-2,2,3.8,1.5,1.5,.4,accent);
    if(outfit===3)box(0,1.5,4,5,4,.5,'#d2bc86');
    if(outfit===4)box(0,4,0,9,2,8,cloth);
    if(outfit===5)box(0,0,3.9,7,1,.5,accent);
    if(outfit===6)box(0,-.5,0,8,2,7,cloth);
    if(outfit===7){box(0,2.5,4,4,3,1,'#7c8990');box(1,3,4.6,1,1,.2,accent);}
    box(0,2,-4.6,pack===1?7:6,pack===1?7:5,pack===3?4:3,accent);
    box(0,2,-6.3,pack===2?3:4,pack===2?4:2,.5,pack===2?'#fff0ce':'#b8b597');
    if(pack===3)for(const x of [-3.5,3.5])box(x,2,-5,1.5,6,3,'#aeb7b9');
    if(accessory===5){box(0,4.5,1,9,1.5,7,accent);box(2,2.5,4,2,4,1,accent);}
   }
  }
  const merged=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());if(!merged)continue;
  merged.computeBoundingSphere();if(mesh.userData.explorerOwned)mesh.geometry.dispose();mesh.geometry=merged;mesh.userData.explorerOwned=true;
 }
}
export function disposeExplorerAppearance(rig:T.Object3D){rig.traverse(o=>{if(o instanceof T.Mesh&&o.userData.explorerOwned){o.geometry.dispose();o.geometry=o.userData.explorerSource;o.userData.explorerOwned=false;}});}
