import type {GameState,Save} from './game';
import {EGGS} from './data';
const firstTargets=new WeakMap<GameState,string>();

export function firstEggTarget(game:GameState){
  if((game.save.tutorial??0)>=3||game.carried||game.isNight||game.death)return undefined;
  const available=game.world.filter(e=>e.stageId===1&&!e.special&&!game.bosses.some(b=>b.loot?.id===e.id));
  const smallest=Math.min(...available.map(e=>EGGS[e.type].tier));
  const previous=available.find(e=>e.id===firstTargets.get(game)&&EGGS[e.type].tier===smallest);
  const target=previous??available.sort((a,b)=>EGGS[a.type].tier-EGGS[b.type].tier||Math.hypot(a.x-game.x,a.z-game.z)-Math.hypot(b.x-game.x,b.z-game.z))[0];
  if(target)firstTargets.set(game,target.id);else firstTargets.delete(game);
  return target;
}

export const TUTORIAL_STEPS=6;
// Lightweight vector hands sit over the real controls without intercepting input.
export function thumbGuideHTML(){
 const hand=`<svg viewBox="0 0 96 120" fill="none" aria-hidden="true"><g class="guide-hand"><path d="M4 116V80c0-13 5-23 14-31l15-14 2-15c1-9 5-14 12-14 8 0 12 6 11 15l-2 29 15 7c8 4 12 11 12 20v39Z" fill="#fff4d7" stroke="#52664a" stroke-width="3" stroke-linejoin="round"/><path d="M37 22c0-5 3-9 9-9s9 4 9 9l-1 8H36Z" fill="#e4cba6"/><path d="m56 50-7 17c-3 8-9 13-17 15M66 69l-3 17M75 76l-2 14" stroke="#9c916e" stroke-width="2" stroke-linecap="round"/></g><circle cx="46" cy="22" r="17" stroke="#fff9e8" stroke-width="2" stroke-dasharray="3 4"/></svg>`;
 return `<div id="thumb-guide" role="img" aria-label="양손 엄지로 조작해요. 왼쪽 엄지로 조이스틱을 밀어 이동하고, 오른쪽 엄지로 행동 버튼을 눌러요." hidden><div class="thumb-guide-left"><span>왼손 · 이동</span>${hand}</div><div class="thumb-guide-right"><span>오른손 · 행동</span>${hand}</div></div>`;
}
export function migrateTutorial(save:Pick<Save,'tutorial'|'tutorialVersion'>){
  if(save.tutorialVersion===2)return;
  if(save.tutorial===5)save.tutorial=TUTORIAL_STEPS;
  save.tutorialVersion=2;
}
// Existing completed tutorials stay completed. Reading never advances a step.
export function advanceTutorial(step:number,event:string){
  if(step>=TUTORIAL_STEPS)return step;
  const milestones:Record<string,number>={expedition_start:1,egg_pickup:2,egg_saved:3,mongle_obtained:4};
  if(step===4&&event==='upgrade_purchase')return 5;
  if(step===5&&event==='training_start')return TUTORIAL_STEPS;
  return Math.max(step,milestones[event]??0);
}
export function tutorialHint(game:GameState,tab:string){
  const step=game.save.tutorial??0;
  if(step>=TUTORIAL_STEPS)return null;
  if(step===0&&tab==='explore'&&game.isAtBase&&!game.isNight)return {step:1,title:'두 엄지로 조작해요',copy:'왼손은 밀어서 이동 · 오른손은 눌러서 행동',target:'#joystick'};
  if(game.isNight&&step<3)return {step:1,title:'아침을 기다려요',copy:'해가 뜨면 농장문이 열려요',target:'#cycle-clock'};
  if(step<3){
    if(game.carried)return {step:3,title:'농장으로 돌아오기',copy:'↓ 알을 들고 아래쪽 농장으로',target:'#joystick'};
    if(game.isAtBase)return {step:1,title:'첫 알을 만나러',copy:'↑ 조이스틱을 위로 밀어요',target:'#joystick'};
    return {step:2,title:game.near?'알 가져오기':'작은 알에 다가가기',copy:game.near?'오른쪽 알 버튼을 눌러요':'화살표가 가리키는 작은 알을 찾아요',target:game.near?'#action':'#joystick'};
  }
  if(step===3){
    if(!game.save.eggs.length)return {step:2,title:'알을 다시 가져와요',copy:'탐험에서 알을 농장으로',target:'[data-tab="explore"]'};
    if(tab!=='hatchery')return {step:4,title:'보관한 알 열기',copy:'부화실로 이동해요',target:'[data-tab="hatchery"]'};
    if(!game.selected)return {step:4,title:'가방에서 알 선택',copy:'오른쪽 아래 가방을 열고 알을 골라요',target:'#open-egg-bag'};
    return {step:4,title:game.selected.hp===0?'첫 친구를 만나요':'알을 톡톡!',copy:game.selected.hp===0?'펫 만나기를 눌러요':'막바지에는 알이 저절로 흔들려요',target:'#hatch-touch'};
  }
  if(step===4)return {step:5,title:'친구와 함께 성장',copy:tab==='upgrade'?'시작 별가루로 강화를 한 번 구매해요':'펫은 자동 동행해요. 강화에서 성장해요',target:tab==='upgrade'?'[data-upgrade]':'[data-tab="upgrade"]'};
  if(tab!=='explore')return {step:6,title:'운동하러 가요',copy:'농장으로 돌아와 운동 기구를 찾아요',target:'[data-tab="explore"]'};
  return {step:6,title:'운동으로 속도 성장',copy:game.nearGym?'운동 버튼을 눌러요. 이동하면 운동을 마쳐요':'내 농장의 운동 기구로 이동해요',target:game.nearGym?'#action':'#joystick'};
}
