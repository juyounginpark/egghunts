import {writeFile} from 'node:fs/promises';
import {runtime,seeded} from './balance-runtime.mjs';
const {m}=await runtime();
const trials=Number(process.argv.find(a=>a.startsWith('--trials='))?.split('=')[1]??30);
const rows=[];
for(let stage=1;stage<=20;stage++)for(const [preset,ratio] of [['below',.99],['entry',1],['stable',m.stableRecoveryRatio(stage)],['strong',m.stableRecoveryRatio(stage)*1.5]]){
 let successes=0,failures=0,seconds=0;
 for(let trial=0;trial<trials;trial++){
  const random=seeded(stage*100000+trial),speed=m.STAGE_REQUIRED_SPEED[stage-1]*ratio;
  let now=1800000016000;
  const g=new m.GameState(m.freshSave(now),()=>now,random,true);
  Object.defineProperty(g,'progressionSpeed',{get:()=>speed});
  g.save.upgrades.health=stage-1;g.save.upgrades.carry=stage-1;g.hp=g.maxHp;
  g.resetBosses();g.spawn();g.nightAt=Infinity;g.roomManaged=true;
  const egg=g.world.filter(e=>e.stageId===stage&&!e.special)[trial%5];
  egg.type=Math.floor((stage-1)/4);Object.assign(egg,m.rollEggWeight(egg,random));
  g.x=egg.x;g.z=egg.z;g.carried=egg;g.world=g.world.filter(e=>e!==egg);g.deadline=now+1000000;
  const boss=g.bosses[egg.guardian];boss.mode='waking';boss.wakeRemaining=m.ROUTE.bossWakeSeconds;boss.target=egg.id;
  let elapsed=0;
  while(elapsed<300&&g.carried&&!g.isAtBase&&!g.death){
   const dt=.15;now+=dt*1000;elapsed+=dt;
   const localStage=Math.min(20,Math.max(1,Math.floor((-g.z-m.ROUTE.entrance)/m.ROUTE.length)+1));
   const offset=(localStage-1)*m.ROUTE.length;
   const path={x:m.pathX(localStage,g.z+offset+1)};
   // Small path errors and hesitation are seeded; water/brush/collisions use runtime geometry.
   const error=(random()-.5)*.5;
   g.move(Math.max(-1,Math.min(1,(path?.x??0)-g.x+error)),random()<.025?0:1,dt);
   g.hazards.tickEnvironment(g.stage.id,{x:g.x,z:g.z,vx:g.velocity.x,vz:g.velocity.z,facing:g.facing,carrying:true,metal:false,moving:true,stageOffset:g.stageOffset},now,h=>g.applyHazard(h));
   g.tickDamage(dt);g.immunity=Math.max(0,g.immunity-dt);g.slowRemaining=Math.max(0,g.slowRemaining-dt);
   g.tickBosses(dt,egg.guardian);
  }
  seconds+=elapsed;if(g.isAtBase&&g.carried)successes++;else failures++;
 }
 rows.push({stage,preset,ratio,trials,successes,failures,successRate:successes/trials,seconds:seconds/trials});
}
await writeFile('artifacts/balance-overhaul/chase.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify(rows.filter(r=>[1,5,10,15,20].includes(r.stage)),null,2));
