// Manual multiplayer visual regression: two browsers, real room engine, seeded inventories.
/* global structuredClone */
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const server=await createServer({server:{port:4322,strictPort:true,host:'127.0.0.1'},plugins:[{
 name:'peer-appearance-fixture',enforce:'pre',transform(code,id){
  if(!id.replaceAll('\\','/').endsWith('/src/main.ts'))return;
  return code.replace('ready = true;',`ready = true;
   window.__peerSet=peers=>{multiplayer.peers=peers;};
   window.__peerRead=()=>({followers:[...world.peerPets].map(([id,p])=>({id,pets:p.group.children.map(c=>({id:c.userData.petId,x:c.position.x,z:c.position.z})),visible:p.group.visible})),
    peers:[...world.peers].map(([id,a])=>{const egg=a.getObjectByName('peer-egg'),sparks=egg?.getObjectByName('sparks');return {id,appearance:egg?.userData.appearance,egg:!!egg,leg:a.getObjectByName('left_leg')?.rotation.x,arm:a.getObjectByName('left_arm')?.rotation.x,matrix:sparks?Array.from(sparks.instanceMatrix.array):[],x:a.position.x,z:a.position.z};}),error:world.assetError});`);
 }
}]});
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const {runRoom}=await server.ssrLoadModule('/server/room-engine.ts');
 const {GameState,freshSave}=await server.ssrLoadModule('/src/game.ts');
 const {exportRuntime}=await server.ssrLoadModule('/src/online-state.ts');
 const now=1800000060000,members=['a','b'].map((user_id,slot)=>({user_id,slot,last_seen:new Date(now).toISOString()}));
 const profiles=members.map(m=>{const g=new GameState(freshSave(now),()=>now,()=>.1);for(const id of [0,100,319])g.save.mongles[id]=1;g.save.active=m.slot?[100]:[319,0];return {user_id:m.user_id,state:exportRuntime(g)};});
 let r=runRoom(null,members,profiles,'a',{id:'join-a',commands:[]},now);
 const held={...r.room.world[0],id:'secret-carry',type:30,stageId:20,variant:5};
 r.room.players.a.runtime.fields.carried=held;r.room.players.a.runtime.fields.z=-8;r.room.players.a.runtime.fields.deadline=now+45000;
 const a=runRoom(structuredClone(r.room),members,profiles,'a',{id:'read-a',commands:[]},now+30).response;
 const b=runRoom(structuredClone(r.room),members,profiles,'b',{id:'read-b',commands:[]},now+30).response;
 assert.deepEqual(a.peers[0].activePets,[100]);assert.deepEqual(b.peers[0].activePets,[319,0]);assert.deepEqual(b.peers[0].pets,[100]);
 assert.equal(b.peers[0].egg.stageId,20);assert.equal(b.peers[0].egg.variant,5);
 const pages=await Promise.all([browser.newPage({viewport:{width:390,height:844}}),browser.newPage({viewport:{width:390,height:844}})]);
 for(const page of pages){page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4322/?qa=true&scene=base');await page.locator('#loading').waitFor({state:'hidden',timeout:90000});}
 await pages[0].evaluate(peers=>window.__peerSet(peers),a.peers);await pages[1].evaluate(peers=>window.__peerSet(peers),b.peers);
 await pages[0].waitForFunction(()=>window.__peerRead().followers[0]?.pets.length===1);
 await pages[1].waitForFunction(()=>window.__peerRead().followers[0]?.pets.length===2);
 const read=()=>pages[1].evaluate(()=>window.__peerRead());
 let state=await read();assert.deepEqual(state.followers[0].pets.map(p=>p.id),[319,0]);assert.equal(state.peers[0].appearance,'20:5');
 const matrix=state.peers[0].matrix;
 for(let i=0;i<matrix.length;i+=16)for(const axis of [0,4,8])assert.ok(Math.hypot(...matrix.slice(i+axis,i+axis+3))<.5,'no unit-size aura cube');
 await pages[1].waitForTimeout(100);assert.notDeepEqual((await read()).peers[0].matrix,matrix,'held aura animates');
 const moved={...b.peers[0],at:now+400,x:3,z:-7,velocity:{x:1,z:0}};
 await pages[1].evaluate(p=>window.__peerSet([p]),moved);await pages[1].waitForTimeout(600);
 assert.notDeepEqual((await read()).followers[0].pets,state.followers[0].pets,'companions follow the owner');
 assert.ok(Math.abs((await read()).peers[0].leg)>0.001,'remote rig walks');
 assert.equal((await read()).peers[0].arm,-2.4,'carrying raises arms');
 // A late model load must not restore a pet that was already unequipped.
 await pages[1].route('**/models/pet-298.json',async route=>{await new Promise(resolve=>setTimeout(resolve,350));await route.continue();});
 await pages[1].evaluate(p=>window.__peerSet([{...p,activePets:[298]}]),moved);await pages[1].waitForTimeout(40);
 await pages[1].evaluate(p=>window.__peerSet([{...p,activePets:[100],egg:{...p.egg,stageId:1,variant:0}}]),moved);
 await pages[1].waitForFunction(()=>window.__peerRead().followers[0]?.pets[0]?.id===100);
 await pages[1].waitForTimeout(450);state=await read();assert.deepEqual(state.followers[0].pets.map(p=>p.id),[100]);assert.equal(state.peers[0].appearance,'1:0');
 await mkdir('artifacts/screenshots',{recursive:true});await pages[1].screenshot({path:'artifacts/screenshots/peer-pets-egg.png'});
 await pages[1].evaluate(p=>window.__peerSet([{...p,activePets:[],carried:null,egg:null}]),moved);
 await pages[1].waitForTimeout(100);state=await read();assert.equal(state.followers[0].pets.length,0);assert.equal(state.peers[0].egg,false);
 await pages[1].evaluate(()=>window.__peerSet([]));await pages[1].waitForTimeout(100);assert.deepEqual((await read()).followers,[]);
 assert.deepEqual(errors,[]);console.log('PASS: two observer browsers, equipped IDs/order, farm separation, follow movement, secret egg variant, initialized/animated aura, late load, unequip/drop/leave');
}finally{await browser.close();await server.close();}
