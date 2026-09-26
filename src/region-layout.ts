import * as T from 'three';
import {legacyTheme} from './stage-order';
import {stageLandmarks} from './world-art';
import { STAGES, STAGE_COVERS, STAGE_STEPS,FINAL_GUARDIAN,routeStep,ROUTE,ROAD_WIDTH_SCALE } from './stage-data';

export type Block = { x:number;y:number;z:number;w:number;h:number;d:number;c:number;angle?:number;roll?:number };
export type Motion = { blocks:Block[];x:number;y:number;z:number;kind:'spin'|'sway'|'float'|'windmill';phase:number };
const cream=0xffefd0, wood=0x856048, dark=0x303344, gold=0xe9ba60;
/** Model parts are batched cubes. A prop is a small voxel assembly, never a Mesh per voxel. */
function sculpture(stage:number,variant:number):Block[]{
 if(stage===19)variant%=2;
 if(stage===20)variant=2;
 const out:Block[]=[],s=STAGES[stage-1],a=s.accent,c=s.color;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,col=c)=>out.push({x,y,z,w,h,d,c:col});
 const post=(x:number,z:number,h=1.6,col=wood)=>b(x,h/2,z,.2,h,.2,col);
 const roof=(y:number,col=c)=>{for(let j=0;j<4;j++)b(0,y+j*.15,0,2-j*.4,.2,1.6-j*.25,col);};
 const ring=(y:number,r:number,col=a)=>{for(let j=0;j<12;j++){const t=j*Math.PI/6;b(Math.cos(t)*r,y,Math.sin(t)*r,.23,.2,.23,col);}};
 const crystal=(x:number,z:number,h:number,col=a)=>{b(x,h/2,z,.35,h,.35,col);b(x,h+.08,z,.16,.16,.16,cream);};
 if(variant>=3){
  // Assemble native biome props, not the same generic cart/gate in every world.
  const count=variant%3===0?3:2;
  for(let i=0;i<count;i++){
   const scale=i===0?1:.38+(variant%4)*.08,side=i%2?-1:1;
   for(const p of sculpture(stage,(variant+i)%3))out.push({...p,
    x:p.x*scale+(i?side*.8:0),y:p.y*scale,z:p.z*scale+(i?.5:0),
    w:p.w*scale,h:p.h*scale,d:p.d*scale,roll:(p.roll??0)+(i?side*.08:0)});
  }
  return out;
 }
 switch(legacyTheme(stage)){
 case 1:
  if(variant===0){post(0,0,1.3);for(let j=0;j<3;j++)b((j-1)*.35,1.2+j*.3,0,1.3,.65,1.2,0x78a459);for(let j=0;j<6;j++)b(Math.sin(j*2)*.65,1.4+(j%3)*.22,Math.cos(j*2)*.6,.18,.18,.18,0xe98870);}
  if(variant===1){b(0,.8,0,.85,1.6,.85,cream);roof(1.65,0xc18058);b(0,1,.46,.25,.4,.06,wood);}
  if(variant===2){for(let j=0;j<7;j++){const x=Math.sin(j*2.4)*.8,z=Math.cos(j*2.4)*.8;post(x,z,.25,0x5e9656);b(x,.3,z,.22,.12,.22,j%2?0xffd978:0xf8a9b3);}b(.7,.15,.5,.6,.3,.6,gold);}
  break;
 case 2:
  if(variant===0){b(0,.65,0,1.5,1.3,1.1,0x88bfc9);for(const x of [-.65,.65]){b(x,1,0,.5,2,.6,0xdb9e82);for(const dx of [-.16,.16])b(x+dx,2.1,0,.15,.3,.6,cream);}b(0,.45,.6,.4,.9,.08,wood);}
  if(variant===1){b(0,.55,0,1.4,.75,.8,0xe2ad59);b(.45,1.05,0,.5,.4,.8,0xda7d73);for(const x of [-.45,.45])for(const z of [-.48,.48])b(x,.2,z,.35,.35,.16,dark);b(-.45,1.15,0,.18,.5,.2,dark);}
  if(variant===2){for(let j=0;j<4;j++){b((j%2)*.5-.25,.2+Math.floor(j/2)*.4,0,.55,.4,.6,[a,0xe9c763,0xcd827b,0x83a981][j]);b((j%2)*.5-.25,.43+Math.floor(j/2)*.4,0,.2,.07,.2,cream);}}
  break;
 case 3:
  if(variant===0){for(let j=0;j<6;j++){const x=(j-2.5)*.22,h=.45+(j%3)*.3;b(x,h/2,0,.1,h,.12,0x73b9a0);b(x+.13,h*.7,0,.35,.12,.15,0x9dd7b0);b(x-.1,h*.4,.1,.3,.1,.15,0x68aaa1);}b(0,.05,0,1.4,.1,.65,0xe9d6a4);}
  if(variant===1){for(let j=0;j<7;j++){const t=(j-3)*.28;b(Math.sin(t)*.7,.3+Math.cos(t)*.4,0,.2,.15+Math.cos(t)*.5,.22,j%2?cream:0xefbab0);}b(0,.1,.15,.8,.2,.6,cream);b(0,.3,.27,.25,.25,.25,a);}
  if(variant===2){for(let j=0;j<10;j++){const t=j*Math.PI/5;b(Math.sin(t)*.65,.15,Math.cos(t)*.55,.4,.3,.35,0xc5c5a2);}b(0,.05,0,.9,.07,.8,0x8ecfc5);b(.3,.35,0,.42,.4,.42,0xebbaa0);b(.3,.58,0,.23,.1,.23,cream);for(const x of [.1,.45])b(x,.33,.3,.12,.12,.12,wood);}
  break;
 case 5:
  if(variant===0){for(let j=0;j<5;j++){const x=(j-2)*.3,h=.5+(j%3)*.35;b(x,h/2,Math.sin(j)*.2,.16,h,.18,j%2?a:0xea97b0);b(x+.15,h,0,.45,.18,.18,j%2?a:0xea97b0);}b(0,.08,0,1.5,.16,.8,c);}
  if(variant===1){for(let j=0;j<5;j++)b((j-2)*.26,.15+Math.abs(j-2)*.12,0,.3,.2,1.1-Math.abs(j-2)*.15,cream);b(0,.38,0,.3,.3,.3,a);}
  if(variant===2){for(const x of [-.65,.65]){b(x,.7,0,.4,1.4,.4,0x689b9b);b(x,1.4,0,.6,.2,.6,cream);}b(0,1.6,0,1.7,.3,.55,c);b(0,.08,0,1.8,.16,1.3,a);}
  break;
 case 4:
  if(variant===0){for(let j=0;j<5;j++)b(0,.15+j*.28,0,1.8-j*.28,.35,1.8-j*.28,dark);b(0,1.4,0,.45,.1,.45,0xffa061);}
  if(variant===1){for(let j=0;j<4;j++){b((j-1.5)*.4,.4+j*.15,0,.38,.8+j*.3,.65,j%2?c:dark);b((j-1.5)*.4,.1,.38,.12,.12,.3,a);}}
  if(variant===2){ring(.15,.6,dark);b(0,.1,0,.75,.1,.75,0xf2a55d);for(let j=0;j<3;j++)b(.1*j,.45+j*.3,0,.4+j*.1,.2,.4+j*.1,0xd5c4b3);}
  break;
 case 6:
  if(variant===0){b(0,.95,0,1.4,1.9,.6,0x688c89);for(const x of [-.45,0,.45]){b(x,.95,.32,.025,1.8,.035,dark);for(let j=0;j<3;j++)b(x+.15,1.4+j*.1,.34,.22,.025,.025,cream);b(x+.12,.85,.36,.06,.18,.07,gold);}}
  if(variant===1){for(const x of [-.5,.5])for(const z of [-.3,.3])post(x,z,.65);b(0,.72,0,1.3,.15,.9,wood);b(.15,.84,0,.5,.12,.4,cream);b(-.4,.84,.2,.25,.12,.3,0xa18aa5);}
  if(variant===2){b(0,1,0,1.9,1.2,.12,wood);b(0,1,.08,1.7,1,.06,0x3e615b);for(let j=0;j<4;j++)b(-.45+j*.3,1.1,.13,.18,.035,.025,cream);post(-.7,0);post(.7,0);}
  break;
 case 7:
  if(variant===0){b(0,1.5,0,1.2,3,1.2,dark);for(let j=0;j<6;j++)for(const x of [-.35,.35])b(x,.4+j*.42,.62,.22,.2,.035,j%2?a:0x73ded9);b(.3,3.3,0,.07,.6,.07,a);}
  if(variant===1){post(0,0,2.3,dark);b(0,2,0,1.3,.65,.22,a);b(0,2,.13,1,.4,.025,0x4667a0);for(const x of [-.3,0,.3])b(x,2,.16,.08,.28,.02,cream);}
  if(variant===2){b(0,.3,0,1.5,.45,.7,dark);b(0,.6,0,.7,.35,.65,0x76cfe4);for(const x of [-.65,.65])b(x,.2,.4,.24,.22,.12,a);}
  break;
 case 8:
  if(variant===0){for(let j=0;j<7;j++)b(0,.12+j*.23,0,2-j*.25,.25,2-j*.25,gold);b(0,1.8,0,.25,.15,.25,cream);}
  if(variant===1){b(0,1,0,.4,2,.4,0xd4b477);b(0,2.1,0,.22,.2,.22,gold);for(let j=0;j<5;j++)b(0,.3+j*.3,.23,.18,.08,.05,0x5e92a1);b(0,.12,0,.85,.24,.85,c);}
  if(variant===2){b(0,.4,0,.75,.7,.75,0xaf805a);b(0,.8,0,.45,.16,.45,gold);b(0,.91,0,.5,.12,.5,cream);for(const x of [-.4,.4])b(x,.55,0,.2,.25,.2,gold);}
  break;
 case 9:
  if(variant===0){post(0,0,1.4);for(let j=0;j<7;j++){const t=j*.9;for(let k=1;k<4;k++)b(Math.sin(t)*k*.25,1.5-k*.12,Math.cos(t)*k*.25,.5,.12,.3,j%2?0x638b5c:0x9bb66d);}}
  if(variant===1){b(0,.3,0,1.8,.45,.7,cream);for(let j=0;j<5;j++){b((j-2)*.3,.65,.4,.14,.7,.16,cream);b((j-2)*.3,.65,-.4,.14,.7,.16,cream);}b(-.9,.4,0,.6,.55,.65,cream);}
  if(variant===2){b(0,.2,0,1.7,.4,1.3,0x786f5a);b(.2,.6,0,1.2,.6,1,0x8d8d70);for(let j=0;j<3;j++)b((j-1)*.3,.95,0,.24,.08,.35,c);}
  break;
 case 10:
  if(variant===0){b(0,.7,0,1.4,1.4,1.2,0xbfa18a);roof(1.45,0x4a5968);for(const x of [-.45,.45])b(x,.85,.62,.25,.5,.05,gold);b(0,.4,.65,.32,.8,.1,wood);}
  if(variant===1){post(0,0,1.7,dark);b(.35,1.7,0,.85,.12,.12,dark);b(.65,1.35,0,.4,.5,.4,0xffbb78);b(.65,1.65,0,.55,.1,.55,wood);}
  if(variant===2){b(0,.45,0,.7,.9,.7,0x7b657b);b(0,.95,0,.85,.16,.85,cream);b(.4,.35,.2,.45,.65,.45,0x9d7c92);}
  break;
 case 11:
  if(variant===0){b(0,.12,0,1,.24,1,cream);b(0,1.1,0,.6,1.8,.6,0xdedcce);for(const x of [-.22,.22])b(x,1.1,.33,.05,1.7,.04,cream);b(0,2.1,0,1,.3,1,gold);}
  if(variant===1){for(let j=0;j<3;j++)b(0,.1+j*.16,0,2-j*.4,.2,1.5-j*.25,cream);b(0,.8,0,.65,.7,.65,0xb8bbc7);b(0,1.45,0,.45,.6,.45,cream);b(.45,1.1,0,.7,.2,.2,gold);}
  if(variant===2){b(0,.15,0,1.4,.3,1,cream);for(let j=0;j<4;j++)b((j-1.5)*.25,.4,0,.2,.3,.6,gold);}
  break;
 case 12:
  if(variant===0){b(0,.8,0,1.7,1.6,1.3,0x727b87);b(0,1.7,0,1.9,.2,1.5,dark);for(const x of [-.5,.5])b(x,1,.67,.35,.55,.04,a);b(0,.45,.7,.4,.9,.08,dark);post(.5,0,2.2,a);}
  if(variant===1){post(0,0,1.1,dark);b(0,1.2,0,1.7,.2,1.2,cream);b(0,1.4,0,1,.2,.7,c);b(0,1.8,0,.1,.9,.1,a);}
  if(variant===2){b(0,.15,0,.85,.3,.85,dark);b(0,.85,0,.6,1.1,.6,a);b(0,1.5,0,.85,.2,.85,dark);b(.1,.9,.32,.15,.45,.04,cream);}
  break;
 case 13:
  if(variant===0){b(0,.6,0,1,1.2,1,wood);for(const x of [-.55,.55]){post(x,0,2,gold);b(x,2,0,.35,.2,.35,dark);}b(0,.7,.55,.55,.55,.1,gold);b(0,.7,.62,.3,.3,.07,dark);}
  if(variant===1){b(0,1,0,2,.85,1,cream);b(0,.55,0,.7,.4,.55,wood);for(const x of [-.65,.65])post(x,0,1,gold);b(-1,1,0,.3,.5,.6,gold);}
  if(variant===2){for(let j=0;j<4;j++)b((j-1.5)*.3,.5+j*.2,0,.2,1+j*.4,.25,gold);b(0,.2,0,1.4,.4,.6,dark);}
  break;
 case 14:
  if(variant===0){for(let j=0;j<4;j++)crystal((j-1.5)*.35,Math.sin(j)*.25,.7+(j%3)*.45,j%2?0xd9f8f6:0x83b7d5);}
  if(variant===1){for(let j=0;j<4;j++)b(0,.2+j*.3,0,1.8-j*.4,.35,1.3-j*.2,j%2?cream:0x91c9df);}
  if(variant===2){for(const x of [-.7,.7])b(x,.8,0,.45,1.6,.6,c);b(0,1.6,0,1.9,.4,.8,cream);for(const x of [-.4,0,.4])b(x,1.15,0,.13,.6,.15,a);}
  break;
 case 15:
  if(variant===0){for(const x of [-.7,.7])for(const z of [-.4,.4])post(x,z,.6,0x9c83aa);b(0,.65,0,1.8,.25,1.2,0xf0cee1);b(-.55,.86,0,.45,.16,.8,cream);b(.2,.83,0,1,.1,1.2,0x8bbacd);}
  if(variant===1){b(0,.7,0,.3,1.4,.3,wood);b(0,1.4,0,1.5,1.4,.25,gold);b(0,1.4,.15,1.2,1.1,.05,cream);b(0,1.6,.2,.08,.45,.06,dark);b(.2,1.4,.2,.5,.07,.06,dark);}
  if(variant===2){for(let j=0;j<5;j++)b((j-2)*.35,.2+j*.25,0,.5,.2,.8,j%2?cream:a);}
  break;
 case 16:
  if(variant===0){for(const x of [-.65,.65])b(x,.8,0,.35,1.6,.5,0x6d7368);b(0,1.6,0,1.6,.3,.6,0x818878);b(-.4,1.9,0,.15,.5,.15,wood);for(let j=0;j<4;j++)b(.6-j*.2,.4+j*.25,.3,.15,.4,.15,a);}
  if(variant===1){b(0,.5,0,.75,1,.75,0x9ca259);for(const y of [.12,.85])b(0,y,0,.8,.12,.8,dark);b(0,.5,.39,.35,.35,.04,dark);b(0,.5,.42,.12,.2,.02,gold);}
  if(variant===2){for(let j=0;j<3;j++){const x=(j-1)*.5;post(x,0,.6+j*.2,0x71935e);b(x,.7+j*.2,0,.75,.3,.65,j%2?a:0xa1c478);b(x,.88+j*.2,0,.25,.1,.25,cream);}}
  break;
 case 17:
  if(variant===0){post(0,0,1.4,cream);for(let j=0;j<3;j++)b(0,1.4+j*.15,0,1.8-j*.35,.2,1.6-j*.3,0xcb8274);for(let j=0;j<4;j++)b(Math.sin(j*2)*.55,1.85,Math.cos(j*2)*.45,.23,.1,.23,cream);}
  if(variant===1){post(0,0,1.8,0x658757);for(let j=0;j<4;j++)b((j%2?1:-1)*.4,1+j*.3,0,.9,.16,.45,0xa0c879);b(.6,1.95,0,.22,.25,.22,0xbbe4de);}
  if(variant===2){for(let j=0;j<5;j++)b((j-2)*.3,.2+Math.sin(j*.8)*.2,0,.4,.35,.5,wood);for(let j=0;j<3;j++)b((j-1)*.35,.55,0,.22,.08,.3,gold);}
  break;
 case 18:
  if(variant===0){b(0,.2,0,1.5,.4,1.2,dark);b(0,1.2,0,.4,2,.4,gold);b(.55,2.2,0,1.5,.3,.4,gold);b(1.1,1.75,0,.08,.8,.08,dark);b(1.1,1.3,0,.5,.2,.5,0xc47866);}
  if(variant===1){for(let j=0;j<5;j++)b(Math.sin(j*2)*.4,.2+j*.22,Math.cos(j)*.3,.8,.4,.6,j%2?0x8ca3a5:0xb89a83);b(0,1.4,0,.65,.5,.55,c);b(0,1.45,.3,.4,.12,.05,a);}
  if(variant===2){b(0,.3,0,1.8,.6,.9,dark);for(let j=0;j<6;j++)b((j-2.5)*.26,.65,0,.16,.15,.8,c);for(const x of [-.85,.85])post(x,0,1.1,gold);}
  break;
 case 19:
  if(variant===0){for(const x of [-.4,.4])post(x,0,1,gold);b(0,1.3,0,1.7,.55,.55,cream);b(-.9,1.3,0,.15,.75,.75,a);b(.9,1.3,0,.12,.35,.35,dark);}
  if(variant===1){ring(.9,.9,gold);b(0,.9,0,.85,.85,.85,0x8ea9d1);b(0,.15,0,.55,.3,.55,cream);}
  if(variant===2){b(0,.55,0,1.5,.65,.8,c);b(0,1,0,1.2,.25,.9,cream);for(const x of [-.4,0,.4])b(x,.7,.42,.2,.25,.05,gold);for(const x of [-.5,.5])b(x,.2,0,.25,.25,1,a);}
  break;
 case 20:
  if(variant===0){for(let j=0;j<4;j++)b(Math.sin(j*2)*.2,.3+j*.4,0,.75-j*.1,.35,.65,dark);b(0,1.9,0,.18,.18,.18,a);}
  if(variant===1){for(const x of [-.7,.7])b(x,.95,0,.35,1.9,.4,cream);b(0,1.95,0,1.8,.3,.55,gold);b(0,.12,0,2,.24,1.3,cream);ring(.3,.65,a);}
  if(variant===2){post(0,0,1.2,gold);for(let j=0;j<7;j++)b(Math.sin(j*2.4)*.6,1.3+(j%3)*.2,Math.cos(j*2.4)*.5,.65,.4,.65,cream);}
 }
 return out;
}

const layoutCache=new Map<string,{blocks:Block[];motions:Motion[]}>();
export function buildRegionLayout(stage:number,length=ROUTE.length){
 const key=`${stage}:${length}`;
 if(!layoutCache.has(key)){
  layoutCache.set(key,createRegionLayout(stage,length));
  if(layoutCache.size>4)layoutCache.delete(layoutCache.keys().next().value!);
 }
 return layoutCache.get(key)!;
}
function createRegionLayout(stage:number,length:number){
  const theme=legacyTheme(stage);let blocks:Block[]=[];let motions:Motion[]=[];const color=new T.Color(),s=STAGES[stage-1];let seed=stage*7919;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>blocks.push({x:x*ROAD_WIDTH_SCALE,y,z,w:w*ROAD_WIDTH_SCALE,h,d,c});
  const stamp=(parts:Block[],x:number,z:number,scale=1,y=0)=>{
   const angle=rand()*Math.PI*2,roll=(rand()-.5)*.12,cs=Math.cos(angle),sn=Math.sin(angle);
   for(const p of parts){const px=(p.x*Math.cos(roll)-p.y*Math.sin(roll))*scale,py=(p.x*Math.sin(roll)+p.y*Math.cos(roll))*scale,pz=p.z*scale;
    blocks.push({x:x*ROAD_WIDTH_SCALE+px*cs-pz*sn,y:y+py,z:z+px*sn+pz*cs,w:p.w*scale,h:p.h*scale,d:p.d*scale,c:p.c,angle,roll});
   }
  };
  const tiles=[0xceb994,0xd4b58f,0xaddbd3,0x706971,0x426b7e,0x9b928f,0x4a5978,0xdfc38a,0x9aa17a,0x9b8294,0xdedbcd,0x8995a2,0xa48b71,0xc2e4e8,0xd0bdd8,0x849077,0xadba81,0x929393,0x8887ad,0x756d91];
  for(let z=-ROUTE.entrance;z>=-ROUTE.entrance-length;z-=2){
   const final=stage===20&&z<-240,voidZone=stage===19;
   for(let x=-8;x<=8;x+=2){
    const path=Math.abs(x)<=2,col=final?(path?0xebdfbc:0xd0d4b1):path?tiles[theme-1]:s.color;
    const tint=color.setHex(col).multiplyScalar(.96+rand()*.08).getHex();
    b(x,-.45,z,2,.8,2,tint);
    // Inlaid tile joints, rivets, fossil seams and current lines stay flat and traversable.
    if([2,6,7,11,12,13,18,19].includes(theme)){b(x,-.038,z-1,1.96,.018,.035,s.color);b(x-1,-.038,z,.035,.018,1.96,s.color);}
    else if(rand()<.48)b(x+rand()-.5,-.025,z+rand()-.5,.15+rand()*.5,.02,.1,s.accent);
    if(theme===7&&Math.abs(x)===4)b(x,-.02,z,.06,.03,1.8,s.accent);
    if(theme===4&&Math.abs(x)>=6)b(x,-.015,z,.14,.03,1.3,0xf6a06b);
    if((theme===19||voidZone)&&Math.abs(x)>=6)b(x,-.5,z,.9,.85,.9,0x3d3857);
   }
   // Region-specific silhouettes replace the uniform two canyon walls.
   for(const side of [-1,1]){
    // A continuous core meets the movement boundary; irregular shoulders hide the seams.
    const wallHeight=1.5+rand()*.8;
    b(side*8,wallHeight/2-.2,z,2.6,wallHeight+.4,2.1,s.color);
    b(side*(8.5+rand()*.6),wallHeight-.1,z+rand()*.3,1.8+rand()*.4,.6+rand()*.5,2.3,s.color);
    const x=side*(9+rand()),h=.7+rand()*2;
    if([1,3,5,9,17].includes(theme)){b(x,h*.22,z,2.5,h*.44,2.1,s.color);if(rand()<.35)stamp(sculpture(stage,0),x,z,1+rand());}
    else if([2,6,7,10,12,16,18].includes(theme)){if(rand()<.55)stamp(sculpture(stage,0),x,z,1.2+rand()*.8);}
    else if([4,8,14].includes(theme)){for(let j=0;j<3;j++)b(x+side*j*.3,j*.7+.3,z,2-j*.35,.7,2.2,s.color);}
    else if([11,13].includes(theme)){b(x,-.65,z,2.3,1.2,2.1,s.color);if(z%8===0)stamp(sculpture(stage,0),x,z,1.4);}
    else if(rand()<.4)stamp(sculpture(stage,stage===20?2:stage===19?0:1),x,z,1.2+rand());
   }
  }
  // Asymmetric groves and workshop clusters, with breathing room near nests and cover.
  let z=-9;
  let element=0;
  while(z>-length-3){
   const side=rand()<.5?-1:1,x=side*(4.8+rand()*1.2),variant=element++%15;
   stamp(sculpture(stage,variant),x,z,.8+rand()*.6);
   if(rand()<.7)stamp(sculpture(stage,(variant+5)%15),x+side*.7,z+1.7,.45+rand()*.35);
   if(rand()<.45)stamp(sculpture(stage,(variant+9)%15),-x,z-2.5,.7);
   if([3,5,9,17].includes(theme))for(let j=0;j<5;j++)b(x+(rand()-.5)*2,.12,z+(rand()-.5)*2,.1,.3,.1,s.accent);
   z-=(2.6+rand()*2.8)/STAGE_STEPS[routeStep(z,0,length)-1].density;
  }
  // Extra biome-specific clusters stay outside the central nest/escape lanes.
  // Reuse the batched sculptures and distance buckets instead of adding meshes.
  for(let patch=0;patch<Math.ceil(length/12);patch++){
   const side=patch%2?1:-1,z=-12-patch*12,x=side*(7+rand()*.5);
   stamp(sculpture(stage,patch%3),x,z,1.05+rand()*.35);
   stamp(sculpture(stage,(patch+1)%3),x-side*.65,z+2.5,.55+rand()*.2);
   stamp(sculpture(stage,(patch+2)%3),-x,z-3,.7+rand()*.25);
   // Low themed footing ties each cluster to its terrain without hiding players.
   for(let j=0;j<3;j++)b(x+side*j*.25,.035,z+1+j*.35,.45,.07,.35,j%2?s.accent:s.color);
  }
  // Four set pieces per expedition, intentionally not identical on both sides.
  for(const [i,depth] of [.15,.37,.63,.88].map(t=>ROUTE.entrance+t*length).entries()){
   const side=i%2?1:-1,v=i*4;
   stamp(sculpture(stage,v),side*5.8,-depth,1.8);
   stamp(sculpture(stage,(v+1)%15),-side*5.2,-depth-3,1.1);
  }
  for(const cover of STAGE_COVERS){
   b(cover.x/ROAD_WIDTH_SCALE,.28,cover.z,1.7/ROAD_WIDTH_SCALE,.56,1.7,s.color);
   const v=theme===6?1:theme===9?2:theme===3||theme===5?0:1;
   stamp(sculpture(stage,v),cover.x/ROAD_WIDTH_SCALE,cover.z,.8);
  }
  // Fine ground details form patches rather than another evenly spaced prop row.
  for(let i=0;i<Math.ceil(length*1.5);i++){
   const x=(rand()<.5?-1:1)*(3.2+rand()*3.5),z=-8-rand()*(length-4);
   // Quiet stretches between ecological patches; detail gathers by the landmark
   // and existing groves, instead of evenly peppering the entire escape lane.
   if(Math.abs(z+Math.min(38,length*.34))>9&&Math.sin(z*.23+stage)<.35)continue;
   if([1,9,17].includes(theme)){for(let j=0;j<3;j++)b(x+j*.1,.07,z,.06,.2+rand()*.12,.06,theme===1?0x90ad6c:0x769566);}
   else if([3,5,14].includes(theme)){b(x,-.02,z,.3+rand()*.5,.03,.18+rand()*.3,theme===14?0xeaf5ef:s.accent);}
   else if([4,16].includes(theme)){b(x,-.01,z,.3,.04,.3,theme===4?0xc67a55:0x9aa867);b(x+.15,.02,z,.12,.08,.15,s.color);}
   else if(theme===8){b(x,-.018,z,.8+rand()*.8,.025,.06,0xf0d7a0);}
   else if([6,15].includes(theme)){b(x,.015,z,.18,.025,.24,0xe8dcc5);}
   else if([7,12,13,18].includes(theme)){b(x,.015,z,.2,.04,.15,0x8c9291);}
   else {b(x,-.02,z,.14,.03,.14,s.accent);}
  }
  // Track sleepers, ducts and causeway rails make ground layouts recognizable.
  if(theme===2||theme===19)for(let z=-8;z>-length-5;z-=.8){b(5.6,.03,z,1,.09,.16,wood);for(const x of [5.25,5.95])b(x,.09,z,.08,.07,.8,theme===19?gold:0x727b85);}
  if(theme===13||theme===18)for(let z=-8;z>-length-5;z-=3)for(const x of [-7.5,7.5]){b(x,.15,z,.3,.3,3,gold);b(x,.16,z,.4,.4,.15,dark);}
  for(let i=0;i<Math.ceil(length/8);i++){
   const x=(i%3===0?-1:1)*(5.8+rand()*1.3),z=-12-i*7.7,phase=rand()*6;
   let parts:Block[],kind:Motion['kind'],y:number;
   if(theme===1){parts=[{x:0,y:0,z:.6,w:2,h:.18,d:.12,c:cream},{x:0,y:0,z:.6,w:.18,h:2,d:.12,c:cream}];kind='windmill';y=2;stamp(sculpture(1,1),x,z,1.25);}
   else if([2,13,18].includes(theme)){parts=[];for(let j=0;j<10;j++){const a=j*Math.PI/5;parts.push({x:Math.cos(a)*.6,y:0,z:Math.sin(a)*.6,w:.22,h:.18,d:.22,c:gold});}kind='spin';y=.8;}
   else if([3,5,12,19].includes(theme)){parts=[{x:0,y:0,z:0,w:.35,h:.18,d:.5,c:s.accent},{x:.24,y:0,z:-.1,w:.15,h:.3,d:.2,c:cream}];kind='float';y=.8+i%3*.6;}
   else if([4,7,10,14,16,20].includes(theme)){parts=[{x:0,y:0,z:0,w:.16,h:.25,d:.16,c:s.accent}];kind='float';y=.5;}
   else {parts=sculpture(stage,theme===15?0:2);kind=theme===15?'float':'sway';y=theme===15?1.4:0;}
   motions.push({blocks:parts,x:x*ROAD_WIDTH_SCALE,y,z,kind,phase});
  }
  // Closed garden wall at the end of region 20. The movement limit stops at its front.
  if(stage===20){
   // A clear gold-ringed arena frames one special nest in front of the final guardian.
   const nestZ=-ROUTE.entrance-length+FINAL_GUARDIAN.eggEndOffset;
   for(let j=0;j<24;j++){const a=j*Math.PI/12;b(Math.cos(a)*4.5,.015,nestZ+Math.sin(a)*4.5,.4,.05,.4,gold);}
   for(const x of [-5.7,5.7]){b(x,1.5,nestZ-8,.6,3,.6,cream);b(x,3.2,nestZ-8,.9,.3,.9,gold);}
   const wall=-ROUTE.entrance-length+1;
   b(0,.28,wall+.2,18,.56,1.8,0x9a9b8e);
   for(let row=0;row<4;row++)for(let x=-8;x<=8;x+=2)b(x+(row%2?.2:0),.7+row*.58,wall,1.96,.55,1.2,row%2?0xe7dec2:0xd7cfb5);
   b(0,3,wall,18,.3,1.6,0xc4a66a);
   for(const x of [-8,0,8]){b(x,1.7,wall+.2,.65,3.4,1.7,0xb4aa8d);b(x,3.45,wall+.2,.95,.2,1.9,gold);}
   for(let i=-2;i<=2;i++){b(i*.22,2,wall+.88,.2,.2,.08,gold);b(0,2+i*.22,wall+.88,.2,.2,.08,gold);}
  }
  blocks.push(...stageLandmarks(stage,length));
  // Cut each themed section at its own boundary; neighbours stay visible across it.
  const end=-ROUTE.entrance-length;
  // Three equal steps have their own palette, density and boundary marker.
  for(const p of blocks){
   const depth=Math.max(0,-p.z-ROUTE.entrance),position=depth/(length/3),step=Math.min(2,Math.floor(position));
   const blend=Math.min(1,(position-step)*8),previous=STAGE_STEPS[Math.max(0,step-1)].tint;
   const tint=previous+(STAGE_STEPS[step].tint-previous)*blend;
   p.c=color.setHex(p.c).multiplyScalar(tint).getHex();
  }
  for(let step=1;step<=3;step++){
   const z=-ROUTE.entrance-(step-1)*length/3-1;
   for(const side of [-1,1]){
    b(side*6,.55,z,.45,1.1,.45,s.color);
    for(let mark=0;mark<step;mark++)b(side*6,.4+mark*.23,z+.26,.22,.08,.05,s.accent);
   }
   if(step>1)for(let x=-5;x<=5;x+=1)b(x,-.015,z,.45,.025,.16,s.accent);
  }
  blocks=blocks.flatMap(p=>{const lo=Math.max(end,p.z-p.d/2),hi=Math.min(-ROUTE.entrance,p.z+p.d/2);return hi>lo?[{...p,z:(lo+hi)/2,d:hi-lo}]:[];});
  motions=motions.filter(m=>m.z<-ROUTE.entrance-2&&m.z>end+2);
  return {blocks,motions};
}
