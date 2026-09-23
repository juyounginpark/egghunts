import assert from 'node:assert/strict';
import {modules,browserSession,ready,report} from './lib.mjs';
const m=await modules(),session=await browserSession();const results=[],errors=[];
try{
 const page=await session.browser.newPage({viewport:{width:360,height:800},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));await ready(page,session.url,'base');
 for(const d of m.HAZARDS){
  for(const active of [false,true]){
   await page.evaluate(({id,active})=>window.__qa.pattern(id,active),{id:d.id,active});await page.waitForTimeout(500);
   assert.equal((await page.evaluate(()=>window.__qa.state())).progression.stage,d.stageId);
   const bounds=await page.evaluate(()=>{const top=document.getElementById('top-hud').getBoundingClientRect(),bottom=document.getElementById('bottom-hud').getBoundingClientRect();return {top:top.bottom,bottom:bottom.top,overflow:document.documentElement.scrollWidth>window.innerWidth};});
   assert.ok(bounds.top<bounds.bottom,d.id);assert.equal(bounds.overflow,false);
   await page.screenshot({path:`artifacts/screenshots/hazard-${d.stageId}-${d.id}-${active?'active':'warning'}.png`,animations:'disabled'});
   results.push({id:d.id,stage:d.stageId,phase:active?'Active':'Telegraph'});
  }
 }
 assert.deepEqual(errors,[]);await report('hazard-visual',{screenshots:results.length,patterns:m.HAZARDS.length,results,errors});console.log(`PASS ${m.HAZARDS.length} attack patterns, ${results.length} mobile captures`);
}finally{await session.close();await m.cleanup();}
