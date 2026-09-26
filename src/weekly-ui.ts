import {WEEKLY_EVENT,petIcon,BALANCE} from './data';
import {eggIcon} from './stage-eggs';
import type {GameState} from './game';
export function weeklyPanel(game:GameState){
 const index=game.weeklyIndex,ready=game.canClaimWeekly,full=index===6&&game.save.eggs.length>=BALANCE.inventory;
 const displayIndex=!ready&&index===0&&(game.save.weekly?.claimed??0)>0?7:index;
 return `<h1>일곱 번의 만남</h1><p>하루 한 번 · 한국 시간 자정 갱신<br>쉬어도 진행은 유지돼요. 7회 수령 후 다시 시작해요.</p><div class="weekly-days">${WEEKLY_EVENT.rewards.map((amount,i)=>`<article class="${i===displayIndex?'current':''}"><b>${i+1}일</b><span>${i<displayIndex?'✓':i===6?'🎁':'✦'}</span><strong>+${amount}</strong>${i===6?'<small>S 알 + S 펫</small>':''}</article>`).join('')}</div><div class="weekly-special"><img src="${eggIcon({type:WEEKLY_EVENT.eggType})}" alt="칠색 별리본 알"/><img src="${petIcon(WEEKLY_EVENT.petId)}" alt="별리본 루미"/><strong>7일차 · 전용 S급 알과 별리본 루미</strong><small>펫 1마리 즉시 지급 · 알에서도 루미 1마리 확정</small></div><button id="weekly-claim" ${!ready||full?'disabled':''}>${!ready?'오늘 수령 완료':full?'보관함 한 칸을 비워 주세요':`${index+1}일차 받기`}</button><button data-tab="pets" class="secondary">내 펫 보기</button>`;
}
