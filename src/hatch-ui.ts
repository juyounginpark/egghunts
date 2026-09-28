import {EGGS,eggMaxHp} from './data';
import type {Egg,GameState} from './game';
import {eggName} from './stage-eggs';

export function hatchProgress(egg:Egg){return egg.hp<=0?100:Math.max(0,Math.min(99,Math.floor((1-egg.hp/eggMaxHp(egg))*100)));}
export const hatchCracks=`<svg class="hatch-cracks" viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="hatch-crack-mask"><ellipse cx="50" cy="53" rx="29" ry="39"/></clipPath></defs><g clip-path="url(#hatch-crack-mask)"><path class="crack-first" d="M43 28 48 38 43 44 55 52 48 60"/><path class="crack-more" d="M55 52 64 47 71 53 M48 60 55 69 49 80 M43 44 33 49 29 57"/><path class="crack-last" d="M48 38 58 32 62 24 M55 69 67 66 76 72 M33 49 28 39"/></g></svg>`;
export function hatchInfo(game:GameState){
 const egg=game.selected;if(!egg)return '<h2>알 보관소</h2><p class="hatch-subtitle">가방에서 알을 골라 주세요</p>';
 const progress=hatchProgress(egg);
 return `<div class="hatch-title"><span class="tag">${EGGS[egg.type].rarity}</span><h2>${eggName(egg)}</h2></div><strong class="hatch-progress-label">${progress===100?'부화 완료':`${progress}%`}</strong><div class="track" role="progressbar" aria-label="부화 진행도" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress}%"></i></div>`;
}
