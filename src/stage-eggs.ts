import {designEgg} from "./egg-design";
import {EGGS} from "./data";
import {SECRET_DRAGON_ROWS} from './secret-dragon-catalog';
import {reorderStages} from './stage-order';
export type EggAppearance={type:number;stageId?:number;variant?:number;special?:boolean};
export type EggCell=[number,number,number,number];
const oldEggNames=[
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
export const STAGE_EGG_NAMES=reorderStages(oldEggNames);
STAGE_EGG_NAMES[18]=['빈 고리','공백','그림자','끊어진 달','경계'];
STAGE_EGG_NAMES[19]=['첫 씨앗','새벽','샘물','계절','세계수'];
export function appearanceOf(e:EggAppearance){return e.stageId&&e.stageId>=1&&e.stageId<=20&&e.variant!==undefined&&e.variant>=0&&e.variant<=5?{stage:e.stageId,variant:e.variant}:null;}
export function eggName(e:EggAppearance){const a=appearanceOf(e),name=a?`${a.variant===5?SECRET_DRAGON_ROWS.find(p=>p.stageId===a.stage)!.eggName:STAGE_EGG_NAMES[a.stage-1][a.variant]} 알`:EGGS[e.type].name;return e.special?`스페셜 · ${name}`:name;}
export {designEgg as stageEggCells} from './egg-design';
export function eggDesignAppearance(e:EggAppearance){
 if(e.type===35)return {stage:1,variant:6,tier:3};
 const a=appearanceOf(e);
 return {stage:a?.stage??EGGS[e.type].region*4+1,variant:a?.variant??EGGS[e.type].tier%5,tier:EGGS[e.type].tier};
}
const icons=new Map<string,string>();
export function eggIcon(e:EggAppearance){
 const a=eggDesignAppearance(e);
 const key=`${a.stage}:${a.variant}:${a.tier}`;if(icons.has(key))return icons.get(key)!;
 const {cells,colors}=designEgg(a.stage,a.variant,a.tier),canvas=document.createElement('canvas');canvas.width=canvas.height=192;const ctx=canvas.getContext('2d')!;ctx.scale(2,2);ctx.imageSmoothingEnabled=false;
 const occupied=new Set(cells.map(([x,y,z])=>`${x},${y},${z}`));
 for(const [x,y,z,c] of [...cells].sort((a,b)=>(a[0]+a[2]-b[0]-b[2])||a[1]-b[1])){
  if(occupied.has(`${x+1},${y},${z}`)&&occupied.has(`${x},${y+1},${z}`)&&occupied.has(`${x},${y},${z+1}`))continue;
  const px=48+(x-z)*2,py=66+(x+z-20)-y*2;
  ctx.fillStyle=colors[c-1];ctx.fillRect(px,py,4,3);ctx.fillStyle='#00000028';ctx.fillRect(px+2,py+1,2,2);
 }
 const url=canvas.toDataURL();icons.set(key,url);return url;
}
