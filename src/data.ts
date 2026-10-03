import {OVERHAUL,baselineIncome,upgradePrice,hatchHealth,stageReward,carryingRatio} from './balance';
import {ULTRA_SECRET_NAMES} from './ultra-secret';
import {ROAD_WIDTH_SCALE,STAGES,ROUTE_FAR_Z} from './stage-data';
import {STAGE_PET_ROWS} from './stage-pet-catalog';
import {SECRET_DRAGON_ROWS} from './secret-dragon-catalog';
import {EXPANSION_PETS} from './expansion-pet-catalog';
export const PROGRESSION={baseHP:2,hpPerLevel:0,hpMilestone:10,hpMilestoneBonus:0,xpBase:100,xpExponent:1.35,speedPerLevel:OVERHAUL.levelSpeedPerLevel,maxLevelSpeed:OVERHAUL.levelSpeedCap,hitImmunity:1,hitSlow:.8,hitSlowDuration:.5,hitKnockback:.5,failureKeep:.7,discoveryXP:30,hatchXP:100,distanceStep:10,distanceXP:2,returnXP:[100,120,160,240,400,650,1000],damageReductionCap:.5,singleHitCap:.35,lowHP:.3,warningHP:.5,carryTelegraphBonus:.2,unlockStage:4,simulationStep:1/60};
export type DefensePassive={maxHP?:number;damageReduction?:number;firstHitReduction?:number;environmentReduction?:Partial<Record<string,number>>;statusReduction?:number;lowHPSpeed?:number;returnXPBonus?:number;lastStand?:boolean};
// Existing companions keep their click/auto/speed abilities; future rows opt in.
export const PET_DEFENSE:Partial<Record<number,DefensePassive>>={};
export const COUPONS:Record<string,{tier:number}>={FREEPET:{tier:2}};
export const COUPON_ERRORS:Record<string,string>={COUPON_INVALID:'올바른 쿠폰 코드를 입력해 주세요.',COUPON_USED:'이미 사용한 쿠폰이에요.',COUPON_INVENTORY_FULL:'알 보관함 한 칸을 비운 뒤 다시 사용해 주세요.',COUPON_HATCH_PENDING:'부화 결과를 확인한 뒤 사용해 주세요.'};
export const DAMAGE_OVER_TIME={ticks:6,interval:.15,directionSeconds:1.4};
export const BALANCE = {
  startingDust:1000,
  petsPerLevel:10,
  eggVisualScale:3,
  eggPresentationScale:1.5,
  eggNestSpacing:2.4,
  eggNestArcDepth:2.2,
  eggApproachSeconds:.12,
  roomVisualOffsetMax:.45,
  slowWalkSpeed:2,
  slowHoldMs:450,
  chatDurationMs:6000,
  chatCooldownMs:1200,
  chatMaxLength:80,
  roomStopRewindMs:500,
  virtualAdDuration:10000,
  virtualAdReward:3,
  eggSellRatio:.4,
  petSellPrices:[1,2,5,10,22,50,150],
  petIncomeSeconds:10,
  petIncomeByTier:[1,2,4,8,16,32,64],
  petIncomeLegacyStageMultipliers:[1,5,9,13,17],
  storeX:-4.5,
  storeZ:1,
  storeRadius:1.3,
  multiplayerMaxPlayers:5,
  secretDragonEggChance:.0001, // Per spawned egg, independent of tier/region bonuses.
  secretDragonScale:6.5,
  baseMapX:14,
  baseWalkSpeed:2,
  mountSpeedBonusRate:OVERHAUL.mountBonusRate,
  maxMovementSpeed:10,
  carryingMovementMultiplier:1,
  deathChoiceDelay:5000,
  deathChoiceDuration:5000,
  reviveImmunity:3,
  reviveMinimumTime:10,
  baseHp:2,
  hpPerLevel:0,
  regenDelay:3,
  regenRatioPerSecond:.04,
  attackWindup:.65,
  bossAttackRadius:3.5,
  batRange:2.5,
  batCooldown:700,
  batFacingThreshold:.15,
  batFlightSeconds:.28,
  roomInputGraceMs:1500,
  roomSyncMs:200,
  roomMovingCorrectionRatio:.08,
  knockdownMs:900,
  knockback:2,
  bossFixedDamage:[10,14,18,22,26],
  bossRatioDamage:[.03,.04,.05,.06,.08],
  finalStrongAttackRatio:.20,
  duration: 45,
  maxUpgrade: 20,
  maxCompanions: 3,
  speedPerLevel: 0.12,
  carryPerLevel: 0.08,
  carrySlowByTier: [.1,.2,.3,.4,.5,.6,.7],
  maxCarrySlow: .7,
  rareEggPickupSeconds: [0,0,0,1.5,3,5,7],
  timePerLevel: 5,
  baseTap: 3,
  tapPerLevel: 1,
  baseAutoDamage: OVERHAUL.autoBase,
  autoDamagePerLevel: 1,
  baseAutoRate: 1,
  autoRatePerLevel: OVERHAUL.ratePerLevel,
  mapX: 6.5*ROAD_WIDTH_SCALE,
  mapNearZ: 22,
  baseMinZ:-4.4,
  mapFarZ: ROUTE_FAR_Z,
  // Cycle starts with the reset window, then daylight, then explorable night.
  nightInterval: 300000,
  nightDuration: 15000,
  normalNightDuration: 105000,
  nightMoveMultiplier: .85,
  rainInterval: 180000,
  rainChance: .4,
  rainDuration: 35000,
  rainMoveMultiplier: .9,
  windInterval: 210000,
  windDuration: 45000,
  windChance: .45,
  windMoveMultiplier: 1.1,
  idleTimeout: 300000,
  trainingIdleTimeout: 600000,
  warningSeconds: 10,
  windSeconds: 5,
  deadzone: 8,
  rarityRegionBonus: 0,
  farmPetsVisible: 12,
  farmPetMaxSize: 4.2,
  trainingPerSecond: 0.01,
  trainingPerLevel: 0.01,
  gymX: 2.1,
  gymZ: 0.6,
  gymRadius: 1.1,
  discoveryRewards: [1, 1, 2, 5, 10, 25, 100],
  regionCollectionRewards: [1,5,9,13,17].map(stage=>stageReward(stage,OVERHAUL.rewardMinutes.stage)),
  fullCollectionReward: 500,
  speed: 2,
  interaction: 1.4,
  returnRadius: 2.2,
  eggsPerLevel:15,
  nightEggWeightMultiplier:1.3,
  offlineCap: 172800,
  tapInterval: 80,
};
// Economy goals are upgrades/readiness, never paid stage admission or date locks.
export const ECONOMY = {
  migrationWalletGoals:2,migrationWalletMinimum:500,migrationTrainingMultiple:4,
  displayMultiplier: 1,
  stageSeconds: [120,240,540,2700,18000,7200,14400,43200,86400,259200,43200,129600,172800,172800,432000,86400,172800,259200,259200,432000],
  // Account for login cadence and purchases inside each interval, not date locks.
  stageCostFactors: [1,1,1,1,1,1,1,1,1,1.25,1,1,1.2,1.2,1.4,1,1.2,1.2,1.2,1.45],
  baseTeamIncome: 10, incomeLinear: .12, incomeQuadratic: .002,
  middleMultiplier: 1.16, middleCostShare: .035, speedCostShare: .78,
  tierProduction: [1,1.2,1.45,1.75,2.1,2.5,3],
  middleUpgrades: ['training','damage','rate','health'] as const,
  speedGrowth: 1.4, hatchGrowth: 1.25, softThreshold:1000,
};
export const recommendedIncome=baselineIncome;
export const growthCost=upgradePrice;
export const REGIONS = [
  {
    name: "풀숲",
    subtitle: "작은 발견이 시작되는 곳",
    color: 0xb8ce8b,
    start: 0,
  },
  {
    name: "버섯숲",
    subtitle: "달콤한 포자 사이로",
    color: 0xc6b1c5,
    start: 28,
  },
  { name: "수정동굴", subtitle: "푸른 빛을 따라", color: 0x91c1c8, start: 58 },
  {
    name: "구름유적",
    subtitle: "하늘에 남은 오래된 약속",
    color: 0xd4cfaa,
    start: 90,
  },
  {
    name: "우주균열",
    subtitle: "아직 이름 없는 별",
    color: 0x9e9ac0,
    start: 125,
  },
];
export const RARITIES = [
  {
    name: "C",
    chance: 59.83,
    color: "#a8c393",
    size: 5,
    scale: 0.22,
    particles: 3,
    effect: "별빛 입자",
  },
  {
    name: "B",
    chance: 35.27,
    color: "#65cfa1",
    size: 10,
    scale: 0.44,
    particles: 5,
    effect: "반짝이는 입자",
  },
  {
    name: "A",
    chance: 3,
    color: "#60bafa",
    size: 20,
    scale: 0.88,
    particles: 8,
    effect: "별빛 입자",
  },
  {
    name: "S",
    chance: 1.4,
    color: "#bd8bfa",
    size: 35,
    scale: 1.54,
    particles: 12,
    effect: "빛의 궤도",
  },
  {
    name: "SS",
    chance: 0.35,
    color: "#ffc761",
    size: 55,
    scale: 2.42,
    particles: 16,
    effect: "빛의 궤도",
  },
  {
    name: "SSS",
    chance: 0.13,
    color: "#ff87bc",
    size: 75,
    scale: 3.3,
    particles: 22,
    effect: "반짝이는 입자",
  },
  {
    name: "Secret",
    chance: 0.02,
    color: "#b5ffff",
    size: 100,
    scale: 4.4,
    particles: 30,
    effect: "빛의 궤도",
  },
];
const eggNames = ["풀잎", "버섯", "수정", "화석", "우주"];
export const EGG_HEALTH = {
  legacyRegionBase: [300,4000,15000,75000,400000],
  stageBase: [12,24,45,80,140,240,400,650,1050,1700,2700,4300,6800,10800,17000,27000,43000,68000,108000,170000],
  earlyStageEnd:3,
  earlyTierMultipliers:[1,1.1,1.2,1.35,1.5,1.75,2],
};
function stageEggHp(stage:number,tier:number,legacy=false){
  const multiplier=!legacy&&stage<=EGG_HEALTH.earlyStageEnd?EGG_HEALTH.earlyTierMultipliers[tier]:1+tier*.6;
  return Math.round(EGG_HEALTH.stageBase[Math.max(0,Math.min(19,stage-1))]*multiplier);
}
export function eggMaxHp(egg:{type:number;stageId?:number;hpVersion?:2|3|4|5}){
  if(egg.hpVersion===undefined||egg.hpVersion===5)return hatchHealth(egg.stageId??(EGGS[egg.type].region*4+1),EGGS[egg.type].tier);
  if(egg.type===35)return 32;
  const def=EGGS[egg.type];
  // A client may briefly receive a snapshot from the previous server release.
  if(egg.hpVersion===2)return Math.round(EGG_HEALTH.legacyRegionBase[def.region]*(1+def.tier*.6));
  const stage=egg.stageId??(def.region*4+1);
  return stageEggHp(stage,def.tier,egg.hpVersion===3);
}
// Keep the first five egg IDs compatible with existing saves.
export const EGGS = RARITIES.flatMap((r, tier) =>
  REGIONS.map((_, region) => ({
    name: `${["", "이슬 ", "빛나는 ", "꿈결 ", "왕관 ", "천상의 ", "태초의 "][tier]}${eggNames[region]} 알`,
    rarity: r.name,
    tier,
    region,
    hp: hatchHealth(region*4+1,tier),
    weight: carryingRatio(tier,0,1),
    reward: stageReward(region*4+1,OVERHAUL.rewardMinutes.egg,tier),
    color: r.color,
  })),
);
EGGS.push({name:'칠색 별리본 알',rarity:'S',tier:3,region:0,hp:hatchHealth(1,3),weight:carryingRatio(3,0,1),reward:stageReward(1,OVERHAUL.rewardMinutes.egg,3),color:'#ffc879'});
export function eggCarryMultiplier(type:number,carryLevel=0){return carryingRatio(EGGS[type].tier,carryLevel,1);}
export function eggWeightLabel(type:number,carryLevel=0){
  const base=Math.round((1-EGGS[type].weight)*100),adjusted=Math.round((1-eggCarryMultiplier(type,carryLevel))*100);
  return `무게 감속 ${base}% · 운반 강화 후 ${adjusted}%`;
}
export const WEEKLY_EVENT={eggType:35,petId:320,rewards:[10,15,20,25,35,50,75],dayOffsetMs:9*3600000};
export function rarityChances(region: number) {
  const weights = RARITIES.map((r, tier) => r.chance * (1 + region * tier * BALANCE.rarityRegionBonus));
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / sum * 100);
}
export function rollEgg(region: number, random: () => number) {
  let roll = random() * 100;
  const tier = rarityChances(region).findIndex(chance => (roll -= chance) < 0);
  return (tier < 0 ? 6 : tier) * 5 + region;
}
export function crackStage(hp: number, max: number) {
  return Math.min(3, Math.floor((1 - hp / max) * 4));
}
export function regionAt(z: number) {
  return Math.max(
    0,
    REGIONS.reduce((found, r, i) => (-z >= r.start ? i : found), 0),
  );
}
export const BOSSES = [
  { name: "이끼왕 모구", home: 14, speed: 3.3, color: "#739650" },
  { name: "포자여왕 루루", home: 43, speed: 4.1, color: "#c77aaf" },
  { name: "수정골렘 크롬", home: 74, speed: 5, color: "#62bfd2" },
  { name: "유적지기 아르", home: 108, speed: 6, color: "#dbb76b" },
  { name: "별포식자 녹스", home: 142, speed: 7, color: "#9275cf" },
];
const species = [
  "새싹콩",
  "달토리",
  "별꼬리",
  "여우콩",
  "고양콩",
  "곰구리",
  "물방울",
  "버섯몽",
  "꿀벌콩",
  "아기새",
];
const variants = [
  "풀빛",
  "이슬",
  "버섯",
  "포자",
  "수정",
  "서리",
  "구름",
  "황금",
  "은하",
  "태초",
];
const colors = [
  "#9ec77b",
  "#73c9b4",
  "#d392b8",
  "#c79ce8",
  "#80c8e6",
  "#bbdcec",
  "#efddac",
  "#edbb64",
  "#9385dc",
  "#b0eee7",
];
// Damage bonuses scale linearly with source HP; speed uses a normalized log curve.
// Never use remaining HP or a historical hpVersion: already-owned pets grow too.
export const PET_ABILITIES={referenceHp:12,referenceBonus:.15,maxSpeedMultiplier:5,speedReferenceHp:stageEggHp(STAGES.length,RARITIES.length-1)};
function abilitiesFromEgg(egg:{type:number;stageId?:number},ability:number){
  const sourceEggHp=eggMaxHp(egg);
  const bonus=sourceEggHp/PET_ABILITIES.referenceHp*PET_ABILITIES.referenceBonus;
  const speedReferenceBonus=PET_ABILITIES.speedReferenceHp/PET_ABILITIES.referenceHp*PET_ABILITIES.referenceBonus;
  const multiplier=ability===1
    ?1+(PET_ABILITIES.maxSpeedMultiplier-1)*Math.min(1,Math.log1p(bonus)/Math.log1p(speedReferenceBonus))
    :1+bonus;
  return {sourceEggHp,
    clickMultiplier:ability===0?multiplier:1,
    speedMultiplier:ability===1?multiplier:1,
    autoMultiplier:ability===2?multiplier:1,
    effect:`${['터치','스피드','자동'][ability]} ×${Number(multiplier.toFixed(2))} · 알 HP ${sourceEggHp}`,
  };
}
const LEGACY_MONGLES = Array.from({ length: 100 }, (_, i) => {
  const variant = Math.floor(i / 10),
    speciesId = i % 10;
  const tier = [0, 0, 0, 1, 1, 2, 2, 3, 4, 5, 0, 1, 2, 3, 3, 4, 4, 5, 5, 6][
    i % 20
  ];
  return {
    id: `mongle-${i}`,
    stageId: 0,
    name: `${variants[variant]} ${species[speciesId]}`,
    description: `${REGIONS[Math.floor(i / 20)].name}에서 태어난 ${RARITIES[tier].name} 등급 친구`,
    ...abilitiesFromEgg({type:tier*REGIONS.length+Math.floor(i/20)},speciesId%3),
    tier,
    region: Math.floor(i / 20),
    species: speciesId,
    grid: i<6?24:50,
    scale: [0.45, 0.7, 1.05, 1.65, 2.4, 3.4, 4.5][tier],
    color: i<6?['#94bd59','#b5a5cc','#626ca3','#d98a4e','#e6d8b6','#94725e'][i]:colors[variant],
    icon: `pet-${i}`,
  };
});
// Append stage-exclusive IDs; existing pets, equipment and rewards never change identity.
export const MONGLES = [...LEGACY_MONGLES, ...[...STAGE_PET_ROWS,...SECRET_DRAGON_ROWS].map((pet,i)=>{
  const ability=pet.slot%3;
  return {
    ...pet,id:`mongle-${100+i}`,region:Math.floor((pet.stageId-1)/4),species:pet.slot,
    description:`${pet.name} · ${STAGES[pet.stageId-1].name}에서 온 수집 생물`,
    ...abilitiesFromEgg({type:pet.tier*REGIONS.length+Math.floor((pet.stageId-1)/4),stageId:pet.stageId},ability),
    grid:24,scale:pet.slot===10?BALANCE.secretDragonScale:[.45,.7,1.05,1.65,2.4,3.4,4.5][pet.tier],icon:`pet-${100+i}`,
  };
})];
export const STAGE_COLLECTION_REWARDS=Array.from({length:20},(_,i)=>stageReward(i+1,OVERHAUL.rewardMinutes.stage));
MONGLES.push({...MONGLES[0],id:'mongle-320',name:'별리본 루미',description:'일곱 번의 만남을 기억하는 주간 보상 전용 S급 친구',...abilitiesFromEgg({type:WEEKLY_EVENT.eggType},2),tier:3,stageId:0,region:0,species:0,scale:1.1,icon:'pet-320',color:'#ffc879'});
// Average only the original same-stage/tier candidates. Adding equal-mean candidates
// preserves expected bonuses under the existing uniform within-tier hatch draw.
const originalPets=MONGLES.slice();
for(const pet of EXPANSION_PETS){
  const peers=originalPets.filter(p=>p.stageId===pet.stageId&&p.tier===pet.tier);
  const mean=(key:'clickMultiplier'|'speedMultiplier'|'autoMultiplier')=>peers.reduce((sum,p)=>sum+p[key],0)/peers.length;
  const clickMultiplier=mean('clickMultiplier'),speedMultiplier=mean('speedMultiplier'),autoMultiplier=mean('autoMultiplier');
  MONGLES.push({...peers[0],id:`mongle-${pet.id}`,name:pet.name,description:`${pet.name} · ${STAGES[pet.stageId-1].name}의 새로운 친구`,
    species:pet.slot,color:pet.color,icon:`pet-${pet.id}`,clickMultiplier,speedMultiplier,autoMultiplier,
    effect:[['터치',clickMultiplier],['스피드',speedMultiplier],['자동',autoMultiplier]].filter(([,value])=>Number(value)>1).map(([label,value])=>`${label} ×${Number(Number(value).toFixed(2))}`).join(' · '),
  });
}
for(let stage=1;stage<=20;stage++){
 const source=MONGLES.find(p=>p.stageId===stage&&p.species===10)!;
 MONGLES.push({...source,id:`mongle-${700+stage}`,name:ULTRA_SECRET_NAMES[stage-1],description:`${STAGES[stage-1].name} · 0.001%`,species:30,icon:`pet-${700+stage}`});
}
// Every pet produces dust and has one hatch role. Riding is a separate bonus.
for(const pet of MONGLES){
 const stage=Math.max(1,pet.stageId),tier=pet.tier;
 const role=(pet.species+stage)%2;
 pet.clickMultiplier=role===0?1+.08+.025*tier+.005*stage:1;
 pet.autoMultiplier=role===1?1+.08+.025*tier+.005*stage:1;
 pet.speedMultiplier=1;
 pet.effect=[['두드리기',pet.clickMultiplier],['자동 부화',pet.autoMultiplier]]
  .filter(([,value])=>Number(value)>1).map(([label,value])=>`${label} ×${Number(value).toFixed(3)}`).join(' / ')+' / 별가루 생산';
}
export function petMountBonus(id:number){
 const pet=MONGLES[id];
 return (.015+.006*pet.tier+.001*Math.max(1,pet.stageId))*BALANCE.mountSpeedBonusRate;
}
/** Add only each pet's bonus; multiplying HP-scaled pets would compound stage growth. */
export function equippedPetMultiplier(ids:readonly number[],kind:'clickMultiplier'|'autoMultiplier'|'speedMultiplier'){
  return 1+ids.reduce((sum,id)=>sum+MONGLES[id][kind]-1,0);
}
/** Bounded display of individual un-equipped copies; never expand a large inventory. */
export function farmPetIds(owned:readonly number[],active:readonly number[],now:number){
  const counts=owned.map((n,id)=>Math.max(0,n-active.filter(p=>p===id).length));
  const total=counts.reduce((sum,n)=>sum+n,0),limit=BALANCE.farmPetsVisible;
  if(!total)return [];
  const start=total>limit?Math.floor(now/12000)*limit%total:0;
  return Array.from({length:Math.min(limit,total)},(_,i)=>{
    let index=(start+i)%total;
    return counts.findIndex(n=>{if(index<n)return true;index-=n;return false;});
  });
}
export function petIcon(id:number){return `${import.meta.env.BASE_URL}models/pet-${id}.${id===WEEKLY_EVENT.petId||id>=701?'svg':'png'}`;}
export const UPGRADES = {
  health: {name:"든든한 지원",description:"팀 생산 +1%p · 생명은 하트 2개",icon:"pack",cost:30,growth:1.6},
  training: {
    name: "러닝머신 모터",
    description: "운동 효율 +2.5%p · 팀 생산 +1%p · 운동 보너스 최대 30%",
    icon: "gym",
    cost: 45,
    growth: 1.65,
  },
  speed: {
    name: "가벼운 발걸음",
    description: "영구 성장 속도 증가 · 다음 스테이지에 도전",
    icon: "alkong",
    cost: 25,
    growth: 1.6,
  },
  carry: {
    name: "튼튼한 배낭",
    description: "알 무게 감속 완화 · 운반 중에는 항상 감속",
    icon: "pack",
    cost: 35,
    growth: 1.7,
  },
  tap: {
    name: "통통 망치",
    description: "터치 피해 +10%",
    icon: "hammer",
    cost: 20,
    growth: 1.5,
  },
  damage: {
    name: "병아리 부리",
    description: "자동 피해 +8% · 팀 생산 +1%p",
    icon: "pet-9",
    cost: 30,
    growth: 1.65,
  },
  rate: {
    name: "태엽 감기",
    description: "초당 타격 +0.03회 · 팀 생산 +1%p",
    icon: "egg-3",
    cost: 50,
    growth: 1.8,
  },
  time: {
    name: "바람 나침반",
    description: "탐험 시간 +5초",
    icon: "compass",
    cost: 40,
    growth: 1.6,
  },
};
export type Upgrade = keyof typeof UPGRADES;

export const TRAILS = [
  {name:"맨발 산책", multiplier:1, cost:0, color:"#dbe9a8", model:"compass"},
  {name:"민들레 바람", multiplier:1.15, cost:6, color:"#f8dc83", model:"flower"},
  {name:"반딧불 행진", multiplier:1.35, cost:22, color:"#a4f2c4", model:"lantern"},
  {name:"별똥별 질주", multiplier:1.65, cost:65, color:"#c4adff", model:"meteor"},
];

TRAILS.forEach((trail,i)=>{trail.multiplier=OVERHAUL.trailMovement[i];trail.cost=i?Math.ceil(baselineIncome(OVERHAUL.trailStages[i])*OVERHAUL.trailWaits[i]):0;});
