import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave,parseSave}=await server.ssrLoadModule('/src/game.ts');
 const {ECONOMY,MONGLES,growthCost,recommendedIncome}=await server.ssrLoadModule('/src/data.ts');
 const M=await server.ssrLoadModule('/src/money.ts');
 const {formatNumber}=await server.ssrLoadModule('/src/format.ts');
 for(const [value,text] of [[1000,'1K'],[1250,'1.25K'],[1200000,'1.2M'],[999995,'1M'],[1.005,'1.01'],['1e63','1Vg'],['1e66','1e66'],['1.25e69','1.25e69'],['1e400','1e400']])assert.equal(formatNumber(value),text);
 const huge=M.add('1e400',123);assert.equal(M.compare(M.subtract(huge,'1e400'),123),0);
 assert.equal(M.compare(M.multiply('1e200','1e200'),'1e400'),0);
 assert.equal(M.compare(M.divide('1e400',4),'25e398'),0);
 const state=freshSave(0);state.dust=huge;state.mongles[100]=1;state.active=[100];
 const restored=parseSave(JSON.stringify(state),0);assert.equal(M.compare(restored.dust,huge),0);
 const g=new GameState(restored,()=>0,()=>.1);assert.ok(g.upgrade('speed'));assert.equal(M.compare(g.save.dust,M.subtract(huge,15000)),0);
 const probe=new GameState(freshSave(0),()=>0,()=>.1);probe.save.mongles[100]=1;probe.save.active=[100];probe.offline(72*3600);assert.equal(M.compare(probe.save.dust,M.multiply(probe.incomePerSecond,48*3600)),0);
 const scenarios=[{name:'once',interval:86400},{name:'twice',interval:43200},{name:'frequent',interval:14400},{name:'away',interval:43200,away:true},{name:'unlucky',interval:43200,unlucky:true},{name:'early-rare',interval:43200,rare:true}];
 const results=[];
 for(const scenario of scenarios){
  let seconds=0,nextLogin=0,onlineUntil=1200,firstPurchase=null,completion=null;const start=1800000000000;
  const game=new GameState(freshSave(start),()=>start+seconds*1000,()=>.1);
  const purchases=[],stages=[],daily=[],readyAt=new Map();let income=0,spent=0;
  // Deterministic representative acquisition: first common hatch at 55s, two further
  // distinct common/B hatches at 110/170s. Later worlds need 90s of ONLINE collecting.
  // This is an explicit behavioral model, not simulated offline manual actions.
  let collected=0,collectAt=55,collectStage=1;
  for(seconds=0;seconds<=60*86400;seconds+=seconds<onlineUntil?10:600){
   if(seconds>=nextLogin){
    const skipped=scenario.away&&seconds>=12*86400&&seconds<14*86400;
    if(!skipped)onlineUntil=seconds+(seconds===0?1200:600);
    nextLogin=seconds===0?scenario.interval:nextLogin+scenario.interval;
   }
   const online=seconds<onlineUntil;
   const before=game.save.dust;
   // Same authoritative production settlement used by room-engine; 48h cap from last visit.
   if(online){game.settleProduction(start+seconds*1000);income+=Number(M.subtract(game.save.dust,before));}
   if(online&&seconds>=collectAt&&collected<3){
    const tier=scenario.unlucky?0:collected===2?1:0;
    const candidates=MONGLES.map((p,id)=>({p,id})).filter(({p})=>p.stageId===collectStage&&p.tier===tier&&p.species!==10);
    const candidate=candidates[collected%candidates.length];
    game.save.mongles[candidate.id]++;if(!game.save.active.includes(candidate.id))game.save.active.push(candidate.id);
    collected++;collectAt=seconds+60;
    if(scenario.rare&&collected===3){game.save.mongles[300]=1;game.save.active[2]=300;}
   }
   const stage=game.growthStage;
   const potential=M.add(game.save.dust,M.multiply(game.incomePerSecond,Math.min(172800,Math.max(0,seconds-((game.save.productionAt??start)-start)/1000))));
   if(!readyAt.has(stage)&&M.compare(potential,game.cost('speed'))>=0)readyAt.set(stage,seconds);
   if(online&&game.save.upgrades.speed<20){
    for(const k of ECONOMY.middleUpgrades){
     if(game.save.upgrades[k]<=game.save.upgrades.speed&&M.compare(game.save.dust,game.cost(k))>=0){
      const cost=game.cost(k);game.upgrade(k);spent+=cost;firstPurchase??=seconds;purchases.push({at:seconds,key:k,cost,rate:game.incomePerSecond});
     }
    }
    if(M.compare(game.save.dust,game.cost('speed'))>=0){
     const cost=game.cost('speed'),beforeRate=game.incomePerSecond;game.upgrade('speed');spent+=cost;firstPurchase??=seconds;
     stages.push({stage,ready:readyAt.get(stage)??seconds,purchased:seconds,beforeRate,afterRate:game.incomePerSecond});purchases.push({at:seconds,key:'speed',cost,rate:game.incomePerSecond});
     // Collection remains optional; representative player keeps first ordinary team,
     // avoiding assumptions about later lucky drops or offline trips.
     if(game.save.upgrades.speed===20)completion=seconds;
    }
   }
   if(seconds%86400===0)daily.push({day:seconds/86400,income,spent,balance:game.save.dust,rate:game.incomePerSecond,stage:game.growthStage});
   assert.ok(M.validMoney(game.save.dust));
  }
  results.push({scenario:scenario.name,completionDays:completion===null?null:completion/86400,firstHatch:60,firstPurchase,first15:purchases.filter(p=>p.at<=900),stages,purchases,daily});
 }
 for(const r of results.slice(0,2)){assert.ok(r.completionDays>=28&&r.completionDays<=32);assert.ok(r.firstPurchase<180);assert.equal(r.stages.filter(s=>s.purchased<=900).length,3);}
 await mkdir('artifacts/economy',{recursive:true});await writeFile('artifacts/economy/simulation.json',JSON.stringify(results,null,2));
 await writeFile('artifacts/economy/settings.json',JSON.stringify({config:ECONOMY,stages:Array.from({length:20},(_,i)=>({stage:i+1,income:recommendedIncome(i+1),speedCost:growthCost('speed',i),middleCost:growthCost('health',i)}))},null,2));
 console.log(JSON.stringify(results.map(r=>({scenario:r.scenario,days:r.completionDays,firstPurchase:r.firstPurchase,first15:r.first15.length,stages15:r.stages.filter(s=>s.purchased<=900).length}))));
}finally{await server.close();}
