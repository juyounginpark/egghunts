import assert from 'node:assert/strict';
import {modules,report} from './lib.mjs';
const m=await modules();const {GameState,freshSave,parseSave,EGGS,MONGLES,RARITIES,BALANCE,Input,Platform}=m;
let now=1800000060000;const make=()=>new GameState(freshSave(now),()=>now,()=>.1);
const results=[];const test=async(name,fn)=>{await fn();results.push(name);console.log('PASS',name);};
try {
 await test('ten-million alphabet units, Z to AA, stable fractional display',()=>{
   assert.equal(m.formatNumber(880.000000000001), '880');assert.equal(m.formatNumber(9999999),'9,999,999');assert.equal(m.formatNumber(1e7),'1A');assert.equal(m.formatNumber(1e14),'1B');assert.equal(m.formatNumber(1e182),'1Z');assert.equal(m.formatNumber(1e189),'1AA');assert.equal(m.formatNumber(1e196),'1AB');assert.equal(m.formatNumber(.1+.2,2),'0.3');
 });
 await test('training popup reports actual trail-adjusted speed gain without double multiplication',()=>{
   const g=make();g.save.trails=[0,3];g.save.equippedTrail=3;g.x=BALANCE.gymX;g.z=BALANCE.gymZ;g.interact();const before=g.speed;g.tick(1);
   assert.ok(Math.abs(g.speed-before-g.effectiveTrainingRate)<1e-9);assert.ok(Math.abs(g.events.find(e=>e.name==='training_gain').params.amount-.0165)<1e-9);
 });
 await test('integer egg HP and lossless old floating-point HP migration',()=>{
   assert.ok(EGGS.every(e=>Number.isInteger(e.hp)));assert.equal(EGGS[11].hp,880);
   const s=freshSave(now);s.eggs=[{id:'float',type:11,hp:880.0000000000001,distance:43}];assert.equal(parseSave(JSON.stringify(s),now).eggs[0].hp,880);
   s.eggs[0].hp=900;assert.throws(()=>parseSave(JSON.stringify(s),now));
 });
 await test('sale pays once, removes last equipped pet, preserves discovery/reward on reload',()=>{
   const g=make();g.save.eggs=[{id:'sell',type:0,hp:30,distance:14}];g.save.selected='sell';assert.equal(g.sellEgg('sell'),12);assert.equal(g.sellEgg('sell'),0);assert.equal(g.save.selected,null);
   g.save.mongles[0]=1;g.save.active=[0];assert.equal(g.sellPet(0),10);assert.equal(g.sellPet(0),0);assert.deepEqual(g.save.active,[]);assert.ok(g.hasDiscoveredPet(0));assert.equal(g.claimPet(0),5);
   const h=new GameState(parseSave(JSON.stringify(g.snapshot()),now),()=>now);assert.ok(h.hasDiscoveredPet(0));assert.equal(h.claimPet(0),0);h.z=-20;h.save.mongles[1]=1;assert.equal(h.sellPet(1),0);
 });
 await test('virtual advertisement grants once only after ten seconds',()=>{
   let clock=0;const ad=new m.VirtualAd(()=>clock);assert.equal(ad.remaining,10);assert.equal(ad.claim(),0);clock=9999;assert.equal(ad.claim(),0);clock=10000;assert.equal(ad.remaining,0);assert.equal(ad.claim(),BALANCE.virtualAdReward);assert.equal(ad.claim(),0);
 });
 await test('HP failure auto returns, saves full recovery and cannot revive twice',()=>{
   const g=make();g.selectStage(5);g.z=-12;g.deadline=now+20000;g.hp=1;g.receiveHit(0);assert.equal(g.death,null);assert.ok(g.isAtBase);assert.equal(g.hp,g.maxHp);
   const restored=new GameState(parseSave(JSON.stringify(g.snapshot()),now),()=>now);assert.equal(restored.hp,restored.maxHp);assert.equal(restored.revive(true),false);assert.equal(restored.revive(false),false);
 });
 await test('HP fixed plus proportional damage, no field regen, full base heal',()=>{
   const g=make();g.selectStage(5);g.z=-10;g.receiveHit(0);assert.equal(g.hp,87);g.tick(.5);assert.equal(g.hp,87);g.receiveHit(0);assert.equal(g.hp,87);
   g.tick(.51);g.receiveHit(0);assert.equal(g.hp,74);g.x=g.z=0;g.tick(.01);assert.equal(g.hp,100);
   g.save.upgrades.health=5;g.hp=g.maxHp;g.z=-10;g.immunity=0;g.receiveHit(0);assert.equal(g.hp,184);
   assert.ok(g.bossDamage(4)>g.maxHp*.08);assert.ok(BALANCE.bossRatioDamage.every(p=>p>=.03&&p<=.08));assert.equal(BALANCE.finalStrongAttackRatio,.2);
 });
 await test('global night unaffected by login time or pet loadout',()=>{
   const a=make();now+=1000;const b=make();assert.equal(a.nightAt,b.nightAt);b.save.active=[1,2,3];assert.equal(a.nightAt,b.nightAt);
   const clock=now;now=a.nightAt+5000;const c=make();assert.ok(c.isNight);c.move(1,0,.1);assert.ok(c.x>0);c.move(0,-1,5);assert.equal(c.z,BALANCE.baseMinZ);assert.ok(c.isAtBase);now=clock;
 });
 await test('normalized diagonal, map bounds, carry penalty',()=>{
   const a=make(),b=make();a.move(0,-1,1);b.move(1,-1,1);assert.ok(Math.abs(a.distance-b.distance)<1e-9);
   a.move(100,-100,1000);assert.ok(a.x<=BALANCE.mapX&&a.z>=BALANCE.mapFarZ);
   const speed=b.speed;b.carried=b.world[2];assert.ok(b.speed<speed);
 });
 await test('forward target priority and range',()=>{const g=make();g.world=[{...g.world[0],x:0,z:.2,id:'back'},{...g.world[1],x:0,z:-.8,id:'front'}];assert.equal(g.near.id,'front');g.x=6;assert.equal(g.near,undefined);});
 await test('single carry, drop, repick, store once, deadline race',()=>{
   const g=make();g.z=-14;g.interact();assert.ok(g.carried);const id=g.carried.id;g.interact();assert.equal(g.carried,null);g.interact();assert.equal(g.carried.id,id);
   g.deadline=now+1;g.x=g.z=0;g.tick(.01);g.tick(.01);assert.equal(g.save.eggs.length,1);assert.ok(g.returnReward);
   const h=make();h.z=-14;h.interact();h.deadline=now;h.x=h.z=0;h.tick(.01);assert.equal(h.save.eggs.length,1);assert.equal(h.flyaway,null);
 });
 await test('tap limiter, damage and single hatch',()=>{const g=make();g.save.eggs=[{id:'egg',type:0,hp:30,distance:14}];g.save.selected='egg';assert.ok(g.tap());assert.equal(g.selected.hp,29);assert.equal(g.tap(),false);g.damage(1000);g.damage(1000);assert.equal(g.save.mongles.reduce((a,b)=>a+b,0),1);assert.equal(g.save.dust,EGGS[0].reward);});
 await test('30/60/120FPS auto damage invariant',()=>{const hp=[];for(const fps of [30,60,120]){const g=make();g.save.eggs=[{id:'egg',type:2,hp:1500,distance:74}];g.save.selected='egg';g.save.upgrades.damage=2;g.save.upgrades.rate=3;for(let i=0;i<fps*10;i++)g.tick(1/fps);hp.push(g.selected.hp);}assert.deepEqual(hp,[1375,1375,1375]);});
 await test('pause and elapsed old deadline never end an expedition',()=>{const g=make();g.move(0,-1,2);const z=g.z;g.tick(0);now+=46000;g.tick(.01);assert.equal(g.z,z);assert.ok(g.deadline);assert.equal(g.flyaway,null);});
 await test('upgrade cost, insufficient funds, effects, reload',()=>{const g=make();assert.equal(g.upgrade('speed'),false);g.save.dust=1000;const cost=g.cost('speed'),speed=g.speed;assert.ok(g.upgrade('speed'));assert.equal(g.save.dust,1000-cost);assert.ok(g.speed>speed);const h=new GameState(parseSave(JSON.stringify(g.snapshot()),now),()=>now);assert.equal(h.save.dust,g.save.dust);assert.equal(h.speed,g.speed);});
 await test('training requires machine, accrues per second, paid rate upgrade',()=>{const g=make();g.x=BALANCE.gymX;g.z=BALANCE.gymZ;g.interact();assert.ok(g.training);const speed=g.speed;g.tick(10);assert.ok(Math.abs(g.speed-speed-.1)<1e-8);g.save.dust=100;g.upgrade('training');assert.equal(g.trainingRate,.02);const position=[g.x,g.z];g.move(-1,0,.1);assert.equal(g.training,true);assert.deepEqual([g.x,g.z],position);g.interact();assert.equal(g.training,false);g.move(-1,0,.1);assert.ok(g.x<position[0]);});
 await test('trail ownership, multiplier, no double purchase',()=>{const g=make();assert.equal(g.buyTrail(3),false);g.save.dust=1000;const speed=g.speed;g.buyTrail(3);assert.equal(g.save.dust,350);assert.ok(Math.abs(g.speed/speed-1.65)<1e-8);g.buyTrail(3);assert.equal(g.save.dust,350);});
 await test('discovery and stage/all rewards cannot be replayed after reload',()=>{const g=make();assert.equal(g.claimPet(0),0);g.save.mongles.fill(1);const rare=g.discoveryReward(99);assert.ok(rare>g.discoveryReward(0));assert.equal(g.claimPet(99),rare);assert.equal(g.claimPet(99),0);assert.equal(g.claimRegion(0),100);assert.equal(g.claimRegion(0),0);assert.equal(g.claimCollection(),5000);const h=new GameState(parseSave(JSON.stringify(g.snapshot()),now),()=>now);assert.equal(h.claimCollection(),0);assert.equal(h.claimPet(99),0);});
 await test('20x egg size, 10..100 pet detail and exact probabilities',()=>{assert.equal(RARITIES[6].scale/RARITIES[0].scale,20);assert.equal(Math.min(...MONGLES.map(m=>m.grid)),10);assert.equal(Math.max(...MONGLES.map(m=>m.grid)),100);assert.deepEqual(RARITIES.map(r=>r.chance),[45,28,15,7,3.5,1.3,.2]);});
 await test('invalid/duplicate saves rejected without mutation',()=>{const s=freshSave(now);s.eggs=[{id:'dup',type:0,hp:30,distance:1},{id:'dup',type:0,hp:30,distance:1}];assert.throws(()=>parseSave(JSON.stringify(s),now));assert.throws(()=>parseSave('{broken',now));});
 await test('input deadzone, release, pointer ownership, keyboard fallback',()=>{
   const handlers={},globalHandlers={};globalThis.window={addEventListener:(n,f)=>globalHandlers[n]=f};
   const pad={addEventListener:(n,f)=>handlers[n]=f,setPointerCapture:()=>{},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};const knob={style:{}};const input=new Input(pad,knob,()=>{},()=>{});
   handlers.pointerdown({pointerId:1,clientX:53,clientY:53});assert.deepEqual(input.vector(),{x:0,y:0});
   handlers.pointermove({pointerId:2,clientX:100,clientY:50});assert.equal(input.x,0);handlers.pointermove({pointerId:1,clientX:100,clientY:50});assert.equal(input.x,1);handlers.pointerup({pointerId:1});assert.equal(input.x,0);
   globalHandlers.keydown({target:{matches:()=>false},key:'w',repeat:false,preventDefault:()=>{}});assert.equal(input.vector().y,-1);globalHandlers.keyup({key:'w'});assert.equal(input.vector().y,0);
 });
 await test('platform native storage order, score string, optional errors, cleanup',async()=>{
   const calls=[],data=new Map();let callback;globalThis.document={documentElement:{style:{setProperty:(k,v)=>calls.push([k,v])}}};
   const sdk={Environment:{tossAppVersion:'5.999',getServerTime:Object.assign(async()=>Date.now(),{isSupported:()=>true})},getUserKeyForGame:async()=>({hash:'qa'}),Storage:{getItem:async k=>data.get(k),setItem:async(k,v)=>{data.set(k,v);calls.push('save');}},SafeArea:{get:()=>({top:59,bottom:34,left:0,right:0}),subscribe:({onEvent})=>{callback=onEvent;return()=>calls.push('unsubscribe');}},Game:{setLeaderboardScore:async v=>{calls.push(v);return {statusCode:'SUCCESS'};},openLeaderboard:async()=>calls.push('open')},Analytics:{log:()=>{throw Error('optional')}},Device:{triggerHaptic:async()=>{throw Error('optional')}}};
   const p=new Platform(sdk);await p.login();await p.save(freshSave(now));await p.leaderboard(32.9);p.track('test');p.haptic();assert.deepEqual(calls.find(v=>v?.score),{score:'32'});assert.ok(calls.indexOf('save')<calls.indexOf('open'));assert.equal((await p.load()).version,1);callback({top:20,bottom:0,left:0,right:0});p.dispose();assert.ok(calls.includes('unsubscribe'));
   sdk.Game.setLeaderboardScore=async()=>undefined;await assert.rejects(()=>p.submitScore(1));sdk.getUserKeyForGame=async()=>null;await assert.rejects(()=>new Platform(sdk).login());
 });
 await report('unit',{passed:results.length,tests:results});
}finally{await m.cleanup();}
