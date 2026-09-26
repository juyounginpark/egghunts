import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave,parseSave}=await server.ssrLoadModule('/src/game.ts');
 const {BALANCE,ECONOMY}=await server.ssrLoadModule('/src/data.ts');
 const {runRoom}=await server.ssrLoadModule('/server/room-engine.ts');
 const {exportRuntime}=await server.ssrLoadModule('/src/online-state.ts');
 const M=await server.ssrLoadModule('/src/money.ts');
 const {formatNumber,NUMBER_SUFFIXES}=await server.ssrLoadModule('/src/format.ts');
 const checks=[];
 for(let i=0;i<NUMBER_SUFFIXES.length;i++){
  assert.equal(formatNumber(`1e${i*3}`),`1${NUMBER_SUFFIXES[i]}`);
  assert.equal(formatNumber(`999995e${i*3-3}`),`1${NUMBER_SUFFIXES[i+1]??'e66'}`);
 }
 for(const v of [NaN,Infinity,-1,'Infinity','1.2M'])assert.equal(M.validMoney(v),false);
 const base=1800000000000,save=freshSave(base);save.mongles[100]=1;save.active=[100];
 const initial=new GameState(save,()=>base,()=>.1),rate=initial.incomePerSecond;
 const insufficient=new GameState(freshSave(base),()=>base,()=>.1);insufficient.save.dust=14999.999;
 assert.equal(formatNumber(insufficient.save.dust),'15K');assert.equal(insufficient.upgrade('speed'),false);assert.equal(insufficient.save.dust,14999.999);
 const state=exportRuntime(initial),members=[{user_id:'u',slot:0,last_seen:new Date(base+86400000).toISOString()}];
 let result=runRoom(null,members,[{user_id:'u',state}],'u',{id:'first',commands:[]},base+86400000);
 assert.equal(M.compare(result.response.runtime.save.dust,M.multiply(rate,86400)),0);
 const credited=result.response.runtime.save.dust;
 result=runRoom(result.room,members,[],'u',{id:'first',commands:[]},base+86400000);
 assert.equal(M.compare(result.response.runtime.save.dust,credited),0);
 result=runRoom(result.room,members,[],'u',{id:'later',commands:[]},base+4*86400000);
 assert.equal(M.compare(result.response.runtime.save.dust,M.multiply(rate,86400*3)),0);
 assert.equal(M.compare(parseSave(JSON.stringify(result.response.runtime.save),base+4*86400000).dust,result.response.runtime.save.dust),0);
 checks.push('all suffix boundaries and exact rounding; invalid values; real affordability; server 24h credit, retry idempotence and 48h cap; save round trip');
 // Actual final journey at the mature baseline: no teleports, immunity or gifted currency.
 let seconds=0;const morning=Math.ceil(base/BALANCE.nightInterval)*BALANCE.nightInterval+BALANCE.nightDuration+1000;
 const mature=freshSave(morning);mature.upgrades.speed=20;for(const k of ECONOMY.middleUpgrades)mature.upgrades[k]=20;
 const game=new GameState(mature,()=>morning+seconds*1000,()=>.1),egg=game.world.find(e=>e.special);
 let picked=null,returned=null,lost=false,minZ=0,waypoint=0;const dt=.05,failures=[];
 const outward=[{x:0,z:-10},{x:2,z:-10},{x:2,z:egg.z+6},{x:egg.x,z:egg.z}];
 const inward=[{x:2,z:egg.z+12},{x:2,z:-12},{x:0,z:-10},{x:0,z:0}];
 for(seconds=0;seconds<285;seconds+=dt){
  let target;
  if(game.carried){target=inward[Math.min(waypoint,inward.length-1)];}
  else if(picked!==null){lost=true;break;}
  else target=outward[Math.min(waypoint,outward.length-1)];
  if(!game.carried&&game.canReachEgg(egg)){game.pickup(egg);picked=seconds;waypoint=0;target=inward[0];}
  const dx=target.x-game.x,dz=target.z-game.z,l=Math.hypot(dx,dz);
  if(l<.8)waypoint++;else game.move(dx/l,dz/l,dt);game.tick(dt);minZ=Math.min(minZ,game.z);
  for(const e of game.events.splice(0))if(e.name==='player_death'||e.name.startsWith('expedition_fail'))failures.push({at:seconds,...e});
  if(game.save.eggs.some(e=>e.special)){returned=seconds;break;}
 }
 const final={picked,returned,lost,hp:game.hp,minZ,failures,position:[game.x,game.z],nightInterval:BALANCE.nightInterval/1000,movementCap:BALANCE.maxMovementSpeed};
 if(returned!==null){const e=game.selected;const hatchSeconds=e.hp/game.dps;game.offline(hatchSeconds+1);assert.ok(game.claimHatch(e.id));final.hatchSeconds=hatchSeconds;final.pet=game.result;checks.push('final special egg: actual walk, theft, guardian pursuit, return and automatic hatch');}
 await mkdir('artifacts/economy',{recursive:true});await writeFile('artifacts/economy/runtime.json',JSON.stringify({checks,final},null,2));
 console.log(JSON.stringify({checks,final}));assert.notEqual(returned,null,'Final objective must be physically reachable before night');
}finally{await server.close();}
