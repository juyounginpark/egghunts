// Manual deterministic client packet replay; not public-server RTT or device FPS.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
const before=process.argv.includes('--before');
const baseline=before?execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'show','c33ddd1:src/online.ts'],{encoding:'utf8'}):null;
globalThis.document={addEventListener(){}};
globalThis.window={addEventListener(){}};
const server=await createServer({server:{middlewareMode:true},plugins:baseline?[{name:'previous-client',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/online.ts'))return baseline;}}]:[]});
try{
 const {OnlineGame}=await server.ssrLoadModule('/src/online.ts');
 const {GameState,freshSave}=await server.ssrLoadModule('/src/game.ts');
 const {exportRuntime}=await server.ssrLoadModule('/src/online-state.ts');
 const now=1800000060000;
 const make=()=>{const g=new GameState(freshSave(now),()=>now,()=>.5);g.save.trainingSpeed=100;g.z=-12;g.roomManaged=true;return g;};
 const results=[];
 for(const gap of [.2,2,8]){
  const game=make(),remote=make(),online=new OnlineGame(()=>{},()=>{});online.game=game;
  const packet=()=>({serverTime:now,runtime:exportRuntime(remote),world:remote.world,bosses:remote.bosses,peers:[],slot:0,count:1,events:[],errors:[]});
  const drawn=()=>game.z+online.visualOffset.z;
  online.update(0,-1);const walking=online.inputRevision;
  game.z=-16;online.update(0,0);const stopped=online.inputRevision,release=drawn();
  // Older walking reply arrives after release, followed by the stop reply.
  remote.z=release+gap;online.apply(packet(),{x:0,z:-1},walking);
  for(let i=0;i<30;i++)online.reconcile(1/60);
  assert.equal(drawn(),release,'old walking reply must not move a released player');
  online.apply(packet(),{x:0,z:0},stopped);
  const frames=[];
  for(let i=0;i<120;i++){online.reconcile(1/60);frames.push(drawn());if(i%15===0)online.apply(packet(),{x:0,z:0},stopped);}
  const drift=Math.max(...frames.map(z=>Math.abs(z-release)));
  results.push({gap,postReleaseDrift:drift});
  if(before)continue;
  assert.ok(drift<1e-8,'stop reply and repeated idle replies must not create a second walk');
  assert.equal(game.z,remote.z,'simulation still uses authoritative coordinates');
  remote.z-=.25;online.apply(packet(),{x:0,z:0},stopped);
  assert.ok(Math.abs(drawn()-(release-.25))<1e-8,'server-driven idle motion remains visible');
  // Rapid stop/start/stop: the previous stop reply cannot acknowledge the new release.
  online.update(0,-1);online.update(0,0);const secondStop=online.inputRevision;
  remote.z+=.5;const secondRelease=drawn();online.apply(packet(),{x:0,z:0},stopped);
  assert.notEqual(online.idleAcknowledgedRevision,secondStop);
  online.reconcile(.2);assert.ok(Math.abs(drawn()-secondRelease)<1e-8);
  online.apply(packet(),{x:0,z:0},secondStop);assert.equal(online.idleAcknowledgedRevision,secondStop);
  online.update(0,-1);const offset=Math.hypot(online.visualOffset.x,online.visualOffset.z);online.reconcile(1/60);
  assert.ok(Math.hypot(online.visualOffset.x,online.visualOffset.z)<offset,'resume consumes the visual offset');
  remote.hitAt=now;remote.z-=2;online.apply(packet(),{x:0,z:-1},online.inputRevision);
  assert.deepEqual(online.visualOffset,{x:0,z:0},'hits must override release presentation');
 }
 await mkdir('artifacts/performance',{recursive:true});
 await writeFile(`artifacts/performance/release-reconciliation-${before?'before':'after'}.json`,JSON.stringify({results,scope:'Actual OnlineGame packet replay with controlled position discrepancies; no production traffic.'},null,2));
 console.log(JSON.stringify({before,results}));
}finally{await server.close();delete globalThis.document;delete globalThis.window;}
