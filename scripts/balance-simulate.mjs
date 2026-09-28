import {readFile,writeFile} from 'node:fs/promises';
import {economicAgent} from './balance-agent.mjs';
import {runtime,seeded,quantiles} from './balance-runtime.mjs';

// Calendar-time agents. Purchases and hatches occur only during scheduled sessions.
// Equipment, prices, XP, weights and payouts all use the exported game runtime.
const {m}=await runtime();
const count=Number(process.argv.find(a=>a.startsWith('--accounts='))?.split('=')[1]??1000);
const scenarios=['normal','FREEPET','speed-rush','production-first','balanced','treadmill','casual','hardcore','lucky','unlucky'];
const rows=[];
const chase=JSON.parse(await readFile('artifacts/balance-overhaul/chase.json','utf8'));
const petPools=Array.from({length:20},(_,s)=>Array.from({length:7},(_,tier)=>m.MONGLES.flatMap((p,i)=>p.stageId===s+1&&p.tier===tier&&p.species!==10&&p.species!==30?[i]:[])));
for(let account=0;account<count;account++){
 const scenario=account%10>7?'normal':scenarios[account%10],random=seeded(620000+account);
 let now=1800000016000,time;
 const g=economicAgent(m,random);g.settleProduction(now);
 const reached={},levels={},upgrades={},trails={},first={};
 let recoveries=0,failed=0,lastProduction=0,nextTrip,pendingHatch=null,luckScore=0;
 const sessions=scenario==='casual'?1:scenario==='hardcore'?4:2;
 const sessionLength=scenario==='hardcore'?900:600+random()*300;
 const hatch=(stage,type)=>{const tier=m.EGGS[type].tier,pool=petPools[stage-1][tier];if(pool.length)g.hatch(stage,tier,pool);};
 if(scenario==='FREEPET')hatch(1,2*m.REGIONS.length);
 for(let day=0;day<90;day++)for(let session=0;session<sessions;session++){
  const start=day*86400+session*86400/sessions;
  now=1800000016000+start*1000;
  g.settleProduction(now);lastProduction=start;nextTrip=start+30;
  g.result=null;
  for(let elapsed=0;elapsed<sessionLength;elapsed+=15){
   time=start+elapsed;now=1800000016000+time*1000;
   g.settleProduction(now);lastProduction=time;
   if(scenario==='treadmill')g.save.trainingProgress=m.trainingProgressAfter(g.save.trainingProgress??0,10,g.save.upgrades.training);
   if(pendingHatch&&time>=pendingHatch.at){first.hatch??=time;hatch(pendingHatch.stage,pendingHatch.type);pendingHatch=null;}
   const speed=g.progressionSpeed??g.speed;
   let stage=1;for(let s=1;s<=20;s++)if(speed>=m.STAGE_REQUIRED_SPEED[s-1])stage=s;
   for(let s=1;s<=stage;s++)reached[s]??=time;
   g.save.highestStage=Math.max(g.save.highestStage??1,stage);
   if(time>=nextTrip){
    const roll=random();
    const type=m.rollEgg(Math.floor((stage-1)/4),()=>roll);
    const tier=m.EGGS[type].tier;
    const actualRatio=speed/m.STAGE_REQUIRED_SPEED[stage-1];
    const measurements=chase.filter(r=>r.stage===stage&&r.preset!=='below').sort((a,b)=>a.ratio-b.ratio);
    let success=measurements.at(-1).successRate;
    for(let i=1;i<measurements.length;i++)if(actualRatio<=measurements[i].ratio){const a=measurements[i-1],b=measurements[i],t=Math.max(0,Math.min(1,(actualRatio-a.ratio)/(b.ratio-a.ratio)));success=a.successRate+(b.successRate-a.successRate)*t;break;}
    const movement=m.walkingSpeedValue(speed)*m.TRAILS[g.save.equippedTrail??0].multiplier;
    const travel=(m.ROUTE.entrance+(stage-1)*m.ROUTE.length+20)/movement*(1+1/m.carryingRatio(tier,g.save.upgrades.carry,1));
    const health=m.eggMaxHp({type,stageId:stage});
    const hatchTime=health/Math.max(1,g.dps+g.tapDamage*1.5);
    nextTrip=time+Math.max(45,travel+hatchTime);
    if(random()<success){recoveries++;luckScore+=m.OVERHAUL.tierIncome[tier]-1;first.egg??=time;pendingHatch={stage,type,at:time+hatchTime};g.gainXP(m.PROGRESSION.returnXP[tier]);}
    else failed++;
   }
   const order=scenario==='speed-rush'?['speed','carry','tap']:scenario==='production-first'?['damage','rate','health','training','speed','carry','tap','time']:['speed','carry','tap','damage','health','rate','training','time'];
   for(const key of order){
    const current=g.save.upgrades[key],speedLevel=g.save.upgrades.speed;
    const allowance=speedLevel===20?0:scenario==='balanced'?0:scenario==='production-first'?2:-2;
    if(key!=='speed'&&current>=Math.max(0,speedLevel+allowance))continue;
    if(g.upgrade(key)){first.upgrade??=time;upgrades[`${key}-${g.save.upgrades[key]}`]??=time;}
   }
   for(let i=1;i<m.TRAILS.length;i++)if(!g.save.trails.includes(i)&&m.compare(g.save.dust,m.multiply(m.TRAILS[i].cost,3))>=0&&g.buyTrail(i))trails[i]??=time;
   for(const level of [10,20,30,50,75,100])if(g.level>=level)levels[level]??=time;
   g.events.length=0;
  }
  g.claimWeekly(now);g.result=null;
 }
 rows.push({account,scenario,reached,levels,upgrades,trails,first,recoveries,failed,lastProduction,luckScore:luckScore/Math.max(1,recoveries),finalLevel:g.level,finalSpeed:g.speed,finalUpgrades:g.save.upgrades});
 if((account+1)%100===0)console.log(`simulated ${account+1}/${count}`);
}
const summarize=group=>({accounts:group.length,stages:Object.fromEntries(Array.from({length:20},(_,i)=>[i+1,quantiles(group.map(r=>r.reached[i+1]))])),levels:Object.fromEntries([10,20,30,50,75,100].map(l=>[l,quantiles(group.map(r=>r.levels[l]))])),speedMax:quantiles(group.map(r=>r.upgrades['speed-20'])),allMax:quantiles(group.map(r=>Object.keys(r.finalUpgrades).every(k=>r.finalUpgrades[k]===20)?Math.max(...Object.keys(r.finalUpgrades).map(k=>r.upgrades[`${k}-20`])):NaN)),first:Object.fromEntries(['egg','hatch','upgrade'].map(k=>[k,quantiles(group.map(r=>r.first[k]))])),recoveries:quantiles(group.map(r=>r.recoveries)),failureRate:group.reduce((n,r)=>n+r.failed,0)/group.reduce((n,r)=>n+r.failed+r.recoveries,0)});
const normal=rows.filter(r=>r.scenario==='normal').sort((a,b)=>a.luckScore-b.luckScore);
const result={seed:620000,count,horizonDays:90,assumptions:{stepSeconds:15,sessions:'1 casual / 4 hardcore / 2 others',sessionMinutes:'10-15 (hardcore 15)',luck:'Unmodified rarity draws; top 5% and bottom 10% realized rarity value per recovery among normal accounts',success:'interpolation of measured C-egg chase trials; not a full multiplayer/night simulation',offline:'shared persisted settlement',weekly:'weekly egg assumed hatched before next session; no paid rewards',unreached:'null / excluded quantiles, reached counts retained'},scenarios:Object.fromEntries(scenarios.map(s=>[s,summarize(s==='lucky'?normal.slice(-Math.max(1,Math.floor(normal.length*.05))):s==='unlucky'?normal.slice(0,Math.max(1,Math.floor(normal.length*.1))):rows.filter(r=>r.scenario===s))]))};
await writeFile(`artifacts/balance-overhaul/simulation-${count}.json`,JSON.stringify(result,null,2));
await writeFile(`artifacts/balance-overhaul/accounts-${count}.json`,JSON.stringify(rows));
console.log(JSON.stringify(result.scenarios.normal,null,2));
