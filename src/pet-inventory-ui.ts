import type {GameState} from './game';
import {MONGLES,RARITIES,petIcon,BALANCE} from './data';
import {weightText,weightedPetStats,petWeightRatio} from './weight';
import {formatNumber as num} from './format';
import {petAbilities,statBadge} from './pet-stats';
import {uiIcon} from './ui-icons';
import {collectionRewardReady} from './collection-status';

export const compactWeight=(grams:number)=>weightText(grams).replace(/\s/g,'').toLowerCase();
function status(game:GameState,key:string){
 const following=(game.save.activeLots??[]).filter(k=>k===key).length;
 return [following?`동행 중${following>1?` ${following}`:''}`:'',game.save.mountLot===key?'탑승 중':''].filter(Boolean).join(' · ')||'미장착';
}
function highlights(id:number,w:{weightG:number;standardWeightG:number}){return petAbilities(weightedPetStats(id,w),true);}
function abilityDescriptions(stats:{clickMultiplier:number;autoMultiplier:number;speedMultiplier:number},income:number,mountBonus:number){
 return `<dl class="pet-ability-descriptions"><dt>두드리기 ×${num(stats.clickMultiplier,2)}</dt><dd>알을 직접 두드릴 때 부화 진행량을 늘려요.</dd><dt>자동 부화 ×${num(stats.autoMultiplier,2)}</dt><dd>알이 자동으로 부화하는 진행량을 늘려요.</dd><dt>성장 속도 ×${num(stats.speedMultiplier,2)}</dt><dd>스테이지 진입과 알 운반의 기준이 되는 성장 속도를 높여요. 실제 걷는 속도와는 달라요.</dd><dt>별가루 생산 +${num(income,2)}/초</dt><dd>동행하는 동안 별가루를 생산해요.</dd><dt>탑승 이동속도 +${num(mountBonus*100,1)}%</dt><dd>탑승 펫으로 장착하면 실제 이동속도가 빨라져요.</dd></dl>`;
}
export function petLoadoutPanel(game:GameState){
 return `<section class="pet-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="pet-loadout-title"><div class="pet-sheet-heading"><h2 id="pet-loadout-title">장착 효과</h2><button id="close-pet-detail" class="secondary" aria-label="장착 효과 닫기">닫기</button></div><p>현재 동행·탑승 중인 펫의 합산 효과예요.</p>${abilityDescriptions(game,game.incomePerSecond,game.mountSpeedMultiplier-1)}<p class="pet-condition">동행 펫의 배율은 기본 1배에 각 펫의 추가분을 더해요.<br>탑승 효과는 탑승 중인 펫에만 적용돼요.</p></section>`;
}
export function petDetailPanel(game:GameState,key:string){
 const lot=game.save.petLots?.find(l=>l.key===key&&l.count>0);if(!lot)return '';
 const p=MONGLES[lot.species],free=game.lotAvailable(key),mounted=game.save.mountLot===key;
 const riding=true,mode=document.getElementById('panel')?.dataset.petPick;
 const mountPrimary=riding&&!mounted&&(mode==='mount'||free<=0);
 const button=(action:string,label:string,primary=false)=>`<button class="${primary?'primary':'secondary'}" data-lot-action="${action}" data-lot="${key}">${label}</button>`;
 const equip=free>0?button('equip',game.save.active.length>=BALANCE.maxCompanions?'동행 교체':'함께 다니기',!mountPrimary):'';
 const mount=riding&&!mounted?button('mount',game.mountPetLot?'탑승 교체':'탑승하기',mountPrimary):'';
 return `<section class="pet-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="pet-detail-title"><div class="pet-sheet-heading"><span class="tag">${RARITIES[p.tier].name}</span><button id="close-pet-detail" class="secondary" aria-label="펫 상세 닫기">닫기</button></div><img class="pet-detail-image" src="${petIcon(lot.species)}" alt=""/><h2 id="pet-detail-title">${p.name}</h2><div class="pet-detail-meta"><strong>${compactWeight(lot.weightG)}</strong><span class="pet-state">${status(game,key)}</span><small>보유 ${num(lot.count)} · 미장착 ${num(free)}</small></div><div class="pet-highlights">${highlights(lot.species,lot)}</div><h3>이 펫의 능력</h3><p class="pet-condition">현재 무게가 반영된 수치예요. 두드리기·자동 부화·성장 속도·생산은 동행할 때 적용돼요.</p>${abilityDescriptions(weightedPetStats(lot.species,lot),game.petIncomeAmount(lot.species)*petWeightRatio(lot)/BALANCE.petIncomeSeconds,game.mountBonus(lot.species,lot))}<details><summary>전체 능력치</summary><div class="stat-badges">${petAbilities(weightedPetStats(lot.species,lot),true)}</div><p>별가루 생산 ${num(game.petIncomeAmount(lot.species)*petWeightRatio(lot)/BALANCE.petIncomeSeconds)}/초${riding?` · 탑승 이동속도 +${num(game.mountBonus(lot.species,lot)*100,1)}%`:''}</p><button class="secondary" data-pet-view="${lot.species}">크게 보기</button></details><p class="pet-condition">작은 펫은 모자 위에, 큰 펫은 등에 타요.</p><div class="pet-detail-actions">${mountPrimary?mount+equip:equip+mount}${game.activePetLots.flatMap((l,slot)=>l.key===key?[`<button class="secondary" data-lot-action="unequip" data-slot="${slot}">동행 해제${game.activePetLots.filter(p=>p.key===key).length>1?` · ${slot+1}번`:''}</button>`]:[]).join('')}${mounted?'<button class="secondary" id="unequip-mount">탑승 해제</button>':''}</div>${free>0?`<button class="pet-sale-link" data-lot-action="sell" data-lot="${key}">판매 · ${num(game.petSellPrice(lot.species))}</button>`:'<p class="pet-condition">판매하려면 먼저 장착을 해제해 주세요.</p>'}</section>`;
}
export function petInventoryPanel(game:GameState){
 const panel=document.getElementById('panel'),selected=panel?.dataset.petSort??'recent',picking=panel?.dataset.petPick==='mount';
 const tiled=panel?.dataset.petView==='tiles',reversed=panel?.dataset.petReverse==='true';
 const all=(game.save.petLots??[]).filter(l=>l.count>0),order=new Map(all.map((l,i)=>[l.key,i]));
 const lots=all.slice().sort((a,b)=>{
  const value=(l:typeof a)=>selected==='recent'?order.get(l.key)!:selected==='weight'?l.weightG:selected==='rarity'?MONGLES[l.species].tier:selected==='speed'?weightedPetStats(l.species,l).speedMultiplier:selected==='stage'?MONGLES[l.species].stageId:selected==='count'?l.count:selected==='tap'?weightedPetStats(l.species,l).clickMultiplier:selected==='auto'?weightedPetStats(l.species,l).autoMultiplier:selected==='income'?game.petIncomeAmount(l.species)*petWeightRatio(l):Number(game.lotAvailable(l.key)<l.count);
  return selected==='name'?MONGLES[a.species].name.localeCompare(MONGLES[b.species].name,'ko'):value(b)-value(a)||a.species-b.species||b.weightG-a.weightG;
 });
 const mount=game.mountPetLot;
 if(reversed)lots.reverse();
 const reward=collectionRewardReady(game);
 const slots=Array.from({length:BALANCE.maxCompanions},(_,slot)=>{
  const l=game.activePetLots[slot];
  return `<button class="pet-slot ${l?'':'empty'}" ${l?`data-lot-action="unequip" data-slot="${slot}" aria-label="${MONGLES[l.species].name} 동행 해제"`:'data-pet-pick="equip" aria-label="동행 선택"'}><small>동행 ${slot+1}</small>${l?`<img src="${petIcon(l.species)}" alt=""/><span class="slot-remove">×</span>`:'<b>＋</b>'}</button>`;
 }).join('');
 return `<div class="pet-inventory-heading"><h1>펫 <small>${num(game.petCount)} / ${num(game.petCapacity)}</small></h1><div class="pet-heading-actions"><button id="open-pet-loadout" class="secondary pet-effects-button" aria-label="장착 효과" aria-haspopup="dialog">${uiIcon('auto')}<span>효과</span></button><button data-tab="collection" class="secondary collection-icon-button ${reward?'reward-ready':''}" aria-label="도감${reward?' · 받을 보상 있음':''}">${uiIcon('book')}</button></div></div>
 <section class="pet-loadout compact-loadout" aria-label="장착한 펫">${slots}<button class="pet-slot mount-slot ${mount?'':'empty'}" ${mount?'id="unequip-mount" aria-label="탑승 해제"':'data-pet-pick="mount" aria-label="탑승 펫 선택"'}><small>탑승</small>${mount?`<img src="${petIcon(mount.species)}" alt=""/><span class="slot-remove">×</span>`:'<b>＋</b>'}</button></section>
 <div class="pet-list-tools"><button id="pet-view-toggle" class="secondary" aria-pressed="${tiled}" aria-label="타일 보기">${tiled?'▤ 카드':'▦ 타일'}</button><button id="pet-sort-reverse" class="secondary" aria-pressed="${reversed}" aria-label="정렬 역순">${reversed?'↑ 역순':'↓ 기본순'}</button><select id="pet-sort" aria-label="펫 정렬">${Object.entries({recent:'최근 획득',equipped:'장착 우선',weight:'무게',rarity:'등급',speed:'성장 속도',stage:'스테이지',count:'수량',name:'이름',tap:'두드리기',auto:'자동 부화',income:'생산'}).map(([k,v])=>`<option value="${k}" ${selected===k?'selected':''}>${v}</option>`).join('')}</select></div>
 ${picking?'<div class="pet-pick-notice">탑승 <button class="secondary" data-pet-pick="" aria-label="탑승 필터 해제">×</button></div>':''}
 <div class="pet-inventory-grid ${tiled?'tile-view':''}" aria-label="보유 펫">${lots.map(l=>{
  const p=MONGLES[l.species],free=game.lotAvailable(l.key),mounted=game.save.mountLot===l.key,slot=game.activePetLots.findIndex(a=>a.key===l.key);
  const ride=true;
  const follow=free>0?`<button class="${picking?'secondary':'primary'}" data-lot-action="equip" data-lot="${l.key}">${game.save.active.length>=BALANCE.maxCompanions?'동행 교체':'동행'}</button>`:slot>=0?`<button class="secondary" data-lot-action="unequip" data-slot="${slot}">동행 해제</button>`:'';
  return `<article class="pet-tile"><span class="pet-tile-rarity">${RARITIES[p.tier].name}<small>${l.count>1?`×${num(l.count)}`:''}</small></span><button class="pet-card-preview" data-pet-lot="${l.key}" aria-label="${p.name} 능력 설명 및 상세"><img src="${petIcon(l.species)}" alt="" loading="lazy"/><span aria-hidden="true">ⓘ</span></button><b>${p.name}</b><span class="pet-weight">${compactWeight(l.weightG)}</span><div class="stat-badges pet-card-stats">${highlights(l.species,l)}${statBadge('dust',`+${num(game.petIncomeAmount(l.species)*petWeightRatio(l)/BALANCE.petIncomeSeconds,2)}/초`,'동행 시 별가루 생산')}</div>${slot>=0||mounted?`<span class="pet-state">${status(game,l.key)}</span>`:''}<div class="pet-card-actions">${follow}${ride?(mounted?'<button class="secondary" data-remove-mount="true">탑승 해제</button>':`<button class="${picking||!follow?'primary':'secondary'}" data-lot-action="mount" data-lot="${l.key}">탑승</button>`):''}</div></article>`;
 }).join('')||`<p class="pet-empty-message">알을 부화해 친구를 만나 보세요</p>`}</div>`;
}
