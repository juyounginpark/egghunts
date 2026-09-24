// Manual live-room diagnosis. Uses real Supabase auth/game traffic, never ?qa=true.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.argv[2]??'baseline';
if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid report label');
const server=await createServer({server:{port:4320,strictPort:true,host:'127.0.0.1'},plugins:[{
 name:'read-only-live-diagnostics',enforce:'pre',transform(code,id){
  if(!id.replaceAll('\\','/').endsWith('/src/main.ts'))return;
  return code.replace('if (now - savedAt > 5000) {','window.__captureFrame?.(now); if (now - savedAt > 5000) {').replace('ready = true;',`ready = true;
   window.__liveStop=async()=>{clearInterval(online.syncTimer);online.halt();await online.busy?.catch(()=>{});};
   window.__liveRead=()=>({x:game.x,z:game.z,vx:world.player.position.x,vz:world.player.position.z,
    correction:Math.hypot(online.visualOffset.x,online.visualOffset.z),rtt:online.roundTrip,
    input:input.vector(),paused,training:game.training,night:game.isNight,
    server:online.latest?.runtime.fields,drawCalls:world.renderer.info.render.calls,
    triangles:world.renderer.info.render.triangles});`);
 }
}]});
await server.listen();
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(()=>{
  window.__trace={frames:[],network:[],phase:'loading',longTasks:[]};
  const original=window.fetch.bind(window);
  window.fetch=async(...args)=>{
   const measured=String(args[0]).includes('/functions/v1/game'),start=performance.now();
   try{const response=await original(...args);
    if(measured){const data=await response.clone().json();window.__trace.network.push({at:performance.now(),ms:performance.now()-start,status:response.status,error:data.error,timing:response.headers.get('Server-Timing'),region:response.headers.get('x-sb-edge-region'),phase:window.__trace.phase,x:data.runtime?.fields.x,z:data.runtime?.fields.z});}
    return response;
   }catch(e){if(measured)window.__trace.network.push({at:performance.now(),ms:performance.now()-start,error:e.name});throw e;}
  };
  new PerformanceObserver(list=>{for(const e of list.getEntries())window.__trace.longTasks.push({at:e.startTime,ms:e.duration,phase:window.__trace.phase});}).observe({type:'longtask',buffered:true});
  let previous=performance.now();
  window.__captureFrame=now=>{const state=window.__liveRead?.();if(state&&window.__trace.phase!=='loading'){
   const {server,...rest}=state;window.__trace.frames.push({at:now,dt:now-previous,phase:window.__trace.phase,...rest,serverX:server?.x,serverZ:server?.z});
  }previous=now;};
 });
 await page.goto('http://127.0.0.1:4320/');
 await page.locator('#guest-login').click({timeout:60000});
 await page.locator('#find-room').click();
 await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
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
 const {profile}=await cdp.send('Profiler.stop');
 const trace=await page.evaluate(()=>window.__trace);
 const quantile=(values,q)=>{const a=values.filter(Number.isFinite).sort((a,b)=>a-b);return a[Math.min(a.length-1,Math.floor(a.length*q))]??null;};
 const summary={errors,network:{count:trace.network.length,p50:quantile(trace.network.map(n=>n.ms),.5),p95:quantile(trace.network.map(n=>n.ms),.95),failures:trace.network.filter(n=>n.status!==200)},phases:{}};
 for(const phase of ['idle','outbound','stop','return','settle']){
  const rows=trace.frames.filter(f=>f.phase===phase),steps=rows.slice(1).map((f,i)=>Math.hypot(f.vx-rows[i].vx,f.vz-rows[i].vz)/(f.dt/1000));
  summary.phases[phase]={frames:rows.length,frameP50:quantile(rows.map(f=>f.dt),.5),frameP95:quantile(rows.map(f=>f.dt),.95),correctionP95:quantile(rows.map(f=>f.correction),.95),speedP10:quantile(steps,.1),speedP50:quantile(steps,.5),speedP90:quantile(steps,.9),from:rows[0],to:rows.at(-1)};
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
