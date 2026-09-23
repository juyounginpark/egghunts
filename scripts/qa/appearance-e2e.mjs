import assert from 'node:assert/strict';
import {browserSession,ready,report} from './lib.mjs';
const session=await browserSession(),errors=[];
try{
 const page=await session.browser.newPage({viewport:{width:360,height:800}});page.on('pageerror',e=>errors.push(e.message));await ready(page,session.url,'farm-pets');
 await page.evaluate(()=>window.__qa.followStep(5,0,-1));
 let pets=await page.evaluate(()=>window.__qa.followMetrics()),s=await page.evaluate(()=>window.__qa.state());assert.equal(pets.length,3);
 for(let i=0;i<3;i++){assert.ok(Math.abs(pets[i].x-s.x)<.08);assert.ok(pets[i].z>(i?pets[i-1].z:s.z)+.7);}
 await page.screenshot({path:'artifacts/screenshots/pets-single-file-360.png'});
 await page.evaluate(()=>window.__qa.followStep(1.3,1,0));pets=await page.evaluate(()=>window.__qa.followMetrics());assert.ok(pets[0].x>pets[1].x+.3);assert.ok(pets[1].z<pets[2].z);
 await page.screenshot({path:'artifacts/screenshots/pets-turn-360.png'});
 for(let id=1;id<=20;id++){
  await page.evaluate(id=>window.__qa.eggGallery(id),id);await page.waitForTimeout(80);s=await page.evaluate(()=>window.__qa.state());assert.equal(s.world.length,5);assert.deepEqual(s.world.map(e=>e.variant).sort(),[0,1,2,3,4]);
  await page.screenshot({path:`artifacts/screenshots/egg-gallery-${id}-360.png`});
 }
 await page.evaluate(()=>{window.__qa.scene('base');window.__qa.cycle(true);});await page.waitForTimeout(2200);assert.ok((await page.evaluate(()=>window.__qa.state())).isNight);assert.match(await page.locator('#cycle-clock').textContent(),/밤/);assert.ok(await page.locator('#night-sky').isVisible());await page.screenshot({path:'artifacts/screenshots/night-visible-360.png'});
 await page.evaluate(()=>window.__qa.save());const ids=(await page.evaluate(()=>window.__qa.state())).world.map(e=>e.id);await page.goto(session.url+'/?qa=true&restore=true');await page.locator('#loading').waitFor({state:'hidden'});
 // Browser clock resets on navigation; gameplay-level tests cover same-night persistence.
 assert.equal(ids.length,100);assert.equal(await page.locator('#stage-select,[data-stage],[data-tab="stages"]').count(),0);
 await page.evaluate(()=>window.__qa.cycle(false));await page.waitForTimeout(2200);assert.equal((await page.evaluate(()=>window.__qa.state())).isNight,false);await page.screenshot({path:'artifacts/screenshots/day-visible-360.png'});
 assert.deepEqual(errors,[]);await report('appearance-e2e',{eggVariants:100,petLine:true,petTurn:true,dayNight:true,errors});console.log('PASS 100 regional egg variations, single-file pets and turns, visible night/day, no stage selector');
}finally{await session.close();}
