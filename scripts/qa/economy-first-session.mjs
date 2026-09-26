import {createServer} from 'vite';
import {writeFile,mkdir} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave}=await server.ssrLoadModule('/src/game.ts');
 const {ECONOMY}=await server.ssrLoadModule('/src/data.ts');
 const {compare}=await server.ssrLoadModule('/src/money.ts');
 let t=0;const epoch=1800000016000,g=new GameState(freshSave(epoch),()=>epoch+t*1000,()=>.2);
 const events=[],purchases=[];let egg=null,firstPickup=null,firstReturn=null,firstHatch=null;
 for(t=0;t<=900;t+=.05){
  let target={x:0,z:0};
  if(g.result!==null){firstHatch??=t;g.result=null;}
  if(g.isAtBase){
   for(const k of [...ECONOMY.middleUpgrades,'speed'])if(g.save.upgrades[k]<Math.min(20,g.save.upgrades.speed+1)&&compare(g.save.dust,g.cost(k))>=0){g.upgrade(k);purchases.push({at:t,key:k});}
   if(g.selected){if(Math.round(t*20)%5===0)g.tap();if(g.selected?.hp===0)g.claimHatch(g.selected.id);}
  }
  if(!g.selected&&!g.carried&&!g.isNight){
   egg=g.world.find(e=>e.stageId===1&&e.variant!==5);
   if(egg){target=egg;if(g.canReachEgg(egg)){g.pickup(egg);firstPickup??=t;}}
  }
  const dx=target.x-g.x,dz=target.z-g.z,l=Math.hypot(dx,dz);
  if(l>.12)g.move(dx/l,dz/l,.05);
  g.tick(.05);
  for(const e of g.events.splice(0)){if(e.name==='egg_saved')firstReturn??=t;if(['egg_saved','mongle_obtained','upgrade_purchase','player_death'].includes(e.name))events.push({at:t,...e});}
 }
 const result={firstPickup,firstReturn,firstHatch,firstPurchase:purchases[0]?.at,stage:g.growthStage,purchases,events,dust:g.save.dust,income:g.incomePerSecond,scope:'Actual GameState movement, collisions, boss pursuit, night, hatch taps and upgrades, deterministic common roll; no ads or grants.'};
 await mkdir('artifacts/economy',{recursive:true});await writeFile('artifacts/economy/first-session.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await server.close();}
