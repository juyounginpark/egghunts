import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {once} from 'node:events';
import {clearTimeout} from 'node:timers';
import {WebSocket} from 'ws';
import {PresenceRoom} from '../../server/presence-room.mjs';
import {presenceServer} from '../../server/presence-host.mjs';
import {report} from './lib.mjs';
const vite=await createServer({cacheDir:'node_modules/.vite-ai-unit',server:{middlewareMode:true}});
const results=[],test=async(name,fn)=>{await fn();results.push(name);console.log('PASS',name);};
try{
 const {GameState,freshSave}=await vite.ssrLoadModule('/src/game.ts'),{AISession,AIRandom,AI_NAMES}=await vite.ssrLoadModule('/src/ai-session.ts'),{PlayerEntity}=await vite.ssrLoadModule('/src/player-entity.ts');
 await test('1,000 distinct names fit the shared display format',()=>{assert.equal(AI_NAMES.length,1000);assert.equal(new Set(AI_NAMES).size,1000);assert.ok(AI_NAMES.every(name=>name.length<=10&&/^[\p{L}\p{N}_]+$/u.test(name)));});
 let now=1800000060000;const human=new GameState(freshSave(now),()=>now,()=>.1);human.save.tutorial=6;
 const random=new AIRandom(1234),humanEntity=new PlayerEntity('self','human',human);
 let ai;const attacks=[];
 const env={actors:()=>[humanEntity.pose(),...(ai?.bots.map(b=>b.entity.pose())??[])],visible:()=>false,collect:()=>false,attack:(actor,id)=>{const victim=ai.bots.find(b=>b.entity.id===id)?.entity;if(!victim)return;attacks.push({actor:actor.id,target:id});victim.game.receiveBat(victim.game.x-actor.game.x,victim.game.z-actor.game.z);}};
 ai=new AISession(()=>human,env,random.next);
 await test('A/B: prepared snapshots have varied actions, locations, ages, timers and actual engines',()=>{
  assert.ok(ai.bots.length>=2&&ai.bots.length<=4);assert.equal(new Set(ai.bots.map(b=>b.action)).size,ai.bots.length);assert.equal(new Set(ai.bots.map(b=>b.nextDecisionAt)).size,ai.bots.length);
  assert.equal(new Set(ai.bots.map(b=>b.entity.game.x+':'+b.entity.game.z)).size,ai.bots.length);
  assert.equal(new Set(ai.bots.map(b=>b.entity.game.save.playerName)).size,ai.bots.length);
  assert.ok(ai.bots.every(b=>now-b.joinedAt>=30000&&now-b.joinedAt<=900000&&b.entity.game instanceof GameState&&b.entity.game.petCount>0));
  assert.ok(ai.bots.some(b=>b.entity.game.carried));assert.ok(ai.bots.some(b=>b.entity.game.training));
 });
 await test('C: five simulated minutes include movement, mistakes, training, egg handling and autonomous decisions',()=>{
  const start=ai.bots.map(b=>({id:b.entity.id,x:b.entity.game.x,z:b.entity.game.z})),actions=new Set(),events=new Set();let errors=0,decisions=0;
  for(let step=0;step<6000;step++){now+=50;ai.update(.05);for(const b of ai.bots){actions.add(b.action);for(const e of b.recentEvents)events.add(e.name);errors=Math.max(errors,b.errors);decisions=Math.max(decisions,b.decisions);}}
  assert.ok(actions.has('SEARCH_EGG')&&actions.has('EXERCISE')&&actions.has('RETURN_BASE'));assert.ok(errors>5&&decisions>30);
  assert.ok(events.has('egg_pickup')||events.has('egg_saved'));assert.ok(events.has('training_gain'));
  assert.ok(start.some(s=>{const b=ai.bots.find(b=>b.entity.id===s.id);return !b||Math.hypot(s.x-b.entity.game.x,s.z-b.entity.game.z)>1;}));
  console.log(JSON.stringify({actions:[...actions],events:[...events],errors,decisions,attacks:attacks.length}));
 });
 await test('AI-to-AI attacks use shared bat knockback and drop the victim egg',()=>{
  // Turnover in the preceding soak may legitimately leave fewer than two actors.
  ai=new AISession(()=>human,env,random.next);
  const attacker=ai.bots[0],victim=ai.bots[1];attacker.entity.game.x=0;attacker.entity.game.z=-12;attacker.entity.game.carried=null;attacker.entity.game.facing={x:1,z:0};
  victim.entity.game.training=false;victim.entity.game.death=null;victim.entity.game.knockedUntil=0;victim.entity.game.x=1;victim.entity.game.z=-12;victim.entity.game.pickup(victim.entity.game.world[0]);
  env.attack(attacker.entity,victim.entity.id);assert.equal(victim.entity.game.carried,null);assert.ok(victim.entity.game.knockedUntil>now);assert.ok(attacks.length>0);
 });
 await test('D: initial grace and asynchronous turnover preserve offscreen entrances',()=>{
  const initial=ai.bots.map(b=>b.entity.id);ai.bots[0].plannedLeaveAt=now-10000;ai.bots[0].nextDecisionAt=now;ai.bots[0].entity.game.x=ai.bots[0].entity.game.z=0;
  now+=50;ai.update(.05);assert.ok(ai.bots.some(b=>b.entity.id===initial[0]),'initial grace keeps an ordinary departing actor');
  now+=45000;ai.bots[0].entity.game.x=ai.bots[0].entity.game.z=0;ai.update(.05);assert.ok(!ai.bots.some(b=>b.entity.id===initial[0]));
  for(let i=0;i<1000;i++){now+=50;ai.update(.05);}assert.ok(ai.bots.some(b=>!initial.includes(b.entity.id)));assert.ok(ai.bots.length<=4);
 });
 await test('F: handover preserves identity, seed, carried egg, position, health and decision phase',()=>{
  const snapshot=ai.checkpoint(),copy=new AISession(()=>human,env,random.next);copy.restore(snapshot);
  for(let i=0;i<snapshot.length;i++){const a=snapshot[i],b=copy.checkpoint()[i];assert.equal(b.id,a.id);assert.equal(b.seed,a.seed);assert.equal(b.x,a.x);assert.equal(b.z,a.z);assert.equal(b.health,a.health);assert.equal(b.carryingEgg?.id,a.carryingEgg?.id);assert.equal(b.decisionIn,a.decisionIn);}
 });
 await test('handover leaves a quiet interval before filling vacant AI slots',()=>{
  const copy=new AISession(()=>human,env,random.next);now+=60000;copy.restore([]);copy.update(.05);assert.equal(copy.bots.length,0);
  now+=11000;copy.update(.05);assert.equal(copy.bots.length,0);
 });
 await test('presence excludes inventory and rejects foreign AI hosts and overlapping slots',()=>{
  const room=new PresenceRoom();room.join('a',{x:0,z:0,dust:999,inventory:[1]});room.join('b',{x:0,z:0});assert.equal(room.players.get('a').dust,undefined);assert.equal(room.players.get('a').inventory,undefined);
  assert.throws(()=>room.ai('b',room.epoch,[],[]),/HOST_CHANGED/);assert.throws(()=>room.ai('a',room.epoch,[{id:'sim-1',slot:1}],[]),/INVALID_AI/);
  assert.equal(typeof room.chat,'undefined');
 });
 await test('E/F: actual sockets use codes, human priority, emotes, AI handover and reject text chat',async()=>{
  const server=presenceServer();server.http.listen(0,'127.0.0.1');await once(server.http,'listening');const url=`ws://127.0.0.1:${server.http.address().port}/presence`,sockets=[];
  const wait=(ws,predicate)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',listener);reject(Error('packet timeout'));},5000);function listener(raw){const p=JSON.parse(raw);if(predicate(p)){clearTimeout(timer);ws.off('message',listener);resolve(p);}}ws.on('message',listener);});
  const open=async packet=>{const ws=new WebSocket(url);sockets.push(ws);await once(ws,'open');const welcome=wait(ws,p=>p.type==='welcome');ws.send(JSON.stringify({type:'join',...packet,state:{name:'ham123',x:0,z:-12}}));return {ws,welcome:await welcome};};
  try{
   const a=await open({mode:'create'});assert.match(a.welcome.code,/^[A-HJ-NP-Z2-9]{5}$/);
   const snapshots=Array.from({length:4},(_,i)=>({...ai.checkpoint()[0],id:`sim-fixture-${i}`,slot:i+1})),poses=snapshots.map(s=>({id:s.id,slot:s.slot,x:s.x,z:s.z,rotation:s.rotation,health:s.health,carried:s.carryingEgg?.type??null}));
   a.ws.send(JSON.stringify({type:'ai',epoch:a.welcome.epoch,players:poses,snapshots}));await new Promise(r=>setTimeout(r,50));
   const evict=wait(a.ws,p=>p.type==='evict'),b=await open({mode:'join',code:a.welcome.code});await evict;assert.equal(b.welcome.players.length,4);
   const room=server.rooms.get(a.welcome.code);assert.equal(room.humanCount,2);assert.equal(room.bots.size,3);assert.equal(room.players.size,5);
   let next=wait(b.ws,p=>p.type==='peer'&&p.player.emote);a.ws.send(JSON.stringify({type:'position',state:{emote:{id:'hello',at:Date.now()}}}));assert.equal((await next).player.emote.id,'hello');
   next=wait(a.ws,p=>p.type==='error');a.ws.send(JSON.stringify({type:'chat',text:'removed'}));assert.equal((await next).message,'UNKNOWN_PACKET');
   next=wait(b.ws,p=>p.type==='host'&&p.hostId===b.welcome.id);a.ws.close();const handover=await next;assert.equal(handover.snapshots.length,3);assert.ok(handover.epoch>a.welcome.epoch);
   next=wait(b.ws,p=>p.type==='error');b.ws.send(JSON.stringify({type:'ai',epoch:a.welcome.epoch,players:[],snapshots:[]}));assert.equal((await next).message,'HOST_CHANGED');
  }finally{for(const ws of sockets)ws.terminate();await server.close();}
 });

 await test('simultaneous friend joins reserve distinct slots and displace AI within a few seconds',async()=>{
  const host=presenceServer();host.http.listen(0,'127.0.0.1');await once(host.http,'listening');const sockets=[],url=`ws://127.0.0.1:${host.http.address().port}/presence`;
  const open=async packet=>{const ws=new WebSocket(url);sockets.push(ws);await once(ws,'open');return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('join timeout')),5000);ws.on('message',raw=>{const p=JSON.parse(raw);if(p.type==='welcome'){clearTimeout(timer);resolve({ws,...p});}if(p.type==='error'){clearTimeout(timer);reject(Error(p.message));}});ws.send(JSON.stringify({type:'join',...packet,state:{x:0,z:0}}));});};
  try{const a=await open({mode:'create'});const snapshots=Array.from({length:4},(_,i)=>({...ai.checkpoint()[0],id:`sim-fixture-${i}`,slot:i+1}));a.ws.send(JSON.stringify({type:'ai',epoch:a.epoch,players:snapshots.map(s=>({id:s.id,slot:s.slot,x:s.x,z:s.z})),snapshots}));await new Promise(r=>setTimeout(r,30));const started=Date.now(),friends=await Promise.all(Array.from({length:4},()=>open({mode:'join',code:a.code})));assert.ok(Date.now()-started<4000);assert.equal(new Set([a.slot,...friends.map(p=>p.slot)]).size,5);assert.equal(host.rooms.get(a.code).players.size,5);assert.equal(host.rooms.get(a.code).bots.size,0);
  }finally{for(const ws of sockets)ws.terminate();await host.close();}
 });
 await test('AI starts in the selected dimension instead of placing all actors at the base',()=>{
  const save=freshSave(now);const ref=new GameState(save,()=>now,random.next);ref.progression.stage=7;ref.save.highestStage=7;
  const world=new AISession(()=>ref,env,random.next);assert.ok(world.bots.every(b=>b.entity.game.progression.stage===7));assert.equal(new Set(world.initialSnapshots.map(b=>b.x+':'+b.z)).size,world.bots.length);
 });

 await test('local combat transfers a real weighted egg once through the shared player controller',async()=>{
  const {LocalSession}=await vite.ssrLoadModule('/src/local-session.ts');
  const client={connected:false,isHost:false,peers:[],update(){},send(){},onPacket(){}};
  const local=new LocalSession(()=>human,client,()=>false,random.next),victim=local.ai.bots[0].entity;
  human.x=0;human.z=-12;human.carried=null;human.training=false;human.death=null;human.knockedUntil=0;human.batAt=0;human.facing={x:1,z:0};
  victim.game.x=1;victim.game.z=-12;victim.game.training=false;victim.game.death=null;victim.game.knockedUntil=0;const egg=victim.game.carried??victim.game.world[0];if(!victim.game.carried)victim.game.pickup(egg);
  local.attack(local.human.entity,victim.id);assert.equal(victim.game.carried,null);assert.equal(local.visibleDrops.length,1);
  assert.ok(local.collect(local.human.entity));assert.equal(human.carried.id,egg.id);assert.equal(human.carried.weightG,egg.weightG);assert.equal(local.visibleDrops.length,0);assert.equal(local.collect(victim),false);human.knockedUntil=0;victim.game.x=-1;victim.game.z=-12;victim.game.facing={x:1,z:0};victim.game.knockedUntil=0;victim.game.batAt=0;local.attack(victim,'self');assert.equal(human.carried,null);assert.ok(human.snapshot().world.some(e=>e.id===egg.id));human.carried=null;
 });
 await test('AI faces a nearby player before a real delayed bat swing and can greet another actor',async()=>{
  const {LocalSession}=await vite.ssrLoadModule('/src/local-session.ts');
  let clock=1800000060000;const g=new GameState(freshSave(clock),()=>clock,()=>.5);
  const client={connected:false,isHost:false,peers:[],update(){},send(){},onPacket(){}};
  const local=new LocalSession(()=>g,client,()=>false,new AIRandom(654).next),bot=local.ai.bots[1],engine=bot.entity.game;
  g.x=1;g.z=-12;g.knockedUntil=0;g.carried=null;g.training=false;
  engine.x=0;engine.z=-12;engine.carried=null;engine.training=false;engine.death=null;engine.returnReward=null;engine.knockedUntil=0;engine.batAt=0;engine.facing={x:-1,z:0};
  bot.action='CHASE_PLAYER';bot.targetId=local.human.entity.id;bot.nextDecisionAt=clock+10000;bot.idleUntil=0;bot.random.next=()=>.5;
  bot.update(.05);assert.equal(engine.batAt,0);
  for(let i=0;i<40&&!engine.batAt;i++){clock+=50;engine.x=0;engine.z=-12;bot.update(.05);}
  assert.ok(engine.batAt>0);assert.ok(g.knockedUntil>clock);assert.ok(engine.facing.x>0);
  engine.x=0;engine.z=-12;g.x=2;g.z=-12;g.knockedUntil=0;
  bot.action='SOCIALIZE';bot.targetId=local.human.entity.id;bot.nextDecisionAt=clock+10000;bot.emoteCooldown=0;bot.personality.sociability=1;bot.random.next=()=>.1;clock+=50;bot.update(.05);
  assert.equal(bot.entity.emote?.id,'hello');assert.ok(engine.facing.x>0);assert.equal(engine.velocity.x,0);
  bot.attackedBy(local.human.entity.id);assert.ok(bot.nextDecisionAt>clock);assert.ok(bot.nextDecisionAt<clock+2000);
 });
 await test('AI can skip a greeting once, answer a new greeting after a delay, and ignore combat distractions',async()=>{
  const {LocalSession}=await vite.ssrLoadModule('/src/local-session.ts');
  let clock=1800000060000;const g=new GameState(freshSave(clock),()=>clock,()=>.5);
  const client={connected:false,isHost:false,peers:[],update(){},send(){},onPacket(){}};
  const local=new LocalSession(()=>g,client,()=>false,new AIRandom(654).next),bot=local.ai.bots[1],engine=bot.entity.game;
  g.x=2;g.z=0;engine.x=0;engine.z=0;engine.carried=null;engine.training=false;engine.death=null;engine.returnReward=null;engine.knockedUntil=0;
  bot.action='REST';bot.nextDecisionAt=clock+100000;bot.emoteCooldown=0;bot.personality.sociability=1;bot.random.next=()=>.99;
  local.human.entity.emote={id:'hello',at:clock};for(let i=0;i<15;i++){clock+=50;bot.update(.05);}assert.equal(bot.entity.emote,null);
  bot.random.next=()=>.1;for(let i=0;i<10;i++){clock+=50;bot.update(.05);}assert.equal(bot.entity.emote,null);
  local.human.entity.emote={id:'hello',at:clock};for(let i=0;i<30;i++){clock+=50;bot.update(.05);}assert.equal(bot.entity.emote?.id,'hello');assert.ok(engine.facing.x>0);assert.equal(engine.velocity.x,0);
  bot.entity.emote=null;bot.emoteCooldown=0;bot.action='CHASE_PLAYER';bot.targetId=local.human.entity.id;local.human.entity.emote={id:'love',at:clock};clock+=500;bot.update(.05);assert.equal(bot.entity.emote,null);
 });
 await report('simulated-players',{passed:results.length,results,simulationSeconds:300});
}finally{await vite.close();}
