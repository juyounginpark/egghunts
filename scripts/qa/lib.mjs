import { writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {build} from 'esbuild';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
export async function modules() {
  const dir=await mkdtemp(join(tmpdir(),'alkong-qa-'));
  const names=['data','balance','weight','stage-data','stage-eggs','progression','hazards','game','input','platform','virtual-ad','format'];
  const file=join(dir,'runtime.mjs');
  const built=await build({stdin:{contents:names.map(n=>`export * from './src/${n}.ts';`).join('\n')+"\nexport {multiplayerServer} from './scripts/multiplayer-server.mjs';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env.BASE_URL':'"/"'},plugins:[{name:'native-test-adapter',setup(b){b.onResolve({filter:/^@apps-in-toss\/web-framework$/},()=>({path:'sdk',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const Device={},Environment={},Game={},SafeArea={},Storage={},Analytics={},getUserKeyForGame=()=>{};'}));}}]});
  await writeFile(file,built.outputFiles[0].text);
  const result={...await import(pathToFileURL(file))};
  result.cleanup=async()=>{if(!resolve(dir).startsWith(resolve(tmpdir())+'\\')&&!resolve(dir).startsWith(resolve(tmpdir())+'/'))throw Error('Unsafe temp cleanup');await rm(dir,{recursive:true,force:true});};
  return result;
}
export async function report(name,data,folder='test-results') {await mkdir(`artifacts/${folder}`,{recursive:true});await writeFile(`artifacts/${folder}/${name}.json`,JSON.stringify(data,null,2));}
export async function browserSession(production=false) {
  const base=process.env.QA_BASE_PATH??'/';
  const server=production?await preview({base,preview:{port:4321,strictPort:true,host:'127.0.0.1'}}):await createServer({server:{port:4320,strictPort:true,host:'127.0.0.1'}});
  if(!production)await server.listen();
  const browser=await chromium.launch({channel:process.env.CI?undefined:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  return {browser,url:process.env.QA_SITE_URL??`http://127.0.0.1:${production?4321:4320}${production?base.replace(/\/$/,''):''}`,close:async()=>{await browser.close();await new Promise(resolve=>production?server.httpServer.close(resolve):server.close().then(resolve));}};
}
export async function ready(page,url,scene='base') {
  await page.goto(`${url}/?qa=true&seed=1001&scene=${scene}`);
  await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
  await page.waitForFunction(()=>!!window.__qa);
  await page.waitForTimeout(250);
}
