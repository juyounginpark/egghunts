import type {Block} from './region-layout';
import {FARM_PLOTS,farmLocal,VILLAGE,FARM_PEN,CAMPFIRE,CAMP_SEATS} from './village';
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
  const {halfWidth:w,back,front,gateHalfWidth:gate}=FARM_PEN;
  // Short rails keep rotated collision boxes close to the visible fence.
  const rail=(x:number,z:number,length:number,sideways:boolean,y:number)=>{
   const pieces=Math.ceil(length/.25),step=length/pieces;
   for(let i=0;i<pieces;i++){const along=-length/2+(i+.5)*step;local(x+(sideways?along:0),y,z+(sideways?0:along),sideways?step+.01:.1,.1,sideways?.1:step+.01,cream);}
  };
  local(0,-.005,(back+front)/2,w*2,.08,front-back,slot%2?0xb9cf91:0xc5d99d);
  // Low split rails enclose each farm; the promenade-facing gate stays open.
  for(const x of [-w,w]){
   for(let z=back;z<=front+.01;z+=(front-back)/5)local(x,.43,z,.16,.86,.16,wood);
   for(const y of [.28,.65])rail(x,(back+front)/2,front-back,false,y);
  }
  for(const z of [back,front]){
   for(let i=0;i<=6;i++){const x=-w+i*w/3;if(z===front&&Math.abs(x)<gate)continue;local(x,.43,z,.16,.86,.16,wood);}
   for(const y of [.28,.65]){
    if(z===back)rail(0,z,w*2,true,y);
    else for(const side of [-1,1])rail(side*(w+gate)/2,z,w-gate,true,y);
   }
  }
  for(const x of [-gate,gate]){local(x,.5,front,.22,1,.22,wood);local(x,1.04,front,.3,.12,.3,roofs[slot]);}
  // Separate egg beds remain low enough to walk through and see every shell.
  local(-1.55,.035,-.1,2,.05,3.9,0xdfcea0);
  for(const x of [-2.65,-.45])local(x,.08,-.1,.08,.14,3.9,stone);
  for(const z of [-2.05,1.85])local(-1.55,.08,z,2.2,.14,.08,stone);

 }
 // Both market buildings present their doors and awnings to the approach road.
 for(const side of [-1,1]){
  const rotation=side<0?Math.PI/2:-Math.PI/2,cx=side*4.5,cz=1;
  const local=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>b(cx+x*Math.cos(rotation)+z*Math.sin(rotation),y,cz-x*Math.sin(rotation)+z*Math.cos(rotation),w,h,d,c,rotation);
  local(0,1,0,2.1,2,1.9,cream);for(let n=0;n<4;n++)local(0,2.1+n*.22,0,2.8-n*.6,.24,2.6,side<0?0x9d8863:0x789ba0);
  local(0,1,1,.7,1.7,.12,wood);for(let n=0;n<5;n++)local(-1+n*.5,1.7,1.4,.5,.14,.9,n%2?cream:0x92a565);
  for(const x of [-1,1])local(x,.85,1.7,.12,1.7,.12,wood);
 }
 // Stone fire ring and crossed charred logs replace the fountain.
 for(let i=0;i<12;i++){const a=i*Math.PI/6;b(CAMPFIRE.x+Math.sin(a)*.95,.2,CAMPFIRE.z+Math.cos(a)*.95,.45,.4,.4,i%2?stone:0x8c8a79,a);}
 b(CAMPFIRE.x,.1,CAMPFIRE.z,1.45,.18,1.45,0x433d32);
 for(const side of [-1,1]){b(side*.25,.3,CAMPFIRE.z,1.35,.24,.3,0x5c4030,side*.65);b(side*.25,.44,CAMPFIRE.z,.95,.12,.16,0xc36c32,side*.65);}
 for(const seat of CAMP_SEATS){
  const local=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>b(seat.x+x*Math.cos(seat.rotation)+z*Math.sin(seat.rotation),y,seat.z-x*Math.sin(seat.rotation)+z*Math.cos(seat.rotation),w,h,d,c,seat.rotation);
  local(0,.34,0,2.15,.56,.62,wood);local(0,.63,0,2.05,.06,.42,0xb08a56);
  for(const side of [-1,1]){local(side*1.08,.34,0,.05,.44,.48,0xd3b67b);local(side*1.115,.34,0,.015,.23,.26,0x9c7648);}
  for(const x of [-.7,.7])local(x,.11,0,.22,.22,.7,0x5c4030);
 }
 for(const side of [-1,1])for(const z of [-1,11]){const x=side*2.5;b(x,.8,z,.16,1.6,.16,wood);b(x,1.7,z,.48,.5,.48,gold);b(x,2,z,.65,.12,.65,0x5a6b50);}
 cached=blocks;return blocks;
}
