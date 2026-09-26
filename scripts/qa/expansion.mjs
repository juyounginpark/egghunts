// Explicit checks requested by docs/art/add-380-characters-prompt.md.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
const baseline=JSON.parse(await readFile('docs/art/expansion-baseline.json','utf8'));
await mkdir('artifacts/expansion',{recursive:true});
const oldSource=execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'show',`${baseline.commit}:src/data.ts`],{encoding:'utf8'});
await writeFile('artifacts/expansion/old-data.ts',oldSource.replaceAll("from './","from '../../src/"));
const server=await createServer({server:{middlewareMode:true}});
try{
 const old=await server.ssrLoadModule('/artifacts/expansion/old-data.ts');
 const current=await server.ssrLoadModule('/src/data.ts');
 const {MONGLES,EGGS}=current;
 const {freshSave,parseSave,GameState}=await server.ssrLoadModule('/src/game.ts');
 assert.deepEqual(MONGLES.slice(0,321),old.MONGLES,'all existing identities, stats and references');
 for(const key of ['EGGS','RARITIES','BALANCE','PET_ABILITIES','ECONOMY'])assert.deepEqual(current[key],old[key],`preserve ${key}`);
 let preserved=0;
 for(const [file,hash]of Object.entries(baseline.sha256)){
  if(file==='src/data.ts'||file==='public/models/manifest.json')continue;
  assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),hash,`existing asset changed: ${file}`);preserved++;
 }
 assert.equal(MONGLES.length,701);assert.equal(new Set(MONGLES.map(p=>p.id)).size,701);
 const beforeManifest=JSON.parse(execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'show',`${baseline.commit}:public/models/manifest.json`],{encoding:'utf8'}));
 const afterManifest=JSON.parse(await readFile('public/models/manifest.json','utf8'));
 assert.deepEqual(afterManifest.models.slice(0,beforeManifest.models.length),beforeManifest.models,'existing manifest references');
 assert.equal(afterManifest.models.length,beforeManifest.models.length+380);
 const oldNames=new Set(old.MONGLES.map(p=>p.name)),newNames=MONGLES.slice(321).map(p=>p.name);
 assert.equal(new Set(newNames).size,380);assert.ok(newNames.every(name=>!oldNames.has(name)));
 const rows=JSON.parse(await readFile('docs/art/expansion-id-map.json','utf8'));
 const ids=rows.map(r=>r.id);assert.deepEqual(ids,Array.from({length:380},(_,i)=>321+i));
 const newShapes=new Map(),duplicates=[];
 for(const row of rows){
  const model=JSON.parse(await readFile(`public/models/pet-${row.id}.json`,'utf8'));
  assert.ok(model.voxels.length>100);assert.ok(model.parts.eyes?.voxels.length>=4);
  const shape=JSON.stringify(model.voxels.map(v=>v.slice(0,3)));
  if(newShapes.has(shape))duplicates.push([newShapes.get(shape),row.id]);else newShapes.set(shape,row.id);
 }
 assert.deepEqual(duplicates,[],'new species must not be recolors');
 const stages=[];
 for(let stage=1;stage<=20;stage++){
  const pets=MONGLES.filter(p=>p.stageId===stage),tiers=Array.from({length:7},(_,tier)=>pets.filter(p=>p.tier===tier).length);
  assert.deepEqual(tiers,[7,7,5,4,3,2,2]);
  for(let tier=0;tier<7;tier++){
   const before=old.MONGLES.filter(p=>p.stageId===stage&&p.tier===tier),after=pets.filter(p=>p.tier===tier);
   for(const key of ['clickMultiplier','autoMultiplier','speedMultiplier','sourceEggHp']){
    const a=before.reduce((s,p)=>s+p[key],0)/before.length,b=after.reduce((s,p)=>s+p[key],0)/after.length;
    assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(a))*1e-12,`expected ${key} stage ${stage} tier ${tier}`);
   }
  }
  stages.push({stage,tiers,total:pets.length});
 }
 const now=1800000000000,save=freshSave(now);
 save.mongles=Array.from({length:321},(_,i)=>i%5);save.active=[1,1,100];save.mongles[1]=2;save.mongles[100]=1;
 save.obtainedPets=[1,100,319,320];save.claimedPets=[100];save.claimedStages=[1];
 save.eggs=[{id:'preserved-egg',type:0,hp:current.eggMaxHp({type:0,stageId:1}),hpVersion:4,stageId:1,variant:2,distance:15}];
 const restored=parseSave(JSON.stringify(save),now);
 assert.deepEqual(restored.mongles.slice(0,321),save.mongles);assert.ok(restored.mongles.slice(321).every(n=>n===0));
 for(const key of ['active','obtainedPets','claimedPets','claimedStages','eggs'])assert.deepEqual(restored[key],save[key]);
 let random=.1;const g=new GameState(freshSave(now),()=>now,()=>random);
 for(const row of rows){
  const pool=MONGLES.map((m,i)=>({...m,index:i})).filter(m=>m.stageId===row.stageId&&m.tier===row.tier&&m.species!==10);
  random=(pool.findIndex(m=>m.index===row.id)+.1)/pool.length;
  const type=EGGS.findIndex(e=>e.tier===row.tier&&e.region===Math.floor((row.stageId-1)/4));
  g.result=null;g.save.eggs=[{id:`new-${row.id}`,type,stageId:row.stageId,variant:0,hp:0,hpVersion:4,distance:10}];
  assert.ok(g.claimHatch(`new-${row.id}`));assert.equal(g.result,row.id);assert.equal(g.save.mongles[row.id],1);
 }
 for(let stage=1;stage<=20;stage++)for(const variant of [0,5]){
  const type=EGGS.findIndex(e=>e.tier===6&&e.region===Math.floor((stage-1)/4));
  g.result=null;g.save.eggs=[{id:'secret',type,stageId:stage,variant,hp:0,hpVersion:4,distance:10}];
  assert.ok(g.claimHatch('secret'));assert.ok(g.result<320);assert.equal(MONGLES[g.result].species===10,variant===5);
 }
 const roundtrip=parseSave(JSON.stringify(g.save),now);assert.deepEqual(roundtrip.mongles,g.save.mongles);
 await writeFile('artifacts/expansion/logic-audit.json',JSON.stringify({preserved,existing:321,new:380,total:701,stages,hatches:380,secretRoutes:40,oldSave:true,newSave:true,expectedBonusesPreserved:true},null,2));
 console.log(`PASS: ${preserved} preserved files; 321 existing records; 380 hatch routes; 40 unchanged SECRET routes; old/new saves; per-tier expected bonuses.`);
}finally{await server.close();}
