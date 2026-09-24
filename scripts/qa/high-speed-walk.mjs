// Manual 40-speed real renderer/client prediction + authoritative room engine.
// Isolated HTTP room with controlled jitter, NOT Supabase/database/network performance.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
let handleRoom;
const server=await createServer({server:{port:4325,strictPort:true,host:'127.0.0.1'},plugins:[{
 name:'isolated-high-speed-room',enforce:'pre',configureServer(vite){vite.middlewares.use('/diagnostic-room',(req,res)=>handleRoom(req,res));},transform(code,id){
  // Reproduce the former 40 cap in this fixture even after production moves to 20.
  if(id.replaceAll('\\','/').endsWith('/src/data.ts'))return code.replace(/maxMovementSpeed:\s*\d+/,'maxMovementSpeed:40');
  if(!id.replaceAll('\\','/').endsWith('/src/main.ts'))return;
  return code.replace('async function start() {',`
   online.enter=async()=>{
    online.client={auth:{getSession:async()=>({data:{session:{access_token:'isolated-fixture'}},error:null})}};
    online.requestState=async request=>fetch('/diagnostic-room',{method:'POST',body:JSON.stringify(request)});
    online.pending={operation:'join',id:crypto.randomUUID(),input:{x:0,z:0},commands:[]};await online.flush();online.active=true;
   };
   async function start() {`).replace('ready = true;',`ready = true;
    window.__walk={samples:[],direction:-1,travel:0};
    let lastSample=performance.now(),lastX=game.x,lastZ=game.z;
    window.__walkTimer=setInterval(()=>{
     const state=window.__walk;
     if(game.z<game.farZ+10)state.direction=1;if(game.z>-10)state.direction=-1;
     const dir=state.direction;
     const candidates=[[0,dir],[.7,dir*.7],[-.7,dir*.7],[1,0],[-1,0]];
     const best=candidates.map(([x,z])=>{const p=game.mapCollision.move(game.x,game.z,x*2,z*2,game.progression.stage);return {x,z,score:(p.z-game.z)*dir*10-Math.abs(p.x)*.01+Math.abs(p.x-game.x)*.05};}).sort((a,b)=>b.score-a.score)[0];
     input.x=best.x*.832-best.z*.555;input.y=best.x*.555+best.z*.832;
     if(performance.now()-lastSample>500){
      const step=Math.hypot(game.x-lastX,game.z-lastZ);if(step<50)state.travel+=step;lastX=game.x;lastZ=game.z;
      state.samples.push({at:performance.now(),x:game.x,z:game.z,stage:game.stage.id,speed:game.movementSpeed,actualSpeed:Math.hypot(game.velocity.x,game.velocity.z),rtt:online.roundTrip,correction:Math.hypot(online.visualOffset.x,online.visualOffset.z),calls:world.renderer.info.render.calls,memory:{...world.renderer.info.memory},buffers:window.__buffers.created-window.__buffers.deleted});lastSample=performance.now();
     }
    },50);
    window.__walkStop=async()=>{clearInterval(window.__walkTimer);input.reset();online.halt();await online.busy;online.active=false;clearInterval(online.syncTimer);};`);
 }
}]});
const {GameState,freshSave}=await server.ssrLoadModule('/src/game.ts');
const {BALANCE}=await server.ssrLoadModule('/src/data.ts');
const {exportRuntime}=await server.ssrLoadModule('/src/online-state.ts');
const {runRoom}=await server.ssrLoadModule('/server/room-engine.ts');
const members=Array.from({length:5},(_,slot)=>({user_id:`isolated-${slot}`,slot,last_seen:new Date().toISOString()}));
let room=null,requests=0;const started=performance.now(),epoch=1800000060000,network=[];
handleRoom=async(req,res)=>{
 try{
  let body='';for await(const chunk of req)body+=chunk;
  const request=JSON.parse(body),index=++requests,begin=performance.now();
  await new Promise(resolve=>setTimeout(resolve,40+(index%29===0?180:0)));
  const now=epoch+performance.now()-started;
  if(room)for(const [id,p]of Object.entries(room.players))if(id!==members[0].user_id){p.seen=now;p.input={x:0,z:p.runtime.fields.z<-800?1:-1};}
  const compute=performance.now(),result=runRoom(room,members,[],members[0].user_id,request,now);
  room=result.room;
  if(request.operation==='join'){
   for(const p of Object.values(room.players)){
    const g=new GameState(freshSave(now),()=>now,()=>.5);g.save.trainingSpeed=40-BALANCE.speed;g.save.bossWarningSeen=true;g.save.tutorial=5;
    g.z=-12;g.deadline=now+45000;g.immunity=9999;p.runtime=exportRuntime(g);
   }
   result.response.runtime=room.players[members[0].user_id].runtime;
  }
  const simulationMs=performance.now()-compute;
  room=JSON.parse(JSON.stringify(room));
  await new Promise(resolve=>setTimeout(resolve,40+(index%17===0?95:0)));
  network.push({at:performance.now()-started,ms:performance.now()-begin,simulationMs});
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result.response));
 }catch(e){res.statusCode=500;res.end(JSON.stringify({error:String(e)}));}
};
await server.listen();const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__buffers={created:0,deleted:0};window.__frames=[];
  for(const type of [WebGLRenderingContext,WebGL2RenderingContext]){
   const create=type.prototype.createBuffer,remove=type.prototype.deleteBuffer;
   type.prototype.createBuffer=function(...args){const b=create.apply(this,args);if(b)window.__buffers.created++;return b;};
   type.prototype.deleteBuffer=function(b){if(b)window.__buffers.deleted++;return remove.call(this,b);};
  }
  let last=performance.now();const frame=now=>{if(window.__walk)window.__frames.push(now-last);last=now;requestAnimationFrame(frame);};requestAnimationFrame(frame);
 });
 await page.goto('http://127.0.0.1:4325/');await page.locator('#loading').waitFor({state:'hidden',timeout:90000});
 for(let i=0;i<18;i++){await page.waitForTimeout(10000);if(i%3===2)console.log(JSON.stringify(await page.evaluate(()=>({seconds:Math.round(performance.now()/1000),travel:Math.round(window.__walk.travel),latest:window.__walk.samples.at(-1)}))))}
 await page.evaluate(()=>window.__walkStop());
 const result=await page.evaluate(()=>({walk:window.__walk,frames:window.__frames}));
 await mkdir('artifacts/performance',{recursive:true});await writeFile('artifacts/performance/high-speed-walk.json',JSON.stringify({result,network,errors,limits:'Isolated 5-player authoritative HTTP room, controlled 80ms baseline + 95/180ms jitter. Desktop browser, not real-device or Supabase RTT.'},null,2));
 console.log(JSON.stringify({samples:result.walk.samples.length,travel:result.walk.travel,minZ:Math.min(...result.walk.samples.map(s=>s.z)),maxStage:Math.max(...result.walk.samples.map(s=>s.stage)),errors}));
}finally{await browser.close();await server.close();}
