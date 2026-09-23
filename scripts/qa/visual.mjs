import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {browserSession,ready,report} from './lib.mjs';
const update=process.argv.includes('--update'),capture=process.argv.includes('--capture');
const onlyDevice=process.argv.find(arg=>arg.startsWith('--device='))?.split('=')[1];
const onlyScene=process.argv.find(arg=>arg.startsWith('--scene='))?.split('=')[1];
if(process.env.QA_SKIP_IMAGE_COMPARE==='1'&&!capture&&!update){console.log('SKIP image comparison: explicitly requested for this run');process.exit(0);}
const session=await browserSession();
await mkdir('artifacts/screenshots',{recursive:true});await mkdir('tests/visual-baselines',{recursive:true});
const views=[['android',360,800,0,0],['mobile',390,844,0,0],['large',412,915,0,0],['design',1080,1920,0,0],['ios',390,844,59,34],['small',320,568,0,0]];
const scenes=['base','egg-near','rare-near','egg-carry','urgent','egg-loss','hatch-whole','hatch-cracked','hatch-burst','result','upgrade','collection','night','shop','farm-pets','tutorial','stage-1','stage-2','stage-3','stage-4','training','death','death-choice','revive','pets','store','hazard-5','low-health','stages','traits'];
const results=[];const errors=[];
try {
 for(const [device,width,height,top,bottom] of views){
   if(onlyDevice&&device!==onlyDevice)continue;
   const page=await session.browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(({top,bottom})=>{document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--safe-top',`${top}px`);document.documentElement.style.setProperty('--safe-bottom',`${bottom}px`);});},{top,bottom});
   for(const scene of scenes){
     if(onlyScene&&scene!==onlyScene)continue;
     await ready(page,session.url,scene);await page.waitForTimeout(500);
     await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=='lazy'||i.getBoundingClientRect().top<window.innerHeight).map(i=>i.decode().catch(()=>{})));});
     const layout=await page.evaluate(()=>{
       const rect=id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,visible:!!(r.width&&r.height)&&getComputedStyle(el).visibility!=='hidden'};};
       const c=document.querySelector('#world canvas');return {top:rect('top-hud'),bottom:rect('bottom-hud'),action:rect('action'),pad:rect('joystick'),shell:rect('shell'),ratio:parseFloat(c.style.width)/c.width,filter:getComputedStyle(c).imageRendering,overflow:document.documentElement.scrollWidth>window.innerWidth};
     });
     assert.equal(layout.ratio,2);assert.equal(layout.filter,'pixelated');assert.equal(layout.overflow,false);
     if(layout.bottom.visible&&!['result','hatch-burst'].includes(scene))assert.ok(layout.top.bottom<layout.bottom.y,`${device}/${scene}: HUD overlap ${layout.top.bottom} / ${layout.bottom.y}`);
     if(layout.action.visible)assert.ok(layout.action.right<=layout.shell.right&&layout.action.x>=layout.shell.x&&layout.action.bottom<=height-bottom&&layout.action.bottom-layout.action.y>=44);
     assert.ok(layout.top.y>=0);
     if(scene==='low-health'){
       const hp=await page.evaluate(()=>{const bar=document.getElementById('health-hud'),fill=document.getElementById('hp-fill');return {visible:!bar.hidden,state:bar.dataset.state,width:fill.style.width,color:getComputedStyle(fill).backgroundColor};});
       assert.equal(hp.visible,true);assert.equal(hp.state,'danger');assert.equal(hp.width,'25%');assert.equal(hp.color,'rgb(217, 107, 99)');
     }
     const name=`${device}-${scene}.png`,path=`artifacts/screenshots/${name}`;
     const bytes=await page.screenshot({path,animations:'disabled'});
     const baseline=`tests/visual-baselines/${name}`;
     let difference=0;
     if(update)await writeFile(baseline,bytes);
     else if(!capture) {
       const a=PNG.sync.read(bytes),b=PNG.sync.read(await readFile(baseline));assert.equal(a.width,b.width);assert.equal(a.height,b.height);
       let changed=0;for(let i=0;i<a.data.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])))>32)changed++;
       difference=changed/(a.width*a.height);assert.ok(difference<.015,`${name}: ${(difference*100).toFixed(2)}% differs`);
     }
     results.push({device,scene,difference,layout});
   }
   await page.close();console.log('PASS visual',device,results.filter(r=>r.device===device).length,'states');
 }
 assert.deepEqual(errors,[]);await report('visual',{baselineUpdate:update,screenshots:results.length,results,errors});
}finally{await session.close();}
