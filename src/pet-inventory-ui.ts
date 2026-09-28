import type {GameState} from './game';
import {MONGLES,RARITIES,petIcon,BALANCE} from './data';
import {weightText,WEIGHT_BALANCE} from './weight';
import {formatNumber as num} from './format';
import {petAbilities} from './pet-stats';
export function petInventoryPanel(game:GameState){
 const selected=document.getElementById('panel')?.dataset.petSort??'equipped';
 const lots=(game.save.petLots??[]).filter(l=>l.count>0).slice().sort((a,b)=>{
  const value=(l:typeof a)=>selected==='weight'?l.weightG:selected==='rarity'?MONGLES[l.species].tier:selected==='speed'?MONGLES[l.species].speedMultiplier:selected==='stage'?MONGLES[l.species].stageId:selected==='count'?l.count:selected==='tap'?MONGLES[l.species].clickMultiplier:selected==='auto'?MONGLES[l.species].autoMultiplier:selected==='income'?game.petIncomeAmount(l.species):Number(game.lotAvailable(l.key)<l.count);
  return selected==='name'?MONGLES[a.species].name.localeCompare(MONGLES[b.species].name,'ko'):value(b)-value(a)||a.species-b.species||b.weightG-a.weightG;
 });
 const mount=game.mountPetLot;
 return `<h1>내 펫 보관소</h1><button data-tab="collection">도감</button><div class="mount-slot">${mount?`<button class="pet-slot" id="unequip-mount"><small>탑승 펫</small><img src="${petIcon(mount.species)}" alt=""/><b>${MONGLES[mount.species].name}</b><strong class="pet-weight">${weightText(mount.weightG)}</strong><small>이동속도 +${num(game.mountBonus(mount.species)*100,1)}% · 스탯 +${num(game.speed-game.unmountedSpeed,2)}</small><small>해제 ×</small></button>`:'<div class="pet-slot empty">탑승 펫 자리</div>'}</div>
 <div class="pet-slots">${Array.from({length:BALANCE.maxCompanions},(_,slot)=>{const l=game.activePetLots[slot];return l?`<button class="pet-slot" data-lot-action="unequip" data-slot="${slot}"><img src="${petIcon(l.species)}" alt=""/><b>${MONGLES[l.species].name}</b><small>${weightText(l.weightG)} · 해제 ×</small></button>`:'<div class="pet-slot empty">동행 자리</div>';}).join('')}</div>
 <label class="pet-sort">정렬 <select id="pet-sort">${Object.entries({equipped:'착용 중',weight:'무거운 순',rarity:'등급',speed:'속도',stage:'스테이지',count:'수량',name:'이름',tap:'터치 피해',auto:'자동 피해',income:'수익'}).map(([k,v])=>`<option value="${k}" ${selected===k?'selected':''}>${v}</option>`).join('')}</select></label>
 <p>무게가 다르면 같은 종도 따로 보관해요. 같은 무게의 개체는 수량으로 표시해요.</p>
 ${lots.map(l=>{const p=MONGLES[l.species],free=game.lotAvailable(l.key);return `<article class="friend"><button class="friend-preview" data-pet-view="${l.species}"><img src="${petIcon(l.species)}" alt="${p.name}" loading="lazy"/></button><div><small>${RARITIES[p.tier].name} · ${l.count}마리 · 착용 ${l.count-free}</small><h3>${p.name}</h3><strong class="pet-weight">${weightText(l.weightG)}</strong><details><summary>능력치</summary><div class="stat-badges">${petAbilities(p)}</div></details></div><div class="pet-actions"><button class="small-btn" data-lot-action="equip" data-lot="${l.key}" ${free<=0?'disabled':''}>${game.save.active.length>=3?'교체':'동행'}</button><button class="small-btn" data-lot-action="mount" data-lot="${l.key}" ${game.save.mountLot===l.key||l.weightG<WEIGHT_BALANCE.mountMinimumGrams?'disabled':''}>${l.weightG<WEIGHT_BALANCE.mountMinimumGrams?'3KG 이상 탑승':`탑승 +${num(game.mountBonus(l.species)*100,1)}%`}</button><button class="small-btn" data-lot-action="sell" data-lot="${l.key}">판매 +${num(game.petSellPrice(l.species))}</button></div></article>`;}).join('')||'<p>알을 부화해 친구를 만나 보세요.</p>'}`;
}
