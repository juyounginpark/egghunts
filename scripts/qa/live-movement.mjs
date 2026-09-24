// Manual live-room diagnosis. Uses real Supabase auth/game traffic, never ?qa=true.
/* global PerformanceObserver, AbortSignal */
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.argv[2]??'baseline';
if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid report label');
const server=await createServer({server:{port:4320,strictPort:true,host:'127.0.0.1'},plugins:[{
 name:'read-only-live-diagnostics',enforce:'pre',transform(code,id){
  if(!id.replaceAll('\\','/').endsWith('/src/main.ts'))return;
  return code.replace('if (now - savedAt > 5000) {','window.__captureFrame?.(now); if (now - savedAt > 5000) {').replace('ready = true;',`ready = true;
   window.__liveStop=async()=>{online.halt();await online.busy?.catch(()=>{});online.active=false;clearInterval(online.syncTimer);await online.busy?.catch(()=>{});};
   window.__liveSteer=(x,z)=>{input.keys.clear();input.x=x*.832-z*.555;input.y=x*.555+z*.832;};
   window.__liveRead=()=>({x:game.x,z:game.z,vx:world.player.position.x,vz:world.player.position.z,
    correction:Math.hypot(online.visualOffset.x,online.visualOffset.z),rtt:online.roundTrip,
    input:input.vector(),paused,training:game.training,night:game.isNight,
    gameNow:game.now(),serverTime:online.latest?.serverTime,carried:game.carried?.id,death:!!game.death,
    near:game.near&&{id:game.near.id,x:game.near.x,z:game.near.z},eggs:game.world.filter(e=>e.stageId===1).map(e=>({id:e.id,x:e.x,z:e.z,type:e.type})),
    boss:{...game.bosses[0]},bossDraw:{...world.hazardsView.guardians.roots[0]},
    server:online.latest?.runtime.fields,drawCalls:world.renderer.info.render.calls,
    triangles:world.renderer.info.render.triangles});`);
 }
}]});
await server.listen();
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(jitter=>{
  window.__trace={frames:[],network:[],phase:'loading',longTasks:[]};
  const NativeWebSocket=window.WebSocket;
  window.WebSocket=class extends NativeWebSocket{
   constructor(...args){
    super(...args);this.pendingMeasures=new Map();
    this.addEventListener('message',event=>{
     try{const packet=JSON.parse(event.data),started=this.pendingMeasures.get(packet.id);if(started===undefined)return;this.pendingMeasures.delete(packet.id);
      const data=packet.body;window.__trace.network.push({transport:'websocket',at:performance.now(),ms:performance.now()-started,status:packet.status,error:data.error,timing:packet.timing,phase:window.__trace.phase,x:data.runtime?.fields.x,z:data.runtime?.fields.z});
     }catch{/* Other sockets are unrelated to game measurements. */}
    });
   }
   send(data){try{const packet=JSON.parse(data);if(packet.request?.id)this.pendingMeasures.set(packet.request.id,performance.now());}catch{/* Non-game traffic. */}super.send(data);}
  };
  const original=window.fetch.bind(window);
  window.fetch=async(...args)=>{
   const measured=String(args[0]).includes('/functions/v1/game'),start=performance.now();
   try{const response=await original(...args);
    if(measured&&jitter&&window.__trace.phase!=='loading')await new Promise(r=>setTimeout(r,[0,100,250,50][window.__trace.network.length%4]));
    if(measured){const data=await response.clone().json();window.__trace.network.push({at:performance.now(),ms:performance.now()-start,status:response.status,error:data.error,timing:response.headers.get('Server-Timing'),region:response.headers.get('x-sb-edge-region'),phase:window.__trace.phase,x:data.runtime?.fields.x,z:data.runtime?.fields.z});}
    return response;
   }catch(e){if(measured)window.__trace.network.push({at:performance.now(),ms:performance.now()-start,error:e.name});throw e;}
  };
  new PerformanceObserver(list=>{for(const e of list.getEntries())window.__trace.longTasks.push({at:e.startTime,ms:e.duration,phase:window.__trace.phase});}).observe({type:'longtask',buffered:true});
  let previous=performance.now();
  window.__captureFrame=now=>{const state=window.__liveRead?.();if(state&&window.__trace.phase!=='loading'){
   const {server,...rest}=state;window.__trace.frames.push({at:now,dt:now-previous,phase:window.__trace.phase,...rest,serverX:server?.x,serverZ:server?.z});
  }previous=now;};
 },label.includes('jitter'));
 await page.goto('http://127.0.0.1:4320/');
 await page.locator('#guest-login').click({timeout:60000});
 await page.locator('#player-name').fill('bad1');await page.locator('#find-room').click();
 if(!await page.locator('#login-status').textContent().then(s=>s.includes('10')))throw Error('Invalid nickname was not rejected');
 await page.locator('#player-name').fill('MoveProbe');
 await page.locator('#find-room').click();
 await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
 await page.waitForFunction(()=>document.querySelector('.player-nameplate.self')?.textContent.includes('[GUEST] MoveProbe · LV.'));
 await page.evaluate(()=>document.activeElement?.blur());
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 const phase=async(name,keys,ms)=>{
  await page.evaluate(name=>window.__trace.phase=name,name);
  for(const key of keys)await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  for(const key of keys)await page.keyboard.up(key);
 };
 await phase('idle',[],2500);
 await phase('outbound',['w','d'],5000);
 await phase('stop',[],1800);
 await phase('return',['s','a'],5000);
 await phase('settle',[],1800);
 if(label.includes('chase')){
  await page.evaluate(()=>window.__trace.phase='approach');
  await page.locator('#tutorial-skip').click().catch(()=>{});
  // Drive real input toward the first nest; never move authoritative coordinates.
  const until=Date.now()+55000;let reached=false;
  while(Date.now()<until){
   if(await page.locator('#boss-warning-ok').isVisible()){await page.click('#boss-warning-ok');await page.waitForTimeout(400);}
   const s=await page.evaluate(()=>window.__liveRead());
   if(s.night){await page.evaluate(()=>window.__liveSteer(0,0));await page.waitForTimeout(500);continue;}
   const egg=s.eggs.reduce((a,b)=>Math.abs(a.x)<Math.abs(b.x)?a:b);
   if(Math.hypot(s.x-egg.x,s.z-egg.z)<1.2){reached=true;break;}
   const dx=egg.x-s.x,dz=egg.z-s.z,l=Math.hypot(dx,dz);await page.evaluate(([x,z])=>window.__liveSteer(x,z),[dx/l,dz/l]);await page.waitForTimeout(100);
  }
  await page.evaluate(()=>window.__liveSteer(0,0));await page.waitForTimeout(800);
  if(!reached){console.log('APPROACH',await page.evaluate(()=>window.__liveRead()));throw Error('Live nest approach did not complete');}
  if(await page.locator('#boss-warning-ok').isVisible())await page.click('#boss-warning-ok');
  await page.locator('#modal').waitFor({state:'hidden',timeout:10000});
  for(let attempt=0;attempt<4;attempt++){
   if((await page.evaluate(()=>window.__liveRead())).carried)break;
   if(await page.locator('#boss-warning-ok').isVisible())await page.click('#boss-warning-ok');
   await page.click('#action');await page.waitForTimeout(2200);
  }
  await page.waitForFunction(()=>!!window.__liveRead().carried,{},{timeout:10000});
  await page.evaluate(()=>window.__trace.phase='wake');await page.waitForTimeout(2300);
  await page.evaluate(()=>{window.__trace.phase='chase';window.__liveSteer(0,1);});await page.waitForTimeout(3800);
  await page.evaluate(()=>{window.__liveSteer(0,0);window.__trace.phase='chase-stop';});await page.waitForTimeout(1200);
  await mkdir('artifacts/screenshots',{recursive:true});await page.screenshot({path:`artifacts/screenshots/${label}.png`});
 }
 const {profile}=await cdp.send('Profiler.stop');
 const trace=await page.evaluate(()=>window.__trace);
 const quantile=(values,q)=>{const a=values.filter(Number.isFinite).sort((a,b)=>a-b);return a[Math.min(a.length-1,Math.floor(a.length*q))]??null;};
 const summary={errors,network:{count:trace.network.length,p50:quantile(trace.network.map(n=>n.ms),.5),p95:quantile(trace.network.map(n=>n.ms),.95),failures:trace.network.filter(n=>n.status!==200)},phases:{}};
 for(const phase of [...new Set(trace.frames.map(f=>f.phase))]){
  const rows=trace.frames.filter(f=>f.phase===phase),steps=rows.slice(1).map((f,i)=>Math.hypot(f.vx-rows[i].vx,f.vz-rows[i].vz)/(f.dt/1000));
  const bossRows=rows.filter(f=>f.boss?.mode==='chase'),bossSteps=bossRows.slice(1).map((f,i)=>Math.hypot(f.bossDraw.x-bossRows[i].bossDraw.x,f.bossDraw.z-bossRows[i].bossDraw.z)/(f.dt/1000));
  summary.phases[phase]={frames:rows.length,frameP50:quantile(rows.map(f=>f.dt),.5),frameP95:quantile(rows.map(f=>f.dt),.95),correctionP95:quantile(rows.map(f=>f.correction),.95),speedP10:quantile(steps,.1),speedP50:quantile(steps,.5),speedP90:quantile(steps,.9),maxDrift:Math.max(...rows.map(f=>Math.hypot(f.vx-rows[0].vx,f.vz-rows[0].vz))),bossFrames:bossRows.length,bossSpeedP10:quantile(bossSteps,.1),bossSpeedP50:quantile(bossSteps,.5),bossSpeedP90:quantile(bossSteps,.9),from:rows[0],to:rows.at(-1)};
 }
 await mkdir('artifacts/performance',{recursive:true});
 await writeFile(`artifacts/performance/live-movement-${label}.cpuprofile`,JSON.stringify(profile));
 await writeFile(`artifacts/performance/live-movement-${label}.json`,JSON.stringify({summary,trace},null,2));
 console.log(JSON.stringify(summary,null,2));
}finally{
 await page.evaluate(async()=>{
  await window.__liveStop?.();
  for(const key of Object.keys(localStorage))if(key.startsWith('sb-')&&key.endsWith('-auth-token')){
   const session=JSON.parse(localStorage.getItem(key));
   if(session?.access_token){
    const headers={apikey:'sb_publishable_2KTon_WzPAci5G4dLyZ5Ww_bPgwmiig',Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'};
    await fetch('https://leblcdiqsyxqzwlsnkio.supabase.co/functions/v1/game',{method:'POST',headers,body:JSON.stringify({operation:'leave'}),signal:AbortSignal.timeout(5000)});
    await fetch('https://leblcdiqsyxqzwlsnkio.supabase.co/auth/v1/logout',{method:'POST',headers,signal:AbortSignal.timeout(5000)});
   }
  }
 }).catch(()=>{});
 await browser.close();await server.close();
}
