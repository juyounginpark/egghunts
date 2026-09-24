import assert from 'node:assert/strict';
import {browserSession,ready} from './lib.mjs';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const session=await browserSession(),errors=[];
try{
 const page=await session.browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await ready(page,session.url);
 await page.locator('nav [data-tab="pets"]').click();await page.locator('#panel [data-tab="collection"]').click();
 await page.locator('.first-six-showcase .pet-portrait img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 assert.equal(await page.locator('.first-six-showcase .pet-portrait').count(),6);
 await page.screenshot({path:'docs/art/previews/first-six-game-mobile.png'});
 for(let id=0;id<6;id++){
  await page.locator(`.first-six-showcase [data-pet-view="${id}"]`).click();await page.locator('.pet-viewport canvas').waitFor();
  for(let view=0;view<4;view++){await page.locator(`.pet-views [data-view="${view}"]`).click();assert.equal(await page.locator(`.pet-views [data-view="${view}"]`).getAttribute('aria-pressed'),'true');}
  await page.locator('.pet-views [data-view="0"]').click();await page.waitForTimeout(120);
  if(id===4)await page.screenshot({path:'docs/art/previews/first-six-game-viewer.png'});
  await page.locator('.viewer-motion').click();assert.equal(await page.locator('.viewer-motion').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('Escape');await page.locator('.pet-viewer').waitFor({state:'detached'});
 }
 await page.setViewportSize({width:320,height:700});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('.first-six-showcase [data-pet-view="1"]').click();await page.locator('.pet-viewport canvas').waitFor();
 const box=await page.locator('.pet-viewer').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=320);await page.keyboard.press('Escape');await page.locator('.pet-viewer').waitFor({state:'detached'});
 // Static gallery images must finish decoding before the view screenshot is taken.
 await page.goto(`${session.url}/docs/art/legacy-character-gallery.html`);await page.setViewportSize({width:1440,height:960});
 await page.locator('[data-pet="2"]').click();await page.locator('[data-angle="2"]').click();await page.locator('#large').evaluate(img=>img.decode());await page.screenshot({path:'docs/art/previews/first-six-viewer.png'});
 await page.locator('[data-angle="5"]').click();await page.waitForTimeout(700);assert.equal(await page.locator('#idle').isVisible(),true);
 assert.deepEqual(errors,[]);console.log('PASS in-game six viewers, four angles, pause, Escape cleanup, 320/390px layout; no browser errors.');
}finally{await session.close();}
