import {EGGS,eggMaxHp} from './data';
import type {Egg,GameState} from './game';
import {eggName} from './stage-eggs';
import {compactWeight} from './pet-inventory-ui';
import {formatNumber as num} from './format';

export function hatchProgress(egg:Egg){return egg.hp<=0?100:Math.max(0,Math.min(99,Math.floor((1-egg.hp/eggMaxHp(egg))*100)));}
export const hatchCracks=`<svg class="hatch-cracks" viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="hatch-crack-mask"><ellipse cx="50" cy="53" rx="29" ry="39"/></clipPath></defs><g clip-path="url(#hatch-crack-mask)"><path class="crack-first" d="M43 28 48 38 43 44 55 52 48 60"/><path class="crack-more" d="M55 52 64 47 71 53 M48 60 55 69 49 80 M43 44 33 49 29 57"/><path class="crack-last" d="M48 38 58 32 62 24 M55 69 67 66 76 72 M33 49 28 39"/></g></svg>`;
export function hatchInfo(game:GameState){
 const egg=game.selected;if(!egg)return '<h2>알 보관소</h2><p class="hatch-subtitle">탐험에서 알을 데려와 친구를 만나 보세요.</p>';
 const progress=hatchProgress(egg);
 return `<div class="hatch-title"><span class="tag">${EGGS[egg.type].rarity}</span><h2>${eggName(egg)}</h2><small>${compactWeight(egg.weightG??0)}</small></div><strong class="hatch-progress-label">부화 진행도 ${progress}%</strong><div class="track" role="progressbar" aria-label="부화 진행도" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress}%"></i></div><small class="hatch-subtitle">${progress===100?'안에서 친구가 기다려요':progress>=90?'곧 만날 수 있어요!':`한 번에 ${num(game.tapDamage)}${game.dps>0?' · 자동으로 부화 중':''}`}</small>`;
}
