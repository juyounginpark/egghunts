import {EGGS,eggMaxHp} from './data';
import type {Egg,GameState} from './game';
import {eggName} from './stage-eggs';

export function hatchProgress(egg:Egg){return egg.hp<=0?100:Math.max(0,Math.min(99,Math.floor((1-egg.hp/eggMaxHp(egg))*100)));}
export function hatchInfo(game:GameState){
 const egg=game.selected;if(!egg)return '<h2>알 보관소</h2><p class="hatch-subtitle">가방에서 알을 골라 주세요</p>';
 const progress=hatchProgress(egg);
 return `<div class="hatch-title"><span class="tag">${EGGS[egg.type].rarity}</span><h2>${eggName(egg)}</h2></div><strong class="hatch-progress-label">${progress===100?'부화 완료':`${progress}%`}</strong><div class="track" role="progressbar" aria-label="부화 진행도" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress}%"></i></div>`;
}
