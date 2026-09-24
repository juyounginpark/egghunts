import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {modules,report} from './lib.mjs';
const m=await modules();let now=1800000060000;
const make=()=>new m.GameState(m.freshSave(now),()=>now,()=>.1);
const results=[];const test=(name,fn)=>{fn();results.push(name);console.log('PASS',name);};
const player={x:0,z:-14,vx:0,vz:0,facing:{x:0,z:-1},carrying:false,metal:false,moving:false};
const def=id=>m.HAZARDS.find(d=>d.id===id);
try{
 test('same-night reload does not reroll saved nests',()=>{
  const previous=now;now=Math.floor(now/m.BALANCE.nightInterval)*m.BALANCE.nightInterval+1000;const g=make();assert.equal(g.isNight,true);const saved=m.parseSave(JSON.stringify(g.snapshot()),now);const h=new m.GameState(saved,()=>now,()=>.9);assert.deepEqual(h.world,g.world);now=previous;
 });
 test('HP level table and capped level speed match specification',()=>{
  assert.deepEqual([1,10,20,30,40,50,60].map(m.levelHP),[100,145,215,285,355,425,495]);assert.equal(m.levelSpeed(60),1.6);assert.equal(m.levelSpeed(1000),1.6);
 });
 test('new save, legacy inventory migration and invalid progression',()=>{
  const old=m.freshSave(now);old.discovered=[0];old.mongles[0]=1;const g=new m.GameState(old,()=>now);assert.deepEqual(g.progression.seenEggs,[0]);assert.deepEqual(g.progression.hatchedPets,[0]);
  const s=g.snapshot();s.progression.level=-1;assert.throws(()=>m.parseSave(JSON.stringify(s),now));
 });
 test('early guardians also damage after theft; harmless environmental patterns stay zero',()=>{
  for(let stage=1;stage<=4;stage++){const g=make();g.selectStage(stage);g.z=-14;g.deadline=now+45000;g.receiveHit(4);assert.ok(g.hp<100);}
 });
 test('one second immunity, no field regen, base full recovery',()=>{
  const g=make();g.selectStage(5);g.z=-14;g.deadline=now+45000;g.receiveHit(0);assert.equal(g.hp,87);g.receiveHit(0);assert.equal(g.hp,87);g.tick(.5);assert.equal(g.hp,87);g.receiveHit(0);assert.equal(g.hp,87);
  g.tick(.51);g.receiveHit(0);assert.equal(g.hp,74);g.x=g.z=0;g.tick(.01);assert.equal(g.hp,100);
 });
 test('nonfatal hit drops a recoverable egg, fatal hit loses carried egg and settles once',()=>{
  const g=make();g.selectStage(5);g.z=-14;g.deadline=now+45000;g.pickup(g.world[2]);const id=g.carried.id;g.progression.pendingXP=50;g.receiveHit(0);assert.equal(g.carried,null);assert.ok(g.world.some(e=>e.id===id));g.knockback.remaining=0;g.pickup(g.world.find(e=>e.id===id));
  g.immunity=0;g.hp=1;g.receiveHit(0);assert.equal(g.carried,null);assert.ok(g.flyaway);assert.equal(g.save.eggs.length,0);assert.ok(g.isAtBase);assert.equal(g.hp,g.maxHp);assert.equal(g.progression.xp,35);assert.equal(g.failExpedition('hp'),false);assert.equal(g.progression.xp,35);
 });
 test('hit slow expires, movement normalized and health clamped on load',()=>{
  const g=make();g.selectStage(5);g.z=-14;g.deadline=now+45000;const speed=g.speed;g.receiveHit(0);assert.ok(Math.abs(g.speed-speed*.8)<1e-9);g.tick(.51);assert.equal(g.speed,speed);
  const save=g.snapshot();save.progression.hp=999;save.expedition.hp=999;const h=new m.GameState(m.parseSave(JSON.stringify(save),now),()=>now);assert.equal(h.hp,h.maxHp);
 });
 test('XP carry-over performs multiple levels and persists stats',()=>{
  const g=make(),speed=g.speed;g.hp=20;g.gainXP(m.requiredXP(1)+m.requiredXP(2)+17);assert.equal(g.level,3);assert.equal(g.progression.xp,17);assert.equal(g.hp,110);assert.ok(g.speed>speed);
  const h=new m.GameState(m.parseSave(JSON.stringify(g.snapshot()),now),()=>now);assert.equal(h.level,3);assert.equal(h.progression.xp,17);assert.equal(h.maxHp,110);
 });
 test('discovery and distance XP ledger survives failure and reload',()=>{
  const g=make();g.z=-14;g.deadline=now+45000;g.tick(.01);assert.equal(g.progression.pendingXP,32);g.failExpedition('hp');assert.equal(g.progression.xp,22);
  const h=new m.GameState(m.parseSave(JSON.stringify(g.snapshot()),now),()=>now);h.z=-14;h.deadline=now+45000;h.tick(.01);assert.equal(h.progression.pendingXP,0);
 });
 test('return XP for every rarity and stage four unlock',()=>{
  for(let tier=0;tier<7;tier++){const g=make();g.selectStage(4);g.carried={...g.world[2],type:tier*5};g.deadline=now+45000;g.tick(.01);const total=g.progression.xp+Array.from({length:g.level-1},(_,i)=>m.requiredXP(i+1)).reduce((a,b)=>a+b,0);assert.equal(total,m.PROGRESSION.returnXP[tier]);assert.ok(g.progression.healthUnlocked);assert.ok(g.progression.completedStages.includes(4));}
 });
 test('first hatch XP never repeats after pet sale/reload',()=>{
  const g=make();const hatch=()=>{g.result=null;g.save.eggs=[{id:'egg',type:0,hp:1,distance:14}];g.save.selected='egg';g.damage(1);};hatch();assert.equal(g.level,2);g.sellPet(g.result);const xp=g.progression.xp;hatch();assert.equal(g.level,2);assert.equal(g.progression.xp,xp);
 });
 test('retired player traits are removed without resetting level or inventory',()=>{
  const g=make();g.progression.level=5;g.progression.requiredXP=m.requiredXP(5);const saved=g.snapshot();saved.progression.traits={sturdy:5,light:5,porter:5,escape:1,shield:1,clock:5};saved.mongles[0]=2;
  const h=new m.GameState(m.parseSave(JSON.stringify(saved),now),()=>now);assert.equal(h.level,5);assert.equal(h.maxHp,g.maxHp);assert.equal(h.speed,g.speed);assert.equal(h.duration,g.duration);assert.equal(h.progression.traits,undefined);assert.equal(h.save.mongles[0],2);
 });
 test('defense cap and full-health single-hit survival',()=>{assert.equal(m.reducedDamage(100,0,100,.9),50);assert.equal(m.reducedDamage(1000,1,100),90);});
 test('all twenty stages have valid explicit attacks and minimum warnings',()=>{
  assert.equal(m.STAGES.length,20);for(const s of m.STAGES)assert.ok(m.HAZARDS.some(d=>d.stageId===s.id));
  for(const d of m.HAZARDS){assert.ok(d.telegraphDuration>=d.minTelegraph,d.id);assert.ok(d.carryTelegraphBonus>=.2);assert.ok(d.cooldown>d.activeDuration);if(d.stageId<=4&&!m.GUARDIAN_ATTACKS.has(d.id))assert.equal(d.damage+d.damagePercent,0);}
 });
 test('telegraph no damage, active hit once, outside no damage',()=>{
  const manager=new m.HazardManager();manager.reset(5);const h=manager.spawn(def('tentacle'),player);let hits=0;manager.tick(1,5,player,()=>hits++,()=>{},()=>{});assert.equal(hits,0);manager.tick(.6,5,player,()=>hits++,()=>{},()=>{});assert.equal(hits,1);manager.tick(.1,5,player,()=>hits++,()=>{},()=>{});assert.equal(hits,1);assert.equal(m.contains(h,{x:6,z:-14}),false);
 });
 test('carrying gets twenty percent extra warning and can move out',()=>{
  const manager=new m.HazardManager(),h=manager.spawn(def('tentacle'),{...player,carrying:true});assert.ok(Math.abs(h.warning-1.8)<1e-9);
  const g=make();g.z=-14;g.pickup(g.world[2]);g.move(1,0,h.warning);assert.equal(m.contains(h,{x:g.x,z:g.z}),false);
 });
 test('cover ray blocks attacks, exposed player is hit',()=>{
  assert.ok(m.blockedByCover({x:-6,z:-12},{x:0,z:-12}));assert.equal(m.blockedByCover({x:-6,z:-8},{x:0,z:-8}),false);
  const manager=new m.HazardManager();manager.reset(5);const h=manager.spawn(def('sweep'),{...player,z:-12});h.origin={x:-6,z:-12};h.target={x:0,z:-12};h.angle=0;h.phase='Active';let hits=0;manager.tick(.1,5,{...player,z:-12},()=>hits++,()=>{},()=>{});assert.equal(hits,0);assert.ok(h.blocked);
 });
 test('30/60/120 FPS produce same attack sequence and hit count',()=>{
  const run=fps=>{const manager=new m.HazardManager();let hits=0;for(let i=0;i<fps*20;i++)manager.tick(1/fps,5,player,()=>hits++,()=>{},()=>{});return {hits,ids:manager.attacks.map(h=>h.definition.id)};};assert.deepEqual(run(30),run(60));assert.deepEqual(run(60),run(120));
 });
 test('final stage phases mix at most two definitions and golden wave is twenty percent',()=>{
  assert.equal(m.stagePatterns(20,-14)[0].id,'void-hand');assert.equal(m.stagePatterns(20,-50).length,2);const wave=m.stagePatterns(20,-100)[0];assert.equal(wave.damagePercent,.2);assert.equal(wave.damage,0);
 });
 test('continuous zones stop outside, Medusa requires facing, and pull respects metal',()=>{
  const zone=(id,p,seconds)=>{const manager=new m.HazardManager();manager.reset(def(id).stageId);const h=manager.spawn(def(id),p);h.phase='Active';let hits=0,push=0;const statuses=[];manager.tick(seconds,def(id).stageId,p,()=>hits++, (x,z)=>push+=Math.hypot(x,z),(key)=>statuses.push(key));return {hits,push,statuses};};
  assert.equal(zone('puddle',player,.5).hits,1);
  const manager=new m.HazardManager();manager.reset(16);const puddle=manager.spawn(def('puddle'),player);puddle.phase='Active';let hits=0;manager.tick(.5,16,{...player,x:6},()=>hits++,()=>{},()=>{});assert.equal(hits,0);
  assert.ok(zone('medusa',player,1.6).statuses.includes('stone'));assert.equal(zone('medusa',{...player,facing:{x:0,z:1}},1.6).statuses.includes('stone'),false);
  assert.ok(zone('clock',player,.1).statuses.includes('delay'));
  const pull=metal=>{const manager=new m.HazardManager();manager.reset(18);const h=manager.spawn(def('magnet'),player);h.phase='Active';let amount=0;manager.tick(.1,18,{...player,x:1,metal},()=>{},(x,z)=>amount+=Math.hypot(x,z),()=>{});return amount;};assert.ok(pull(true)>pull(false));
 });
 test('100 stage egg sculptures have unique geometry and valid 20-cube bounds',()=>{
  const shapes=new Set();for(let stage=1;stage<=20;stage++)for(let variant=0;variant<5;variant++){
   const data=m.stageEggCells(stage,variant);assert.ok(data.cells.length>100);assert.ok(data.cells.every(c=>c.slice(0,3).every(n=>Number.isInteger(n)&&n>=0&&n<20)));
   const signature=data.cells.map(c=>c.slice(0,3).join(',')).sort().join(';');assert.ok(!shapes.has(signature),`duplicate geometry ${stage}:${variant}`);shapes.add(signature);
  }assert.equal(shapes.size,100);
 });
 test('five variants per region survive carrying, return and save reload',()=>{
  const g=make();for(const r of g.route)assert.deepEqual(g.world.filter(e=>e.stageId===r.stage).map(e=>e.variant),[0,1,2,3,4]);
  const e=g.world.find(e=>e.stageId===7&&e.variant===4);g.z=e.z;g.pickup(e);g.deadline=now+1;g.z=0;g.tick(.01);
  assert.equal(g.save.eggs[0].stageId,7);assert.equal(g.save.eggs[0].variant,4);const h=new m.GameState(m.parseSave(JSON.stringify(g.snapshot()),now),()=>now);assert.equal(h.selected.variant,4);
 });
 test('legacy expedition retains collected inventory and original selected-stage egg source',()=>{
  const old=m.freshSave(now);old.progression=m.newProgression();old.progression.stage=5;old.eggs=[{id:'owned',type:0,hp:30,distance:14}];old.mongles[0]=2;
  old.expedition={deadline:now-1000,x:0,z:-140,carried:{id:'held',type:4,hp:30,distance:140,x:0,z:-140,expires:now+1000}};
  const g=new m.GameState(m.parseSave(JSON.stringify(old),now),()=>now);g.tick(.01);assert.equal(g.carried.id,'held');assert.equal(g.carried.stageId,5);assert.equal(g.save.eggs[0].id,'owned');assert.equal(g.save.mongles[0],2);
 });
 test('walking traverses twenty regions both ways without changing chosen entrance',()=>{
  const g=make();assert.equal(g.speed,3.2);assert.equal(m.BALANCE.mapFarZ,m.ROUTE_FAR_Z);
  for(const r of g.route){while(-g.z<r.home)g.move(0,-1,.05);assert.equal(g.stage.id,r.stage);}
  const restored=new m.GameState(m.parseSave(JSON.stringify(g.snapshot()),now),()=>now);assert.equal(restored.stage.id,20);assert.equal(restored.progression.stage,1);
  for(const r of [...g.route].reverse()){while(-g.z>r.home)g.move(0,1,.05);assert.equal(g.stage.id,r.stage);}
  assert.ok(g.progression.healthUnlocked);assert.ok(g.events.filter(e=>e.name==='region_enter').length>=39);
 });
 test('sleeping guardian wakes on theft, attacks, drops egg, returns and wakes on repick',()=>{
  const g=make();g.selectStage(5);g.z=-14;g.deadline=now+1;g.tick(6);assert.equal(g.bosses[0].mode,'idle');assert.ok(g.hazards.attacks.every(h=>h.environment));
  const egg=g.world[2];g.pickup(egg);assert.equal(g.bosses[0].mode,'chase');g.tick(4);assert.ok(g.hp<g.maxHp);assert.equal(g.carried,null);assert.equal(g.world.filter(e=>e.id===egg.id).length,1);assert.ok(Math.hypot(g.x-egg.x,g.z-egg.z)>1);
  assert.notEqual(g.bosses[0].mode,'chase');g.x=egg.x;g.z=egg.z;g.interact();assert.equal(g.carried.id,egg.id);assert.equal(g.bosses[0].mode,'chase');
 });
 test('distant guardian cannot land remote attacks; stages keep source completion on return',()=>{
  const g=make();g.selectStage(5);g.z=-14;g.pickup(g.world[2]);g.bosses[0].z=-100;g.tick(2);assert.equal(g.hp,g.maxHp);assert.ok(g.hazards.attacks.every(h=>h.environment));
  const h=make(),egg=h.world.find(e=>e.stageId===4);h.z=egg.z;h.pickup(egg);h.deadline=now+1;h.x=h.z=0;h.tick(.01);assert.ok(h.progression.completedStages.includes(4));assert.ok(!h.progression.completedStages.includes(1));
 });
 test('final wall blocks forward movement and knockback for default and shortcut entrances',()=>{
  for(const start of [1,8,20]){const g=make();g.selectStage(start);g.move(0,-1,10000);assert.equal(g.z,g.farZ);assert.equal(g.stage.id,20);g.push(0,-20);assert.equal(g.z,g.farZ);g.move(0,1,.1);assert.ok(g.z>g.farZ);}
 });
 test('late final-stage patterns use local depth, not total route distance',()=>{
  const g=make();g.z=-(19*m.ROUTE.length+14);assert.equal(g.stage.id,20);assert.equal(m.stagePatterns(20,g.z+g.stageOffset)[0].id,'void-hand');g.z-=90;assert.equal(m.stagePatterns(20,g.z+g.stageOffset)[0].id,'creation-wave');
 });
 test('speed upgrades and training increase measured movement, including carrying',()=>{
  for(const carrying of [false,true]){
   const distance=(upgrades,training)=>{const g=make();g.z=-8;g.save.upgrades.speed=upgrades;g.save.trainingSpeed=training;if(carrying)g.carried=g.world[2];const speed=g.speed;g.move(0,-1,1);assert.ok(Math.abs(-g.z-8-speed)<1e-9);return speed;};
   assert.ok(distance(5,0)>distance(0,0));assert.ok(distance(5,2)>distance(5,0));
  }
 });
 test('every stage increases guardian speed and uses the same close-range shove',()=>{
  for(let stage=1;stage<=20;stage++){
   if(stage>1)assert.ok(m.guardianSpeed(stage)>m.guardianSpeed(stage-1));
   const g=make();g.selectStage(stage);g.z=-14;g.deadline=now+45000;g.pickup(g.world[2]);const egg=g.carried.id,b=g.bosses[0];b.x=g.x;b.z=g.z-1;
   g.tickBosses(m.ROUTE.bossWindup-.01);assert.equal(g.hp,g.maxHp);g.tickBosses(.02);
   assert.equal(g.carried,null);assert.equal(g.world.filter(e=>e.id===egg).length,1);assert.ok(g.hp<g.maxHp);assert.equal(g.knockback.remaining,m.ROUTE.bossKnockbackSeconds);
  }
 });
 test('environmental hazards use map coordinates even when player and guardian move',()=>{
  const run=(x,z,awake)=>{const manager=new m.HazardManager();manager.tick(1,5,{...player,x,z,guardianAwake:awake},()=>{},()=>{},()=>{});return manager.attacks.map(h=>({id:h.definition.id,target:h.target,origin:h.origin,environment:h.environment}));};
  assert.deepEqual(run(-5,-12,false),run(5,-30,true));assert.ok(run(0,-14,false).every(h=>h.environment));
 });
 test('offline night crossing loses egg and settles pending XP only once',()=>{
  const g=make();g.z=-14;g.deadline=now+45000;g.pickup(g.world[2]);g.progression.pendingXP=50;const saved=JSON.stringify(g.snapshot()),before=now;
  now=g.nightAt+m.BALANCE.nightDuration+1000;const h=new m.GameState(m.parseSave(saved,now),()=>now);assert.equal(h.carried,null);assert.ok(h.isAtBase);assert.equal(h.progression.xp,35);
  const reload=new m.GameState(m.parseSave(JSON.stringify(h.snapshot()),now),()=>now);assert.equal(reload.progression.xp,35);now=before;
 });
 const rows=m.HAZARDS.filter(d=>d.damage||d.damagePercent).map(d=>{const stage=m.STAGES[d.stageId-1],hp=m.levelHP(stage.minLevel),damage=m.reducedDamage(d.damage,d.damagePercent,hp);return `| ${d.stageId} | ${d.displayName} | ${stage.minLevel} | ${hp} | ${damage.toFixed(1)} | ${Math.ceil(hp/damage)} |`;});
 await mkdir('artifacts/qa-summary',{recursive:true});await writeFile('artifacts/qa-summary/health-balance-report.md',`# Health damage audit\n\nNo traits, legacy purchases or pet defense. Hits until failure at recommended minimum level. Explicit attack damage takes precedence over approximate survival targets; late stages remain more forgiving than the requested 3–5 hits and need playtest calibration.\n\n| Stage | Attack | Level | HP | Damage | Hits to failure |\n|---|---|---:|---:|---:|---:|\n${rows.join('\n')}\n`);
 await report('progression',{passed:results.length,tests:results});
}finally{await m.cleanup();}
