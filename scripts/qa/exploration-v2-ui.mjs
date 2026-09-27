import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({optimizeDeps:{entries:['index.html']},server:{host:'127.0.0.1',port:4333,strictPort:true,watch:null,hmr:false},plugins:[{name:'v2-fixture',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/main.ts'))return code.replace('ready = true;','ready = true; window.__exploration={game,world};');}}]});
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[],rows=[];await mkdir('artifacts/exploration-v2',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4333/?qa=true&scene=base');await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
 await page.waitForFunction(()=>!!window.__exploration);
 await page.addStyleTag({content:'#egg-notices{display:none!important}'});
 for(let stage=1;stage<=20;stage++){
  await page.evaluate(async stage=>{
   window.__qa.scene('base');const {game}=window.__exploration;game.save.bossWarningSeen=true;
   const {routePoint}=await import('/src/exploration-route.ts');
   const p=routePoint(stage,.43);game.x=p.x;game.z=p.z-(stage-1)*48;game.push(0,0);
   // QA freezes visual time, so finish the visited-bank fade explicitly.
   for(const bank of window.__exploration.world.hazardsView.regions.fog.banks)if(bank.stage===stage)bank.alpha=0;
   if(game.mobs.length)throw Error('Unexpected map mobs');game.revision++;
  },stage);
  for(const night of [false,true]){
   await page.evaluate(night=>window.__qa.environment(night?1:0),night);await page.waitForTimeout(1250);
   await page.screenshot({path:`artifacts/exploration-v2/stage-${stage}-${night?'night':'day'}.png`});
  }
  rows.push(await page.evaluate(()=>({stage:window.__exploration.game.stage.id,...window.__qa.metrics(),assetError:window.__exploration.world.assetError})));
 }
 await page.evaluate(()=>{const {game}=window.__exploration;game.carried=null;const egg=game.world.find(e=>e.stageId===14&&!e.special);game.x=egg.x;game.z=egg.z;game.save.trainingSpeed=848;game.revision++;});
 await page.waitForFunction(()=>document.querySelector('.egg-speed-label')?.textContent==='권장 속도 1.1K / 현재 850');
 assert.equal(await page.locator('.egg-speed-label').isVisible(),true);
 await page.evaluate(async()=>{const {game}=window.__exploration,{shortcut}=await import('/src/exploration-route.ts');const p=shortcut(5);game.x=p.x;game.z=p.z-4*48;game.revision++;});
 await page.waitForFunction(()=>document.querySelector('#action-label')?.textContent==='밀기');await page.click('#action');
 assert.ok(await page.evaluate(()=>window.__exploration.game.openingShortcuts[5]!==undefined));
 await page.evaluate(()=>window.__qa.step(.7,{x:0,z:0}));assert.ok(await page.evaluate(()=>window.__exploration.game.openedShortcuts.includes(5)));
 await page.evaluate(async()=>{window.__qa.scene('base');const {game}=window.__exploration,{speedPads}=await import('/src/speed-pads.ts');const p=speedPads(1)[0];game.x=p.x;game.z=p.z;window.__qa.step(.25,{x:0,z:0});});
 await page.waitForFunction(()=>document.querySelector('#speed-pad-buff')?.textContent==='이동 +20%');
 await page.screenshot({path:'artifacts/exploration-v2/speed-pad.png'});
 assert.deepEqual(errors,[]);assert.ok(rows.every(r=>!r.assetError));assert.ok(rows.every(r=>r.calls<=250&&r.triangles<=500000));
 await writeFile('artifacts/exploration-v2/report.json',JSON.stringify({rows,errors,limits:'Browser rendering only; multiplayer simulation is reported separately.'},null,2));
 console.log(`PASS 20 stages day/night, 20 object catalogs without mobs, speed gate, timed gate, boost badge; max draw calls ${Math.max(...rows.map(r=>r.calls))}, triangles ${Math.max(...rows.map(r=>r.triangles))}`);
}finally{await browser.close();await server.close();}
