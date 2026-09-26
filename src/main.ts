import {eggMaxHp,COUPON_ERRORS} from './data';
import {advanceTutorial,tutorialHint} from './tutorial';
import {weeklyDay} from './weekly';
import {add,exactMoney,compare} from './money';
import "./style.css";
import {cycleClock} from "./cycle-clock";
import {petReveal} from './pet-reveal';
import {GameAudio,type GameSound} from './audio';
import {
  BALANCE,
  PROGRESSION,
  EGGS,
  RARITIES,
  MONGLES,
  petIcon,
  type Upgrade,
} from "./data";
import { ROUTE, FINAL_GUARDIAN } from "./stage-data";
import {eggName,eggIcon} from "./stage-eggs";
import { GameState, freshSave } from "./game";
import { Platform } from "./platform";
import { Input } from "./input";
import { World } from "./world";
import { panelHTML } from "./panels";
import { Multiplayer } from "./multiplayer";
import {OnlineGame} from './online';
import {RoomHUD} from './room-hud';
import {RoomChat} from './room-chat';
import { VirtualAd } from "./virtual-ad";
import { formatNumber as num } from "./format";
import { uiIcon } from './ui-icons';
import {petAbilities} from './pet-stats';
import {EggNotices} from './egg-notices';
import type {EggAppearance} from './stage-eggs';
let hatchEgg:EggAppearance|undefined;
let hatchClaiming=false;
let hatchRevealing=false;
let weeklyClaiming=false;

const app = document.querySelector<HTMLDivElement>("#app")!;
const icons = { explore: "barn", hatchery: "egg-0", pets: "pet-0", upgrade: "hammer", shop: "shop" };
app.innerHTML = `<main id="shell"><div id="world"></div><div class="vignette"></div><header id="main-hud" aria-label="탐험가 정보"><div class="hud-player"><img class="hud-avatar" src="${import.meta.env.BASE_URL}models/alkong.png" alt="탐험가"/><div class="hud-level"><strong id="level">LV.1</strong><div id="xp-track" role="progressbar" aria-label="경험치" aria-valuemin="0"><i id="xp-fill"></i></div></div></div><button id="cycle-clock" type="button" aria-live="off" aria-expanded="true" title="상단 정보 간소화"><span id="cycle-phase"></span><span id="cycle-label"></span><strong id="cycle-remaining"></strong><span id="cycle-track" aria-hidden="true"><i id="cycle-fill"></i></span></button><div class="hud-wallet"><div class="dust"><span aria-hidden="true">${uiIcon('dust')}</span><b id="dust">0</b><small>별가루</small></div><button id="settings" class="icon-btn" aria-label="설정">${uiIcon('settings')}</button></div></header><section id="expedition"><div class="timer-top"><span id="timer-label">오늘은 어떤 알을 만날까요?</span><strong id="timer">00:45</strong></div><div class="track"><i id="timer-fill"></i></div><div class="region"><span class="tag">EXPEDITION 01</span><h1 id="region">햇살 가득 풀숲</h1><p id="region-sub">작은 발견이 시작되는 곳</p></div></section><section id="hatch-info" hidden><span class="tag">A LITTLE MIRACLE</span><h1>몽글몽글 부화실</h1><p>작은 알 속에 누가 숨어 있을까요?</p><div id="egg-health"></div></section><div id="world-label">BASE CAMP <span>우리의 작은 기지</span></div><div id="hint" role="status">모험을 준비하고 있어요…</div><div id="carry-chip" hidden></div><div id="controls"><div class="joystick-wrap"><div id="joystick" role="group" aria-label="이동 조이스틱"><span class="axis-y">⌃</span><div id="knob"></div></div><small>살짝 밀어서 이동</small></div><button id="action"><span id="action-icon">${uiIcon('bat')}</span><strong id="action-label">탐색</strong></button></div><div id="risk">● <span>기지 · 안전한 곳</span></div><nav>${Object.entries(
  icons,
)
  .map(
    ([k, v], i) =>
      `<button data-tab="${k}" aria-label="${["농장", "부화실", "펫", "강화", "상점"][i]}" title="${["농장", "부화실", "펫", "강화", "상점"][i]}" class="${i === 0 ? "active" : ""}"><img src="${import.meta.env.BASE_URL}models/${v}.png" alt="" /><span class="sr-only">${["농장", "부화실", "펫", "강화", "상점"][i]}</span></button>`,
  )
  .join(
    "",
  )}</nav><section id="panel" hidden></section><div id="modal" hidden></div><div id="toast" role="status" hidden></div><div id="loading"><img class="loading-egg" src="${import.meta.env.BASE_URL}models/egg-0.png" alt="" /><h1>알콩 원정대</h1><p>작은 모험을 준비하는 중…</p></div></main>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const eggNotices=new EggNotices($("shell"));
$('world').insertAdjacentHTML('beforeend','<button id="hatch-touch" hidden aria-label="알 두드리기"><span>알을 클릭하여 깨뜨리기</span></button>');
$('world').insertAdjacentHTML('beforeend','<div id="first-egg-arrow" hidden><span>작은 알부터!</span><b>↓</b></div>');
$('action').insertAdjacentHTML('beforeend','<small id="action-weight" hidden></small>');
const buildVersion=document.createElement('small');
buildVersion.id='build-version';buildVersion.textContent=import.meta.env.VITE_BUILD_VERSION;
buildVersion.setAttribute('aria-label',`게임 버전 ${import.meta.env.VITE_BUILD_VERSION}`);
$("shell").append(buildVersion);
// Keep HUD rows in normal flow inside two anchored stacks.
const topHud = document.createElement("div");
let hudCompact=false,wasExploring=false;
function setHudCompact(compact:boolean){
  hudCompact=compact;
  topHud.classList.toggle('compact',compact);
  $('cycle-clock').setAttribute('aria-expanded',String(!compact));
  $('cycle-clock').title=compact?'상단 정보 펼치기':'상단 정보 간소화';
}
const hudObserver=new ResizeObserver(()=>{
  const bottom=$('main-hud').getBoundingClientRect().bottom-$('shell').getBoundingClientRect().top;
  $('shell').style.setProperty('--main-hud-bottom',`${bottom}px`);
  $('shell').style.setProperty('--top-hud-bottom',`${topHud.getBoundingClientRect().bottom-$('shell').getBoundingClientRect().top}px`);
});
hudObserver.observe($('main-hud'));hudObserver.observe(topHud);
topHud.id = "top-hud";
$("shell").append(topHud);
for (const el of [
  document.querySelector("header")!,
  $("expedition"),
  $("hatch-info"),
])
  topHud.append(el);
const announcement = document.createElement("div");
announcement.id = "announcement";
announcement.hidden = true;
announcement.setAttribute("role", "status");
topHud.append(announcement);
const speedHud = document.createElement("div");
speedHud.id = "speed-hud";
speedHud.innerHTML = `<div class="speed-heading">${uiIcon('speed')}<strong id="speed-value"></strong></div><small id="speed-help">운동으로 증가</small><span id="day-clock"></span>`;
const hudContext=document.createElement('div');
hudContext.id='hud-context';
topHud.append(hudContext);
const hudPlace=document.createElement('div');hudPlace.className='hud-place';
hudPlace.append($('expedition'));
hudContext.append(speedHud,hudPlace);
const roomHUD=new RoomHUD(hudPlace,$('world'));
topHud.insertAdjacentHTML('beforeend','<small id="xp-value"></small><div id="hazard-cue" role="status" hidden></div>');
$("world").insertAdjacentHTML('beforeend','<div id="health-hud" role="progressbar" aria-label="플레이어 체력" aria-valuemin="0" hidden><div class="health-track"><i id="hp-fill"></i></div></div>');
$("shell").insertAdjacentHTML('beforeend','<div id="region-banner" role="status" aria-live="polite" hidden><img id="region-banner-art" alt=""/><strong id="region-banner-name"></strong><img id="region-banner-object" alt=""/></div><div id="health-edge"></div><div id="ink-effect" hidden></div><div id="level-burst" hidden></div>');
topHud.insertBefore($("region-banner"),hudContext);
$("region-banner").insertAdjacentHTML('beforeend',`<span id="region-banner-speed" class="recommended-speed">${uiIcon('speed')}<b></b></span>`);
$('day-clock').innerHTML=`${uiIcon('speed')}<b id="recommended-speed-value"></b>`;
$('day-clock').classList.add('recommended-speed');
$("shell").insertAdjacentHTML('beforeend','<div id="boss-pressure" aria-hidden="true" hidden></div><div id="boss-alert" role="status" aria-live="polite" hidden><strong id="boss-alert-title"></strong><small id="boss-alert-detail" aria-hidden="true"></small></div>');
$("world").insertAdjacentHTML('beforeend','<div id="night-sky" aria-hidden="true"><span>☾</span></div>');
const tutorial = document.createElement("div");
tutorial.id = "tutorial";
tutorial.innerHTML = `<img id="tutorial-icon" src="${import.meta.env.BASE_URL}models/egg-0.png" alt=""/><div><b id="tutorial-title"></b><p id="tutorial-copy"></p></div><button id="tutorial-skip" aria-label="튜토리얼 건너뛰기">×</button>`;
topHud.append(tutorial);
const weeklyEntry=document.createElement('button');weeklyEntry.id='weekly-entry';weeklyEntry.dataset.tab='weekly';topHud.append(weeklyEntry);
let renderedWeeklyDay=-1;
$("shell").insertAdjacentHTML("beforeend", '<div id="night-curtain" hidden><div class="night-card"><span>☾</span><h2>농장이 잠드는 시간</h2><strong id="night-count">15</strong><p>밤에는 탐험할 수 없어요.<br>날이 밝으면 다시 출발해요.</p><small>3분마다 15초 · 운반 알은 떨어지고 농장으로 귀환</small></div></div><div id="return-reward" hidden><div id="reward-copy"><span class="tag">SAFE & SOUND</span><h1>알을 얻었어요!</h1><p id="reward-name"></p></div><button id="reward-ok" class="primary">농장에 보관했어요 · 확인</button></div>');
const bottomHud = document.createElement("div");
$("action").insertAdjacentHTML('beforebegin',`<button id="train-now" class="secondary" aria-label="운동하기" title="운동하기" hidden><img src="${import.meta.env.BASE_URL}models/gym.png" alt=""/><span class="sr-only">운동하기</span></button>`);
bottomHud.id = "bottom-hud";
$("shell").append(bottomHud);
const inventory = document.createElement("section");
inventory.id = "inventory";
inventory.innerHTML =
  '<div class="inventory-heading"><strong id="inventory-count" aria-label="알 보관함">0 / 6</strong></div><div id="egg-queue"></div><div id="pet-effects"></div>';
for (const el of [$("hint"), inventory, $("controls"), $("risk")])
  bottomHud.append(el);
bottomHud.insertBefore(tutorial,$('controls'));
let bannerStage=0,bannerUntil=0;
const expeditionBannerStages=new Set<number>();
let lastAnnouncement = 0,
  announcementTimer = 0;
const platform = new Platform();
const multiplayer=new Multiplayer(time=>{if(!qa)platform.offset=time-Date.now();},toast);
const online=new OnlineGame(toast,time=>platform.syncServerTime(time));
async function remote(kind:string,value?:unknown){try{return await online.send(kind,value);}catch(err){toast(err instanceof Error?err.message:'연결을 확인해 주세요.');return false;}}
const roomChat=new RoomChat($('controls'),()=>{input?.reset();online.halt();},text=>remote('chat',text));

const qa = import.meta.env.DEV && new URLSearchParams(location.search).get("qa") === "true" ? await import("./qa") : null;
if (qa) { platform.now = qa.now; platform.key="alkong:v1:qa"; }
let game: GameState,
  world: World,
  input: Input,
  tab = "explore",
  paused = false,
  syncing = false,
  ready = false,
  lastRevision = -1,
  lastResult: number | null = null,
  savedAt = 0,
  lastNow = 0,
  hiddenAt = 0,
  toastTimer = 0;
const audio=new GameAudio();
function applyAudioSettings(){audio.setVolume(game.save.settings.volume??1,!game.save.settings.sound);}
let heardHazards=new Set<number>();
let lastHeartbeat=0;
let bossAlertUntil=0,wasPursued=false;
let lastBossStep=0;
let virtualAd:VirtualAd|null=null;
let virtualAdPurpose:'currency'|'revive'='currency';
let pendingSale:{kind:'egg'|'pet';id:string}|null=null;
function playSound(sound:GameSound,stage=game.stage.id,tier=6){if(game.save.settings.sound)audio.play(sound,stage,tier);}
function feedback(sound:GameSound|null='ui') {
  if (game.save.settings.haptic) platform.haptic();
  if(sound)playSound(sound);
}
// Pay the audio device startup cost on login, before movement is available.
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{if(!ready||game.save.settings.sound)audio.unlock();},{capture:true});
function toast(text: string) {
  $("toast").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ($("toast").hidden = true), 3500);
}
async function save() {
  try {
    if(online.active){localStorage.setItem('alkong:preferences',JSON.stringify(game.save.settings));return;}
    await platform.save(game.snapshot());
  } catch {
    toast("저장하지 못했어요. 저장 공간과 연결을 확인해 주세요.");
  }
}
let claiming=false;
let pickupPreparation:{id:string;remaining:number;duration:number;x:number;z:number;hitAt:number;ready?:boolean}|null=null;
function warnAboutBoss(){
  const egg=game.near;if(!egg||game.save.bossWarningSeen||!$("modal").hidden)return false;
  input.reset();paused=true;pickupPreparation=null;
  $("modal").hidden=false;$("modal").dataset.kind='boss-warning';
  $("modal").innerHTML=`<section class="boss-warning-card" role="dialog" aria-modal="true" aria-labelledby="boss-warning-title" aria-describedby="boss-warning-size"><div class="boss-warning-art" aria-hidden="true"><img src="${eggIcon(egg)}" alt=""/><span>→</span><span class="warning-boss">${uiIcon('boss')}</span></div><h1 id="boss-warning-title">알을 들면<br>보스가 쫓아와요!</h1><p id="boss-warning-size">큰 알일수록<br>이동 속도가 느려져요.</p><button id="boss-warning-ok" class="primary">알겠어요!</button></section>`;
  return true;
}
async function action(preparedId?:string) {
  if (!ready || paused || hatchRevealing || game.result!==null || !$("modal").hidden || game.returnReward || game.death) return;
  if(claiming||game.now()<game.knockedUntil)return;
  const preparedEgg=preparedId?game.world.find(e=>e.id===preparedId):undefined;
  if(preparedId&&(!preparedEgg||!game.canReachEgg(preparedEgg)||game.carried))return;
  if (tab === "hatchery") {
    if(online.active){void remote('tap');return;}
    if (game.tap()) {
      $("action").dataset.hit = String(game.lastTap);
    }
  } else if (tab === "explore") {
    if(game.nearShortcut){if(online.active)await remote('shortcut');else game.openShortcut();updateHud();return;}
    if(!game.carried&&game.nearSeat>=0){
      input.reset();online.halt();
      if(online.active)await remote('sit');else{game.toggleSeat();void save();}
      updateHud();return;
    }
    const targetEgg=preparedEgg??game.near;
    if(!game.carried&&targetEgg&&!game.isAtBase){
      if(warnAboutBoss())return;
      const egg=targetEgg,duration=BALANCE.rareEggPickupSeconds[EGGS[egg.type].tier];
      if(duration>0&&preparedId!==egg.id){
        if(pickupPreparation)return;
        input.reset();
        online.halt();
        const preparation={id:egg.id,remaining:duration,duration,x:game.x,z:game.z,hitAt:game.hitAt,ready:!online.active};
        pickupPreparation=preparation;feedback('tap');
        if(online.active){const ok=await remote('prepare',egg.id);if(pickupPreparation===preparation){if(ok)preparation.ready=true;else pickupPreparation=null;}}
        return;
      }
    }
    if(!game.carried&&!game.near&&game.nearStore){setTab('store');return;}
    if(online.active){
      if(game.carried)await remote('drop');
      else if(targetEgg){input.reset();online.halt();await remote('pickup',targetEgg.id);}
      else if(game.nearGym)await remote('train');
      else if(!game.knockback.remaining&&world.swingBat(game.now())){feedback('swing');void remote('attack');}
      return;
    }
    if(!game.carried&&targetEgg?.id.startsWith('net-')){
      claiming=true;
      try{const egg=await multiplayer.claim(targetEgg.id);game.pickup({...egg,hp:eggMaxHp(egg),hpVersion:4,distance:Math.abs(egg.z),expires:game.nightAt});}
      catch(err){toast(String(err));}finally{claiming=false;}return;
    }
    if(!game.carried&&!game.near&&!game.nearGym){world.swingBat(game.now());feedback('swing');return;}
    if(preparedEgg)game.pickup(preparedEgg);else game.interact();
    feedback(null);
    platform.track("egg_interact", { carrying: game.carried ? 1 : 0 });
  }
}
function setTab(next: string) {
  if (!ready || game.death || hatchRevealing || hatchClaiming) return;
  if (
    next !== "explore" &&
    !game.isAtBase
  ) {
    toast("기지로 돌아오면 이용할 수 있어요.");
    return;
  }
  input.reset();
  pickupPreparation=null;
  tab = next;
  document
    .querySelectorAll<HTMLButtonElement>("nav [data-tab]")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab || (b.dataset.tab==='pets'&&tab==='collection') || (b.dataset.tab==='shop'&&tab==='store')));
  $("expedition").hidden = tab !== "explore";
  $("hatch-info").hidden = tab !== "hatchery";
  $("controls").hidden = !["explore", "hatchery"].includes(tab);
  $("joystick").parentElement!.hidden = tab === "hatchery";
  $("world-label").hidden = tab !== "explore";
  $("risk").hidden = tab !== "explore";
  $("panel").hidden = ["explore", "hatchery"].includes(tab);
  $("bottom-hud").hidden = !["explore", "hatchery"].includes(tab);
  renderPanel();
  if (tab === "hatchery") platform.track("hatch_start");
  platform.track("screen", { screen: tab });
  void save();
}
function renderPanel() {
  if(tab==='weekly'&&weeklyClaiming)return;
  const html=(tab==='shop'?'<button data-tab="store" class="secondary">알 · 펫 판매 스토어</button>':'')+panelHTML(tab, game);
  // Preserve pressed buttons and focus across unchanged network snapshots.
  if($('panel').dataset.html!==html){$('panel').dataset.html=html;$('panel').innerHTML=html;}
}
function updateHud() {
  weeklyEntry.hidden=!game.isAtBase||tab!=='explore'||!!game.returnReward||game.result!==null;
  weeklyEntry.textContent=game.canClaimWeekly?'🎁 주간 보상 받기':'🎁 주간 보상';
  if(tab==='weekly'&&renderedWeeklyDay!==weeklyDay(game.now())){renderedWeeklyDay=weeklyDay(game.now());renderPanel();}
  eggNotices.observeWorld(game,online.latest?.serverTime??game.now());
  eggNotices.update(online.latest?.eggNotices??[],online.latest?.serverTime??game.now());
  const outside=tab==='explore'&&!game.isAtBase;
  if(game.isAtBase)expeditionBannerStages.clear();
  if(outside!==wasExploring){setHudCompact(outside);wasExploring=outside;}
  if(!outside){bannerStage=0;bannerUntil=0;}
  else if(bannerStage!==game.stage.id){
    bannerStage=game.stage.id;
    const first=!expeditionBannerStages.has(bannerStage);
    expeditionBannerStages.add(bannerStage);
    bannerUntil=first?performance.now()+ROUTE.bannerSeconds*1000:0;
    $("region-banner-name").textContent=`${game.stage.id}단계 · ${game.stage.name}`;
    $('region-banner-speed').lastElementChild!.textContent=num(game.recommendedSpeed,1);
    $('region-banner-speed').setAttribute('aria-label',`권장 속도 ${num(game.recommendedSpeed,1)}`);
    $('region-banner-speed').title=`권장 속도 ${num(game.recommendedSpeed,1)}`;
    $<HTMLImageElement>("region-banner-art").src=`${import.meta.env.BASE_URL}models/guardian-${game.stage.id}.png`;
    $<HTMLImageElement>("region-banner-object").src=eggIcon({type:0,stageId:game.stage.id,variant:0});
    $("region-banner").style.setProperty('--region-accent',`#${game.stage.accent.toString(16).padStart(6,'0')}`);
  }
  $("region-banner").hidden=!outside||performance.now()>=bannerUntil;
  const hpRatio=game.hp/game.maxHp;
  $('health-edge').style.opacity=outside?String(Math.pow(Math.max(0,1-hpRatio),.7)): '0';
  $("health-hud").setAttribute('aria-valuenow',String(Math.ceil(game.hp)));
  $("health-hud").setAttribute('aria-valuemax',String(game.maxHp));
  $("health-hud").setAttribute('aria-valuetext',`${Math.ceil(game.hp)} / ${game.maxHp}${hpRatio<=PROGRESSION.lowHP?' · 위험':''}`);
  $("hp-fill").style.width=`${hpRatio*100}%`;
  $("health-hud").dataset.state=hpRatio<=PROGRESSION.lowHP?'danger':hpRatio<=PROGRESSION.warningHP?'warning':'safe';
  $("xp-value").textContent=`LV.${game.level} · ${num(game.progression.xp)} / ${num(game.progression.requiredXP)} XP · 귀환 +${num(game.progression.pendingXP)}`;
  $("xp-value").hidden=!outside;
  $('level').textContent=`LV.${game.level}`;
  $('xp-fill').style.width=`${Math.max(0,Math.min(100,game.progression.xp/game.progression.requiredXP*100))}%`;
  $('xp-track').setAttribute('aria-valuenow',String(game.progression.xp));
  $('xp-track').setAttribute('aria-valuemax',String(game.progression.requiredXP));
  $('xp-track').setAttribute('aria-valuetext',$('xp-value').textContent??'');
  $('xp-track').title=$('xp-value').textContent??'';
  $("shell").classList.toggle('low-health',outside&&hpRatio<=PROGRESSION.lowHP);
  $("shell").classList.toggle('recent-hit',outside&&game.now()-game.hitAt<350);
  $("ink-effect").hidden=game.effects.ink<=0;
  $("hazard-cue").hidden=true;
  $("level-burst").hidden=game.now()-game.levelUpAt>1800;
  $("level-burst").textContent=`LEVEL UP · ${game.level}`;
  if(!game.death&&$("modal").dataset.kind==='death'){
    if(virtualAdPurpose==='revive')virtualAd=null;
    paused=false;$("modal").hidden=true;$("modal").dataset.kind='';
  }
  if(game.death&&game.deathAnimationRemaining<=0&&!virtualAd&&$("modal").dataset.kind!=='death'){
    input.reset();paused=true;$("modal").hidden=false;$("modal").dataset.kind='death';
    $("modal").innerHTML='<section class="death-card" role="dialog" aria-modal="true" aria-labelledby="death-title"><span class="tag">A LITTLE REST</span><h1 id="death-title">잠시 쓰러졌어요</h1><p>떨어뜨린 알은 현장에 남아 있어요.</p><strong id="death-count"></strong><button id="revive-ad" class="primary">가상광고 보고 부활</button><small>10초 시청 · 제자리 HP 전부 회복 · 3초 무적<br>밤이 되면 농장으로 돌아가요</small><button id="respawn-base" class="secondary">그냥 복귀</button><small>복귀 시 원정 경험치 70% 유지</small></section>';
  }
  if(game.death&&!virtualAd&&document.getElementById('death-count'))$('death-count').textContent=`${game.deathChoiceRemaining}초 후 자동 복귀`;
  $("night-curtain").hidden = true;
  $("night-count").textContent = String(Math.max(0, Math.ceil((game.nightUntil-game.now())/1000)));
  $("speed-value").textContent = num(game.speed,2);
  const speedHelp=`현재 스피드 ${num(game.speed,2)}`;
  $('speed-hud').setAttribute('aria-label',speedHelp);
  $('speed-hud').title=speedHelp;
  $('recommended-speed-value').textContent=num(game.recommendedSpeed,1);
  $('day-clock').setAttribute('aria-label',`권장 속도 ${num(game.recommendedSpeed,1)}`);
  $('day-clock').title=`권장 속도 ${num(game.recommendedSpeed,1)}`;
  const phase=cycleClock(game.now(),game.nightAt,game.nightUntil),clock=$('cycle-clock');
  $('cycle-phase').textContent=phase.night?'☾ 밤':'☀ 낮';
  $('cycle-label').textContent=phase.night?'아침까지':'밤까지';
  $('cycle-remaining').textContent=phase.text;
  $('cycle-fill').style.width=`${phase.ratio*100}%`;
  clock.dataset.phase=phase.night?'night':'day';
  clock.classList.toggle('night-warning',phase.warning);
  if(phase.warning&&clock.dataset.warned!==String(game.nightAt)){
    clock.dataset.warned=String(game.nightAt);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('cycle-remaining').animate([{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:260,easing:'ease-out'});
  }
  clock.setAttribute('aria-label',`${phase.night?'밤':'낮'} · ${$('cycle-label').textContent} ${phase.text} · ${hudCompact?'상단 정보 펼치기':'상단 정보 간소화'}`);
  $("night-sky").classList.toggle('visible',game.isNight&&tab==='explore');
  $("speed-hud").classList.toggle("training", game.training);
  $("train-now").hidden=tab!=='explore'||!game.isAtBase||game.nearGym||game.training||game.seat!==null||!!game.carried||!!game.death||!!game.returnReward;
  $('speed-help').textContent=game.training?`+${num(game.effectiveTrainingRate,3)}/초`:'';
  $('speed-help').hidden=!game.training;
  const hint=tutorialHint(game,tab);
  $("tutorial").hidden=!hint || !!game.returnReward || game.result!==null || !!game.death || paused;
  $("tutorial-title").textContent=hint?`${hint.step}/5 · ${hint.title}`:'';
  $("tutorial-copy").textContent=hint?.copy??'';
  document.querySelectorAll('.tutorial-focus').forEach(el=>el.classList.remove('tutorial-focus'));
  if(hint&&!$('tutorial').hidden)document.querySelector(hint.target)?.classList.add('tutorial-focus');
  $("return-reward").hidden = !game.returnReward;
  if(game.returnReward){
    const rarity=RARITIES[EGGS[game.returnReward.type].tier];
    $("reward-name").textContent = eggName(game.returnReward);
    $("return-reward").querySelector('.tag')!.textContent=rarity.name;
    $("return-reward").classList.toggle('rare-reward',EGGS[game.returnReward.type].tier>=3);
    $("return-reward").style.setProperty('--rarity-color',rarity.color);
    $("return-reward").querySelector('h1')!.textContent=EGGS[game.returnReward.type].tier>=4?'귀한 알을 지켜냈어요!':'알을 얻었어요!';
  }
  $("shell").classList.toggle("reward-open", !!game.returnReward);
  const exploring = tab === "explore" && !game.isAtBase;
  $("shell").dataset.mode = exploring ? "expedition" : tab === "explore" ? "base" : tab;
  $("shell").classList.toggle("pursued", game.pursuing >= 0);
  $("shell").classList.toggle("carrying", !!game.carried);
  $("shell").classList.remove("wind");
  document.querySelector("nav")!.hidden = exploring;
  $("inventory").hidden = tab !== "hatchery";
  $("hint").hidden = tab!=="explore" || (exploring && game.pursuing < 0 && !game.launch);
  $("speed-hud").hidden = tab!=="explore";
  $("region").textContent =
    !exploring ? "달잠 농장" : game.stage.name;
  $("region-sub").textContent =
    !exploring ? "앞으로 걸으면 20개 지역이 이어져요" : game.stage.description;
  $("expedition").querySelector(".tag")!.textContent =
    exploring ? `STAGE ${String(game.stage.id).padStart(2, "0")} · STEP ${game.stageStep}/3` : "BASE CAMP";
  $("shell").classList.toggle("night", game.isNight);
  if (game.announcementId !== lastAnnouncement) {
    lastAnnouncement = game.announcementId;
    $("announcement").textContent = game.announcement;
    $("announcement").classList.toggle(
      "secret",
      game.announcement.includes("SECRET"),
    );
    $("announcement").hidden = false;
    clearTimeout(announcementTimer);
    announcementTimer = window.setTimeout(
      () => ($("announcement").hidden = true),
      game.announcement.includes("SECRET") ? 12000 : 5000,
    );
  }
    if (!game.isNight && game.announcement.startsWith('밤에는 농장에서')) {
      $("announcement").hidden = true;
      clearTimeout(announcementTimer);
    }
    $("dust").textContent = num(game.save.dust);
  $('dust').classList.toggle('long-number',$('dust').textContent!.length>8);
  $('dust').parentElement!.title=`별가루 ${exactMoney(game.save.dust)}`;
  $('dust').parentElement!.querySelector('small')!.textContent=`${num(game.incomePerSecond)}/초`;
  $("timer").textContent = num(game.recommendedSpeed,1);
  $("timer-label").textContent = "권장 속도";
  $("timer-fill").style.width = `${Math.min(100,game.speed/game.recommendedSpeed*100)}%`;
  $("expedition").classList.remove("urgent");
  $("hint").textContent =
    game.pursuing >= 0
      ? "알을 들고 귀환하세요 · ! 표시의 장애물을 피하세요"
      : game.message;
  $("carry-chip").hidden = !game.carried || tab !== "explore";
  if (game.carried)
    $("carry-chip").textContent =
      '알 운반중';
  $("risk").className = game.risk;
  $("risk").querySelector("span")!.textContent = !game.isAtBase
    ? `기지 ${Math.round(game.distance)}m · ${game.risk==='safe'?'스피드 충분':game.risk==='warning'?'스피드 강화 추천':'먼 지역 · 스피드를 더 키워요'}`
    : "기지 · 시간 제한 없이 탐험해요";
  $("world-label").style.opacity = game.distance < 4 ? "1" : "0";
  $("action").hidden = tab==='hatchery'||!game.action;
  $("action-label").textContent = game.carried?'알 내려놓기':pickupPreparation?'꺼내는 중':tab === "hatchery" ? "두드리기" : game.near&&BALANCE.rareEggPickupSeconds[EGGS[game.near.type].tier]>0?'알 꺼내기':game.action;
  $("action").classList.toggle('preparing',!!pickupPreparation);
  $("action").style.setProperty('--pickup-progress',`${pickupPreparation?(1-pickupPreparation.remaining/pickupPreparation.duration)*100:0}%`);
  $("action").setAttribute('aria-label',pickupPreparation?'희귀 알 꺼내는 중, 이동하면 취소':$("action-label").textContent??'행동');
  $('action').title=$('action-label').textContent??'행동';
  const preparingEggId=pickupPreparation?.id;
  const actionEgg=tab==='explore'?(game.carried??(preparingEggId?game.world.find(e=>e.id===preparingEggId):game.near)):null;
  const weightHint=$('action-weight');weightHint.hidden=true;weightHint.textContent='';
  $('action-label').hidden=!game.carried&&!game.nearShortcut&&((!game.nearGym&&game.nearSeat<0)||!!actionEgg);
  $('action-icon').hidden=!!game.carried||!!game.nearShortcut;
  const actionModel=game.nearStore?'shop':game.nearGym?'gym':null;
  const actionIcon=actionEgg?`<img src="${eggIcon(actionEgg)}" alt=""/>`:game.nearSeat>=0?'<span aria-hidden="true">🪵</span>':actionModel?`<img src="${import.meta.env.BASE_URL}models/${actionModel}.png" alt=""/>`:uiIcon('bat');
  if($("action-icon").dataset.icon!==actionIcon){$("action-icon").dataset.icon=actionIcon;$("action-icon").innerHTML=actionIcon;}
  $("action").classList.toggle(
    "available",
    tab === "hatchery" || !!game.near || !!game.carried || !!game.nearShortcut || game.nearGym || game.nearStore || game.nearSeat>=0,
  );
  ($("action") as HTMLButtonElement).disabled =
    (tab === "hatchery" && (!game.selected || game.selected.hp===0));
  if (tab === "hatchery") {
    const e = game.selected;
    $("egg-health").innerHTML = e
      ? `<div class="track" role="progressbar" aria-label="${eggName(e)} 남은 알 내구도" aria-valuenow="${e.hp}" aria-valuemin="0" aria-valuemax="${eggMaxHp(e)}"><i style="width:${(e.hp / eggMaxHp(e)) * 100}%"></i></div><small class="egg-health-numbers"><span aria-label="체력 ${num(e.hp)} / ${num(eggMaxHp(e))}">♡ ${num(e.hp)} / ${num(eggMaxHp(e))}</span><span aria-label="클릭 피해 ${num(Math.min(e.hp,game.tapDamage))}">${uiIcon('tap')} −${num(Math.min(e.hp,game.tapDamage))}</span></small>`
      : '<span aria-label="보관 중인 알이 없어요">🥚 0</span>';
  }
  const touch=$<HTMLButtonElement>('hatch-touch');
  touch.hidden=tab!=='hatchery'||!game.selected||!!game.returnReward||game.result!==null||hatchRevealing||!$('modal').hidden;
  touch.disabled=hatchClaiming;
  const touchLabel=hatchClaiming?'열고 있어요…':game.selected?.hp===0?'알을 클릭하여 개봉':'알을 클릭하여 깨뜨리기';
  touch.querySelector('span')!.textContent=touchLabel;touch.setAttribute('aria-label',touchLabel);
  $('shell').classList.toggle('hatch-revealing',hatchRevealing);
  if (game.revision !== lastRevision) {
    lastRevision = game.revision;
    renderPanel();
    void world.showCompanions(game.save.active).catch(err => toast(String(err)));
    void save();
    renderEggQueue();
  }
  if (!virtualAd && !game.death && !game.returnReward && game.result !== null && lastResult !== game.result) {
    lastResult = game.result;
    input.reset();
    const resultId=game.result;
    const m = MONGLES[game.result];
    const resultHTML =
      `<div class="result-card" style="--reward:${m.color}">${petReveal(m.stageId,(game.result>=300&&game.result<320),m.tier)}${game.result>=100&&game.result<320?`<div class="result-pet-motion"><div class="result-idle" role="img" aria-label="${m.name}" style="background-image:url('${import.meta.env.BASE_URL}models/stage-previews/pet-${game.result}-idle.png')"></div><div class="result-greeting" aria-hidden="true" style="background-image:url('${import.meta.env.BASE_URL}models/stage-previews/pet-${game.result}-greeting.png')"></div></div>`:`<img class="result-pet" src="${petIcon(game.result)}" alt="${m.name}"/>`}<span class="tag">${(game.result>=300&&game.result<320)?'SECRET DRAGON':RARITIES[m.tier].name}</span><h1>${m.name}</h1><div class="benefit stat-badges">${petAbilities(m)}</div><details><summary>이 친구는?</summary><p>${m.description}</p></details><button id="result-ok" class="primary">함께 모험하기</button></div>`;
    hatchRevealing=true;touch.hidden=true;$('shell').classList.add('hatch-revealing');
    const appearance=hatchEgg??{type:Math.max(0,EGGS.findIndex(e=>e.tier===m.tier)),stageId:m.stageId};
    hatchEgg=undefined;
    void world.revealHatch(resultId,appearance,()=>{playSound('hatch',m.stageId,m.tier);feedback(null);}).catch(err=>{console.warn('Hatch presentation unavailable',err);}).finally(()=>{
      hatchRevealing=false;$('shell').classList.remove('hatch-revealing');
      if(game.result!==resultId)return;
      $('modal').innerHTML=resultHTML;$('modal').hidden=false;feedback(null);
    });
    platform.track("hatch_complete", { mongle: m.id });
    feedback(null);
  }
}
function renderEggQueue() {
  let queue = document.getElementById("egg-queue");
  if (!queue) {
    queue = document.createElement("div");
    queue.id = "egg-queue";
    $("inventory").append(queue);
  }
  $("inventory-count").textContent =
    `🥚 ${game.save.eggs.length} / ${BALANCE.inventory}`;
  queue.innerHTML = Array.from({ length: BALANCE.inventory }, (_, i) => {
    const e = game.save.eggs[i];
    if (!e)
      return '<div class="egg-slot empty" aria-label="빈 보관 칸"><span>＋</span></div>';
    const def = EGGS[e.type];
    return `<button data-egg="${e.id}" aria-label="${def.rarity} ${eggName(e)} 선택" class="egg-slot ${game.save.selected === e.id ? "selected" : ""} ${def.tier >= 4 ? "rare" : ""}" style="--egg:${def.color}"><b>${def.rarity}</b><img class="egg-icon" src="${eggIcon(e)}" alt="" /><small>${e.hp===0?'획득 준비 완료':eggName(e)}</small></button>`;
  }).join("");
  $("pet-effects").innerHTML = game.save.active.length
    ? `<div class="stat-badges"><span>${game.save.active.length}/${BALANCE.maxCompanions}</span>${petAbilities(game,true)}</div>`
    : "알을 부화하면 펫이 함께 걸어요";
}
async function onlineButton(b:HTMLElement):Promise<boolean>{
  const bindings:Record<string,string>={claimStage:'claimStage',claimPet:'claimPet',claimRegion:'claimRegion',trail:'trail',upgrade:'upgrade',egg:'select',companion:'equip',unequip:'unequip'};
  for(const [attribute,kind] of Object.entries(bindings))if(b.dataset[attribute]!==undefined){
    const raw=b.dataset[attribute]!;await remote(kind,['upgrade','select'].includes(kind)?raw:Number(raw));return true;
  }
  if(b.id==='train-now'){
    if(tab==='explore'&&!paused&&$("modal").hidden&&!game.returnReward){input.reset();online.halt();await remote('train');}return true;
  }
  if(b.id==='confirm-sale'&&pendingSale){await remote(pendingSale.kind==='egg'?'sellEgg':'sellPet',pendingSale.kind==='egg'?pendingSale.id:Number(pendingSale.id));pendingSale=null;paused=false;$("modal").hidden=true;return true;}
  if(b.id==='boss-warning-ok'){await remote('warning');paused=false;$("modal").hidden=true;$("modal").dataset.kind='';input.reset();return true;}
  if(b.id==='respawn-base'){await remote('return');paused=false;$("modal").hidden=true;$("modal").dataset.kind='';return true;}
  if(b.id==='result-ok'){await remote('result');lastResult=null;$("modal").hidden=true;setTab('hatchery');return true;}
  if(b.id==='reward-ok'){await remote('reward');$("return-reward").hidden=true;return true;}
  const commands:Record<string,string>={'tutorial-skip':'tutorial','claim-stage-all':'claimStageCollection','claim-all':'claimCollection'};
  if(commands[b.id]){await remote(commands[b.id]);return true;}
  if(b.id==='multiplayer-connect'){toast(`농장 ${game.farmSlot+1} · ${online.latest?.count??1}/5`);return true;}
  return false;
}
function showSettings() {
  if (!ready || game.result !== null || virtualAd || game.death) return;
  paused = true;
  input.reset();
  void save();
  $("modal").hidden = false;
  $("modal").innerHTML =
    `<div class="settings-card"><span class="tag">TAKE A LITTLE BREAK</span><h1>잠깐 쉬어가요</h1><p>진행 상황은 자동으로 저장돼요. 탐험 제한시간은 없어요.</p><fieldset class="sound-settings"><legend>사운드</legend><label for="volume-setting">전체 볼륨 <output id="volume-value" for="volume-setting">${Math.round((game.save.settings.volume??1)*100)}%</output></label><input id="volume-setting" type="range" min="0" max="100" step="1" value="${Math.round((game.save.settings.volume??1)*100)}" aria-label="배경음악과 효과음 볼륨"/><label for="sound-setting">음소거 <input id="sound-setting" type="checkbox" ${!game.save.settings.sound ? "checked" : ""}></label><small>배경음악 · 효과음에 함께 적용</small></fieldset><label>햅틱 <input id="haptic-setting" type="checkbox" ${game.save.settings.haptic ? "checked" : ""}></label><label>그래픽 <select id="quality-setting"><option value="high" ${game.save.settings.quality === "high" ? "selected" : ""}>기본 · 그림자 켜기</option><option value="low" ${game.save.settings.quality === "low" ? "selected" : ""}>가볍게 · 그림자 끄기</option></select></label><button id="leaderboard" class="secondary">최장 원정 순위 · ${num(game.save.best)}m</button><button id="resume" class="primary">모험 계속하기</button></div>`;
  $("resume").insertAdjacentHTML("beforebegin",`<label>탐험가 모자 <select id="appearance-setting"><option value="0">새싹 초록</option><option value="1">노을 주황</option><option value="2">하늘 파랑</option></select></label><p>${platform.native?"토스 게임 로그인 연결됨":"브라우저 · 기기 저장"}</p><button id="multiplayer-connect" class="secondary">${multiplayer.connected?"친구 연결 종료":"게스트 로그인 · 친구와 걷기"}</button><small>같은 서버에서 이동 공유 · 알과 수집은 각자 진행</small>`);
  if(online.active){
    const accountLink=document.createElement('section');$('resume').before(accountLink);online.mountEmailLink(accountLink);
    $("resume").insertAdjacentHTML('afterend','<button id="leave-room" class="secondary">방 나가기</button>');
    const button=$("multiplayer-connect");button.textContent=`${online.latest?.count??1} / 5`;
    const note=button.nextElementSibling;if(note)note.textContent='';
    const label=button.previousElementSibling;if(label)label.textContent='Supabase';
  }
  ($("appearance-setting") as HTMLSelectElement).value=String(game.save.appearance??0);
  $('resume').insertAdjacentHTML('beforebegin','<fieldset class="sound-settings email-link"><legend>쿠폰 코드</legend><form id="coupon-form"><label>쿠폰 코드<input id="coupon-code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="64" required placeholder="코드를 입력하세요"></label><button type="submit" class="secondary">쿠폰 사용</button></form><p id="coupon-status" role="status">쿠폰은 계정당 1회 사용할 수 있어요. 농장에서 입력해 주세요.</p></fieldset>');
  const couponForm=$('coupon-form') as HTMLFormElement,couponInput=$('coupon-code') as HTMLInputElement,couponStatus=$('coupon-status');
  couponForm.onsubmit=async event=>{
    event.preventDefault();if(couponRedeeming)return;
    const code=couponInput.value.trim().toUpperCase();if(!code)return;
    couponRedeeming=true;const field=couponForm.closest('fieldset')!;field.disabled=true;couponStatus.textContent='쿠폰 확인 중…';
    try{
      if(online.active){const ok=await remote('coupon',code);const error=online.latest?.errors.find(value=>value in COUPON_ERRORS||value==='RETURN_TO_BASE');couponStatus.textContent=ok?game.message:error==='RETURN_TO_BASE'?'농장으로 돌아와서 사용해 주세요.':COUPON_ERRORS[error??'']??'쿠폰을 사용할 수 없어요. 연결을 확인하고 다시 시도해 주세요.';if(ok)couponInput.value='';}
      else {const error=game.redeemCoupon(code);couponStatus.textContent=error?(error==='RETURN_TO_BASE'?'농장으로 돌아와서 사용해 주세요.':COUPON_ERRORS[error]??'쿠폰을 사용할 수 없어요.'):game.message;if(!error){couponInput.value='';void save();}}
    }finally{couponRedeeming=false;field.disabled=false;}
  };
  $('resume').insertAdjacentHTML('beforebegin',`<fieldset class="sound-settings"><legend>펫 표시</legend><label>내 펫 숨김 <input id="hide-own-pets" type="checkbox" ${game.save.settings.hideOwnPets?'checked':''}></label><label>다른 사람 펫 숨김 <input id="hide-other-pets" type="checkbox" ${game.save.settings.hideOtherPets?'checked':''}></label><small>동행·농장 펫과 이름표만 숨겨요. 능력과 수익은 유지돼요.</small></fieldset>`);
}
const hatchTouches:{egg:string;x:number;y:number;at:number}[]=[];
let couponRedeeming=false;
let pendingPetReplacement:{id:number;active:number[]}|null=null,petReplacing=false;
document.addEventListener("click", async (e) => {
  const target=e.target as HTMLElement;
  const b = target.closest<HTMLElement>("button")??(tab==='hatchery'&&target.closest('#world')?$('hatch-touch'):null);
  if (!b || !ready) return;
  if(b.id==='cycle-clock'){setHudCompact(!hudCompact);return;}
  if(b.id==='leave-room'){paused=true;input.reset();b.setAttribute('disabled','');await online.leave();location.reload();return;}
  if(b.id==='hatch-touch'||b.id==='claim-hatch'){
    if(tab!=='hatchery'||paused||hatchRevealing||!$('modal').hidden||game.returnReward||game.death)return;
    if(game.selected&&game.selected.hp>0){
      const point={egg:game.selected.id,x:e.clientX,y:e.clientY,at:performance.now()};
      world.shakeHatch();
      if(e.detail>0){hatchTouches.push(point);if(hatchTouches.length>20)hatchTouches.shift();}
      const ok=online.active?await remote('tap'):game.tap();
      if(!ok){const index=hatchTouches.indexOf(point);if(index>=0)hatchTouches.splice(index,1);}
      return;
    }
    const egg=game.selected;
    if(hatchClaiming||!egg||egg.hp!==0||game.result!==null)return;
    hatchClaiming=true;hatchEgg={...egg};input.reset();online.halt();
    try{const ok=online.active?await remote('claimHatch',egg.id):game.claimHatch(egg.id);if(!ok)hatchEgg=undefined;else{void save();updateHud();}}
    catch(err){hatchEgg=undefined;toast(err instanceof Error?err.message:'개봉하지 못했어요. 다시 눌러 주세요.');}
    finally{hatchClaiming=false;}
    return;
  }
  if(hatchRevealing)return;
  if(b.dataset.companion!==undefined&&game.save.active.length>=BALANCE.maxCompanions){
    const id=Number(b.dataset.companion);
    if(!MONGLES[id]||game.equippedCount(id)>=(game.save.mongles[id]??0)||game.death)return;
    pendingPetReplacement={id,active:[...game.save.active]};input.reset();online.halt();paused=true;
    $('modal').innerHTML=`<section class="death-card" role="dialog" aria-modal="true" aria-labelledby="replace-pet-title"><h1 id="replace-pet-title">교체할 펫 선택</h1><p>${MONGLES[id].name}와 교체할 현재 착용 펫을 골라 주세요.</p><div class="pet-slots">${game.save.active.map((old,slot)=>`<button class="pet-slot" data-replace-pet="${slot}" ${old===id?'disabled':''}><img src="${petIcon(old)}" alt=""/><b>${MONGLES[old].name}</b><small>${RARITIES[MONGLES[old].tier].name} · ${slot+1}번 자리</small><span>${old===id?'같은 펫':'교체'}</span></button>`).join('')}</div><button id="cancel-pet-replacement" class="secondary">취소</button></section>`;
    $('modal').hidden=false;return;
  }
  if(b.id==='cancel-pet-replacement'){
    if(petReplacing)return;pendingPetReplacement=null;paused=false;$('modal').hidden=true;return;
  }
  if(b.dataset.replacePet!==undefined&&pendingPetReplacement){
    if(petReplacing)return;
    const slot=Number(b.dataset.replacePet),{id,active}=pendingPetReplacement,expected=active[slot];
    if(expected===undefined)return;
    petReplacing=true;$('modal').querySelectorAll('button').forEach(button=>button.disabled=true);
    try{
      const ok=online.active?await remote('replacePet',{id,slot,expected}):game.replacePet(id,slot,expected);
      if(ok){toast(`${MONGLES[id].name} 착용 완료`);void save();}
      else toast('교체하지 못했어요. 현재 착용 펫을 확인하고 다시 선택해 주세요.');
    }finally{petReplacing=false;pendingPetReplacement=null;paused=false;$('modal').hidden=true;renderPanel();}
    return;
  }
  if(b.id==='weekly-claim'){
    if(weeklyClaiming)return;
    weeklyClaiming=true;b.setAttribute('disabled','');b.textContent='받는 중…';input.reset();online.halt();
    try{
      const ok=online.active?await remote('weekly'):game.claimWeekly();
      if(ok){toast(game.message);void save();}else if(!online.active)toast(game.message);
    }finally{weeklyClaiming=false;delete $('panel').dataset.html;renderPanel();}
    return;
  }
  if(b.dataset.petView!==undefined){input.reset();const {openPetViewer}=await import('./pet-viewer');await openPetViewer(Number(b.dataset.petView));return;}
  if(online.active&&await onlineButton(b))return;
  if(b.id==='boss-warning-ok'){
    game.save.bossWarningSeen=true;paused=false;$("modal").hidden=true;$("modal").dataset.kind='';input.reset();void save();return;
  }
  if(b.id==='train-now'){
    if(tab!=='explore'||paused||!$("modal").hidden||game.returnReward||claiming)return;
    if(game.toggleTraining()){input.reset();feedback(null);updateHud();void save();}
    return;
  }
  if((b.id==='virtual-ad'||b.id==='revive-ad')&&!virtualAd){
    if(online.active&&!await remote(b.id==='revive-ad'?'reviveAd':'adStart'))return;
    if(!online.active&&b.id==='revive-ad'&&!game.beginReviveAd()){game.tick(0);updateHud();return;}
    virtualAdPurpose=b.id==='revive-ad'?'revive':'currency';
    virtualAd=new VirtualAd(()=>game.now());paused=true;input.reset();
    $("modal").hidden=false;
    $("modal").innerHTML=`<section class="virtual-ad-card" role="dialog" aria-modal="true" aria-label="가상 광고"><button id="virtual-ad-close" aria-label="광고 닫고 보상 받기" hidden>닫기 ×</button><span class="tag">TEST AD</span><h1>이것은 가상 광고입니다.</h1><p>실제 광고가 아닌 보상 흐름 테스트입니다.</p><strong id="ad-count">10</strong><p>잠시 후 오른쪽 위에 닫기 버튼이 나타나요.</p><small>${virtualAdPurpose==='revive'?'완료 보상 · HP 전부 회복하고 부활':`완료 보상 · 별가루 ${BALANCE.virtualAdReward}개`}</small></section>`;
    platform.track('virtual_ad_start');return;
  }
  if(b.id==='virtual-ad-close'&&virtualAd){
    const reward=virtualAd.claim();if(!reward)return;
    if(online.active){await remote(virtualAdPurpose==='revive'?'revive':'adClaim');}
    else if(virtualAdPurpose==='revive'){const revived=game.revive(true);toast(revived?'다시 일어났어요! HP가 전부 회복됐어요.':'밤이 되어 농장으로 돌아왔어요.');}else{game.save.dust=add(game.save.dust,reward);playSound('upgrade');toast(`별가루 ${num(reward)}개를 받았어요!`);}
    game.revision++;virtualAd=null;paused=false;$("modal").hidden=true;$("modal").dataset.kind='';renderPanel();void save();
    platform.track('virtual_ad_reward',{purpose:virtualAdPurpose,amount:virtualAdPurpose==='currency'?reward:0});return;
  }
  if(virtualAd)return;
  if(b.dataset.sellEgg||b.dataset.sellPet){
    const kind=b.dataset.sellEgg?'egg':'pet',id=b.dataset.sellEgg??b.dataset.sellPet!;
    const egg=kind==='egg'?game.save.eggs.find(e=>e.id===id):null;
    if(kind==='egg'&&!egg)return;
    pendingSale={kind,id};paused=true;input.reset();$("modal").hidden=false;
    $("modal").innerHTML=`<section class="death-card"><h1>판매할까요?</h1><p>${egg?eggName(egg):MONGLES[Number(id)].name} ${kind==='pet'?'1마리':'1개'}</p><strong>별가루 +${egg?game.eggSellPrice(egg.type):game.petSellPrice(Number(id))}</strong><p>판매하면 보유 목록에서 빠져요.<br>도감 발견 기록은 유지돼요.</p><button id="confirm-sale" class="primary">판매하기</button><button id="cancel-sale" class="secondary">취소</button></section>`;return;
  }
  if(b.id==='cancel-sale'){pendingSale=null;paused=false;$("modal").hidden=true;return;}
  if(b.id==='confirm-sale'&&pendingSale){
    const price=pendingSale.kind==='egg'?game.sellEgg(pendingSale.id):game.sellPet(Number(pendingSale.id));
    pendingSale=null;paused=false;$("modal").hidden=true;renderPanel();void save();toast(price?`판매 완료 · 별가루 +${num(price)}`:'이미 판매되었거나 보유 중이 아니에요.');return;
  }
  if(b.id==='respawn-base'){game.revive(false);paused=false;$("modal").hidden=true;$("modal").dataset.kind='';void save();return;}
  if(game.death)return;
  if(b.id==="multiplayer-connect"){
    try{if(multiplayer.connected)await multiplayer.logout();else await multiplayer.login();showSettings();}catch{toast("서버에 연결하지 못했어요. 로컬 서버 실행 상태를 확인해 주세요.");}
  }
  if (b.dataset.tab) setTab(b.dataset.tab);
  if (b.dataset.region) { $("panel").dataset.region=b.dataset.region;renderPanel(); }
  if (b.dataset.collectionStage) { $("panel").dataset.collectionStage=b.dataset.collectionStage;renderPanel(); }
  if (b.dataset.claimStage) { const reward=game.claimStage(Number(b.dataset.claimStage));if(reward){feedback();toast(`+${num(reward)}`);renderPanel();void save();} }
  if (b.id==='claim-stage-all') { const reward=game.claimStageCollection();if(reward){feedback();toast(`+${num(reward)}`);renderPanel();void save();} }
  if (b.dataset.claimPet) { const reward=game.claimPet(Number(b.dataset.claimPet));if(reward){feedback();toast(`+${num(reward)}`);renderPanel();void save();} }
  if (b.dataset.claimRegion) { const reward=game.claimRegion(Number(b.dataset.claimRegion));if(reward){feedback();toast(`+${num(reward)}`);renderPanel();void save();} }
  if (b.id==="claim-all") { const reward=game.claimCollection();if(reward){feedback();toast(`+${num(reward)}`);renderPanel();void save();} }
  if (b.dataset.trail) { if (game.buyTrail(Number(b.dataset.trail))) { feedback(); renderPanel(); void save(); } }
  if (b.id === "reward-ok") { game.returnReward=null; $("return-reward").hidden=true; }
  if (b.id === "tutorial-skip") { game.save.tutorial=5; game.revision++; void save(); }
  if (b.dataset.upgrade) {
    if (game.upgrade(b.dataset.upgrade as Upgrade)) {
      feedback();
      renderPanel();
      platform.track("upgrade", { type: b.dataset.upgrade });
    }
  }
  if (b.dataset.egg) {
    game.save.selected = b.dataset.egg;
    game.revision++;
    renderEggQueue();
  }
  if (b.dataset.companion || b.dataset.unequip) {
    const i = Number(b.dataset.companion??b.dataset.unequip);
    if (!game.save.mongles[i]) return;
    if (b.dataset.companion!==undefined && game.save.active.length >= BALANCE.maxCompanions) {
      toast("최대 3마리까지 동행해요. 먼저 한 마리를 해제해 주세요.");
      return;
    }
    if(b.dataset.unequip!==undefined)game.unequipPet(i);else game.equipPet(i);
    renderPanel();
  }
  if (b.id === "result-ok") {
    game.result = lastResult = null;
    $("modal").hidden = true;
    setTab("hatchery");
  }
  if (b.id === "resume") {
    game.save.appearance=Number(($("appearance-setting") as HTMLSelectElement).value);
    if(online.active)await remote("appearance",game.save.appearance);
    try {
      await platform.syncTime();
      if (hiddenAt && !online.active) {
        game.offline((platform.now() - hiddenAt) / 1000);
        hiddenAt = 0;
      }
    } catch (err) {
      toast((err as Error).message);
      }
    game.save.settings = {
      sound: !($("sound-setting") as HTMLInputElement).checked,
      volume: Number(($("volume-setting") as HTMLInputElement).value)/100,
      haptic: ($("haptic-setting") as HTMLInputElement).checked,
      hideOwnPets: ($('hide-own-pets') as HTMLInputElement).checked,
      hideOtherPets: ($('hide-other-pets') as HTMLInputElement).checked,
      quality: ($("quality-setting") as HTMLSelectElement).value as
        "high" | "low",
    };
    world.quality(game.save.settings.quality === "low");
    applyAudioSettings();
    if(!game.save.settings.sound)void audio.suspend();else audio.unlock();
    paused = false;
    $("modal").hidden = true;
    void save();
  }
  if (b.id === "leaderboard") {
    try {
      await save();
      await platform.leaderboard(game.save.best);
    } catch (err) {
      toast((err as Error).message);
    }
  }
});
// A second finger acts immediately without releasing the joystick's pointer.
$("action").addEventListener("pointerdown", e=>{if(e.button!==0)return;e.preventDefault();void action();});
$("action").addEventListener("click", e=>{if(e.detail===0)void action();});
$("settings").addEventListener("click", showSettings);
document.addEventListener('input',e=>{
  const control=e.target as HTMLInputElement;
  if(!ready||!['sound-setting','volume-setting'].includes(control.id))return;
  game.save.settings.sound=!($('sound-setting') as HTMLInputElement).checked;
  game.save.settings.volume=Number(($('volume-setting') as HTMLInputElement).value)/100;
  $('volume-value').textContent=`${Math.round(game.save.settings.volume*100)}%`;
  applyAudioSettings();
  if(game.save.settings.sound)audio.unlock();
});
document.addEventListener('change',e=>{
  const sortControl=e.target as HTMLSelectElement;
  if(ready&&sortControl.id==='pet-sort'){$('panel').dataset.petSort=sortControl.value;renderPanel();return;}
  const petSetting=e.target as HTMLInputElement;
  if(ready&&(petSetting.id==='hide-own-pets'||petSetting.id==='hide-other-pets')){
    game.save.settings[petSetting.id==='hide-own-pets'?'hideOwnPets':'hideOtherPets']=petSetting.checked;void save();
  }
  if(ready&&['sound-setting','volume-setting'].includes((e.target as HTMLElement).id)){
    if(game.save.settings.sound)audio.play('ui');
    void save();
  }
});
document.addEventListener("visibilitychange", async () => {
  if (!ready) return;
  if (document.hidden) {
    pickupPreparation=null;
    hiddenAt = platform.now();
    input.reset();
    void save();
    void audio?.suspend();
  } else {
    syncing = true;
    try {
      await platform.syncTime();
      if (hiddenAt && !online.active) {
        game.offline((platform.now() - hiddenAt) / 1000);
        hiddenAt = 0;
      }
      lastNow = performance.now();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      syncing = false;
    }
  }
});
window.addEventListener("pagehide", () => {
  if (ready) void save();
});
async function start() {
  try {
    await platform.login();
    const localState = await platform.load();
    if(!qa)await online.enter($("loading"));
    const state = online.latest?.runtime.save??localState;
    game = new GameState(online.active?freshSave(platform.now()):state, () => platform.now(), qa?.random);
    if(online.active){
      online.attach(game);
      try{const preferences=JSON.parse(localStorage.getItem("alkong:preferences")??"null");if(preferences&&typeof preferences.sound==="boolean")game.save.settings={...game.save.settings,...preferences};}catch{/* Ignore invalid device preferences. */}
    }
    applyAudioSettings();
    multiplayer.onHit=()=>{}; // Cooperative movement only; no PvP damage in expedition mode.
    if(!online.active)game.offline((platform.now() - state.lastSavedAt) / 1000);
    world = new World($("world"));
    await world.init();
    game.mapCollision.setFarm(world.mapColliders);if(!online.active)game.push(0,0);
    world.quality(state.settings.quality === "low");
    input = new Input($("joystick"), $("knob"), action, showSettings);
    ready = true;
    qa?.attach(game, world, input, setTab, save);
    if (platform.warning) toast(platform.warning);
    renderEggQueue();
    updateHud();
    $("loading").hidden = true;
    if(compare(game.offlineReward,0)>0)toast(`오프라인 생산 +${num(game.offlineReward)} · 강화에서 지금 살 수 있는 목표를 확인하세요`);
    platform.track("game_start");
    lastNow = performance.now();
    requestAnimationFrame(frame);
  } catch (err) {
    $("loading").innerHTML =
      '<h1>모험을 준비하지 못했어요</h1><p id="startup-error"></p><button class="primary" onclick="location.reload()">다시 시도</button>';
    $("startup-error").textContent = (err as Error).message;
  }
}
function frame(now: number) {
  requestAnimationFrame(frame);
  if (document.hidden || syncing) return;
  const dt = Math.min(0.05, (now - lastNow) / 1000);
  lastNow = now;
  if(virtualAd){$("ad-count").textContent=virtualAd.remaining?`${virtualAd.remaining}초`:'시청 완료';$("virtual-ad-close").hidden=virtualAd.remaining>0;}
  if (!qa && !paused && !roomChat.active && !game.death && !game.returnReward && $("modal").hidden && tab === "explore") {
    const v = input.vector();
    if(online.active)online.update(v.x*.832+v.y*.555,-v.x*.555+v.y*.832,input.slow);
    game.move(v.x * 0.832 + v.y * 0.555, -v.x * 0.555 + v.y * 0.832, dt,input.slow);
    world.player.userData.moving = Math.hypot(v.x, v.y) > 0.1;
    if (world.player.userData.moving)
      world.player.rotation.y = Math.atan2(
        v.x * 0.832 + v.y * 0.555,
        -v.x * 0.555 + v.y * 0.832,
      );
  } else {world.player.userData.moving = false;if(online.active)online.update(0,0);}
  if(online.active)online.reconcile(dt);
  if (!qa && !online.active) game.tick(paused ? 0 : dt);
  if(pickupPreparation){
    const p=pickupPreparation;
    const target=game.world.find(e=>e.id===p.id);
    if(paused||tab!=='explore'||game.death||game.carried||game.returnReward||!target||!game.canReachEgg(target)||game.hitAt!==p.hitAt||(online.active?Math.hypot(input.vector().x,input.vector().y)>.1:Math.hypot(game.x-p.x,game.z-p.z)>.05)){pickupPreparation=null;}
    else if(!qa&&p.ready!==false){p.remaining=Math.max(0,p.remaining-dt);if(p.remaining===0){pickupPreparation=null;void action(p.id);}}
  }
  if(!paused&&tab==='explore'&&!game.isAtBase&&!game.carried&&!game.death&&!game.returnReward&&game.near&&!game.save.bossWarningSeen)warnAboutBoss();
  if(!paused&&!game.death&&!game.isAtBase&&game.hp/game.maxHp<=PROGRESSION.lowHP&&now-lastHeartbeat>1000){lastHeartbeat=now;feedback('heartbeat');}
  const audible=new Set<number>();
  for(const hazard of game.hazards.attacks){
    if(hazard.phase!=='Active'||Math.abs(hazard.target.z-game.z)>18)continue;
    audible.add(hazard.serial);
    if(heardHazards.has(hazard.serial)||paused)continue;
    const v=hazard.definition.visual;
    playSound(['ink','coral','puddle','ice','icicle'].includes(v)?'water':['steam','flame','meteor'].includes(v)?'fire':['train','gear','laser','drone','magnet','crusher'].includes(v)?'machine':'magic',hazard.definition.stageId);
  }
  heardHazards=audible;
  for (const event of game.events.splice(0)) {
    const cues:Partial<Record<string,GameSound>>={hatch_manual_hit:'tap',egg_pickup:'pickup',egg_drop:'drop',egg_saved:'return',mongle_obtained:'hatch',player_hit:'hit',player_death:'death',player_revive:'revive',night_refresh:'night',region_enter:'stage',level_up:'upgrade',upgrade_purchase:'upgrade',trail_purchase:'upgrade',collection_reward:'upgrade',boss_wake:'boss',egg_recovered:'drop'};
    const cue=cues[event.name];if(cue&&cue!=='hatch')playSound(cue,Number(event.params.stage??game.stage.id));
    if(event.name==='hatch_manual_hit'&&tab==='hatchery'&&event.params.egg===game.selected?.id){
      while(hatchTouches.length&&(hatchTouches[0].egg!==event.params.egg||performance.now()-hatchTouches[0].at>3000))hatchTouches.shift();
      world.showHatchHit(Number(event.params.damage),hatchTouches.shift());feedback(null);
    }
    if(event.name==='boss_wake'){bossAlertUntil=now+3000;if(!paused&&!game.death&&tab==='explore')feedback(null);}
    if(event.name==='weekly_reward'){toast(game.message);renderPanel();}
    if(event.name==='expedition_start'){$("toast").hidden=true;clearTimeout(toastTimer);}
    if(['level_up','player_hit','health_unlocked','player_death'].includes(event.name)){feedback(null);void save();}
    if(event.name.startsWith('expedition_fail_')){playSound('return');toast(game.message);void save();}
    if(event.name==='training_gain'){world.showTrainingGain(Number(event.params.amount),game.now());continue;}
    const nextStep=advanceTutorial(game.save.tutorial??0,event.name);
    if((game.save.tutorial??0)<nextStep){
      game.save.tutorial=nextStep;platform.track("tutorial_step_complete",{step:nextStep});
    }
    platform.track(event.name, event.params);
    if(event.name === "expedition_success" && platform.native)
      void save().then(() => platform.submitScore(game.save.best)).catch(err => toast(String(err)));
  }
  if (world.assetError) { toast(world.assetError); world.assetError = ""; }
  updateHud();
  const chaser=tab==='explore'&&!game.isAtBase&&!game.death&&game.carried?game.bosses.find(b=>b.mode==='chase'&&b.target===game.carried?.id):undefined;
  const pursued=!!chaser;
  const waking=tab==='explore'&&!game.isAtBase&&!game.death?game.bosses.find(b=>b.mode==='waking'&&b.target===game.carried?.id):undefined;
  if(pursued&&!wasPursued)bossAlertUntil=now+3000;
  wasPursued=pursued;
  const presenting=!paused&&!game.death&&!game.returnReward&&$("modal").hidden&&!virtualAd;
  const gap=chaser?Math.max(0,Math.hypot(chaser.x-game.x,chaser.z-game.z)-ROUTE.bossReach*ROUTE.bossAngryScale*(chaser.final?FINAL_GUARDIAN.scale:1)):Infinity;
  const pressure=chaser?Math.max(0,1-gap/18):0;
  const bursting=pursued&&now>bossAlertUntil-3000&&now<bossAlertUntil-2100;
  const pressureEl=$("boss-pressure"),alertEl=$("boss-alert");
  pressureEl.hidden=!(presenting&&(pursued||!!waking));
  pressureEl.style.setProperty('--pursuit-strength',String(.45+pressure*.55));
  world.chasePressure=presenting&&pursued?pressure:0;
  pressureEl.style.setProperty('--pursuit-beat',`${1.3-pressure*.5}s`);
  pressureEl.classList.toggle('awakening',bursting);
  alertEl.dataset.phase='waking';
  const bossAlert=waking?'보스가 잠에서 깼어요!':'';
  if($("boss-alert-title").textContent!==bossAlert)$("boss-alert-title").textContent=bossAlert;
  const detail='';
  if($("boss-alert-detail").textContent!==detail)$("boss-alert-detail").textContent=detail;
  alertEl.hidden=!(presenting&&!!waking);
  if(presenting&&chaser&&gap<12&&now-lastBossStep>850-pressure*250){playSound('boss-step',chaser.stageId);lastBossStep=now;}
  audio.music(game.save.settings.sound&&presenting?(pursued?'chase':'calm'):'silent',pressure);
  void multiplayer.update(game.x,game.z,world.player.rotation.y,game.save.appearance??0,game.carried?.type??null);
  if(multiplayer.connected){
    game.world=game.world.filter(e=>!e.id.startsWith('net-')||multiplayer.drops.some(d=>d.id===e.id));
    for(const egg of multiplayer.drops)if(egg.id!==game.carried?.id&&!game.world.some(e=>e.id===egg.id))game.world.push({...egg,hp:eggMaxHp(egg),hpVersion:4,distance:Math.abs(egg.z),expires:game.nightAt});
  }
  world.updatePeers(online.active?online.peers:multiplayer.peers,tab==="explore"&&!game.returnReward&&game.result===null,game.now());
  world.networkOffset=online.active?online.visualOffset:{x:0,z:0};
  world.render(game, tab, qa ? 1 : dt, qa ? qa.visualTime : now / 1000);
  roomChat.show(online.active&&tab==='explore'&&!paused&&!game.death&&!game.returnReward&&$('modal').hidden);
  roomChat.update(online.active,game.save.playerName??'탐험가',online.latest?.chat,online.peers);
  roomHUD.update(game,online.active?online.peers:multiplayer.peers,world,online.latest?.isGuest??false,tab==='explore'&&!game.returnReward,online.latest?.chat);
  if (now - savedAt > 5000) {
    savedAt = now;
    void save();
  }
}
void start();
