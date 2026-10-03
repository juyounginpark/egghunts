import * as T from 'three';
import {ExplorerGeometry} from './explorer-geometry';
import {explorerHair,explorerClothes,explorerBackpack} from './explorer-tailor';
import {APPEARANCE_OPTIONS,appearanceIndex,normalizeAppearance,type ExplorerAppearance} from './explorer-appearance';

/** Human, simulated and remote explorers all retain the original fixed skeleton. */
export function applyExplorerAppearance(rig:T.Object3D,value:ExplorerAppearance){
 const a=normalizeAppearance(value),index=(key:keyof ExplorerAppearance)=>appearanceIndex(a,key);
 const color=(key:'skinId'|'hairColorId'|'accentColorId')=>APPEARANCE_OPTIONS[key][index(key)].color!;
 const skin=color('skinId'),hair=color('hairColorId'),accent=color('accentColorId'),ink='#34362e';
 const outfit=index('outfitId'),hat=index('headAccessoryId'),style=hat===11?12:index('hairId'),glasses=index('faceAccessoryId'),neck=index('neckAccessoryId'),pack=index('backpackId');
 const cloth=['#e8dfc1','#58764c','#bd8055','#637893','#a57975','#748796','#d7ba55','#deddd1','#e3e0cf','#7f96a3','#c9b38a','#667b86','#ba8987'][outfit];
 const pants=['#8b956f','#c1b294','#535d55','#536983','#67675e','#6c7164','#4b6262','#b5bab6','#507995','#5d6e7c','#a38e6b','#454f59','#7e8473'][outfit];
 for(const name of ['explorer-eyes','explorer-mouth']){const old=rig.getObjectByName(name);if(old instanceof T.Mesh){old.geometry.dispose();old.removeFromParent();}}
 for(const part of ['body','head','left_arm','right_arm','left_leg','right_leg','left_hand','right_hand','left_foot','right_foot']){
  const group=rig.getObjectByName(part),mesh=group?.children.find(o=>o instanceof T.Mesh) as T.Mesh|undefined;if(!mesh)continue;
  mesh.userData.explorerSource??=mesh.geometry;
  const shapes=new ExplorerGeometry(18),box=shapes.box.bind(shapes);
  if(part==='head'){
   box(0,3,0,10,7,9,skin);
   explorerHair(shapes,style,hat,hair,accent);
   const eyes=new ExplorerGeometry(18),eye=index('eyeId'),brow=index('eyebrowId');
   for(const s of [-1,1]){
    const x=s*2.3,widths=[1.1,1.4,1.7,1.2,1.2,.7,1.5,1.5,1.25,1.25,1.6,1.9],heights=[1.3,1.5,.45,1,.95,.8,.55,1.75,1.1,1.1,.4,2];
    eyes.box(x,3.4,4.67,widths[eye],heights[eye],.25,ink,eye===3?s*.15:eye===4?-s*.2:eye===9?s*.3:0);
    if(eye===2)for(const side of [-1,1])eyes.box(x+side*.65,3.15,4.67,.4,.6,.25,ink);
    if(eye===7||eye===11)eyes.box(x-.3,3.85,4.83,.45,.45,.15,'#fff7df');
    if(eye===6)eyes.box(x,3.75,4.85,1.7,.5,.15,skin);
    box(x,4.8,4.7,[1.8,1.7,1,2.2,1.8,1.8,2,1.3][brow],brow===3?.65:.4,.3,hair,[0,s*.13,0,0,-s*.3,s*.3,-s*.2,0][brow]);
    if(brow===1||brow===7)box(x+s*.7,4.65,4.7,.5,.4,.3,hair,s*.25);
   }
   const decorate=(name:string,builder:ExplorerGeometry)=>{const m=new T.Mesh(builder.finish(),mesh.material);m.name=name;m.userData.explorerDecoration=true;group!.add(m);};
   decorate('explorer-eyes',eyes);
   const mouths=new ExplorerGeometry(18),mouth=index('mouthId');
   const line=(x:number,y:number,w:number,h:number,tilt=0,c=ink)=>mouths.box(x,y,4.75,w,h,.28,c,tilt);
   if([0,5,6,7].includes(mouth)){line(mouth===5?.3:0,1.6,mouth===6?.5:mouth===7?2:1.4,.4);for(const s of [-1,1])line(s*(mouth===7?1.05:.75),1.85,.4,mouth===0?.45:.7,s*(mouth===6?.5:mouth===5?.3:0));}
   else if(mouth===2){line(0,1.7,2.2,1.4);mouths.box(0,1.35,4.93,1.3,.35,.12,'#c98279');}
   else if(mouth===3){line(0,1.8,1.3,1.3);mouths.box(0,1.8,4.93,.6,.6,.12,skin);}
   else line(0,1.7,mouth===9?.5:mouth===4?1.4:1.7,mouth===9?.5:mouth===4?.8:.35);
   decorate('explorer-mouth',mouths);
   const cheek=index('cheekId');
   for(const s of [-1,1]){
    if(cheek===1||cheek===2)box(s*3.5,2,4.73,cheek===1?1.6:1,.65,.25,'#ce8c7c');
    if(cheek===3)for(const i of [-1,0,1])box(s*(3.5+i*.5),2+(i%2)*.25,4.75,.25,.25,.25,'#9d7054');
    if(cheek===4)box(s*3.6,2,4.75,.4,.4,.25,ink);
   }
   if(cheek===5&&glasses!==6&&glasses!==7){box(3.5,2,4.8,2,.8,.3,'#e0c89a');box(3.5,2,5,.5,.8,.15,'#c79d7a');}
   if(cheek===6&&glasses!==6&&glasses!==7){box(-3.5,2,4.8,1.6,.5,.3,'#d7b95c');box(-3.5,2,4.8,.5,1.6,.3,'#d7b95c');}
   if(cheek===7){box(3.5,1.9,4.8,1.6,.5,.3,'#a38b61',-.2);box(-3.8,2.3,4.8,.8,.7,.3,'#a38b61');}
   if(hat===1||hat===2){
    box(0,7.6,0,11.4,1.5,10.4,accent);box(0,8.65,-.5,9.4,.6,8.4,accent);
    box(0,6.9,hat===1?6.1:-6.1,8.8,.65,4.2,accent);
    box(0,7.7,hat===1?5.3:-5.3,1.8,.9,.3,'#e6dab7');
   }
   if(hat===3){box(0,7.7,0,11.4,2.1,10.4,accent);box(0,6.5,0,13.3,.55,12.3,accent);box(0,6.1,0,14.2,.3,13.2,accent);}
   if(hat===4){box(0,6.8,0,15,.7,13.6,'#83926b');box(0,8.2,0,10.8,2.1,9.6,'#83926b');box(0,7.35,0,11,.6,9.8,'#685944');box(0,9.45,-.8,8.8,.4,7.8,'#83926b');}
   if(hat===5){box(0,7.7,0,11.8,2.4,10.8,accent);box(0,6.65,0,12.2,.65,11.2,'#8c7b6a');box(0,9.15,0,9.8,.5,8.8,accent);box(-2.8,9.7,0,2,1,2,accent);}
   if(hat===6){box(0,6.6,0,16,.5,14,'#c9b57f');box(0,7.65,0,10.8,1.6,9.4,'#c9b57f');box(0,8.65,0,9,.4,8,'#d8c697');box(0,7.1,0,11,.45,9.6,'#947451');}
   if(hat===7){box(0,8.8,0,13,1,3,ink);for(const s of [-1,1])box(s*6,4,0,2,4,3,accent);}
   if(hat===8)for(const s of [-1,1]){box(s*2.7,7.2,5.4,4,2.1,1,ink);box(s*2.7,7.2,6,2.8,1.2,.3,'#aecbd0');}
   if(hat===9){box(0,8.8,0,11,1,10,'#d7b25c');for(const x of [-4,0,4])box(x,10,4.8,1.5,1.7,1.2,'#d7b25c');}
   if(hat===10)for(const s of [-1,1]){box(s*4,9.5,0,3,4,3,hair,s*.12);box(s*4,9.7,1.6,1.5,2,.4,accent);}
   if(hat===11){box(0,9.1,0,13,2,12,'#dfdfd3');for(const s of [-1,1])box(s*6.2,4.6,0,1.6,8,11,'#dfdfd3');box(0,.6,1,12,1.3,10,'#dfdfd3');box(0,8,6,10,.6,.6,accent);}
   if(glasses>=1&&glasses<=4){
    for(const s of [-1,1]){const x=s*2.4,w=glasses===1?3.5:4.1,h=glasses===1?3.2:2.7;
     for(const sy of [-1,1])box(x,3.5+sy*h/2,5,w,.4,.4,ink);
     for(const sx of [-1,1])box(x+sx*w/2,3.5,5,.4,h,.4,ink);
     if(glasses>=3)box(x,3.5,5.1,w-.5,h-.4,.3,glasses===3?'#4f615f':'#99b8bd');
    }box(0,3.5,5,1,.4,.4,ink);
   }
   if(glasses===5)box(0,2.6,4.9,2.1,.7,.5,'#d8be8c');
   if(glasses===6){box(-3.5,1.5,4.9,2.3,1,.4,'#dfc89a');box(-3.5,1.5,5.15,.6,1,.2,'#c59279');}
   if(glasses===7){box(0,1.7,5,5,2.2,.8,'#e7e3d0');box(0,2,5.45,4,.2,.2,accent);}
  }else{
   explorerClothes(shapes,part,outfit,cloth,pants,skin,accent,neck);
   if(part==='body')explorerBackpack(shapes,pack,accent);
  }
  const merged=shapes.finish();if(mesh.userData.explorerOwned)mesh.geometry.dispose();mesh.geometry=merged;mesh.userData.explorerOwned=true;
 }
}
export function disposeExplorerAppearance(rig:T.Object3D){
 const decorations:T.Object3D[]=[];
 rig.traverse(o=>{if(o instanceof T.Mesh){if(o.userData.explorerDecoration){o.geometry.dispose();decorations.push(o);}else if(o.userData.explorerOwned){o.geometry.dispose();o.geometry=o.userData.explorerSource;o.userData.explorerOwned=false;}}});
 decorations.forEach(o=>o.removeFromParent());
}
