import {OVERHAUL,upgradeBaseSpeed,progressionSpeedValue,productionUpgradeMultiplier,petIncomeValue,incomeValue,trainingProgressAfter,offlineSeconds,tapDamageValue,autoDamageValue,stageReward,walkingSpeedValue,stableRecoveryRatio,collectionEligible} from './balance';
import {ULTRA_SECRET} from './ultra-secret';
import {PERSONAL_BOSS,EGG_REPLENISH,OFF_PATH_SPEED_MULTIPLIER,PLAYER_CHASE_SPEED_MULTIPLIER,UNDER_RECOMMENDED_EGG_SPEED_MULTIPLIER} from './stage-data';
import {rainStrength,windStrength} from './weather';
import {weightedPetStats,petWeightRatio,ensurePetLots,addPetLot,ensureEggWeight,rollEggWeight,carryMultiplier,type PetLot,type Weighted} from './weight';
import {add,subtract,compare,validMoney,floorMoney,multiply,type Money} from './money';
import {freshPads} from './speed-pads';
import {isStageEggVariant,normalEggSelection,randomNormalEggVariant} from './egg-variants';
import type {Mob} from './mobs';
import {migrateExploration,migrateBossHomes,migrateEggHomes} from './exploration-migration';
import {bossAnchor,specialEggAnchor,eggAnchor,shortcut,terrainAt} from './exploration-route';
import {concealedAt} from './brush';
import {migrateBalance,type BalanceAdjustment} from './balance-migration';
import {weeklyDay,validateWeekly,type WeeklyProgress} from './weekly';
import {firstEggTarget,migrateTutorial,TUTORIAL_STEPS} from './tutorial';
import {WEEKLY_EVENT} from './data';
import {migrateStageSave} from './stage-migration';
import {formatNumber} from './format';
import {growthCost,EGG_HEALTH,eggMaxHp} from './data';
import {
  BALANCE,
  COUPONS,
  STAGE_COLLECTION_REWARDS,
  PROGRESSION,
  PET_DEFENSE,
  TRAILS,
  RARITIES,
  EGGS,
  MONGLES,
  UPGRADES,
  REGIONS,
  rollEgg,
  type Upgrade,
} from "./data";
import {newProgression,validateProgression,awardXP,type Progression} from "./progression";
import {HazardManager,type Hazard} from "./hazards";
import {farmGym,CAMPFIRE,CAMP_SEATS} from './village';
import {DRAGON_RULES,newDragonClue,observeDragon,validateDragonClues,type DragonClue,type DragonWatch} from './dragon-discovery';
import {MapCollision,villageMapColliders} from './map-collision';
import {STAGES,HAZARD_BALANCE,ROUTE,FINAL_GUARDIAN,BOSS_MOVEMENT,NIGHT_BOSS_SPEED_MULTIPLIER,routeStep,routeSegments,routeStage,recommendedRouteSpeed,guardianSpeed,guardianPursuitSpeed,stageDamage,type HazardDefinition} from "./stage-data";
export type Egg = Weighted & { id: string; type: number; hp: number; hpVersion?:2|3|4|5; distance: number; stageId?:number; variant?:number; special?:boolean };
// Version each egg because stored, carried and shared-room eggs have separate lifetimes.
export function migrateEggHealth(eggs:(Egg|null|undefined)[]){
  for(const egg of eggs){
    ensureEggWeight(egg);
    if(!egg||egg.hpVersion===5)continue;
    if((egg.hpVersion!==undefined&&egg.hpVersion!==2&&egg.hpVersion!==3&&egg.hpVersion!==4)||!EGGS[egg.type]||!Number.isFinite(egg.hp)||egg.hp<0)throw Error('Invalid egg health');
    const def=EGGS[egg.type];
    const oldMax=egg.hpVersion===4||egg.hpVersion===3?eggMaxHp(egg):Math.round(EGG_HEALTH.legacyRegionBase[def.region]*(1+def.tier*.6))/(egg.hpVersion===2?1:10);
    if(egg.hp>oldMax+Number.EPSILON*oldMax*8)throw Error('Invalid legacy egg health');
    const max=eggMaxHp({...egg,hpVersion:5});
    egg.hp=max===oldMax?Math.min(max,egg.hp):Math.min(1,egg.hp/oldMax)*max;egg.hpVersion=5;
  }
}
export type WorldEgg = Egg & {
  pickedUp?:boolean;
  nightWeightApplied?:boolean;
  x: number;
  z: number;
  expires: number;
  region?: number;
  homeX?: number;
  homeZ?: number;
  secured?: boolean;
  guardian?: number;
};
export type Boss = {
  final?:boolean;
  stageId?:number;
  homeZ?:number;
  homeX?:number;
  windup?: number;
  attack?:{at:number;angle:number};
  wakeRemaining?: number;
  lookX?:number;
  lookZ?:number;
  x: number;
  z: number;
  mode: "idle" | "waking" | "chase" | "return";
  target: string | null;
  loot: WorldEgg | null;
  replenishAt?:number;
  replenishing?:{egg:WorldEgg;placing:number};
};
export type Save = {
  explorationVersion?:1|2|3|4|5;
  openedShortcuts?:number[];
  balanceVersion?:1|2;
  trainingProgress?:number;legacyTrainingSpeed?:number;highestStage?:number;adRewards?:{day:number;count:number};
  balanceAdjustment?:BalanceAdjustment;
  weekly?:WeeklyProgress;
  redeemedCoupons?:string[];
  stageOrderVersion?:2;
  playerName?:string;
  dragonClues?:Record<string,DragonClue>;
  visitedStages?:number[];
  routeVersion?:1|2|3;
  progression?:Progression;
  death?:{x:number;z:number;at:number;remaining:number}|null;
  version: 1;
  appearance?: number;
  obtainedPets?:number[];
  trails?: number[];
  equippedTrail?: number;
  trainingSpeed?: number;
  petIncome?: { elapsed:number; pending:Money };
  tutorial?: number;
  tutorialVersion?:2;
  bossWarningSeen?:boolean;
  claimedPets?: number[];
  claimedRegions?: number[];
  claimedCollection?: boolean;
  claimedStages?: number[];
  claimedStageCollection?: boolean;
  nightAt?: number;
  nightUntil?: number;
  world?: WorldEgg[];
  bosses?: Boss[];
  dust: Money;
  upgrades: Record<Upgrade, number>;
  eggs: Egg[];
  mongles: number[];
  active: number[];
  petLots?:PetLot[];activeLots?:string[];mountLot?:string|null;
  mountPet?:number|null;
  discovered: number[];
  selected: string | null;
  best: number;
  lastSavedAt: number;
  productionAt?: number;
  productionActiveAt?: number;
  expedition: {
    deadline: number;
    x: number;
    z: number;
    carried: WorldEgg | null;
    hp?:number;
    sinceHit?:number;
    damageTicks?:{remaining:number;ticks:number;until:number}[];
  } | null;
  settings: { sound: boolean; volume?:number; haptic: boolean; quality: "high" | "low"; hideOwnPets?:boolean; hideOtherPets?:boolean };
};
export function freshSave(now: number): Save {
  return {
    balanceVersion:2,trainingProgress:0,highestStage:1,
    routeVersion:3,
    version: 1,
    stageOrderVersion:2,
    trails: [0],
    equippedTrail: 0,
    dust: BALANCE.startingDust,
    upgrades: { speed: 0, carry: 0, tap: 0, damage: 0, rate: 0, time: 0, training: 0,health:0 },
    trainingSpeed: 0,
    tutorial: 0,
    tutorialVersion:2,
    eggs: [],
    mongles: Array(MONGLES.length).fill(0),
    active: [],
    mountPet:null,
    discovered: [],
    selected: null,
    best: 0,
    lastSavedAt: now,
    expedition: null,
    settings: { sound: true, volume:1, haptic: true, quality: "high" },
  };
}
export function parseSave(raw: string | null, now: number): Save {
  if (!raw) return freshSave(now);
  const s = JSON.parse(raw) as Save;
  migrateBalance(s,now);validateWeekly(s.weekly);
  s.redeemedCoupons??=[];
  if(!Array.isArray(s.redeemedCoupons)||!s.redeemedCoupons.every(code=>typeof code==='string'&&/^[A-Z0-9_-]{1,64}$/.test(code))||new Set(s.redeemedCoupons).size!==s.redeemedCoupons.length)throw Error('Invalid coupon history');
  migrateStageSave(s);
  migrateEggHealth([...(Array.isArray(s.eggs)?s.eggs:[]),...(Array.isArray(s.world)?s.world:[]),s.expedition?.carried,...(Array.isArray(s.bosses)?s.bosses.flatMap(b=>b.loot?[b.loot]:[]):[])]);
  s.dragonClues??={};validateDragonClues(s.dragonClues);
  s.obtainedPets??=Array.isArray(s.mongles)?s.mongles.flatMap((n,i)=>n?[i]:[]):[];
  if(!Array.isArray(s.obtainedPets)||!s.obtainedPets.every(i=>Number.isInteger(i)&&!!MONGLES[i])||new Set(s.obtainedPets).size!==s.obtainedPets.length)throw new Error("Invalid discovery record");
  // Older maximum HP values may contain floating-point multiplication noise.
  for(const egg of [...(Array.isArray(s.eggs)?s.eggs:[]),s.expedition?.carried]){
    if(egg&&EGGS[egg.type]&&Number.isFinite(egg.hp)){
      const max=eggMaxHp(egg);
      if(egg.hp>max&&egg.hp-max<=Number.EPSILON*max*8)egg.hp=max;
    }
  }
  if (s.upgrades && s.upgrades.training === undefined) s.upgrades.training = 0;
  if (s.upgrades && s.upgrades.health === undefined) s.upgrades.health = 0;
  s.trainingSpeed ??= 0;
  s.bossWarningSeen??=false;
  if(typeof s.bossWarningSeen!=='boolean')throw new Error('Invalid boss warning state');
  s.petIncome ??= {elapsed:0,pending:0};
  if(!Number.isFinite(s.petIncome.elapsed)||s.petIncome.elapsed<0||s.petIncome.elapsed>=BALANCE.petIncomeSeconds||!validMoney(s.petIncome.pending))throw new Error('Invalid pet income');
  s.visitedStages ??= [];
  if(!Array.isArray(s.visitedStages)||!s.visitedStages.every(id=>Number.isInteger(id)&&id>=1&&id<=20))throw Error('Invalid visited stages');
  if(s.death&&(![s.death.x,s.death.z,s.death.at,s.death.remaining].every(Number.isFinite)||s.death.remaining<0||Math.abs(s.death.x)>BALANCE.baseMapX||s.death.z<BALANCE.mapFarZ||s.death.z>BALANCE.mapNearZ))throw new Error("Invalid death state");
  s.appearance ??= 0;
  if(![0,1,2].includes(s.appearance))throw new Error("Invalid appearance");
  s.tutorial ??= s.mongles?.some(Boolean) ? 5 : 0;
  migrateTutorial(s);
  s.claimedPets ??= []; s.claimedRegions ??= []; s.claimedCollection ??= false;
  s.claimedStages ??= [];s.claimedStageCollection ??= false;
  if(!Array.isArray(s.claimedStages)||!s.claimedStages.every(id=>Number.isInteger(id)&&id>=1&&id<=20)||typeof s.claimedStageCollection!=='boolean')throw Error('Invalid stage collection rewards');
  if (!Array.isArray(s.claimedPets) || !s.claimedPets.every(i=>Number.isInteger(i)&&!!MONGLES[i]) || !Array.isArray(s.claimedRegions) || !s.claimedRegions.every(i=>Number.isInteger(i)&&!!REGIONS[i]) || typeof s.claimedCollection!=="boolean") throw new Error("Invalid collection rewards");
  if (s.version !== 1) throw new Error("지원하지 않는 저장 버전이에요.");
  const finite = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0;
  if (
    !validMoney(s.dust) ||
    !finite(s.trainingSpeed) || !Number.isInteger(s.tutorial) || s.tutorial < 0 || s.tutorial > TUTORIAL_STEPS ||
    !finite(s.lastSavedAt) ||
    !finite(s.best) ||
    !s.upgrades ||
    !Object.keys(UPGRADES).every(
      (k) =>
        Number.isInteger(s.upgrades[k as Upgrade]) &&
        s.upgrades[k as Upgrade] >= 0 && s.upgrades[k as Upgrade] <= BALANCE.maxUpgrade,
    ) ||
    !Array.isArray(s.eggs) ||
    !s.eggs.every(
      (e) =>
        Number.isInteger(e.type) &&
        !!EGGS[e.type] &&
        finite(e.hp) &&
        e.hp <= eggMaxHp(e) &&
        typeof e.id === "string" &&
        finite(e.distance),
    ) ||
    new Set(s.eggs.map(e => e.id)).size !== s.eggs.length ||
    !Array.isArray(s.mongles) ||
    ![3, 100, 300, 320, 321, 701, MONGLES.length].includes(s.mongles.length) ||
    !s.mongles.every((v) => Number.isInteger(v) && v >= 0) ||
    !Array.isArray(s.active) ||
    s.active.length > 3 ||
    !s.active.every((i) => Number.isInteger(i) && !!MONGLES[i] && s.active.filter(id=>id===i).length <= s.mongles[i]) ||
    !Array.isArray(s.discovered) ||
    !s.discovered.every((i) => !!EGGS[i]) ||
    !s.settings ||
    typeof s.settings.sound !== "boolean" ||
    typeof s.settings.haptic !== "boolean" ||
    !["high", "low"].includes(s.settings.quality)
  )
    throw new Error("저장 데이터를 읽을 수 없어요. 원본은 유지됩니다.");
  s.settings.volume=typeof s.settings.volume==='number'&&Number.isFinite(s.settings.volume)?Math.max(0,Math.min(1,s.settings.volume)):1;
  s.settings.hideOwnPets=s.settings.hideOwnPets===true;s.settings.hideOtherPets=s.settings.hideOtherPets===true;
  const mount=s.mountPet;
  if(typeof mount!=='number'||!Number.isInteger(mount)||!MONGLES[mount]||(s.mongles[mount]??0)<=s.active.filter(id=>id===mount).length)s.mountPet=null;
  if (
    s.expedition &&
    (!finite(s.expedition.deadline) ||
      !Number.isFinite(s.expedition.x) ||
      !Number.isFinite(s.expedition.z) ||
      s.expedition.z > BALANCE.mapNearZ ||
      s.expedition.z < BALANCE.mapFarZ ||
      Math.abs(s.expedition.x) > BALANCE.baseMapX)
  )
    throw new Error("원정 저장 데이터가 올바르지 않아요.");
  if (s.expedition?.carried) {
    const e = s.expedition.carried;
    if (
      !EGGS[e.type] ||
      typeof e.id !== "string" ||
      !finite(e.hp) ||
      e.hp > eggMaxHp(e) ||
      !finite(e.distance) ||
      !Number.isFinite(e.x) ||
      !Number.isFinite(e.z) ||
      !finite(e.expires) ||
      s.eggs.some((v) => v.id === e.id)
    )
      throw new Error("운반 중인 알 정보가 올바르지 않아요.");
  }
  s.trails ??= [0]; s.equippedTrail ??= 0;
  if (!Array.isArray(s.trails) || !s.trails.every(i => Number.isInteger(i) && !!TRAILS[i]) || !s.trails.includes(s.equippedTrail)) throw new Error("Invalid trail save");
  if (s.selected !== null && !s.eggs.some((e) => e.id === s.selected))
    s.selected = null;
  s.mongles = Array.from(
    { length: MONGLES.length },
    (_, i) => s.mongles[i] ?? 0,
  );
  for(const e of [...s.eggs,...(s.world??[]),...(s.expedition?.carried?[s.expedition.carried]:[])]){
    if(e.stageId!==undefined&&(!Number.isInteger(e.stageId)||e.stageId<1||e.stageId>20))throw Error('Invalid egg stage');
    if(e.variant!==undefined&&(!isStageEggVariant(e.variant)||((e.variant===5||e.variant===32)&&(!e.stageId||EGGS[e.type].tier!==6))||(e.variant>=7&&!e.stageId)))throw Error('Invalid egg variation');
  }
  if(s.progression)validateProgression(s.progression);
  ensurePetLots(s);
  return s;
}
export class GameState {
  roomSnapshotTime=0;
  hazards=new HazardManager();
  slowRemaining=0;slowMultiplier=1;hitAt=-Infinity;levelUpAt=-Infinity;
  effects={ink:0,stone:0,grab:0,delay:0,magnet:0};
  dustDrops:{x:number;z:number;amount:number}[]=[];
  private inputHistory:{at:number;x:number;z:number}[]=[];
  private motionTime=0;
  velocity={x:0,z:0};
  private iceDrift={x:0,z:0};
  get progression(){return this.save.progression!;}
  private routeStart=0;private routeCache:ReturnType<typeof routeSegments>=[];
  get route(){if(!this.routeCache.length||this.routeStart!==this.progression.stage){this.routeStart=this.progression.stage;this.routeCache=routeSegments(this.routeStart);}return this.routeCache;}
  get stage(){return STAGES[routeStage(this.progression.stage,this.z)-1];}
  get recommendedSpeed(){
    const egg=this.carried??this.near;
    return egg?this.eggRequiredSpeed(egg):recommendedRouteSpeed(0,this.stage.id)*stableRecoveryRatio(this.stage.id);
  }
  get stageOffset(){return (this.stage.id-this.progression.stage)*ROUTE.length;}
  get stageStep(){return routeStep(this.z,this.stageOffset,this.stage.id===20?ROUTE.finalLength:ROUTE.length);}
  get farZ(){return -(this.route.at(-1)!.end-3);}
  knockback={x:0,z:0,remaining:0};
  private announcedStage=0;
  private syncStage(){
    if(this.carried&&!this.inEggStage(this.carried,this.z))this.carried.secured=true;
    if(this.isAtBase){this.announcedStage=0;return;}
    const id=this.stage.id;
    const visited=this.save.visitedStages??=[];
    const first=!visited.includes(id);
    if(first)visited.push(id);
    this.save.highestStage=Math.max(this.save.highestStage??1,id);
    if(this.announcedStage===id)return;
    this.announcedStage=id;this.hazards.reset(id);
    if(!this.isAtBase){this.emit('region_enter',{stage:id,first:first?1:0});if(id>4)this.unlockHealth();}
  }
  get level(){return this.progression.level;}
  get eggCapacity(){return Math.max(1,this.level)*BALANCE.eggsPerLevel;}
  get defenses(){return this.save.active.map(id=>PET_DEFENSE[id]??{});}
  defense(key:'maxHP'|'damageReduction'|'firstHitReduction'|'statusReduction'|'lowHPSpeed'|'returnXPBonus'){return this.defenses.reduce((n,d)=>n+(d[key]??0),0);}
  selectStage(id:number){
    if(!this.isAtBase||this.carried||!STAGES[id-1]||!Number.isInteger(id)||!this.canEnterStage(id))return false;
    this.progression.stage=id;this.hazards.reset(id);this.resetBosses();this.spawn();this.revision++;
    if(id>PROGRESSION.unlockStage)this.unlockHealth();return true;
  }
  unlockHealth(){if(!this.progression.healthUnlocked){this.progression.healthUnlocked=true;this.emit('health_unlocked');this.revision++;}}
  gainXP(amount:number){const gained=awardXP(this.progression,amount);if(gained){if(this.isAtBase)this.hp=this.maxHp;this.levelUpAt=this.now();this.revivedAt=this.now();this.emit('level_up',{level:this.level,count:gained});}this.revision++;return gained;}
  settleXP(success:boolean){const xp=Math.floor(this.progression.pendingXP*(success?1+this.defense('returnXPBonus'):PROGRESSION.failureKeep));this.progression.pendingXP=0;this.gainXP(xp);this.emit('xp_settled',{xp,success:success?1:0});return xp;}
  failExpedition(reason:string){
    if(!this.deadline&&!this.carried&&!this.death&&this.isAtBase)return false;
    this.reviveAdUntil=null;this.speedPad=freshPads();
    this.damageTicks=[];this.hitSource=null;
    if(this.carried)this.flyaway={stageId:this.carried.stageId,variant:this.carried.variant,type:this.carried.type,x:this.x,z:this.z,at:this.now()};
    this.carried=null;this.deadline=0;this.x=this.z=0;this.training=false;this.seat=null;this.launch=null;this.death=null;
    this.revivedAt=this.now();
    const xp=this.settleXP(false);this.hp=this.maxHp;this.slowRemaining=0;this.effects={ink:0,stone:0,grab:0,delay:0,magnet:0};this.knockback.remaining=0;this.hazards.reset();
    if(!this.roomManaged)this.bosses.forEach(b=>{b.mode='return';b.target=null;});
    this.message=`바람을 타고 농장으로 돌아왔어요 · 경험치 ${xp} 유지`;
    this.emit(`expedition_fail_${reason}`,{xp});this.revision++;return true;
  }
  applyHazard(h:Hazard,bossContact=false){
    if(this.concealed)return false;
    const d=h.definition;if(this.death||(this.immunity>0&&!bossContact)||this.isAtBase)return false;
    const damage=bossContact?1:this.immunity>0?0:d.damage>0||d.damagePercent>0?1:0;
    if(d.id?.startsWith('explore-')||d.id?.startsWith('mob-')){
      if(damage<=0)return false;
      this.hp=Math.max(0,this.hp-damage);this.immunity=PROGRESSION.hitImmunity;this.hitAt=this.now();this.sinceHit=0;this.progression.firstHitUsed=true;
      this.hitSource={...h.origin,at:this.now()};this.unlockHealth();
      this.emit('player_hit',{damage,hp:this.hp,stage:this.stage.id,attackId:h.serial,source:d.id});this.revision++;
      if(this.hp<=0)this.die();
      return true;
    }
    this.progression.firstHitUsed=true;this.sinceHit=0;this.immunity=PROGRESSION.hitImmunity;this.hitAt=this.now();
    if(damage>0){
      this.hp=Math.max(0,this.hp-damage);
      this.hitSource={x:h.origin.x,z:h.origin.z,at:this.now()};
    }
    const overlap=Math.hypot(this.x-h.origin.x,this.z-h.origin.z)<.001;
    const dx=overlap?-this.facing.x:this.x-h.origin.x,dz=overlap?-this.facing.z:this.z-h.origin.z,l=Math.hypot(dx,dz)||1;
    const impact=bossContact||damage>0&&d.effect!=='dot';
    if(impact){
      const amount=Math.max(ROUTE.bossKnockback,d.knockback);
      this.knockback={x:dx/l*amount/ROUTE.bossKnockbackSeconds,z:dz/l*amount/ROUTE.bossKnockbackSeconds,remaining:ROUTE.bossKnockbackSeconds};
      // Boss contact drops the egg even when the damage also ends the expedition.
      if((this.hp>0||bossContact)&&this.carried){const egg=this.carried;egg.x=this.x;egg.z=this.z;this.world.push(egg);this.carried=null;this.emit('egg_drop',{type:egg.type,reason:'boss_hit'});this.message='공격에 밀려 알을 놓쳤어요! 떨어진 알을 다시 주울 수 있어요.';}
    }else this.push(dx/l*d.knockback,dz/l*d.knockback);
    this.slowRemaining=d.slowDuration;this.slowMultiplier=d.slowMultiplier;
    this.slowRemaining*=1-Math.min(PROGRESSION.damageReductionCap,this.defense('statusReduction'));
    if(d.effect==='ink')this.effects.ink=HAZARD_BALANCE.inkDuration;
    if(d.effect==='grab')this.effects.grab=HAZARD_BALANCE.grabDuration;
    if(d.effect==='ice')this.push(0,1);
    if(d.effect==='dust'){const amount=compare(this.save.dust,HAZARD_BALANCE.dustDrop)<0?Number(this.save.dust):HAZARD_BALANCE.dustDrop;this.save.dust=subtract(this.save.dust,amount);if(amount)this.dustDrops.push({x:this.x+.8,z:this.z,amount});}
    this.emit('player_hit',{damage,hp:this.hp,stage:this.stage.id});this.revision++;
    if(this.hp<=0)this.die();
    return true;
  }
  damageTicks:{remaining:number;ticks:number;until:number}[]=[];
  hitSource:{x:number;z:number;at:number}|null=null;
  roomManaged=false;
  personalBosses=false;
  localBossSimulation=false;
  bossWakeAt=0;
  onBossContact:((guardian:number,egg:string,dx:number,dz:number)=>void)|null=null;
  dragonWatch:DragonWatch={stage:0,observed:{}};
  // Keep the legacy command callable but never grant eggs from the catalog.
  claimDragon(_stage:number){return false;}
  farmSlot=0;
  get gym(){return farmGym(this.farmSlot);}
  readonly mapCollision=new MapCollision();
  openedShortcuts:number[]=[];
  openingShortcuts:Record<number,number>={};
  get nearShortcut():ReturnType<typeof shortcut>{
    return null;
  }
  openShortcut(){return false;}
  push(x:number,z:number){
    this.mapCollision.opened=this.openedShortcuts;
    const width=this.z+z>=BALANCE.baseMinZ?BALANCE.baseMapX:BALANCE.mapX;
    const targetX=Math.max(-width,Math.min(width,this.x+x)),targetZ=Math.max(this.isNight?BALANCE.baseMinZ:this.farZ,Math.min(BALANCE.mapNearZ,this.z+z));
    // Forward travel respects progression; retreat from a legacy deep-stage save remains possible.
    let allowedZ=targetZ;
    if(targetZ<this.z){
      const next=this.route.find(segment=>segment.stage>this.stage.id&&!this.canEnterStage(segment.stage));
      if(next){
        allowedZ=Math.max(targetZ,-next.start+.01);
        if(allowedZ>targetZ)this.message=`${next.stage}스테이지 진입 속도 ${formatNumber(recommendedRouteSpeed(0,next.stage))} · 현재 ${formatNumber(this.progressionSpeed)}`;
      }
    }
    const position=this.mapCollision.move(this.x,this.z,targetX-this.x,allowedZ-this.z,this.progression.stage);
    this.x=Math.max(-width,Math.min(width,position.x));this.z=Math.max(this.isNight?BALANCE.baseMinZ:this.farZ,Math.min(BALANCE.mapNearZ,position.z));this.syncStage();
  }
  get nearStore(){return Math.hypot(this.x-BALANCE.storeX,this.z-BALANCE.storeZ)<BALANCE.storeRadius;}
  hasDiscoveredPet(id:number){return !!this.save.mongles[id]||!!this.save.obtainedPets?.includes(id);}
  eggSellPrice(egg:number|{type:number;stageId?:number}){const e=typeof egg==='number'?{type:egg}:egg;return EGGS[e.type]?stageReward(e.stageId??EGGS[e.type].region*4+1,OVERHAUL.rewardMinutes.saleEgg,EGGS[e.type].tier):0;}
  petSellPrice(id:number){const pet=MONGLES[id];return pet?stageReward(Math.max(1,pet.stageId),OVERHAUL.rewardMinutes.salePet,pet.tier):0;}
  sellEgg(id:string){
    if(!this.isAtBase||this.death)return 0;
    const egg=this.save.eggs.find(e=>e.id===id);if(!egg)return 0;
    const price=this.eggSellPrice(egg);this.save.eggs=this.save.eggs.filter(e=>e.id!==id);
    if(this.save.selected===id){this.save.selected=this.save.eggs[0]?.id??null;this.autoClock=0;}
    this.save.dust=add(this.save.dust,price);this.revision++;this.emit('egg_sold',{type:egg.type,price});return price;
  }
  sellPet(id:number){
    if(!this.isAtBase||this.death||!Number.isInteger(id)||!this.save.mongles[id])return 0;
    this.save.obtainedPets??=[];if(!this.save.obtainedPets.includes(id))this.save.obtainedPets.push(id);
    const chosen=this.save.petLots?.find(l=>l.species===id&&l.count>0);
    if(chosen)return this.sellPetLot(chosen.key);
    return 0;
  }
  get mountId(){const id=this.save.mountPet;return this.mountPetLot&&typeof id==='number'&&Number.isInteger(id)&&MONGLES[id]&&(this.save.mongles[id]??0)>this.save.active.filter(p=>p===id).length?id:null;}
  get equippedPetIds(){return this.mountId===null?this.save.active:[...this.save.active,this.mountId];}
  equippedCount(id:number){return this.save.active.filter(p=>p===id).length+Number(this.mountId===id);}
  mountBonus(id:number,w:Weighted=this.mountPetLot?.species===id?this.mountPetLot:{} ){return Math.min(OVERHAUL.mountBonusCap,Math.max(0,weightedPetStats(id,w).speedMultiplier-1)*BALANCE.mountSpeedBonusRate);}
  get mountSpeedMultiplier(){return 1+(this.mountId===null?0:this.mountBonus(this.mountId));}
  get riding(){return this.mountId!==null&&!this.death&&!this.training&&this.seat===null&&this.now()>=this.knockedUntil&&this.knockback.remaining<=0&&!this.launch;}
  equipMount(id:number){
    const lot=this.save.petLots?.find(l=>l.species===id&&l.count>0);return lot?this.equipMountLot(lot.key):false;
  }
  unequipMount(){if(!this.isAtBase||this.death||this.save.mountPet==null)return false;this.save.mountPet=null;this.save.mountLot=null;this.revision++;return true;}
  equipPet(id:number){
    if(!Number.isInteger(id)||!MONGLES[id]||this.save.active.length>=BALANCE.maxCompanions||this.equippedCount(id)>=(this.save.mongles[id]??0))return false;
    const lot=this.save.petLots?.find(l=>l.species===id&&this.lotAvailable(l.key)>0);
    return lot?this.equipPetLot(lot.key):false;
  }
  unequipPet(id:number){
    const index=this.save.active.lastIndexOf(id);if(index<0)return false;
    this.save.activeLots?.splice(index,1);
    this.save.active.splice(index,1);this.revision++;return true;
  }
  replacePet(id:number,slot:number,expected:number){
    if(!Number.isInteger(id)||!MONGLES[id]||!Number.isInteger(slot)||slot<0||slot>=this.save.active.length||this.save.active[slot]!==expected||id===expected||this.equippedCount(id)>=(this.save.mongles[id]??0))return false;
    const lot=this.save.petLots?.find(l=>l.species===id&&this.lotAvailable(l.key)>0);return lot?this.equipPetLot(lot.key,slot):false;
  }
  lotAvailable(key:string){const lot=this.save.petLots?.find(l=>l.key===key);return (lot?.count??0)-(this.save.activeLots??[]).filter(k=>k===key).length-Number(this.save.mountLot===key);}
  get activePetLots(){return this.save.active.map((id,i)=>this.save.petLots?.find(l=>l.key===this.save.activeLots?.[i])??{key:'',species:id,weightG:1,standardWeightG:1,count:1});}
  get mountPetLot(){return this.save.petLots?.find(l=>l.key===this.save.mountLot);}
  farmPetLots(){
    const reserved=[...(this.save.activeLots??[]),...(this.riding&&this.save.mountLot?[this.save.mountLot]:[])];
    const lots=(this.save.petLots??[]).map(l=>({...l,count:Math.max(0,l.count-reserved.filter(k=>k===l.key).length)}));
    const total=lots.reduce((n,l)=>n+l.count,0),limit=Math.min(BALANCE.farmPetsVisible,total),start=total>limit?Math.floor(this.now()/12000)*limit%total:0;
    return Array.from({length:limit},(_,i)=>{let n=(start+i)%total;return lots.find(l=>{if(n<l.count)return true;n-=l.count;return false;})!;});
  }
  equipPetLot(key:string,slot?:number){
    const lot=this.save.petLots?.find(l=>l.key===key);if(!this.isAtBase||this.death||!lot||this.lotAvailable(key)<=0)return false;
    if(slot===undefined){if(this.save.active.length>=BALANCE.maxCompanions)return false;this.save.active.push(lot.species);(this.save.activeLots??=[]).push(key);}
    else {if(!Number.isInteger(slot)||slot<0||slot>=this.save.active.length)return false;this.save.active[slot]=lot.species;this.save.activeLots![slot]=key;}
    this.revision++;return true;
  }
  unequipPetSlot(slot:number){if(!this.isAtBase||this.death||!Number.isInteger(slot)||slot<0||slot>=this.save.active.length)return false;this.save.active.splice(slot,1);this.save.activeLots?.splice(slot,1);this.revision++;return true;}
  equipMountLot(key:string){
    const lot=this.save.petLots?.find(l=>l.key===key);if(!this.isAtBase||this.death||!lot||lot.count<=0||this.save.mountLot===key)return false;
    if(this.lotAvailable(key)<=0){const slot=this.save.activeLots?.lastIndexOf(key)??-1;if(slot<0)return false;this.unequipPetSlot(slot);}
    this.save.mountPet=lot.species;this.save.mountLot=key;this.revision++;return true;
  }
  sellPetLot(key:string){
    const lot=this.save.petLots?.find(l=>l.key===key);if(!this.isAtBase||this.death||!lot||lot.count<=0)return 0;
    if(this.lotAvailable(key)<=0){const slot=this.save.activeLots?.lastIndexOf(key)??-1;if(slot>=0)this.unequipPetSlot(slot);else this.unequipMount();}
    lot.count--;this.save.mongles[lot.species]--;this.save.obtainedPets??=[];if(!this.save.obtainedPets.includes(lot.species))this.save.obtainedPets.push(lot.species);
    const price=this.petSellPrice(lot.species);this.save.dust=add(this.save.dust,price);this.revision++;this.emit('pet_sold',{pet:lot.species,price});return price;
  }
  death:NonNullable<Save['death']>|null=null;
  private reviveAdUntil:number|null=null;
  get deathAnimationRemaining(){return this.death?Math.max(0,(this.death.at+BALANCE.deathChoiceDelay-this.now())/1000):0;}
  get deathChoiceRemaining(){return this.death?Math.max(0,Math.min(BALANCE.deathChoiceDuration/1000,Math.ceil((this.death.at+BALANCE.deathChoiceDelay+BALANCE.deathChoiceDuration-this.now())/1000))):0;}
  private die(){
    if(this.death)return;
    this.speedPad=freshPads();
    this.standUp();
    if(this.carried){const egg=this.carried;egg.x=this.x;egg.z=this.z;this.world.push(egg);this.carried=null;this.emit('egg_drop',{type:egg.type,reason:'death'});}
    this.death={x:this.x,z:this.z,at:this.now(),remaining:Math.max(0,(this.deadline-this.now())/1000)};
    this.knockback.remaining=0;this.launch=null;this.training=false;this.reviveAdUntil=null;
    this.emit('player_death');this.revision++;
  }
  beginReviveAd(){
    if(!this.death||this.deathAnimationRemaining>0||this.deathChoiceRemaining<=0||this.reviveAdUntil!==null)return false;
    this.reviveAdUntil=this.now()+BALANCE.virtualAdDuration;return true;
  }
  revivedAt=-Infinity;
  revive(inPlace:boolean){
    if(!this.death||this.deathAnimationRemaining>0)return false;
    if(!inPlace)return this.failExpedition('hp');
    if(this.reviveAdUntil===null||this.now()<this.reviveAdUntil)return false;
    this.updateNight();if(!this.death)return false;
    const here=inPlace&&!this.isNight;
    this.x=here?this.death.x:0;this.z=here?this.death.z:0;
    this.deadline=here&&!this.isAtBase?this.now()+Math.max(BALANCE.reviveMinimumTime,this.death.remaining)*1000:0;
    this.damageTicks=[];this.hitSource=null;
    this.hp=this.maxHp;this.sinceHit=0;this.immunity=BALANCE.reviveImmunity;this.knockedUntil=0;this.launch=null;this.speedPad=freshPads();
    this.death=null;this.reviveAdUntil=null;this.knockback.remaining=0;this.slowRemaining=0;this.effects={ink:0,stone:0,grab:0,delay:0,magnet:0};this.revivedAt=this.now();this.revision++;this.emit('player_revive',{inPlace:here?1:0});return true;
  }
  get isAtBase(){return this.z>=BALANCE.baseMinZ&&this.z<=BALANCE.mapNearZ&&Math.abs(this.x)<=BALANCE.baseMapX;}
  knockedUntil=0;
  batAt=0;
  mobs:Mob[]=[];
  environmentTime:number|null=null;
  receiveBat(dx:number,dz:number){
    if(this.training)return false;
    const now=this.now();if(this.death||now<this.knockedUntil)return false;
    this.standUp();
    if(this.carried){const egg=this.carried;egg.x=this.x;egg.z=this.z;this.world.push(egg);this.carried=null;this.emit('egg_drop',{type:egg.type,reason:'player_hit'});}
    const length=Math.hypot(dx,dz)||1;
    this.knockback={x:dx/length*BALANCE.knockback/BALANCE.batFlightSeconds,z:dz/length*BALANCE.knockback/BALANCE.batFlightSeconds,remaining:BALANCE.batFlightSeconds};
    this.knockedUntil=now+BALANCE.knockdownMs;this.hitAt=now;this.training=false;this.launch=null;this.revision++;return true;
  }
  pvpHit(hit:{x:number;z:number;until:number}){
    if(this.death||this.training)return;
    if(this.carried)this.emit('egg_drop',{type:this.carried.type,reason:'player_hit'});
    this.carried=null;this.launch=null;this.training=false;this.seat=null;this.x=hit.x;this.z=hit.z;this.knockedUntil=hit.until;
    this.message="배트에 맞아 넘어졌어요! 들고 있던 알을 떨어뜨렸어요.";this.revision++;
  }
  hp=BALANCE.baseHp;
  sinceHit=0;
  get maxHp(){return BALANCE.baseHp;}
  restorePlayerHealth(value:number,previousMax=this.progression.maxHP){
    const max=Number.isFinite(previousMax)&&previousMax>0?previousMax:100;
    this.hp=this.death?0:Math.max(0,Math.min(this.maxHp,Math.ceil(value*this.maxHp/max)));
    this.damageTicks=[];
  }
  bossDamage(region:number){return stageDamage(this.bosses[region]?.stageId??this.stage.id,this.stageStep);}
  receiveHit(region:number){
    const d={damage:this.bossDamage(region),damagePercent:0,knockback:PROGRESSION.hitKnockback,slowMultiplier:PROGRESSION.hitSlow,slowDuration:PROGRESSION.hitSlowDuration,effect:'hit'} as HazardDefinition;
    return this.applyHazard({definition:d,origin:{x:this.x,z:this.z-1}} as Hazard);
  }
  training = false;
  seat:number|null=null;
  get nearSeat(){
    if(this.seat!==null)return this.seat;
    let nearest=-1,distance=CAMPFIRE.interactionRadius;
    CAMP_SEATS.forEach((seat,index)=>{const d=Math.hypot(this.x-seat.x,this.z-seat.z);if(d<distance){nearest=index;distance=d;}});
    return nearest;
  }
  standUp(){
    const seat=this.seat===null?undefined:CAMP_SEATS[this.seat];this.seat=null;
    if(seat){this.x=seat.x+Math.sin(seat.rotation)*CAMPFIRE.exitOffset;this.z=seat.z+Math.cos(seat.rotation)*CAMPFIRE.exitOffset;this.revision++;}
  }
  toggleSeat(){
    if(!this.isAtBase||this.carried||this.death||this.training||this.launch||this.knockback.remaining>0||this.now()<this.knockedUntil)return false;
    if(this.seat!==null){this.standUp();this.message='자리에서 일어났어요.';return true;}
    const index=this.nearSeat;if(index<0)return false;
    const seat=CAMP_SEATS[index];this.seat=index;this.x=seat.x;this.z=seat.z;
    this.facing={x:Math.sin(seat.rotation),z:Math.cos(seat.rotation)};this.velocity={x:0,z:0};
    this.message='모닥불 곁에서 쉬는 중 · 이동하면 일어나요.';this.revision++;return true;
  }
  private trainingClock=0;
  private trainingGain=0;
  get movementMultiplier(){return TRAILS[this.save.equippedTrail??0].multiplier*this.speedMultiplier;}
  get trainingSpeedBonus(){return upgradeBaseSpeed(this.save.upgrades.speed)*OVERHAUL.trainingCap*(this.save.trainingProgress??0);}
  get effectiveTrainingRate(){
    const progress=this.save.trainingProgress??0;
    return this.progressionSpeed/(1+OVERHAUL.trainingCap*progress)*OVERHAUL.trainingCap*(trainingProgressAfter(progress,1,this.save.upgrades.training)-progress);
  }
  resultWeight: Weighted | null = null;
  returnReward: Weighted & { type: number; distance: number; stageId?:number;variant?:number;special?:boolean } | null = null;
  get nearGym() { return Math.hypot(this.x-this.gym.x,this.z-this.gym.z)<BALANCE.gymRadius; }
  get trainingRate() { return (1+this.save.upgrades.training*OVERHAUL.trainingRatePerLevel)/OVERHAUL.trainingSeconds; }
  toggleTraining(){
    if(!this.isAtBase||this.carried||this.death||this.launch||this.knockback.remaining>0||this.now()<this.knockedUntil)return false;
    this.standUp();this.training=!this.training;
    this.trainingClock=this.trainingGain=0;
    if(this.training){this.x=this.gym.x;this.z=this.gym.z;this.velocity={x:0,z:0};this.facing={x:0,z:-1};this.emit('training_start');}
    this.message=this.training?'운동 중 · 조이스틱으로 이동하면 운동을 마쳐요.':'운동을 마쳤어요.';
    this.revision++;return true;
  }
  get growthStage(){return this.save.highestStage??1;}
  get productionMultiplier(){return productionUpgradeMultiplier(this.save.upgrades);}
  petIncomeStageMultiplier(id:number){return OVERHAUL.stageIncomeGrowth**(Math.max(1,MONGLES[id].stageId)-1);}
  petIncomeAmount(id:number){const p=MONGLES[id];return incomeValue(petIncomeValue(Math.max(1,p.stageId),p.tier)*this.productionMultiplier)*BALANCE.petIncomeSeconds;}
  get petIncomePerCycle(){return this.activePetLots.reduce((sum,l)=>sum+this.petIncomeAmount(l.species)*petWeightRatio(l),0);}
  get incomePerSecond(){return this.petIncomePerCycle/BALANCE.petIncomeSeconds;}
  offlineReward:Money=0;
  settleProduction(at:number,active=true){
    const previous=this.save.productionAt??this.save.lastSavedAt;
    const anchor=this.save.productionActiveAt??previous;
    const elapsed=Math.min(BALANCE.offlineCap,Math.max(0,(at-previous)/1000));
    // Integrate one continuous absence, even while another room member polls.
    this.tickPetIncome(Math.max(0,offlineSeconds((at-anchor)/1000)-offlineSeconds((previous-anchor)/1000)));
    // Room time advances even with no movement requests from this player.
    // Use the same persisted watermark as income so reconnects cannot replay it.
    if(this.roomManaged)this.damage(elapsed*this.dps);
    this.save.productionAt=Math.max(previous,at);
    if(active)this.save.productionActiveAt=Math.max(previous,at);
    else this.save.productionActiveAt=anchor;
  }
  private tickPetIncome(dt:number){
    if(!Number.isFinite(dt)||dt<=0)return;
    const income=this.save.petIncome??={elapsed:0,pending:0};
    income.elapsed+=dt;
    income.pending=add(income.pending,multiply(this.incomePerSecond,dt));
    if(income.elapsed+1e-9<BALANCE.petIncomeSeconds)return;
    income.elapsed=(income.elapsed+1e-9)%BALANCE.petIncomeSeconds;
    const amount=floorMoney(income.pending);
    income.pending=subtract(income.pending,amount);
    if(compare(amount,0)>0){this.save.dust=add(this.save.dust,amount);this.revision++;this.emit('pet_income',{amount});}
  }
  facing = { x: 0, z: -1 };
  events: { name: string; params: Record<string, string | number> }[] = [];
  emit(name: string, params: Record<string, string | number> = {}) { this.events.push({name, params}); }
  nightAt = 0;
  nightUntil = 0;
  announcement = "";
  announcementId = 0;
  launch: {
    x: number;
    z: number;
    toX: number;
    toZ: number;
    elapsed: number;
  } | null = null;
  immunity = 0;
  bosses: Boss[] = [];
  resetBosses(){
    this.bosses=this.route.map(r=>{const p=bossAnchor(r.stage);return {x:p.x,z:p.z-r.offset,homeX:p.x,homeZ:p.z-r.offset,stageId:r.stage,mode:'idle',target:null,loot:null};});
    const p=bossAnchor(20,true),z=p.z-this.route.at(-1)!.offset;
    this.bosses.push({x:p.x,z,homeX:p.x,homeZ:z,stageId:20,final:true,mode:'idle',target:null,loot:null});
  }
  x = 0;
  z = 0;
  deadline = 0;
  carried: WorldEgg | null = null;
  world: WorldEgg[] = [];
  message = "앞으로 걸으면 20개 지역이 이어져요. 알을 들고 농장으로 돌아오세요";
  revision = 0;
  lastTap = -Infinity;
  autoClock = 0;
  result: number | null = null;
  flyaway: { type: number; x: number; z: number; at: number;stageId?:number;variant?:number } | null = null;
  constructor(
    public save: Save,
    public now: () => number,
    public random: () => number = Math.random,
    hydrateOnly=false,
  ) {
    migrateTutorial(save);
    migrateBalance(save,this.now());validateWeekly(save.weekly);
    save.mongles=Array.from({length:MONGLES.length},(_,i)=>save.mongles[i]??0);
    ensurePetLots(save);
    migrateStageSave(save);
    migrateEggHealth([...save.eggs,...(save.world??[]),save.expedition?.carried,...(save.bosses??[]).flatMap(b=>b.loot?[b.loot]:[])]);
    save.dragonClues??={};
    this.mapCollision.setFarm(villageMapColliders());
    if(!save.progression){save.progression=newProgression();save.progression.seenEggs=[...save.discovered];save.progression.hatchedPets=save.mongles.flatMap((n,i)=>n?[i]:[]);save.progression.distanceRecord=save.best;}
    validateProgression(save.progression);
    if(hydrateOnly)return;
    this.openedShortcuts=save.openedShortcuts??[];
    const oldEntrance=save.progression.stage;
    if(oldEntrance!==1){
      const offset=(oldEntrance-1)*ROUTE.length;save.progression.stage=1;
      for(const egg of [...(save.world??[]),...(save.expedition?.carried?[save.expedition.carried]:[])]){egg.z-=offset;if(egg.homeZ!==undefined)egg.homeZ-=offset;egg.guardian=egg.special?20:(egg.stageId??oldEntrance)-1;egg.stageId??=oldEntrance;}
      for(const b of save.bosses??[]){b.z-=offset;if(b.homeZ!==undefined)b.homeZ-=offset;}
      if(save.expedition&&save.expedition.z<BALANCE.baseMinZ)save.expedition.z-=offset;
    }

    this.restorePlayerHealth(save.progression.hp);this.immunity=save.progression.immunity;this.slowRemaining=save.progression.slowRemaining;this.slowMultiplier=save.progression.slowMultiplier;
    const cycle = Math.floor(this.now()/BALANCE.nightInterval)*BALANCE.nightInterval;
    this.nightAt = cycle + BALANCE.nightInterval;
    this.nightUntil = this.now()-cycle < BALANCE.nightDuration ? cycle+BALANCE.nightDuration : 0;
    this.resetBosses();this.spawn();
    if (!save.world && !save.discovered.length && !save.eggs.length && !save.mongles.some(Boolean)) {
      const starter = this.world[2];
      starter.type = 0;
      if(starter.variant===5||starter.variant===ULTRA_SECRET.eggVariant)starter.variant=0;
      Object.assign(starter,rollEggWeight(starter,this.random));starter.hp = eggMaxHp(starter);
    }
    if (
      save.world &&
      save.bosses &&
      save.routeVersion === 3 && save.bosses.length>0&&save.bosses.length<=21 &&
      save.world.every(
        (e) => EGGS[e.type] && Number.isFinite(e.x) && Number.isFinite(e.z),
      ) &&
      save.bosses.every(
        (b) =>
          Number.isFinite(b.x) &&
          Number.isFinite(b.z) &&
          ["idle", "waking", "chase", "return"].includes(b.mode),
      )
    ) {
      const restoredStages=new Set(save.bosses.filter(b=>!b.final).map(b=>b.stageId));
      this.world = [...this.world.filter(e=>e.special?!save.bosses!.some(b=>b.final):!restoredStages.has(e.stageId)),...save.world];
      for(const boss of save.bosses){const i=this.bosses.findIndex(b=>b.stageId===boss.stageId&&!!b.final===!!boss.final);if(i>=0)this.bosses[i]=boss;}
    }
    if((save.explorationVersion??0)<3)migrateExploration(this.world,this.bosses);
    if((save.explorationVersion??0)<4)migrateBossHomes(this.bosses);
    if(save.explorationVersion!==5){migrateEggHomes(this.world,this.bosses);save.explorationVersion=5;}
    // Older saves applied the sleeping offset only in the renderer.
    for(const boss of this.bosses){
      if(boss.homeX===undefined){
        boss.homeX=boss.final?0:-2.6;
        if(!boss.final){boss.homeZ=(boss.homeZ??boss.z)-4;if(boss.mode==='idle'||boss.mode==='waking'){boss.x-=2.6;boss.z-=4;}}
      }
      if(boss.mode==='waking')boss.wakeRemaining=Math.min(ROUTE.bossWakeSeconds,boss.wakeRemaining??ROUTE.bossWakeSeconds);
    }
    if (save.expedition) {
      this.x = save.expedition.x;
      this.z = save.expedition.z;
      this.deadline = save.expedition.deadline;
      this.carried = save.expedition.carried;
      this.message = "진행 중이던 원정으로 돌아왔어요";
      this.restorePlayerHealth(Number.isFinite(save.expedition.hp)?save.expedition.hp!:save.progression.maxHP);
      this.sinceHit=Number.isFinite(save.expedition.sinceHit)?Math.max(0,save.expedition.sinceHit!):0;
      this.damageTicks=[];
    }
    if(save.routeVersion!==3&&this.carried){
      this.carried.stageId??=this.progression.stage;this.carried.guardian=this.carried.stageId-this.progression.stage;
      const boss=this.bosses[this.carried.guardian];if(boss){boss.mode='chase';boss.target=this.carried.id;}
    }
    for(const egg of [...this.world,...save.eggs,...(this.carried?[this.carried]:[])]){
      if(egg.stageId&&egg.variant===undefined){const slot=Number(egg.id.split('-')[1]);egg.variant=Number.isInteger(slot)&&slot>=0&&slot<5?slot:egg.type%5;}
    }
    if(save.death){this.death=save.death;this.x=save.death.x;this.z=save.death.z;this.hp=0;if(this.deathChoiceRemaining<=0)this.failExpedition('hp');}
    if(this.isNight&&save.nightAt!==this.nightAt){this.nightAt=cycle;this.updateNight();}
    if(Math.floor(save.lastSavedAt/BALANCE.nightInterval)<Math.floor(this.now()/BALANCE.nightInterval)){this.nightAt=cycle;this.updateNight();}
    if(this.isNight&&!this.isAtBase)this.failExpedition('night');
  }
  get selected() {
    return this.save.eggs.find((e) => e.id === this.save.selected);
  }
  private weightedMultiplier(kind:'clickMultiplier'|'autoMultiplier'|'speedMultiplier'){return 1+this.activePetLots.reduce((sum,l)=>sum+weightedPetStats(l.species,l)[kind]-1,0);}
  get clickMultiplier() { return this.weightedMultiplier('clickMultiplier'); }
  get autoMultiplier() { return this.weightedMultiplier('autoMultiplier'); }
  get speedMultiplier() { return this.weightedMultiplier('speedMultiplier'); }
  get progressionSpeed(){return progressionSpeedValue(upgradeBaseSpeed(this.save.upgrades.speed),this.save.trainingProgress??0,this.save.equippedTrail??0,this.speedMultiplier,this.level);}
  get offPath(){
    return !this.isAtBase&&!terrainAt(this.stage.id,this.x,this.z+this.stageOffset).onPath;
  }
  get pathSpeedMultiplier(){return this.offPath?OFF_PATH_SPEED_MULTIPLIER:1;}
  get chaseSpeedMultiplier(){return !this.isAtBase&&this.carried&&!this.concealed&&(this.personalBosses?this.now()>=this.bossWakeAt:this.bosses.some(b=>b.mode==='chase'&&b.target===this.carried!.id))?PLAYER_CHASE_SPEED_MULTIPLIER:1;}
  get eggSpeedPenalty(){return this.carried&&!this.meetsEggSpeed(this.carried)?UNDER_RECOMMENDED_EGG_SPEED_MULTIPLIER:1;}
  get movementEffectMultiplier(){
    const status=(this.slowRemaining>0?this.slowMultiplier:1)*(this.effects.magnet>0?.8:1)*(this.isNormalNight?BALANCE.nightMoveMultiplier:1)*(this.isRaining?BALANCE.rainMoveMultiplier:1)*(this.isWindy?BALANCE.windMoveMultiplier:1);
    return TRAILS[this.save.equippedTrail??0].multiplier*this.mountSpeedMultiplier*status*this.pathSpeedMultiplier*this.chaseSpeedMultiplier*this.eggSpeedPenalty*(this.carried?carryMultiplier(this.carried,this.save.upgrades.carry):1);
  }
  get movementSpeed(){
    const base=this.isAtBase?BALANCE.baseWalkSpeed:walkingSpeedValue(this.progressionSpeed);
    return base*this.movementEffectMultiplier;
  }
  speedPad=freshPads();
  eggRequiredSpeed(egg:WorldEgg){const stage=egg.stageId??this.stage.id;return recommendedRouteSpeed(0,stage)*stableRecoveryRatio(stage)*(.88/carryMultiplier(egg,this.save.upgrades.carry));}
  get unloadedSpeed(){return this.progressionSpeed;}
  meetsEggSpeed(egg:WorldEgg){return this.progressionSpeed+1e-9>=this.eggRequiredSpeed(egg);}
  canEnterStage(stage:number){return this.progressionSpeed>=recommendedRouteSpeed(0,stage);}
  get expeditionWarning(){
    if(this.isAtBase||this.isNight)return '';
    const next=this.route.find(segment=>segment.stage===this.stage.id+1);
    if(next&&!this.canEnterStage(next.stage)&&Math.abs(this.z+next.start)<.6)return `${next.stage}스테이지 진입 속도 ${formatNumber(recommendedRouteSpeed(0,next.stage))} · 현재 ${formatNumber(this.progressionSpeed)}`;
    const egg=this.carried??this.near;
    const speed=this.movementSpeed*(egg&&!this.carried?carryMultiplier(egg,this.save.upgrades.carry):1);
    const estimate=Math.max(0,-this.z+BALANCE.baseMinZ)*1.25/Math.max(.1,speed)+8+(egg&&!this.carried?BALANCE.rareEggPickupSeconds[EGGS[egg.type].tier]:0);
    return this.nightRemaining<estimate?'깊은 밤이 가까워요! 기지로 돌아가세요.':'';
  }
  get speed(){return this.progressionSpeed;}
  get unmountedSpeed(){return this.progressionSpeed;}
  get duration() {
    return (
      BALANCE.duration +
      BALANCE.timePerLevel * this.save.upgrades.time
    );
  }
  get dps(){return autoDamageValue(this.save.upgrades.damage,this.save.upgrades.rate,this.autoMultiplier);}
  get remaining() {
    return this.deadline
      ? Math.max(0, (this.deadline - this.now()) / 1000)
      : this.duration;
  }
  get distance() {
    return Math.hypot(this.x, this.z);
  }
  canReachEgg(e:WorldEgg) {
    const shell=e.id.startsWith('net-')?0:Math.max(0,RARITIES[EGGS[e.type].tier].scale*BALANCE.eggVisualScale*.3-.3);
    const approach=this.movementSpeed*BALANCE.eggApproachSeconds;
    return Math.hypot(e.x-this.x,e.z-this.z)<BALANCE.interaction+shell+approach+BALANCE.roomVisualOffsetMax;
  }
  get near() {
    const first=firstEggTarget(this);
    if(first&&this.canReachEgg(first))return first;
    const behind = (e: WorldEgg) => (e.x-this.x)*this.facing.x + (e.z-this.z)*this.facing.z < -0.001 ? 1 : 0;
    return this.world
      .filter(
        (e) => this.canReachEgg(e),
      )
      .sort(
        (a, b) =>
          behind(a) - behind(b) || Math.hypot(a.x - this.x, a.z - this.z) -
          Math.hypot(b.x - this.x, b.z - this.z),
      )[0];
  }
  get risk() {
    return this.speed < this.recommendedSpeed * .65
      ? "danger"
      : this.speed < this.recommendedSpeed
        ? "warning"
        : "safe";
  }
  get action() {
    if(this.nearShortcut)return this.nearShortcut.label;
    if(!this.carried&&this.nearSeat>=0)return this.seat!==null?'일어나기':'앉기';
    if(this.nearStore&&!this.carried&&!this.near&&!this.training)return "판매하기";
    if (this.nearGym && !this.carried) return this.training ? "운동 내리기" : "운동 시작";
    return this.carried ? "내려놓기" : this.near ? "들고가기" : "배트 스윙";
  }
  private newStageEgg(stage:number,offset:number,guardian:number,slot:number,variant:number):WorldEgg{
        const region=Math.floor((stage-1)/4);
        const roll=this.random(),ultra=roll<ULTRA_SECRET.chance,dragon=!ultra&&roll<ULTRA_SECRET.chance+BALANCE.secretDragonEggChance;
        const type = ultra||dragon?6*REGIONS.length+region:rollEgg(region, this.random);
        const anchor=eggAnchor(stage,slot),x=anchor.x,z=anchor.z-offset;
        return {
          id: `${stage}-${slot}-${this.now()}-${this.random()}`,
          type,
          hp: eggMaxHp({type,stageId:stage}),
          hpVersion:5 as const,
          ...rollEggWeight({type,stageId:stage,variant:ultra?ULTRA_SECRET.eggVariant:dragon?5:variant},this.random),
          distance: Math.abs(z),
          x,
          z,
          homeX: x,
          homeZ: z,
          region,stageId:stage,variant:ultra?ULTRA_SECRET.eggVariant:dragon?5:variant,guardian,
          secured: false,
          expires: this.now() + BALANCE.nightInterval,
        };
  }
  spawn() {
    this.world = this.route.flatMap((boss, guardian) => {
      const variants=normalEggSelection(this.random,5);
      return Array.from({ length: 5 }, (_, slot) => {
        return this.newStageEgg(boss.stage,boss.offset,guardian,slot,variants[slot]);
      });},
    );
    const rare=RARITIES.slice(FINAL_GUARDIAN.minimumEggTier);
    let roll=this.random()*rare.reduce((sum,r)=>sum+r.chance,0);
    const secretRoll=this.random(),ultra=secretRoll<ULTRA_SECRET.chance,dragon=!ultra&&secretRoll<ULTRA_SECRET.chance+BALANCE.secretDragonEggChance;
    const choice=rare.findIndex(r=>(roll-=r.chance)<0),tier=ultra||dragon?6:FINAL_GUARDIAN.minimumEggTier+(choice<0?rare.length-1:choice);
    const type=tier*REGIONS.length+REGIONS.length-1,z=specialEggAnchor().z-this.route.at(-1)!.offset;
    this.world.push({id:`final-${this.now()}-${this.random()}`,type,hp:eggMaxHp({type,stageId:20}),hpVersion:5,distance:-z,x:0,z,homeX:0,homeZ:z,region:4,stageId:20,variant:ultra?ULTRA_SECRET.eggVariant:dragon?5:randomNormalEggVariant(this.random),guardian:this.bosses.length-1,special:true,secured:false,expires:this.now()+BALANCE.nightInterval});
    Object.assign(this.world.at(-1)!,rollEggWeight(this.world.at(-1)!,this.random));
  }
  get nightRemaining() {
    return Math.max(0, Math.ceil((this.nightAt - this.now()) / 1000));
  }
  get isNight() {
    // Compatibility: this flag exclusively means the forced-reset/closed phase.
    return this.now() < this.nightUntil;
  }
  get isNormalNight(){return !this.isNight&&this.now()>=this.nightAt-BALANCE.normalNightDuration;}
  private applyNightEggWeight(egg:WorldEgg){
    if(!this.isNormalNight||egg.pickedUp||egg.secured||egg.nightWeightApplied)return;
    ensureEggWeight(egg);
    egg.weightG=Math.round(egg.weightG!*BALANCE.nightEggWeightMultiplier);
    egg.nightWeightApplied=true;
    this.revision++;
  }
  applyNightEggWeights(){
    if(!this.isNormalNight)return;
    for(const egg of this.world)this.applyNightEggWeight(egg);
    for(const boss of this.bosses)if(boss.replenishing)this.applyNightEggWeight(boss.replenishing.egg);
  }
  get isRaining(){return rainStrength(this.now())>0;}
  get isWindy(){return windStrength(this.now())>0;}
  get pursuing() {
    return this.bosses.findIndex((b) => b.mode === "chase");
  }
  get concealed(){return !this.death&&!this.isAtBase&&concealedAt(this.x,this.z,this.progression.stage);}
  restoreEgg(egg: WorldEgg, region: number) {
    egg.x = egg.homeX ?? 0;
    egg.z = egg.homeZ ?? this.bosses[egg.guardian??region]?.homeZ ?? -14;
    // An egg recovered from the previous night replaces its refreshed nest slot.
    this.world = this.world.filter(
      (e) =>
        e.id !== egg.id &&
        !(
          e.guardian === egg.guardian &&
          !e.secured &&
          e.homeX === egg.homeX &&
          e.homeZ === egg.homeZ
        ),
    );
    this.world.push(egg);
  }
  private inEggStage(egg:WorldEgg,z:number){
    const segment=this.route.find(r=>r.stage===egg.stageId);
    return !!segment&&-z>=segment.start&&-z<segment.end;
  }
  private tickEggReplenish(b:Boss,guardian:number,dt:number,reserved:WorldEgg[]){
    if(this.isNight||b.final){delete b.replenishAt;delete b.replenishing;return false;}
    const count=this.world.filter(e=>e.stageId===b.stageId).length;
    if(count>EGG_REPLENISH.threshold){delete b.replenishAt;delete b.replenishing;return false;}
    b.replenishAt??=this.now()+EGG_REPLENISH.minDelay+this.random()*(EGG_REPLENISH.maxDelay-EGG_REPLENISH.minDelay);
    if(b.mode==='chase'||b.mode==='waking'||b.loot){delete b.replenishing;return false;}
    if(!b.replenishing){
      if(b.mode!=='idle'||this.now()<b.replenishAt)return false;
      const segment=this.route.find(r=>r.stage===b.stageId);if(!segment)return false;
      const occupied=[...this.world,...reserved,...(this.carried?[this.carried]:[])];
      const slots=Array.from({length:5},(_,slot)=>({slot,...eggAnchor(segment.stage,slot)}))
        .filter(p=>!occupied.some(e=>e.guardian===guardian&&Math.hypot((e.homeX??e.x)-p.x,(e.homeZ??e.z)-(p.z-segment.offset))<.2));
      const spot=slots[Math.min(slots.length-1,Math.floor(this.random()*slots.length))];if(!spot)return false;
      b.replenishing={egg:this.newStageEgg(segment.stage,segment.offset,guardian,spot.slot,randomNormalEggVariant(this.random)),placing:0};
      b.mode='return';
    }
    const delivery=b.replenishing,egg=delivery.egg;
    const dx=egg.homeX!-b.x,dz=egg.homeZ!-b.z,distance=Math.hypot(dx,dz);
    b.lookX=egg.homeX;b.lookZ=egg.homeZ;
    const step=Math.min(distance,BOSS_MOVEMENT.returnSpeed*dt);
    if(distance>.03){b.x+=dx/distance*step;b.z+=dz/distance*step;}
    else delivery.placing+=dt;
    egg.x=b.x;egg.z=b.z;
    if(delivery.placing>=EGG_REPLENISH.placeSeconds){
      // Check again at commit: another player's dropped egg can occupy this nest.
      if(!this.world.some(e=>Math.hypot((e.homeX??e.x)-egg.homeX!,(e.homeZ??e.z)-egg.homeZ!)<.2)){
        egg.x=egg.homeX!;egg.z=egg.homeZ!;this.world.push(egg);this.revision++;
      }
      delete b.replenishing;delete b.replenishAt;
    }
    return true;
  }
  applyBossContact(guardian:number,dx:number,dz:number){
    const b=this.bosses[guardian];if(!b||!this.carried||this.carried.guardian!==guardian)return false;
    const underRecommended=!this.meetsEggSpeed(this.carried);
    const knockback=Math.min(ROUTE.bossMaxKnockback,Math.max(underRecommended?BOSS_MOVEMENT.underqualifiedKnockback:0,guardianSpeed(b.stageId??1)*ROUTE.bossKnockbackPerSpeed));
    const length=Math.hypot(dx,dz)||1;
    const definition={damage:stageDamage(b.stageId??1,b.final?3:this.stageStep),damagePercent:.04,knockback,slowMultiplier:PROGRESSION.hitSlow,slowDuration:PROGRESSION.hitSlowDuration,effect:'hit'} as HazardDefinition;
    return this.applyHazard({definition,origin:{x:this.x-dx/length,z:this.z-dz/length}} as Hazard,true);
  }
  // Shared eggs remain server-owned; their maintenance no longer moves a guardian.
  tickSharedEggs(reserved:WorldEgg[],recoveryAt:Record<string,number>){
    for(const egg of [...this.world]){
      if(egg.secured||!this.inEggStage(egg,egg.z)||egg.x===egg.homeX&&egg.z===egg.homeZ){delete recoveryAt[egg.id];continue;}
      recoveryAt[egg.id]??=this.now()+PERSONAL_BOSS.recoverEggMs;
      if(this.now()>=recoveryAt[egg.id]){this.restoreEgg(egg,egg.region??0);delete recoveryAt[egg.id];}
    }
    for(const id of Object.keys(recoveryAt))if(!this.world.some(e=>e.id===id))delete recoveryAt[id];
    this.bosses.forEach((b,guardian)=>{
      if(this.isNight||b.final||this.world.filter(e=>e.stageId===b.stageId).length>EGG_REPLENISH.threshold){delete b.replenishAt;return;}
      b.replenishAt??=this.now()+EGG_REPLENISH.minDelay+this.random()*(EGG_REPLENISH.maxDelay-EGG_REPLENISH.minDelay);
      if(this.now()<b.replenishAt)return;
      const segment=this.route.find(r=>r.stage===b.stageId);if(!segment)return;
      const occupied=[...this.world,...reserved];
      const slots=Array.from({length:5},(_,slot)=>({slot,...eggAnchor(segment.stage,slot)})).filter(p=>!occupied.some(e=>e.guardian===guardian&&Math.hypot((e.homeX??e.x)-p.x,(e.homeZ??e.z)-(p.z-segment.offset))<.2));
      if(!slots.length)return;
      const spot=slots[Math.min(slots.length-1,Math.floor(this.random()*slots.length))];
      this.world.push(this.newStageEgg(segment.stage,segment.offset,guardian,spot.slot,randomNormalEggVariant(this.random)));
      delete b.replenishAt;this.revision++;
    });
  }
  tickBosses(dt:number,only?:number,reserved:WorldEgg[]=[]){
    this.bosses.forEach((b,guardian)=>{
      if(only!==undefined&&guardian!==only)return;
      const ownsEgg=!this.death&&!this.isNight&&this.carried?.guardian===guardian;
      if(this.concealed&&ownsEgg&&(b.mode==='chase'||b.mode==='waking')){b.mode='return';b.target=null;b.wakeRemaining=undefined;}
      if(!this.concealed&&ownsEgg&&!this.isAtBase&&(b.mode==='idle'||b.mode==='return'&&!b.loot)){
        const remaining=this.personalBosses?Math.max(0,(this.bossWakeAt-this.now())/1000):b.mode==='idle'?ROUTE.bossWakeSeconds:0;
        b.mode=remaining>0?'waking':'chase';b.wakeRemaining=remaining||undefined;b.target=this.carried!.id;
      }
      if((b.mode==='chase'||b.mode==='waking')&&(!ownsEgg||this.isAtBase||this.carried?.id!==b.target)){b.mode='return';b.target=null;b.wakeRemaining=undefined;}
      // A personal guardian only targets the egg carried by this client.
      b.lookX=b.mode==='chase'||b.mode==='waking'?this.x:undefined;
      b.lookZ=b.mode==='chase'||b.mode==='waking'?this.z:undefined;
      if(!this.localBossSimulation&&this.tickEggReplenish(b,guardian,dt,reserved))return;
      let activeDt=dt;
      if(b.mode==='waking'){
        const remaining=Number.isFinite(b.wakeRemaining)?Math.max(0,Math.min(ROUTE.bossWakeSeconds,b.wakeRemaining!)):ROUTE.bossWakeSeconds;
        b.wakeRemaining=Math.max(0,remaining-dt);
        if(b.wakeRemaining>0)return;
        activeDt=Math.max(0,dt-remaining);
        b.mode='chase';b.wakeRemaining=undefined;
        this.emit('boss_wake',{stage:b.stageId??1,final:b.final?1:0});
        this.message='보스가 깨어났어요! 알을 들고 도망가세요.';
        this.revision++;
      }
      let recovery:WorldEgg|undefined;
      if(b.mode!=='chase'&&!this.localBossSimulation){
        b.loot=this.world.find(e=>e.id===b.loot?.id)??null;
        recovery=b.loot??this.world.find(e=>e.guardian===guardian&&!e.secured&&this.inEggStage(e,e.z)&&(e.x!==e.homeX||e.z!==e.homeZ));
        if(recovery)b.mode='return';
      }
      const tx=b.mode==='chase'?this.x:recovery?(b.loot?recovery.homeX??0:recovery.x):b.homeX??0;
      const tz=b.mode==='chase'?this.z:recovery?(b.loot?recovery.homeZ??b.homeZ??-17:recovery.z):b.homeZ??-17;
      const recoveryMultiplier=recovery?ROUTE.bossRecoverySpeedMultiplier:1;
      const reach=ROUTE.bossReach*ROUTE.bossAngryScale*(b.final?FINAL_GUARDIAN.scale:1);
      if(b.mode==='chase'){
        const distance=Math.hypot(tx-b.x,tz-b.z),limit=reach+PERSONAL_BOSS.maxGap;
        if(distance>limit){b.x=tx+(b.x-tx)*limit/distance;b.z=tz+(b.z-tz)*limit/distance;}
      }
      const dx=tx-b.x,dz=tz-b.z,l=Math.hypot(dx,dz);
      const escapeSpeed=Math.max(0,(this.velocity.x*dx+this.velocity.z*dz)/(l||1));
      const speed=b.mode==='chase'?guardianPursuitSpeed(b.stageId??1,this.speed,l,escapeSpeed,reach):recovery&&!b.loot?Math.min(BOSS_MOVEMENT.maxSpeed,guardianSpeed(b.stageId??1)*recoveryMultiplier):Math.min(BOSS_MOVEMENT.returnSpeed,guardianSpeed(b.stageId??1));
      // A rush ends outside contact range even after a delayed/large frame.
      // Normal close pursuit resumes on the next tick, rather than overshooting.
      const rush=b.mode==='chase'&&l>reach+PERSONAL_BOSS.catchupDistance;
      const step=Math.min(rush?l-reach-PERSONAL_BOSS.catchupGap:l,speed*(b.mode==='chase'?PLAYER_CHASE_SPEED_MULTIPLIER:1)*(this.isNormalNight?NIGHT_BOSS_SPEED_MULTIPLIER:1)*activeDt);
      if(l>1.8||b.mode==='return'){b.x+=dx/(l||1)*step;b.z+=dz/(l||1)*step;}
      b.windup=undefined;
      if(b.mode==='chase'&&!this.isAtBase&&Math.hypot(this.x-b.x,this.z-b.z)<=ROUTE.bossReach*ROUTE.bossAngryScale*(b.final?FINAL_GUARDIAN.scale:1)){
        b.attack={at:this.now(),angle:Math.atan2(this.x-b.x,this.z-b.z)};
        if(this.onBossContact&&this.carried)this.onBossContact(guardian,this.carried.id,this.x-b.x,this.z-b.z);
        else this.applyBossContact(guardian,this.x-b.x,this.z-b.z);
        b.mode='return';b.target=null;
      }
      if(recovery){
        if(b.loot){
          recovery.x=b.x;recovery.z=b.z;
          if(l-step<.2){this.restoreEgg(recovery,recovery.region??0);b.loot=null;this.emit('egg_recovered',{stage:b.stageId??1});this.revision++;}
        }else if(l-step<.2){b.loot=recovery;recovery.x=b.x;recovery.z=b.z;}
      }else if(b.mode==='return'&&l-step<.2)b.mode='idle';
    });
  }
  move(dx: number, dz: number, dt: number, slow = false) {

    this.motionTime+=dt;
    this.inputHistory.push({at:this.motionTime,x:dx,z:dz});this.inputHistory=this.inputHistory.filter(v=>v.at>=this.motionTime-1);
    if(this.effects.delay>0){const delayed=this.inputHistory.filter(v=>v.at<=this.motionTime-HAZARD_BALANCE.inputDelay).at(-1);dx=delayed?.x??0;dz=delayed?.z??0;}
    const l = Math.hypot(dx, dz);this.velocity={x:0,z:0};
    if(this.effects.grab>0&&l)this.effects.grab=Math.max(0,this.effects.grab-dt*HAZARD_BALANCE.escapeInputBonus);
    if(this.effects.grab>0||this.effects.stone>0)return;
    this.updateNight();
    const surface=this.isAtBase?null:terrainAt(this.stage.id,this.x,this.z+this.stageOffset);
    if(this.knockback.remaining>0||this.launch||this.death||this.now()<this.knockedUntil){this.iceDrift={x:0,z:0};return;}
    if(!surface?.ice)this.iceDrift={x:0,z:0};
    if(!l){
      if(surface?.ice){const decay=Math.exp(-dt*6);this.push(this.iceDrift.x*(1-decay)/6,this.iceDrift.z*(1-decay)/6);this.iceDrift.x*=decay;this.iceDrift.z*=decay;}
      return;
    }
    if(this.seat!==null)this.standUp();
    if(this.training)this.toggleTraining();
    const baseSpeed=slow?Math.min(BALANCE.slowWalkSpeed,this.movementSpeed):this.movementSpeed;
    const unboosted=baseSpeed*(surface?.slow??1);
    const speed=unboosted;
    this.facing = {x: dx/l, z: dz/l};this.velocity={x:dx/Math.max(1,l)*speed,z:dz/Math.max(1,l)*speed};
    const scale = l > 1 ? 1 / l : 1;
    const beforeX=this.x,beforeZ=this.z;
    // Re-sample short segments so a long frame cannot skip a narrow water tile.
    const steps=Math.max(1,Math.ceil(baseSpeed*dt/.2));
    for(let i=0;i<steps;i++){
      const ground=this.isAtBase?null:terrainAt(this.stage.id,this.x,this.z+this.stageOffset);
      const distance=baseSpeed*(ground?.slow??1)*dt/steps;
      this.push(dx*scale*distance,dz*scale*distance);
    }
    if(surface?.bridge&&this.stage.id===17)this.push(0,(this.x<surface.center?1:-1)*Math.min(.5,unboosted*.25)*dt);
    if(surface?.ice){const glide=Math.min(1.2,speed*.3);this.iceDrift={x:this.facing.x*glide,z:this.facing.z*glide};}
    if(dt>0)this.velocity={x:(this.x-beforeX)/dt,z:(this.z-beforeZ)/dt};
    if (!this.deadline && !this.isAtBase) {
      this.deadline = this.now() + this.duration * 1000;
      this.progression.firstHitUsed=false;this.progression.lastStandUsed=false;
      if(this.stage.id>4)this.unlockHealth();
      this.emit("expedition_start");
    }
  }
  updateNight() {
    if(this.roomManaged)return;
    this.applyNightEggWeights();
    if (this.now() < this.nightAt) return;
    const onset = this.nightAt + Math.floor((this.now()-this.nightAt)/BALANCE.nightInterval)*BALANCE.nightInterval;
    this.nightAt = onset + BALANCE.nightInterval;
    this.nightUntil = onset + BALANCE.nightDuration;
    // Night closes the expedition, including dropped field eggs.
    if(!this.isAtBase||this.carried)this.failExpedition('night');
    this.openedShortcuts=[];
    this.openingShortcuts={};
    this.mobs=[];
    this.spawn();
    this.resetBosses();
    this.announcement='밤이 깊어 나가지 못해요';
    this.announcementId++;this.emit('night_refresh');this.revision++;
  }
  tick(dt:number){
    this.updateNight();
    for(const [key,at] of Object.entries(this.openingShortcuts))if(this.now()>=at+650){const stage=Number(key);if(!this.openedShortcuts.includes(stage))this.openedShortcuts.push(stage);delete this.openingShortcuts[stage];this.revision++;}
    if(this.death){if(this.reviveAdUntil===null&&this.deathChoiceRemaining<=0)this.failExpedition('hp');return;}
    if(dt<=0)return;
    for(let left=dt;left>1e-9&&!this.death;left-=PROGRESSION.simulationStep)this.tickStep(Math.min(left,PROGRESSION.simulationStep));
  }
  private tickStep(dt:number){
    if(!this.roomManaged){this.tickPetIncome(dt);this.save.productionAt=this.now();this.save.productionActiveAt=this.now();}
    this.syncStage();
    if(this.knockback.remaining>0){const step=Math.min(dt,this.knockback.remaining);this.push(this.knockback.x*step,this.knockback.z*step);this.knockback.remaining-=step;}
    this.hp=Math.min(this.hp,this.maxHp);
    if(this.death)return;
    this.immunity=Math.max(0,this.immunity-dt);this.slowRemaining=Math.max(0,this.slowRemaining-dt);this.sinceHit+=dt;
    for(const key of Object.keys(this.effects) as (keyof typeof this.effects)[])this.effects[key]=Math.max(0,this.effects[key]-dt);
    if(!this.isAtBase){
      const near=this.near;
      if(near&&!this.progression.seenEggs.includes(near.type)){this.progression.seenEggs.push(near.type);this.progression.pendingXP+=PROGRESSION.discoveryXP;this.revision++;this.emit('egg_discovered',{type:near.type});}
      const reached=Math.floor(this.distance/PROGRESSION.distanceStep),old=Math.floor(this.progression.distanceRecord/PROGRESSION.distanceStep);
      if(reached>old){this.progression.pendingXP+=(reached-old)*PROGRESSION.distanceXP;this.progression.distanceRecord=this.distance;this.revision++;}
      this.hazards.tick(dt,this.stage.id,{x:this.x,z:this.z,vx:this.velocity.x,vz:this.velocity.z,facing:this.facing,carrying:!!this.carried,metal:!!this.carried&&[2,17].includes(this.stage.id),moving:Math.hypot(this.velocity.x,this.velocity.z)>.01,stageOffset:this.stageOffset,guardianAwake:this.pursuing>=0&&Math.hypot(this.bosses[this.pursuing].x-this.x,this.bosses[this.pursuing].z-this.z)<12,guardianStage:this.bosses[this.pursuing]?.stageId,guardianOffset:((this.bosses[this.pursuing]?.stageId??this.stage.id)-this.progression.stage)*ROUTE.length},h=>this.applyHazard(h),(x,z)=>this.push(x,z),(key,seconds)=>{if(key in this.effects)this.effects[key as keyof typeof this.effects]=seconds;},!!this.carried&&EGGS[this.carried.type].tier===6,this.now());
      const clue=this.save.dragonClues![this.stage.id]??=newDragonClue();
      observeDragon(clue,this.dragonWatch,this.stage.id,dt,{x:this.x,z:this.z,offset:this.stageOffset,hit:Number.isFinite(this.hitAt)?this.hitAt:0,egg:this.carried?.stageId===this.stage.id?this.carried.id:null,moving:Math.hypot(this.velocity.x,this.velocity.z)>.01},this.hazards.attacks);
    }else {this.hazards.reset();this.dragonWatch={stage:0,observed:{}};}
    for(const drop of [...this.dustDrops])if(Math.hypot(drop.x-this.x,drop.z-this.z)<1){this.save.dust=add(this.save.dust,drop.amount);this.dustDrops=this.dustDrops.filter(d=>d!==drop);this.revision++;}
    if (this.training && this.nearGym) {
      const before=this.progressionSpeed;
      this.save.trainingProgress=trainingProgressAfter(this.save.trainingProgress??0,dt,this.save.upgrades.training);
      this.trainingClock+=dt;this.trainingGain+=this.progressionSpeed-before;
      while(this.trainingClock+1e-9>=1){
        const amount=this.trainingGain/this.trainingClock;
        this.emit('training_gain',{amount});this.trainingClock=Math.max(0,this.trainingClock-1);this.trainingGain=Math.max(0,this.trainingGain-amount);
      }
    }else{
      this.trainingClock=this.trainingGain=0;
    }
    if(!this.roomManaged)this.tickBosses(dt);
    if(this.isAtBase&&!this.death)this.hp=this.maxHp;


    if (this.isAtBase && this.deadline) {
      if (this.carried) {
        if (this.save.eggs.length < this.eggCapacity) {
          const e = this.carried;
          if(e.stageId){const clue=this.save.dragonClues![e.stageId]??=newDragonClue();if(DRAGON_RULES[e.stageId-1].avoid.every(id=>clue.avoided.includes(id)))clue.returned=true;}
          this.emit("egg_saved", {id:e.id,type:e.type,stageId:e.stageId??0,variant:e.variant??-1,special:e.special?1:0});
          this.emit("expedition_success", {distance: Math.floor(e.distance)});
          this.save.eggs.push({
            id: e.id,stageId:e.stageId,variant:e.variant,special:e.special,weightG:e.weightG,standardWeightG:e.standardWeightG,
            type: e.type,
            hp: e.hp,
            hpVersion:e.hpVersion,
            distance: e.distance,
          });
          this.save.selected ??= e.id;
          const guardian=this.bosses[e.guardian??-1];
          if(guardian?.target===e.id){
            guardian.x=guardian.homeX??0;guardian.z=guardian.homeZ??-17;
            guardian.mode='idle';guardian.target=null;guardian.loot=null;
            guardian.wakeRemaining=guardian.windup=guardian.lookX=guardian.lookZ=undefined;
          }
          if (!this.save.discovered.includes(e.type))
            this.save.discovered.push(e.type);
          this.save.best = Math.max(this.save.best, e.distance);
          this.progression.pendingXP+=PROGRESSION.returnXP[EGGS[e.type].tier];
          const completed=e.stageId??this.progression.stage;
          if(!this.progression.completedStages.includes(completed))this.progression.completedStages.push(completed);
          if(completed>=PROGRESSION.unlockStage)this.unlockHealth();
          this.returnReward = {type:e.type, distance:e.distance,stageId:e.stageId,variant:e.variant,special:e.special,weightG:e.weightG,standardWeightG:e.standardWeightG};
          this.message = `${EGGS[e.type].name} 보관 완료! 부화실에서 만나봐요`;
          this.carried = null;
          this.revision++;
        } else {
          this.message = "알 보관함이 가득 찼어요. 부화실에서 알을 깨주세요.";
        }
      }
      if (!this.carried){this.deadline=0;this.settleXP(true);}
    }
    if(this.roomManaged)return; // Room automatic damage is settled above, once.
    this.autoClock += dt;
    const interval = 1 / (BALANCE.baseAutoRate + BALANCE.autoRatePerLevel * this.save.upgrades.rate);
    if (this.autoClock + 1e-9 >= interval) {
      const hits = Math.floor((this.autoClock + 1e-9) / interval);
      this.autoClock = Math.max(0, this.autoClock - hits * interval);
      this.damage(
        hits * this.dps * interval,
      );
    }
  }
  interact() {
    this.updateNight();
    if(this.death)return;
    if(this.nearShortcut){this.openShortcut();return;}
    if(!this.carried&&this.nearSeat>=0){this.toggleSeat();return;}
    if (this.nearGym && !this.carried) { this.toggleTraining(); return; }
    if (this.launch || this.now()<this.knockedUntil) return;
    if (this.carried) {
      this.carried.x = this.x;
      this.carried.z = this.z;
      this.emit("egg_drop", {type: this.carried.type});
      this.world.push(this.carried);
      this.carried = null;
      this.message = "알을 내려놓았어요";
    } else if (this.near) {
      this.pickup(this.near);
    } else this.message = "길을 따라 위쪽으로 탐험하세요. 기지는 아래쪽이에요";
    this.revision++;
  }
  pickup(egg:WorldEgg){
      if(this.carried||this.knockback.remaining>0||this.death||this.now()<this.knockedUntil)return;
      this.applyNightEggWeight(egg);
      egg.pickedUp=true;
      ensureEggWeight(egg);
      // Pickup remains available below the recommended recovery stat.
      this.carried = egg;
      this.emit("egg_pickup", {type: this.carried.type});
      this.world = this.world.filter((e) => e !== this.carried);
      const region = this.carried.region ?? EGGS[this.carried.type].region;
      this.carried.region = region;
      this.carried.stageId??=this.stage.id;
      this.carried.guardian??=Math.max(0,this.carried.stageId-this.progression.stage);
      this.bossWakeAt=this.now()+ROUTE.bossWakeSeconds*1000;
      if(this.personalBosses&&!this.localBossSimulation){this.revision++;return;}
      const boss = this.bosses[this.carried.guardian];
      if(!boss){this.revision++;return;}
      // Recovered eggs remain in the world and can be stolen during the return trip.
      boss.loot = null;
      const sleeping=boss.mode==='idle';
      if(sleeping){boss.mode='waking';boss.wakeRemaining=ROUTE.bossWakeSeconds;}
      else if(boss.mode!=='waking'){boss.mode='chase';boss.wakeRemaining=undefined;}
      boss.target = this.carried.id;
      this.message = sleeping?`보스가 깨어나는 중이에요! ${ROUTE.bossWakeSeconds}초 뒤 추격해요.`:'알을 들었어요. 기지로 돌아가세요!';
    this.revision++;
  }
  get tapDamage(){return tapDamageValue(this.save.upgrades.tap,this.clickMultiplier);}
  tap() {
    if (!this.selected || this.selected.hp === 0 || this.result !== null || this.now() - this.lastTap < BALANCE.tapInterval) return false;
    this.lastTap = this.now();
    const egg=this.selected,before=egg.hp;
    this.damage(this.tapDamage);
    this.emit("hatch_manual_hit",{egg:egg.id,damage:before-egg.hp,hp:egg.hp});
    return true;
  }
  damage(amount: number) {
    const e = this.selected;
    if (!e || e.hp === 0 || this.result !== null) return;
    e.hp = Math.max(0, e.hp - amount);
    if (e.hp === 0) { this.message = '부화 준비 완료! 보관소에서 획득하세요.'; this.revision++; }
  }
  get petCount(){return this.save.mongles.reduce((sum,count)=>sum+count,0);}
  get petCapacity(){return Math.max(1,this.progression.level)*BALANCE.petsPerLevel;}
  get petStorageFull(){return this.petCount>=this.petCapacity;}
  claimHatch(id: string) {
    const e = this.save.eggs.find(egg => egg.id === id);
    if (!this.isAtBase || this.death || this.result !== null || !e || e.hp !== 0) return false;
    if(this.petStorageFull){this.message=`펫 보관함이 가득 찼어요 (${this.petCount}/${this.petCapacity}). 레벨을 올리거나 펫을 판매해 주세요.`;return false;}
    if (e.hp === 0) {
      const pool = MONGLES.flatMap((m,i)=>(e.type===WEEKLY_EVENT.eggType?i===WEEKLY_EVENT.petId:i!==WEEKLY_EVENT.petId&&m.tier===EGGS[e.type].tier&&(e.stageId?m.stageId===e.stageId&&(e.variant===ULTRA_SECRET.eggVariant?m.species===30:e.variant===5?m.species===10:m.species!==10&&m.species!==30):m.stageId===0&&m.region===EGGS[e.type].region))?[i]:[]);
      const m = pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))];
      this.emit("mongle_obtained", {mongle: m});
      if(!this.progression.hatchedPets.includes(m)){this.progression.hatchedPets.push(m);this.gainXP(PROGRESSION.hatchXP);}
      ensureEggWeight(e);
      const hatched=addPetLot(this.save,m,{weightG:e.weightG!,standardWeightG:e.standardWeightG!});
      this.save.mongles[m]++;
      this.save.obtainedPets??=[];if(!this.save.obtainedPets.includes(m))this.save.obtainedPets.push(m);
      if (!this.save.active.includes(m) && this.save.active.length < BALANCE.maxCompanions)
        {this.save.active.push(m);(this.save.activeLots??=[]).push(hatched.key);}
      this.save.dust=add(this.save.dust,stageReward(e.stageId??1,OVERHAUL.rewardMinutes.egg,EGGS[e.type].tier));
      this.save.eggs = this.save.eggs.filter((v) => v.id !== e.id);
      this.save.selected = null;
      this.result = m;
      this.resultWeight={weightG:e.weightG,standardWeightG:e.standardWeightG};
      this.message = `${MONGLES[m].name} 탄생! 별가루 +${formatNumber(stageReward(e.stageId??1,OVERHAUL.rewardMinutes.egg,EGGS[e.type].tier))}`;
      this.revision++;
    }
    return true;
  }
  get weeklyIndex(){return (this.save.weekly?.claimed??0)%7;}
  redeemCoupon(value:string){
    const code=value.trim().toUpperCase();
    if(!Object.hasOwn(COUPONS,code))return 'COUPON_INVALID';
    if(this.save.redeemedCoupons?.includes(code))return 'COUPON_USED';
    if(!this.isAtBase||this.death)return 'RETURN_TO_BASE';
    if(this.result!==null)return 'COUPON_HATCH_PENDING';
    if(this.save.eggs.length>=this.eggCapacity)return 'COUPON_INVENTORY_FULL';
    const stageId=1,variant=randomNormalEggVariant(this.random);
    const type=2*REGIONS.length,id=`coupon-${code}`;
    const egg:Egg={id,type,stageId,variant,hp:eggMaxHp({type,stageId}),hpVersion:5,distance:0};
    Object.assign(egg,rollEggWeight(egg,this.random));
    this.save.eggs.push(egg);this.save.selected??=id;
    if(!this.save.discovered.includes(type))this.save.discovered.push(type);
    (this.save.redeemedCoupons??=[]).push(code);
    this.message=`쿠폰 사용 완료 · ${STAGES[stageId-1].name} A급 시작 알 1개를 받았어요!`;
    this.revision++;this.emit('coupon_redeemed',{code,stage:stageId});return null;
  }
  weeklyReward(day:number){return stageReward(this.growthStage,OVERHAUL.weeklyMinutes[day]);}
  get adReward(){return stageReward(this.growthStage,OVERHAUL.rewardMinutes.ad);}
  claimAdReward(){const day=weeklyDay(this.now());const state=this.save.adRewards??={day,count:0};if(state.day!==day){state.day=day;state.count=0;}if(state.count>=OVERHAUL.adDailyLimit)return 0;state.count++;this.save.dust=add(this.save.dust,this.adReward);this.revision++;return this.adReward;}
  get canClaimWeekly(){return weeklyDay(this.now())>(this.save.weekly?.lastDay??-1);}
  claimWeekly(){
    if(!this.isAtBase||this.death){this.message='농장으로 돌아오면 받을 수 있어요';return false;}
    if(this.result!==null){this.message='부화 결과를 확인한 뒤 받아 주세요';return false;}
    if(!this.canClaimWeekly){this.message='오늘 보상은 이미 받았어요';return false;}
    const index=this.weeklyIndex;
    if(index===6&&this.save.eggs.length>=this.eggCapacity){this.message='알 보관함 한 칸을 비워 주세요';return false;}
    const day=weeklyDay(this.now()),claimed=this.save.weekly?.claimed??0;
    this.save.dust=add(this.save.dust,this.weeklyReward(index));
    if(index===6){
      const id=`weekly-${claimed+1}-${day}`,type=WEEKLY_EVENT.eggType;
      this.save.eggs.push({id,type,hp:eggMaxHp({type}),hpVersion:5,distance:0,...rollEggWeight({type},this.random)});
      this.save.selected??=id;
      if(!this.save.discovered.includes(type))this.save.discovered.push(type);
    }
    this.save.weekly={claimed:claimed+1,lastDay:day};
    this.message=index===6?'별리본 루미가 태어나는 전용 S급 알 1개를 받았어요!':`${index+1}일차 보상을 받았어요`;
    this.emit('weekly_reward',{day:index+1});this.revision++;return true;
  }
  offline(seconds: number) {
    if(!Number.isFinite(seconds)||seconds<=0)return 0;
    const elapsed=Math.min(BALANCE.offlineCap,Math.max(0,(this.now()-(this.save.productionAt??this.save.lastSavedAt))/1000)),before=this.save.dust;
    this.settleProduction(this.now());
    if(!this.roomManaged)this.damage(elapsed*this.dps);
    this.offlineReward=subtract(this.save.dust,before);
    return this.offlineReward;
  }
  buyTrail(id: number) {
    const trail = TRAILS[id];
    if (!trail || !Number.isInteger(id)) return false;
    this.save.trails ??= [0];
    if (!this.save.trails.includes(id)) {
      if (compare(this.save.dust,trail.cost)<0) return false;
      this.save.dust = subtract(this.save.dust,trail.cost);
      this.save.trails.push(id);
      this.emit("trail_purchase", {trail:id});
    }
    this.save.equippedTrail = id;
    this.revision++;
    return true;
  }
  discoveryReward(id: number) { const pet=MONGLES[id];return pet?stageReward(Math.max(1,pet.stageId),OVERHAUL.rewardMinutes.discovery,pet.tier):0; }
  claimPet(id: number) {
    if (!MONGLES[id] || !this.hasDiscoveredPet(id) || this.save.claimedPets?.includes(id)) return 0;
    const reward=this.discoveryReward(id);
    (this.save.claimedPets??=[]).push(id);this.save.dust=add(this.save.dust,reward);this.revision++;
    this.emit("collection_reward",{pet:id,reward});return reward;
  }
  claimRegion(region: number) {
    if (!REGIONS[region] || this.save.claimedRegions?.includes(region) || MONGLES.some((m,i)=>i<100&&m.stageId===0&&m.region===region&&!this.hasDiscoveredPet(i))) return 0;
    const reward=BALANCE.regionCollectionRewards[region];
    (this.save.claimedRegions??=[]).push(region);this.save.dust=add(this.save.dust,reward);this.revision++;return reward;
  }
  claimCollection() {
    if (this.save.claimedCollection || MONGLES.some((m,i)=>i<100&&m.stageId===0&&!this.hasDiscoveredPet(i))) return 0;
    this.save.claimedCollection=true;this.save.dust=add(this.save.dust,stageReward(this.growthStage,OVERHAUL.rewardMinutes.collection));this.revision++;return stageReward(this.growthStage,OVERHAUL.rewardMinutes.collection);
  }
  claimStage(stage:number){
    if(!Number.isInteger(stage)||!STAGES[stage-1]||this.save.claimedStages?.includes(stage)||MONGLES.some((m,i)=>m.stageId===stage&&collectionEligible(m)&&!this.hasDiscoveredPet(i)))return 0;
    const reward=STAGE_COLLECTION_REWARDS[stage-1];
    (this.save.claimedStages??=[]).push(stage);this.save.dust=add(this.save.dust,reward);this.revision++;return reward;
  }
  claimStageCollection(){
    if(this.save.claimedStageCollection||MONGLES.some((m,i)=>m.stageId>0&&collectionEligible(m)&&!this.hasDiscoveredPet(i)))return 0;
    this.save.claimedStageCollection=true;this.save.dust=add(this.save.dust,stageReward(20,OVERHAUL.rewardMinutes.collection));this.revision++;return stageReward(20,OVERHAUL.rewardMinutes.collection);
  }
  cost(k: Upgrade) {
    return growthCost(k,this.save.upgrades[k]);
  }
  upgrade(k: Upgrade) {
    const cost = this.cost(k);
    if (compare(this.save.dust,cost)<0 || this.save.upgrades[k] >= BALANCE.maxUpgrade) return false;
    this.save.dust = subtract(this.save.dust,cost);
    this.save.upgrades[k]++;
    this.emit("upgrade_purchase", {type:k, level:this.save.upgrades[k]});
    this.revision++;
    return true;
  }
  snapshot(): Save {
    this.save.explorationVersion=5;this.save.openedShortcuts=[...this.openedShortcuts];
    this.progression.hp=this.hp;this.progression.maxHP=this.maxHp;this.progression.immunity=this.immunity;this.progression.slowRemaining=this.slowRemaining;this.progression.slowMultiplier=this.slowMultiplier;
    this.save.routeVersion=3;
    this.save.death=this.death;
    this.save.nightAt = this.nightAt;
    this.save.nightUntil = this.nightUntil;
    this.save.world = this.world;
    this.save.bosses = this.bosses;
    this.save.lastSavedAt = this.now();
    this.save.expedition = this.deadline
      ? { deadline: this.deadline, x: this.x, z: this.z, carried: this.carried,hp:this.hp,sinceHit:this.sinceHit,damageTicks:this.damageTicks }
      : null;
    return structuredClone(this.save);
  }
}
