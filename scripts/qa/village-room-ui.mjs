// Explicitly requested mobile UI / village review. Peer fixtures are not a live 5-player test.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{port:4322,strictPort:true,host:'127.0.0.1'},plugins:[{
 name:'room-ui-fixture',enforce:'pre',transform(code,id){
  if(!id.replaceAll('\\','/').endsWith('/src/main.ts'))return;
  return code.replace('ready = true;',`ready = true;window.__roomFixture=()=>{
   game.save.playerName='알콩친구';game.progression.level=12;
   multiplayer.peers=Array.from({length:4},(_,i)=>({id:'review-'+i,name:['산책친구','구름고양이','해솔','긴이름테스트친구'][i],level:3+i,isGuest:i%2===0,slot:i+1,x:(i-1.5)*1.5,z:i%2?-8:1,rotation:0,appearance:0,downUntil:0,attackAt:0,carried:null}));
  };`);
 }
}]});
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir('artifacts/screenshots',{recursive:true});
 await page.goto('http://127.0.0.1:4322/?qa=true&scene=base');
 await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
 await page.evaluate(()=>window.__roomFixture());
 for(const width of [320,390,1024]){
  await page.setViewportSize({width,height:844});await page.waitForTimeout(250);
  assert.equal(await page.locator('#trait-select,[data-tab="traits"],[data-trait]').count(),0);
  assert.equal(await page.locator('.room-progress-row').count(),5);
  assert.equal(await page.locator('.player-nameplate').count(),5);
  assert.ok(await page.locator('.player-nameplate').filter({hasText:'[GUEST] 산책친구 · LV.3'}).count());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
  const boxes=await page.locator('#room-progress,#speed-hud').evaluateAll(es=>Object.fromEntries(es.map(e=>{const r=e.getBoundingClientRect();return [e.id,{x:r.x,y:r.y,right:r.right,bottom:r.bottom}];})));
  assert.ok(boxes['room-progress'].x>=boxes['speed-hud'].right,'progress and speed do not overlap');
  await page.screenshot({path:`artifacts/screenshots/village-room-${width}.png`});
 }
 const png=await page.evaluate(()=>window.__qa.villagePortrait());
 await writeFile('artifacts/screenshots/village-mountains.png',Buffer.from(png.split(',')[1],'base64'));
 assert.deepEqual(errors,[]);console.log('PASS: 320/390/1024 UI, 5 progress rows, guest/name/level labels, no trait UI, open mountain village render');
}finally{await browser.close();await server.close();}
