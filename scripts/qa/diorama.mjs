import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {browserSession,ready} from './lib.mjs';

const before=process.argv.includes('--before'),production=process.argv.includes('--production'),tag=before?'before':'after';
const session=await browserSession(production),errors=[],results=[];
await mkdir('artifacts/screenshots/diorama',{recursive:true});
try{
 const page=await session.browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 // The existing site has no favicon; retain all game/shader/resource errors.
 page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(`${m.text()} ${m.location().url}`);});
 if(production){
  // Release builds require authentication before World is constructed.
  // This smoke check intentionally stops at that boundary; no live account is created.
  await page.goto(session.url);await page.locator('#room-login').waitFor({state:'visible',timeout:60000});
  await page.waitForTimeout(500);
  const boot=await page.evaluate(()=>({qa:typeof window.__qa,debug:!!document.getElementById('environment-debug'),canvas:!!document.querySelector('#world canvas'),resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.transferSize}))}));
  assert.equal(boot.qa,'undefined');assert.equal(boot.debug,false);assert.equal(boot.canvas,false);
  await page.reload();await page.locator('#room-login').waitFor({state:'visible',timeout:60000});await page.waitForTimeout(500);
  await page.screenshot({path:'artifacts/screenshots/diorama/production.png'});
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/test-results/diorama-production.json',JSON.stringify({boot,errors,scope:'Login shell and reload only. Authenticated production rendering not exercised.'},null,2));
  console.log('PASS production login shell, reload, development controls excluded; authenticated rendering remains untested');
 }else{
 for(const scene of ['base','region-1']){
  await ready(page,session.url,scene);
  const tutorial=page.getByRole('button',{name:'알겠어요!'});if(await tutorial.isVisible())await tutorial.click();
  for(const [name,value] of (before?[['day',0],['night',1]]:[['day',0],['golden',.75],['sunset',.92],['night',1]])){
   if(!before)await page.evaluate(value=>window.__qa.environment(value),value);
   else if(value===1)await page.evaluate(()=>window.__qa.cycle(true));
   await page.waitForTimeout(600);
   const metrics=await page.evaluate(before=>({...window.__qa.metrics(),environment:before?null:window.__qa.environmentState?.()}),before);
   const frames=await page.evaluate(()=>new Promise(resolve=>{const values=[];let last=performance.now();const frame=now=>{values.push(now-last);last=now;if(values.length<60)requestAnimationFrame(frame);else resolve(values.sort((a,b)=>a-b));};requestAnimationFrame(frame);}));
   await page.screenshot({path:`artifacts/screenshots/diorama/${tag}-${scene}-${name}.png`});
   results.push({scene,name,metrics,frameMs:{median:frames[30],p95:frames[57]}});
   assert.ok(metrics.calls<250);assert.ok(metrics.triangles<500000);
  }
 }
 if(!before){
  await ready(page,session.url,'base');
  for(const progress of [.55,.75,.92,.99,1]){
   await page.evaluate(progress=>{window.__qa.environment(null);window.__qa.cycleProgress(progress);},progress);
   await page.waitForTimeout(300);
   const state=await page.evaluate(()=>({game:window.__qa.state(),visual:window.__qa.environmentState(),timer:document.getElementById('cycle-remaining').textContent}));
   assert.ok(Math.abs(state.visual.progress-progress)<.001);
   assert.equal(state.game.isNight,progress===1);
   if(progress===1)assert.equal(state.timer,'00:15');
  }
  await page.evaluate(()=>window.__qa.environmentQuality(true));await page.waitForTimeout(500);
  await page.screenshot({path:'artifacts/screenshots/diorama/after-low-night.png'});
  for(const key of ['ao','fog','rim','emissive','shadows'])await page.evaluate(key=>window.__qa.environmentToggle(key,false),key);
  await page.waitForTimeout(500);
  await page.screenshot({path:'artifacts/screenshots/diorama/after-effects-off.png'});
  await page.evaluate(()=>window.__qa.scene('hatch-whole'));await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>window.__qa.environmentState().progress),0);
 }
 await mkdir('artifacts/test-results',{recursive:true});
 await writeFile(`artifacts/test-results/diorama-${tag}.json`,JSON.stringify({results,errors,limits:'Headless Edge SwiftShader, desktop emulation. Not physical mobile GPU or thermal measurements.'},null,2));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify(results.map(r=>({scene:r.scene,phase:r.name,calls:r.metrics.calls,triangles:r.metrics.triangles,frameMs:r.frameMs})),null,2));
 }
}catch(error){
 const page=session.browser.contexts()[0]?.pages()[0];
 if(page){await page.screenshot({path:'artifacts/screenshots/diorama/failure.png'});await writeFile('artifacts/test-results/diorama-failure.json',JSON.stringify({error:String(error),errors,body:await page.locator('body').innerText()},null,2));}
 throw error;
}finally{await session.close();}
