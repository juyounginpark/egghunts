import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {ready} from './lib.mjs';
const server=await createServer({server:{port:4326,strictPort:true,host:'127.0.0.1'},plugins:[{name:'hud-fixture',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/main.ts'))return code.replace('ready = true;','ready = true; window.__hud={game};');}}]});
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true});
const root='artifacts/hud-review',errors=[],rows=[];await mkdir(root,{recursive:true});
try{
 const {cycleClock,clockText}=await server.ssrLoadModule('/src/cycle-clock.ts');
 const {BALANCE}=await server.ssrLoadModule('/src/data.ts');
 assert.equal(clockText(8),'00:08');assert.equal(clockText(3601),'01:00:01');assert.equal(clockText(-1),'00:00');
 assert.equal(cycleClock(0,BALANCE.nightInterval,BALANCE.nightDuration).ratio,1);
 assert.equal(cycleClock(BALANCE.nightDuration,BALANCE.nightInterval,BALANCE.nightDuration).ratio,1);
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));await ready(page,'http://127.0.0.1:4326');
 for(const width of [320,360,390,430]){
  await page.setViewportSize({width,height:844});
  for(const state of ['day','warning','night','long']){
   await page.evaluate(({state})=>{const g=window.__hud.game,n=g.now();g.world=[];g.save.tutorial=5;g.save.mongles[100]=1;g.save.active=[100];g.save.dust=state==='long'?'1.2345e69':1250000;g.nightAt=n+(state==='warning'?8000:state==='long'?3661000:240000);g.nightUntil=state==='night'?n+8000:0;g.revision++;},{state});
   await page.waitForTimeout(400);
   const metrics=await page.evaluate(()=>{
    const box=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    return {hud:box('main-hud'),phase:box('cycle-phase'),label:box('cycle-label'),time:box('cycle-remaining'),wallet:box('dust'),settings:box('settings'),level:box('level'),clock:document.getElementById('cycle-remaining').textContent,warning:document.getElementById('cycle-clock').classList.contains('night-warning'),ratio:parseFloat(document.getElementById('cycle-fill').style.width),live:document.getElementById('cycle-clock').getAttribute('aria-live')};
   });
   assert.ok(metrics.hud.x>=0&&metrics.hud.right<=width);
   assert.ok(metrics.hud.height<=115);assert.ok(metrics.time.right<=metrics.hud.right);
   assert.ok(metrics.label.right<=metrics.time.x+.1);assert.ok(metrics.wallet.right<=metrics.settings.x+.1);
   assert.ok(metrics.level.bottom<metrics.time.y);assert.equal(metrics.settings.width,44);assert.equal(metrics.settings.height,44);
   assert.equal(metrics.clock,state==='day'?'04:00':state==='long'?'01:01:01':'00:08');
   assert.equal(metrics.warning,state==='warning');assert.equal(metrics.live,'off');
   if(state!=='long')assert.ok(Math.abs(metrics.ratio-(state==='night'?8/15:state==='warning'?8/285:240/285)*100)<.001);
   rows.push({width,state,...metrics});await page.screenshot({path:`${root}/${width}-${state}.png`});
   if(width===390)await page.locator('#main-hud').screenshot({path:`${root}/${width}-${state}-hud.png`});
  }
 }
 await page.setViewportSize({width:320,height:844});
 for(const amount of [1000,1000000,1000000000,1000000000000,'1e15']){
  await page.evaluate(amount=>{window.__hud.game.save.dust=amount;},amount);await page.waitForTimeout(80);
  assert.ok(await page.evaluate(()=>document.getElementById('dust').getBoundingClientRect().right<=document.getElementById('settings').getBoundingClientRect().left));
 }
 await page.evaluate(()=>{const g=window.__hud.game;g.nightAt=g.now()+1000;g.nightUntil=0;});await page.waitForTimeout(150);
 await page.evaluate(()=>{window.__qa.wait(1);window.__hud.game.tick(0);});await page.waitForTimeout(150);
 assert.equal(await page.locator('#cycle-phase').innerText(),'\u263e \ubc24');assert.equal(await page.locator('#cycle-remaining').innerText(),'00:15');
 assert.ok(Math.abs(parseFloat(await page.locator('#cycle-fill').evaluate(e=>e.style.width))-100)<.1);
 await page.screenshot({path:`${root}/transition-night.png`});
 await page.evaluate(()=>{window.__qa.wait(15);window.__hud.game.tick(0);});await page.waitForTimeout(150);
 assert.equal(await page.locator('#cycle-phase').innerText(),'\u2600 \ub0ae');assert.equal(await page.locator('#cycle-remaining').innerText(),'04:45');
 assert.ok(Math.abs(parseFloat(await page.locator('#cycle-fill').evaluate(e=>e.style.width))-100)<.1);
 assert.equal(await page.locator('#announcement').isVisible(),false);
 await page.screenshot({path:`${root}/transition-day.png`});assert.deepEqual(errors,[]);
 await writeFile(`${root}/results.json`,JSON.stringify({rows,transitions:true,errors},null,2));
 await writeFile(`${root}/index.html`,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>HUD review</title><style>body{font:16px system-ui;background:#f3efdb;color:#35452e}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}img{width:100%;max-width:430px}h2{font-size:16px}</style><h1>HUD: 4 widths / 4 states</h1><main>${rows.map(r=>`<article><h2>${r.width}px / ${r.state}</h2><img src="${r.width}-${r.state}.png"></article>`).join('')}</main><h2>Transitions</h2><img src="transition-night.png"><img src="transition-day.png">`);
 console.log('PASS 16 viewport/state layouts, real day/night transitions, time formatting and console');
}finally{await browser.close();await server.close();}
