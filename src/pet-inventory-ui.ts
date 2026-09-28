import type {GameState} from './game';
import {MONGLES,RARITIES,petIcon,BALANCE} from './data';
import {weightText,WEIGHT_BALANCE} from './weight';
import {formatNumber as num} from './format';
import {petAbilities} from './pet-stats';
import {uiIcon} from './ui-icons';
import {collectionRewardReady} from './collection-status';

export const compactWeight=(grams:number)=>weightText(grams).replace(/\s/g,'').toLowerCase();
function status(game:GameState,key:string){
 const following=(game.save.activeLots??[]).filter(k=>k===key).length;
 return [following?`동행 중${following>1?` ${following}`:''}`:'',game.save.mountLot===key?'탑승 중':''].filter(Boolean).join(' · ')||'미장착';
}
function highlights(id:number){
 const p=MONGLES[id];
 return [[p.speedMultiplier,'성장 속도'],[p.clickMultiplier,'두드리기'],[p.autoMultiplier,'자동 부화']]
  .filter(([value])=>Number(value)>1).slice(0,2).map(([value,label])=>`<span>${label} +${num((Number(value)-1)*100,1)}%</span>`).join('');
}
export function petDetailPanel(game:GameState,key:string){
 const lot=game.save.petLots?.find(l=>l.key===key&&l.count>0);if(!lot)return '';
 const p=MONGLES[lot.species],free=game.lotAvailable(key),mounted=game.save.mountLot===key;
 const riding=lot.weightG>=WEIGHT_BALANCE.mountMinimumGrams,mode=document.getElementById('panel')?.dataset.petPick;
 const mountPrimary=riding&&!mounted&&(mode==='mount'||free<=0);
 const button=(action:string,label:string,primary=false)=>`<button class="${primary?'primary':'secondary'}" data-lot-action="${action}" data-lot="${key}">${label}</button>`;
 const equip=free>0?button('equip',game.save.active.length>=BALANCE.maxCompanions?'동행 교체':'함께 다니기',!mountPrimary):'';
 const mount=riding&&!mounted?button('mount',game.mountPetLot?'탑승 교체':'탑승하기',mountPrimary):'';
 return `<section class="pet-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="pet-detail-title"><div class="pet-sheet-heading"><span class="tag">${RARITIES[p.tier].name}</span><button id="close-pet-detail" class="secondary" aria-label="펫 상세 닫기">닫기</button></div><img class="pet-detail-image" src="${petIcon(lot.species)}" alt=""/><h2 id="pet-detail-title">${p.name}</h2><div class="pet-detail-meta"><strong>${compactWeight(lot.weightG)}</strong><span class="pet-state">${status(game,key)}</span><small>보유 ${num(lot.count)} · 미장착 ${num(free)}</small></div><div class="pet-highlights">${highlights(lot.species)}</div><details><summary>전체 능력치</summary><div class="stat-badges">${petAbilities(p)}</div><p>별가루 생산 ${num(game.petIncomeAmount(lot.species)/BALANCE.petIncomeSeconds)}/초${riding?` · 탑승 이동속도 +${num(game.mountBonus(lot.species)*100,1)}%`:''}</p><button class="secondary" data-pet-view="${lot.species}">크게 보기</button></details>${!riding?'<p class="pet-condition">3kg 이상부터 탑승 가능</p>':''}<div class="pet-detail-actions">${mountPrimary?mount+equip:equip+mount}${game.activePetLots.flatMap((l,slot)=>l.key===key?[`<button class="secondary" data-lot-action="unequip" data-slot="${slot}">동행 해제${game.activePetLots.filter(p=>p.key===key).length>1?` · ${slot+1}번`:''}</button>`]:[]).join('')}${mounted?'<button class="secondary" id="unequip-mount">탑승 해제</button>':''}</div>${free>0?`<button class="pet-sale-link" data-lot-action="sell" data-lot="${key}">판매 · ${num(game.petSellPrice(lot.species))}</button>`:'<p class="pet-condition">판매하려면 먼저 장착을 해제해 주세요.</p>'}</section>`;
}
export function petInventoryPanel(game:GameState){
 const panel=document.getElementById('panel'),selected=panel?.dataset.petSort??'recent',picking=panel?.dataset.petPick==='mount';
 const all=(game.save.petLots??[]).filter(l=>l.count>0),order=new Map(all.map((l,i)=>[l.key,i]));
 const lots=all.filter(l=>(!picking||l.weightG>=WEIGHT_BALANCE.mountMinimumGrams)).slice().sort((a,b)=>{
  const value=(l:typeof a)=>selected==='recent'?order.get(l.key)!:selected==='weight'?l.weightG:selected==='rarity'?MONGLES[l.species].tier:selected==='speed'?MONGLES[l.species].speedMultiplier:selected==='stage'?MONGLES[l.species].stageId:selected==='count'?l.count:selected==='tap'?MONGLES[l.species].clickMultiplier:selected==='auto'?MONGLES[l.species].autoMultiplier:selected==='income'?game.petIncomeAmount(l.species):Number(game.lotAvailable(l.key)<l.count);
  return selected==='name'?MONGLES[a.species].name.localeCompare(MONGLES[b.species].name,'ko'):value(b)-value(a)||a.species-b.species||b.weightG-a.weightG;
 });
 const mount=game.mountPetLot;
 const reward=collectionRewardReady(game);
 const slots=Array.from({length:BALANCE.maxCompanions},(_,slot)=>{
  const l=game.activePetLots[slot];
  return `<button class="pet-slot ${l?'':'empty'}" ${l?`data-lot-action="unequip" data-slot="${slot}" aria-label="${MONGLES[l.species].name} 동행 해제"`:'data-pet-pick="equip" aria-label="동행 선택"'}><small>동행 ${slot+1}</small>${l?`<img src="${petIcon(l.species)}" alt=""/><span class="slot-remove">×</span>`:'<b>＋</b>'}</button>`;
 }).join('');
 return `<div class="pet-inventory-heading"><h1>펫 <small>${num(all.reduce((n,l)=>n+l.count,0))}</small></h1><button data-tab="collection" class="secondary collection-icon-button ${reward?'reward-ready':''}" aria-label="도감${reward?' · 받을 보상 있음':''}">${uiIcon('book')}</button></div>
 <section class="pet-loadout compact-loadout" aria-label="장착한 펫">${slots}<button class="pet-slot mount-slot ${mount?'':'empty'}" ${mount?'id="unequip-mount" aria-label="탑승 해제"':'data-pet-pick="mount" aria-label="탑승 펫 선택"'}><small>탑승</small>${mount?`<img src="${petIcon(mount.species)}" alt=""/><span class="slot-remove">×</span>`:'<b>＋</b>'}</button></section>
 <div class="pet-list-tools"><select id="pet-sort" aria-label="펫 정렬">${Object.entries({recent:'최근 획득',equipped:'장착 우선',weight:'무게',rarity:'등급',speed:'성장 속도',stage:'스테이지',count:'수량',name:'이름',tap:'두드리기',auto:'자동 부화',income:'생산'}).map(([k,v])=>`<option value="${k}" ${selected===k?'selected':''}>${v}</option>`).join('')}</select></div>
 ${picking?'<div class="pet-pick-notice">탑승 <button class="secondary" data-pet-pick="" aria-label="탑승 필터 해제">×</button></div>':''}
 <div class="pet-inventory-grid" aria-label="보유 펫">${lots.map(l=>{
  const p=MONGLES[l.species],free=game.lotAvailable(l.key),mounted=game.save.mountLot===l.key,slot=game.activePetLots.findIndex(a=>a.key===l.key);
  const ride=l.weightG>=WEIGHT_BALANCE.mountMinimumGrams;
  const follow=free>0?`<button class="${picking?'secondary':'primary'}" data-lot-action="equip" data-lot="${l.key}">${game.save.active.length>=BALANCE.maxCompanions?'동행 교체':'동행'}</button>`:slot>=0?`<button class="secondary" data-lot-action="unequip" data-slot="${slot}">동행 해제</button>`:'';
  return `<article class="pet-tile"><span class="pet-tile-rarity">${RARITIES[p.tier].name}<small>${l.count>1?`×${num(l.count)}`:''}</small></span><button class="pet-card-preview" data-pet-lot="${l.key}" aria-label="${p.name} 상세 및 판매"><img src="${petIcon(l.species)}" alt="" loading="lazy"/><span aria-hidden="true">ⓘ</span></button><b>${p.name}</b><span class="pet-weight">${compactWeight(l.weightG)}</span>${slot>=0||mounted?`<span class="pet-state">${status(game,l.key)}</span>`:''}<div class="pet-card-actions">${follow}${ride?(mounted?'<button class="secondary" data-remove-mount="true">탑승 해제</button>':`<button class="${picking||!follow?'primary':'secondary'}" data-lot-action="mount" data-lot="${l.key}">탑승</button>`):''}</div></article>`;
 }).join('')||`<p class="pet-empty-message">${picking?'3kg 이상부터 탑승 가능':'알을 부화해 친구를 만나 보세요'}</p>`}</div>`;
}
