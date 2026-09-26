import {contains,type Hazard} from './hazards';
import {ROUTE,STAGE_ENVIRONMENT_IDS} from './stage-data';
import {reorderStages} from './stage-order';

export type DragonClue={avoided:string[];carried:string[];escaped:string[];depth:boolean;sides:number;quiet:number;returned:boolean;claimed:boolean};
export type DragonRule={hint:string;condition:string;avoid:string[];carry?:string[];escape?:string[];depth?:boolean;sides?:boolean;quiet?:number;returnEgg?:boolean};
const oldDragonRules:DragonRule[]=[
 {hint:'건초 바람을 비켜 간 씨앗이 둥지로 돌아오면 풍차가 돈다.',condition:'굴러오는 건초 회피 후 초원 알을 기지에 보관',avoid:['hay'],returnEgg:true},
 {hint:'기차가 지나간 길 너머, 태엽 성의 가장 깊은 곳.',condition:'태엽 기차 회피 + 왕국 길 80% 지점 도달',avoid:['train'],depth:true},
 {hint:'알을 젖지 않게 지킨 뒤 두 물가의 소리를 들어 보자.',condition:'산호 바다 알 운반 중 먹물 회피 + 위험 구간 좌우 방문',avoid:[],carry:['ink'],sides:true},
 {hint:'불숨이 식는 순간 너머에 식지 않는 돌이 있다.',condition:'화산 불숨 회피 + 화산 길 80% 지점 도달',avoid:['lava-breath'],depth:true},
 {hint:'내려오는 팔과 가로지르는 팔, 둘 다 지나가면 등불이 답한다.',condition:'촉수 내려찍기와 가로 휩쓸기를 각각 회피',avoid:['tentacle','sweep']},
 {hint:'날아오는 책을 피하고 사물함 앞에서는 잠깐 조용히.',condition:'책·사물함 습격 회피 + 학교 위험 구간에서 2초 정지',avoid:['book','locker'],quiet:2},
 {hint:'보안선을 넘은 뒤 따라오는 눈도 따돌려 보자.',condition:'보안 레이저와 추적 드론을 각각 회피',avoid:['laser','drone']},
 {hint:'전갈의 꼬리를 비켜 두 모래 언덕에 발자국을 남기자.',condition:'전갈 꼬리 회피 + 위험 구간 좌우 방문',avoid:['scorpion'],sides:true},
 {hint:'알을 든 채 작은 사냥꾼을 피하고, 늪의 숨도 살펴보자.',condition:'공룡섬 알 운반 중 랩터 회피 + 타르 늪 회피',avoid:['tar-pool'],carry:['raptor']},
 {hint:'불씨를 피해 알을 지키면 달 종소리 사이에 기와가 열린다.',condition:'달마을 알 운반 중 도깨비불 회피 + 달 종 충격 회피',avoid:['moon-bell'],carry:['wisps']},
 {hint:'하늘의 번개를 피하고 돌이 되는 시선에 등을 돌려 보자.',condition:'번개와 메두사의 시선을 각각 회피',avoid:['lightning','medusa']},
 {hint:'끌어당기는 빛에서 스스로 벗어나, 배양액 너머로.',condition:'UFO 견인 영역에 들어갔다 탈출 + 배양액 분출 회피',avoid:['alien-acid'],escape:['ufo']},
 {hint:'알을 흔들지 않고 증기와 톱니 사이를 지나면 용골이 뜬다.',condition:'공중도시 알 운반 중 증기와 톱니를 각각 회피',avoid:[],carry:['steam','gear']},
 {hint:'떨어지는 얼음을 비켜 가장 먼 빙판에 발을 디뎌 보자.',condition:'고드름 회피 + 빙하 길 80% 지점 도달',avoid:['icicle'],depth:true},
 {hint:'느려지는 시계 밖으로 걸어 나와 떨어지는 침대를 기다려 보자.',condition:'시계 지연 영역에 들어갔다 탈출 + 떨어지는 침대 회피',avoid:['falling-bed'],escape:['clock']},
 {hint:'독 웅덩이를 비켜, 살아 있는 알 하나를 깨끗한 기지로.',condition:'독 웅덩이 회피 후 폐허 알을 기지에 보관',avoid:['puddle'],returnEgg:true},
 {hint:'거미줄에도 순찰하는 날개에도 붙잡히지 않는 작은 길.',condition:'거미줄과 말벌 순찰을 각각 회피',avoid:['web','wasp-patrol']},
 {hint:'자석 손에서 발을 빼고 커다란 압착기가 쉬기를 기다려 보자.',condition:'자석 견인 영역에 들어갔다 탈출 + 압착기 회피',avoid:['crusher'],escape:['magnet']},
 {hint:'유성이 지난 뒤 별길의 양쪽에서 같은 하늘을 올려다보자.',condition:'유성 회피 + 위험 구간 좌우 방문',avoid:['meteors'],sides:true},
 {hint:'세 기억을 지나고 황금 파동의 빈틈에 서면 첫빛이 돌아온다.',condition:'기억의 촉수·번개·유성과 창조의 황금 파동을 각각 회피',avoid:['memory-tentacle','memory-lightning','memory-meteor','creation-wave']},
];
export const DRAGON_RULES=reorderStages(oldDragonRules);
DRAGON_RULES[18]={hint:'비어 있는 고리와 세 기억 사이의 틈을 찾아보자.',condition:'공허의 손과 기억의 촉수 회피',avoid:['void-hand','memory-tentacle']};
DRAGON_RULES[19]={hint:'씨앗에서 퍼지는 황금 파동의 빈틈을 지나자.',condition:'창조의 황금 파동 회피',avoid:['creation-wave']};
export const newDragonClue=():DragonClue=>({avoided:[],carried:[],escaped:[],depth:false,sides:0,quiet:0,returned:false,claimed:false});
export function dragonReady(stage:number,c:DragonClue|undefined){const r=DRAGON_RULES[stage-1];return !!r&&!!c&&r.avoid.every(id=>c.avoided.includes(id))&&(r.carry??[]).every(id=>c.carried.includes(id))&&(r.escape??[]).every(id=>c.escaped.includes(id))&&(!r.depth||c.depth)&&(!r.sides||c.sides===3)&&(!r.quiet||c.quiet>=r.quiet)&&(!r.returnEgg||c.returned);}
export function validateDragonClues(value:unknown):asserts value is Record<string,DragonClue>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid dragon clues');
 for(const [key,c]of Object.entries(value as Record<string,DragonClue>)){
  const s=Number(key),ids=STAGE_ENVIRONMENT_IDS[s-1];if(!Number.isInteger(s)||!ids||!c)throw Error('Invalid dragon stage');
  for(const list of [c.avoided,c.carried,c.escaped])if(!Array.isArray(list)||list.length>ids.length||new Set(list).size!==list.length||!list.every(id=>ids.includes(id)))throw Error('Invalid dragon observations');
  if(![c.depth,c.returned,c.claimed].every(v=>typeof v==='boolean')||!Number.isInteger(c.sides)||c.sides<0||c.sides>3||!Number.isFinite(c.quiet)||c.quiet<0||c.quiet>3)throw Error('Invalid dragon progress');
 }
}
export type DragonWatch={stage:number;observed:Record<string,{hit:number;egg:string|null;entered:boolean;failed:boolean}>};
export function observeDragon(c:DragonClue,watch:DragonWatch,stage:number,dt:number,p:{x:number;z:number;offset:number;hit:number;egg:string|null;moving:boolean},hazards:Hazard[]){
 if(watch.stage!==stage){watch.stage=stage;watch.observed={};}
 const depth=(-p.z-p.offset-ROUTE.entrance)/(stage===20?ROUTE.finalLength:ROUTE.length);
 if(depth>=.8)c.depth=true;
 const near=hazards.some(h=>Math.hypot(h.target.x-p.x,h.target.z-p.z)<9);
 if(near){if(p.x<-2)c.sides|=1;if(p.x>2)c.sides|=2;}
 c.quiet=near&&!p.moving?Math.min(3,c.quiet+dt):c.quiet;
 const live=new Set(hazards.map(h=>String(h.serial)));
 for(const k of Object.keys(watch.observed))if(!live.has(k))delete watch.observed[k];
 const add=(list:string[],id:string)=>{if(!list.includes(id))list.push(id);};
 for(const h of hazards){
  const key=String(h.serial),id=h.definition.id;if(!STAGE_ENVIRONMENT_IDS[stage-1].includes(id))continue;
  if(h.phase==='Telegraph'&&Math.hypot(h.target.x-p.x,h.target.z-p.z)<9)watch.observed[key]??={hit:p.hit,egg:p.egg,entered:false,failed:false};
  const seen=watch.observed[key];if(!seen)continue;
  if(h.hit||seen.hit!==p.hit)seen.failed=true;
  if(seen.egg!==p.egg)seen.egg=null;
  if(h.phase==='Active'&&contains(h,p))seen.entered=true;
  if(seen.entered&&!seen.failed&&!contains(h,p)&&Math.hypot(h.target.x-p.x,h.target.z-p.z)>h.definition.radius+1)add(c.escaped,id);
  if(h.phase==='Recovery'){
   if(!seen.failed){add(c.avoided,id);if(seen.egg)add(c.carried,id);}
   delete watch.observed[key];
  }
 }
}
