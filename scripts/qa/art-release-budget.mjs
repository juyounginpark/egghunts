import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {browserSession} from './lib.mjs';
const session=await browserSession(true),errors=[];
try{
 const page=await session.browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(session.url);let loadError=null;
 try{await page.locator('#loading').waitFor({state:'hidden',timeout:60000});}catch(error){loadError=error.message;}
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,bytes:r.transferSize})));
 const initialBytes=resources.reduce((sum,r)=>sum+r.bytes,0);
 let jsGzipBytes=0;for(const name of await readdir('dist/assets'))if(name.endsWith('.js'))jsGzipBytes+=gzipSync(await readFile(`dist/assets/${name}`)).length;
 const result={initialBytes,jsGzipBytes,resources,errors,loadError,loadingText:await page.locator('#loading').innerText(),scope:'Local production preview, cold browser cache, 390x844 desktop Edge. Incomplete transfer if loadError is set. Not physical mobile FPS.'};
 await writeFile('artifacts/art-rework/release-budget.json',JSON.stringify(result,null,2));
 assert.equal(loadError,null,'Production must finish loading before accepting the transfer budget');assert.ok(initialBytes<4*1024*1024,`initial transfer ${initialBytes}`);assert.ok(jsGzipBytes<300*1024,`JS gzip ${jsGzipBytes}`);
 assert.equal(await page.evaluate(()=>typeof window.__qa),'undefined');assert.deepEqual(errors,[]);
 console.log(JSON.stringify({initialBytes,jsGzipBytes,errors}));
}finally{await session.close();}
