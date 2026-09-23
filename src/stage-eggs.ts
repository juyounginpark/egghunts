import {STAGES} from "./stage-data";
import {EGGS} from "./data";
export type EggAppearance={type:number;stageId?:number;variant?:number};
export type EggCell=[number,number,number,number];
export const STAGE_EGG_NAMES=[
 ['도토리','꽃봉오리','딸기','새싹','벌집'],['주사위','블록 성','팽이','태엽 로봇','장난감 기차'],
 ['부채 조개','진주 조개','말미잘','불가사리','물방울'],['현무암','꼬마 화산','용암 균열','불꽃 화로','운석'],
 ['앵무조개','아귀 등불','심해 진주','해파리','아기 크라켄'],['마법 책','사물함','유령','학교 종','잉크병'],
 ['네온 배터리','사이버 큐브','안테나','호버 캡슐','회로 칩'],['풍뎅이','피라미드','황금 항아리','태양 원반','스핑크스'],
 ['갈비 화석','뿔 공룡','등판 공룡','공룡 발자국','호박 화석'],['등롱','도깨비 박','도깨비 뿔','기와 지붕','초승달'],
 ['대리석 기둥','월계관','황금 리라','날개','번개'],['비행접시','외계 캡슐','외눈 외계인','수정 원자로','삼각 탐사선'],
 ['증기 보일러','톱니바퀴','비행선','굴뚝','태엽 시계'],['수정','이글루','얼음 펭귄','눈꽃','고드름'],
 ['구름 시계','꿈 베개','마법 모자','달과 별','꿈의 열쇠'],['방사능 통','돌연변이 덩굴','격리 원자로','독버섯','돌연변이 눈'],
 ['나뭇잎','무당벌레','고치','나비','육각 벌집'],['볼트 상자','자석','무한궤도','기계 집게','고철 가시'],
 ['고리 행성','혜성','별','망원경','은하 나선'],['공허 결정','차원문','기억의 책','황금 날개','세계수'],
];
export function appearanceOf(e:EggAppearance){return e.stageId&&e.stageId>=1&&e.stageId<=20&&e.variant!==undefined&&e.variant>=0&&e.variant<5?{stage:e.stageId,variant:e.variant}:null;}
export function eggName(e:EggAppearance){const a=appearanceOf(e);return a?`${STAGE_EGG_NAMES[a.stage-1][a.variant]} 알`:EGGS[e.type].name;}
const cache=new Map<string,{cells:EggCell[];colors:string[]}>();
/** All sculptures live on a 20³ integer grid. Shape, silhouette and appendages vary, not just paint. */
export function stageEggCells(stage:number,v:number){
 const key=`${stage}:${v}`,cached=cache.get(key);if(cached)return cached;
 const s=STAGES[stage-1],colors=[s.color,s.accent,0xffefd4,0x343448,0xdba85b,0x89bb93].map(c=>`#${c.toString(16).padStart(6,'0')}`);
 const cells=new Map<number,EggCell>();
 const cell=(x:number,y:number,z:number,c=1)=>{x=Math.round(x);y=Math.round(y);z=Math.round(z);if(x>=0&&x<20&&y>=0&&y<20&&z>=0&&z<20)cells.set(x+y*20+z*400,[x,y,z,c]);};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c=1)=>{for(let i=Math.ceil(x-w/2);i<x+w/2;i++)for(let j=Math.ceil(y-h/2);j<y+h/2;j++)for(let k=Math.ceil(z-d/2);k<z+d/2;k++)cell(i,j,k,c);};
 const orb=(x:number,y:number,z:number,rx:number,ry:number,rz:number,c=1)=>{for(let i=0;i<20;i++)for(let j=0;j<20;j++)for(let k=0;k<20;k++)if(((i-x)/rx)**2+((j-y)/ry)**2+((k-z)/rz)**2<=1)cell(i,j,k,c);};
 const ring=(x:number,y:number,z:number,r:number,c=2,vertical=false)=>{for(let i=0;i<40;i++){const a=i*Math.PI/20;box(x+Math.cos(a)*r,vertical?y+Math.sin(a)*r:y,vertical?z:z+Math.sin(a)*r,2,2,2,c);}};
 const spike=(x:number,z:number,h:number,c=2)=>{for(let j=0;j<h;j++)box(x,12+j,z,Math.max(1,4-j/2),1,Math.max(1,4-j/2),c);};
 const wings=(c=3)=>{for(const side of [-1,1])for(let j=0;j<5;j++)box(10+side*(5+j),9+j,10,2,7-j,3,c);};
 const feet=(n=4,c=4)=>{for(let j=0;j<n;j++)box(j%2?15:5,2,6+Math.floor(j/2)*7,3,3,4,c);};
 const eye=(x=10,y=10,z=15)=>{orb(x,y,z,2,2,1,3);box(x,y,z+1,1,2,1,4);};
 // Different proportions give the five eggs a distinct outline even at icon size.
 if([2,6,7,18].includes(stage)&&v%2===0)box(10,8,10,11-v,11,10+v,1);
 else orb(10,7,10,[5.5,6.5,4.5,6,5][v],[7,5,8,6,6.5][v],[5,5.5,4,6,4.5][v],1);
 switch(stage){
 case 1:
  if(v===0){orb(10,12,10,6,2,5.5,5);box(10,16,10,2,4,2,5);}
  if(v===1){for(let j=0;j<6;j++){const a=j*Math.PI/3;orb(10+Math.cos(a)*4,13,10+Math.sin(a)*4,3,4,3,2);}orb(10,14,10,2,3,2,3);}
  if(v===2){for(let x=6;x<=14;x+=4)for(let y=4;y<13;y+=3)box(x,y,14,1,1,1,3);for(let j=0;j<5;j++)box(6+j*2,14,10,2,1,6-Math.abs(j-2),6);}
  if(v===3){box(10,16,10,1,5,1,6);orb(7,16,10,3,1,2,6);orb(13,18,10,3,1,2,6);}
  if(v===4){for(let y=3;y<=13;y+=3)ring(10,y,10,5-y*.12,5);box(10,6,15,3,3,1,4);box(10,16,10,1,4,1,5);}break;
 case 2:
  if(v===0){for(const [x,y] of [[7,5],[13,5],[10,8],[7,11],[13,11]])box(x,y,15,2,2,1,3);}
  if(v===1){for(const x of [5,15]){box(x,12,10,4,9,6,2);for(const z of [7,12])box(x,17,z,2,3,2,3);}box(10,5,15,3,5,1,4);}
  if(v===2){ring(10,6,10,7,2);box(10,15,10,2,5,2,5);box(10,1,10,1,2,1,5);}
  if(v===3){eye(7);eye(13);for(const x of [2,18])box(x,8,10,3,6,4,2);feet(2);box(10,16,10,2,3,2,5);}
  if(v===4){feet(4);box(10,13,7,9,6,7,2);box(10,14,14,3,7,3,4);box(10,9,16,7,3,3,5);}break;
 case 3:
  if(v===0){for(let j=-3;j<=3;j++)box(10+j*2,9-Math.abs(j),10,2,12-Math.abs(j)*2,4,2);}
  if(v===1){orb(10,5,10,8,2,6,2);orb(10,12,8,7,2,5,3);orb(10,9,12,3,3,3,3);}
  if(v===2){for(let j=0;j<8;j++){const a=j*Math.PI/4;spike(10+Math.sin(a)*5,10+Math.cos(a)*5,3+j%3,2);}}
  if(v===3){for(let j=0;j<5;j++){const a=j*Math.PI*2/5;for(let k=3;k<9;k++)box(10+Math.cos(a)*k,8+Math.sin(a)*k,13,3,3,3,2);}}
  if(v===4){orb(5,12,10,3,3,3,3);orb(14,15,10,3,3,3,2);orb(10,18,10,1,1,1,3);}break;
 case 4:
  if(v===0){for(const x of [4,10,16])box(x,6+x%5,10,4,9,7,4);}
  if(v===1){for(let y=10;y<17;y++)box(10,y,10,17-y,1,17-y,4);box(10,17,10,3,1,3,2);}
  if(v===2){for(let y=2;y<15;y++)box(9+(y%4<2?1:-1),y,14,2,1,3,2);spike(6,10,5,4);spike(14,10,3,4);}
  if(v===3){feet(4,5);ring(10,13,10,6,5);box(10,7,15,5,4,1,4);for(let x=8;x<=12;x+=2)box(x,7,16,1,4,1,2);}
  if(v===4){for(let j=0;j<5;j++)box(10-j,13+j,10-j,6-j,2,6-j,2);}break;
 case 5:
  if(v===0){for(let j=0;j<24;j++){const a=j*.5,r=1+j*.17;box(10+Math.cos(a)*r,8+Math.sin(a)*r,15,2,2,2,3);}}
  if(v===1){box(10,16,10,1,5,1,4);box(10,18,13,1,1,5,4);orb(10,17,15,2,2,2,2);eye(7);eye(13);}
  if(v===2){orb(10,9,10,4,4,4,3);for(const x of [4,16])box(x,9,10,2,14,2,2);ring(10,15,10,6,2);}
  if(v===3){orb(10,12,10,7,4,6,2);for(let j=0;j<5;j++)box(5+j*2,3+j%2,10,1,6,1,3);}
  if(v===4){for(let j=0;j<8;j++){const a=j*Math.PI/4;for(let k=3;k<9;k++)box(10+Math.cos(a)*k,3+Math.sin(k)*1.5,10+Math.sin(a)*k,2,2,2,2);}eye();}break;
 case 6:
  if(v===0){box(10,8,10,13,13,8,2);box(10,8,15,9,10,2,3);box(5,8,15,2,13,2,5);}
  if(v===1){box(10,9,10,9,17,9,2);for(const y of [13,15])box(10,y,15,5,1,1,4);box(13,7,15,1,2,1,5);}
  if(v===2){orb(10,12,10,5,5,5,3);eye(8,12);eye(12,12);for(let x=5;x<16;x+=3)box(x,2,10,2,3,5,3);}
  if(v===3){ring(10,3,10,7,5);box(10,16,10,2,3,2,5);orb(10,2,10,2,2,2,4);}
  if(v===4){box(10,14,10,6,3,6,4);box(10,17,10,3,3,3,3);for(let j=0;j<6;j++)box(12+j,12+j,10,2,2,1,2);}break;
 case 7:
  if(v===0){box(10,15,10,5,2,5,4);box(10,8,15,2,8,1,2);box(10,8,16,6,2,1,2);}
  if(v===1){for(const x of [3,17])for(const z of [3,17])box(x,8,z,2,13,2,2);ring(10,15,10,7,2);}
  if(v===2){box(10,17,10,1,5,1,5);ring(10,17,10,4,2,true);eye();}
  if(v===3){ring(10,5,10,8,2);for(const x of [3,17])box(x,2,10,3,2,4,3);orb(10,13,10,4,2,3,3);}
  if(v===4){for(let i=3;i<=17;i+=3){box(i,6,3,1,2,4,5);box(i,6,17,1,2,4,5);}box(10,10,10,8,2,8,2);}break;
 case 8:
  if(v===0){feet(6,5);box(10,13,10,1,1,10,5);for(const x of [6,14])box(x,14,14,2,5,2,5);}
  if(v===1){for(let y=1;y<18;y++)box(10,y,10,18-y,1,18-y,y%4===0?5:1);}
  if(v===2){ring(10,14,10,3,5);for(const x of [3,17])ring(x,9,10,3,5,true);}
  if(v===3){ring(10,12,13,7,5,true);orb(10,12,13,4,4,1,2);}
  if(v===4){feet(4,5);box(10,13,13,8,7,6,5);box(10,17,13,10,2,7,2);eye(8,14,17);eye(12,14,17);}break;
 case 9:
  if(v===0){for(let z=5;z<16;z+=3)ring(10,8,z,6,3,true);box(10,13,10,2,2,14,3);}
  if(v===1){spike(6,12,6,3);spike(14,12,6,3);box(10,10,17,2,3,3,3);}
  if(v===2){for(let z=4;z<17;z+=3)box(10,14,z,2,5-Math.abs(z-10)/3,3,2);feet(4);}
  if(v===3){for(const x of [5,10,15])orb(x,5,16,2,3,3,3);box(10,11,15,7,3,1,4);}
  if(v===4){box(10,8,10,9,12,8,2);box(10,8,15,1,7,1,4);for(let j=0;j<3;j++)box(10,5+j*3,15,5,1,1,4);}break;
 case 10:
  if(v===0){ring(10,3,10,5,4);ring(10,14,10,5,4);for(let x=7;x<=13;x+=3)box(x,1,10,1,3,1,5);}
  if(v===1){orb(10,14,10,3,3,3,2);box(10,18,10,1,3,1,5);ring(10,11,10,4,5);}
  if(v===2){spike(6,10,6,5);spike(14,10,5,5);eye(7);eye(13);box(10,5,15,5,1,1,3);}
  if(v===3){for(let y=12;y<17;y++)box(10,y,10,24-y,1,12,4);for(const x of [3,17])box(x,15,10,2,2,13,2);}
  if(v===4){for(let j=0;j<20;j++){const a=Math.PI*.3+j*Math.PI*1.4/20;box(10+Math.cos(a)*7,10+Math.sin(a)*7,13,3,3,2,5);}}break;
 case 11:
  if(v===0){box(10,2,10,14,2,13,3);box(10,15,10,14,2,13,3);for(let x=6;x<=14;x+=4)box(x,8,15,1,11,1,5);}
  if(v===1){for(let j=0;j<10;j++){const a=j*Math.PI/5;box(10+Math.cos(a)*6,12+Math.sin(a)*4,13,3,2,2,6);}}
  if(v===2){for(const x of [4,16])box(x,10,12,2,14,2,5);box(10,16,12,13,2,2,5);for(let x=7;x<=13;x+=2)box(x,10,13,1,10,1,3);}
  if(v===3)wings();
  if(v===4){for(let j=0;j<10;j++)box(9+(j%4<2?1:-1),5+j,16,4,2,2,5);spike(10,10,5,5);}break;
 case 12:
  if(v===0){ring(10,6,10,8,2);orb(10,13,10,4,3,4,3);}
  if(v===1){box(10,2,10,11,2,10,4);box(10,15,10,11,2,10,4);for(const x of [4,16])box(x,8,10,2,12,2,2);}
  if(v===2){orb(10,11,14,5,4,2,3);orb(10,11,16,2,3,1,4);spike(5,10,4,2);spike(15,10,4,2);}
  if(v===3){ring(10,8,10,8,4);spike(10,10,7,2);for(const z of [4,16])spike(10,z,3,3);}
  if(v===4){for(let j=0;j<3;j++){const a=j*Math.PI*2/3;box(10+Math.cos(a)*7,3,10+Math.sin(a)*7,2,7,2,4);}eye();}break;
 case 13:
  if(v===0){ring(10,3,10,6,5);ring(10,12,10,6,5);box(10,9,16,4,4,1,3);box(10,9,17,1,3,1,4);}
  if(v===1){ring(10,9,14,7,5,true);for(let j=0;j<8;j++){const a=j*Math.PI/4;box(10+Math.cos(a)*8,9+Math.sin(a)*8,14,3,3,3,5);}}
  if(v===2){orb(10,12,10,8,4,5,5);box(10,3,10,7,3,5,4);for(const x of [5,15])box(x,7,10,1,7,1,4);}
  if(v===3){for(const x of [6,13]){box(x,14,10,3,9,3,5);box(x,19,10,4,1,4,3);}}
  if(v===4){ring(10,10,15,6,5,true);box(10,11,16,1,6,1,4);box(12,9,16,5,1,1,4);box(10,17,10,2,3,2,5);}break;
 case 14:
  if(v===0){for(const [x,z,h] of [[6,8,4],[12,9,7],[15,14,3]])spike(x,z,h,3);}
  if(v===1){orb(10,6,10,8,7,7,3);box(10,4,17,5,6,4,2);box(10,3,19,3,4,1,4);}
  if(v===2){orb(10,8,14,3,5,1,3);eye(8,13,14);eye(12,13,14);box(10,11,16,2,2,2,5);feet(2,5);}
  if(v===3){for(let j=0;j<6;j++){const a=j*Math.PI/3;for(let k=2;k<9;k++)box(10+Math.cos(a)*k,10+Math.sin(a)*k,14,2,2,2,3);}}
  if(v===4){for(const x of [5,10,15])for(let y=12;y<19;y++)box(x,y,10,Math.max(1,(19-y)/2),1,3,3);}break;
 case 15:
  if(v===0){for(const x of [4,10,16])orb(x,12,10,3,3,4,3);ring(10,10,15,4,5,true);box(10,11,16,1,4,1,4);}
  if(v===1){box(10,5,10,16,5,13,3);for(const x of [3,17])orb(x,6,10,2,2,6,2);orb(10,11,10,4,3,4,2);}
  if(v===2){ring(10,11,10,7,4);for(let y=12;y<20;y++)box(10+(y-12)*.3,y,10,19-y,1,19-y,2);}
  if(v===3){ring(10,11,14,6,5,true);box(15,17,13,3,1,1,3);box(15,17,13,1,3,1,3);}
  if(v===4){ring(10,16,12,3,5,true);box(10,9,16,2,9,2,5);box(13,6,16,5,2,2,5);}break;
 case 16:
  if(v===0){box(10,7,10,11,13,11,4);ring(10,13,10,6,5);box(10,8,16,6,6,1,2);}
  if(v===1){for(let j=0;j<20;j++){const a=j*.5;box(10+Math.sin(a)*6,2+j*.75,10+Math.cos(a)*5,2,2,2,6);}}
  if(v===2){for(const x of [4,16])for(const z of [4,16])box(x,9,z,1,17,1,5);box(10,17,10,13,1,13,4);spike(10,10,5,2);}
  if(v===3){box(10,8,10,3,14,3,3);orb(10,13,10,8,4,7,2);for(const x of [6,13])box(x,16,10,2,1,2,3);}
  if(v===4){eye(5,8,13);eye(13,11,15);eye(10,15,12);for(const x of [2,18])orb(x,6,10,2,3,3,6);}break;
 case 17:
  if(v===0){for(let j=0;j<12;j++)box(10,5+j,10,Math.max(1,10-Math.abs(j-6)*1.5),1,3,6);box(10,10,12,1,13,1,5);}
  if(v===1){box(10,9,15,1,11,1,4);for(const x of [6,14])for(const y of [5,10])box(x,y,14,2,2,2,4);feet(6);}
  if(v===2){for(let y=3;y<16;y+=3)ring(10,y,10,4,3);box(10,18,10,1,3,1,6);}
  if(v===3){for(const x of [4,16]){orb(x,12,10,3,5,2,2);orb(x,5,10,3,3,2,3);}box(10,10,13,2,12,2,4);}
  if(v===4){for(let j=0;j<6;j++){const a=j*Math.PI/3;ring(10+Math.cos(a)*4,8+Math.sin(a)*4,14,2,5,true);}}break;
 case 18:
  if(v===0){for(const x of [5,15])for(const y of [3,13])box(x,y,16,2,2,1,5);box(10,8,16,3,3,1,4);}
  if(v===1){for(const x of [4,16]){box(x,12,10,3,12,4,4);box(x,18,10,3,2,4,2);}box(10,7,10,14,3,4,4);}
  if(v===2){for(const x of [3,17]){box(x,4,10,3,5,14,4);for(let z=4;z<18;z+=3)box(x,2,z,4,1,2,5);}box(10,13,10,5,3,7,5);}
  if(v===3){box(10,17,10,2,4,2,5);for(const x of [4,16]){box(x,13,10,2,8,2,4);box(x<10?6:14,9,10,5,2,2,4);}}
  if(v===4){for(const x of [3,9,15])spike(x,7+x%4,3+x%5,5);box(17,8,10,3,3,8,4);}break;
 case 19:
  if(v===0)ring(10,8,10,9,5);
  if(v===1){for(let j=0;j<7;j++)box(10+j,12+j,10,5-j*.5,2,4,3);}
  if(v===2){for(let j=0;j<5;j++){const a=j*Math.PI*2/5;for(let k=2;k<9;k++)box(10+Math.sin(a)*k,10+Math.cos(a)*k,14,3,3,2,5);}}
  if(v===3){box(10,13,10,6,5,15,4);ring(10,13,17,4,5,true);feet(2,5);}
  if(v===4){for(let j=0;j<35;j++){const a=j*.42,r=1+j*.21;box(10+Math.cos(a)*r,10+Math.sin(a)*r,14,2,2,1,j%3?2:3);}}break;
 case 20:
  if(v===0){for(const [x,z,h] of [[5,8,5],[10,11,7],[15,8,3]])spike(x,z,h,4);ring(10,7,10,7,2);}
  if(v===1){ring(10,10,10,8,5,true);orb(10,10,10,5,6,1,4);box(10,10,12,2,7,1,2);}
  if(v===2){box(10,7,10,15,9,8,3);box(10,8,15,1,10,1,5);for(const x of [5,15])box(x,8,15,5,1,1,5);spike(10,10,6,2);}
  if(v===3){wings(5);ring(10,18,10,4,5);}
  if(v===4){box(10,12,10,3,9,3,5);for(const x of [5,10,15])orb(x,15+Number(x===10)*2,10,4,3,4,3);for(const x of [5,15])box(x,3,10,6,2,3,5);}break;
 }
 const result={cells:[...cells.values()],colors};cache.set(key,result);return result;
}
const icons=new Map<string,string>();
export function eggIcon(e:EggAppearance){
 const a=appearanceOf(e);if(!a)return `${import.meta.env.BASE_URL}models/egg-${e.type}.png`;
 const key=`${a.stage}:${a.variant}`;if(icons.has(key))return icons.get(key)!;
 const {cells,colors}=stageEggCells(a.stage,a.variant),canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d')!;
 const occupied=new Set(cells.map(([x,y,z])=>`${x},${y},${z}`));
 for(const [x,y,z,c] of [...cells].sort((a,b)=>(a[0]+a[2]-b[0]-b[2])||a[1]-b[1])){
  if(occupied.has(`${x+1},${y},${z}`)&&occupied.has(`${x},${y+1},${z}`)&&occupied.has(`${x},${y},${z+1}`))continue;
  const px=48+(x-z)*2,py=66+(x+z-20)-y*2;
  ctx.fillStyle=colors[c-1];ctx.fillRect(px,py,4,3);ctx.fillStyle='#00000028';ctx.fillRect(px+2,py+1,2,2);
 }
 const url=canvas.toDataURL();icons.set(key,url);return url;
}
