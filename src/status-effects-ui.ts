import type {GameState} from './game';
import {BALANCE,TRAILS} from './data';
import {carryMultiplier} from './weight';
import {formatNumber as num} from './format';

export function activeStatusEffects(game:GameState){
 const effects:{id:string;icon:string;name:string;description:string;buff:boolean}[]=[];
 const add=(id:string,icon:string,name:string,description:string,buff=false)=>effects.push({id,icon,name,description,buff});
 const move=(id:string,icon:string,name:string,multiplier:number,end:string)=>{
  if(multiplier!==1)add(id,icon,name,`이동속도 ×${num(multiplier,2)}. ${end}`,multiplier>1);
 };
 if(game.death)return effects;
 move('night','☾','밤',game.isNormalNight?BALANCE.nightMoveMultiplier:1,'일반 밤 동안 적용돼요.');
 move('rain','☂','비',game.isRaining?BALANCE.rainMoveMultiplier:1,'비가 그치면 해제돼요.');
 move('wind','≋','바람',game.isWindy?BALANCE.windMoveMultiplier:1,'바람이 멎으면 해제돼요.');
 move('grass','♧','잔디',game.pathSpeedMultiplier,'길로 돌아오면 해제돼요.');
 move('chase','»','추격 가속',game.chaseSpeedMultiplier,'내 알을 보스가 추격하는 동안 빨라져요.');
 move('heavy','⚠','권장속도 미달',game.eggSpeedPenalty,'운반 알의 권장 성장 속도를 충족하거나 알을 내려놓으면 해제돼요.');
 if(game.carried)move('carry','🥚','알 운반',carryMultiplier(game.carried,game.save.upgrades.carry),'알의 무게와 운반 강화에 따른 효과예요. 내려놓으면 해제돼요.');
 if(game.slowRemaining>0)move('slow','↓','감속',game.slowMultiplier,'장애물의 감속 효과예요. 시간이 지나면 해제돼요.');
 move('magnet','🧲','자력 감속',game.effects.magnet>0?.8:1,'자력 효과가 끝나면 해제돼요.');
 for(const [id,icon,name,description] of [
  ['ink','●','먹물','먹물이 시야를 가려요. 시간이 지나면 사라져요.'],
  ['stone','◆','석화','움직일 수 없어요. 시간이 지나면 풀려요.'],
  ['grab','✋','붙잡힘','움직일 수 없어요. 이동 조작을 하면 더 빨리 탈출해요.'],
  ['delay','⌛','조작 지연','이동 입력이 늦게 반영돼요. 시간이 지나면 해제돼요.'],
 ] as const)if(game.effects[id]>0)add(id,icon,name,description);
 if(game.immunity>0)add('immunity','🛡','피격 보호','일반 피해를 잠시 막아요. 보스 접촉 피해에는 적용되지 않아요.',true);
 if(game.concealed)add('concealed','🌿','수풀 은폐','수풀에 숨어 보스 추격과 공격을 피해요. 수풀을 벗어나면 해제돼요.',true);
 move('mount','🐾','탑승',game.mountSpeedMultiplier,'탑승 펫을 해제하면 효과가 사라져요.');
 move('trail','✦','이동 흔적',TRAILS[game.save.equippedTrail??0].multiplier,'장착한 이동 흔적의 효과예요.');
 if(game.activePetLots.length)add('pets','🐣','동행 펫',`두드리기 ×${num(game.clickMultiplier,2)} · 자동 부화 ×${num(game.autoMultiplier,2)} · 성장 속도 ×${num(game.speedMultiplier,2)} · 별가루 +${num(game.incomePerSecond,2)}/초. 펫 보관소에서 동행을 변경할 수 있어요.`,true);
 return effects;
}
