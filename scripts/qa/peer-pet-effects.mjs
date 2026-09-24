// Manual visual diagnostic for remote companion artifacts.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const server=await createServer({server:{port:4323,strictPort:true,host:'127.0.0.1'},plugins:[{
 name:'peer-pet-effects-fixture',enforce:'pre',transform(code,id){
  if(!id.replaceAll('\\','/').endsWith('/src/main.ts'))return;
  return code.replace('ready = true;',`ready = true; window.__effects={world,game,multiplayer};`);
 }
}]});
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:560,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4323/?qa=true&scene=base');
 await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
 await page.evaluate(()=>{
  const {game,multiplayer}=window.__effects;
  multiplayer.peers=[{id:'observer-pet-owner',name:'친구',level:3,x:game.x+1,z:game.z-1,rotation:Math.PI,at:Date.now(),velocity:{x:0,z:0},downUntil:0,attackAt:0,hitAt:0,appearance:0,carried:null,activePets:[100,110,319],pets:[],slot:1}];
 });
 await page.waitForFunction(()=>[...window.__effects.world.peerPets.values()][0]?.group.children.length===3);
 await page.waitForTimeout(1200);
 await mkdir('artifacts/screenshots',{recursive:true});
 await page.screenshot({path:'artifacts/screenshots/peer-effects-full.png'});
 const stats=await page.evaluate(()=>{
  const {world}=window.__effects;
  return [...world.peerPets.values()].flatMap(entry=>entry.group.children.map(p=>{
   const s=p.getObjectByName('sparks');return {id:p.userData.petId,position:p.position.toArray(),scale:p.scale.toArray(),height:p.userData.labelHeight,particles:s.count,matrices:[...s.instanceMatrix.array]};
  }));
 });
 await page.evaluate(()=>{for(const entry of window.__effects.world.peerPets.values())entry.group.traverse(p=>{if(p.name==='sparks')p.visible=false;});});
 await page.screenshot({path:'artifacts/screenshots/peer-effects-no-sparks.png'});
 await page.evaluate(()=>{for(const entry of window.__effects.world.peerPets.values())entry.group.traverse(p=>{if(p.name==='sparks')p.visible=true;else if(p.isMesh)p.visible=false;});});
 await page.screenshot({path:'artifacts/screenshots/peer-effects-only-sparks.png'});
 await page.evaluate(()=>{
  const {game,multiplayer}=window.__effects;
  const peer=multiplayer.peers[0];
  multiplayer.peers=Array.from({length:4},(_,i)=>({...peer,id:`crowd-${i}`,x:game.x+i*.15,z:game.z-.2,slot:i+1,rotation:0,activePets:[100+i*10,101+i*10,102+i*10]}));
 });
 await page.waitForFunction(()=>[...window.__effects.world.peerPets.values()].filter(e=>e.group.children.length===3).length===4);
 for(let step=0;step<20;step++){
  await page.evaluate(step=>{
   const {game,multiplayer}=window.__effects;
   multiplayer.peers=multiplayer.peers.map((p,i)=>({...p,at:Date.now(),x:game.x+Math.sin(step*.15)*2+i*.15,z:game.z-.2}));
  },step);
  await page.waitForTimeout(100);
 }
 // Finish buffered movement before checking idle labels (software rendering can
 // advance the capped simulation more slowly than wall-clock time).
 await page.evaluate(()=>{
  const {world,multiplayer}=window.__effects;
  for(const peer of multiplayer.peers){
   const avatar=world.peers.get(peer.id);avatar.userData.motion.reset();
   avatar.userData.snapshot=null;avatar.position.set(peer.x,0,peer.z);
   world.peerPets.get(peer.id).trail=[];
  }
 });
 await page.waitForTimeout(2000);
 const labels=await page.evaluate(()=>[...document.querySelectorAll('.peer-pet-label')].map(l=>({text:l.textContent,hidden:l.hidden,x:parseFloat(l.style.left),y:parseFloat(l.style.top)})));
 await page.waitForTimeout(600);
 const settled=await page.evaluate(()=>[...document.querySelectorAll('.peer-pet-label')].map(l=>({hidden:l.hidden,x:parseFloat(l.style.left),y:parseFloat(l.style.top)})));
 await page.screenshot({path:'artifacts/screenshots/peer-effects-crowd.png'});
 for(const [i,label]of labels.entries()){
  assert.equal(settled[i].hidden,label.hidden,'crowded labels remain stable at rest');
  if(!label.hidden)assert.ok(Math.hypot(settled[i].x-label.x,settled[i].y-label.y)<2,`labels do not shuffle at rest: ${JSON.stringify({label,after:settled[i]})}`);
 }
 assert.ok(labels.some(l=>l.hidden)&&labels.some(l=>!l.hidden),'crowded labels yield without hiding everything');
 await page.screenshot({path:'artifacts/screenshots/peer-effects-crowd.png'});
 await writeFile('artifacts/screenshots/peer-effects.json',JSON.stringify({stats,labels,errors},null,2));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pets:stats.map(({matrices,...p})=>p),crowdLabels:labels,errors}));
}finally{await browser.close();await server.close();}
