import type {GameState} from './game';
import {MONGLES,RARITIES,petIcon,BALANCE} from './data';
import {weightText,WEIGHT_BALANCE} from './weight';
import {formatNumber as num} from './format';
import {petAbilities} from './pet-stats';

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
 const panel=document.getElementById('panel'),selected=panel?.dataset.petSort??'recent',equipped=panel?.dataset.petFilter==='equipped',picking=panel?.dataset.petPick==='mount';
 const all=(game.save.petLots??[]).filter(l=>l.count>0),order=new Map(all.map((l,i)=>[l.key,i]));
 const lots=all.filter(l=>(!equipped||game.lotAvailable(l.key)<l.count)&&(!picking||l.weightG>=WEIGHT_BALANCE.mountMinimumGrams)).slice().sort((a,b)=>{
  const value=(l:typeof a)=>selected==='recent'?order.get(l.key)!:selected==='weight'?l.weightG:selected==='rarity'?MONGLES[l.species].tier:selected==='speed'?MONGLES[l.species].speedMultiplier:selected==='stage'?MONGLES[l.species].stageId:selected==='count'?l.count:selected==='tap'?MONGLES[l.species].clickMultiplier:selected==='auto'?MONGLES[l.species].autoMultiplier:selected==='income'?game.petIncomeAmount(l.species):Number(game.lotAvailable(l.key)<l.count);
  return selected==='name'?MONGLES[a.species].name.localeCompare(MONGLES[b.species].name,'ko'):value(b)-value(a)||a.species-b.species||b.weightG-a.weightG;
 });
 const mount=game.mountPetLot;
 return `<div class="pet-inventory-heading"><h1>펫 보관함</h1><button data-tab="collection" class="secondary">도감</button></div><p class="pet-inventory-count">보유 ${num(all.reduce((n,l)=>n+l.count,0))} · 동행 ${game.save.active.length}/${BALANCE.maxCompanions} · 탑승 ${mount?1:0}</p><section class="pet-loadout" aria-label="장착한 펫"><div class="pet-mount-row"><span>탑승</span>${mount?`<button class="pet-mount-summary" data-pet-lot="${mount.key}"><img src="${petIcon(mount.species)}" alt=""/><span><b>${MONGLES[mount.species].name}</b><small>${compactWeight(mount.weightG)} · 이동속도 +${num(game.mountBonus(mount.species)*100,1)}%</small></span></button>`:'<span class="pet-empty-label">함께 달릴 친구를 골라 주세요</span>'}<button class="secondary" data-pet-pick="mount">${mount?'변경':'선택'}</button></div><div class="pet-follow-row"><span>동행</span><div class="pet-slots">${Array.from({length:BALANCE.maxCompanions},(_,slot)=>{const l=game.activePetLots[slot];return l?`<button class="pet-slot" data-pet-lot="${l.key}"><img src="${petIcon(l.species)}" alt=""/><b>${MONGLES[l.species].name}</b><small>${compactWeight(l.weightG)}</small></button>`:`<button class="pet-slot empty" data-pet-pick="equip" aria-label="${slot+1}번 동행 자리 선택">＋</button>`;}).join('')}</div></div></section><div class="pet-list-tools"><label class="pet-sort">정렬 <select id="pet-sort">${Object.entries({recent:'최근 획득',equipped:'장착 우선',weight:'무거운 순',rarity:'등급',speed:'성장 속도',stage:'스테이지',count:'수량',name:'이름',tap:'두드리기',auto:'자동 부화',income:'생산'}).map(([k,v])=>`<option value="${k}" ${selected===k?'selected':''}>${v}</option>`).join('')}</select></label><button class="secondary pet-filter" id="pet-equipped-filter" aria-pressed="${equipped}">장착 중</button></div>${picking?'<div class="pet-pick-notice"><span>탑승할 친구를 골라 주세요 · 3kg 이상</span><button class="secondary" data-pet-pick="">전체 보기</button></div>':''}<div class="pet-inventory-grid">${lots.map(l=>{const p=MONGLES[l.species];return `<button class="pet-tile" data-pet-lot="${l.key}" aria-label="${p.name} ${compactWeight(l.weightG)} 상세"><span class="pet-tile-rarity">${RARITIES[p.tier].name}<small>×${num(l.count)}</small></span><img src="${petIcon(l.species)}" alt="" loading="lazy"/><b>${p.name}</b><span class="pet-weight">${compactWeight(l.weightG)}</span><span class="pet-state">${status(game,l.key)}</span></button>`;}).join('')||`<p class="pet-empty-message">${picking?'3kg 이상인 친구를 만나면 탑승할 수 있어요.':equipped?'장착 중인 친구가 없어요.':'알을 부화해 친구를 만나 보세요.'}</p>`}</div>`;
}
