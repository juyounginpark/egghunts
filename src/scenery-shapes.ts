import {STAGES} from './stage-data';
import type {Block} from './region-layout';
/** Large authored pieces, batched by RegionArt. Functional surfaces stay static. */
export function objectShape(kind:string,stage:number,animated=false){
 const blocks:Block[]=[],moving:Block[]=[],s=STAGES[stage-1];
 const wood=0x896b50,stone=stage===13?0xb8d9df:stage===19?0x706c81:0xb4b7ad,cream=0xe7dfc8,dark=0x424855,gold=0xc6a46a,green=0x83a36f;
 const c=s.color,a=s.accent;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,col=c,m=false,roll=0)=>{(m&&animated?moving:blocks).push({x,y,z,w,h,d,c:col,solid:false,roll});};
 const box=(y:number,w=1.4,h=1,d=1.2,col=c)=>b(0,y,0,w,h,d,col);
 const ring=(y:number,r=.6,col=a,m=false)=>{for(let j=0;j<10;j++){const t=j*Math.PI/5;b(Math.cos(t)*r,y,Math.sin(t)*r,.24,.18,.24,col,m);}};
 const legs=(h=.8,col=wood)=>{for(const x of [-.5,.5])for(const z of [-.35,.35])b(x,h/2,z,.13,h,.13,col);};
 const roof=(y=1.8,col=c)=>{for(let j=0;j<3;j++)b(0,y+j*.18,0,1.8-j*.5,.22,1.4-j*.35,col);};
 const post=(x=0,z=0,h=1.5,col=wood)=>b(x,h/2,z,.22,h,.22,col);
 const face=(y=.8,z=.61)=>{for(const x of [-.25,.25])b(x,y,z,.1,.1,.05,dark);};
 const leaf=(x:number,y:number,z:number,col=green)=>b(x,y,z,.8,.15,.45,col,true,x<0?-.2:.2);
 const hollow=(y=.65,col=stone)=>{box(.15,1.3,.25,1.2,col);for(const x of [-.55,.55])b(x,y,0,.2,y*2,.95,col);for(const z of [-.48,.48])b(0,y,z,1.2,y*2,.18,col);};
 switch(kind){
 case 'flag':case 'banner':case 'coat':case 'scroll':{
  post(-.55,0,2.1,wood);b(0,2,0,1.4,.12,.12,gold);
  b(.05,1.5,0,1,.85,.12,kind==='scroll'?cream:a);b(.05,1.5,.08,.4,.4,.06,gold);
  for(const x of [-.35,0,.35])b(x,1,0,.2,.25,.12,a);break;
 }
 case 'hammer':case 'tongs':case 'bone':{
  b(0,.6,0,.18,1.2,.18,kind==='bone'?cream:wood);
  for(const y of [.1,1.15])b(0,y,0,kind==='tongs'?.3:.8,.3,.4,kind==='bone'?cream:dark);
  if(kind==='tongs')b(.35,.6,0,.12,1.2,.15,dark);break;
 }
 case 'pearl':case 'clam':case 'snail':case 'vessel':case 'amphora':{
  for(let j=0;j<4;j++)b(0,.15+j*.22,0,1.1-Math.abs(j-1.5)*.2,.25,.9-Math.abs(j-1.5)*.15,cream);
  if(kind==='clam'){b(0,.85,-.3,1.3,.18,.9,a,false,.5);box(.6,.4,.4,.4,0xf1e9dc);}
  if(kind==='snail'){b(.7,.15,.1,.8,.25,.4,green);for(const x of [.8,1])post(x,.1,.5,green);ring(.7,.3,wood);}
  if(kind==='amphora'||kind==='vessel'){ring(1,.3,gold);for(const x of [-.6,.6])b(x,.65,0,.2,.6,.25,gold);}
  break;
 }
 case 'ore':case 'cairn':case 'pebble':case 'moonrock':case 'shard':case 'ruin':{
  for(let j=0;j<4;j++){const tall=kind==='shard'?1.4:.4;b((j%2-.5)*.65,.2+j*.13,(Math.floor(j/2)-.5)*.5,.7,tall,.65,j%2?stone:a,false,j*.08);}
  if(kind==='ruin'){post(-.5,0,1.5,stone);b(-.3,1.5,0,.9,.25,.5,cream);}break;
 }
 case 'fir':case 'leafbud':{
  post(0,0,kind==='fir'?2.2:.7,wood);
  for(let j=0;j<4;j++){const width=(kind==='fir'?1.9:1)-j*.24;b(j%2*.12,.5+j*.42,0,width,.5,width,j%2?green:0x65896a);}
  break;
 }
 case 'drone':case 'satellite':case 'comet':{
  box(1.3,.7,.6,.7,gold);for(const x of [-1,1]){b(x,1.3,0,1,.12,.8,kind==='comet'?a:dark);b(x,1.38,0,.7,.04,.6,a);}
  post(0,0,1.2,dark);if(kind==='drone')for(const x of [-1,1])ring(1.5,.3,cream);
  break;
 }
 case 'sign':case 'specimen':case 'console':{
  legs(.8,dark);box(.85,1.4,.2,.9,dark);box(1.3,1.3,.7,.25,stone);b(0,1.3,.15,1,.45,.05,a);
  for(const x of [-.4,0,.4])b(x,.98,.3,.18,.08,.15,gold);
  if(kind==='specimen'){box(1.5,.4,.5,.4,green);box(1.9,.9,.1,.7,cream);}break;
 }
 case 'column':case 'harp':case 'chariot':case 'wreath':case 'camp':{
  if(kind==='column'){box(.15,1.2,.3,1.2,cream);box(1,.65,1.5,.65,stone);box(1.85,1.3,.25,1.3,cream);}
  else if(kind==='harp'){for(const x of [-.6,.6])post(x,0,1.7,gold);b(0,1.65,0,1.3,.2,.3,gold);for(let j=-2;j<=2;j++)b(j*.18,.9,0,.035,1.3,.035,cream);}
  else if(kind==='chariot'){box(.6,1.4,.3,1.5,gold);b(0,1,-.6,1.4,.7,.15,gold);for(const x of [-.85,.85])b(x,.4,0,.2,.8,.8,wood);}
  else if(kind==='wreath'){ring(.35,.7,green);for(const x of [-.5,.5])b(x,.5,0,.3,.2,.3,gold);}
  else {for(const x of [-.3,.3])b(x,.2,0,.25,.25,1.3,wood);for(const x of [-.2,.2])b(x,.55,0,.25,.6,.3,0xe7ae71);}
  break;
 }
 case 'tree':{
  b(0,.9,0,.5,1.8,.45,wood);b(.12,1.65,0,.35,.8,.35,wood,false,.25);
  for(const sign of [-1,1]){b(sign*.4,1.5,0,.65,.22,.25,wood,false,sign*.4);b(sign*.3,.1,.12,.8,.2,.5,wood);}
  for(const [x,y,z,w] of [[-.65,1.9,0,1.2],[.55,2.15,.15,1.4],[0,2.65,0,1.2],[.15,2.15,-.6,1.1]]){
   b(x,y,z,w,.55,w,green);b(x-.1,y+.33,z,w*.72,.25,w*.72,0xa5bb83);
  }break;
 }
 case 'fern':{
  post(0,0,.55,green);
  for(let arm=0;arm<6;arm++){const t=arm*Math.PI/3;for(let j=1;j<=3;j++)b(Math.cos(t)*j*.22,.65-j*.1,Math.sin(t)*j*.22,.45-j*.055,.13,.4,j%2?green:0xa5bb83);}
  break;
 }
 case 'palm':{
  for(let j=0;j<5;j++)b(j*.055,.2+j*.4,0,.3,.42,.3,j%2?wood:0xab8960);
  for(let arm=0;arm<6;arm++){const t=arm*Math.PI/3;for(let j=1;j<=3;j++)b(.2+Math.cos(t)*j*.3,2.25-j*j*.045,Math.sin(t)*j*.3,.5,.15,.45,j%2?green:0x6a8e61);}
  for(const x of [-.1,.3])b(x,1.95,.2,.25,.3,.25,wood);break;
 }
 case 'pine':case 'root':case 'vine':case 'coral':case 'tentacle':{
  const trunk=kind==='coral'?0xcd9ea5:kind==='tentacle'?a:wood;
  post(0,0,1.8,trunk);for(const sign of [-1,1])for(let j=0;j<3;j++)b(sign*(.25+j*.16),.8+j*.28,0,.25,.5,.3,trunk,false,sign*.4);
  if(kind==='root')for(let j=0;j<4;j++)b((j-1.5)*.45,.15+Math.abs(j-1.5)*.1,0,.65,.35,.6,wood,false,(j<2?1:-1)*.25);
  else if(kind==='pine')for(let j=0;j<3;j++)b(0,1+j*.5,0,1.7-j*.4,.7,1.5-j*.4,stage===13?0xdce7dc:green,true);
  else if(kind==='coral'||kind==='tentacle'){for(const sign of [-1,1])b(sign*.65,1.6,0,.45,.4,.45,a,true);}
  else for(const x of [-.65,0,.65])leaf(x,1.9,0,green);
  break;
 }
 case 'arch':case 'gate':case 'door':case 'cave':case 'hole':case 'cliff':{
  for(const x of [-.85,.85])b(x,.9,0,.4,1.8,.6,kind==='arch'?wood:stone);
  b(0,1.85,0,2.1,.35,.7,stone);
  if(kind==='cliff')for(const x of [-1.2,1.2])b(x,.8,.35,.5,1.6,1,stone);
  if(kind==='gate'||kind==='door'){b(0,2.1,0,.9,.3,.5,a);b(-.9,1.3,.4,.12,.35,.08,a);}
  if(stage===9||stage===20){leaf(-.7,2.15,0);leaf(.7,2.15,0);}
  break;
 }
 case 'bridge':case 'floor':case 'rug':case 'mat':case 'puzzle':case 'crossing':case 'rail':case 'mosaic':case 'asphalt':case 'helipad':case 'ramp':case 'leaf':case 'ice':case 'net':case 'sand':case 'mud':case 'balls':case 'cloud':{
  const col=kind==='mud'?0x91755d:kind==='ice'?0xadd7dc:kind==='net'?wood:kind==='leaf'?green:kind==='cloud'?cream:c;
  box(.025,1.8,.05,1.5,col);
  for(let i=-2;i<=2;i++){
   if(kind==='balls')b(i*.3,.1,(i%2)*.25,.3,.18,.3,i%2?a:cream);
   else b(i*.32,.06,0,.08,.02,1.3,kind==='rail'?dark:a);
  }
  if(kind==='leaf')b(0,.07,0,.08,.025,1.5,cream);
  if(kind==='net')for(let i=-2;i<=2;i++)b(0,.07,i*.3,1.8,.03,.05,wood);
  break;
 }
 case 'steps':case 'slide':case 'dune':case 'snowball':case 'pyramid':case 'coal':case 'hay':case 'rock':case 'meteor':case 'seed':case 'fruit':case 'orb':case 'pollen':{
  const col=kind==='coal'?0x41454a:kind==='snowball'?0xe6ece7:kind==='hay'?0xcbb879:kind==='pollen'?gold:kind==='seed'?wood:kind==='fruit'?a:stone;
  for(let j=0;j<3;j++)b(0,.2+j*.3,kind==='steps'?j*.35:0,1.6-j*.35,.35,1.4-j*.28,col);
  if(kind==='slide')b(0,.5,.7,.8,.1,1.4,a,false,.3);
  if(kind==='fruit'||kind==='seed'){post(0,0,1.25,wood);leaf(.3,1.25,0);}
  if(kind==='meteor'||kind==='rock')b(.45,.7,.45,.35,.3,.15,a);
  break;
 }
 case 'flower':case 'petal':case 'clover':case 'sprout':case 'mushroom':case 'seaweed':case 'anemone':{
  if(kind==='sprout'){box(.3,1.2,.6,1,stone);post(0,0,1.1,green);leaf(-.25,1.05,0);leaf(.25,1.25,0);}
  else if(kind==='mushroom'){post(0,0,1.1,cream);box(1.15,1.4,.45,1.2,a);for(const x of [-.35,.35])b(x,1.4,0,.25,.05,.25,cream);}
  else if(kind==='seaweed'||kind==='anemone'){for(let j=-2;j<=2;j++)b(j*.25,.6,0,.2,1.2,.25,kind==='anemone'?a:green,true,j*.15);}
  else {post(0,0,.8,green);for(let i=0;i<5;i++){const t=i*Math.PI*2/5;b(Math.cos(t)*.45,.9,Math.sin(t)*.45,.55,.16,.45,kind==='clover'?green:a,true);}b(0,1,0,.35,.2,.35,gold,true);}
  break;
 }
 case 'log':case 'stump':case 'barrel':case 'pot':case 'jar':case 'bucket':case 'bowl':case 'mortar':case 'basin':case 'cup':case 'teapot':case 'boiler':case 'acorn':{
  const col=['log','stump','acorn'].includes(kind)?wood:['barrel','boiler'].includes(kind)?dark:stage===9?0x91b5a9:cream;
  hollow(kind==='bowl'||kind==='basin'?.3:.65,col);ring(.9,.58,a);
  if(kind==='log'||kind==='stump'||kind==='acorn'){box(1,1.2,.15,1.1,kind==='acorn'?wood:gold);ring(1.1,.3,wood);}
  if(kind==='cup'||kind==='teapot'){for(const y of [.4,.8])b(.8,y,0,.5,.15,.3,col);b(1,.6,0,.15,.5,.3,col);}
  if(kind==='teapot')b(-.85,.75,0,.8,.25,.25,col,false,.35);
  if(kind==='boiler'){post(.65,0,1.6,gold);box(1.4,.9,.2,.9,gold);}
  break;
 }
 case 'house':case 'castle':case 'temple':case 'station':case 'gazebo':case 'shelter':case 'greenhouse':case 'booth':case 'igloo':case 'dome':case 'tent':case 'tower':{
  const col=kind==='temple'?cream:kind==='igloo'?0xdce6e6:kind==='greenhouse'?0x8eaf9b:c;
  for(const x of [-.65,.65]){b(x,.7,0,.3,1.4,1.2,col);if(kind==='castle')for(const z of [-.4,.4])b(x,1.65,z,.35,.35,.3,a);}
  if(kind==='tower'){box(1.8,1.1,1.6,.9,col);b(0,2.1,.48,.65,.65,.05,cream);b(0,2.2,.52,.06,.35,.03,dark);}
  roof(kind==='tower'?2.7:1.6,kind==='tent'?a:col);
  if(kind==='greenhouse'||kind==='booth')for(const x of [-.4,0,.4])b(x,1.1,.62,.06,1,.04,cream);
  if(kind==='temple')for(const x of [-.3,.3])post(x,.6,1.5,cream);
  if(kind==='station'||kind==='gazebo')b(0,.5,0,1,.15,.7,wood);
  break;
 }
 case 'nest':case 'cushion':{
  box(.03,1.8,.06,1.4,stage===14?0xcebbd2:wood);
  for(const x of [-.9,.9])b(x,.15,0,.22,.3,1.6,a);
  b(0,.15,-.7,1.8,.3,.22,a);break;
 }
 case 'fence':case 'crayons':case 'rope':case 'chain':case 'cable':case 'beam':{
  for(let j=-2;j<=2;j++){post(j*.45,0,kind==='crayons'?1.1:.8,kind==='crayons'?(j%2?a:c):wood);if(kind==='crayons')b(j*.45,1.2,0,.12,.2,.12,cream);}
  for(const y of [.3,.65])b(0,y,0,2.1,.12,.15,kind==='cable'?dark:wood);
  break;
 }
 case 'pillar':case 'obelisk':case 'sponge':case 'chimney':case 'crystal':case 'icicle':case 'tooth':case 'antenna':{
  const col=kind==='crystal'||kind==='icicle'?a:kind==='tooth'?cream:stone;
  box(.75,.6,1.5,.65,col);box(1.6,.35,.25,.4,col);
  if(kind==='pillar'||kind==='obelisk'){box(.1,.9,.2,.9,a);box(1.5,.9,.2,.9,a);}
  if(kind==='antenna'){b(0,1.9,0,.12,.65,.12,dark);b(0,2,0,1.2,.1,.1,cream);}
  if(kind==='chimney')box(1.7,.85,.18,.85,dark);
  if(kind==='sponge')for(const y of [.4,.8,1.2])b(.1,y,.34,.2,.2,.02,dark);
  break;
 }
 case 'cart':case 'bus':case 'ship':case 'sled':case 'airship':case 'plane':case 'ufo':{
  const col=kind==='ufo'?stone:wood;box(.4,1.8,.4,.9,col);
  if(kind==='ship'){post(0,0,1.9,wood);b(.3,1.4,0,.7,.7,.1,cream,true);}
  else if(kind==='airship'){box(1.5,2.4,.9,1.1,a);for(const x of [-.6,.6])post(x,0,1.5,dark);}
  else if(kind==='plane'){b(0,.55,0,2.7,.12,.55,cream);b(-.65,.8,0,.3,.6,.1,a);}
  else if(kind==='ufo'){box(.7,1.1,.4,.8,a);ring(.4,.9,cream,true);}
  else {for(const x of [-.65,.65])for(const z of [-.55,.55])b(x,.2,z,.3,.35,.15,dark);if(kind==='bus')box(1,1.7,.8,.85,c);else hollow(.55,wood);}
  break;
 }
 case 'clock':case 'gauge':case 'hourglass':case 'globe':case 'rings':case 'orbit':case 'planets':case 'gear':case 'wheel':case 'tire':case 'dish':case 'coil':case 'windmill':case 'fan':case 'pulley':{
  post(0,0,.9,stone);
  if(kind==='hourglass'){for(const y of [.15,1.7])box(y,1.2,.15,1.1,gold);for(const x of [-.5,.5])post(x,0,1.7,gold);box(.95,.5,.6,.5,cream);}
  else if(kind==='windmill'||kind==='fan'){box(1.1,.45,.45,.5,stone);b(0,1.2,.35,1.8,.17,.1,cream,true);b(0,1.2,.35,.17,1.8,.1,cream,true);}
  else if(kind==='clock'||kind==='gauge'){box(.9,1.1,1.1,.2,cream);b(0,1,.13,.07,.65,.05,dark,true);b(.17,.8,.13,.4,.07,.05,dark,true);}
  else {for(let j=0;j<12;j++){const t=j*Math.PI/6;b(Math.cos(t)*.65,1+Math.sin(t)*.65,0,.25,.25,.3,kind==='tire'?dark:a,true);}if(kind==='planets'||kind==='globe'||kind==='orbit')box(1,.6,.6,.6,c);}
  break;
 }
 case 'chest':case 'gift':case 'locker':case 'cabinet':case 'shelf':case 'books':case 'book':case 'vending':case 'charger':case 'battery':case 'tank':case 'capsule':case 'suitcase':case 'bin':{
  const col=kind==='book'||kind==='books'?cream:kind==='tank'?0x8bbbab:c;
  box(.65,1.2,1.3,.85,col);
  if(kind==='book'||kind==='books'){for(let i=0;i<4;i++)b(0,.2+i*.3,.46,1.3,.06,.12,i%2?a:wood);}
  else if(kind==='shelf'||kind==='locker'||kind==='cabinet'){for(const y of [.3,.8,1.2])b(0,y,.46,1,.08,.05,dark);b(.35,.6,.48,.08,.15,.08,gold);}
  else if(kind==='vending'||kind==='charger'){b(0,.85,.46,.8,.65,.05,dark);for(const x of [-.2,.2])b(x,.9,.51,.2,.3,.05,a);}
  else if(kind==='gift'){b(0,.65,.45,.18,1.3,.05,a);b(0,1.35,0,.2,.12,1,a);for(const x of [-.25,.25])b(x,1.5,0,.45,.2,.3,a);}
  else if(kind==='battery'){b(0,1.4,0,.5,.2,.4,dark);b(0,.8,.46,.12,.4,.04,a);}
  else {b(0,.85,.47,.25,.25,.1,gold);box(1.35,1.3,.15,.95,a);}
  break;
 }
 case 'well':case 'pool':case 'crater':case 'fountain':case 'waterfall':case 'vent':case 'lava':case 'footprint':case 'bolt':case 'curtain':case 'crusher':case 'pipe':case 'pillow':{
  if(kind==='crater'){ring(.12,.8,stone);box(.01,1.2,.02,1,dark);}
  else if(kind==='well'||kind==='pool'||kind==='fountain'){hollow(.3,stone);box(.12,.9,.05,.7,0x81b9b2);if(kind==='well'){post(-.6,0,1.6);post(.6,0,1.6);roof();}if(kind==='fountain')post(0,0,1.1,stone);}
  else if(kind==='pipe'){for(let j=0;j<3;j++)b((j-1)*.45,.7-j*.2,0,.6,.4,.4,stone);}
  else if(kind==='crusher'){post(-.8,0,2.1,dark);post(.8,0,2.1,dark);box(2.1,1.8,.25,1,dark);}
  else if(kind==='pillow'){box(.15,1.5,.3,1.2,c);b(0,.33,0,1.2,.1,.9,cream);}
  else if(kind==='waterfall'){for(let i=0;i<3;i++){b(0,.3+i*.45,-i*.2,1.6-i*.3,.45,.9,stone);b(0,.35+i*.4,.35-i*.2,.6,.45,.08,0x8fbac4,true);}}
  else {box(.02,1.5,.04,1.2,kind==='lava'?0xdf8054:dark);for(const x of [-.65,.65])b(x,.1,0,.15,.2,1.4,stone);}
  break;
 }
 case 'desk':case 'anvil':case 'tools':case 'piano':case 'bed':case 'sofa':case 'chair':case 'throne':case 'bench':case 'stall':{
  legs(.6);box(.7,1.4,.2,1,wood);
  if(kind==='anvil'){box(1,.7,.5,.7,dark);box(1.3,1.5,.25,.6,dark);}
  else if(kind==='bed'||kind==='sofa'){box(.9,1.4,.3,1,cream);b(-.45,1.1,0,.4,.2,.8,a);}
  else if(kind==='chair'||kind==='throne'||kind==='bench'){b(0,1.2,-.45,1.4,1,.16,c);}
  else if(kind==='stall'){post(-.7,0,1.8);post(.7,0,1.8);roof(1.8,a);}
  else if(kind==='piano'){box(1.1,1.4,.65,.6,dark);for(let i=-3;i<=3;i++)b(i*.17,.85,.45,.13,.08,.3,cream);}
  else if(kind==='tools'){for(const x of [-.4,0,.4]){b(x,1.2,0,.1,.7,.1,wood);b(x,1.55,0,.35,.2,.2,dark);}}
  break;
 }
 case 'lantern':case 'lamp':case 'jelly':case 'balloon':case 'hive':case 'cocoon':case 'bell':case 'torch':{
  post(0,0,1.7,wood);box(1.4,.65,.65,.55,kind==='torch'?gold:a);b(0,1.4,.31,.25,.4,.04,cream,true);
  if(kind==='jelly')for(const x of [-.25,0,.25])b(x,.75,0,.07,.6,.07,a,true);
  if(kind==='hive'||kind==='cocoon')for(const y of [1,1.4,1.8])box(y,.8,.15,.65,gold);
  break;
 }
 case 'board':case 'monitor':case 'frame':case 'window':case 'mirror':case 'maze':case 'trace':{
  post(0,0,1,wood);box(1.2,1.5,.9,.15,kind==='board'?0x537c6b:dark);b(0,1.2,.09,1.2,.65,.04,kind==='monitor'?0x8dc3bd:cream);
  for(let i=-1;i<=1;i++)b(i*.3,1.2+i*.12,.13,.15,.12,.03,a,kind==='monitor');break;
 }
 case 'statue':case 'sphinx':case 'camel':case 'horse':case 'duck':case 'bird':case 'seal':case 'robot':case 'toy':case 'eye':case 'mask':case 'totem':{
  const col=['statue','sphinx','camel','seal'].includes(kind)?stone:kind==='robot'?dark:a;
  box(.5,1.2,.6,.9,col);b(.35,1.1,.2,.6,.6,.6,col);face(1.15,.52);
  if(kind==='robot'||kind==='totem'){box(1.6,1,.55,.6,col);face(1.6,.34);}
  if(kind==='duck'||kind==='bird')b(.4,1,.65,.3,.15,.35,gold);
  if(kind==='horse'||kind==='camel')legs(.5,col);
  if(kind==='sphinx')b(.35,1.35,.2,.9,.25,.7,gold);
  break;
 }
 case 'shell':case 'spiral':case 'starweed':case 'fossil':case 'wings':case 'butterfly':case 'umbrella':case 'hat':{
  if(kind==='fossil'){for(let i=-2;i<=2;i++){b(i*.32,.5,0,.25,.2,.25,cream);for(const z of [-.3,.3])b(i*.32,.7,z,.12,.5,.15,cream);}}
  else if(kind==='spiral'){for(let i=0;i<12;i++){const t=i*.65,r=.05+i*.055;b(Math.cos(t)*r,.8+Math.sin(t)*r,0,.3,.3,.4,cream);}}
  else if(kind==='starweed'){for(let i=0;i<5;i++){const t=i*Math.PI*.4;b(Math.cos(t)*.5,.3,Math.sin(t)*.5,.6,.2,.3,a,false,t);}}
  else {post(0,0,.7,wood);for(const x of [-.5,.5])b(x,.9,0,.8,.18,1.1,kind==='shell'?cream:a,true,x<0?-.2:.2);if(kind==='butterfly')box(.8,.2,.2,1.3,dark);}
  break;
 }
 case 'telescope':case 'crane':case 'claw':case 'hand':case 'piston':case 'spoon':case 'key':case 'anchor':case 'knot':case 'shield':case 'drum':case 'dice':case 'spring':case 'hoop':case 'chalk':case 'cloth':case 'coffin':case 'furnace':case 'bellows':{
  if(kind==='furnace'){hollow(.85,dark);box(1.8,1.5,.2,1.3,stone);b(0,.55,.5,.65,.6,.05,0xe2a263);post(.5,0,2.5,stone);}
  else if(kind==='telescope'){legs(1);b(0,1.4,0,.65,.6,1.8,gold,false,.2);b(0,1.4,.95,.5,.5,.1,dark);}
  else if(kind==='crane'||kind==='claw'){post(-.5,0,2,dark);b(0,2,0,1.5,.2,.2,gold);for(const x of [.2,.6])b(x,1.2,0,.15,.7,.2,stone);}
  else if(kind==='hand'){b(0,.5,0,.8,.4,.6,stone);for(let j=-1;j<=2;j++)b(j*.22,.9,0,.18,.8,.25,stone);}
  else if(kind==='dice'){box(.55,1.1,1.1,1.1,cream);for(const x of [-.3,.3])for(const y of [.25,.75])b(x,y,.57,.14,.14,.03,dark);}
  else if(kind==='drum'||kind==='bellows'){box(.65,1,.9,.85,c);for(const y of [.2,.5,.8,1.1])box(y,1.15,.08,.95,gold);}
  else if(kind==='piston'){box(.2,1,.4,1,dark);post(0,0,1.6,stone);box(1.6,1,.2,1,gold);}
  else if(kind==='coffin'){box(.3,.8,.6,1.8,stone);b(.6,.7,0,.2,1.2,1.8,stone);}
  else if(kind==='chalk'||kind==='cloth'){b(0,1,0,kind==='cloth'?1.4:.18,kind==='cloth'?.8:.7,.1,cream,true);}
  else {post(0,0,1.1,stone);for(let i=0;i<8;i++){const t=i*Math.PI/4;b(Math.cos(t)*.45,1+Math.sin(t)*.45,0,.2,.2,.18,a,true);}if(kind==='anchor')b(0,.35,0,1.3,.18,.2,dark);}
  break;
 }
 default:throw Error(`Missing object recipe: ${kind}`);
 }
 return {blocks,moving};
}
