import type {GameState} from './game';
import {weeklyPanel} from './weekly-ui';
export function eventsPanel(game:GameState){
 const event=document.getElementById('panel')?.dataset.event;
 const back='<button data-event="home" class="secondary">이벤트 목록</button>';
 if(event==='weekly')return back+weeklyPanel(game);
 if(event==='secret')return `${back}<h1>태초의 시크릿을 찾아서</h1><p>20개 스테이지마다 새로운 시크릿 펫이 숨어 있어요.</p><strong>알 생성 1회당 0.001%</strong><p>태초의 시크릿 알을 기지로 가져와 부화하면 해당 스테이지의 전용 펫을 만나요.</p><button data-tab="collection">도감 보기</button>`;
 if(event==='coupon')return `${back}<h1>쿠폰 선물</h1><p>FREEPET · 랜덤 SS급 알 1개<br>계정당 1회 사용할 수 있어요.</p><label>쿠폰 코드<input id="event-coupon-code" maxlength="64" autocomplete="off" placeholder="쿠폰 코드"></label><button id="event-coupon-redeem">보상 받기</button>`;
 return `<h1>이벤트</h1><p>진행 중인 소식과 보상을 확인하세요.</p><div class="event-banners"><button data-event="weekly" class="event-banner weekly"><span>매일 만나는 선물</span><strong>일곱 번의 만남</strong><small>${game.canClaimWeekly?'오늘 보상 받기':'오늘 수령 완료'} · 7일차 전용 펫과 알</small></button><button data-event="secret" class="event-banner secret"><span>20개의 숨겨진 친구</span><strong>태초의 시크릿</strong><small>스테이지별 0.001%의 만남</small></button><button data-event="coupon" class="event-banner coupon"><span>쿠폰 선물</span><strong>FREEPET</strong><small>랜덤 SS급 알 받기</small></button></div>`;
}
