import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
export async function modules() {
  const dir=await mkdtemp(join(tmpdir(),'alkong-qa-'));
  for(const name of ['data','stage-data','stage-eggs','progression','hazards','game','input','platform','virtual-ad','format']) {
    let source=await readFile(`src/${name}.ts`,'utf8');
    if(name==='platform') source=source.replace(/import \{[\s\S]*?\} from "@apps-in-toss\/web-framework";/,'const Device={},Environment={},Game={},SafeArea={},Storage={},Analytics={},getUserKeyForGame=()=>{};');
    source=source.replace(/from "\.\/([\w-]+)"/g,'from "./$1.mjs"');
    await writeFile(join(dir,`${name}.mjs`),ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}));
  }
  const result={};for(const name of ['data','stage-data','stage-eggs','progression','hazards','game','input','platform','virtual-ad','format'])Object.assign(result,await import(pathToFileURL(join(dir,`${name}.mjs`))));
  result.cleanup=async()=>{if(!resolve(dir).startsWith(resolve(tmpdir())+'\\')&&!resolve(dir).startsWith(resolve(tmpdir())+'/'))throw Error('Unsafe temp cleanup');await rm(dir,{recursive:true,force:true});};
  return result;
}
export async function report(name,data,folder='test-results') {await mkdir(`artifacts/${folder}`,{recursive:true});await writeFile(`artifacts/${folder}/${name}.json`,JSON.stringify(data,null,2));}
export async function browserSession(production=false) {
  const server=production?await preview({preview:{port:4321,strictPort:true,host:'127.0.0.1'}}):await createServer({server:{port:4320,strictPort:true,host:'127.0.0.1'}});
  if(!production)await server.listen();
  const browser=await chromium.launch({channel:process.env.CI?undefined:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  return {browser,url:`http://127.0.0.1:${production?4321:4320}`,close:async()=>{await browser.close();await new Promise(resolve=>production?server.httpServer.close(resolve):server.close().then(resolve));}};
}
export async function ready(page,url,scene='base') {
  await page.goto(`${url}/?qa=true&seed=1001&scene=${scene}`);
  await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
  await page.waitForFunction(()=>!!window.__qa);
  await page.waitForTimeout(250);
}
