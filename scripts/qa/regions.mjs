import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {browserSession,ready,report} from './lib.mjs';
const session=await browserSession(),results=[],errors=[];
await mkdir('artifacts/screenshots/regions',{recursive:true});
try{
 const page=await session.browser.newPage({viewport:{width:360,height:800},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));await ready(page,session.url,'base');
 const atlas=new PNG({width:360*5,height:800*4});
 for(let id=1;id<=20;id++){
  await page.evaluate(id=>window.__qa.region(id),id);await page.waitForTimeout(350);
  const art=await page.evaluate(()=>window.__qa.regionArt()),metrics=await page.evaluate(()=>window.__qa.metrics());
  assert.equal(art.terrain.stage,id);assert.equal(art.guardian.stage,id);assert.ok(art.terrain.blocks>(id===20?1500:300));assert.ok(art.guardian.parts>10);assert.ok(art.guardian.visibleParts>0);
  assert.ok(metrics.calls<250,`region ${id}: ${metrics.calls} calls`);assert.ok(metrics.triangles<500000,`region ${id}: ${metrics.triangles} triangles`);
  const bytes=await page.screenshot({path:`artifacts/screenshots/regions/${String(id).padStart(2,'0')}.png`});
  const shot=PNG.sync.read(bytes);PNG.bitblt(shot,atlas,0,0,360,800,((id-1)%5)*360,Math.floor((id-1)/5)*800);
  await page.evaluate(()=>window.__qa.animationTime(2.1));await page.waitForTimeout(100);
  const animated=await page.evaluate(()=>window.__qa.regionArt().guardian.pose);
  const movement=Math.max(...animated.map((v,i)=>Math.abs(v-art.guardian.pose[i])));
  assert.ok(animated.every(Number.isFinite));assert.ok(movement>0.00001&&movement<.5,`region ${id}: discontinuous/frozen animation ${movement}`);
  await page.evaluate(()=>window.__qa.animationTime(2));
  results.push({id,art,calls:metrics.calls,triangles:metrics.triangles,memory:metrics.memory,movement});
 }
 await writeFile('artifacts/screenshots/regions/contact-sheet.png',PNG.sync.write(atlas));
 for(const z of [-17,-57,-105]){await page.evaluate(z=>window.__qa.region(20,z),z);await page.waitForTimeout(350);await page.screenshot({path:`artifacts/screenshots/regions/final-${-z}.png`});}
 // Repeated rebuilds must reuse GPU geometry and materials.
 const memory=await page.evaluate(()=>window.__qa.metrics().memory);
 for(let id=1;id<=20;id++){await page.evaluate(id=>window.__qa.region(id),id);await page.waitForTimeout(60);}
 const after=await page.evaluate(()=>window.__qa.metrics().memory);
 assert.equal(after.geometries,memory.geometries);assert.equal(after.textures,memory.textures);
 assert.deepEqual(errors,[]);await report('regions',{results,memory,after,errors});console.log('PASS 20 region scenes, guardians, draw budgets and repeated-switch GPU memory');
}finally{await session.close();}
