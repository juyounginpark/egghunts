import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const root='artifacts/test-results/entry-sequence';await mkdir(root,{recursive:true});
const vite=await createServer({cacheDir:'node_modules/.vite-entry-sequence',server:{host:'127.0.0.1',port:4361,strictPort:true},plugins:[{name:'entry-sequence-access',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/main.ts'))return code+'\nObject.assign(window,{__entry:{get game(){return game},get session(){return session},get world(){return world},get ready(){return ready}}});';}}]});await vite.listen();
const browser=await chromium.launch({channel:process.env.CI?undefined:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
let releaseAuth,releaseAssets;const authGate=new Promise(resolve=>releaseAuth=resolve),assetGate=new Promise(resolve=>releaseAssets=resolve);
try{
 await page.route('**/*.supabase.co/**',async route=>{await authGate;await route.abort();});
 await page.goto('http://127.0.0.1:4361');await page.locator('#loading .loading-indicator').waitFor();assert.equal(await page.locator('#guest-start').count(),0);assert.equal(await page.locator('#tutorial').isVisible(),false);await page.screenshot({path:`${root}/01-account-loading.png`});releaseAuth();
 await page.locator('#guest-start').waitFor({timeout:30000});await page.locator('#guest-start').click();await page.locator('#start-name').fill('새로운탐험가');await page.locator('#start-local').click();
 await page.locator('#explorer-editor canvas').waitFor();assert.equal(await page.locator('#world canvas').count(),0);assert.equal(await page.locator('#tutorial').isVisible(),false);
 for(const view of ['hair','body','hair']){await page.locator('#entry-next').click();assert.equal(await page.locator('#explorer-editor').getAttribute('data-view'),view);}
 await page.locator('#entry-next').click();assert.equal(await page.locator('#entry-next').textContent(),'탐험 시작!');assert.equal(await page.locator('#world canvas').count(),0);
 await page.route('**/models/**',async route=>{await assetGate;await route.continue();});
 await page.evaluate(()=>{
  window.entryObservations=[];
  new window.MutationObserver(()=>{if(document.querySelector('#loading').hidden){const f=window.__entry;window.entryObservations.push({ready:f.ready,rendered:f.world.renderer.info.render.frame>0,count:f.session.ai.bots.length,actions:new Set(f.session.ai.initialSnapshots.map(b=>b.action)).size,tutorial:!document.querySelector('#tutorial').hidden});}}).observe(document.querySelector('#loading'),{attributes:true,attributeFilter:['hidden']});
 });
 await page.locator('#entry-next').click();await page.locator('#start-status .loading-indicator').waitFor();assert.equal(await page.locator('#entry-content').isVisible(),false);assert.equal(await page.locator('#tutorial').isVisible(),false);assert.equal(await page.locator('#start-status').innerText(),'');await page.screenshot({path:`${root}/02-world-loading.png`});releaseAssets();
 await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
 const observations=await page.evaluate(()=>window.entryObservations);assert.equal(observations.length,1);const entry=observations[0];assert.ok(entry.ready&&entry.rendered);assert.ok(entry.count>=2&&entry.count<=4);assert.equal(entry.actions,entry.count);assert.equal(entry.tutorial,false);
 await page.locator('#tutorial').waitFor({state:'visible',timeout:5000});await page.screenshot({path:`${root}/03-world-tutorial.png`});
 assert.deepEqual(errors,[]);await writeFile(`${root}/results.json`,JSON.stringify({entry,errors,slowAuthSpinner:true,worldAssetSpinner:true,creationBeforeWorld:true,tutorialAfterWorld:true},null,2));console.log('PASS delayed authentication/loading, sequential creation, final confirmation, prepared world with 2-4 active actors, then tutorial');
}catch(error){await page.screenshot({path:`${root}/failure.png`});throw error;}finally{releaseAuth();releaseAssets();await browser.close();await vite.close();}
