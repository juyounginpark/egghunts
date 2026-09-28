import type {GameState} from './game';
import {weeklyPanel} from './weekly-ui';
export function eventsPanel(game:GameState){
 const event=document.getElementById('panel')?.dataset.event;
 const back='<button data-event="home" class="secondary">이벤트 목록</button>';
 if(event==='weekly')return back+weeklyPanel(game);
 return `<h1>이벤트</h1><div class="event-banners"><button data-event="weekly" class="event-banner weekly"><span>매일 만나는 선물</span><strong>일곱 번의 만남</strong><small>${game.canClaimWeekly?'오늘 보상 받기':'오늘 수령 완료'} · 7일차 전용 S급 알 1개</small></button></div>`;
}
