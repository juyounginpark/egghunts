import {legacyTheme} from './stage-order';
import {explorationLayout} from './exploration-layout';
import {STAGES,ROUTE} from './stage-data';

export type Block = { x:number;y:number;z:number;w:number;h:number;d:number;c:number;angle?:number;roll?:number;obstacle?:boolean;solid?:boolean;gate?:number };
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
  layoutCache.set(key,explorationLayout(stage,sculpture));
  if(layoutCache.size>4)layoutCache.delete(layoutCache.keys().next().value!);
 }
 return layoutCache.get(key)!;
}
