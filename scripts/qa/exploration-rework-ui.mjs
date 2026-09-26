import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({optimizeDeps:{entries:['index.html']},server:{host:'127.0.0.1',port:4333,strictPort:true,watch:null,hmr:false},plugins:[{name:'exploration-fixture',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/main.ts'))return code.replace('ready = true;','ready = true; window.__exploration={game,world};');}}]});
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[],rows=[];await mkdir('artifacts/exploration-rework',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4333/?qa=true&scene=base');await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
 await page.waitForFunction(()=>!!window.__exploration);
 for(let stage=1;stage<=20;stage++){
  await page.evaluate(async stage=>{window.__qa.scene('base');window.__exploration.game.save.bossWarningSeen=true;const {game}=window.__exploration,{routePoint}=await import('/src/exploration-route.ts');const p=routePoint(stage,.35);game.x=p.x;game.z=p.z-(stage-1)*48;game.save.trainingSpeed=0;game.revision++;},stage);
  for(const night of [false,true]){
   await page.evaluate(night=>window.__qa.environment(night?1:0),night);await page.waitForTimeout(160);
   await page.screenshot({path:`artifacts/exploration-rework/stage-${stage}-${night?'night':'day'}.png`});
  }
  rows.push(await page.evaluate(()=>({stage:window.__exploration.game.stage.id,...window.__qa.metrics(),assetError:window.__exploration.world.assetError})));
 }
 await page.evaluate(()=>{const {game}=window.__exploration;game.carried=null;const egg=game.world.find(e=>e.stageId===14&&!e.special);game.x=egg.x;game.z=egg.z;game.save.trainingSpeed=848;game.revision++;});
 await page.waitForFunction(()=>document.querySelector('.egg-speed-label')?.textContent==='필요 속도 1.1K / 현재 850');
 assert.equal(await page.locator('.egg-speed-label').isVisible(),true);await page.screenshot({path:'artifacts/exploration-rework/required-speed.png'});
 await page.evaluate(async()=>{const {game}=window.__exploration,{shortcut}=await import('/src/exploration-route.ts');const p=shortcut(5);game.x=p.x;game.z=p.z-4*48;game.revision++;});
 await page.waitForFunction(()=>document.querySelector('#action-label')?.textContent==='밀기');await page.click('#action');
 assert.ok(await page.evaluate(()=>window.__exploration.game.openedShortcuts.includes(5)));
 assert.deepEqual(errors,[]);assert.ok(rows.every(r=>!r.assetError));
 await writeFile('artifacts/exploration-rework/report.json',JSON.stringify({rows,errors,limits:'Browser software rendering, not real-device FPS; simulation covers multiplayer.'},null,2));
 console.log(`PASS ${rows.length} stages day/night, speed label, shortcut button; max draw calls ${Math.max(...rows.map(r=>r.calls))}, max triangles ${Math.max(...rows.map(r=>r.triangles))}`);
}finally{await browser.close();await server.close();}
