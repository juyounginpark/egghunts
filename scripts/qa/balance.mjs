import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {modules} from './lib.mjs';
const m=await modules();const {GameState,freshSave,EGGS,UPGRADES}=m;
try {
 let now=1800000000000,start=now;const game=new GameState(freshSave(now),()=>now,()=>.1);const rows=[],purchases=[];
 const step=(dx=0,dz=0)=>{now+=50;game.move(dx,dz,.05);game.tick(.05);game.events.length=0;};
 const travel=(x,z)=>{for(let i=0;i<2400&&Math.hypot(x-game.x,z-game.z)>.15;i++){const dx=x-game.x,dz=z-game.z,l=Math.hypot(dx,dz);step(dx/l,dz/l);if(game.flyaway||game.isNight)break;}};
 let firstEgg=null,firstHatch=null;let cycles=0;
 while(now-start<600000){
   if(game.isNight){step();continue;}
   const egg=game.world.find(e=>e.region===0);
   if(!egg){step();continue;}
   game.flyaway=null;travel(egg.x,egg.z);game.interact();travel(0,0);
   if(game.save.eggs.length){
     firstEgg??=(now-start)/1000;game.returnReward=null;
     while(game.selected&&now-start<600000){step();game.tap();}
     if(game.result!==null){firstHatch??=(now-start)/1000;game.result=null;cycles++;}
     const order=['damage','speed','rate','carry','tap','training'];
     const key=order[purchases.length%order.length];
     if(game.upgrade(key))purchases.push({second:Math.round((now-start)/1000),upgrade:key,level:game.save.upgrades[key],dust:game.save.dust});
   }
   if(!rows.length||Math.floor((now-start)/60000)>rows.at(-1).minute)rows.push({minute:Math.floor((now-start)/60000),dust:game.save.dust,pets:game.save.mongles.reduce((a,b)=>a+b,0),speed:game.speed.toFixed(2),dps:game.dps});
 }
 assert.ok(firstEgg<60);assert.ok(firstHatch<60);assert.ok(purchases.length>=3);
 const distances=[0,5,10].map(level=>{const g=new GameState(freshSave(now),()=>now,()=>.1);g.save.upgrades.speed=level;return {level,regions:g.route.map((b,i)=>{const outward=g.speed;g.carried={type:Math.floor((b.stage-1)/4)};const carrying=g.speed;g.carried=null;return {region:i,distance:b.home,seconds: +(b.home/outward+b.home/carrying).toFixed(1),recommendedSpeed:m.recommendedRouteSpeed(b.home,b.stage)};})};});
 const hatchTimes=EGGS.map((e,i)=>({type:i,hp:e.hp,reward:e.reward,baseAutoSeconds:e.hp,manual4HzSeconds:+(e.hp/5).toFixed(1),grownAutoSeconds:+(e.hp/451).toFixed(1)}));
 assert.ok(distances[2].regions[3].seconds<distances[0].regions[3].seconds);assert.equal(distances[0].regions.length,20);
 const text=`# Balance simulation\n\nDeterministic active play model, 50ms simulation steps, general-tier rolls; not a prediction of every player's behavior. No ads/payments. First egg ${firstEgg.toFixed(1)}s, first hatch ${firstHatch.toFixed(1)}s, base automatic hit available at 0s. ${cycles} hatches, ${purchases.length} purchases in ten minutes. Boss avoidance/input mistakes change outcomes. Equal rarity odds by latest requirement; later stages pay higher rewards but take longer to hatch. Discovery/trail/gym gains are not counted in this conservative loop.\n\n## First ten minutes\n\n| Minute | Dust | Pets | Speed | DPS |\n|---|---:|---:|---:|---:|\n${rows.map(r=>`|${r.minute}|${r.dust}|${r.pets}|${r.speed}|${r.dps}|`).join('\n')}\n\n## Upgrade purchases\n\n\`\`\`json\n${JSON.stringify(purchases,null,2)}\n\`\`\`\n\n## Roundtrip estimates (without boss/path detours)\n\n\`\`\`json\n${JSON.stringify(distances,null,2)}\n\`\`\`\n\n## Egg hatch times\n\n\`\`\`json\n${JSON.stringify(hatchTimes,null,2)}\n\`\`\`\n\nDamage and rate multiply: damage levels add ${UPGRADES.damage.description}, rate levels add ${UPGRADES.rate.description}; marginal value changes with the other stat. Late automation 451 DPS is an example at both level caps, not a promised ten-minute state. Small-egg farming is useful early; long-term collection rewards grow by rarity and region. Rare failures consume the carried egg, never purchased upgrades or owned pets.\n`;
 await mkdir('artifacts/qa-summary',{recursive:true});await writeFile('artifacts/qa-summary/balance-report.md',text);console.log(`PASS balance: first egg ${firstEgg.toFixed(1)}s, first hatch ${firstHatch.toFixed(1)}s, ${purchases.length} upgrades`);
}finally{await m.cleanup();}
