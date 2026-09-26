import {ECONOMY,UPGRADES} from './data';
import {STAGES,recommendedRouteSpeed} from './stage-data';
import {compare,subtract,exactMoney} from './money';
import {formatNumber as num} from './format';
import type {GameState} from './game';
export function growthPanel(g:GameState){
  const stage=g.growthStage, done=g.save.upgrades.speed>=20;
  const cost=g.cost('speed'),missing=compare(g.save.dust,cost)<0?subtract(cost,g.save.dust):0;
  const seconds=g.incomePerSecond?Number(missing)/g.incomePerSecond:0;
  const middle=ECONOMY.middleUpgrades.find(k=>g.save.upgrades[k]<=g.save.upgrades.speed&&g.save.upgrades[k]<20);
  const next=STAGES[Math.min(19,stage)];
  return `<section class="growth-goal"><h2>${done?'성장 강화 완성':`${stage}/20 · ${STAGES[stage-1].name} 준비`}</h2><p>자동 생산 <b>${num(g.incomePerSecond)}/초</b> · 오프라인 100%, 최대 48시간</p>${compare(g.offlineReward,0)>0?`<p>복귀 생산 +${num(g.offlineReward)}</p>`:''}${done?'<p>창조자의 알 귀환·부화와 도감 수집을 이어가세요.</p>':`<p>다음 목표: 스피드 강화 · 필요 ${num(recommendedRouteSpeed(0,Math.min(20,stage+1)))}<br>별가루 ${num(g.save.dust)} / ${num(cost)}</p><details><summary>${compare(missing,0)>0?`부족 ${num(missing)}`:'지금 구매 가능'}${seconds?` · 현재 수익 기준 약 ${num(seconds/3600)}시간`:''}</summary><p>보유 ${exactMoney(g.save.dust)}<br>가격 ${exactMoney(cost)}<br>부족 ${exactMoney(missing)}<br>수익·접속 시점과 추가 구매에 따라 달라져요.</p></details><button data-upgrade="speed" ${compare(missing,0)>0?'disabled':''}>스피드 ×1.4 · ${num(cost)}</button>${middle?`<p>중간 목표: ${UPGRADES[middle].name} · ${UPGRADES[middle].description}</p><button data-upgrade="${middle}" ${compare(g.save.dust,g.cost(middle))<0?'disabled':''}>${num(g.cost(middle))} · ${compare(g.save.dust,g.cost(middle))>=0?'구매 가능':'모으는 중'}</button>`:''}<p>다음 세계: ${next.name} · 일반 펫 10종과 시크릿 드래곤</p>`}</section>`;
}
