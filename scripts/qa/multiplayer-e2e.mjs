import assert from 'node:assert/strict';
import {multiplayerServer} from '../multiplayer-server.mjs';
import {browserSession,ready,report} from './lib.mjs';
const started=Date.now();
const network=multiplayerServer(()=>1800000010000+Date.now()-started);
await new Promise(resolve=>network.listen(4330,'127.0.0.1',resolve));
const session=await browserSession();
const a=await session.browser.newPage({viewport:{width:390,height:844}}),b=await session.browser.newPage({viewport:{width:390,height:844}});
const errors=[];for(const page of [a,b])page.on('pageerror',e=>errors.push(e.message));
try{
 await ready(a,session.url);await ready(b,session.url);
 await a.evaluate(()=>window.__qa.multiplayerFixture(0,-12,Math.PI,false));
 await b.evaluate(()=>window.__qa.multiplayerFixture(0,-13,0,true));
 for(const page of [a,b]){await page.click('#settings');await page.click('#multiplayer-connect');await page.waitForFunction(()=>document.getElementById('multiplayer-connect')?.textContent==='친구 연결 종료');await page.click('#resume');}
 await a.waitForTimeout(500);assert.equal(await a.locator('#action-label').textContent(),'배트 스윙');await a.click('#action');
 const before=await b.evaluate(()=>window.__qa.state());await a.keyboard.press('Space');await a.waitForTimeout(300);
 const after=await b.evaluate(()=>window.__qa.state());assert.equal(after.carried.id,before.carried.id);assert.equal(after.z,before.z);assert.equal((await b.evaluate(()=>window.__qa.metrics())).fallen,false);
 await a.screenshot({path:'artifacts/screenshots/multiplayer-cooperative.png'});
 assert.deepEqual(errors,[]);await report('multiplayer-e2e',{passed:1,scenario:'Two browser sessions login; contextual bat swing and Space leave peer egg intact'});console.log('PASS two-browser cooperative movement, no PvP attack entrypoint');
}finally{await session.close();await new Promise(resolve=>network.close(resolve));}
