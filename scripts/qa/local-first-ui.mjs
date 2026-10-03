import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {once} from 'node:events';
import {createServer as createHTTP} from 'node:http';
import {presenceServer} from '../../server/presence-host.mjs';
import {report} from './lib.mjs';
const reserve=createHTTP();reserve.listen(0,'127.0.0.1');await once(reserve,'listening');const port=reserve.address().port;await new Promise(r=>reserve.close(r));
const vite=await createServer({cacheDir:'node_modules/.vite-local-first-ui',define:{'import.meta.env.VITE_PRESENCE_URL':JSON.stringify(`ws://127.0.0.1:${port}/presence`)},server:{port:4351,strictPort:true,host:'127.0.0.1'},plugins:[{name:'local-first-test-access',enforce:'pre',transform(code,id){if(id.endsWith('/src/main.ts'))return code+'\nObject.assign(window,{__localFirst:{get game(){return game},get world(){return world},cloud,multiplayer,get session(){return session},action,settings:showSettings}});';}}]});
await vite.listen();const browser=await chromium.launch({channel:process.env.CI?undefined:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let relay;const results=[],cloudRows=new Map();
const test=async(name,fn)=>{await fn();results.push(name);console.log('PASS',name);};
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',is_anonymous:true};
const jwt=[{alg:'HS256',typ:'JWT'},{sub:user.id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),role:'authenticated'},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
const session={access_token:jwt,refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const context=async()=>{
 const ctx=await browser.newContext();
 await ctx.route('**/*.supabase.co/**',async route=>{
  const url=new URL(route.request().url());let body={};
  if(url.pathname.startsWith('/auth/v1/'))body=url.pathname.endsWith('/user')?user:session;
  else if(url.pathname.includes('/rpc/')){
   const rpc=url.pathname.split('/').at(-1),args=route.request().postDataJSON()??{},row=cloudRows.get(user.id)??null;
   body={serverTime:Date.now()};
   if(rpc==='game_local_load')body.profile=row;
   if(rpc==='game_local_save'){
    if((row?.revision??0)!==args.p_revision)body={...body,conflict:true,profile:row};
    else {const saved={profile:args.p_profile,revision:(row?.revision??0)+1,updatedAt:Date.now()};cloudRows.set(user.id,saved);body={...body,conflict:false,revision:saved.revision};}
   }
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });return ctx;
};
const ready=async page=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));try{await page.goto('http://127.0.0.1:4351');await page.locator('#loading').waitFor({state:'hidden',timeout:60000});await page.waitForFunction(()=>window.__localFirst?.game);}catch(e){console.error('Browser startup errors',errors);throw e;}};
try{
 const aCtx=await context(),a=await aCtx.newPage();await ready(a);
 await test('normal startup with EC2 unavailable: movement, egg, hatch, boss and upgrade',async()=>{
  await a.waitForFunction(()=>window.__localFirst.world.renderer.info.render.frame>0);
  assert.equal(await a.evaluate(()=>window.__localFirst.multiplayer.connection),'disconnected');
  assert.equal(await a.evaluate(()=>window.__localFirst.session.ai.bots.length),4);
  assert.equal(await a.evaluate(()=>new Set(window.__localFirst.session.ai.initialSnapshots.map(b=>b.action)).size),4);
  const result=await a.evaluate(()=>{const {game:g}=window.__localFirst;g.save.tutorial=6;g.move(0,-1,.1);const moved=g.z<0;
   const egg=g.world[0];g.x=egg.x;g.z=egg.z;g.pickup(egg);const pickup=!!g.carried;g.applyBossContact(egg.guardian??0,1,0);const boss=g.hp===1&&!g.carried;
   g.x=g.z=0;g.save.eggs=[{...egg,id:'ui-local-hatch',hp:0}];g.save.selected='ui-local-hatch';const hatch=g.claimHatch('ui-local-hatch');g.result=null;g.save.dust=100000;const upgrade=g.upgrade('speed');return {moved,pickup,boss,hatch,upgrade,room:g.roomManaged};});
  assert.deepEqual(result,{moved:true,pickup:true,boss:true,hatch:true,upgrade:true,room:false});
 });
 await test('IndexedDB/local fallback persists exact progression through refresh',async()=>{
  await a.evaluate(async()=>{const f=window.__localFirst;f.game.save.dust=12345;f.game.save.mongles[3]=2;await f.cloud.persist();});
  await a.reload();await a.locator('#loading').waitFor({state:'hidden',timeout:60000});
  const state=await a.evaluate(()=>({dust:window.__localFirst.game.save.dust,pets:window.__localFirst.game.save.mongles[3],level:window.__localFirst.game.save.upgrades.speed}));
  assert.equal(state.pets,2);assert.equal(state.level,1);assert.ok(Number(state.dust)>=12345);
 });
 const bCtx=await context(),b=await bCtx.newPage();await ready(b);
 await test('explicit friend codes, human priority, interpolated positions and six shared emotes',async()=>{
  relay=presenceServer({origins:['http://127.0.0.1:4351']});relay.http.listen(port,'127.0.0.1');await once(relay.http,'listening');
  await a.locator('#settings').click();await a.locator('#friends-open').click();await a.locator('#friend-create').click();
  try{await a.waitForFunction(()=>window.__localFirst.multiplayer.connected,{},{timeout:15000});}catch(e){console.log(await a.evaluate(()=>({connection:window.__localFirst.multiplayer.connection,url:window.__localFirst.multiplayer.url,toast:document.querySelector('#toast').textContent})));throw e;}
  const code=await a.evaluate(()=>window.__localFirst.multiplayer.code);
  await a.locator('#friend-close').click();
  await b.locator('#settings').click();await b.locator('#friends-open').click();assert.equal(await b.locator('#friend-code').getAttribute('placeholder'),null);await b.locator('#friend-code').fill(code);await b.locator('#friend-join').click();
  await b.waitForFunction(()=>window.__localFirst.multiplayer.connected&&window.__localFirst.multiplayer.peers.some(p=>p.kind==='human'));
  await b.locator('#friend-close').click();
  await a.waitForFunction(()=>window.__localFirst.session.peers.length===4);
  assert.equal(await b.evaluate(()=>window.__localFirst.session.peers.length),4);
  await a.evaluate(()=>{window.__localFirst.game.x=3;window.__localFirst.game.z=-8;});
  await b.waitForFunction(()=>window.__localFirst.multiplayer.peers.some(p=>p.x===3&&p.z===-8));
  try{await b.waitForFunction(()=>[...window.__localFirst.world.peers.values()].some(p=>Math.abs(p.position.x-3)<.2&&Math.abs(p.position.z+8)<.2),{},{timeout:15000});}catch(e){console.log(await b.evaluate(()=>({peers:window.__localFirst.multiplayer.peers,rendered:[...window.__localFirst.world.peers].map(([id,p])=>({id,x:p.position.x,z:p.position.z,motion:p.userData.motion}))})));throw e;}
  assert.equal(await a.locator('#emote-picker').isVisible(),false);await a.locator('#emote-toggle').click();await a.locator('[data-emote="hello"]').click();assert.equal(await a.locator('#emote-picker').isVisible(),false);
  await b.waitForFunction(()=>window.__localFirst.multiplayer.peers.some(p=>p.emote?.id==='hello'));
  assert.equal(await a.locator('[data-emote]').count(),6);assert.equal(await a.locator('#room-chat').count(),0);
 });
 await test('browser host migration preserves AI identities and continues simulation',async()=>{
  const ids=await b.evaluate(()=>window.__localFirst.multiplayer.peers.filter(p=>p.kind==='simulated').map(p=>p.id));
  await a.evaluate(()=>{const f=window.__localFirst;f.multiplayer.sendAI(f.session.ai.bots.map(b=>b.entity.pose()),f.session.ai.checkpoint());f.multiplayer.logout();});
  await b.waitForFunction(()=>window.__localFirst.multiplayer.isHost);
  const restored=await b.evaluate(()=>window.__localFirst.session.ai.bots.map(b=>b.entity.id));
  assert.deepEqual(restored.sort(),ids.sort());
  const code=await b.evaluate(()=>window.__localFirst.multiplayer.code);await a.evaluate(code=>window.__localFirst.multiplayer.login(code),code);
  await a.waitForFunction(()=>window.__localFirst.multiplayer.connected);
 });
 await test('relay outage clears peers while local gameplay and saving continue',async()=>{
  await relay.close();relay=null;
  await a.waitForFunction(()=>!window.__localFirst.multiplayer.connected&&window.__localFirst.multiplayer.peers.length===0);
  await a.evaluate(async()=>{const f=window.__localFirst;f.game.x=f.game.z=0;f.game.save.dust=90000;if(!f.game.upgrade('speed'))throw Error('Local upgrade failed during outage');await f.cloud.persist();});
  assert.equal(await a.evaluate(()=>window.__localFirst.game.save.upgrades.speed),2);
  relay=presenceServer({origins:['http://127.0.0.1:4351']});relay.http.listen(port,'127.0.0.1');await once(relay.http,'listening');await a.waitForFunction(()=>window.__localFirst.multiplayer.connected,{},{timeout:15000});
 });
 await test('anonymous Supabase login and revisioned cloud save load in another browser',async()=>{
  await a.evaluate(()=>window.__localFirst.settings());assert.equal(await a.locator('input[type="email"]').count(),0);await a.locator('.cloud-settings summary').click();await a.locator('[data-account="guest"]').click();
  await a.waitForFunction(()=>window.__localFirst.cloud.record.accountId!==null);
  await a.evaluate(()=>window.__localFirst.cloud.sync());assert.ok(cloudRows.get(user.id)?.revision>0);
  const cCtx=await context();await cCtx.addInitScript(session=>localStorage.setItem('sb-leblcdiqsyxqzwlsnkio-auth-token',JSON.stringify(session)),session);
  const c=await cCtx.newPage();await ready(c);await c.waitForFunction(()=>window.__localFirst.game.save.upgrades.speed===2,{},{timeout:15000});
  assert.equal(await c.evaluate(()=>window.__localFirst.game.save.mongles[3]),2);
  await cCtx.close();
 });
 await report('local-first-ui',{passed:results.length,results,cloudValidation:'fixture RPC; production deployment checks documented separately'});
 await aCtx.close();await bCtx.close();
}finally{if(relay)await relay.close();await browser.close();await vite.close();}
