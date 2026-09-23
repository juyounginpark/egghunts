import assert from 'node:assert/strict';
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {browserSession,ready,report} from './lib.mjs';
const session=await browserSession();
try {
 const page=await session.browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const before=Date.now();await ready(page,session.url,'base');const readyMs=Date.now()-before;
 const first=await page.evaluate(()=>({render:window.__qa.metrics(),resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.transferSize,duration:r.duration}))}));
 const modelRequests=first.resources.filter(r=>r.name.includes('/models/')&&r.name.endsWith('.json'));
 assert.ok(modelRequests.length<80,'Do not preload every pet');assert.ok(!modelRequests.some(r=>/pet-\d+\.json/.test(r.name)),'Fresh farm must not fetch unowned pets');
 assert.ok(first.render.calls<250,`draw calls ${first.render.calls}`);assert.ok(first.render.triangles<500000,`triangles ${first.render.triangles}`);
 const frames=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now();const frame=now=>{times.push(now-last);last=now;if(times.length<180)requestAnimationFrame(frame);else resolve(times);};requestAnimationFrame(frame);}));
 frames.sort((a,b)=>a-b);
 await ready(page,session.url,'farm-pets');await page.waitForTimeout(1500);const giant=await page.evaluate(()=>window.__qa.metrics());
 assert.ok(giant.calls<250);assert.ok(giant.triangles<500000);
 const memories=[];for(let i=0;i<12;i++){await page.click('[data-tab="hatchery"]');await page.click('[data-tab="explore"]');await page.waitForTimeout(50);memories.push((await page.evaluate(()=>window.__qa.metrics())).memory);}
 assert.ok(memories.at(-1).geometries<=memories[0].geometries+3,'Geometry leak on switching');
 const hazardScenes=[];
 for(const id of ['tentacle','laser','meteors','creation-wave']){
  await page.evaluate(id=>window.__qa.pattern(id,true),id);await page.waitForTimeout(500);
  const metrics=await page.evaluate(()=>window.__qa.metrics());assert.ok(metrics.calls<250);assert.ok(metrics.triangles<500000);hazardScenes.push({id,...metrics});
 }
 let jsBytes=0,gzipBytes=0;for(const file of await readdir('dist/assets'))if(file.endsWith('.js')){const bytes=await readFile(`dist/assets/${file}`);jsBytes+=bytes.length;gzipBytes+=gzipSync(bytes).length;assert.ok(!bytes.includes(Buffer.from('__qa')),'QA hook leaked into production');}
 assert.ok(gzipBytes<300*1024);
 const requiredBytes=first.resources.reduce((n,r)=>n+r.bytes,0);assert.ok(requiredBytes<4*1024*1024,`initial ${requiredBytes}`);
 const result={readyMs,initialDevelopmentTransferBytes:requiredBytes,modelRequests:modelRequests.length,base:first.render,giant,hazardScenes,frameMs:{median:frames[90],p95:frames[171],max:frames.at(-1)},sceneSwitchMemory:memories,bundle:{jsBytes,gzipBytes},limits:'Desktop headless Edge/SwiftShader, no network throttling. Not mobile WebView FPS; 180 frames and 12 scene switches are a short soak, not long-term device validation.'};
 await report('performance',result,'performance');await mkdir('artifacts/qa-summary',{recursive:true});await writeFile('artifacts/qa-summary/performance-report.md','# Performance measurements\n\n```json\n'+JSON.stringify(result,null,2)+'\n```\n');console.log(JSON.stringify(result,null,2));
}finally{await session.close();}
