import {ULTRA_SECRET,isUltraPet} from './ultra-secret';
import {eventsPanel} from './events-ui';
import {weightText} from './weight';
import {collectionRewardReady} from './collection-status';
import {petInventoryPanel} from './pet-inventory-ui';
import {eggMaxHp} from './data';
import {weeklyPanel} from './weekly-ui';
import {compare} from './money';
import { EGGS, MONGLES, RARITIES, REGIONS, UPGRADES, TRAILS, BALANCE, STAGE_COLLECTION_REWARDS, petIcon, rarityChances, type Upgrade } from "./data";
import {STAGES} from "./stage-data";
import {eggName,eggIcon} from "./stage-eggs";
import type { GameState } from "./game";
import { formatNumber as num } from "./format";
import {collectionEligible,stageReward,OVERHAUL} from './balance';
import {petAbilities} from './pet-stats';
function collectionCard(i:number,slot:number,game:GameState){
 const m=MONGLES[i],found=game.hasDiscoveredPet(i),claimed=game.save.claimedPets?.includes(i);
 if(isUltraPet(i)&&!found)return `<article class="pet-catalog-card secret-pet"><div class="pet-portrait unknown">?</div><small>ULTRA SECRET · 0.001%</small><h3>태초의 시크릿</h3><p>${STAGES[m.stageId-1].name}</p></article>`;
 if((i>=300&&i<320)&&!found)return `<article class="pet-catalog-card secret-pet"><div class="pet-portrait"><img src="${import.meta.env.BASE_URL}models/stage-previews/pet-${i}-silhouette.png" alt="숨겨진 드래곤 실루엣" loading="lazy"/></div><small>SECRET DRAGON</small><h3>숨겨진 수호룡</h3><p>${STAGES[m.stageId-1].name} · 전용 알 ${(BALANCE.secretDragonEggChance*100).toFixed(2)}%</p></article>`;
 return `<article class="pet-catalog-card ${found?(claimed?'':'reward-ready'):'locked'} ${(i>=300&&i<320)?'secret-pet':''}">${found&&!claimed?'<span class="sr-only">받을 보상 있음</span>':''}${found?`<button class="pet-portrait" data-pet-view="${i}" aria-label="${m.name} 크게 보기"><img src="${petIcon(i)}" alt="${m.name}" loading="lazy"/></button>`:'<div class="pet-portrait unknown" aria-label="미발견">?</div>'}<small>NO.${String(slot+1).padStart(2,'0')} · ${RARITIES[m.tier].name}</small><h3>${found?m.name:'???'}</h3>${found?`<div class="stat-badges">${petAbilities(m)}</div><details class="pet-details"><summary>상세</summary><p>${m.description}<br>${m.effect}</p></details><small>보유 ${num(game.save.mongles[i])}</small><button class="small-btn" data-claim-pet="${i}" ${claimed?'disabled':''}>${claimed?'보상 수령 완료':`+${num(game.discoveryReward(i))}`}</button>`:''}</article>`;
}

export function panelHTML(tab: string, game: GameState) {
  if(tab==='events')return eventsPanel(game);
  if(tab==='weekly')return weeklyPanel(game);
  if(tab==='collection-special')return `<h1>스페셜 도감</h1><button data-tab="collection">스테이지 도감</button><div class="pet-catalog-grid">${collectionCard(320,0,game)}</div>`;
  if(tab==='pets')return petInventoryPanel(game);
  if(tab==='store')return `<span class="tag">FARM TRADING POST</span><h1>농장 판매 스토어</h1><p>알이나 펫을 별가루로 바꿔요.<br>펫을 팔아도 도감 발견과 보상 기록은 남아요.</p><button data-tab="shop" class="secondary">트레일 상점으로</button><h2>보관 중인 알</h2>${game.save.eggs.length?game.save.eggs.map(e=>`<article class="sale-card"><img src="${eggIcon(e)}" alt=""/><div><b>${eggName(e)}</b><small>${EGGS[e.type].rarity} · ${weightText(e.weightG??0)} · HP ${num(Math.ceil(e.hp))}/${num(eggMaxHp(e))}</small></div><button class="small-btn" data-sell-egg="${e.id}">판매 +${num(game.eggSellPrice(e))}</button></article>`).join(''):'<p>판매할 알이 없어요.</p>'}<h2>보유 펫</h2><button data-tab="pets">무게별 펫 선택 및 판매</button>`;
  if(tab==='collection'){
    const raw=Number(document.getElementById('panel')?.dataset.collectionStage??game.stage.id);
    const stage=Number.isInteger(raw)&&raw>=0&&raw<=20?raw:game.stage.id;
    const legacy=stage===0;
    const region=Math.max(0,Math.min(4,Number(document.getElementById('panel')?.dataset.region??0)||0));
    const members=MONGLES.flatMap((m,i)=>(legacy?i<100&&m.stageId===0&&m.region===region:m.stageId===stage)?[i]:[]);
    const catalog=MONGLES.flatMap((m,i)=>(legacy?i<100&&m.stageId===0:m.stageId>0)?[i]:[]);
    const count=members.filter(i=>game.hasDiscoveredPet(i)).length;
    const required=members.filter(i=>legacy||collectionEligible(MONGLES[i]));
    const requiredCatalog=catalog.filter(i=>legacy||collectionEligible(MONGLES[i]));
    const requiredCount=required.filter(i=>game.hasDiscoveredPet(i)).length;
    const claimed=legacy?game.save.claimedRegions?.includes(region):game.save.claimedStages?.includes(stage);
    const fullClaimed=legacy?game.save.claimedCollection:game.save.claimedStageCollection;
    const title=legacy?`이전 도감 · ${REGIONS[region].name}`:`${stage}. ${STAGES[stage-1].name}`;
    const reward=legacy?BALANCE.regionCollectionRewards[region]:STAGE_COLLECTION_REWARDS[stage-1];
    const chances=rarityChances(legacy?region:Math.floor((stage-1)/4)).map((chance,tier)=>legacy?chance:chance*(1-BALANCE.secretDragonEggChance-ULTRA_SECRET.chance)+(tier===6?(BALANCE.secretDragonEggChance+ULTRA_SECRET.chance)*100:0));
    return `<h1>펫 도감</h1><button data-tab="collection-special" class="${game.hasDiscoveredPet(320)&&!game.save.claimedPets?.includes(320)?'reward-ready':''}">스페셜</button><button data-tab="events">이벤트</button>
      <div class="collection-count">${catalog.filter(i=>game.hasDiscoveredPet(i)).length}<small> / ${catalog.length} 발견${legacy?' · 이전 수집 기록':' · 스테이지 전용 펫'}</small></div>
      <details class="stage-categories"><summary>${title} · 카테고리 변경</summary><div class="stage-category-grid"><button data-collection-stage="0" class="${collectionRewardReady(game,0)?'reward-ready':''}">이전 도감</button>${STAGES.map(s=>{const found=MONGLES.filter((m,i)=>m.stageId===s.id&&game.hasDiscoveredPet(i)).length;return `<button data-collection-stage="${s.id}" class="${stage===s.id?'active':''} ${collectionRewardReady(game,s.id)?'reward-ready':''}" aria-pressed="${stage===s.id}"><b>${s.id}. ${s.name}</b><small>${found}/${MONGLES.filter(m=>m.stageId===s.id).length}</small></button>`;}).join('')}</div></details>
      ${legacy?`<div class="region-tabs">${REGIONS.map((r,i)=>`<button data-region="${i}" class="${region===i?'active':''}">${r.name}</button>`).join('')}</div>`:''}
      <details class="collection-tools"><summary>${count}/${members.length} 발견 · 보상 / 확률</summary><div class="collection-reward"><b>C~S ${requiredCount}/${required.length} 발견</b><button class="small-btn" ${legacy?'data-claim-region':'data-claim-stage'}="${legacy?region:stage}" ${requiredCount!==required.length||claimed?'disabled':''}>${claimed?'완성 보상 수령 완료':`완성 보상 별가루 ${num(reward)}`}</button><button class="small-btn" id="${legacy?'claim-all':'claim-stage-all'}" ${fullClaimed||requiredCatalog.some(i=>!game.hasDiscoveredPet(i))?'disabled':''}>${fullClaimed?'전체 보상 수령 완료':`C~S ${requiredCatalog.length}종 완성 별가루 ${num(stageReward(legacy?game.growthStage:20,OVERHAUL.rewardMinutes.collection))}`}</button></div>
      <details class="rarity-guide"><summary>이 스테이지의 등급 확률</summary><p>알 등급이 펫 등급을 정해요. 같은 등급의 전용 펫은 동일 확률로 태어나요.</p><table><thead><tr><th>등급</th><th>알 확률</th><th>펫 종류</th></tr></thead><tbody>${RARITIES.map((r,tier)=>`<tr><td>${r.name}</td><td>${chances[tier].toFixed(2)}%</td><td>${members.filter(i=>MONGLES[i].tier===tier).length}종</td></tr>`).join('')}</tbody></table></details>
      </details><div class="pet-catalog-grid">${[ [0,3,"C~S"],[4,5,"SS~SSS"],[6,6,"Secret"] ].map(([lo,hi,label])=>`<section class="collection-group" style="grid-column:1/-1"><h2>${label}</h2><div class="pet-catalog-grid">${members.filter(i=>MONGLES[i].tier>=Number(lo)&&MONGLES[i].tier<=Number(hi)).map((i,slot)=>collectionCard(i,slot,game)).join('')}</div></section>`).join('')}</div>`;
  }
  if(tab === "shop") return `<span class="tag">DANDELION TRAIL CO.</span><h1>바람 꼬리 상점</h1><p>실제 이동이 빨라져요. 성장 보너스는 별도예요.<br>영구 소유 · 한 종류 장착 · 별가루로만 구매</p><button id="virtual-ad" class="secondary">가상 광고 · +${num(game.adReward)}</button><div class="shop-speed">성장 속도 <b>${num(game.progressionSpeed,2)}</b></div>${TRAILS.map((t,i)=>`<article class="trail-card" style="--trail:${t.color}"><img src="${import.meta.env.BASE_URL}models/${t.model}.png" alt="" /><div><h3>${t.name}</h3><strong>이동 ×${t.multiplier.toFixed(2)}</strong><small>성장 +${Math.round((OVERHAUL.trailProgression[i]-1)*100)}%</small><p>${i===0?"가벼운 첫 발걸음": ["","발끝에 흩날리는 꽃가루","따라오는 초록 반딧불","보랏빛 별조각의 긴 꼬리"][i]}</p></div><button class="small-btn" data-trail="${i}" ${!(game.save.trails??[0]).includes(i)&&compare(game.save.dust,t.cost)<0?"disabled":""}>${game.save.equippedTrail===i?"착용 중":(game.save.trails??[0]).includes(i)?"착용":`별가루 ${num(t.cost)}`}</button></article>`).join("")}`;
  if(tab === "upgrade") return `<span class="tag">FARM WORKSHOP</span><h1>조금 더 멀리, 조금 더 빠르게</h1><p>기지의 운동하기 버튼을 누르면 트레드밀에서 바로 운동해요.</p><div class="training-stats">운동으로 얻은 속도 <b>+${num(game.trainingSpeedBonus,3)}</b><br>운동 1초당 <b>+${num(game.effectiveTrainingRate,3)}</b></div>${(Object.entries(UPGRADES) as [Upgrade,typeof UPGRADES.speed][]).filter(([k])=>k!=='time').map(([k,u])=>`<article class="upgrade"><span class="upgrade-icon"><img src="${import.meta.env.BASE_URL}models/${({speed:"alkong",carry:"pack",tap:"hammer",damage:"pet-9",rate:"egg-3",time:"compass",training:"gym",health:"pack"})[k]}.png" alt="" /></span><div><small>LV.${game.save.upgrades[k]}</small><h3>${u.name}</h3><p>${u.description}</p></div><button data-upgrade="${k}" ${compare(game.save.dust,game.cost(k))<0||game.save.upgrades[k]>=BALANCE.maxUpgrade?"disabled":""}>${game.save.upgrades[k]>=BALANCE.maxUpgrade?"최대":"별가루 "+num(game.cost(k))}</button></article>`).join("")}`;
  return "";
}
