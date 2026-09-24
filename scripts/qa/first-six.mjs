import {writeFile,mkdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {browserSession} from './lib.mjs';
import {writeCharacterGallery} from '../write-character-gallery.mjs';
const session=await browserSession(),errors=[];
try{
 const page=await session.browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${session.url}/scripts/qa/first-six.html`);await page.waitForFunction(()=>!!window.renderSix);
 const {results,sheet}=await page.evaluate(()=>window.renderSix());
 await mkdir('docs/art/previews/first-six',{recursive:true});const png=s=>Buffer.from(s.split(',')[1],'base64');
 await writeFile('docs/art/previews/first-six-comparison.png',png(sheet));
 for(const r of results){
  await writeFile(`public/models/pet-${r.id}.png`,png(r.views[0]));
  for(let v=0;v<5;v++)await writeFile(`docs/art/previews/first-six/pet-${r.id}-${v}.png`,png(r.views[v]));
  await writeFile(`docs/art/previews/first-six/pet-${r.id}-idle.png`,png(r.strip));
  assert.notDeepEqual(r.poses[0],r.poses[10],`pet ${r.id} head must animate`);
  const m=JSON.parse(await readFile(`public/models/pet-${r.id}.json`,'utf8'));
  assert.deepEqual(m.size,[24,24,24]);assert.ok(m.voxels.every(v=>v.slice(0,3).every(n=>Number.isInteger(n)&&n>=0&&n<24)));
  const all=new Map(m.voxels.map(v=>[v.slice(0,3).join(','),v[3]])),partCells=Object.values(m.parts).flatMap(p=>p.voxels);
  assert.equal(new Set(partCells.map(v=>v.slice(0,3).join(','))).size,m.voxels.length);assert.equal(partCells.length,m.voxels.length);
  for(const [name,part]of Object.entries(m.parts))if(r.id!==4||name!=='tail')for(const [x,y,z,c]of part.voxels){
   // Cat tail intentionally overwrites rear body cells; face and paired limbs must remain exact.
   if(r.id===4&&name==='body')continue;
   assert.equal(all.get([23-x,y,z].join(',')),c,`pet ${r.id} ${name} asymmetric at ${x},${y},${z}`);
  }
 }
 await writeCharacterGallery();
 await page.goto(`${session.url}/docs/art/character-gallery.html`);await page.locator('article img').first().waitFor();await page.screenshot({path:'docs/art/previews/first-six-gallery-desktop.png'});
 await page.locator('[data-pet="2"]').click();await page.locator('dialog[open]').waitFor();await page.locator('[data-angle="2"]').click();await page.locator('#large').evaluate(img=>img.decode());await page.screenshot({path:'docs/art/previews/first-six-viewer.png'});await page.locator('#close').click();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/art/previews/first-six-gallery-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);await writeFile('docs/art/first-six-audit.json',JSON.stringify({models:results.map(({views,strip,poses,...r})=>({...r,animated:true})),errors},null,2)+'\n');
 console.log('PASS six 24-cube rigs, paired anatomy, animated poses and responsive gallery.');
}finally{await session.close();}
