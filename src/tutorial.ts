import type {GameState} from './game';

// Keep the existing saved 0..5 milestones. Reading a hint never advances them.
export function advanceTutorial(step:number,event:string){
  if(step>=5)return step;
  const milestones:Record<string,number>={expedition_start:1,egg_pickup:2,egg_saved:3,mongle_obtained:4};
  if(step===4&&event==='upgrade_purchase')return 5;
  return Math.max(step,milestones[event]??0);
}
export function tutorialHint(game:GameState,tab:string){
  const step=game.save.tutorial??0;
  if(step>=5)return null;
  if(game.isNight&&step<3)return {step:1,title:'아침을 기다려요',copy:'해가 뜨면 농장문이 열려요',target:'#cycle-clock'};
  if(step<3){
    if(game.carried)return {step:3,title:'농장으로 돌아오기',copy:'↓ 알을 들고 아래쪽 농장으로',target:'#joystick'};
    if(game.isAtBase)return {step:1,title:'첫 알을 만나러',copy:'↑ 조이스틱을 위로 밀어요',target:'#joystick'};
    return {step:2,title:game.near?'알 가져오기':'알에 다가가기',copy:game.near?'오른쪽 알 버튼을 눌러요':'길 위의 알을 찾아요',target:game.near?'#action':'#joystick'};
  }
  if(step===3){
    if(!game.save.eggs.length)return {step:2,title:'알을 다시 가져와요',copy:'탐험에서 알을 농장으로',target:'[data-tab="explore"]'};
    if(tab!=='hatchery')return {step:4,title:'보관한 알 열기',copy:'부화실로 이동해요',target:'[data-tab="hatchery"]'};
    if(!game.selected)return {step:4,title:'알 선택',copy:'아래 보관함에서 알을 눌러요',target:'#egg-queue'};
    return {step:4,title:game.selected.hp===0?'첫 친구를 만나요':'알을 톡톡!',copy:game.selected.hp===0?'알을 한 번 더 눌러 개봉':'가운데 알을 직접 눌러요',target:'#hatch-touch'};
  }
  return {step:5,title:'첫 성장',copy:tab==='upgrade'?'원하는 강화를 한 번 구매해요':'강화에서 더 강해져요',target:tab==='upgrade'?'[data-upgrade]':'[data-tab="upgrade"]'};
}
