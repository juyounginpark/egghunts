import assert from 'node:assert/strict';
import {browserSession,ready,report} from './lib.mjs';
const session=await browserSession(),errors=[],visited=[];
try{
 const page=await session.browser.newPage({viewport:{width:360,height:800}});page.on('pageerror',e=>errors.push(e.message));await ready(page,session.url,'base');
 await page.evaluate(()=>window.__qa.routeWalk(0));
 for(let id=1;id<=20;id++){
  const target=14+(id-1)*32;
  await page.evaluate(target=>{const s=window.__qa.state();window.__qa.routeWalk((target+s.z)/s.speed);},target);
  await page.waitForFunction(id=>window.__qa.regionArt().terrain.stage===id,id);
  const s=await page.evaluate(()=>window.__qa.state()),art=await page.evaluate(()=>window.__qa.regionArt());assert.equal(s.stageId,id);assert.equal(s.progression.stage,1);assert.ok(art.terrain.sections.includes(id));
  await page.locator('#region-banner').waitFor({state:'visible'});assert.match(await page.locator('#region-banner-number').textContent(),new RegExp(String(id).padStart(2,'0')));assert.match(await page.locator('#region-banner-speed').textContent(),/권장 스피드 [0-9]/);
  assert.equal(await page.locator('#region-banner').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  const metrics=await page.evaluate(()=>window.__qa.metrics());assert.ok(metrics.calls<250);assert.ok(metrics.triangles<500000);visited.push({id,sections:art.terrain.sections,calls:metrics.calls,triangles:metrics.triangles});
  if([1,2,5,20].includes(id))await page.screenshot({path:`artifacts/screenshots/connected-${id}-360.png`});
 }
 await page.evaluate(()=>window.__qa.routeWalk(30));
 const end=await page.evaluate(()=>window.__qa.state());assert.equal(end.z,-761);await page.evaluate(()=>window.__qa.routeWalk(1));assert.equal((await page.evaluate(()=>window.__qa.state())).z,end.z);
 assert.equal((await page.evaluate(()=>window.__qa.regionArt())).terrain.endWall,true);await page.screenshot({path:'artifacts/screenshots/final-wall-360.png'});
 await page.locator('#region-banner').waitFor({state:'hidden',timeout:4500});
 await page.evaluate(()=>window.__qa.save());await page.goto(session.url+'/?qa=true&restore=true');await page.locator('#loading').waitFor({state:'hidden'});assert.equal((await page.evaluate(()=>window.__qa.state())).stageId,20);
 for(let id=19;id>=1;id--){await page.evaluate(target=>{const s=window.__qa.state();window.__qa.routeWalk((-s.z-target)/s.speed,1);},14+(id-1)*32);assert.equal((await page.evaluate(()=>window.__qa.state())).stageId,id);}
 await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);assert.deepEqual(errors,[]);
 await report('connected-e2e',{visited,returnStages:19,errors});console.log('PASS actual movement through 20 regions and back, banners, speed targets, reload and render budgets');
}finally{await session.close();}
