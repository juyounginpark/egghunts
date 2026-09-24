// Manual, user-requested catalogue / server / village compatibility review.
/* global structuredClone */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}}),passed=[];
try{
 const load=n=>server.ssrLoadModule(`/src/${n}.ts`);
 const {GameState,freshSave,parseSave}=await load('game'),{MONGLES,EGGS}=await load('data');
 const {HAZARDS,STAGE_ENVIRONMENT_IDS}=await load('stage-data');
 const {DRAGON_RULES,newDragonClue,observeDragon,dragonReady,validateDragonClues}=await load('dragon-discovery');
 const {HazardManager}=await load('hazards');
 const {FARM_PLOTS,farmGym,farmLocal,clampVillage}=await load('village');
 const {MapCollision,villageMapColliders}=await load('map-collision');
 const {exportRuntime}=await load('online-state');
 const {runRoom}=await server.ssrLoadModule('/server/room-engine.ts');
 const now=1800000060000,make=()=>new GameState(freshSave(now),()=>now,()=>.25);
 const test=(name,fn)=>{fn();passed.push(name);console.log('PASS',name);};
 test('320 stable IDs; stage, species, tier and name match pre-rework catalogue',()=>{
  assert.equal(MONGLES.length,320);
  for(const [path,offset]of [['src/stage-pet-catalog.ts',100],['src/secret-dragon-catalog.ts',300]]){
   const old=execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'show',`HEAD:${path}`],{encoding:'utf8'});
   const rows=JSON.parse(old.slice(old.indexOf('['),old.lastIndexOf(']')+1));
   rows.forEach((r,i)=>{const m=MONGLES[offset+i];assert.equal(m.name,r.name);assert.equal(m.tier,r.tier);assert.equal(m.stageId,r.stageId);assert.equal(m.species,r.slot);});
  }
 });
 test('100 / 300 / 320 saves preserve counts, equipment, sold discoveries and claimed rewards',()=>{
  for(const length of [100,300,320]){
   const s=freshSave(now);s.mongles=Array.from({length},(_,i)=>i%4);s.active=[1,2];s.obtainedPets=[0,length-1];s.claimedPets=[2];s.dust=1234;
   const r=parseSave(JSON.stringify(s),now);assert.deepEqual(r.mongles.slice(0,length),s.mongles);assert.equal(r.mongles.length,320);assert.deepEqual(r.active,s.active);assert.deepEqual(r.obtainedPets,s.obtainedPets);assert.deepEqual(r.claimedPets,[2]);assert.equal(r.dust,1234);assert.deepEqual(r.dragonClues,{});
  }
 });
 const completed={};
 test('20 discovery rules use real hazards and observed stage-specific actions',()=>{
  for(let stage=1;stage<=20;stage++){
   const rule=DRAGON_RULES[stage-1],c=newDragonClue(),watch={stage,observed:{}};let serial=0;
   assert.equal(dragonReady(stage,c),false);
   for(const id of new Set([...rule.avoid,...rule.carry??[],...rule.escape??[]])){
    assert.ok(STAGE_ENVIRONMENT_IDS[stage-1].includes(id),`${stage}:${id}`);
    const d=HAZARDS.find(h=>h.id===id),manager=new HazardManager();
    const h=manager.spawn(d,{x:0,z:-20,vx:0,vz:0,facing:{x:0,z:-1},moving:false,carrying:true,metal:false});h.serial=++serial;
    const p={x:3,z:-20,offset:0,hit:0,egg:'stage-egg',moving:true};
    observeDragon(c,watch,stage,.1,p,[h]);h.phase='Active';h.elapsed=.1;
    if(rule.escape?.includes(id)){
     // Enter the outer pull/delay field, then leave it without reaching its damage core.
     observeDragon(c,watch,stage,.1,{...p,x:.8},[h]);
     observeDragon(c,watch,stage,.1,{...p,x:d.radius+2},[h]);
    }
    h.phase='Recovery';observeDragon(c,watch,stage,.1,p,[h]);
   }
   c.depth=true;c.sides=3;c.quiet=2;c.returned=true;
   assert.equal(dragonReady(stage,c),true,`stage ${stage}`);completed[stage]=c;
   const g=make();g.save.dragonClues[stage]=structuredClone(c);assert.equal(g.claimDragon(stage),true);assert.equal(g.claimDragon(stage),false);g.damage(1e9);assert.equal(g.result,299+stage);
  }
  validateDragonClues(completed);
 });
 test('no observation, damage, dropped egg and forged progress do not earn clues',()=>{
  const d=HAZARDS.find(h=>h.id==='hay'),manager=new HazardManager();const h=manager.spawn(d,{x:0,z:-20,vx:0,vz:0,facing:{x:0,z:-1},moving:false,carrying:false,metal:false});
  const p={x:2,z:-20,offset:0,hit:0,egg:'egg',moving:true};
  for(const mode of ['unseen','hit','drop']){
   const c=newDragonClue(),w={stage:1,observed:{}};h.hit=false;h.phase='Telegraph';
   if(mode!=='unseen')observeDragon(c,w,1,.1,p,[h]);
   h.phase='Recovery';h.hit=mode==='hit';observeDragon(c,w,1,.1,{...p,egg:mode==='drop'?null:'egg'},[h]);
   if(mode!=='drop')assert.deepEqual(c.avoided,[]);assert.deepEqual(c.carried,[]);
  }
  assert.throws(()=>validateDragonClues({1:{...newDragonClue(),avoided:['ufo']}}));
  const g=make();assert.equal(g.claimDragon(1),false);g.save.dragonClues[1]=structuredClone(completed[1]);g.z=-10;assert.equal(g.claimDragon(1),false);g.z=0;g.save.eggs=Array.from({length:6},(_,i)=>({id:String(i),type:0,hp:1,distance:0}));assert.equal(g.claimDragon(1),false);
 });
 test('all seven tiers hatch from correct stage; existing random dragon eggs still hatch',()=>{
  for(let stage=1;stage<=20;stage++)for(let tier=0;tier<7;tier++){
   const g=make(),type=EGGS.findIndex(e=>e.region===Math.floor((stage-1)/4)&&e.tier===tier);
   g.save.eggs=[{id:'old',type,hp:1,distance:10,stageId:stage,variant:0}];g.save.selected='old';g.damage(1);assert.equal(MONGLES[g.result].stageId,stage);assert.equal(MONGLES[g.result].tier,tier);assert.notEqual(MONGLES[g.result].species,10);
   if(tier===6){g.result=null;g.save.eggs=[{id:'old-secret',type,hp:1,distance:10,stageId:stage,variant:5}];g.save.selected='old-secret';g.damage(1);assert.equal(g.result,299+stage);}
   assert.ok(g.world.every(e=>Number.isInteger(e.variant)&&e.variant>=0&&e.variant<=5));
  }
 });
 test('server rejects forged claims; issue/retry is exactly once and private per player',()=>{
  const members=[0,1].map(slot=>({user_id:`u${slot}`,slot,last_seen:new Date(now).toISOString()}));
  const g=make();g.save.dragonClues=structuredClone(completed);
  const profiles=[{user_id:'u0',state:exportRuntime(g)},{user_id:'u1',state:null}],cmd={id:'claim',kind:'claimDragon',value:1},request={id:'request',commands:[cmd]};
  let r=runRoom(null,members,profiles,'u0',request,now);assert.equal(r.room.players.u0.runtime.save.eggs.length,1);assert.equal(r.room.players.u1.runtime.save.eggs.length,0);
  r=runRoom(r.room,members,profiles,'u0',request,now+200);assert.equal(r.room.players.u0.runtime.save.eggs.length,1);
  r=runRoom(r.room,members,profiles,'u1',{id:'forged',commands:[{...cmd,id:'forged'}],save:{dragonClues:completed}},now+400);assert.ok(r.response.errors.includes('DRAGON_NOT_READY'));assert.equal(r.room.players.u1.runtime.save.eggs.length,0);
 });
 test('five farms face the promenade; entry and all five gym approaches are traversable',()=>{
  const collision=new MapCollision();collision.setFarm(villageMapColliders());
  let p={x:0,z:0};for(let i=0;i<240;i++)p=collision.move(p.x,p.z,0,-.03,1);assert.ok(p.z<-6,'village exit');
  for(let slot=0;slot<5;slot++){
   const plot=FARM_PLOTS[slot],front=farmLocal(slot,0,3),gym=farmGym(slot);assert.ok(Math.hypot(front.x,front.z-9)<Math.hypot(plot.x,plot.z-9));
   p=farmLocal(slot,2.1,4);for(let i=0;i<100;i++){const dx=gym.x-p.x,dz=gym.z-p.z,d=Math.hypot(dx,dz);if(d<.05)break;p=collision.move(p.x,p.z,dx/d*.03,dz/d*.03,1);}assert.ok(Math.hypot(p.x-gym.x,p.z-gym.z)<.15,`gym ${slot}`);
   const g=make();g.farmSlot=slot;assert.deepEqual(g.gym,gym);
  }
  assert.ok(Math.hypot(clampVillage(14,22).x,clampVillage(14,22).z-9)<=13.250001);
 });
 const rows=JSON.parse(await readFile('docs/art/stage-pet-designs.json','utf8')),hashes=new Set(),geometry=[];
 test('220 distinct 24³ geometries, exact rig partition and symmetric facial eyes',()=>{
  for(const row of rows){const m=JSON.parse(readFileSync(`public/models/${row.key}.json`,'utf8'));
   assert.deepEqual(m.size,[24,24,24]);const cells=new Map(m.voxels.map(v=>[v.slice(0,3).join(','),v[3]]));assert.equal(cells.size,m.voxels.length);
   assert.ok(m.voxels.every(v=>v.slice(0,3).every(n=>Number.isInteger(n)&&n>=0&&n<24)));
   const parts=Object.values(m.parts).flatMap(p=>p.voxels);assert.equal(parts.length,m.voxels.length);for(const v of parts)assert.equal(cells.get(v.slice(0,3).join(',')),v[3]);
   const eyes=m.parts.eyes.voxels;assert.ok(eyes.length>=4);for(const [x,y,z,c]of eyes)assert.equal(cells.get([23-x,y,z].join(',')),c,`${row.key} eyes`);
   const hash=createHash('sha256').update(JSON.stringify(m.voxels.map(v=>v.slice(0,3)))).digest('hex');assert.ok(!hashes.has(hash),`${row.key} duplicate shape`);hashes.add(hash);geometry.push({id:row.id,voxels:m.voxels.length,eyes:eyes.length});
  }
 });
 await writeFile('docs/art/stage-integration-audit.json',JSON.stringify({passed,geometry},null,2)+'\n');
 // Conditions live with gameplay rules; documentation consumes them, not a second copy.
 for(const row of rows)if(row.secretDragon){row.discoveryHint=DRAGON_RULES[row.stage-1].hint;row.acquisitionCondition=DRAGON_RULES[row.stage-1].condition;row.reveal='2.4초 동안 해당 스테이지 지형 문양 6개가 바깥쪽으로 펼쳐짐';}
 await writeFile('docs/art/stage-pet-designs.json',JSON.stringify(rows,null,2)+'\n');
 const guide=await readFile('docs/art/stage-pet-designs.md','utf8');await writeFile('docs/art/stage-pet-designs.md',guide.split('\n## 시크릿 발견 조건')[0]+'\n## 시크릿 발견 조건\n\n| 스테이지 | 힌트 | 서버 판정 조건 |\n|---|---|---|\n'+DRAGON_RULES.map((r,i)=>`| ${i+1} | ${r.hint} | ${r.condition} |`).join('\n')+'\n');
}finally{await server.close();}
