// Manual real-server test: two authenticated guests, warm stream, reconnect and leave.
/* global WebSocket, clearTimeout */
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const server=await createServer({server:{port:4320,strictPort:true,host:'127.0.0.1'},plugins:[{
 name:'live-room-stream-diagnostics',enforce:'pre',transform(code,id){
  if(!id.replaceAll('\\','/').endsWith('/src/main.ts'))return;
  return code.replace('ready = true;',`ready = true;
   window.__streamRead=()=>({rtt:online.roundTrip,connected:online.connected,socket:online.socket?.readyState,peers:online.peers.map(p=>p.name),x:game.x,z:game.z,serverTime:online.latest?.serverTime});
   window.__streamClose=()=>online.socket?.close();
   window.__streamLeave=()=>online.leave();`);
 }
}]});
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true});
const pages=[],errors=[],samples=[];
const label=process.argv[2]??'latest';
if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid report label');
try{
 for(const name of ['PingOne','PingTwo']){
  const page=await browser.newPage({viewport:{width:390,height:844}});pages.push(page);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__wire=[];
   const Native=window.WebSocket;
   window.WebSocket=class extends Native{
    constructor(...args){
     super(...args);this.measurements=new Map();const created=performance.now();
     if(!String(args[0]).includes('/functions/v1/game'))return;
     this.addEventListener('open',()=>window.__wire.push({event:'open',at:Date.now(),ms:performance.now()-created}));
     this.addEventListener('close',e=>window.__wire.push({event:'close',at:Date.now(),code:e.code,reason:e.reason,clean:e.wasClean}));
     this.addEventListener('message',e=>{try{const p=JSON.parse(e.data),start=this.measurements.get(p.id);if(start===undefined)return;this.measurements.delete(p.id);window.__wire.push({event:'response',at:Date.now(),ms:performance.now()-start,status:p.status,timing:p.timing,bytes:e.data.length});}catch{/* Not game traffic. */}});
    }
    send(data){try{const p=JSON.parse(data);if(p.request?.id)this.measurements.set(p.request.id,performance.now());}catch{/* Not game traffic. */}super.send(data);}
   };
  });
  await page.goto('http://127.0.0.1:4320/');await page.locator('#guest-login').click({timeout:60000});
  await page.locator('#player-name').fill(name);await page.locator('#find-room').click();
  await page.locator('#loading').waitFor({state:'hidden',timeout:90000});await page.evaluate(()=>document.activeElement?.blur());
 }
 await pages[0].waitForFunction(()=>window.__streamRead().peers.includes('PingTwo'));
 await pages[1].waitForFunction(()=>window.__streamRead().peers.includes('PingOne'));
 for(const page of pages)await page.waitForFunction(()=>window.__streamRead().socket===1);
 for(const page of pages){await page.keyboard.down('w');await page.keyboard.down('d');}
 for(let i=0;i<(label.includes('handoff')?560:100);i++){await pages[0].waitForTimeout(200);samples.push(await Promise.all(pages.map(p=>p.evaluate(()=>window.__streamRead()))));}
 for(const page of pages){await page.keyboard.up('w');await page.keyboard.up('d');}
 const automaticConnections=await Promise.all(pages.map(p=>p.evaluate(()=>window.__wire.filter(e=>e.event==='open').length)));
 const warmHandoffs=await Promise.all(pages.map(p=>p.evaluate(()=>window.__wire.filter(e=>e.event==='close'&&e.reason==='Warm handoff').length)));
 if(label.includes('handoff'))assert.ok(warmHandoffs.every(n=>n>=1),'old sockets close only after a prepared replacement is ready');
 await pages[0].evaluate(()=>window.__streamClose());
 await pages[0].waitForFunction(()=>window.__streamRead().socket===1&&window.__streamRead().connected,{},{timeout:15000});
 const firstTime=(await pages[0].evaluate(()=>window.__streamRead())).serverTime;
 await pages[0].waitForFunction(time=>window.__streamRead().serverTime>time,firstTime);
 const start=Date.now();await pages[1].evaluate(()=>window.__streamLeave());
 await pages[0].waitForFunction(()=>!window.__streamRead().peers.includes('PingTwo'),{},{timeout:10000});
 const leaveMs=Date.now()-start;
 const invalidStatus=await pages[0].evaluate(()=>new Promise((resolve,reject)=>{
  const socket=new WebSocket('wss://leblcdiqsyxqzwlsnkio.supabase.co/functions/v1/game');
  const timeout=setTimeout(()=>{socket.close();reject(Error('auth check timeout'));},10000);
  socket.onopen=()=>socket.send(JSON.stringify({token:'invalid',request:{id:'unauthorized-probe',operation:'update',commands:[]}}));
  socket.onmessage=e=>{clearTimeout(timeout);socket.close();resolve(JSON.parse(e.data).status);};
 }));assert.equal(invalidStatus,401);assert.deepEqual(errors,[]);
 const q=(a,n)=>a.sort((x,y)=>x-y)[Math.floor((a.length-1)*n)];
 const summary={twoPlayersInSameRoom:true,automaticConnections,warmHandoffs,leaveMs,invalidStatus,errors,players:[0,1].map(i=>{const values=samples.map(s=>s[i].rtt);return {p50:q(values,.5),p95:q(values,.95),max:Math.max(...values),connected:samples.every(s=>s[i].connected)};})};
 const wire=await Promise.all(pages.map(p=>p.evaluate(()=>window.__wire)));
 await mkdir('artifacts/performance',{recursive:true});await writeFile(`artifacts/performance/live-room-stream-${label}.json`,JSON.stringify({summary,samples,wire},null,2));console.log(JSON.stringify(summary,null,2));
}finally{
 for(const page of pages)await page.evaluate(()=>window.__streamLeave?.()).catch(()=>{});
 await browser.close();await server.close();
}
