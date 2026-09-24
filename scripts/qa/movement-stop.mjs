// Manual regression for authoritative stop compensation and retired player traits.
/* global structuredClone */
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}});
try{
 const {runRoom}=await server.ssrLoadModule('/server/room-engine.ts');
 const {GuardianMotion}=await server.ssrLoadModule('/src/guardian-motion.ts');
 for(const jitter of [false,true]){
  const track=new GuardianMotion(),packets=Array.from({length:40},(_,i)=>({at:i*.3,arrival:i*.3+.15+(jitter?[0,.1,.25,.05][i%4]:0)}));
  let previous=null;const speeds=[];
  for(let t=0;t<11;t+=1/60){
   while(packets.length&&packets[0].arrival<=t){const p=packets.shift();track.sample(0,p.at*1.5,p.at,p.arrival);}
   if(t<.15)continue;const p=track.position(1/60,t);
   if(previous&&t>2)speeds.push(Math.abs(p.z-previous.z)*60);previous=p;
  }
  assert.ok(Math.min(...speeds)>1.2,`buffered chase does not stop between ${jitter?'jittered':'regular'} packets`);
  assert.ok(Math.max(...speeds)<1.8,'no packet catch-up jump');
 }
 const {GameState,freshSave,parseSave}=await server.ssrLoadModule('/src/game.ts');
 const {exportRuntime,restoreRuntime}=await server.ssrLoadModule('/src/online-state.ts');
 const start=1800000060000,members=[{user_id:'a',slot:0,last_seen:new Date(start).toISOString()}],profiles=[{user_id:'a',state:null}];
 const request=(id,input,inputAt)=>({id,input,inputAt,commands:[]});
 let result=runRoom(null,members,profiles,'a',request('join',{x:0,z:0}),start);
 result=runRoom(result.room,members,profiles,'a',request('walk',{x:0,z:-1}),start+100);
 result=runRoom(result.room,members,profiles,'a',request('walk-2',{x:0,z:-1}),start+400);
 const stopped=runRoom(structuredClone(result.room),members,profiles,'a',request('stop',{x:0,z:0},start+300),start+600);
 assert.ok(Math.abs(stopped.response.runtime.fields.z+.32)<1e-6,'stop rewinds only server-observed movement to release time');
 const settled=runRoom(stopped.room,members,profiles,'a',request('idle',{x:0,z:0}),start+900);
 assert.equal(settled.response.runtime.fields.z,stopped.response.runtime.fields.z);
 const duplicate=runRoom(settled.room,members,profiles,'a',request('stop',{x:0,z:0},start+300),start+1100);
 assert.equal(duplicate.response.runtime.fields.z,settled.response.runtime.fields.z);
 const hitRoom=structuredClone(result.room);hitRoom.players.a.runtime.fields.hitAt=start+450;
 const hit=runRoom(hitRoom,members,profiles,'a',request('hit-stop',{x:0,z:0},start+300),start+600);
 assert.ok(hit.response.runtime.fields.z<-.4,'a hit invalidates historical rewind');
 const fresh=freshSave(start),base=new GameState(fresh,()=>start,()=>.1),legacy=base.snapshot();
 legacy.progression.traits={sturdy:5,light:5,porter:5,escape:1,shield:1,clock:5};
 legacy.mongles[0]=3;legacy.active=[0];legacy.dust=1234;
 const restored=new GameState(parseSave(JSON.stringify(legacy),start),()=>start,()=>.1);
 assert.equal(restored.save.progression.traits,undefined);assert.equal(restored.level,base.level);
 assert.equal(restored.save.mongles[0],3);assert.equal(restored.save.dust,1234);
 const runtime=exportRuntime(restored);runtime.save.progression.traits={sturdy:5};runtime.fields.hp=999;
 restoreRuntime(restored,runtime,restored.world,restored.bosses);
 assert.equal(restored.save.progression.traits,undefined);assert.equal(restored.hp,restored.maxHp);
 const rejected=runRoom(duplicate.room,members,profiles,'a',{id:'retired',commands:[{id:'retired-perk',kind:'trait',value:'sturdy'}]},start+1200);
 assert.deepEqual(rejected.response.errors,['UNKNOWN_ACTION']);
 const {playerName}=await server.ssrLoadModule('/src/player-identity.ts');
 assert.equal(playerName('알콩친구'),'알콩친구');assert.equal(playerName('A'),'A');assert.equal(playerName('a'.repeat(10)),'a'.repeat(10));
 for(const bad of ['',"' OR 1=1;--",'<script>','[GUEST] fake','a'.repeat(11),'x\u200by','알 콩','player1',' abc','abc_','中文','é','\u3164','\u115f'])assert.throws(()=>playerName(bad));
 const named=runRoom(rejected.room,members,profiles,'a',{id:'named',commands:[{id:'name-command',kind:'name',value:'알콩친구'}]},start+1400,{guest:true});
 assert.equal(named.response.runtime.save.playerName,'알콩친구');assert.equal(named.response.isGuest,true);
 const peer=runRoom(structuredClone(named.room),[...members,{user_id:'b',slot:1,last_seen:new Date(start).toISOString()}],[...profiles,{user_id:'b',state:null}],'b',{id:'peer-join',commands:[]},start+1500,{guest:false});
 assert.equal(peer.response.peers[0].name,'알콩친구');assert.equal(peer.response.peers[0].level,1);assert.equal(peer.response.peers[0].isGuest,true);
 const invalidName=runRoom(structuredClone(named.room),members,profiles,'a',{id:'invalid-name',commands:[{id:'injection',kind:'name',value:"'; DROP TABLE profiles;--"}]},start+1500,{guest:true});
 assert.deepEqual(invalidName.response.errors,['INVALID_NAME']);assert.equal(invalidName.response.runtime.save.playerName,'알콩친구');
 const forged=runRoom(named.room,members,profiles,'a',{id:'forged-guest',guest:true,commands:[]},start+1600,{guest:false});
 assert.equal(forged.response.isGuest,false);
 const {farmGym}=await server.ssrLoadModule('/src/village.ts');
 const walker=new GameState(freshSave(start),()=>start,()=>.1);
 for(let i=0;i<170;i++)walker.move(0,-1,1/30);
 assert.ok(walker.z<-8,'gate remains open to the adventure path');
 for(let slot=0;slot<5;slot++){const gym=farmGym(slot);walker.farmSlot=slot;walker.x=gym.x;walker.z=gym.z;assert.ok(walker.nearGym);}
 console.log('PASS: names, server-authenticated guest badge, open gateway and all five farm gyms');
 console.log('PASS: timestamped stop, settled idle, replay, hit protection, legacy trait migration, retired server command');
}finally{await server.close();}
