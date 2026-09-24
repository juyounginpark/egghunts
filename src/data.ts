import {STAGE_PET_ROWS} from './stage-pet-catalog';
import {SECRET_DRAGON_ROWS} from './secret-dragon-catalog';
export const PROGRESSION={baseHP:100,hpPerLevel:5,hpMilestone:10,hpMilestoneBonus:20,xpBase:100,xpExponent:1.35,speedPerLevel:.012,maxLevelSpeed:1.6,traitInterval:5,hitImmunity:1,hitSlow:.8,hitSlowDuration:.5,hitKnockback:.5,failureKeep:.7,discoveryXP:30,hatchXP:100,distanceStep:10,distanceXP:2,returnXP:[20,20,50,120,300,600,1000],damageReductionCap:.5,singleHitCap:1,lowHP:.3,warningHP:.5,carryTelegraphBonus:.2,unlockStage:4,simulationStep:1/60};
export const TRAITS={
  sturdy:{name:'튼튼한 탐험가',description:'최대 체력 +10',value:10,max:5},
  light:{name:'가벼운 발걸음',description:'이동속도 +2%',value:.02,max:5},
  porter:{name:'운반 전문가',description:'무게 페널티 3% 감소',value:.03,max:5},
  escape:{name:'위기 탈출',description:'HP 30% 이하 스피드 +10%',value:.1,max:1},
  shield:{name:'보호 장비',description:'원정 첫 피해 30% 감소',value:.3,max:1},
  clock:{name:'시간 감각',description:'원정 시간 +2초',value:2,max:5},
};
export type DefensePassive={maxHP?:number;damageReduction?:number;firstHitReduction?:number;environmentReduction?:Partial<Record<string,number>>;statusReduction?:number;lowHPSpeed?:number;returnXPBonus?:number;lastStand?:boolean};
// Existing companions keep their click/auto/speed abilities; future rows opt in.
export const PET_DEFENSE:Partial<Record<number,DefensePassive>>={};
export const BALANCE = {
  virtualAdDuration:10000,
  virtualAdReward:30,
  eggSellRatio:.4,
  petSellPrices:[10,20,45,100,220,500,1500],
  petIncomeSeconds:10,
  petIncomeByTier:[1,2,4,8,16,32,64],
  petIncomeLegacyStageMultipliers:[1,5,9,13,17],
  storeX:-4.5,
  storeZ:4,
  storeRadius:1.3,
  multiplayerMaxPlayers:5,
  secretDragonEggShare:.5,
  secretDragonScale:6.5,
  baseMapX:14,
  deathChoiceDelay:5000,
  deathChoiceDuration:5000,
  reviveImmunity:3,
  reviveMinimumTime:10,
  baseHp:100,
  hpPerLevel:20,
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
  baseTap: 1,
  tapPerLevel: 2,
  baseAutoDamage: 1,
  autoDamagePerLevel: 2,
  baseAutoRate: 1,
  autoRatePerLevel: 0.5,
  mapX: 6.5,
  mapNearZ: 22,
  baseMinZ:-4.4,
  mapFarZ: -2277,
  nightInterval: 180000,
  nightDuration: 15000,
  warningSeconds: 10,
  windSeconds: 5,
  deadzone: 8,
  rarityRegionBonus: 0,
  farmPetsVisible: 12,
  trainingPerSecond: 0.01,
  trainingPerLevel: 0.01,
  gymX: 2.1,
  gymZ: 0.6,
  gymRadius: 1.1,
  discoveryRewards: [5, 10, 20, 45, 100, 250, 1000],
  regionCollectionRewards: [100, 250, 600, 1200, 2500],
  fullCollectionReward: 5000,
  speed: 1.6,
  interaction: 1.4,
  returnRadius: 2.2,
  inventory: 6,
  offlineCap: 7200,
  tapInterval: 80,
};
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
    chance: 47.5,
    color: "#a8c393",
    size: 5,
    scale: 0.22,
    particles: 3,
    effect: "별빛 입자",
  },
  {
    name: "B",
    chance: 28,
    color: "#65cfa1",
    size: 10,
    scale: 0.44,
    particles: 5,
    effect: "반짝이는 입자",
  },
  {
    name: "A",
    chance: 15,
    color: "#60bafa",
    size: 20,
    scale: 0.88,
    particles: 8,
    effect: "별빛 입자",
  },
  {
    name: "S",
    chance: 7,
    color: "#bd8bfa",
    size: 35,
    scale: 1.54,
    particles: 12,
    effect: "빛의 궤도",
  },
  {
    name: "SS",
    chance: 1.75,
    color: "#ffc761",
    size: 55,
    scale: 2.42,
    particles: 16,
    effect: "빛의 궤도",
  },
  {
    name: "SSS",
    chance: 0.65,
    color: "#ff87bc",
    size: 75,
    scale: 3.3,
    particles: 22,
    effect: "반짝이는 입자",
  },
  {
    name: "Secret",
    chance: 0.1,
    color: "#b5ffff",
    size: 100,
    scale: 4.4,
    particles: 30,
    effect: "빛의 궤도",
  },
];
const eggNames = ["풀잎", "버섯", "수정", "화석", "우주"];
// Keep the first five egg IDs compatible with existing saves.
export const EGGS = RARITIES.flatMap((r, tier) =>
  REGIONS.map((_, region) => ({
    name: `${["", "이슬 ", "빛나는 ", "꿈결 ", "왕관 ", "천상의 ", "태초의 "][tier]}${eggNames[region]} 알`,
    rarity: r.name,
    tier,
    region,
    hp: Math.round([30, 400, 1500, 7500, 40000][region] * (1 + tier * 0.6)),
    weight: 1-Math.min(BALANCE.maxCarrySlow,BALANCE.carrySlowByTier[tier]),
    reward: Math.round([30, 100, 300, 800, 2400][region] * (1 + tier * tier)),
    color: r.color,
  })),
);
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
const LEGACY_MONGLES = Array.from({ length: 100 }, (_, i) => {
  const variant = Math.floor(i / 10),
    speciesId = i % 10;
  const tier = [0, 0, 0, 1, 1, 2, 2, 3, 4, 5, 0, 1, 2, 3, 3, 4, 4, 5, 5, 6][
    i % 20
  ];
  const power = tier + 1;
  const bonus = Math.round((1 + power * .1) * 10) / 10;
  const clickMultiplier = speciesId % 3 === 0 ? bonus : 1;
  const autoMultiplier = speciesId % 3 === 2 ? bonus : 1;
  const speedMultiplier = speciesId % 3 === 1 ? bonus : 1;
  return {
    id: `mongle-${i}`,
    stageId: 0,
    name: `${variants[variant]} ${species[speciesId]}`,
    description: `${REGIONS[Math.floor(i / 20)].name}에서 태어난 ${RARITIES[tier].name} 등급 친구`,
    effect: `${["클릭", "스피드", "오토"][speciesId % 3]} ×${bonus.toFixed(1)}`,
    clickMultiplier,
    autoMultiplier,
    speedMultiplier,
    tier,
    region: Math.floor(i / 20),
    species: speciesId,
    grid: 50,
    scale: [0.45, 0.7, 1.05, 1.65, 2.4, 3.4, 4.5][tier],
    color: colors[variant],
    icon: `pet-${i}`,
  };
});
// Append stage-exclusive IDs; existing pets, equipment and rewards never change identity.
export const MONGLES = [...LEGACY_MONGLES, ...[...STAGE_PET_ROWS,...SECRET_DRAGON_ROWS].map((pet,i)=>{
  const bonus=Math.round((1+(pet.tier+1)*.1)*10)/10;
  const ability=pet.slot%3;
  return {
    ...pet,id:`mongle-${100+i}`,region:Math.floor((pet.stageId-1)/4),species:pet.slot,
    clickMultiplier:ability===0?bonus:1,autoMultiplier:ability===2?bonus:1,speedMultiplier:ability===1?bonus:1,
    effect:`${['클릭','스피드','오토'][ability]} ×${bonus.toFixed(1)}`,
    grid:50,scale:pet.slot===10?BALANCE.secretDragonScale:[.45,.7,1.05,1.65,2.4,3.4,4.5][pet.tier],icon:`pet-${100+i}`,
  };
})];
export const STAGE_COLLECTION_REWARDS=Array.from({length:20},(_,i)=>100+(i+1)*50);
export function petIcon(id:number){return `${import.meta.env.BASE_URL}models/pet-${id}.png`;}
export const UPGRADES = {
  health: {name:"든든한 체력",description:"최대 HP +20",icon:"pack",cost:30,growth:1.6},
  training: {
    name: "러닝머신 모터",
    description: "운동 증가량 +0.01 /초",
    icon: "gym",
    cost: 45,
    growth: 1.65,
  },
  speed: {
    name: "가벼운 발걸음",
    description: "이동속도 +12%",
    icon: "alkong",
    cost: 25,
    growth: 1.6,
  },
  carry: {
    name: "튼튼한 배낭",
    description: "운반속도 +8%",
    icon: "pack",
    cost: 35,
    growth: 1.7,
  },
  tap: {
    name: "통통 망치",
    description: "터치 피해 +2",
    icon: "hammer",
    cost: 20,
    growth: 1.5,
  },
  damage: {
    name: "병아리 부리",
    description: "자동 타격 피해 +2",
    icon: "pet-9",
    cost: 30,
    growth: 1.65,
  },
  rate: {
    name: "태엽 감기",
    description: "초당 타격 +0.5회",
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
  {name:"민들레 바람", multiplier:1.15, cost:60, color:"#f8dc83", model:"flower"},
  {name:"반딧불 행진", multiplier:1.35, cost:220, color:"#a4f2c4", model:"lantern"},
  {name:"별똥별 질주", multiplier:1.65, cost:650, color:"#c4adff", model:"meteor"},
];
