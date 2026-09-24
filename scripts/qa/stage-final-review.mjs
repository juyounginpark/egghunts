import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {browserSession,ready} from './lib.mjs';
import {writeStageGallery} from '../write-stage-gallery.mjs';
const root='docs/art/previews/stages/',decode=s=>Buffer.from(s.split(',')[1],'base64');
async function grid(paths,out){
 const result=new PNG({width:1200,height:Math.ceil(paths.length/5)*240});result.data.fill(255);
 for(const [i,path]of paths.entries()){
  const p=PNG.sync.read(await readFile(path));
  for(let y=0;y<240;y++)for(let x=0;x<240;x++){
   const si=(Math.floor(y*p.height/240)*p.width+Math.floor(x*p.width/240))*4,di=((Math.floor(i/5)*240+y)*result.width+i%5*240+x)*4,a=p.data[si+3]/255;
   for(let c=0;c<3;c++)result.data[di+c]=Math.round(p.data[si+c]*a+255*(1-a));
  }
 }
 await writeFile(root+out,PNG.sync.write(result));
}
await grid(Array.from({length:20},(_,i)=>`public/models/stage-previews/pet-${100+i*10}-gray.png`),'mascots-gray.png');
await grid(Array.from({length:20},(_,i)=>`public/models/stage-previews/pet-${300+i}-silhouette.png`),'dragons-silhouette.png');
await grid(Array.from({length:20},(_,i)=>`public/models/pet-${300+i}.png`),'dragons-color.png');
await grid(Array.from({length:20},(_,i)=>`public/models/pet-${100+i*10}.png`),'mascots-color.png');
await grid([100,102,104,106,107,108,109,300].map(id=>`public/models/pet-${id}.png`),'rarity-without-badges.png');
await writeStageGallery();
const session=await browserSession(),errors=[],checks=[];
try{
 const page=await session.browser.newPage({viewport:{width:1000,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 const sampleIds=[100,103,108,120,125,128,160,168,210,218,290,298,300,311,319];
 const comparison=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px system-ui;background:#f5efdb;color:#38472d;margin:20px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}article{border:2px solid #b8b991;border-radius:8px;background:#fff9e8;padding:8px}article div{display:flex}img{width:50%;aspect-ratio:1;object-fit:contain}h2{font-size:14px}a{color:inherit}@media(max-width:600px){main{grid-template-columns:1fr}}</style><h1>같은 조명 · 각도 · 카드 크기</h1><p>각 카드 왼쪽: 컬러·오브제 개정 전 / 오른쪽: 최종 모델</p><main>${sampleIds.map(id=>`<article><h2>pet-${id}${id>=300?' · DRAGON':''}</h2><div><img src="before/pet-${id}.png" alt="개정 전"><img src="../../../../public/models/pet-${id}.png" alt="개정 후"></div></article>`).join('')}</main></html>`;
 await writeFile(root+'before-after.html',comparison);await page.goto(`${session.url}/${root}before-after.html`);await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await page.screenshot({path:root+'before-after.png',fullPage:true});checks.push('12 pets + 3 dragons: identical portrait camera, lighting and card size before/after');
 await page.goto(`${session.url}/scripts/qa/stage-pet-review.html`);await page.waitForFunction(()=>!!window.reviewStage);
 const bosses=JSON.parse(await readFile('docs/art/character-concepts.json','utf8')).filter(r=>r.key.startsWith('guardian-'));
 for(let i=0;i<bosses.length;i+=11){
  const result=await page.evaluate(rows=>window.reviewStage(rows),bosses.slice(i,i+11));
  for(const [j,r]of result.output.entries()){const key=bosses[i+j].key;await writeFile(`public/models/${key}.png`,decode(r.images[0]));await writeFile(`${root}${key}-views.png`,decode(r.sheet));}
 }
 await grid(bosses.map(r=>`public/models/${r.key}.png`),'bosses.png');checks.push('21 boss portraits and four views');
 const waking=await page.evaluate(async()=>{
  const {GameState,freshSave}=await import('/src/game.ts'),{RegionGuardian}=await import('/src/region-guardian.ts');const g=new GameState(freshSave(Date.now()),()=>Date.now()),view=new RegionGuardian(),rows=[];
  for(const stage of [1,12,20]){g.bosses=[{stageId:stage,x:0,z:-10,mode:'idle',target:null,loot:null}];g.z=-10;view.render(g,stage*5,true);let m=view.group.children.find(o=>o.userData.stage===stage);const start={y:m.scale.y,eye:m.getObjectByName('eyes').scale.y,x:m.position.x,z:m.position.z};g.bosses[0].mode='waking';g.bosses[0].wakeRemaining=1;view.render(g,stage*5+.05,true);const middle={y:m.scale.y,eye:m.getObjectByName('eyes').scale.y};g.bosses[0].wakeRemaining=0;view.render(g,stage*5+.1,true);rows.push({stage,start,middle,end:{y:m.scale.y,eye:m.getObjectByName('eyes').scale.y,x:m.position.x,z:m.position.z}});}
  return rows;
 });
 for(const r of waking){assert.ok(r.start.y<r.middle.y&&r.middle.y<r.end.y);assert.ok(r.start.eye<r.middle.eye&&r.middle.eye<r.end.eye);assert.equal(r.start.x,r.end.x);assert.equal(r.start.z,r.end.z);}checks.push('meadow / alien / void boss: continuous rise and eye opening at the sleeping position');
 await ready(page,session.url,'base');await page.waitForTimeout(600);
 const village=await page.evaluate(()=>window.__qa.villagePortrait());await writeFile(root+'village.png',decode(village));
 await page.evaluate(()=>window.__qa.multiplayerFixture(0,17,0,false));await page.waitForTimeout(1000);assert.ok((await page.evaluate(()=>window.__qa.metrics())).camera[2]>24);checks.push('camera follows the expanded rear farm area');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.goto(`${session.url}/docs/art/stage-gallery.html`);
  assert.equal(await page.locator('article:visible').count(),11);await page.locator('[data-id="100"]').click();
  for(const v of [1,2,3,4,6])await page.locator(`[data-view="${v}"]`).click();await page.locator('#close').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.screenshot({path:root+`gallery-mobile-${width}.png`,fullPage:true});
 }
 checks.push('320px and 390px catalogue: 11 cards, views, animation, no horizontal clipping');
 await ready(page,session.url,'collection');await page.waitForTimeout(300);
 await page.screenshot({path:root+'game-collection-mobile.png',fullPage:true});
 assert.equal(await page.locator('.pet-catalog-card').count(),11);
 assert.ok(await page.locator('.pet-catalog-grid').evaluate(el=>el.getBoundingClientRect().top<400));
 await page.locator('[data-pet-view="100"]').click();await page.waitForTimeout(350);await page.screenshot({path:root+'game-viewer-mobile.png'});await page.keyboard.press('Escape');
 await page.evaluate(()=>window.__qa.petResult(311));await page.waitForTimeout(250);
 assert.ok(await page.locator('.dragon-reveal[data-stage="12"]').count());await page.screenshot({path:root+'dragon-reveal-mobile.png'});
 checks.push('live game: stage catalogue, 3D viewer, dragon reveal');assert.deepEqual(errors,[]);
 const hidden=await page.evaluate(async()=>{const {GameState,freshSave}=await import('/src/game.ts'),{panelHTML}=await import('/src/panels.ts');const g=new GameState(freshSave(Date.now()),()=>Date.now());const host=document.createElement('div');host.innerHTML=panelHTML('collection',g);const secret=host.querySelector('.secret-pet');return {image:secret.querySelector('img').getAttribute('src'),preview:secret.querySelector('[data-pet-view]')!==null,hint:secret.querySelector('p').textContent,disabled:secret.querySelector('button').disabled};});
 assert.match(hidden.image,/-silhouette\.png$/);assert.equal(hidden.preview,false);assert.ok(hidden.hint.length>8);assert.equal(hidden.disabled,true);checks.push('undiscovered dragon: silhouette and hint only; no full-model viewer, claim disabled');
 await writeFile('docs/art/stage-ui-audit.json',JSON.stringify({checks,errors},null,2)+'\n');console.log(checks.join('\n'));
}finally{await session.close();}
