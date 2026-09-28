import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {browserSession,ready} from './lib.mjs';
const production=process.argv.includes('--production');
const session=await browserSession(production),errors=[],results=[];
await mkdir('artifacts/balance-overhaul/screenshots',{recursive:true});
const page=await session.browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
const state=()=>page.evaluate(()=>window.__qa.state());
const shot=async name=>page.screenshot({path:`artifacts/balance-overhaul/screenshots/${name}.png`});
try{
 if(production){
  await page.goto(session.url+'/?qa=true');
  await page.locator('#guest-login').click();
  await page.locator('#player-name').fill('BalanceQA');
  await page.locator('#find-room').click();
  await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
  assert.equal(await page.evaluate(()=>typeof window.__qa),'undefined');
  await page.click('[data-tab="shop"]');assert.equal(await page.locator('.trail-card').count(),4);
  await page.waitForFunction(()=>[...document.querySelectorAll('.trail-card img')].every(i=>i.complete&&i.naturalWidth>0));
  await page.click('[data-tab="pets"]');await page.click('[data-tab="collection"]');
  assert.deepEqual(await page.locator('.collection-group h2').allTextContents(),['C~S','SS~SSS','Secret']);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await shot('production');results.push('production boots, QA hook excluded, shop assets and collection render');
 }else{
 await ready(page,session.url,'base');
 await page.evaluate(()=>window.__qa.grant(1e100));
 await page.click('[data-tab="upgrade"]');
 await page.locator('[data-upgrade="speed"]').click();
 assert.equal((await state()).upgrades.speed,1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.doesNotMatch(await page.locator('#panel').innerText(),/NaN|Infinity|\?\?/);
 await shot('upgrade');results.push('1080x1920 upgrade purchase and large wallet display');
 await page.click('[data-tab="shop"]');
 assert.equal(await page.locator('.trail-card').count(),4);
 assert.match(await page.locator('#panel').innerText(),/성장 \+3%/);
 await shot('shop');results.push('separate movement and progression trail labels');
 await page.evaluate(()=>window.__qa.scene('collection'));
 assert.deepEqual(await page.locator('.collection-group h2').allTextContents(),['C~S','SS~SSS','Secret']);
 const groups=await page.locator('.collection-group').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,parent:n.parentElement.getBoundingClientRect().width})));
 assert.ok(groups.every(g=>g.width>g.parent*.9));
 await shot('collection');results.push('three collection groups span panel width');
 await page.click('[data-tab="events"]');await page.click('[data-event="weekly"]');
 assert.equal(await page.locator('.weekly-days article').count(),7);
 await shot('weekly');results.push('weekly reward table');
 await page.evaluate(()=>window.__qa.scene('training'));
 const before=(await state()).trainingProgress;
 await page.evaluate(()=>window.__qa.step(601,{x:0,z:0}));
 assert.equal((await state()).trainingProgress,1);assert.ok(before<1);
 const capped=(await state()).speed;await page.evaluate(()=>window.__qa.step(5,{x:0,z:0}));assert.equal((await state()).speed,capped);
 results.push('exercise finishes and does not accumulate beyond cap');
 await ready(page,session.url,'egg-near');
 await page.locator('#boss-warning-ok').click();
 assert.ok((await state()).near);
 const speed=(await state()).speed;
 await page.click('#action');assert.ok((await state()).carried);assert.equal((await state()).speed,speed);
 await shot('carrying');results.push('egg pickup retains progression display');
 }
 assert.deepEqual(errors,[]);
 await writeFile(`artifacts/balance-overhaul/${production?'production-ui':'ui'}.json`,JSON.stringify({viewport:{width:1080,height:1920},passed:results,errors},null,2));
 console.log(JSON.stringify(results));
}catch(error){
 await shot(production?'production-failure':'ui-failure');
 console.error(JSON.stringify({errors,loading:await page.locator('#loading').innerText().catch(()=>''),login:await page.locator('#login-status').innerText().catch(()=> '')}));
 throw error;
}finally{await session.close();}
