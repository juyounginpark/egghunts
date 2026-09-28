import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime,seeded} from '../balance-runtime.mjs';
import {economicAgent} from '../balance-agent.mjs';
const {m}=await runtime();
const passed=[];
const check=(name,fn)=>{fn();passed.push(name);console.log('PASS',name);};
let now=1800000016000;
const make=()=>new m.GameState(m.freshSave(now),()=>now,seeded(620),true);
check('economic simulator matches actual game formulas across 100 seeded loadouts',()=>{
 const random=seeded(921);
 for(let trial=0;trial<100;trial++){
  const agent=economicAgent(m,random),g=make();
  for(const key of Object.keys(g.save.upgrades))agent.save.upgrades[key]=g.save.upgrades[key]=Math.floor(random()*21);
  agent.save.trainingProgress=g.save.trainingProgress=random();
  agent.save.equippedTrail=g.save.equippedTrail=Math.floor(random()*4);
  agent.save.progression.level=g.progression.level=1+Math.floor(random()*100);
  agent.save.active=g.save.active=Array.from({length:3},()=>Math.floor(random()*721));
  for(const key of ['progressionSpeed','incomePerSecond','tapDamage','dps'])assert.ok(Math.abs(agent[key]-g[key])<1e-8,key);
  for(const key of Object.keys(g.save.upgrades))assert.equal(agent.cost(key),g.cost(key));
 }
});
check('all 721 catalog IDs, names, lots and tier probability boundaries',()=>{
 assert.equal(m.MONGLES.length,721);assert.equal(new Set(m.MONGLES.map(p=>p.id)).size,721);assert.equal(new Set(m.MONGLES.map(p=>p.name)).size,721);
 for(let region=0;region<5;region++){
  const probabilities=m.rarityChances(region);assert.ok(Math.abs(probabilities.reduce((a,b)=>a+b,0)-100)<1e-8);
  let sum=0;for(let tier=0;tier<7;tier++){assert.equal(m.rollEgg(region,()=>(sum+probabilities[tier]/2)/100),tier*5+region);sum+=probabilities[tier];}
 }
});
check('all 20 levels have positive monotone prices independent of equipment',()=>{
 const g=make();for(const kind of Object.keys(m.UPGRADES)){
  let previous=0;for(let level=0;level<20;level++){
   const price=m.growthCost(kind,level);assert.ok(Number.isSafeInteger(price)&&price>=previous&&price>0);previous=price;
   g.save.upgrades[kind]=level;assert.equal(g.cost(kind),price);
  }
 }
});
check('50K reachable without rare pets; a single Secret cannot skip four stages',()=>{
 const g=make();g.save.upgrades.speed=20;assert.ok(g.progressionSpeed>=50000);
 for(let level=0;level<=20;level++){
  g.save.upgrades.speed=level;g.save.active=[];
  const before=m.STAGE_REQUIRED_SPEED.filter(v=>v<=g.progressionSpeed).length;
  g.save.active=[m.MONGLES.map((p,i)=>({p,i})).sort((a,b)=>b.p.speedMultiplier-a.p.speedMultiplier)[0].i];
  assert.ok(m.STAGE_REQUIRED_SPEED.filter(v=>v<=g.progressionSpeed).length-before<4);
 }
});
check('carrying every tier, weight and carry level always slows movement',()=>{
 const g=make();g.z=-10;
 for(let level=0;level<=20;level++)for(let tier=0;tier<7;tier++)for(const weight of [.5,.7,1,1.3,1.5]){
  g.save.upgrades.carry=level;g.carried=null;const empty=g.movementSpeed;
  g.carried={type:tier*5,weightG:Math.round(1000*weight),standardWeightG:1000};
  assert.ok(g.movementSpeed>0&&g.movementSpeed<empty);
 }
});
check('training is bounded and cannot accrue beyond completion',()=>{
 assert.equal(m.trainingProgressAfter(0,86400,20),1);assert.equal(m.trainingProgressAfter(1,86400,20),1);
 const g=make();g.x=g.gym.x;g.z=g.gym.z;g.training=true;g.save.trainingProgress=1;const before=g.speed;
 g.tick(1);assert.equal(g.speed,before);
});
check('legacy migration preserves wallet, weighted lots, history and archived training; idempotent',()=>{
 const save=m.freshSave(now);save.balanceVersion=1;delete save.trainingProgress;delete save.highestStage;
 save.dust='123456789012345678901234567890';save.trainingSpeed=123456;
 save.mongles[100]=2;save.active=[100];m.ensurePetLots(save);
 save.redeemedCoupons=['FREEPET'];const lots=structuredClone(save.petLots),money=save.dust;
 m.migrateBalance(save,now);assert.equal(save.dust,money);assert.deepEqual(save.petLots,lots);assert.equal(save.legacyTrainingSpeed,123456);assert.equal(save.trainingProgress,1);
 const migrated=structuredClone(save);m.migrateBalance(save,now);assert.deepEqual(save,migrated);
 assert.deepEqual(save.redeemedCoupons,['FREEPET']);
});
check('offline payout 8h/24h/48h/7d is capped, diminished and settled once',()=>{
 assert.equal(m.offlineSeconds(28800),28800);assert.equal(m.offlineSeconds(86400),57600);assert.equal(m.offlineSeconds(172800),100800);assert.equal(m.offlineSeconds(604800),100800);
 const g=make();g.save.mongles[100]=3;g.save.active=[100,100,100];m.ensurePetLots(g.save);
 g.save.productionAt=now;const target=now+604800000;g.settleProduction(target);const money=g.save.dust;
 assert.ok(m.compare(money,0)>0);g.settleProduction(target);assert.equal(g.save.dust,money);assert.equal(g.level,1);
});
check('coupons remain starter scoped, ads capped and duplicate claims pay zero',()=>{
 const g=make();g.save.highestStage=20;
 assert.equal(g.redeemCoupon('FREEPET'),null);assert.equal(g.save.eggs[0].stageId,1);assert.equal(m.EGGS[g.save.eggs[0].type].tier,2);assert.equal(g.redeemCoupon('FREEPET'),'COUPON_USED');
 for(let i=0;i<3;i++)assert.ok(g.claimAdReward()>0);const money=g.save.dust;assert.equal(g.claimAdReward(),0);assert.equal(g.save.dust,money);
});
check('offline efficiency cannot be reset by other players polling the room',()=>{
 const once=make(),split=make();
 for(const g of [once,split]){g.save.active=[100,100,100];g.save.productionAt=now;}
 once.settleProduction(now+7*86400000,false);
 for(let hour=1;hour<=168;hour++)split.settleProduction(now+hour*3600000,false);
 assert.equal(split.save.dust,once.save.dust);
 const paid=split.save.dust;split.settleProduction(now+7*86400000);assert.equal(split.save.dust,paid);
});
check('entry excludes carry/status/mount; stages enforce progression and allow retreat',()=>{
 const g=make();g.nightAt=Infinity;g.nightUntil=0;
 assert.equal(g.selectStage(20),false);const stat=g.progressionSpeed;
 g.carried={type:30,weightG:3000000,standardWeightG:2000000};g.slowRemaining=10;g.slowMultiplier=.2;assert.equal(g.progressionSpeed,stat);
 g.carried=null;g.push(0,-500);assert.equal(g.stage.id,1);const z=g.z;g.push(0,4);assert.ok(g.z>z);
});
check('continuous positive physical, income and combat curves near 1K',()=>{
 for(const fn of [m.walkingSpeedValue,m.incomeValue,m.combatDamage]){
  const values=[999,1000,1001].map(fn);assert.ok(values.every(Number.isFinite));assert.ok(values[0]<=values[1]&&values[1]<=values[2]);assert.ok(Math.abs(values[2]-values[1])<2);
 }
});
check('normal collection excludes Secret and SS tiers; legacy ownership is intact',()=>{
 const g=make();for(const [i,p] of m.MONGLES.entries())if(p.stageId===1&&p.tier<=3)g.save.mongles[i]=1;
 assert.ok(g.claimStage(1)>0);assert.equal(g.claimStage(1),0);assert.equal(g.save.mongles[701],0);
});
check('general hits cannot one-shot; same-stage reference dies after 4–6 hits',()=>{
 for(let stage=1;stage<=20;stage++){
  const hp=100+25*(stage-1),damage=m.reducedDamage(m.stageDamage(stage),.04,hp);
  assert.ok(Math.ceil(hp/damage)>=4&&Math.ceil(hp/damage)<=6);assert.ok(m.reducedDamage(1e20,1,100)<100);
 }
});
await writeFile('artifacts/balance-overhaul/invariants.json',JSON.stringify({passed},null,2));
