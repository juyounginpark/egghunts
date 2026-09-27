import type {Block,Motion} from './region-layout';
import {objectShape} from './scenery-shapes';
import {habitat} from './biome-scenery';
import {ENVIRONMENT_ART} from './environment-art-data';
export type SceneModel={blocks:Block[];motions:Motion[]};
type Part=readonly [string,number,number,number,number?];

/** Related components form structures; all coordinates here are model-local. */
const structures:Record<string,Part[]>={
 'brook':[['habitat-2',0,0,0,1.2],['reed',-.9,0,-.4],['rock',.9,0,.2,.7]],
 'flower-hill':[['flower',-.5,0,-.3,1.3],['flower',.65,0,.3],['clover',0,0,.8,.6]],
 'watermill':[['house',-.3,0,0,1.3],['turn-wheel',1.1,.1,.4,1.1],['plank',-.2,0,1,.8]],
 'mushroom-stump':[['stump',0,0,0,1.2],['mushroom',-.7,.2,.3,.7],['mushroom',.7,0,.2,.6]],
 'pencil-fort':[['fence',0,0,0,1.2],['pencil',-.7,0,-.3,1.3],['brick',.6,0,.6]],
 'book-mountain':[['book',0,0,0,1.5],['book',.12,.5,0,1.3],['book',-.1,1,0,1.1]],
 'toy-chest':[['crate-open',0,0,0,2.1],['toy',.4,.4,0],['gift',-.6,.4,0,.7]],
 'sponge-grove':[['habitat-2',0,0,0]],
 'shipwreck':[['ship',0,0,0,1.5],['plank',-.8,0,.8],['seaweed',.9,0,.4,.7]],
 'kelp-garden':[['habitat-1',0,0,0],['rock',.7,0,.3,.5]],
 'clam-reef':[['clam',0,.15,0,1.4],['shell',-.9,0,.4,.6],['shell',.8,0,.5,.6]],
 'basalt':[['habitat-1',0,0,0]],
 'lava-basin':[['habitat-2',0,0,0]],
 'forge-bench':[['anvil',0,.2,.2,1.2],['bellows',-.9,0,-.1,.7],['tools',.9,0,.3,.6]],
 'ore-yard':[['cart',-.4,0,0,1.2],['ore',.8,0,.6,.9],['ore',.6,.3,-.2,.8]],
 'classroom-board':[['habitat-0',0,0,0]],
 'locker-row':[['locker',-.8,0,0],['locker-open',0,0,0],['locker',.8,0,0]],
 'library':[['shelf',0,0,0,1.6],['book',-.5,.5,.6,.6],['book',.55,1.2,.6,.6]],
 'shopfront':[['booth',0,0,-.2,1.3],['monitor',0,.6,.7,.65],['vending',1,0,.2,.65]],
 'charging-bay':[['charger',-.65,0,0],['charger',.65,0,0],['cable',0,0,.6,.7]],
 'air-conditioning':[['habitat-2',0,0,0]],
 'food-stall':[['stall',0,0,0,1.3],['pot',-.5,.8,.4,.5],['board',.9,0,.3,.6]],
 'city-tower':[['habitat-0',0,0,0]],
 'oasis':[['habitat-2',0,0,0]],
 'caravan':[['tent',0,0,0,1.2],['camel',1.1,0,.2,.7],['jar',-.9,0,.7,.6]],
 'ruined-columns':[['column',-.85,0,0,1.2],['ruin',.65,0,.3,1.4]],
 'excavation':[['slab',0,0,0,1.5],['shovel',-.8,0,.3],['crate',.8,0,.5,.65]],
 'fern-grove':[['habitat-0',0,0,0],['fern',-.8,0,.7,.6],['fern',.85,0,.6,.8]],
 'ribcage':[['habitat-2',0,0,0,1.2]],
 'fallen-tree':[['fallen-log',0,0,0,1.6],['mushroom',.6,.2,.8,.6]],
 'jungle-falls':[['habitat-3',0,0,0]],
 'market':[['stall',0,0,0,1.25],['basket',-.8,0,.6,.7],['jar',.9,0,.6,.7]],
 'totems':[['totem',-.7,0,0,1.2],['totem',.7,0,.25,.85],['pebble',0,0,.8]],
 'tile-roof':[['habitat-0',0,0,0]],
 'bamboo':[['habitat-1',0,0,0]],
 'colonnade':[['habitat-0',0,0,0,1.1]],
 'statue-fountain':[['fountain',0,0,0,1.3],['bird',0,.75,0,.65]],
 'laurel-garden':[['laurel',-.7,0,0,1.2],['laurel',.8,0,.3,.8],['amphora',0,0,.8,.6]],
 'alien-grove':[['habitat-0',0,0,0],['tentacle',-.9,0,.6,.55]],
 'culture-tank':[['habitat-2',0,0,0,1.2]],
 'observatory-dish':[['dish',0,.4,0,1.4],['console',.8,0,.7,.6]],
 'research-console':[['console',0,0,.3,1.3],['capsule',-.9,0,-.3,.9]],
 'boiler-room':[['boiler',0,0,0,1.25],['chimney',-.8,0,-.5,1.2],['pipe',.9,0,.1,.8]],
 'gear-engine':[['habitat-1',0,0,0,1.2]],
 'airship-dock':[['floating-airship',0,1.4,0,1.2],['bollard',-.8,0,.5],['bollard',.8,0,.5]],
 'frozen-lake':[['habitat-2',0,0,0,1.3]],
 'ice-spires':[['habitat-0',0,0,0,1.2]],
 'polar-camp':[['tent',0,0,0,1.2],['fir',-.9,0,-.3,.7],['lantern',.85,0,.7,.6]],
 'buried-sled':[['sled',0,0,0,1.3],['snowball',-.8,0,.3,.65],['suitcase',.4,.4,0,.6]],
 'card-fan':[['habitat-0',0,0,0,1.2]],
 'giant-teacup':[['habitat-1',0,0,0,1.2]],
 'floating-door':[['habitat-2',0,0,0,1.2]],
 'cloud-sofa':[['sofa',0,0,0,1.3],['cloud',0,.7,-.6,1.2]],
 'bus-wreck':[['bus',0,0,0,1.3],['slab',-.9,0,.8,.8],['sprout',.7,0,.8,.5]],
 'reclaimed-pool':[['habitat-2',0,0,0,1.3]],
 'planter-beds':[['pot',-.8,0,0,.9],['pot',0,0,0,.9],['pot',.8,0,0,.9],['sprout',0,.6,0,.8]],
 'broken-office':[['ruin',-.8,0,-.4,1.3],['desk',.25,0,.2],['monitor',.25,.7,.2,.7]],
 'dew-basin':[['shell',0,0,0,1.6],['dew',0,.5,0,1.1]],
 'acorn-workshop':[['acorn',0,0,-.2,1.6],['branch',-.8,0,.8],['stool',.8,0,.7,.7]],
 'leaf-shelter':[['leaf-canopy',0,0,0,1.4],['chair',-.6,0,.4,.6]],
 'honeycomb':[['honeycomb-piece',-.6,.2,0,1.2],['honeycomb-piece',.6,.2,0,1.2],['honeycomb-piece',0,1.2,0,1.2]],
 'grass-stems':[['habitat-1',0,0,0,1.2]],
 'dandelion':[['habitat-2',0,0,0,1.3]],
 'sorting-bench':[['desk',0,0,0,1.4],['wheel',-.5,.9,0,.45],['crate',.8,0,.7,.6]],
 'assembly-arm':[['habitat-1',0,0,0,1.25]],
 'rotor-generator':[['habitat-3',0,0,0,1.2]],
 'scrap-bin':[['crate-open',0,0,0,1.6],['gear',-.5,.5,0,.8],['beam',.5,.4,.1,.8]],
 'robot-hand':[['hand',0,0,0,2]],
 'planetarium':[['habitat-0',0,0,0,1.2]],
 'meteor-garden':[['moonrock',0,0,0,1.4],['moonrock',-.8,0,.7,.6],['moonrock',.8,0,.5,.7]],
 'archive':[['cabinet',-.5,0,0,1.2],['globe',.8,0,.3,.8],['star-chart',.5,0,1]],
 'nebula':[['habitat-1',0,0,0,1.5]],
 'floating-rocks':[['habitat-0',0,0,0,1.2]],
 'twisted-spire':[['habitat-2',0,0,0,1.2]],
 'empty-throne':[['throne',0,0,0,1.3],['slab',-.9,0,.5],['hourglass',.8,0,.5,.6]],
 'mirror-wall':[['mirror',-.8,.2,0],['mirror',0,.5,0],['mirror',.8,0,0]],
 'flower-arch':[['habitat-1',0,0,0,1.2]],
 'crystal-spring':[['habitat-2',0,0,0,1.2]],
 'seed-gazebo':[['gazebo',0,0,0,1.2],['seed',-.9,0,.5,.6],['flower',.9,0,.5,.7]],
 'lotus-pond':[['habitat-3',0,0,0,1.2],['lotus',0,.1,0,.8]],
 'golden-tree':[['habitat-0',0,0,0,1.4]],
 'school-wall':[['habitat-2',0,0,0,1.4]],
};

export function sceneModel(kind:string,stage:number):SceneModel{
 if(kind.startsWith('habitat-'))return habitat(stage,Number(kind.slice(8)));
 if(structures[kind]){
  const result:SceneModel={blocks:[],motions:[]};
  for(const [name,x,y,z,s=1] of structures[kind]){
   const part=sceneModel(name,stage);
   result.blocks.push(...part.blocks.map(p=>({...p,x:x+p.x*s,y:y+p.y*s,z:z+p.z*s,w:p.w*s,h:p.h*s,d:p.d*s})));
   result.motions.push(...part.motions.map(m=>({...m,x:x+m.x*s,y:y+m.y*s,z:z+m.z*s,travel:m.travel?{x:m.travel.x*s,y:m.travel.y*s,z:m.travel.z*s}:undefined,blocks:m.blocks.map(p=>({...p,x:p.x*s,y:p.y*s,z:p.z*s,w:p.w*s,h:p.h*s,d:p.d*s}))})));
  }
  return result;
 }
 const blocks:Block[]=[],motions:Motion[]=[],[a,bg,c]=ENVIRONMENT_ART[stage-1].accents;
 const wood=0x927354,paper=0xe0d6b9,dark=0x4d565d,metal=0x94a0a1;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,col=a,angle=0,roll=0)=>blocks.push({x,y,z,w,h,d,c:col,angle,roll,solid:false});
 const box=(y:number,w:number,h:number,d:number,col=a)=>b(0,y,0,w,h,d,col);
 const openBox=(col:number,h=.8)=>{box(.08,1.1,.16,.85,col);for(const x of [-.5,.5])b(x,h/2,0,.12,h,.85,col);for(const z of [-.4,.4])b(0,h/2,z,1,h,.12,col);};
 switch(kind){
 case 'book':case 'books':{
  for(let j=0;j<(kind==='books'?3:1);j++){
   const x=j%2*.12,y=j*.3,angle=(j-1)*.12,col=[a,bg,c][j];
   for(const dy of [.03,.27])b(x,y+dy,0,1.15,.06,.8,col,angle);
   b(x,y+.15,.015,1.04,.18,.7,paper,angle);b(x-.53,y+.15,0,.08,.24,.8,col,angle);
  }break;
 }
 case 'shelf':{
  for(const x of [-.7,.7])b(x,1.05,0,.12,2.1,.65,wood);
  for(let row=0;row<3;row++){
   b(0,row*.65+.1,0,1.5,.12,.65,wood);
   for(let j=0;j<5;j++)b((j-2)*.23,row*.65+.38,0,.18,.42+(j%2)*.08,.48,[a,bg,c][j%3],0,j===4?.12:0);
  }break;
 }
 case 'cloth':{
  box(.05,1.15,.1,.85,bg);b(.25,.13,0,.65,.06,.85,bg);for(const z of [-.34,.34])b(0,.11,z,1.1,.025,.05,paper);break;
 }
 case 'blanket':case 'paper':case 'envelope':case 'seed-packet':case 'bookmark':case 'star-chart':case 'scribble':case 'ribbon':{
  box(.025,kind==='bookmark'?.25:1.2,.04,.85,kind==='blanket'?bg:paper);
  if(kind==='blanket')for(const x of [-.45,.45])b(x,.055,0,.08,.025,.8,a);
  else for(let j=0;j<3;j++)b((j-1)*.3,.055,(j%2)*.14,.22,.018,.06,kind==='star-chart'?a:wood,.2);
  if(kind==='envelope')b(.35,.07,-.25,.35,.04,.25,bg,.4);
  if(kind==='ribbon'){blocks.length=0;for(const x of [-.3,.3])b(x,.08,0,.55,.1,.18,a,x);b(0,.04,.4,.15,.06,.9,a,.3);}
  break;
 }
 case 'basket':case 'crate':case 'crate-open':case 'filter-box':case 'chalk-box':{
  openBox(kind==='basket'?wood:kind==='filter-box'?metal:bg,kind==='basket'?.5:.8);
  for(const y of [.25,.55])for(const z of [-.47,.47])b(0,y,z,1.1,.06,.04,wood);
  if(kind==='basket'){for(const x of [-.5,.5])b(x,.8,0,.08,.6,.08,wood);b(0,1.1,0,1.08,.08,.08,wood);}
  if(kind==='crate-open')b(.65,1.2,0,.12,1.2,.9,bg,0,-.45);
  if(kind==='filter-box')for(let j=-2;j<=2;j++)b(j*.15,.6,.47,.05,.3,.03,dark);
  if(kind==='chalk-box')for(let j=-2;j<=2;j++)b(j*.17,.2,0,.1,.1,.55,paper);
  break;
 }
 case 'reed':case 'dry-shrub':case 'laurel':{
  for(let j=-2;j<=2;j++){
   const h=kind==='laurel'?1.6-Math.abs(j)*.2:1+(j+2)%3*.2;
   b(j*.22,h/2,0,.1,h,.1,kind==='dry-shrub'?wood:0x7c956f);
   if(kind==='reed')b(j*.22,h,0,.16,.3,.16,wood);
   else b(j*.22+.1,h*.75,0,.55,.18,.4,kind==='dry-shrub'?0xab9a76:0x8fa578);
  }break;
 }
 case 'branch':case 'bark':case 'plank':case 'fallen-log':case 'mast':{
  if(kind==='fallen-log'){box(.45,2.8,.9,.85,wood);for(const x of [-1.43,1.43])b(x,.45,0,.05,.65,.65,paper);b(.4,.7,.4,.4,.35,.6,wood,.3);}
  else if(kind==='mast'){box(1.7,.15,3.4,.15,wood);b(0,2.5,0,2,.12,.12,wood);b(.35,1.9,0,.65,1.1,.07,paper);}
  else {box(.08,1.6,.15,kind==='branch'?.16:.6,wood);b(.35,.14,.2,.75,.12,.14,kind==='bark'?dark:wood,.5);}
  break;
 }
 case 'bottle':case 'watering-can':{
  box(.35,.55,.65,.55,kind==='bottle'?0x8faeab:metal);box(.8,.22,.3,.22,kind==='bottle'?0x8faeab:metal);
  if(kind==='watering-can'){b(.55,.4,0,.75,.18,.2,metal,0,.3);for(const y of [.25,.6])b(-.45,y,0,.4,.08,.12,metal);b(-.65,.42,0,.08,.45,.12,metal);}
  else box(.97,.27,.08,.27,wood);break;
 }
 case 'shovel':case 'sieve':{
  if(kind==='shovel'){box(.85,.12,1.7,.12,wood);box(.2,.5,.4,.12,metal);box(1.65,.4,.1,.12,wood);}
  else {openBox(wood,.22);for(let j=-2;j<=2;j++)b(j*.16,.13,0,.04,.03,.7,metal);}
  break;
 }
 case 'ash':case 'crumb':case 'rubble':case 'slab':case 'ingot':case 'wax':{
  const col=kind==='ash'?0x82766e:kind==='ingot'?metal:kind==='wax'?c:kind==='crumb'?paper:bg;
  if(kind==='slab'||kind==='ingot')box(.15,1.3,.3,.8,col);
  else for(let j=0;j<5;j++)b(Math.sin(j*2)*.45,.08+(j%2)*.06,Math.cos(j*2)*.35,.25,.16,.2,col,j*.2);
  break;
 }
 case 'puddle':case 'ripple':case 'crack':case 'footprints':{
  for(let j=0;j<5;j++)b((j-2)*.24,.02,Math.sin(j*1.7)*.2,kind==='ripple'?.08:.24,.025,kind==='puddle'?.6:.15,kind==='puddle'?0x89aaa7:kind==='crack'?dark:bg,j*.12);
  break;
 }
 case 'open-book':case 'bookend':{
  if(kind==='bookend'){box(.08,.7,.15,.65,metal);b(-.3,.4,0,.15,.8,.65,metal);}
  else for(const x of [-.35,.35]){b(x,.12,0,.65,.16,.9,bg,0,x*.3);b(x,.23,0,.6,.05,.8,paper,0,x*.3);}
  break;
 }
 case 'pencil':case 'pencil-broken':case 'eraser':case 'brick':{
  if(kind==='eraser'){box(.15,.75,.3,.4,paper);b(.23,.15,0,.3,.31,.41,a);}
  else if(kind==='brick'){box(.22,1,.44,.65,a);for(const x of [-.3,0,.3])b(x,.49,0,.18,.1,.18,a);}
  else {box(.12,kind==='pencil'?1.6:.8,.2,.2,a);b(kind==='pencil'?.88:.48,.12,0,.2,.16,.16,paper);if(kind==='pencil')b(1.01,.12,0,.08,.08,.08,dark);}
  break;
 }
 case 'pouch':case 'slippers':case 'cushion':{
  box(.25,kind==='slippers'?1:.8,.45,.7,bg);box(.5,.55,.08,.5,paper);
  if(kind==='pouch')box(.62,.3,.2,.1,wood);break;
 }
 case 'locker-open':{
  box(.08,.9,.16,.65,metal);b(-.4,.9,0,.12,1.8,.65,metal);b(.4,.9,0,.12,1.8,.65,metal);b(0,1.8,0,.9,.15,.65,metal);b(0,.9,-.3,.8,1.7,.1,dark);b(.7,.9,.35,.65,1.7,.1,bg,.55);break;
 }
 case 'stool':case 'pallet':case 'tripod':{
  const h=kind==='pallet'?.2:.75;
  if(kind==='tripod'){for(const x of [-.45,.45])b(x,.6,0,.12,1.2,.12,metal,0,-x*.35);b(0,.6,-.45,.12,1.2,.12,metal);}
  else {for(const x of [-.4,.4])for(const z of [-.3,.3])b(x,h/2,z,.12,h,.12,wood);for(let j=-2;j<=2;j++)b(j*.2,h,0,.18,.12,.85,wood);}
  break;
 }
 case 'bolt':case 'nut':case 'valve':case 'axle':case 'bollard':case 'lens':{
  if(kind==='nut'||kind==='valve'||kind==='lens'){for(let j=0;j<8;j++){const t=j*Math.PI/4;b(Math.cos(t)*.3,.15,Math.sin(t)*.3,.18,.2,.18,kind==='valve'?a:metal);}if(kind==='lens')box(.12,.3,.06,.3,0x9fbdbb);}
  else {box(.4,.18,.8,.18,metal);box(.75,.45,.12,.45,kind==='bollard'?wood:metal);}
  break;
 }
 case 'cable-reel':{
  for(const x of [-.45,.45])b(x,.45,0,.12,.9,.9,wood);box(.45,.8,.55,.55,dark);b(.7,.07,.5,1.2,.08,.08,dark,.45);break;
 }
 case 'relief':{
  box(.9,1.3,1.8,.2,bg);for(let j=0;j<4;j++)b(Math.sin(j*2)*.3,.4+j*.3,.13,.2,.17,.05,a);break;
 }
 case 'moss-rock':case 'dry-leaf':case 'dew':case 'ball':case 'plate':case 'lotus':case 'petal':{
  if(kind==='moss-rock'){box(.3,1,.6,.8,bg);box(.62,.8,.1,.65,0x849b72);}
  else if(kind==='dew'||kind==='ball'){box(.2,.6,.4,.6,kind==='dew'?0xa8c9c7:a);box(.45,.4,.12,.4,kind==='dew'?paper:a);}
  else if(kind==='lotus'){for(let j=0;j<6;j++){const t=j*Math.PI/3;b(Math.cos(t)*.35,.12,Math.sin(t)*.35,.4,.17,.3,bg,t);}box(.25,.3,.2,.3,c);}
  else box(.03,kind==='petal'?.35:1,.05,kind==='petal'?.25:.7,kind==='dry-leaf'?wood:kind==='petal'?a:paper);break;
 }
 case 'sprout':{
  box(.25,.08,.5,.08,0x7b9667);for(const x of [-.22,.22])b(x,.4,0,.45,.12,.28,0x99b17c,0,x*.4);break;
 }
 case 'card':{
  box(.6,.75,1.2,.08,paper);b(0,.6,.06,.25,.3,.04,a);b(-.2,1,.06,.1,.1,.04,a);break;
 }
 case 'honeycomb-piece':{
  for(let j=0;j<6;j++){const t=j*Math.PI/3;b(Math.cos(t)*.4,.55+Math.sin(t)*.4,0,.3,.3,.35,c);}break;
 }
 case 'leaf-canopy':{
  for(const x of [-.6,.6])b(x,.7,0,.13,1.4,.13,wood);for(let j=-2;j<=2;j++)b(j*.3,1.45+Math.cos(j)*.12,0,.35,.15,1.4-Math.abs(j)*.2,0x8aa76f);break;
 }
 case 'winged-statue':{
  box(.25,1.2,.5,1,metal);box(1.1,.6,1.4,.6,paper);box(2,.55,.55,.55,paper);
  for(const side of [-1,1])for(let j=0;j<3;j++)b(side*(.45+j*.3),1.8+j*.15,0,.4,.65-j*.12,.2,paper);break;
 }
 case 'desk-leg':case 'bedpost':{
  box(2.8,.65,5.6,.65,wood);box(5.6,2.5,.3,2.1,bg);box(.4,.9,.25,.9,wood);break;
 }
 case 'moon':{
  for(let j=0;j<8;j++){const t=j*Math.PI/7-Math.PI/2;b(Math.cos(t)*.7,1.2+Math.sin(t)*.7,0,.4,.4,.2,paper);}break;
 }
 case 'float-book':case 'floating-airship':case 'floating-shard':case 'hologram':case 'cloud':case 'turn-wheel':case 'rotor':{
  const source=kind==='float-book'?'book':kind==='floating-airship'?'airship':kind==='floating-shard'?'shard':kind==='hologram'?'rings':kind==='cloud'?'cloud':'wheel';
  const shape:Block[]=kind==='cloud'?[-1,0,1].map(i=>({x:i*.5,y:.25+(i===0?.2:0),z:0,w:1,h:.5,d:.8,c:paper,solid:false})):source==='book'?sceneModel('book',stage).blocks:objectShape(source,stage).blocks,pivot=source==='wheel'?1:0;
  motions.push({x:0,y:pivot+(kind.startsWith('float')?.8:0),z:0,kind:source==='wheel'?'windmill':kind==='hologram'?'spin':'float',phase:stage*.3,blocks:shape.map(p=>({...p,y:p.y-pivot,solid:false}))});break;
 }
 case 'spore':case 'ember':{
  motions.push({x:0,y:.2,z:0,kind:'drift',phase:stage*.6,travel:{x:.2,y:1.3,z:.1},blocks:Array.from({length:3},(_,j)=>({x:Math.sin(j*2)*.4,y:j*.15,z:Math.cos(j*2)*.3,w:.12,h:.12,d:.12,c:kind==='ember'?0xe3ad63:c,solid:false}))});break;
 }
 default:{const shape=objectShape(kind,stage);blocks.push(...shape.blocks);}
 }
 return {blocks,motions};
}
