import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {runtime} from './balance-runtime.mjs';
try{await access('docs/balance-overhaul-baseline.json');throw new Error('Baseline already exists; refusing to overwrite pre-change evidence.');}catch(error){if(error.code!=='ENOENT')throw error;}
const {m,code}=await runtime();
await mkdir('artifacts/balance-overhaul',{recursive:true});
const docs={};for(const file of ['balance-guide.md','balance-reference.md','balance-pets.csv','balance-tempo-map.md']){const text=await readFile(`docs/${file}`,'utf8');docs[file]={characters:text.length,lines:text.split('\n').length};}
const clock=1800000016000;
const fresh=()=>new m.GameState(m.freshSave(clock),()=>clock,()=>.5,true);
const rows=Array.from({length:20},(_,level)=>({level:level+1,speed:m.growthCost('speed',level),middle:m.growthCost('damage',level)}));
const reversals=rows.flatMap((r,i)=>i&&r.speed<rows[i-1].speed?[{level:r.level,previous:rows[i-1].speed,next:r.speed}]:[]);
const duplicates=key=>m.MONGLES.flatMap((p,i)=>m.MONGLES.findIndex(q=>q[key]===p[key])<i?[{id:i,value:p[key]}]:[]);
const strategies=['speed','production','balanced'].map(strategy=>{const g=fresh();for(const k of Object.keys(g.save.upgrades))g.save.upgrades[k]=strategy==='balanced'?20:strategy==='speed'?(k==='speed'?20:0):m.ECONOMY.middleUpgrades.includes(k)?20:0;const pet=m.MONGLES.findIndex(p=>p.stageId===1&&p.tier===0);g.save.mongles[pet]=3;g.save.active=[pet,pet,pet];m.ensurePetLots(g.save);return {strategy,productionMultiplier:g.productionMultiplier,income:g.incomePerSecond,speed:g.speed};});
const g=fresh();for(const k of Object.keys(g.save.upgrades))g.save.upgrades[k]=20;
const best=m.MONGLES.map((p,id)=>({petIndex:id,...p})).sort((a,b)=>b.speedMultiplier-a.speedMultiplier)[0];g.save.mongles[best.petIndex]=4;g.save.active=[best.petIndex,best.petIndex,best.petIndex];g.save.mountPet=best.petIndex;m.ensurePetLots(g.save);g.save.trails=m.TRAILS.map((_,i)=>i);g.save.equippedTrail=m.TRAILS.length-1;g.progression.level=100;
const maxWithoutTraining=g.speed;g.save.trainingSpeed=(m.BALANCE.trainingPerSecond+m.BALANCE.trainingPerLevel*20)*86400;
const maxWithDayTraining=g.speed;
const carry=fresh();const unloaded=carry.movementSpeed;carry.carried={type:0,weightG:250,standardWeightG:250};const carrying=carry.movementSpeed;
const result={commit:'1845e54',docs,prices:rows,reversals,strategies,maxWithoutTraining,maxWithDayTraining,stage20Requirement:m.STAGE_REQUIRED_SPEED[19],dayTrainingRaw:g.save.trainingSpeed,speedUpgradeRaw:m.BALANCE.speed*m.ECONOMY.speedGrowth**20,carrying:{unloaded,carrying,ratio:carrying/unloaded},pets:{count:m.MONGLES.length,duplicateIds:duplicates('id'),duplicateNames:duplicates('name'),maxTap:Math.max(...m.MONGLES.map(p=>p.clickMultiplier)),maxAuto:Math.max(...m.MONGLES.map(p=>p.autoMultiplier)),maxSpeed:best.speedMultiplier},baselineChecks:{build:'passed (includes tsc)',lint:'31 pre-existing errors',unit:'failed before changes: legacy test loader cannot resolve ultra-secret'}};
await writeFile('artifacts/balance-overhaul/baseline-runtime.mjs',code);
await writeFile('docs/balance-overhaul-baseline.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
