import "./style.css";
import {
  BALANCE,
  PROGRESSION,
  EGGS,
  MONGLES,
  crackStage,
  type Upgrade,
} from "./data";
import { ROUTE } from "./stage-data";
import {eggName,eggIcon} from "./stage-eggs";
import { GameState } from "./game";
import { Platform } from "./platform";
import { Input } from "./input";
import { World } from "./world";
import { panelHTML } from "./panels";
import { Multiplayer } from "./multiplayer";
import { VirtualAd } from "./virtual-ad";
import { formatNumber as num } from "./format";
import type {TraitId} from "./progression";

const app = document.querySelector<HTMLDivElement>("#app")!;
const icons = { explore: "barn", hatchery: "egg-0", pets: "pet-0", upgrade: "hammer", shop: "shop" };
app.innerHTML = `<main id="shell"><div id="world"></div><div class="vignette"></div><header><div class="brand"><img class="brand-mark" src="${import.meta.env.BASE_URL}models/alkong.png" alt="" /><div><small>작은 발견, 커다란 모험</small><strong>알콩 원정대</strong></div></div><button id="settings" class="icon-btn" aria-label="설정">⚙</button></header><div class="status"><span id="level">LV. 01 <b>새싹 탐험가</b></span><span class="dust">✦ <b id="dust">0</b><small>별가루</small></span></div><section id="expedition"><div class="timer-top"><span id="timer-label">오늘은 어떤 알을 만날까요?</span><strong id="timer">00:45</strong></div><div class="track"><i id="timer-fill"></i></div><div class="region"><span class="tag">EXPEDITION 01</span><h1 id="region">햇살 가득 풀숲</h1><p id="region-sub">작은 발견이 시작되는 곳</p></div></section><section id="hatch-info" hidden><span class="tag">A LITTLE MIRACLE</span><h1>몽글몽글 부화실</h1><p>작은 알 속에 누가 숨어 있을까요?</p><div id="egg-health"></div></section><div id="world-label">BASE CAMP <span>우리의 작은 기지</span></div><div id="hint" role="status">모험을 준비하고 있어요…</div><div id="carry-chip" hidden></div><div id="controls"><div class="joystick-wrap"><div id="joystick" role="group" aria-label="이동 조이스틱"><span class="axis-y">⌃</span><div id="knob"></div></div><small>살짝 밀어서 이동</small></div><button id="action"><span id="action-icon">⌕</span><strong id="action-label">탐색</strong></button></div><div id="risk">● <span>기지 · 안전한 곳</span></div><nav>${Object.entries(
  icons,
)
  .map(
    ([k, v], i) =>
      `<button data-tab="${k}" class="${i === 0 ? "active" : ""}"><img src="${import.meta.env.BASE_URL}models/${v}.png" alt="" />${["농장", "부화실", "펫", "강화", "상점"][i]}</button>`,
  )
  .join(
    "",
  )}</nav><section id="panel" hidden></section><div id="modal" hidden></div><div id="toast" role="status" hidden></div><div id="loading"><img class="loading-egg" src="${import.meta.env.BASE_URL}models/egg-0.png" alt="" /><h1>알콩 원정대</h1><p>작은 모험을 준비하는 중…</p></div></main>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
// Keep HUD rows in normal flow inside two anchored stacks.
const topHud = document.createElement("div");
topHud.id = "top-hud";
$("shell").append(topHud);
for (const el of [
  document.querySelector("header")!,
  document.querySelector(".status")!,
  $("expedition"),
  $("hatch-info"),
])
  topHud.append(el);
topHud.append($("carry-chip"));
const announcement = document.createElement("div");
announcement.id = "announcement";
announcement.hidden = true;
announcement.setAttribute("role", "status");
topHud.append(announcement);
const speedHud = document.createElement("div");
speedHud.id = "speed-hud";
speedHud.innerHTML = '<span id="speed-value"></span><span id="day-clock"></span><span id="cycle-clock"></span>';
topHud.append(speedHud);
topHud.insertAdjacentHTML('beforeend','<small id="xp-value"></small><div id="farm-progress"><button data-tab="traits" id="trait-select"></button></div><div id="hazard-cue" role="status" hidden></div>');
$("world").insertAdjacentHTML('beforeend','<div id="health-hud" role="progressbar" aria-label="플레이어 체력" aria-valuemin="0" hidden><span aria-hidden="true">♥</span><div class="health-track"><i id="hp-fill"></i></div></div>');
$("shell").insertAdjacentHTML('beforeend','<div id="region-banner" role="status" aria-live="polite" hidden><small id="region-banner-number"></small><strong id="region-banner-name"></strong><span id="region-banner-speed"></span></div><div id="health-edge"></div><div id="ink-effect" hidden></div><div id="level-burst" hidden></div>');
topHud.insertBefore($("region-banner"),$("hazard-cue"));
$("world").insertAdjacentHTML('beforeend','<div id="night-sky" aria-hidden="true"><span>☾</span></div>');
const tutorial = document.createElement("div");
tutorial.id = "tutorial";
tutorial.innerHTML = '<div><b id="tutorial-title"></b><p id="tutorial-copy"></p></div><button id="tutorial-skip" aria-label="튜토리얼 건너뛰기">건너뛰기</button>';
topHud.append(tutorial);
$("shell").insertAdjacentHTML("beforeend", '<div id="night-curtain" hidden><div class="night-card"><span>☾</span><h2>농장이 잠드는 시간</h2><strong id="night-count">10</strong><p>밤에는 탐험할 수 없어요.<br>날이 밝으면 다시 출발해요.</p><small>3분마다 10초 · 운반 알은 떨어지고 농장으로 귀환</small></div></div><div id="return-reward" hidden><div><span class="tag">SAFE & SOUND</span><h1>알을 얻었어요!</h1><p id="reward-name"></p></div><button id="reward-ok" class="primary">농장에 보관했어요 · 확인</button></div>');
const bottomHud = document.createElement("div");
bottomHud.id = "bottom-hud";
$("shell").append(bottomHud);
const inventory = document.createElement("section");
inventory.id = "inventory";
inventory.innerHTML =
  '<div class="inventory-heading"><strong id="inventory-count">보관함 0 / 6</strong><span>알을 선택해 부화 준비</span></div><div id="egg-queue"></div><div id="pet-effects"></div>';
for (const el of [$("hint"), inventory, $("controls"), $("risk")])
  bottomHud.append(el);
let bannerStage=0,bannerUntil=0;
let lastAnnouncement = 0,
  announcementTimer = 0;
const platform = new Platform();
const multiplayer=new Multiplayer(time=>{if(!qa)platform.offset=time-Date.now();},toast);
document.querySelector("header")!.insertBefore(document.querySelector(".dust")!, $("settings"));
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
let audio: AudioContext | undefined;
let lastHeartbeat=0;
let virtualAd:VirtualAd|null=null;
let virtualAdPurpose:'currency'|'revive'='currency';
let pendingSale:{kind:'egg'|'pet';id:string}|null=null;
function feedback() {
  if (game.save.settings.haptic) platform.haptic();
  if (!game.save.settings.sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(650, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      340,
      audio.currentTime + 0.07,
    );
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.1);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  } catch {
    /* Audio is optional. */
  }
}
function toast(text: string) {
  $("toast").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ($("toast").hidden = true), 3500);
}
async function save() {
  try {
    await platform.save(game.snapshot());
  } catch {
    toast("저장하지 못했어요. 저장 공간과 연결을 확인해 주세요.");
  }
}
let claiming=false;
async function action() {
  if (!ready || paused || !$("modal").hidden || game.returnReward || game.death) return;
  if(claiming||game.now()<game.knockedUntil)return;
  if (tab === "hatchery") {
    if (game.tap()) {
      world.hitAt = performance.now();
      $("action").dataset.hit = String(game.lastTap);
      feedback();
    }
  } else if (tab === "explore") {
    if(!game.carried&&!game.near&&game.nearStore){setTab('store');return;}
    if(!game.carried&&game.near?.id.startsWith('net-')){
      claiming=true;
      try{const egg=await multiplayer.claim(game.near.id);game.pickup({...egg,hp:EGGS[egg.type].hp,distance:Math.abs(egg.z),expires:game.nightAt});}
      catch(err){toast(String(err));}finally{claiming=false;}return;
    }
    if(!game.carried&&!game.near&&!game.nearGym)return;
    game.interact();
    feedback();
    platform.track("egg_interact", { carrying: game.carried ? 1 : 0 });
  }
}
function setTab(next: string) {
  if (!ready || game.death) return;
  if (
    next !== "explore" &&
    !game.isAtBase
  ) {
    toast("기지로 돌아오면 이용할 수 있어요.");
    return;
  }
  input.reset();
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
  $("panel").innerHTML = panelHTML(tab, game);
  if(tab==='shop')$("panel").insertAdjacentHTML('afterbegin','<button data-tab="store" class="secondary">알 · 펫 판매 스토어</button>');
}
function updateHud() {
  const outside=tab==='explore'&&!game.isAtBase;
  if(!outside){bannerStage=0;bannerUntil=0;}
  else if(bannerStage!==game.stage.id){
    bannerStage=game.stage.id;bannerUntil=performance.now()+ROUTE.bannerSeconds*1000;
    $("region-banner-number").textContent=`STAGE ${String(game.stage.id).padStart(2,'0')} / 20 · 지역 진입`;
    $("region-banner-name").textContent=game.stage.name;
    $("region-banner-speed").textContent=`권장 스피드 ${num(game.recommendedSpeed,1)} · 운반 전 기준`;
    $("region-banner").style.setProperty('--region-accent',`#${game.stage.accent.toString(16).padStart(6,'0')}`);
  }
  $("region-banner").hidden=!outside||performance.now()>=bannerUntil;
  const hpRatio=game.hp/game.maxHp;
  $("health-hud").setAttribute('aria-valuenow',String(Math.ceil(game.hp)));
  $("health-hud").setAttribute('aria-valuemax',String(game.maxHp));
  $("health-hud").setAttribute('aria-valuetext',`${Math.ceil(game.hp)} / ${game.maxHp}${hpRatio<=PROGRESSION.lowHP?' · 위험':''}`);
  $("hp-fill").style.width=`${hpRatio*100}%`;
  $("health-hud").dataset.state=hpRatio<=PROGRESSION.lowHP?'danger':hpRatio<=PROGRESSION.warningHP?'warning':'safe';
  $("xp-value").textContent=`LV.${game.level} · ${num(game.progression.xp)} / ${num(game.progression.requiredXP)} XP · 귀환 +${num(game.progression.pendingXP)}`;
  $("xp-value").hidden=!outside;
  $("farm-progress").hidden=!game.isAtBase||tab!=='explore';
  $("trait-select").textContent=`LV.${game.level} · 특성 ${game.traitPoints}`;
  $("shell").classList.toggle('low-health',outside&&hpRatio<=PROGRESSION.lowHP);
  $("shell").classList.toggle('recent-hit',outside&&game.now()-game.hitAt<350);
  $("ink-effect").hidden=game.effects.ink<=0;
  const threats=game.hazards.attacks.filter(h=>h.phase==='Telegraph'&&h.elapsed>=0);
  $("hazard-cue").hidden=!outside||!threats.length;
  $("hazard-cue").textContent=threats.slice(0,2).map(h=>`${h.origin.x<game.x?'←':'→'} ${h.definition.displayName} · ${Math.max(0,h.warning-h.elapsed).toFixed(1)}초`).join(' / ');
  $("level-burst").hidden=game.now()-game.levelUpAt>1800;
  $("level-burst").textContent=`✦ LEVEL UP · ${game.level} ✦`;
  if(game.death&&!virtualAd&&game.now()-game.death.at>=BALANCE.deathChoiceDelay&&$("modal").dataset.kind!=='death'){
    input.reset();paused=true;$("modal").hidden=false;$("modal").dataset.kind='death';
    $("modal").innerHTML='<section class="death-card"><span class="tag">A LITTLE REST</span><h1>잠시 쓰러졌어요</h1><p>떨어뜨린 알은 현장에 남아 있어요.</p><button id="revive-ad" class="primary">가상 광고 보고 제자리 부활</button><small>10초 · HP 전부 회복 · 잠깐 무적<br>밤에는 농장에서 부활해요</small><button id="respawn-base" class="secondary">광고 없이 농장으로 돌아가기</button></section>';
  }
  $("night-curtain").hidden = true;
  $("night-count").textContent = String(Math.max(0, Math.ceil((game.nightUntil-game.now())/1000)));
  $("speed-value").textContent = `스피드 ${num(game.speed,2)}${game.carried?" · 운반 중":""}`;
  if(!game.isAtBase)$("speed-value").textContent=`스피드 ${num(game.speed,2)}`;
  $("day-clock").textContent = `권장 스피드 ${num(game.recommendedSpeed,1)}`;
  $("cycle-clock").textContent=game.isNight?`☾ 밤 · 아침까지 ${Math.max(0,Math.ceil((game.nightUntil-game.now())/1000))}초`:`☀ 낮 · 밤까지 ${Math.floor(game.nightRemaining/60)}:${String(game.nightRemaining%60).padStart(2,'0')}`;
  $("night-sky").classList.toggle('visible',game.isNight&&tab==='explore');
  $("speed-hud").classList.toggle("training", game.training);
  if(game.training) $("speed-value").textContent += ` · +${num(game.effectiveTrainingRate,3)}/초`;
  const step=game.save.tutorial??0;
  $("tutorial").hidden=step>=5 || !!game.returnReward || game.result!==null;
  $("tutorial-title").textContent = `${step+1}/5 · ${["첫 모험을 떠나요","작은 알을 찾아요","농장으로 돌아와요","알을 두드려 보세요","더 빠르게 자라나요"][step]??""}`;
  $("tutorial-copy").textContent = ["왼쪽 조이스틱을 위로 밀어 농장문을 나가세요.","길 위의 알에 다가가 오른쪽 ‘들고가기’를 누르세요.","알을 들면 느려져요. 아래쪽 농장으로 돌아가세요. 보스 공격에 맞으면 알을 떨어뜨려요!","부화실을 열고 ‘두드리기’를 누르세요. 자동 장비도 도와줘요.","별가루로 강화하거나 트레일을 사세요. 농장 러닝머신에서도 속도가 올라요."][step]??"";
  $("return-reward").hidden = !game.returnReward;
  if(game.returnReward) $("reward-name").textContent = `${EGGS[game.returnReward.type].rarity} · ${eggName(game.returnReward)} · ${Math.round(game.returnReward.distance)}m 탐험`;
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
    exploring ? `STAGE ${String(game.stage.id).padStart(2, "0")}` : "BASE CAMP";
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
  $("dust").textContent = num(Math.floor(game.save.dust));
  $("timer").textContent = num(game.recommendedSpeed,1);
  $("timer-label").textContent = "권장 스피드";
  $("timer-fill").style.width = `${Math.min(100,game.speed/game.recommendedSpeed*100)}%`;
  $("expedition").classList.remove("urgent");
  $("hint").textContent =
    game.pursuing >= 0
      ? "알을 들고 귀환하세요 · 바닥의 공격 신호를 피하세요"
      : game.message;
  $("carry-chip").hidden = (!game.carried && !game.near) || tab !== "explore";
  if (game.carried)
    $("carry-chip").textContent =
      `[${EGGS[game.carried.type].rarity}] ${eggName(game.carried)} · 운반 중`;
  else if (game.near)
    $("carry-chip").textContent =
      `[${EGGS[game.near.type].rarity}] ${eggName(game.near)} · 줍기`;
  $("risk").className = game.risk;
  $("risk").querySelector("span")!.textContent = !game.isAtBase
    ? `기지 ${Math.round(game.distance)}m · ${game.risk==='safe'?'스피드 충분':game.risk==='warning'?'스피드 강화 추천':'먼 지역 · 스피드를 더 키워요'}`
    : "기지 · 시간 제한 없이 탐험해요";
  $("world-label").style.opacity = game.distance < 4 ? "1" : "0";
  $("action").hidden = tab!=='hatchery'&&!game.action;
  $("action-label").textContent = tab === "hatchery" ? "두드리기" : game.action;
  $("action-icon").textContent =
    tab === "hatchery" ? "⚒" : game.carried ? "↓" : game.near ? "↑" : game.nearStore ? "✦" : game.nearGym ? "↗" : "⚒";
  $("action").classList.toggle(
    "available",
    tab === "hatchery" || !!game.near || !!game.carried || game.nearGym || game.nearStore,
  );
  ($("action") as HTMLButtonElement).disabled =
    (tab === "hatchery" && !game.selected);
  if (tab === "hatchery") {
    const e = game.selected;
    $("egg-health").innerHTML = e
      ? `<b>${eggName(e)}</b><span>${["온전한 알", "작은 금", "큰 균열", "곧 만나요!"][crackStage(e.hp, EGGS[e.type].hp)]}</span><div class="track"><i style="width:${(e.hp / EGGS[e.type].hp) * 100}%"></i></div><small>${num(Math.ceil(e.hp))} / ${num(EGGS[e.type].hp)} · 자동 ${num(game.dps,1)}/s</small>`
      : "<b>새로운 만남을 기다려요</b><p>탐험에서 알을 가져와 주세요.</p>";
  }
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
    const m = MONGLES[game.result];
    $("modal").innerHTML =
      `<div class="result-card" style="--reward:${m.color}"><img class="result-pet" src="${import.meta.env.BASE_URL}models/pet-${game.result}.png" alt="${m.name}" /><span class="tag">HELLO, LITTLE FRIEND!</span><div class="sparkles">✦ · ✧ · ✦</div><h1>${m.name}, 반가워!</h1><p>${m.description}</p><div class="benefit">${m.effect}</div><p>도감에 몽글이가 추가되었어요.</p><button id="result-ok" class="primary">함께 모험하기</button></div>`;
    $("modal").hidden = false;
    platform.track("hatch_complete", { mongle: m.id });
    feedback();
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
    `보관함 ${game.save.eggs.length} / ${BALANCE.inventory}`;
  queue.innerHTML = Array.from({ length: BALANCE.inventory }, (_, i) => {
    const e = game.save.eggs[i];
    if (!e)
      return '<div class="egg-slot empty"><span>＋</span><small>빈 칸</small></div>';
    const def = EGGS[e.type];
    return `<button data-egg="${e.id}" aria-label="${def.rarity} ${eggName(e)} 선택" class="egg-slot ${game.save.selected === e.id ? "selected" : ""} ${def.tier >= 4 ? "rare" : ""}" style="--egg:${def.color}"><b>${def.rarity}</b><img class="egg-icon" src="${eggIcon(e)}" alt="" /><small>${eggName(e)}</small></button>`;
  }).join("");
  $("pet-effects").textContent = game.save.active.length
    ? `동행 ${game.save.active.length}/3 · 클릭 ×${game.clickMultiplier.toFixed(2)} · 오토 ×${game.autoMultiplier.toFixed(2)} · 스피드 ×${game.speedMultiplier.toFixed(2)}`
    : "동행 0/3 · 알을 부화하면 펫이 함께 걸어요";
}
function showSettings() {
  if (!ready || game.result !== null || virtualAd || game.death) return;
  paused = true;
  input.reset();
  void save();
  $("modal").hidden = false;
  $("modal").innerHTML =
    `<div class="settings-card"><span class="tag">TAKE A LITTLE BREAK</span><h1>잠깐 쉬어가요</h1><p>진행 상황은 자동으로 저장돼요. 탐험 제한시간은 없어요.</p><label>효과음 <input id="sound-setting" type="checkbox" ${game.save.settings.sound ? "checked" : ""}></label><label>햅틱 <input id="haptic-setting" type="checkbox" ${game.save.settings.haptic ? "checked" : ""}></label><label>그래픽 <select id="quality-setting"><option value="high" ${game.save.settings.quality === "high" ? "selected" : ""}>기본 · 그림자 켜기</option><option value="low" ${game.save.settings.quality === "low" ? "selected" : ""}>가볍게 · 그림자 끄기</option></select></label><button id="leaderboard" class="secondary">최장 원정 순위 · ${num(game.save.best)}m</button><button id="resume" class="primary">모험 계속하기</button></div>`;
  $("resume").insertAdjacentHTML("beforebegin",`<label>탐험가 모자 <select id="appearance-setting"><option value="0">새싹 초록</option><option value="1">노을 주황</option><option value="2">하늘 파랑</option></select></label><p>${platform.native?"토스 게임 로그인 연결됨":"브라우저 · 기기 저장"}</p><button id="multiplayer-connect" class="secondary">${multiplayer.connected?"친구 연결 종료":"게스트 로그인 · 친구와 걷기"}</button><small>같은 서버에서 이동 공유 · 알과 수집은 각자 진행</small>`);
  ($("appearance-setting") as HTMLSelectElement).value=String(game.save.appearance??0);
}
document.addEventListener("click", async (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("button");
  if (!b || !ready) return;
  if((b.id==='virtual-ad'||b.id==='revive-ad')&&!virtualAd){
    virtualAdPurpose=b.id==='revive-ad'?'revive':'currency';
    virtualAd=new VirtualAd();paused=true;input.reset();
    $("modal").hidden=false;
    $("modal").innerHTML=`<section class="virtual-ad-card" role="dialog" aria-modal="true" aria-label="가상 광고"><button id="virtual-ad-close" aria-label="광고 닫고 보상 받기" hidden>닫기 ✕</button><span class="tag">TEST AD</span><h1>이것은 가상 광고입니다.</h1><p>실제 광고가 아닌 보상 흐름 테스트입니다.</p><strong id="ad-count">10</strong><p>잠시 후 오른쪽 위에 닫기 버튼이 나타나요.</p><small>${virtualAdPurpose==='revive'?'완료 보상 · HP 전부 회복하고 부활':`완료 보상 · 별가루 ${BALANCE.virtualAdReward}개`}</small></section>`;
    platform.track('virtual_ad_start');return;
  }
  if(b.id==='virtual-ad-close'&&virtualAd){
    const reward=virtualAd.claim();if(!reward)return;
    if(virtualAdPurpose==='revive'){game.revive(true);toast('다시 일어났어요! HP가 전부 회복됐어요.');}else{game.save.dust+=reward;toast(`별가루 ${num(reward)}개를 받았어요!`);}
    game.revision++;virtualAd=null;paused=false;$("modal").hidden=true;$("modal").dataset.kind='';renderPanel();void save();
    platform.track('virtual_ad_reward',{purpose:virtualAdPurpose,amount:virtualAdPurpose==='currency'?reward:0});return;
  }
  if(virtualAd)return;
  if(b.dataset.trait){if(game.chooseTrait(b.dataset.trait as TraitId)){feedback();renderPanel();void save();}return;}
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
    if (!game.save.active.includes(i) && game.save.active.length >= BALANCE.maxCompanions) {
      toast("최대 3마리까지 동행해요. 먼저 한 마리를 해제해 주세요.");
      return;
    }
    game.save.active = game.save.active.includes(i)
      ? game.save.active.filter((n) => n !== i)
      : [...game.save.active, i].slice(0, BALANCE.maxCompanions);
    game.revision++;
    renderPanel();
  }
  if (b.id === "result-ok") {
    game.result = lastResult = null;
    $("modal").hidden = true;
    setTab("hatchery");
  }
  if (b.id === "resume") {
    game.save.appearance=Number(($("appearance-setting") as HTMLSelectElement).value);
    try {
      await platform.syncTime();
      if (hiddenAt) {
        game.offline((platform.now() - hiddenAt) / 1000);
        hiddenAt = 0;
      }
    } catch (err) {
      toast((err as Error).message);
      }
    game.save.settings = {
      sound: ($("sound-setting") as HTMLInputElement).checked,
      haptic: ($("haptic-setting") as HTMLInputElement).checked,
      quality: ($("quality-setting") as HTMLSelectElement).value as
        "high" | "low",
    };
    world.quality(game.save.settings.quality === "low");
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
$("action").addEventListener("click", action);
$("settings").addEventListener("click", showSettings);
$("world").addEventListener("pointerdown", () => {
  if (tab === "hatchery") action();
});
document.addEventListener("visibilitychange", async () => {
  if (!ready) return;
  if (document.hidden) {
    hiddenAt = platform.now();
    input.reset();
    void save();
    void audio?.suspend();
  } else {
    syncing = true;
    try {
      await platform.syncTime();
      if (hiddenAt) {
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
    const state = await platform.load();
    game = new GameState(state, () => platform.now(), qa?.random);
    multiplayer.onHit=()=>{}; // Cooperative movement only; no PvP damage in expedition mode.
    game.offline((platform.now() - state.lastSavedAt) / 1000);
    world = new World($("world"));
    await world.init();
    world.quality(state.settings.quality === "low");
    input = new Input($("joystick"), $("knob"), action, showSettings);
    ready = true;
    qa?.attach(game, world, input, setTab, save);
    if (platform.warning) toast(platform.warning);
    renderEggQueue();
    $("loading").hidden = true;
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
  if (!qa && !paused && !game.returnReward && $("modal").hidden && tab === "explore") {
    const v = input.vector();
    game.move(v.x * 0.832 + v.y * 0.555, -v.x * 0.555 + v.y * 0.832, dt);
    world.player.userData.moving = Math.hypot(v.x, v.y) > 0.1;
    if (world.player.userData.moving)
      world.player.rotation.y = Math.atan2(
        v.x * 0.832 + v.y * 0.555,
        -v.x * 0.555 + v.y * 0.832,
      );
  } else world.player.userData.moving = false;
  if (!qa) game.tick(paused ? 0 : dt);
  if(!paused&&!game.isAtBase&&game.hp/game.maxHp<=PROGRESSION.lowHP&&now-lastHeartbeat>1000){lastHeartbeat=now;feedback();}
  for (const event of game.events.splice(0)) {
    if(event.name==='expedition_start'){$("toast").hidden=true;clearTimeout(toastTimer);}
    if(['level_up','player_hit','health_unlocked'].includes(event.name)){feedback();void save();}
    if(event.name==='health_unlocked')toast('다음 차원부터 위험한 생명체가 등장해요. 공격 신호를 보고 움직여 피하세요!');
    if(event.name.startsWith('expedition_fail_')){toast(game.message);void save();}
    if(event.name==='training_gain'){world.showTrainingGain(Number(event.params.amount),game.now());continue;}
    const steps:Record<string,number>={expedition_start:1,egg_pickup:2,egg_saved:3,mongle_obtained:4,upgrade_purchase:5,trail_purchase:5};
    if(steps[event.name] && (game.save.tutorial??0)<steps[event.name]){
      game.save.tutorial=steps[event.name];platform.track("tutorial_step_complete",{step:steps[event.name]});
    }
    platform.track(event.name, event.params);
    if(event.name === "expedition_success" && platform.native)
      void save().then(() => platform.submitScore(game.save.best)).catch(err => toast(String(err)));
  }
  if (world.assetError) { toast(world.assetError); world.assetError = ""; }
  updateHud();
  void multiplayer.update(game.x,game.z,world.player.rotation.y,game.save.appearance??0,game.carried?.type??null);
  if(multiplayer.connected){
    game.world=game.world.filter(e=>!e.id.startsWith('net-')||multiplayer.drops.some(d=>d.id===e.id));
    for(const egg of multiplayer.drops)if(egg.id!==game.carried?.id&&!game.world.some(e=>e.id===egg.id))game.world.push({...egg,hp:EGGS[egg.type].hp,distance:Math.abs(egg.z),expires:game.nightAt});
  }
  world.updatePeers(multiplayer.peers,tab==="explore"&&!game.returnReward&&game.result===null,game.now());
  world.render(game, tab, qa ? 1 : dt, qa ? qa.visualTime : now / 1000);
  if (now - savedAt > 5000) {
    savedAt = now;
    void save();
  }
}
void start();
