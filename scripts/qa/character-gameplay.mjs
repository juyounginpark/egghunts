import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {browserSession,ready,report} from './lib.mjs';
// Art review uses available fonts; external font delivery must not block model capture.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const session=await browserSession(),errors=[],results=[];
await mkdir('artifacts/screenshots/character-rework',{recursive:true});
try{
 const page=await session.browser.newPage({viewport:{width:360,height:800}});
 page.on('pageerror',error=>errors.push(error.message));
 await ready(page,session.url,'death');
 const state=()=>page.evaluate(()=>window.__qa.state());
 const pose=()=>page.evaluate(()=>window.__qa.playerPose());
 assert.ok((await state()).death);assert.equal(await page.locator('#revive-ad').count(),0);
 assert.ok((await pose()).visible);assert.deepEqual((await pose()).scale,[1,1,1]);
 await page.screenshot({path:'artifacts/screenshots/character-rework/death-falling.png'});
 const location=await state();
 await page.evaluate(()=>window.__qa.step(.6,{x:1,z:0}));await page.waitForTimeout(100);
 assert.equal((await state()).x,location.x);assert.equal((await state()).z,location.z);
 assert.ok((await pose()).rotation[2]<-1.4);assert.ok((await pose()).visible);
 await page.evaluate(()=>window.__qa.step(3.9));await page.waitForTimeout(100);
 assert.ok((await state()).death);assert.ok((await pose()).visible);
 assert.equal(await page.locator('#revive-ad').count(),0);
 await page.screenshot({path:'artifacts/screenshots/character-rework/death-hold.png'});
 await page.evaluate(()=>window.__qa.step(.12));await page.locator('#revive-ad').waitFor({state:'visible'});
 assert.equal((await pose()).deathChoiceRemaining,5);
 await page.click('#respawn-base');await page.waitForFunction(()=>window.__qa.state().death===null);
 await page.waitForFunction(()=>Math.abs(window.__qa.playerPose().rotation[2])<.01);
 assert.equal((await state()).z,0);assert.equal((await state()).hp,(await state()).maxHp);
 results.push('Five-second visible collapse, locked movement, delayed five-second choice, normal return pose');
 await page.evaluate(()=>window.__qa.scene('death'));await page.evaluate(()=>window.__qa.step(9.7));await page.waitForTimeout(100);
 assert.equal((await state()).death,null);assert.equal((await state()).z,0);
 results.push('No choice automatically returns after collapse and choice windows');
 for(const id of [1,4,5,8,17,20]){
  await page.evaluate(id=>window.__qa.region(id),id);
  const boss=(await state()).bosses.find(b=>b.stageId===id&&!b.final);
  await page.evaluate(b=>window.__qa.travel(b.x+2,b.z+2),boss);await page.waitForTimeout(350);
  const metrics=await page.evaluate(()=>window.__qa.metrics());assert.ok(metrics.calls<250);assert.ok(metrics.triangles<500000);
  await page.screenshot({path:`artifacts/screenshots/character-rework/guardian-${id}.png`});
 }
 assert.deepEqual(errors,[]);await report('character-gameplay',{results,errors});console.log('PASS character death animation and close-up guardian scenes');
}finally{await session.close();}
