import type {Block,Motion} from './region-layout';
import {pathX,routeLength} from './exploration-route';

/** Flat material regions connect individual scenes into a continuous landscape. */
export function biomeGround(stage:number,x:number,z:number,base:number){
 if(Math.abs(x-pathX(stage,z))<3)return base;
 const shore=8.7+Math.sin(z*.19+stage)*.8+Math.sin(z*.47)*.25;
 const river=Math.abs(Math.abs(x)-shore),patch=Math.sin(x*.8+z*.14)+Math.cos(z*.31-x*.17);
 switch(stage){
  case 1:return river<.65?0x7da9aa:patch>1?0xa2b383:base;
  case 3:return river<1.15?0x739da7:patch>.9?0xc0c9b1:base;
  case 4:return river<1.25?(river<.6?0xeaa044:0xc86a38):patch>1?0x42434b:base;
  case 7:return river<.65&&Math.sin(z*.18)>.25?0x8eb3a7:patch>1?0xe2c98f:base;
  case 8:return river<.8?0x6f9c97:patch>.6?0x80976d:base;
  case 9:return river<.65&&Math.cos(z*.23)>.1?0x8286a6:base;
  case 10:return Math.abs(x)>10&&patch>.2?0xdce1d8:base;
  case 11:return patch>1?0x9cab83:patch<-.9?0x747e8b:base;
  case 13:return river<1.2?0x92bfcb:patch>.7?0xe0eae3:base;
  case 14:return patch>.65?0xcebed2:patch<-.9?0xb7c4d3:base;
  case 15:return river<.9&&Math.sin(z*.2)>0?0x8b9d66:patch>.7?0x647561:base;
  case 16:return patch>.6?0xa0b578:patch<-.8?0x7b9262:base;
  case 18:return river<1?0x797b9c:patch>.8?0xa9a2b9:base;
  case 19:return river<.6?0x464053:patch>.8?0x80718f:base;
  case 20:return river<.9?0x9ac2b1:patch>.7?0xc5cf9c:base;
  default:return base;
 }
}

/** Biome silhouettes, authored separately from the shared collectible-scale props. */
function habitat(stage:number,variant:number){
 const blocks:Block[]=[],motions:Motion[]=[];
 const v=variant%4,wood=0x795c44,leaf=0x658b60,ivory=0xe4dfc9,stone=0x929b99,gold=0xc4a35b,dark=0x39434b;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,target=blocks)=>target.push({x,y,z,w,h,d,c,solid:false});
 const motion=(kind:Motion['kind'],x=0,y=0,z=0,travel?:Motion['travel'])=>{const m:Motion={kind,x,y,z,phase:variant*.83,blocks:[],travel};motions.push(m);return m.blocks;};
 const crown=(x:number,y:number,z:number,w:number,c:number,target=blocks)=>{
  b(x,y,z,w,.55,w*.76,c,target);b(x-.12,y+.38,z-.06,w*.75,.25,w*.58,c,target);
 };
 const stalk=(x:number,z:number,h:number,c:number,w=.2)=>b(x,h/2,z,w,h,w,c);
 const pool=(c:number,rim:number)=>{
  // Interlocking lobes form a shoreline; there is no raised walking platform.
  for(let k=-2;k<=2;k++)b(k*.48,.025,Math.sin(k*1.8)*.2,.52,.045,2.6-Math.abs(k)*.46,c);
  for(let k=0;k<7;k++){const t=k*.9;b(Math.cos(t)*1.15,.1,Math.sin(t)*1.05,.45,.2,.4,rim);}
 };
 const motes=(c:number,rise=1.6)=>{
  const p=motion('drift',0,.2,0,{x:.2,y:rise,z:.15});
  for(let j=0;j<4;j++)b(Math.sin(j*2.4)*.8,j*.13,Math.cos(j*1.7)*.7,.12,.12,.12,c,p);
 };
 const fronds=(h:number,c:number)=>{
  stalk(0,0,h,wood,.28);const p=motion('sway',0,h,0);
  for(let arm=0;arm<6;arm++)for(let j=1;j<=3;j++){
   const t=arm*Math.PI/3;b(Math.cos(t)*j*.32,.2-j*j*.05,Math.sin(t)*j*.32,.55-j*.07,.16,.45,c,p);
  }
 };
 const cloud=(y:number,c=ivory)=>{const p=motion('float',0,y,0);for(let j=-1;j<=1;j++)crown(j*.55,Math.abs(j)*-.15,0,1.1,c,p);};
 const gear=(y:number,c:number)=>{
  const p=motion('windmill',0,y,0);b(0,0,0,.55,.55,.25,dark,p);
  for(let j=0;j<8;j++){const t=j*Math.PI/4;b(Math.cos(t)*.7,Math.sin(t)*.7,0,.38,.38,.22,c,p);}
  stalk(0,0,y,dark,.35);
 };
 switch(stage){
 case 1:{
  if(v<2){stalk(-.2,0,2.4,wood,.45);for(const [x,y,z,w] of [[-.6,2.3,0,1.6],[.55,2.65,.15,1.7],[0,3.2,0,1.4]])crown(x,y,z,w,v?0x8ca768:leaf);for(const x of [-.5,.5])b(x,.15,.2,.85,.3,.5,wood);}
  else if(v===2){pool(0x7da9aa,0x8eaa79);for(const x of [-.8,.9])stalk(x,.6,1.1,leaf);}
  else for(let j=0;j<7;j++){const x=Math.sin(j*2)*.95,z=Math.cos(j*2)*.8;stalk(x,z,.4+j%3*.15,leaf,.09);b(x,.5+j%3*.15,z,.35,.14,.3,j%2?0xe9cea0:0xc899aa);}
  const p=motion('sway',0,.25,0);for(let j=-2;j<=2;j++)b(j*.38,0,.7,.17,.5,.12,0x8daa70,p);
  if(v===3){const wings=motion('float',0,1.25,0);for(const x of [-.16,.16])b(x,0,0,.25,.08,.32,0xe6c087,wings);}
  break;
 }
 case 2:{
  if(v===0){for(let row=0;row<3;row++)for(let j=-1;j<=1;j++){const x=j*.8+(row%2?.15:0),c=[0xb97770,0x749eaf,0xd2b876][(j+row+3)%3];b(x,.35+row*.65,0,.75,.6,.8,c);b(x,.7+row*.65,0,.22,.12,.22,c);}}
  else if(v===1){for(let j=-2;j<=2;j++){const h=1.5+(j+2)%3*.4,c=[0xc77d78,0x83a575,0x789eb8,0xb89bba,0xd6b770][j+2];b(j*.4,h/2,0,.3,h,.35,c);b(j*.4,h+.15,0,.18,.3,.22,ivory);b(j*.4,h+.34,0,.08,.1,.1,c);}}
  else if(v===2){const p=motion('spin',0,.6,0);for(let j=0;j<3;j++)b(0,j*.2,0,1.4-j*.4,.22,1.4-j*.4,[0x78a5b7,0xd0b46b,0xc28077][j],p);b(0,.8,0,.18,.5,.18,wood,p);}
  else {b(0,.5,0,1.7,1,1.2,0x9d86ad);gear(1.45,gold);for(const x of [-.6,.6])b(x,.2,.6,.4,.4,.2,ivory);}
  break;
 }
 case 3:{
  if(v===0){for(let j=-2;j<=2;j++){const h=2.3-Math.abs(j)*.35;stalk(j*.4,0,h,0xc786a5,.22);b(j*.4,h*.65,0,.65,.2,.22,0xda9eb2);crown(j*.4,h,0,.5,0xc786a5);}}
  else if(v===1){const p=motion('sway');for(let j=-2;j<=2;j++)for(let k=0;k<4;k++)b(j*.35+Math.sin(k+j)*.12,.3+k*.42,0,.2,.48,.22,j%2?0x749e9b:0x91b591,p);}
  else if(v===2){for(let j=-1;j<=1;j++){const h=1.4+(j+1)*.3;b(j*.65,h/2,0,.5,h,.5,0xb8a778);b(j*.65,h+.015,0,.3,.04,.3,0x625c6d);}}
  else {pool(0x78a2b1,0xb4c1b1);for(let j=-1;j<=1;j++){crown(j*.7,.25,0,.7,0xcbb5cf);b(j*.7,.5,.15,.25,.25,.25,ivory);}}
  motes(0xc0ded9,2.3);break;
 }
 case 4:{
  if(v===0||v===2){pool(0xc85c32,0x49454d);const hot=motion('pulse');for(let j=-1;j<=1;j++)b(j*.6,.055,j*.25,.5,.025,1.35,0xf1b353,hot);}
  if(v===1){for(let j=-2;j<=2;j++){const h=1.5+(j+2)%3*.55;b(j*.45,h/2,0,.48,h,.85,j%2?0x45444c:0x65606a);b(j*.45,h+.06,0,.4,.12,.7,0x767078);}}
  if(v===2){b(0,1.25,-.65,1.8,2.5,.7,0x47464e);b(0,1.22,-.23,.72,2.4,.08,0xd66a35);const flow=motion('drift',0,1.1,-.16,{x:0,y:-.9,z:0});for(let j=0;j<3;j++)b((j-1)*.19,.3+j*.4,0,.13,.5,.045,0xf2bd63,flow);}
  if(v===3){for(let j=-2;j<=2;j++)b(j*.4,.18+Math.abs(j)*.15,0,.65,.4,1.3,0x4d4851);const hot=motion('pulse');for(let j=-2;j<=2;j++)b(j*.4,.42,Math.sin(j)*.25,.4,.045,.15,0xe38a41,hot);}
  motes(0xf0ae61,2.4);break;
 }
 case 5:{
  if(v===0){for(const x of [-1,1])stalk(x,0,2.3,0x79727d,.2);b(0,1.45,0,2.1,1.3,.2,wood);b(0,1.45,.13,1.85,1.05,.05,0x46635b);for(let j=-2;j<=2;j++)b(j*.28,1.5+(j%2)*.15,.17,.19,.06,.03,ivory);}
  else if(v===1){for(const x of [-1,1])stalk(x,0,2.5,wood,.2);for(let row=0;row<3;row++){b(0,.2+row*.75,0,2.1,.13,.65,wood);for(let j=-2;j<=2;j++)b(j*.35,.48+row*.75,0,.25,.45,.42,j%2?0x8d6d7e:0x708987);}}
  else if(v===2){b(0,1.4,-.3,2.3,2.8,.3,0x807b83);b(0,1.6,-.11,1.4,1.6,.08,0x3e4757);for(const x of [-.7,0,.7])b(x,1.6,-.03,.1,1.7,.1,ivory);b(0,1.6,-.03,1.5,.1,.1,ivory);}
  else {const p=motion('float',0,1.1,0);for(const x of [-.4,.4]){b(x,0,0,.75,.12,1,0xa08b9b,p);b(x,.08,0,.66,.08,.9,ivory,p);}}
  if(v%2===0)motes(0x9bc5b7,1.2);break;
 }
 case 6:{
  if(v===0){b(0,1.7,0,2,3.4,1.1,0x3c4b62);for(let row=0;row<4;row++)for(const x of [-.6,0,.6])b(x,.6+row*.65,.57,.32,.3,.05,row%2?0x86bdbd:0xa899c0);b(.5,3.65,0,.45,.5,.5,dark);}
  else if(v===1){stalk(-.8,0,2.6,dark,.25);b(0,2,0,2.1,1,.22,0x4f5272);const p=motion('pulse');for(let j=-2;j<=2;j++)b(j*.32,2,.14,.16,.55,.05,j%2?0xc894c3:0x83cdd0,p);}
  else if(v===2){b(0,.65,0,1.8,1.3,1.3,0x607486);gear(1.2,0x9eafb9);for(const x of [-.8,.8])b(x,1.6,-.4,.2,1,.2,dark);}
  else {b(0,.2,0,1.4,.4,1.3,dark);const p=motion('spin',0,1.25,0);for(const x of [-.5,.5])b(x,0,0,.12,1.1,1,0x85bfca,p);b(0,0,0,1.1,.12,1,0x85bfca,p);}
  break;
 }
 case 7:{
  if(v===0){for(let row=0;row<4;row++)b(Math.sin(row)*.22,.3+row*.48,0,2.4-row*.35,.5,1.6-row*.18,row%2?0xc3a171:0xaa8255);}
  else if(v===1){for(let row=0;row<3;row++)b(row*.15,.12+row*.2,0,2.6-row*.6,.25,2-row*.35,row%2?0xd3b778:0xe0c78e);}
  else if(v===2){pool(0x739f9b,0xc8b27a);fronds(2.5,0x879e64);}
  else {for(let j=-1;j<=1;j++)b(j*.7,1,0,.65,2,.5,0xb79867);for(let j=-2;j<=2;j++)b(j*.35,1.2,.28,.18,.45,.05,j%2?0x8b704f:0xd8bd87);b(0,2.1,0,2.3,.25,.7,0xd3b884);}
  if(v<2){const p=motion('drift',-.5,.2,0,{x:1,y:.25,z:.1});for(let j=0;j<3;j++)b(0,j*.15,j*.4,.15,.1,.12,0xe6d29f,p);}break;
 }
 case 8:{
  if(v===0)fronds(1.8,0x5f8b60);
  else if(v===1){for(let j=-2;j<=2;j++)b(j*.45,.3+Math.cos(j*.6)*.45,0,.65,.6,1.1,wood);for(const x of [-.75,.65]){stalk(x,.3,2.5,wood,.5);crown(x,2.5,.3,1.3,leaf);}}
  else if(v===2){b(0,.3,0,2.4,.25,.25,ivory);for(let j=-2;j<=2;j++)for(const side of [-1,1]){b(j*.4,.7,side*.5,.18,1,.18,ivory);b(j*.4,1.2,side*.32,.18,.2,.5,ivory);}}
  else {b(0,1.45,-.45,2.4,2.9,.8,0x7b8980);pool(0x75aaa8,0x8a9d82);b(0,1.5,0,1.1,2.9,.12,0x82babe);const p=motion('drift',0,1.4,.1,{x:0,y:-1,z:0});for(let j=0;j<4;j++)b((j%2-.5)*.4,.3+j*.4,0,.12,.6,.05,0xc9ddd0,p);}
  break;
 }
 case 9:{
  if(v===0){b(0,.9,0,2.5,1.8,.55,0x9a8c91);for(let j=0;j<3;j++)b(0,1.9+j*.13,0,2.8-j*.35,.16,1-j*.2,0x57576d);for(const x of [-.9,.9])b(x,2.2,0,.6,.12,.8,0x6d6a81);}
  else if(v===1){for(let j=-2;j<=2;j++){const h=1.7+(j+2)%3*.45;stalk(j*.4,0,h,0x6e957c,.18);for(let k=0;k<4;k++)b(j*.4,.3+k*.5,0,.22,.06,.22,0xa2b295);b(j*.4+.2,h-.4,0,.6,.15,.4,leaf);}}
  else if(v===2){stalk(-.65,0,2.1,wood,.18);b(0,2,0,1.4,.13,.15,wood);const p=motion('sway',.3,1.9,0);b(0,-.5,0,.65,.8,.6,0xd8ba86,p);for(const y of [-.1,-.9])b(0,y,0,.8,.13,.75,0x6b6878,p);}
  else pool(0x797eac,0x9b99a4);
  if(v===3)motes(0xa6c5bd,1.6);break;
 }
 case 10:{
  if(v<2){for(const x of [-.9,.9]){b(x,1.25,0,.45,2.5,.5,ivory);for(const y of [.15,2.5])b(x,y,0,.8,.25,.8,0xb9bdba);}b(0,2.7,0,2.6,.3,.9,ivory);if(v===1)for(let j=0;j<3;j++)b(0,2.95+j*.2,0,2.5-j*.7,.22,.8,gold);}
  else if(v===2)cloud(1.2);
  else {stalk(0,0,1.8,wood,.25);for(const x of [-.6,0,.6])crown(x,1.6+Math.cos(x*2)*.4,0,.85,0x84966d);motes(gold,1.7);}
  break;
 }
 case 11:{
  if(v===0){for(const x of [-.65,.55]){const h=x<0?1.7:2.3;stalk(x,0,h,0x8d9b9b,.3);crown(x,h,0,1.25,0x9bab79);b(x,h+.45,0,.45,.15,.4,0xd0d99a);}}
  else if(v===1){const p=motion('sway');for(let arm=0;arm<4;arm++)for(let j=0;j<5;j++)b(Math.sin(j*.4+arm)*.7,.2+j*.4,Math.cos(arm*2)*.6,.28,.45,.3,j%2?0x8985ad:0x98ad87,p);}
  else if(v===2){b(0,.15,0,1.5,.3,1.4,dark);for(const x of [-.6,.6])stalk(x,0,2.1,stone,.18);b(0,2.2,0,1.5,.25,1.4,dark);const p=motion('float',0,1.1,0);crown(0,0,0,.8,0xa9ba86,p);}
  else {const p=motion('spin',0,1.5,0);b(0,0,0,2.2,.2,1.5,stone,p);crown(0,.25,0,1,0x91b7ac,p);for(const x of [-.8,.8])b(x,0,.6,.2,.15,.15,gold,p);}
  if(v<2)motes(0xc1c7aa,1.8);break;
 }
 case 12:{
  if(v===0){for(const x of [-.65,.65]){stalk(x,0,2.6,gold,.35);for(const y of [.4,1.2,2.1])b(x,y,0,.48,.18,.48,0x8e7354);}b(0,2.5,0,1.5,.35,.35,gold);}
  else if(v===1){b(0,1,0,2,2,.6,0x6b6156);gear(1.6,gold);}
  else if(v===2){for(let row=0;row<5;row++)b((row%2)*.1,.3+row*.5,0,1,.45,.9,row%2?0x96715a:0xb18c6a);const p=motion('drift',0,2.5,0,{x:.5,y:1.5,z:0});for(let j=0;j<3;j++)b(j*.1,j*.2,0,.4+j*.1,.3,.4,0xc9c3af,p);}
  else {const p=motion('float',0,2.2,0);crown(0,.1,0,2.2,0xc7b48b,p);b(0,-.65,0,1,.35,.6,wood,p);for(const x of [-.4,.4])b(x,-.3,0,.08,.6,.08,dark,p);}
  break;
 }
 case 13:{
  if(v<2){for(let j=-2;j<=2;j++){const h=1.4+(j+2)%3*.7;b(j*.45,h/2,0,.5,h,.8,j%2?0x9ecbd4:0xbedcdf);b(j*.45,h+.15,0,.3,.3,.55,ivory);}}
  else if(v===2)pool(0x8fbac9,0xd8e7e1);
  else for(let j=-1;j<=1;j++)crown(j*.55,.35+Math.abs(j)*.2,0,1.2,0xe0eae1);
  const p=motion('drift',0,2.3,0,{x:.45,y:-1.6,z:.2});for(let j=0;j<4;j++)b(Math.sin(j*2)*.9,j*.2,Math.cos(j*2)*.7,.13,.1,.13,0xf0efe2,p);break;
 }
 case 14:{
  if(v===0){const p=motion('float',0,1.3,0);for(let j=-1;j<=1;j++){b(j*.6,Math.abs(j)*.2,0,.55,1.4,.12,ivory,p);b(j*.6,.1+Math.abs(j)*.2,.08,.2,.3,.04,j%2?0xb4879e:0x747995,p);}}
  else if(v===1){const p=motion('float',0,.9,0);b(0,0,0,1.4,.2,1.2,0xc0a1b9,p);for(const x of [-.6,.6])b(x,.4,0,.18,.7,1.1,0xd6bfd0,p);for(const z of [-.5,.5])b(0,.4,z,1.3,.7,.18,0xd6bfd0,p);b(.95,.5,0,.6,.18,.25,gold,p);b(1.15,.25,0,.18,.6,.25,gold,p);}
  else if(v===2){const p=motion('float',0,.4,0);for(const x of [-.8,.8])b(x,1,0,.25,2,.3,0x9a8eb4,p);b(0,2,0,1.9,.3,.35,gold,p);b(.5,1,0,.7,1.7,.15,0xc1abc5,p);}
  else cloud(1.2,0xd8c9db);break;
 }
 case 15:{
  if(v===0){for(let j=-1;j<=1;j++){const h=1+(j+1)%3*.65;b(j*.7,h/2,0,.6,h,.75,0x828c81);stalk(j*.7,0,h+.5,0x7d6452,.08);}b(0,.3,.3,2.1,.4,.9,0x697865);}
  else if(v===1){for(const x of [-.8,.8])stalk(x,0,2.5,0x8c6d53,.2);for(const y of [.4,1.4,2.4])b(0,y,0,1.9,.16,.2,0x9b7c5b);for(const x of [-.7,0,.7])crown(x,.5,.2,.7,0x7c9967);}
  else if(v===2){pool(0x839559,0x616d61);motes(0xb4c183,1.5);}
  else {for(let j=-2;j<=2;j++){stalk(j*.4,0,.65,0xa3ab86,.12);crown(j*.4,.75,0,.55,0x93a86e);}motes(0xbbc899,1.3);}
  break;
 }
 case 16:{
  if(v===0){stalk(0,0,2.2,ivory,.5);crown(0,2.2,0,2.5,0xc19085);for(const x of [-.6,.4])b(x,2.65,.1,.4,.12,.4,ivory);}
  else if(v===1){const p=motion('sway');for(let j=-2;j<=2;j++){b(j*.35,1.25,0,.14,2.5,.2,leaf,p);b(j*.35+.2,1.7,0,.55,.16,.4,0x93ad74,p);}}
  else if(v===2){stalk(0,0,2.3,leaf,.16);for(let j=0;j<8;j++){const t=j*Math.PI/4;b(Math.cos(t)*.65,2.3+Math.sin(t)*.65,0,.35,.35,.3,ivory);}motes(ivory,2.2);}
  else {for(let j=-2;j<=2;j++)b(j*.4,.25,0,.45,.18,2.3-Math.abs(j)*.45,0x8ba76e);b(0,.38,0,.1,.08,2.2,0xc0c793);for(const x of [-.5,.5])b(x,.37,0,.8,.06,.08,0xc0c793);}
  break;
 }
 case 17:{
  if(v===0){for(let j=0;j<6;j++)b((j%3-1)*.65,.3+Math.floor(j/3)*.55,(j%2)*.25,.75,.5,.9,j%2?0x6d7980:0x9b9280);b(.5,1.6,0,.45,1,.5,0x858f91);}
  else if(v===1){b(0,.3,0,1.4,.6,1.3,dark);stalk(-.4,0,2.2,0xab976c,.4);b(.1,2.1,0,1.4,.35,.4,0xc0ab77);for(const x of [.55,.9])b(x,1.65,0,.15,.65,.2,stone);}
  else if(v===2){for(const x of [-.6,.6])stalk(x,0,2.2,stone,.45);b(0,2.2,0,1.7,.45,.45,stone);for(const x of [-.6,.6])b(x,.7,0,.6,.15,.6,gold);}
  else {b(0,.4,0,1.8,.8,1.4,dark);gear(1.65,0xb4a27a);}
  if(v===1){const p=motion('pulse');b(.6,2.4,0,.25,.18,.25,0xdbb575,p);}break;
 }
 case 18:{
  if(v===0){const p=motion('spin',0,1.5,0);crown(0,0,0,.9,0xd3b57a,p);for(let j=0;j<8;j++){const t=j*Math.PI/4;b(Math.cos(t)*1.1,0,Math.sin(t)*.8,.1,.1,.1,ivory,p);}b(1.1,0,0,.45,.45,.45,0x9cb9c2,p);}
  else if(v===1){const p=motion('float',0,1.5,0);for(let j=-2;j<=2;j++)crown(j*.4,Math.sin(j)*.2,0,.8,j%2?0x9e92b6:0x8298ba,p);}
  else if(v===2){for(const x of [-.65,.65])stalk(x,0,1.2,stone,.15);b(0,1.4,0,.65,.6,2,0xb9b7c3);b(0,1.4,1.05,.5,.5,.12,dark);}
  else {const p=motion('pulse');for(let j=0;j<5;j++){const x=Math.sin(j*1.8),y=1+Math.cos(j*1.5)*.6;b(x,y,0,.2,.2,.15,ivory,p);if(j)b(x*.5,y,0,.65,.05,.05,0x9faec7,p);}}
  break;
 }
 case 19:{
  if(v===0){const p=motion('float',0,.8,0);for(let j=0;j<3;j++)b((j-1)*.55,j*.45,0,.75,.6,.9,j%2?0x837790:0x514a61,p);}
  else if(v===1){for(const x of [-.75,.75])b(x,1.2,0,.5,2.4,1,0x4d465c);const p=motion('pulse');b(0,1.2,0,.14,2.1,.1,0xb6a6cb,p);for(const x of [-.3,.3])b(x,1.6,0,.5,.1,.12,0x9380b0,p);}
  else if(v===2){for(let j=0;j<5;j++)b(Math.sin(j*.7)*.35,.3+j*.5,0,1.2-j*.16,.55,.9-j*.1,j%2?0x756780:0x51495e);}
  else {const p=motion('spin',0,1.4,0);for(let j=0;j<8;j++){const t=j*Math.PI/4;b(Math.cos(t),Math.sin(t),0,.28,.28,.25,0xab9cb9,p);}}
  break;
 }
 case 20:{
  if(v===0){stalk(0,0,2.5,0xb3a078,.45);for(const [x,y,w] of [[-.6,2.3,1.6],[.6,2.7,1.5],[0,3.2,1.4]])crown(x,y,0,w,0xc8bd80);motes(0xeee2b0,2.3);}
  else if(v===1){for(const x of [-.95,.95]){stalk(x,0,2.1,0xa4b890,.25);for(let j=0;j<3;j++)crown(x,.5+j*.65,0,.55,j%2?0xcba6b4:0xc6d1a2);}crown(0,2.1,0,2,0xa8bf92);for(const x of [-.5,.5])b(x,2.4,.35,.3,.25,.2,0xe9d6b4);}
  else if(v===2){pool(0x98c2b5,0xc9cbb1);const p=motion('float',0,1.1,0);for(const x of [-.4,.4]){b(x,0,0,.3,1,.3,0xb5d3c4,p);b(x,.6,0,.15,.2,.15,ivory,p);}}
  else {pool(0xa4c6ab,0xa1b789);for(let j=0;j<5;j++)crown(Math.sin(j*2)*.8,.25,Math.cos(j*2)*.7,.5,j%2?0xe2c6ce:0xe7dbb4);motes(0xe6cfbd,1.2);}
  break;
 }
 }
 return {blocks,motions};
}

/** Three visual depths: low shorelines, middle scenes, dense outer silhouettes. */
export function biomeScenery(stage:number,existing:Block[]){
 const blocks:Block[]=[],motions:Motion[]=[],length=routeLength(stage);
 const occupied=existing.filter(b=>b.y+b.h/2>.4);
 let index=0;
 for(let depth=2.2;depth<length-2;depth+=2.6+(index%5)*.24)for(const side of [-1,1]){
  const n=index++,z=-6-depth+Math.sin(n*2.3)*.8;
  const built=[5,6,10,12,17].includes(stage);
  const x=side*(built?10.6+Math.sin(n*1.7)*.2:10.3+Math.sin(n*1.7)*.65),scale=.78+(n%4)*.07;
  // The small inner groups vary their spacing instead of forming prop rows.
  const sites=[{x,z,scale}];
  if(n%3===0&&depth<length*.84)sites.push({x:side*(6.3+(n%5)*.35),z:z+1.2,scale:.62});
  for(const site of sites){
   const radius=1.55*site.scale;
   if(Math.abs(site.x-pathX(stage,site.z))<3+radius)continue;
   if(occupied.some(b=>Math.abs(b.x-site.x)<b.w/2+radius&&Math.abs(b.z-site.z)<b.d/2+radius))continue;
   const shape=habitat(stage,n+(side>0?2:0));
   for(const p of shape.blocks)blocks.push({...p,x:site.x+p.x*site.scale,y:p.y*site.scale,z:site.z+p.z*site.scale,w:p.w*site.scale,h:p.h*site.scale,d:p.d*site.scale});
   for(const m of shape.motions)motions.push({...m,x:site.x+m.x*site.scale,y:m.y*site.scale,z:site.z+m.z*site.scale,phase:m.phase+stage*.4,travel:m.travel?{x:m.travel.x*site.scale,y:m.travel.y*site.scale,z:m.travel.z*site.scale}:undefined,blocks:m.blocks.map(p=>({...p,x:p.x*site.scale,y:p.y*site.scale,z:p.z*site.scale,w:p.w*site.scale,h:p.h*site.scale,d:p.d*site.scale}))});
   occupied.push({x:site.x,y:1,z:site.z,w:radius*1.6,h:2,d:radius*1.6,c:0,solid:false});
  }
 }
 if(stage===4){
  // Broad lava falls are part of the canyon face, not hazards on the route.
  for(const side of [-1,1])for(let depth=5;depth<length-4;depth+=11){
   const x=side*12.46,z=-6-depth-(side>0?3:0);
   blocks.push({x,y:1.5,z,w:.07,h:3,d:1.2,c:0xc56939,solid:false});
   motions.push({x:x-side*.06,y:1.4,z,kind:'drift',phase:depth*.37,travel:{x:0,y:-.9,z:0},blocks:[0,1,2].map(j=>({x:0,y:.1+j*.45,z:(j-1)*.25,w:.035,h:.75,d:.17,c:0xefb459,solid:false}))});
  }
 }
 return {blocks,motions};
}
