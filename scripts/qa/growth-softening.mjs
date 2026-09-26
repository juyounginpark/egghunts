// Manual check only; run when explicitly requested.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {softenGrowth}=await vite.ssrLoadModule('/src/growth-curve.ts');
 const {GameState,freshSave}=await vite.ssrLoadModule('/src/game.ts');
 const {recommendedRouteSpeed}=await vite.ssrLoadModule('/src/stage-data.ts');
 const {growthCost}=await vite.ssrLoadModule('/src/data.ts');
 assert.equal(softenGrowth(500,1000),500);
 assert.equal(softenGrowth(1000,1000),1000);
 assert.equal(softenGrowth(10000,1000),2000);
 assert.equal(softenGrowth(100000,1000),3000);
 assert.equal(growthCost('speed',0),150);
 const now=1800000060000,g=new GameState(freshSave(now),()=>now,()=>.5);
 g.save.mongles[100]=3;g.save.mongles[101]=1;g.save.active=[100];
 for(let level=0;level<=20;level++){
  g.save.upgrades.speed=level;
  g.save.upgrades.damage=level;g.save.upgrades.rate=level;
  for(const key of ['training','health'])g.save.upgrades[key]=level;
  assert.ok(Number.isFinite(g.speed)&&g.speed>0);
  if(level<20)assert.ok(g.speed>=recommendedRouteSpeed(0,level+1));
  const income=g.incomePerSecond;
  g.save.active=[100,101];assert.ok(g.incomePerSecond>=income);
  assert.ok(Math.abs(g.petIncomePerCycle/10-g.incomePerSecond)<1e-8);
  g.save.active=[100];
 }
 console.log('PASS growth soft limit, prices, stage readiness, team income');
}finally{await vite.close();}
