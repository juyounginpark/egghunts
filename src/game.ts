import {
  BALANCE,
  STAGE_COLLECTION_REWARDS,
  PROGRESSION,
  TRAITS,
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
import {newProgression,validateProgression,awardXP,levelHP,levelSpeed,chooseTrait,traitPoints,reducedDamage,type Progression,type TraitId} from "./progression";
import {HazardManager,type Hazard} from "./hazards";
import {farmGym,villageColliders} from './village';
import {MapCollision} from './map-collision';
import {STAGES,HAZARD_BALANCE,ROUTE,FINAL_GUARDIAN,routeStep,routeSegments,routeStage,recommendedRouteSpeed,guardianSpeed,stageDamage,type HazardDefinition} from "./stage-data";
export type Egg = { id: string; type: number; hp: number; distance: number; stageId?:number; variant?:number; special?:boolean };
export type WorldEgg = Egg & {
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
  wakeRemaining?: number;
  x: number;
  z: number;
  mode: "idle" | "waking" | "chase" | "return";
  target: string | null;
  loot: WorldEgg | null;
};
export type Save = {
  visitedStages?:number[];
  routeVersion?:1|2;
  progression?:Progression;
  death?:{x:number;z:number;at:number;remaining:number}|null;
  version: 1;
  appearance?: number;
  obtainedPets?:number[];
  trails?: number[];
  equippedTrail?: number;
  trainingSpeed?: number;
  petIncome?: { elapsed:number; pending:number };
  tutorial?: number;
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
  dust: number;
  upgrades: Record<Upgrade, number>;
  eggs: Egg[];
  mongles: number[];
  active: number[];
  discovered: number[];
  selected: string | null;
  best: number;
  lastSavedAt: number;
  expedition: {
    deadline: number;
    x: number;
    z: number;
    carried: WorldEgg | null;
    hp?:number;
    sinceHit?:number;
  } | null;
  settings: { sound: boolean; volume?:number; haptic: boolean; quality: "high" | "low" };
};
export function freshSave(now: number): Save {
  return {
    version: 1,
    trails: [0],
    equippedTrail: 0,
    dust: 0,
    upgrades: { speed: 0, carry: 0, tap: 0, damage: 0, rate: 0, time: 0, training: 0,health:0 },
    trainingSpeed: 0,
    tutorial: 0,
    eggs: [],
    mongles: Array(MONGLES.length).fill(0),
    active: [],
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
  s.obtainedPets??=Array.isArray(s.mongles)?s.mongles.flatMap((n,i)=>n?[i]:[]):[];
  if(!Array.isArray(s.obtainedPets)||!s.obtainedPets.every(i=>Number.isInteger(i)&&!!MONGLES[i])||new Set(s.obtainedPets).size!==s.obtainedPets.length)throw new Error("Invalid discovery record");
  // Older maximum HP values may contain floating-point multiplication noise.
  for(const egg of [...(Array.isArray(s.eggs)?s.eggs:[]),s.expedition?.carried]){
    if(egg&&EGGS[egg.type]&&Number.isFinite(egg.hp)){
      const max=EGGS[egg.type].hp;
      if(egg.hp>max&&egg.hp-max<=Number.EPSILON*max*8)egg.hp=max;
    }
  }
  if (s.upgrades && s.upgrades.training === undefined) s.upgrades.training = 0;
  if (s.upgrades && s.upgrades.health === undefined) s.upgrades.health = 0;
  s.trainingSpeed ??= 0;
  s.bossWarningSeen??=false;
  if(typeof s.bossWarningSeen!=='boolean')throw new Error('Invalid boss warning state');
  s.petIncome ??= {elapsed:0,pending:0};
  if(!Number.isFinite(s.petIncome.elapsed)||s.petIncome.elapsed<0||s.petIncome.elapsed>=BALANCE.petIncomeSeconds||!Number.isFinite(s.petIncome.pending)||s.petIncome.pending<0)throw new Error('Invalid pet income');
  s.visitedStages ??= [];
  if(!Array.isArray(s.visitedStages)||!s.visitedStages.every(id=>Number.isInteger(id)&&id>=1&&id<=20))throw Error('Invalid visited stages');
  if(s.death&&(![s.death.x,s.death.z,s.death.at,s.death.remaining].every(Number.isFinite)||s.death.remaining<0||Math.abs(s.death.x)>BALANCE.baseMapX||s.death.z<BALANCE.mapFarZ||s.death.z>BALANCE.mapNearZ))throw new Error("Invalid death state");
  s.appearance ??= 0;
  if(![0,1,2].includes(s.appearance))throw new Error("Invalid appearance");
  s.tutorial ??= s.mongles?.some(Boolean) ? 5 : 0;
  s.claimedPets ??= []; s.claimedRegions ??= []; s.claimedCollection ??= false;
  s.claimedStages ??= [];s.claimedStageCollection ??= false;
  if(!Array.isArray(s.claimedStages)||!s.claimedStages.every(id=>Number.isInteger(id)&&id>=1&&id<=20)||typeof s.claimedStageCollection!=='boolean')throw Error('Invalid stage collection rewards');
  if (!Array.isArray(s.claimedPets) || !s.claimedPets.every(i=>Number.isInteger(i)&&!!MONGLES[i]) || !Array.isArray(s.claimedRegions) || !s.claimedRegions.every(i=>Number.isInteger(i)&&!!REGIONS[i]) || typeof s.claimedCollection!=="boolean") throw new Error("Invalid collection rewards");
  if (s.version !== 1) throw new Error("지원하지 않는 저장 버전이에요.");
  const finite = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0;
  if (
    !finite(s.dust) ||
    !finite(s.trainingSpeed) || !Number.isInteger(s.tutorial) || s.tutorial < 0 || s.tutorial > 5 ||
    !finite(s.lastSavedAt) ||
    !finite(s.best) ||
    !s.upgrades ||
    !Object.keys(UPGRADES).every(
      (k) =>
        Number.isInteger(s.upgrades[k as Upgrade]) &&
        s.upgrades[k as Upgrade] >= 0 && s.upgrades[k as Upgrade] <= BALANCE.maxUpgrade,
    ) ||
    !Array.isArray(s.eggs) ||
    s.eggs.length > BALANCE.inventory ||
    !s.eggs.every(
      (e) =>
        Number.isInteger(e.type) &&
        !!EGGS[e.type] &&
        finite(e.hp) &&
        e.hp <= EGGS[e.type].hp &&
        typeof e.id === "string" &&
        finite(e.distance),
    ) ||
    new Set(s.eggs.map(e => e.id)).size !== s.eggs.length ||
    !Array.isArray(s.mongles) ||
    ![3, 100, 300, MONGLES.length].includes(s.mongles.length) ||
    !s.mongles.every((v) => Number.isInteger(v) && v >= 0) ||
    !Array.isArray(s.active) ||
    s.active.length > 3 ||
    new Set(s.active).size !== s.active.length ||
    !s.active.every((i) => !!MONGLES[i] && s.mongles[i] > 0) ||
    !Array.isArray(s.discovered) ||
    !s.discovered.every((i) => !!EGGS[i]) ||
    !s.settings ||
    typeof s.settings.sound !== "boolean" ||
    typeof s.settings.haptic !== "boolean" ||
    !["high", "low"].includes(s.settings.quality)
  )
    throw new Error("저장 데이터를 읽을 수 없어요. 원본은 유지됩니다.");
  s.settings.volume=typeof s.settings.volume==='number'&&Number.isFinite(s.settings.volume)?Math.max(0,Math.min(1,s.settings.volume)):1;
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
      e.hp > EGGS[e.type].hp ||
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
    if(e.variant!==undefined&&(!Number.isInteger(e.variant)||e.variant<0||e.variant>5||(e.variant===5&&(!e.stageId||EGGS[e.type].tier!==6))))throw Error('Invalid egg variation');
  }
  if(s.progression)validateProgression(s.progression);
  return s;
}
export class GameState {
  hazards=new HazardManager();
  slowRemaining=0;slowMultiplier=1;hitAt=-Infinity;levelUpAt=-Infinity;
  effects={ink:0,stone:0,grab:0,delay:0,magnet:0};
  dustDrops:{x:number;z:number;amount:number}[]=[];
  private inputHistory:{at:number;x:number;z:number}[]=[];
  private motionTime=0;
  velocity={x:0,z:0};
  get progression(){return this.save.progression!;}
  private routeStart=0;private routeCache:ReturnType<typeof routeSegments>=[];
  get route(){if(this.routeStart!==this.progression.stage){this.routeStart=this.progression.stage;this.routeCache=routeSegments(this.routeStart);}return this.routeCache;}
  get stage(){return STAGES[routeStage(this.progression.stage,this.z)-1];}
  get recommendedSpeed(){return recommendedRouteSpeed(this.route.find(r=>r.stage===this.stage.id)!.home,this.stage.id);}
  get stageOffset(){return (this.stage.id-this.progression.stage)*ROUTE.length;}
  get stageStep(){return routeStep(this.z,this.stageOffset,this.stage.id===20?ROUTE.finalLength:ROUTE.length);}
  get farZ(){return -(this.route.at(-1)!.end-3);}
  knockback={x:0,z:0,remaining:0};
  private announcedStage=0;
  private syncStage(){
    if(this.carried&&!this.inEggStage(this.carried,this.z))this.carried.secured=true;
    if(this.isAtBase){this.announcedStage=0;return;}
    const id=this.stage.id;
    if(this.announcedStage===id)return;
    this.announcedStage=id;this.hazards.reset(id);
    if(!this.isAtBase){this.emit('region_enter',{stage:id});if(id>4)this.unlockHealth();}
  }
  get level(){return this.progression.level;}
  get traitPoints(){return traitPoints(this.progression);}
  get defenses(){return this.save.active.map(id=>PET_DEFENSE[id]??{});}
  defense(key:'maxHP'|'damageReduction'|'firstHitReduction'|'statusReduction'|'lowHPSpeed'|'returnXPBonus'){return this.defenses.reduce((n,d)=>n+(d[key]??0),0);}
  trait(id:TraitId){return (this.progression.traits[id]??0)*TRAITS[id].value;}
  chooseTrait(id:TraitId){if(!this.isAtBase||!chooseTrait(this.progression,id))return false;this.hp=Math.min(this.maxHp,this.hp+(id==='sturdy'?TRAITS.sturdy.value:0));this.revision++;this.emit('trait_selected',{id});return true;}
  selectStage(id:number){
    if(!this.isAtBase||this.carried||!STAGES[id-1]||!Number.isInteger(id))return false;
    this.progression.stage=id;this.hazards.reset(id);this.resetBosses();this.spawn();this.revision++;
    if(id>PROGRESSION.unlockStage)this.unlockHealth();return true;
  }
  unlockHealth(){if(!this.progression.healthUnlocked){this.progression.healthUnlocked=true;this.emit('health_unlocked');this.revision++;}}
  gainXP(amount:number){const gained=awardXP(this.progression,amount);if(gained){this.hp=this.maxHp;this.levelUpAt=this.now();this.revivedAt=this.now();this.emit('level_up',{level:this.level,count:gained});}this.revision++;return gained;}
  settleXP(success:boolean){const xp=Math.floor(this.progression.pendingXP*(success?1+this.defense('returnXPBonus'):PROGRESSION.failureKeep));this.progression.pendingXP=0;this.gainXP(xp);this.emit('xp_settled',{xp,success:success?1:0});return xp;}
  failExpedition(reason:string){
    if(!this.deadline&&!this.carried&&!this.death&&this.isAtBase)return false;
    this.reviveAdUntil=null;
    if(this.carried)this.flyaway={stageId:this.carried.stageId,variant:this.carried.variant,type:this.carried.type,x:this.x,z:this.z,at:this.now()};
    this.carried=null;this.deadline=0;this.x=this.z=0;this.training=false;this.launch=null;this.death=null;
    this.revivedAt=this.now();
    const xp=this.settleXP(false);this.hp=this.maxHp;this.slowRemaining=0;this.effects={ink:0,stone:0,grab:0,delay:0,magnet:0};this.knockback.remaining=0;this.hazards.reset();
    if(!this.roomManaged)this.bosses.forEach(b=>{b.mode='return';b.target=null;});
    this.message=`바람을 타고 농장으로 돌아왔어요 · 경험치 ${xp} 유지`;
    this.emit(`expedition_fail_${reason}`,{xp});this.revision++;return true;
  }
  applyHazard(h:Hazard,bossContact=false){
    const d=h.definition;if(this.death||(this.immunity>0&&!bossContact)||this.isAtBase)return false;
    const reduction=this.defense('damageReduction')+this.defenses.reduce((n,p)=>n+(p.environmentReduction?.[d.id]??0),0)+(!this.progression.firstHitUsed?this.trait('shield')+this.defense('firstHitReduction'):0);
    const damage=this.immunity>0?0:reducedDamage(d.damage,d.damagePercent,this.maxHp,reduction);
    this.progression.firstHitUsed=true;this.hp=Math.max(0,this.hp-damage);this.sinceHit=0;this.immunity=PROGRESSION.hitImmunity;this.hitAt=this.now();
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
    if(d.effect==='dust'){const amount=Math.min(this.save.dust,HAZARD_BALANCE.dustDrop);this.save.dust-=amount;if(amount)this.dustDrops.push({x:this.x+.8,z:this.z,amount});}
    this.emit('player_hit',{damage,hp:this.hp,stage:this.stage.id});this.revision++;
    if(this.hp<=0&&this.defenses.some(d=>d.lastStand)&&!this.progression.lastStandUsed){this.progression.lastStandUsed=true;this.hp=1;}
    if(this.hp<=0)this.die();return true;
  }
  roomManaged=false;
  farmSlot=0;
  get gym(){return farmGym(this.farmSlot);}
  readonly mapCollision=new MapCollision();
  push(x:number,z:number){
    const width=this.z+z>=BALANCE.baseMinZ?BALANCE.baseMapX:BALANCE.mapX;
    const targetX=Math.max(-width,Math.min(width,this.x+x)),targetZ=Math.max(this.isNight?BALANCE.baseMinZ:this.farZ,Math.min(BALANCE.mapNearZ,this.z+z));
    const position=this.mapCollision.move(this.x,this.z,targetX-this.x,targetZ-this.z,this.progression.stage);
    this.x=Math.max(-width,Math.min(width,position.x));this.z=Math.max(this.isNight?BALANCE.baseMinZ:this.farZ,Math.min(BALANCE.mapNearZ,position.z));this.syncStage();
  }
  get nearStore(){return Math.hypot(this.x-BALANCE.storeX,this.z-BALANCE.storeZ)<BALANCE.storeRadius;}
  hasDiscoveredPet(id:number){return !!this.save.mongles[id]||!!this.save.obtainedPets?.includes(id);}
  eggSellPrice(type:number){return EGGS[type]?Math.floor(EGGS[type].reward*BALANCE.eggSellRatio):0;}
  petSellPrice(id:number){const pet=MONGLES[id];return pet?BALANCE.petSellPrices[pet.tier]*(pet.region+1):0;}
  sellEgg(id:string){
    if(!this.isAtBase||this.death)return 0;
    const egg=this.save.eggs.find(e=>e.id===id);if(!egg)return 0;
    const price=this.eggSellPrice(egg.type);this.save.eggs=this.save.eggs.filter(e=>e.id!==id);
    if(this.save.selected===id){this.save.selected=this.save.eggs[0]?.id??null;this.autoClock=0;}
    this.save.dust+=price;this.revision++;this.emit('egg_sold',{type:egg.type,price});return price;
  }
  sellPet(id:number){
    if(!this.isAtBase||this.death||!Number.isInteger(id)||!this.save.mongles[id])return 0;
    this.save.obtainedPets??=[];if(!this.save.obtainedPets.includes(id))this.save.obtainedPets.push(id);
    this.save.mongles[id]--;if(!this.save.mongles[id])this.save.active=this.save.active.filter(i=>i!==id);
    const price=this.petSellPrice(id);this.save.dust+=price;this.revision++;this.emit('pet_sold',{pet:id,price});return price;
  }
  death:NonNullable<Save['death']>|null=null;
  private reviveAdUntil:number|null=null;
  get deathAnimationRemaining(){return this.death?Math.max(0,(this.death.at+BALANCE.deathChoiceDelay-this.now())/1000):0;}
  get deathChoiceRemaining(){return this.death?Math.max(0,Math.min(BALANCE.deathChoiceDuration/1000,Math.ceil((this.death.at+BALANCE.deathChoiceDelay+BALANCE.deathChoiceDuration-this.now())/1000))):0;}
  private die(){
    if(this.death)return;
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
    this.hp=this.maxHp;this.sinceHit=0;this.immunity=BALANCE.reviveImmunity;this.knockedUntil=0;this.launch=null;
    this.death=null;this.reviveAdUntil=null;this.knockback.remaining=0;this.slowRemaining=0;this.effects={ink:0,stone:0,grab:0,delay:0,magnet:0};this.revivedAt=this.now();this.revision++;this.emit('player_revive',{inPlace:here?1:0});return true;
  }
  get isAtBase(){return this.z>=BALANCE.baseMinZ&&this.z<=BALANCE.mapNearZ&&Math.abs(this.x)<=BALANCE.baseMapX;}
  knockedUntil=0;
  pvpHit(hit:{x:number;z:number;until:number}){
    if(this.death)return;
    if(this.carried)this.emit('egg_drop',{type:this.carried.type,reason:'player_hit'});
    this.carried=null;this.launch=null;this.training=false;this.x=hit.x;this.z=hit.z;this.knockedUntil=hit.until;
    this.message="배트에 맞아 넘어졌어요! 들고 있던 알을 떨어뜨렸어요.";this.revision++;
  }
  hp=BALANCE.baseHp;
  sinceHit=0;
  get maxHp(){return levelHP(this.level)+this.save.upgrades.health*BALANCE.hpPerLevel+this.trait('sturdy')+this.defense('maxHP');}
  bossDamage(region:number){return stageDamage(this.bosses[region]?.stageId??this.stage.id,this.stageStep);}
  receiveHit(region:number){
    const d={damage:this.bossDamage(region),damagePercent:0,knockback:PROGRESSION.hitKnockback,slowMultiplier:PROGRESSION.hitSlow,slowDuration:PROGRESSION.hitSlowDuration,effect:'hit'} as HazardDefinition;
    return this.applyHazard({definition:d,origin:{x:this.x,z:this.z-1}} as Hazard);
  }
  training = false;
  private trainingClock=0;
  private trainingGain=0;
  get movementMultiplier(){return TRAILS[this.save.equippedTrail??0].multiplier*this.speedMultiplier;}
  get effectiveTrainingRate(){return this.trainingRate*this.movementMultiplier*levelSpeed(this.level)*(1+this.trait('light'));}
  get trainingSpeedBonus(){return (this.save.trainingSpeed??0)*this.movementMultiplier;}
  returnReward: { type: number; distance: number; stageId?:number;variant?:number;special?:boolean } | null = null;
  get nearGym() { return Math.hypot(this.x-this.gym.x,this.z-this.gym.z)<BALANCE.gymRadius; }
  get trainingRate() { return BALANCE.trainingPerSecond + BALANCE.trainingPerLevel*this.save.upgrades.training; }
  toggleTraining(){
    if(!this.isAtBase||this.carried||this.death||this.launch||this.knockback.remaining>0||this.now()<this.knockedUntil)return false;
    this.training=!this.training;
    this.trainingClock=this.trainingGain=0;
    if(this.training){this.x=this.gym.x;this.z=this.gym.z;this.velocity={x:0,z:0};this.facing={x:0,z:-1};}
    this.message=this.training?'운동 중 · 조이스틱으로 이동하면 운동을 마쳐요.':'운동을 마쳤어요.';
    this.revision++;return true;
  }
  petIncomeStageMultiplier(id:number){const pet=MONGLES[id];return pet.stageId||BALANCE.petIncomeLegacyStageMultipliers[pet.region];}
  petIncomeAmount(id:number){return BALANCE.petIncomeByTier[MONGLES[id].tier]*this.petIncomeStageMultiplier(id);}
  get petIncomePerCycle(){return this.save.active.reduce((sum,id)=>sum+this.petIncomeAmount(id),0);}
  private tickPetIncome(dt:number){
    const income=this.save.petIncome??={elapsed:0,pending:0};
    if(!this.save.active.length&&income.pending<1)return;
    income.elapsed+=dt;
    income.pending+=this.petIncomePerCycle*dt/BALANCE.petIncomeSeconds;
    if(income.elapsed+1e-9<BALANCE.petIncomeSeconds)return;
    income.elapsed=Math.max(0,income.elapsed-BALANCE.petIncomeSeconds);
    const amount=Math.floor(income.pending+1e-9);
    income.pending=Math.max(0,income.pending-amount);
    if(amount){this.save.dust+=amount;this.revision++;this.emit('pet_income',{amount});}
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
  private resetBosses(){
    this.bosses=this.route.map(r=>({x:-2.6,z:-r.home-7,homeX:-2.6,homeZ:-r.home-7,stageId:r.stage,mode:'idle',target:null,loot:null}));
    const z=-this.route.at(-1)!.end+FINAL_GUARDIAN.bossEndOffset;
    this.bosses.push({x:0,z,homeX:0,homeZ:z,stageId:20,final:true,mode:'idle',target:null,loot:null});
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
  ) {
    this.mapCollision.setFarm(villageColliders());
    if(!save.progression){save.progression=newProgression();save.progression.seenEggs=[...save.discovered];save.progression.hatchedPets=save.mongles.flatMap((n,i)=>n?[i]:[]);save.progression.distanceRecord=save.best;}
    validateProgression(save.progression);
    if(save.routeVersion===1){
      const stretch=(z:number)=>z<-ROUTE.entrance?-ROUTE.entrance+(z+ROUTE.entrance)*3:z;
      const eggs=new Set([...(save.world??[]),...(save.expedition?.carried?[save.expedition.carried]:[]),...(save.bosses??[]).flatMap(b=>b.loot?[b.loot]:[])]);
      for(const egg of eggs){egg.z=stretch(egg.z);if(egg.homeZ!==undefined)egg.homeZ=stretch(egg.homeZ);}
      for(const boss of save.bosses??[]){boss.z=stretch(boss.z);if(boss.homeZ!==undefined)boss.homeZ=stretch(boss.homeZ);}
      if(save.expedition)save.expedition.z=stretch(save.expedition.z);
      // Stretch the distance record with the route so migration grants no distance XP.
      save.progression.distanceRecord=-stretch(-save.progression.distanceRecord);
      save.routeVersion=2;
    }
    const oldEntrance=save.progression.stage;
    if(oldEntrance!==1){
      const offset=(oldEntrance-1)*ROUTE.length;save.progression.stage=1;
      for(const egg of [...(save.world??[]),...(save.expedition?.carried?[save.expedition.carried]:[])]){egg.z-=offset;if(egg.homeZ!==undefined)egg.homeZ-=offset;egg.guardian=egg.special?20:(egg.stageId??oldEntrance)-1;egg.stageId??=oldEntrance;}
      for(const b of save.bosses??[]){b.z-=offset;if(b.homeZ!==undefined)b.homeZ-=offset;}
      if(save.expedition&&save.expedition.z<BALANCE.baseMinZ)save.expedition.z-=offset;
    }

    this.hp=Math.min(this.maxHp,save.progression.hp);this.immunity=save.progression.immunity;this.slowRemaining=save.progression.slowRemaining;this.slowMultiplier=save.progression.slowMultiplier;
    const cycle = Math.floor(this.now()/BALANCE.nightInterval)*BALANCE.nightInterval;
    this.nightAt = cycle + BALANCE.nightInterval;
    this.nightUntil = this.now()-cycle < BALANCE.nightDuration ? cycle+BALANCE.nightDuration : 0;
    this.resetBosses();this.spawn();
    if (!save.world && !save.discovered.length && !save.eggs.length && !save.mongles.some(Boolean)) {
      const starter = this.world[2];
      starter.type = 0; starter.hp = EGGS[0].hp;
    }
    if (
      save.world &&
      save.bosses &&
      save.routeVersion === 2 && [21-oldEntrance,22-oldEntrance].includes(save.bosses.length) &&
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
      this.world = [...this.world.filter(e=>e.stageId!<oldEntrance||(e.special&&!save.bosses!.some(b=>b.final))),...save.world];
      this.bosses.splice(oldEntrance-1,save.bosses.length,...save.bosses);
    }
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
      this.hp=Number.isFinite(save.expedition.hp)?Math.max(0,Math.min(this.maxHp,save.expedition.hp!)):this.maxHp;
      this.sinceHit=Number.isFinite(save.expedition.sinceHit)?Math.max(0,save.expedition.sinceHit!):0;
    }
    if(save.routeVersion!==2&&this.carried){
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
  get clickMultiplier() { return this.save.active.reduce((n,i)=>n*MONGLES[i].clickMultiplier,1); }
  get autoMultiplier() { return this.save.active.reduce((n,i)=>n*MONGLES[i].autoMultiplier,1); }
  get speedMultiplier() { return this.save.active.reduce((n,i)=>n*MONGLES[i].speedMultiplier,1); }
  get speed() {
    if(this.isAtBase)return BALANCE.speed;
    return (
      this.movementMultiplier * levelSpeed(this.level) * (1+this.trait('light')) * (this.hp/this.maxHp<=PROGRESSION.lowHP?1+this.trait('escape')+this.defense('lowHPSpeed'):1) * (this.slowRemaining>0?this.slowMultiplier:1) * (this.effects.magnet>0?.8:1) *
      (BALANCE.speed *
      (1 +
        BALANCE.speedPerLevel * this.save.upgrades.speed) + (this.save.trainingSpeed ?? 0)) *
      (this.carried
        ? Math.min(
            1,
            (1-(1-EGGS[this.carried.type].weight)*(1-this.trait('porter'))) *
              (1 + BALANCE.carryPerLevel * this.save.upgrades.carry),
          )
        : 1)
    );
  }
  get duration() {
    return (
      BALANCE.duration +
      BALANCE.timePerLevel * this.save.upgrades.time + this.trait('clock')
    );
  }
  get dps() {
    return (
      (BALANCE.baseAutoDamage + BALANCE.autoDamagePerLevel * this.save.upgrades.damage) *
        (BALANCE.baseAutoRate + BALANCE.autoRatePerLevel * this.save.upgrades.rate) * this.autoMultiplier
    );
  }
  get remaining() {
    return this.deadline
      ? Math.max(0, (this.deadline - this.now()) / 1000)
      : this.duration;
  }
  get distance() {
    return Math.hypot(this.x, this.z);
  }
  canReachEgg(e:WorldEgg) {
    return Math.hypot(e.x-this.x,e.z-this.z)<BALANCE.interaction+(e.id.startsWith('net-')?0:Math.max(0,RARITIES[EGGS[e.type].tier].scale*.3-.3));
  }
  get near() {
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
    if(this.nearStore&&!this.carried&&!this.near&&!this.training)return "판매하기";
    if (this.nearGym && !this.carried) return this.training ? "운동 내리기" : "운동 시작";
    return this.carried ? "내려놓기" : this.near ? "들고가기" : "배트 스윙";
  }
  spawn() {
    this.world = this.route.flatMap((boss, guardian) =>
      Array.from({ length: 5 }, (_, slot) => {
        const region=Math.floor((boss.stage-1)/4);
        const type = rollEgg(region, this.random);
        const x = (slot - 2) * 1.6,
          z = -boss.home + Math.abs(slot - 2) * 0.45;
        return {
          id: `${boss.stage}-${slot}-${this.now()}-${this.random()}`,
          type,
          hp: EGGS[type].hp,
          distance: Math.abs(z),
          x,
          z,
          homeX: x,
          homeZ: z,
          region,stageId:boss.stage,variant:EGGS[type].tier===6&&this.random()<BALANCE.secretDragonEggShare?5:slot,guardian,
          secured: false,
          expires: this.now() + BALANCE.nightInterval,
        };
      }),
    );
    const rare=RARITIES.slice(FINAL_GUARDIAN.minimumEggTier);
    let roll=this.random()*rare.reduce((sum,r)=>sum+r.chance,0);
    const choice=rare.findIndex(r=>(roll-=r.chance)<0),tier=FINAL_GUARDIAN.minimumEggTier+(choice<0?rare.length-1:choice);
    const type=tier*REGIONS.length+REGIONS.length-1,z=-this.route.at(-1)!.end+FINAL_GUARDIAN.eggEndOffset;
    this.world.push({id:`final-${this.now()}-${this.random()}`,type,hp:EGGS[type].hp,distance:-z,x:0,z,homeX:0,homeZ:z,region:4,stageId:20,variant:tier===6&&this.random()<BALANCE.secretDragonEggShare?5:Math.floor(this.random()*5),guardian:this.bosses.length-1,special:true,secured:false,expires:this.now()+BALANCE.nightInterval});
  }
  get nightRemaining() {
    return Math.max(0, Math.ceil((this.nightAt - this.now()) / 1000));
  }
  get isNight() {
    return this.now() < this.nightUntil;
  }
  get pursuing() {
    return this.bosses.findIndex((b) => b.mode === "chase");
  }
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
  tickBosses(dt:number,only?:number){
    this.bosses.forEach((b,guardian)=>{
      if(only!==undefined&&guardian!==only)return;
      if((b.mode==='chase'||b.mode==='waking')&&this.carried?.id!==b.target){b.mode='return';b.target=null;b.wakeRemaining=undefined;}
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
      if(b.mode!=='chase'){
        b.loot=this.world.find(e=>e.id===b.loot?.id)??null;
        recovery=b.loot??this.world.find(e=>e.guardian===guardian&&!e.secured&&this.inEggStage(e,e.z)&&(e.x!==e.homeX||e.z!==e.homeZ));
        if(recovery)b.mode='return';
      }
      const tx=b.mode==='chase'?this.x:recovery?(b.loot?recovery.homeX??0:recovery.x):b.homeX??0;
      const tz=b.mode==='chase'?this.z:recovery?(b.loot?recovery.homeZ??b.homeZ??-17:recovery.z):b.homeZ??-17;
      const recoveryMultiplier=recovery?ROUTE.bossRecoverySpeedMultiplier:1;
      const dx=tx-b.x,dz=tz-b.z,l=Math.hypot(dx,dz),step=Math.min(l,guardianSpeed(b.stageId??1)*recoveryMultiplier*activeDt);
      if(l>1.8||b.mode==='return'){b.x+=dx/(l||1)*step;b.z+=dz/(l||1)*step;}
      b.windup=undefined;
      if(b.mode==='chase'&&!this.isAtBase&&Math.hypot(this.x-b.x,this.z-b.z)<=ROUTE.bossReach*ROUTE.bossAngryScale*(b.final?FINAL_GUARDIAN.scale:1)){
        const d={damage:stageDamage(b.stageId??1,b.final?3:this.stageStep),damagePercent:0,knockback:Math.min(ROUTE.bossMaxKnockback,guardianSpeed(b.stageId??1)*ROUTE.bossKnockbackPerSpeed),slowMultiplier:PROGRESSION.hitSlow,slowDuration:PROGRESSION.hitSlowDuration,effect:'hit'} as HazardDefinition;
        this.applyHazard({definition:d,origin:{x:b.x,z:b.z}} as Hazard,true);
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
  move(dx: number, dz: number, dt: number) {
    this.motionTime+=dt;
    this.inputHistory.push({at:this.motionTime,x:dx,z:dz});this.inputHistory=this.inputHistory.filter(v=>v.at>=this.motionTime-1);
    if(this.effects.delay>0){const delayed=this.inputHistory.filter(v=>v.at<=this.motionTime-HAZARD_BALANCE.inputDelay).at(-1);dx=delayed?.x??0;dz=delayed?.z??0;}
    const l = Math.hypot(dx, dz);this.velocity={x:0,z:0};
    if(this.effects.grab>0&&l)this.effects.grab=Math.max(0,this.effects.grab-dt*HAZARD_BALANCE.escapeInputBonus);
    if(this.effects.grab>0||this.effects.stone>0)return;
    this.updateNight();
    if (!l || this.knockback.remaining>0 || this.launch || this.death || this.now()<this.knockedUntil) return;
    if(this.training)this.toggleTraining();
    this.facing = {x: dx/l, z: dz/l};this.velocity={x:dx/Math.max(1,l)*this.speed,z:dz/Math.max(1,l)*this.speed};
    const scale = l > 1 ? 1 / l : 1;
    const beforeX=this.x,beforeZ=this.z;
    this.push(dx*scale*this.speed*dt,dz*scale*this.speed*dt);
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
    if (this.now() < this.nightAt) return;
    const onset = this.nightAt + Math.floor((this.now()-this.nightAt)/BALANCE.nightInterval)*BALANCE.nightInterval;
    this.nightAt = onset + BALANCE.nightInterval;
    this.nightUntil = onset + BALANCE.nightDuration;
    // Night closes the expedition, including dropped field eggs.
    if(!this.isAtBase||this.carried)this.failExpedition('night');
    this.spawn();
    this.resetBosses();
    const secret=this.world.some(e=>EGGS[e.type].tier===6);
    this.announcement=secret?'SECRET · 아침에 희귀 알을 찾아보세요':'밤에는 농장에서 쉬어요 · 아침에 입구가 열려요';
    this.announcementId++;this.emit('night_refresh');this.revision++;
  }
  tick(dt:number){
    this.updateNight();
    if(this.death){if(this.reviveAdUntil===null&&this.deathChoiceRemaining<=0)this.failExpedition('hp');return;}
    if(dt<=0)return;
    for(let left=dt;left>1e-9&&!this.death;left-=PROGRESSION.simulationStep)this.tickStep(Math.min(left,PROGRESSION.simulationStep));
  }
  private tickStep(dt:number){
    this.tickPetIncome(dt);
    this.syncStage();
    if(this.knockback.remaining>0){const step=Math.min(dt,this.knockback.remaining);this.push(this.knockback.x*step,this.knockback.z*step);this.knockback.remaining-=step;}
    this.hp=Math.min(this.hp,this.maxHp);
    this.immunity=Math.max(0,this.immunity-dt);this.slowRemaining=Math.max(0,this.slowRemaining-dt);this.sinceHit+=dt;
    for(const key of Object.keys(this.effects) as (keyof typeof this.effects)[])this.effects[key]=Math.max(0,this.effects[key]-dt);
    if(!this.isAtBase){
      const near=this.near;
      if(near&&!this.progression.seenEggs.includes(near.type)){this.progression.seenEggs.push(near.type);this.progression.pendingXP+=PROGRESSION.discoveryXP;this.revision++;this.emit('egg_discovered',{type:near.type});}
      const reached=Math.floor(this.distance/PROGRESSION.distanceStep),old=Math.floor(this.progression.distanceRecord/PROGRESSION.distanceStep);
      if(reached>old){this.progression.pendingXP+=(reached-old)*PROGRESSION.distanceXP;this.progression.distanceRecord=this.distance;this.revision++;}
      this.hazards.tick(dt,this.stage.id,{x:this.x,z:this.z,vx:this.velocity.x,vz:this.velocity.z,facing:this.facing,carrying:!!this.carried,metal:!!this.carried&&[2,18].includes(this.stage.id),moving:Math.hypot(this.velocity.x,this.velocity.z)>.01,stageOffset:this.stageOffset,guardianAwake:this.pursuing>=0&&Math.hypot(this.bosses[this.pursuing].x-this.x,this.bosses[this.pursuing].z-this.z)<12,guardianStage:this.bosses[this.pursuing]?.stageId,guardianOffset:((this.bosses[this.pursuing]?.stageId??this.stage.id)-this.progression.stage)*ROUTE.length},h=>this.applyHazard(h),(x,z)=>this.push(x,z),(key,seconds)=>{if(key in this.effects)this.effects[key as keyof typeof this.effects]=seconds;},!!this.carried&&EGGS[this.carried.type].tier===6);
    }else this.hazards.reset();
    for(const drop of [...this.dustDrops])if(Math.hypot(drop.x-this.x,drop.z-this.z)<1){this.save.dust+=drop.amount;this.dustDrops=this.dustDrops.filter(d=>d!==drop);this.revision++;}
    if (this.training && this.nearGym) {
      this.save.trainingSpeed = (this.save.trainingSpeed ?? 0) + this.trainingRate*dt;
      this.trainingClock+=dt;this.trainingGain+=this.effectiveTrainingRate*dt;
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
        if (this.save.eggs.length < BALANCE.inventory) {
          const e = this.carried;
          this.emit("egg_saved", {type: e.type});
          this.emit("expedition_success", {distance: Math.floor(e.distance)});
          this.save.eggs.push({
            id: e.id,stageId:e.stageId,variant:e.variant,special:e.special,
            type: e.type,
            hp: e.hp,
            distance: e.distance,
          });
          this.save.selected ??= e.id;
          if (!this.save.discovered.includes(e.type))
            this.save.discovered.push(e.type);
          this.save.best = Math.max(this.save.best, e.distance);
          this.progression.pendingXP+=PROGRESSION.returnXP[EGGS[e.type].tier];
          const completed=e.stageId??this.progression.stage;
          if(!this.progression.completedStages.includes(completed))this.progression.completedStages.push(completed);
          if(completed>=PROGRESSION.unlockStage)this.unlockHealth();
          this.returnReward = {type:e.type, distance:e.distance,stageId:e.stageId,variant:e.variant,special:e.special};
          this.message = `${EGGS[e.type].name} 보관 완료! 부화실에서 만나봐요`;
          this.carried = null;
          this.revision++;
        } else {
          this.message = "알 보관함이 가득 찼어요. 부화실에서 알을 깨주세요.";
        }
      }
      if (!this.carried){this.deadline=0;this.settleXP(true);}
    }
    this.autoClock += dt;
    const interval = 1 / (BALANCE.baseAutoRate + BALANCE.autoRatePerLevel * this.save.upgrades.rate);
    if (this.autoClock + 1e-9 >= interval) {
      const hits = Math.floor((this.autoClock + 1e-9) / interval);
      this.autoClock = Math.max(0, this.autoClock - hits * interval);
      this.damage(
        hits * (BALANCE.baseAutoDamage + BALANCE.autoDamagePerLevel * this.save.upgrades.damage) * this.autoMultiplier,
      );
    }
  }
  interact() {
    this.updateNight();
    if(this.death)return;
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
      this.carried = egg;
      this.emit("egg_pickup", {type: this.carried.type});
      this.world = this.world.filter((e) => e !== this.carried);
      const region = this.carried.region ?? EGGS[this.carried.type].region;
      this.carried.region = region;
      this.carried.stageId??=this.stage.id;
      this.carried.guardian??=Math.max(0,this.carried.stageId-this.progression.stage);
      const boss = this.bosses[this.carried.guardian];
      if(!boss){this.revision++;return;}
      // Recovered eggs remain in the world and can be stolen during the return trip.
      boss.loot = null;
      const sleeping=boss.mode==='idle';
      if(sleeping){boss.mode='waking';boss.wakeRemaining=ROUTE.bossWakeSeconds;}
      else if(boss.mode!=='waking'){boss.mode='chase';boss.wakeRemaining=undefined;}
      boss.target = this.carried.id;
      this.message = sleeping?'보스가 잠에서 깼어요!':'알을 들었어요. 기지로 돌아가세요!';
    this.revision++;
  }
  tap() {
    if (!this.selected || this.result !== null || this.now() - this.lastTap < BALANCE.tapInterval) return false;
    this.lastTap = this.now();
    this.emit("hatch_manual_hit");
    this.damage((BALANCE.baseTap + BALANCE.tapPerLevel * this.save.upgrades.tap)*this.clickMultiplier);
    return true;
  }
  damage(amount: number) {
    const e = this.selected;
    if (!e || this.result !== null) return;
    e.hp = Math.max(0, e.hp - amount);
    if (e.hp === 0) {
      const pool = MONGLES.map((m, i) => ({ ...m, index: i })).filter(
        (m) => m.tier === EGGS[e.type].tier && (e.stageId?m.stageId===e.stageId&&(e.variant===5?m.species===10:m.species!==10):m.stageId===0&&m.region===EGGS[e.type].region),
      );
      const m =
        pool[Math.min(pool.length - 1, Math.floor(this.random() * pool.length))]
          .index;
      this.emit("mongle_obtained", {mongle: m});
      if(!this.progression.hatchedPets.includes(m)){this.progression.hatchedPets.push(m);this.gainXP(PROGRESSION.hatchXP);}
      this.save.mongles[m]++;
      this.save.obtainedPets??=[];if(!this.save.obtainedPets.includes(m))this.save.obtainedPets.push(m);
      if (!this.save.active.includes(m) && this.save.active.length < BALANCE.maxCompanions)
        this.save.active.push(m);
      this.save.dust += EGGS[e.type].reward;
      this.save.eggs = this.save.eggs.filter((v) => v.id !== e.id);
      this.save.selected = null;
      this.result = m;
      this.message = `${MONGLES[m].name} 탄생! 별가루 +${EGGS[e.type].reward}`;
      this.revision++;
    }
  }
  offline(seconds: number) {
    this.damage(Math.min(BALANCE.offlineCap, Math.max(0, seconds)) * this.dps);
  }
  buyTrail(id: number) {
    const trail = TRAILS[id];
    if (!trail || !Number.isInteger(id)) return false;
    this.save.trails ??= [0];
    if (!this.save.trails.includes(id)) {
      if (this.save.dust < trail.cost) return false;
      this.save.dust -= trail.cost;
      this.save.trails.push(id);
      this.emit("trail_purchase", {trail:id});
    }
    this.save.equippedTrail = id;
    this.revision++;
    return true;
  }
  discoveryReward(id: number) { const pet=MONGLES[id];return pet?BALANCE.discoveryRewards[pet.tier]*(pet.region+1):0; }
  claimPet(id: number) {
    if (!MONGLES[id] || !this.hasDiscoveredPet(id) || this.save.claimedPets?.includes(id)) return 0;
    const reward=this.discoveryReward(id);
    (this.save.claimedPets??=[]).push(id);this.save.dust+=reward;this.revision++;
    this.emit("collection_reward",{pet:id,reward});return reward;
  }
  claimRegion(region: number) {
    if (!REGIONS[region] || this.save.claimedRegions?.includes(region) || MONGLES.some((m,i)=>m.stageId===0&&m.region===region&&!this.hasDiscoveredPet(i))) return 0;
    const reward=BALANCE.regionCollectionRewards[region];
    (this.save.claimedRegions??=[]).push(region);this.save.dust+=reward;this.revision++;return reward;
  }
  claimCollection() {
    if (this.save.claimedCollection || MONGLES.some((m,i)=>m.stageId===0&&!this.hasDiscoveredPet(i))) return 0;
    this.save.claimedCollection=true;this.save.dust+=BALANCE.fullCollectionReward;this.revision++;return BALANCE.fullCollectionReward;
  }
  claimStage(stage:number){
    if(!Number.isInteger(stage)||!STAGES[stage-1]||this.save.claimedStages?.includes(stage)||MONGLES.some((m,i)=>m.stageId===stage&&!this.hasDiscoveredPet(i)))return 0;
    const reward=STAGE_COLLECTION_REWARDS[stage-1];
    (this.save.claimedStages??=[]).push(stage);this.save.dust+=reward;this.revision++;return reward;
  }
  claimStageCollection(){
    if(this.save.claimedStageCollection||MONGLES.some((m,i)=>m.stageId>0&&!this.hasDiscoveredPet(i)))return 0;
    this.save.claimedStageCollection=true;this.save.dust+=BALANCE.fullCollectionReward;this.revision++;return BALANCE.fullCollectionReward;
  }
  cost(k: Upgrade) {
    return Math.floor(
      UPGRADES[k].cost * UPGRADES[k].growth ** this.save.upgrades[k],
    );
  }
  upgrade(k: Upgrade) {
    const cost = this.cost(k);
    if (this.save.dust < cost || this.save.upgrades[k] >= BALANCE.maxUpgrade) return false;
    this.save.dust -= cost;
    this.save.upgrades[k]++;
    this.emit("upgrade_purchase", {type:k, level:this.save.upgrades[k]});
    this.revision++;
    return true;
  }
  snapshot(): Save {
    this.progression.hp=this.hp;this.progression.maxHP=this.maxHp;this.progression.immunity=this.immunity;this.progression.slowRemaining=this.slowRemaining;this.progression.slowMultiplier=this.slowMultiplier;
    this.save.routeVersion=2;
    this.save.death=this.death;
    this.save.nightAt = this.nightAt;
    this.save.nightUntil = this.nightUntil;
    this.save.world = this.world;
    this.save.bosses = this.bosses;
    this.save.lastSavedAt = this.now();
    this.save.expedition = this.deadline
      ? { deadline: this.deadline, x: this.x, z: this.z, carried: this.carried,hp:this.hp,sinceHit:this.sinceHit }
      : null;
    return structuredClone(this.save);
  }
}
