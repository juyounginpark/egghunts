import type {Block} from './region-layout';
import {FARM_PLOTS,farmLocal,VILLAGE} from './village';
import {ROAD_WIDTH_SCALE} from './stage-data';
let cached:Block[]|undefined;
export function circularVillageArt(){
 if(cached)return cached;
 const blocks:Block[]=[],cream=0xf1e5c5,stone=0xb5b292,wood=0x87694e,gold=0xd9b96d,grass=0xb9cc88;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,angle=0)=>blocks.push({x,y,z,w,h,d,c,angle});
 for(let z=-5;z<=23;z++){const half=Math.sqrt(Math.max(0,VILLAGE.radius**2-(z-VILLAGE.z)**2));if(half)b(0,-.5,z,Math.floor(half*2),.9,1,grass);}
 b(0,-.5,-5.5,5,.9,2,grass);b(0,.008,-5.4,3.4,.06,2,0xdacfad);
 // Taper the wider expedition road into the existing village gateway.
 for(let i=0;i<4;i++){const t=(i+.5)/4,z=-6.5+t*1.8,width=6*ROAD_WIDTH_SCALE+(3.4-6*ROAD_WIDTH_SCALE)*t;b(0,-.5,z,width+1.6,.9,.46,grass);b(0,.012,z,width,.06,.46,0xdacfad);}
 for(let z=-5;z<7;z++)b(0,.006,z,3.4,.06,.98,0xdacfad);
 for(let i=0;i<56;i++){const a=i*Math.PI/28,x=Math.sin(a)*5.8,z=9+Math.cos(a)*5.8;b(x,.015,z,1.6,.06,.85,0xdacfad,a);}
 for(let slot=0;slot<5;slot++)for(let d=2;d<5.8;d+=.6){const p=farmLocal(slot,0,d);b(p.x,.022,p.z,2,.07,.65,0xdfd2ac,FARM_PLOTS[slot].rotation);}
 for(let i=0;i<64;i++){const a=i*Math.PI/32,x=Math.sin(a)*13.7,z=9+Math.cos(a)*13.7;if(z<-3&&Math.abs(x)<3.5)continue;b(x,.4,z,1.28,.9,.4,stone,a);b(x,.9,z,1.32,.12,.5,cream,a);}
 // Layered rocky ridges frame the village; the northern pass stays open.
 // Near-camera peaks are lower so the five farms remain readable in play.
 for(let i=0;i<30;i++){
  const a=i*Math.PI/15,r=17.8+(i%3)*.65,x=Math.sin(a)*r,z=VILLAGE.z+Math.cos(a)*r;
  if(z<-3&&Math.abs(x)<5.5)continue;
  const height=z>12?2.8+(i%3)*.5:4.6+(i%4)*.65;
  for(let tier=0;tier<5;tier++){
   const width=6.2-tier*.95,y=-.35+height*(tier+.5)/5;
   b(x+Math.sin(a)*tier*.15,y,z+Math.cos(a)*tier*.15,width,height/5+.12,width*.83,[0x879579,0x99a385,0xaeb197,0xc2c2a5,0xd9d1b4][tier],a);
  }
  b(x-.8,.35,z-1.1,1.6,1,1.2,0x758569,a);
 }
 // Timber gateway and open leaves, with a clear 3.4-wide walking corridor.
 for(const side of [-1,1]){
  b(side*2.25,1.35,-4.7,.5,2.7,.65,wood);b(side*2.25,.2,-4.7,.85,.4,.95,stone);
  b(side*2.25,2.8,-4.7,.8,.2,.95,gold);
  b(side*2.58,1,-4.05,.16,1.9,1.5,wood,side*.32);
  for(const z of [-6,-5.1,-3.3]){b(side*2.65,.65,z,.18,1.3,.18,wood);b(side*2.65,.86,z,.16,.14,.95,cream);b(side*2.65,.42,z,.16,.13,.95,wood);}
  b(side*3.15,.65,-3.3,1.1,.15,.18,cream);
 }
 b(0,3,-4.7,5.5,.38,.9,wood);b(0,3.24,-4.7,5.9,.16,1.15,0x6f845c);
 b(0,2.8,-4.15,1.1,.58,.12,gold);b(0,2.82,-4.05,.5,.3,.1,cream);
 const roofs=[0x78915c,0xb77f62,0x809daa,0x9b84a6,0xb0a05b];
 for(const [slot,plot]of FARM_PLOTS.entries()){
  const local=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>{const p=farmLocal(slot,x,z);b(p.x,y,p.z,w,h,d,c,plot.rotation);};
  local(0,.13,0,3.2,.26,3,stone);local(0,1.15,0,2.6,2,2.4,cream);
  for(const side of [-1,1]){local(side*1.2,1.1,1.25,.15,2,.15,wood);local(side*.8,1.45,1.26,.5,.6,.12,wood);local(side*.8,1.45,1.34,.35,.42,.08,gold);}
  local(0,.94,1.26,.72,1.65,.12,wood);local(0,.94,1.34,.52,1.4,.08,0x526f53);local(0,.15,1.65,1.05,.2,.75,stone);
  for(let n=0;n<5;n++)local(0,2.2+n*.23,0,3.4-n*.58,.26,3.1,roofs[slot]);
  if(slot===0){local(0,3.6,-.3,.7,1.1,.7,cream);local(0,4.2,-.3,1,.16,1,roofs[slot]);}
  if(slot===1){local(-.8,3.1,-.5,.45,1.8,.5,wood);local(-.8,4,-.5,.65,.16,.7,stone);}
  if(slot===2)for(let n=0;n<3;n++)local(1.5,1.7+n*.2,0,1.3-n*.3,.23,2,roofs[slot]);
  if(slot===3){local(0,3.1,.4,1,.8,.9,cream);local(0,3.6,.4,1.35,.2,1.2,roofs[slot]);}
  if(slot===4){local(0,3.35,-.3,.7,.75,.7,gold);local(0,3.8,-.3,1.1,.15,1.1,roofs[slot]);}
  local(-2.1,.18,2.3,1.25,.36,1.7,wood);local(-2.1,.38,2.3,1.05,.08,1.5,0x78654b);
  for(const z of [1.8,2.3,2.8]){local(-2.1,.57,z,.65,.35,.3,0x829953);local(-2.1,.78,z,.25,.15,.22,slot%2?0xd5b173:0xbf8162);}
  for(const x of [-1.35,1.35]){local(x,.4,3.65,.12,.8,.18,wood);local(x,.6,3.65,.6,.13,.15,cream);}
 }
 // Both market buildings present their doors and awnings to the approach road.
 for(const side of [-1,1]){
  const rotation=side<0?Math.PI/2:-Math.PI/2,cx=side*4.5,cz=1;
  const local=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>b(cx+x*Math.cos(rotation)+z*Math.sin(rotation),y,cz-x*Math.sin(rotation)+z*Math.cos(rotation),w,h,d,c,rotation);
  local(0,1,0,2.1,2,1.9,cream);for(let n=0;n<4;n++)local(0,2.1+n*.22,0,2.8-n*.6,.24,2.6,side<0?0x9d8863:0x789ba0);
  local(0,1,1,.7,1.7,.12,wood);for(let n=0;n<5;n++)local(-1+n*.5,1.7,1.4,.5,.14,.9,n%2?cream:0x92a565);
  for(const x of [-1,1])local(x,.85,1.7,.12,1.7,.12,wood);
 }
 b(0,.2,9,2.1,.4,2.1,stone);b(0,.43,9,1.75,.06,1.75,0x89b7b2);b(0,.8,9,.55,.7,.55,cream);b(0,1.2,9,1,.16,1,stone);b(0,1.32,9,.8,.05,.8,0x9cc9bf);
 for(const side of [-1,1])for(const z of [-1,11]){const x=side*2.5;b(x,.8,z,.16,1.6,.16,wood);b(x,1.7,z,.48,.5,.48,gold);b(x,2,z,.65,.12,.65,0x5a6b50);}
 for(const side of [-1,1]){b(side*3.8,.4,9,1.5,.18,.5,wood);b(side*3.8,.75,9.2,1.5,.55,.12,wood);}
 cached=blocks;return blocks;
}
