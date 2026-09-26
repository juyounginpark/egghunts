import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {ready} from './lib.mjs';
const server=await createServer({server:{host:'127.0.0.1',port:4332,strictPort:true},plugins:[{name:'expansion-fixture',enforce:'pre',transform(code,id){
 if(id.replaceAll('\\','/').endsWith('/src/main.ts'))return code.replace('ready = true;','ready = true; window.__expansion={game,world};');
}}]});await server.listen();
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',error=>errors.push(error.message));
 await ready(page,'http://127.0.0.1:4332','base');
 const initialNewModels=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/pet-(\d+)\.json/.test(r.name)&&Number(r.name.match(/pet-(\d+)/)[1])>=321).length);
 assert.equal(initialNewModels,0,'do not preload the expanded catalog');
 await page.evaluate(async()=>{
  const {game}=window.__expansion,{MONGLES}=await import('/src/data.ts');
  game.save.mongles.fill(0);for(const [id,p]of MONGLES.entries())if(p.stageId===20)game.save.mongles[id]=1;
  game.save.mongles[100]=1;game.save.mongles[321]=1;game.save.active=[100,321,700];game.revision++;
 });
 await page.waitForFunction(()=>window.__expansion.world.companions.children.some(p=>p.userData.petId===700));
 await page.waitForTimeout(500);
 const metrics=await page.evaluate(()=>window.__qa.metrics());
 assert.equal(await page.evaluate(()=>window.__expansion.world.assetError),'');
 await mkdir('artifacts/expansion',{recursive:true});await page.screenshot({path:'artifacts/expansion/mixed-gameplay.png'});
 await page.locator('[data-tab="pets"]').first().click();
 await page.locator('[data-tab="collection"]').click();
 await page.locator('.stage-categories summary').click();await page.locator('[data-collection-stage="20"]').click();
 assert.equal(await page.locator('.pet-catalog-grid > article').count(),30);
 await page.locator('[data-pet-view="700"]').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('[data-pet-view="700"] img').evaluate(img=>img.complete&&img.naturalWidth>0),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
 await page.screenshot({path:'artifacts/expansion/collection-last-pet.png'});
 await page.evaluate(()=>window.__qa.petResult(700));await page.locator('#result-ok').waitFor();
 assert.match(await page.locator('.result-card').innerText(),/첫빛 유니콘/);
 assert.equal(await page.locator('.result-pet').evaluate(img=>img.complete&&img.naturalWidth>0),true);
 await page.screenshot({path:'artifacts/expansion/hatch-last-pet.png'});
 assert.deepEqual(errors,[]);
 await writeFile('artifacts/expansion/ui-audit.json',JSON.stringify({initialNewModels,collectionCount:30,lastPet:700,metrics,errors,scope:'Desktop Edge at mobile viewport; not physical-device FPS'},null,2));
 console.log(JSON.stringify({initialNewModels,collectionCount:30,metrics,errors}));
}finally{await browser.close();await server.close();}
