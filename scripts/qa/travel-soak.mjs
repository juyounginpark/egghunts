// Manual distance/repeated-travel renderer profile; isolated local fixture, no server saves.
/* global WebGLRenderingContext, WebGL2RenderingContext */
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.argv[2]??'after';
if(!['before','after'].includes(label))throw Error('Use before or after');
const original=label==='before'?execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'show','148e9f6:src/world.ts'],{encoding:'utf8'}):null;
const server=await createServer({server:{port:4324,strictPort:true,host:'127.0.0.1'},plugins:[{
 name:'travel-soak',enforce:'pre',transform(code,id){
  const path=id.replaceAll('\\','/');
  if(path.endsWith('/src/world.ts')&&original)return original;
  if(path.endsWith('/src/main.ts'))return code.replace('ready = true;','ready = true; window.__soak={game,world};');
 }
}]});
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__buffers={created:0,deleted:0};
  for(const type of [WebGLRenderingContext,WebGL2RenderingContext]){
   const create=type.prototype.createBuffer,remove=type.prototype.deleteBuffer;
   type.prototype.createBuffer=function(...args){const b=create.apply(this,args);if(b)window.__buffers.created++;return b;};
   type.prototype.deleteBuffer=function(b){if(b)window.__buffers.deleted++;return remove.call(this,b);};
  }
 });
 await page.goto('http://127.0.0.1:4324/?qa=true&scene=base');await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
 const result=await page.evaluate(async()=>{
  const {game,world}=window.__soak,passes=[],frames=[];
  const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  let previous=await frame();
  const end=game.farZ;
  for(let pass=0;pass<3;pass++){
   for(let z=-12;z>end;z-=8){
    game.x=0;game.z=z;game.deadline=game.now()+45000;
    const now=await frame();frames.push(now-previous);previous=now;
   }
   game.z=-12;await frame();await frame();
   passes.push({pass,liveBuffers:window.__buffers.created-window.__buffers.deleted,...window.__buffers,memory:{...world.renderer.info.memory},calls:world.renderer.info.render.calls,visibleEggs:world.eggs.children.length,visibleNests:[...world.nests.values()].filter(n=>n.visible).length});
  }
  frames.sort((a,b)=>a-b);
  return {passes,frameMs:{p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],max:frames.at(-1)},limits:'Desktop headless renderer distance sweep, not real-device FPS or network ping.'};
 });
 await mkdir('artifacts/performance',{recursive:true});await writeFile(`artifacts/performance/travel-soak-${label}.json`,JSON.stringify({result,errors},null,2));console.log(JSON.stringify({result,errors},null,2));
}finally{await browser.close();await server.close();}
