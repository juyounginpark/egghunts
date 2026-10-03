import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {PresenceRoom} from '../../server/presence-room.mjs';
import {report,modules} from './lib.mjs';
const vite=await createServer({server:{middlewareMode:true}});
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
const results=[];
const test=async(name,fn)=>{await fn();results.push(name);console.log('PASS',name);};
try{
 const {GameState,freshSave}=await vite.ssrLoadModule('/src/game.ts');
 const {MONGLES}=await vite.ssrLoadModule('/src/data.ts');
 const {TrustedClock}=await vite.ssrLoadModule('/src/trusted-clock.ts');
 const {LocalSaveStore,migrateLegacyProfile}=await vite.ssrLoadModule('/src/local-save.ts');
 const {CloudSave}=await vite.ssrLoadModule('/src/cloud-save.ts');
 const {SecureEconomy}=await vite.ssrLoadModule('/src/secure-economy.ts');
 let now=1800000060000;
 const make=()=>new GameState(freshSave(now),()=>now,()=>.1);
 await test('local movement, personal eggs, hatch, upgrade and boss damage need no server',()=>{
  const a=make(),b=make();a.save.tutorial=b.save.tutorial=6;
  a.move(0,-1,.1);assert.ok(a.z<0);
  const egg=a.world[0];a.x=egg.x;a.z=egg.z;a.pickup(egg);assert.equal(a.carried?.id,egg.id);assert.equal(a.world.some(e=>e.id===egg.id),false);assert.ok(b.world.length>0);
  a.applyBossContact(egg.guardian??0,1,0);assert.equal(a.carried,null);assert.equal(a.hp,1);assert.ok(a.world.some(e=>e.id===egg.id));
  a.x=a.z=0;a.save.eggs=[{...egg,id:'hatch',hp:10}];a.save.selected='hatch';assert.ok(a.tap());a.damage(1000);assert.ok(a.claimHatch('hatch'));assert.ok(a.petCount>0);
  a.result=null;a.save.dust=100000;assert.ok(a.upgrade('speed'));assert.equal(a.roomManaged,false);
 });
 await test('legacy runtime migration and reload preserve pets, weights, coupons and inventory',async()=>{
  const g=make();g.save.mongles[3]=2;g.save.redeemedCoupons=['FREEPET'];g.save.dust=5000;
  const migrated=migrateLegacyProfile({state:{save:g.snapshot(),fields:{x:0,z:0}}},now);
  assert.equal(migrated.mongles[3],2);assert.equal(migrated.dust,5000);assert.deepEqual(migrated.redeemedCoupons,['FREEPET']);
  const store=new LocalSaveStore();await store.write('fixture',{version:2,profile:migrated,revision:8,updatedAt:now,dirty:true,accountId:'a'});
  const restored=new GameState(migrateLegacyProfile((await store.read('fixture')).profile,now),()=>now);
  assert.equal(restored.save.mongles[3],2);assert.equal(restored.save.dust,5000);assert.equal(restored.save.petLots.reduce((n,l)=>n+l.count,0),2);
 });
 await test('trusted clock ignores in-session wall jumps, caps untrusted absence and corrects offset',()=>{
  let wall=now,mono=0;const clock=new TrustedClock(undefined,()=>wall,()=>mono);
  wall+=365*86400000;mono+=1000;assert.equal(clock.now(),now+1000);
  assert.equal(clock.offlineSeconds(now-86400000,43200),3600);
  clock.sync(now+2000);assert.equal(clock.now(),now+2000);assert.equal(clock.record().offset,now+2000-wall);
  assert.equal(clock.offlineSeconds(now-40*86400000,43200),0);
 });
 await test('Toss legacy load waits for user key while stalled SDK time cannot block login',async()=>{
  const adapter=await modules();
  try{
   let identify;const identity=new Promise(resolve=>{identify=resolve;});
   const getServerTime=Object.assign(()=>new Promise(()=>{}),{isSupported:()=>true});
   const legacy=freshSave(now);legacy.dust=3210;
   const platform=new adapter.Platform({Environment:{tossAppVersion:'fixture',getServerTime},getUserKeyForGame:()=>identity,Storage:{getItem:async key=>key==='alkong:v1:fixture'?JSON.stringify(legacy):null},SafeArea:{get:()=>{throw Error('fixture has no safe area');}}});
   const login=platform.login(),load=platform.load();identify({hash:'fixture'});
   assert.equal((await load).dust,3210);assert.equal(platform.key,'alkong:v1:fixture');
   await login;assert.ok(platform.warning.includes('시간'));assert.ok(platform.hasLegacyBackup());
  }finally{await adapter.cleanup();}
 });
 await test('offline reward consumes capped interval once; rejected jump cannot be replayed',()=>{
  const g=make();g.save.mongles[0]=1;g.save.active=[0];g.activePetLots;
  const before=g.save.dust;now+=86400000;g.offline(60);const reward=Number(g.save.dust)-Number(before);
  assert.ok(reward>0&&reward<=g.incomePerSecond*61);assert.equal(g.offline(60),0);
  const h=make();h.save.mongles[0]=1;h.save.active=[0];const dust=h.save.dust;h.offline(0);assert.equal(h.save.dust,dust);assert.equal(h.offline(1000),0);
 });
 await test('all pets have income plus one hatch role, with separate positive mount bonus',()=>{
  const g=make();for(let id=0;id<MONGLES.length;id++){const p=MONGLES[id];assert.equal(Number(p.clickMultiplier>1)+Number(p.autoMultiplier>1),1);assert.equal(p.speedMultiplier,1);assert.ok(g.petIncomeAmount(id)>0);assert.ok(g.mountBonus(id)>0);}
 });
 await test('revision CAS conflict preserves local copy and stops automatic overwrite',async()=>{
  let revision=1,remote=freshSave(now);remote.dust=6000;
  const rpc=async(name,args)=>{if(name==='game_local_save'){if(args.p_revision!==revision)return {data:{conflict:true,profile:{profile:remote,revision,updatedAt:now},serverTime:now}};revision++;remote=structuredClone(args.p_profile);return {data:{revision,conflict:false,serverTime:now}};}return {data:{serverTime:now}};};
  const makeCloud=()=>{const profile=freshSave(now);profile.dust=3000;const c=new CloudSave(()=>structuredClone(profile),()=>{},()=>{});c.record={version:2,profile,revision:1,updatedAt:now,dirty:true,accountId:'a'};c.session={user:{id:'a'}};c.client={rpc};return c;};
  const a=makeCloud(),b=makeCloud();await a.sync();await b.sync();assert.equal(a.record.revision,2);assert.equal(b.record.revision,1);assert.equal(b.conflict.revision,2);assert.equal(b.record.profile.dust,3000);await b.sync();assert.equal(revision,2);assert.ok([...memory.keys()].some(k=>k.includes('backup:conflict-local')));
 });
 await test('secure actions fail closed until a verification provider exists',async()=>{
  const secure=new SecureEconomy();await assert.rejects(secure.execute('coupon','FREEPET'));await assert.rejects(secure.submitLeaderboardScore('distance',100));
 });
 await test('friend presence excludes progression, protects shared claims and has no text chat',()=>{
  const r=new PresenceRoom('r');r.join('a',{x:1,z:2,seat:0});r.join('b',{x:2,z:3});r.update('b',{seat:0});assert.equal(r.players.get('b').seat,null);
  assert.equal(typeof r.chat,'undefined');
  r.publish({id:'event',kind:'event',expiresAt:Date.now()+10000,payload:{}});assert.equal(r.claim('a','event').claimedBy,'a');assert.throws(()=>r.claim('b','event'));
  r.update('a',{x:4,z:5,dust:9000,eggs:[1],pets:[9]});assert.equal(r.players.get('a').dust,undefined);assert.equal(r.players.get('a').eggs,undefined);
 });
 await report('local-first',{passed:results.length,results});
}finally{await vite.close();}
