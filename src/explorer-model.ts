import * as T from 'three';
import {ExplorerGeometry} from './explorer-geometry';
import {APPEARANCE_OPTIONS,appearanceIndex,normalizeAppearance,type ExplorerAppearance} from './explorer-appearance';

/** Human, simulated and remote explorers all retain the original fixed skeleton. */
export function applyExplorerAppearance(rig:T.Object3D,value:ExplorerAppearance){
 const a=normalizeAppearance(value),index=(key:keyof ExplorerAppearance)=>appearanceIndex(a,key);
 const color=(key:'skinId'|'hairColorId'|'accentColorId')=>APPEARANCE_OPTIONS[key][index(key)].color!;
 const skin=color('skinId'),hair=color('hairColorId'),accent=color('accentColorId'),ink='#34362e';
 const outfit=index('outfitId'),hat=index('headAccessoryId'),style=hat===11?12:index('hairId'),glasses=index('faceAccessoryId'),neck=index('neckAccessoryId'),pack=index('backpackId');
 const cloth=['#e8dfc1','#58764c','#bd8055','#637893','#a57975','#748796','#d7ba55','#deddd1','#e3e0cf','#7f96a3','#c9b38a','#667b86','#ba8987'][outfit];
 const pants=['#8b956f','#c1b294','#535d55','#536983','#67675e','#6c7164','#4b6262','#b5bab6','#507995','#5d6e7c','#a38e6b','#454f59','#7e8473'][outfit];
 const palette=['#FFF0CA','#789851','#384A36','#986D48','#F5AC99','#CEE291','#FFFFFF','#E8B855'].map(c=>new T.Color(c));
 for(const name of ['explorer-eyes','explorer-mouth']){const old=rig.getObjectByName(name);if(old instanceof T.Mesh){old.geometry.dispose();old.removeFromParent();}}
 for(const part of ['body','head','left_arm','right_arm','left_leg','right_leg','left_hand','right_hand','left_foot','right_foot']){
  const group=rig.getObjectByName(part),mesh=group?.children.find(o=>o instanceof T.Mesh) as T.Mesh|undefined;if(!mesh)continue;
  const original=(mesh.userData.explorerSource??=mesh.geometry) as T.BufferGeometry;
  const shapes=new ExplorerGeometry(18),box=shapes.box.bind(shapes);
  if(part==='head'){
   box(0,3,0,10,7,9,skin);
   const cap=[1,2,3,4,5,6,11].includes(hat);
   box(0,cap||style===12?6.6:7,0,10.8,cap||style===12?1:2,9.8,hair);
   const fringe=(x=0,w=10,y=5.8,h=1.5)=>box(x,y,4.5,w,h,1.3,hair);
   const sides=(length:number,width=2)=>{for(const s of [-1,1])box(s*5,5-length/2,-.7,width,length,8,hair);};
   const back=(length:number)=>box(0,5-length/2,-4.4,10,length,2,hair);
   switch(style){
    case 0:fringe(0,8);break;
    case 1:fringe(0,10,5.4,2.3);break;
    case 2:fringe(-2.8,4.3);box(2.6,5.8,4.5,3,2,1.4,hair,-.2);break;
    case 3:fringe(0,9,5.9,1.7);if(!cap)for(const x of [-4,0,4])box(x,8+(x===0?.5:0),0,3.5,2.3,9,hair,x*.03);break;
    case 4:fringe();sides(6);back(5.8);break;
    case 5:fringe(-2,5);sides(9);back(10);break;
    case 6:fringe();for(const s of [-1,1]){box(s*6.6,1.8,-2,3,6,3.5,hair,s*.12);box(s*6,5,-2,1.7,1.2,3,accent);}break;
    case 7:fringe(-2,6);box(0,.8,-6,4,8,3,hair,.08);box(0,4.5,-5.5,3,1,3,accent);break;
    case 8:fringe(0,9,6.1,1);box(-4.7,4,0,1.3,3,7,hair);break;
    case 9:fringe(0,8);if(!cap)for(const x of [-3,0,3])box(x,8.6+(x===0?.6:0),0,2.3,3,6,hair,-x*.06);break;
    case 10:fringe(-3,4,5.4,3);fringe(2.5,4,6,1);break;
    case 11:fringe();box(0,5,-6.2,4,8,3,hair);if(!cap)box(0,8,-4,4,2,4,accent);break;
    case 12:box(0,6.2,0,10.3,.8,9.3,hair);break;
    case 13:fringe();sides(6,2.8);box(0,.4,-3.2,11,2,4,hair);break;
    case 14:fringe(-1,7);sides(5);for(const s of [-1,1])box(s*5.8,.7,-1,3,2.7,6,hair,s*.3);break;
    case 15:fringe(0,9,5.5,2);sides(7);back(7);break;
    case 16:fringe(-2.5,4);back(9);for(const s of [-1,1])for(let j=0;j<3;j++)box(s*(5+j%2*.5),4-j*3,-1,2.5,3.8,6,hair,s*(j%2?.12:-.12));break;
    case 17:fringe(-1,7);sides(7);back(8);box(0,4,-6,4,4,3,hair);box(0,5.3,-6,3,1,3,accent);break;
   }
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
   else if(mouth===2){line(0,1.7,2.2,1.4);line(0,1.35,1.3,.35,0,'#c98279');}
   else if(mouth===3){line(0,1.8,1.3,1.3);line(0,1.8,.6,.6,0,skin);}
   else line(0,1.7,mouth===9?.5:mouth===4?1.4:1.7,mouth===9?.5:mouth===4?.8:.35);
   decorate('explorer-mouth',mouths);
   const cheek=index('cheekId');
   for(const s of [-1,1]){
    if(cheek===1||cheek===2)box(s*3.5,2,4.73,cheek===1?1.6:1,.65,.25,'#ce8c7c');
    if(cheek===3)for(const i of [-1,0,1])box(s*(3.5+i*.5),2+(i%2)*.25,4.75,.25,.25,.25,'#9d7054');
    if(cheek===4)box(s*3.6,2,4.75,.4,.4,.25,ink);
   }
   if(cheek===5){box(3.5,2,4.8,2,.8,.3,'#e0c89a');box(3.5,2,5,.5,.8,.15,'#c79d7a');}
   if(cheek===6){box(-3.5,2,4.8,1.6,.5,.3,'#d7b95c');box(-3.5,2,4.8,.5,1.6,.3,'#d7b95c');}
   if(cheek===7){box(3.5,1.9,4.8,1.6,.5,.3,'#a38b61',-.2);box(-3.8,2.3,4.8,.8,.7,.3,'#a38b61');}
   if([1,2,3,4,5,6].includes(hat)){
    const wide=hat===4||hat===6,c=hat===6?'#c6ac70':hat===4?'#79865a':accent;
    box(0,8,0,11.8,hat===5?3:2.2,10.8,c);
    if(hat!==5)box(0,6.9,hat===1?4.5:hat===2?-4.5:0,wide?16:hat===3?14:12,1,hat<=2?6:wide?14:12,c);
    box(0,7.3,5.5,10,.65,.4,hat===6?'#9b7754':cloth);
   }
   if(hat===7){box(0,8.8,0,13,1,3,ink);for(const s of [-1,1])box(s*6,4,0,2,4,3,accent);}
   if(hat===8)for(const s of [-1,1]){box(s*2.7,6.3,5,4,2.4,1,ink);box(s*2.7,6.3,5.6,2.8,1.3,.3,'#aecbd0');}
   if(hat===9){box(0,8,0,11,1.5,10,'#d7b25c');for(const x of [-4,0,4])box(x,9.5,4.8,1.5,2,1.2,'#d7b25c');}
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
   const g=original.clone(),rgb=g.getAttribute('color'),leg=part.includes('leg'),foot=part.includes('foot'),hand=part.includes('hand');
   for(let i=0;i<rgb.count;i++){
    const source=new T.Color(rgb.getX(i),rgb.getY(i),rgb.getZ(i));let nearest=0,distance=Infinity;
    palette.forEach((c,k)=>{const d=(c.r-source.r)**2+(c.g-source.g)**2+(c.b-source.b)**2;if(d<distance){distance=d;nearest=k;}});
    const c=new T.Color(hand?skin:foot?(outfit===7||outfit===8?'#e5e4d6':'#635d50'):leg?pants:nearest===0?skin:nearest===1||nearest===3?cloth:nearest===2?accent:palette[nearest]);rgb.setXYZ(i,c.r,c.g,c.b);
   }shapes.add(g);
   if(part==='body'){
    box(0,3,3.7,.8,5,.5,accent);box(-2,2,3.8,1.7,1.7,.4,accent);
    if(outfit===1||outfit===10){box(0,4.3,3.8,6,1.1,.7,cloth);box(2,2,3.9,2,1.7,.6,'#a1a486');}
    if(outfit===2)box(0,4.5,3.6,7,1,1,'#d8ba80');
    if(outfit===3){box(0,1.5,4,5,4,.5,pants);for(const s of [-1,1])box(s*2.2,4,4,1,3.5,.5,pants);}
    if(outfit===4||outfit===6){box(0,4,-1,9,2,8,cloth);box(0,0,4,5,1.7,1,cloth);}
    if(outfit===5)box(0,0,3.9,7,1,.5,accent);
    if(outfit===6)box(0,-.5,0,8,2,7,cloth);
    if(outfit===7){box(0,2.5,4,4,3,1,'#7c8990');box(1,3,4.6,1,1,.2,accent);}
    if(outfit===8)for(const y of [.5,2.5,4])box(0,y,3.8,7,.7,.5,'#527b96');
    if(outfit===9){box(0,2,0,9,6,8,cloth);box(0,4.8,0,9,1.4,8,'#ded4bf');for(const y of [0,2])box(0,y,4.1,8,.3,.3,'#607b8a');}
    if(outfit===11)box(0,2,4.1,1.4,7,.5,accent,-.65);
    if(outfit===12){box(2,3,4,3,3,.6,'#819d9a');box(-2,1,4,3,2,.6,'#d5b977');}
    const packColor=[accent,'#a5825c','#d3b779','#adbcc1','#708558','#5e92a3','#b99776',accent][pack];
    box(0,2,-4.7,pack===7?4:6,pack===1?7:pack===7?4:5,pack===3?4:3,packColor);box(0,4.2,-6.2,pack===7?4:6,1.2,1,packColor);
    for(const s of [-1,1]){box(s*2.7,2,-3,1,6,.7,accent);if(pack===0)box(s*3.3,1,-5.3,1.4,2.4,2,cloth);}
    if(pack===1)box(0,-2,-5,7,2,2.7,'#839674');
    if(pack===2){box(0,1.5,-6.4,3.4,3.4,1,'#eee1bb');box(0,3.1,-6.4,2,1,1,'#eee1bb');}
    if(pack===3)for(const s of [-1,1]){box(s*3.5,2,-5.5,1.7,6,3,'#ced8d3');box(s*3.5,4.5,-5.5,1.8,.7,3,accent);}
    if(pack===4)box(0,2,-6.4,1.8,2.8,.4,'#a5b477',-.5);
    if(pack===5){box(3.5,1,-5,1.4,3.5,1.5,'#a3c8c7');box(0,1.5,-6.4,2,1.5,.4,'#e4d3a4');}
    if(pack===6){for(const s of [-1,1]){box(s*2.2,5,-5.8,1.7,2,1.5,packColor);box(s*1.2,2,-6.4,.5,.6,.3,ink);}box(0,1,-6.4,.6,.4,.3,'#a97470');}
    if(neck){const scarf=neck===1?'#b85b53':neck===2?'#577e9f':accent;box(0,4.6,1,9,neck===4?2:1.1,7,scarf);if(neck===5)box(0,2.7,4.3,1.5,1.5,.6,'#d7b65d');else box(1.8,2.5,4,2,3.5,.8,scarf,neck===3?-.2:0);}
   }
   if(foot){box(0,-.5,1,3.5,.6,5,accent);if([1,3,5,6,7,9,10].includes(outfit))box(0,.8,.3,3.4,2.1,3.5,outfit===7?'#d7ddd7':outfit===6?'#687058':'#73634f');}
   if(part.includes('arm'))box(.4,-1.5,0,2.3,.6,3.5,accent);
  }
  const merged=shapes.finish();if(mesh.userData.explorerOwned)mesh.geometry.dispose();mesh.geometry=merged;mesh.userData.explorerOwned=true;
 }
}
export function disposeExplorerAppearance(rig:T.Object3D){
 const decorations:T.Object3D[]=[];
 rig.traverse(o=>{if(o instanceof T.Mesh){if(o.userData.explorerDecoration){o.geometry.dispose();decorations.push(o);}else if(o.userData.explorerOwned){o.geometry.dispose();o.geometry=o.userData.explorerSource;o.userData.explorerOwned=false;}}});
 decorations.forEach(o=>o.removeFromParent());
}
