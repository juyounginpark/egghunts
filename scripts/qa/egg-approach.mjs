// Manual high-speed interaction regression using the authoritative room engine.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave}=await vite.ssrLoadModule('/src/game.ts');
 const {BALANCE,EGGS}=await vite.ssrLoadModule('/src/data.ts');
 const {exportRuntime}=await vite.ssrLoadModule('/src/online-state.ts');
 const {runRoom}=await vite.ssrLoadModule('/server/room-engine.ts');
 const now=1800000060000,user='approach',members=[{user_id:user,slot:0,last_seen:new Date(now).toISOString()}];
 const rows=[];
 for(const speed of [2,20,1000000])for(const tier of [0,3,6]){
  const g=new GameState(freshSave(now),()=>now,()=>.5);g.roomManaged=true;g.save.trainingSpeed=speed-BALANCE.speed;g.save.bossWarningSeen=true;
  const egg={...g.world[2],type:EGGS.findIndex(e=>e.tier===tier),x:0,z:-30,homeX:0,homeZ:-30};
  assert.ok(egg.type>=0);g.world=[egg];g.x=0;g.z=-30+(speed===2?1.7:3.5);
  assert.equal(g.near?.id,egg.id,'button target exists while approaching at speed');
  let result=runRoom(null,members,[],user,{id:'join',commands:[]},now);
  result.room.world=[egg];result.room.players[user].runtime=exportRuntime(g);
  const seconds=BALANCE.rareEggPickupSeconds[tier];
  const command=(id,kind)=>({id, input:{x:0,z:0},commands:[{id,kind,value:egg.id}]});
  if(seconds){
   result=runRoom(result.room,members,[],user,command('prepare','prepare'),now+100);
   assert.deepEqual(result.response.errors,[]);
  }
  result=runRoom(result.room,members,[],user,command('pickup','pickup'),now+200+seconds*1000);
  assert.deepEqual(result.response.errors,[],'server uses the same approach radius');
  assert.equal(result.response.runtime.fields.carried?.id,egg.id);
  assert.equal(result.room.world.some(e=>e.id===egg.id),false,'egg removed once');
  g.z=0;assert.equal(g.canReachEgg(egg),false,'distant eggs remain unavailable');
  rows.push({speed,tier,picked:true});
 }
 const fresh=new GameState(freshSave(now),()=>now,()=>.5);
 assert.equal(Math.abs(fresh.world[1].x-fresh.world[0].x),BALANCE.eggNestSpacing);
 assert.ok(Math.abs(fresh.world[1].z-fresh.world[2].z-BALANCE.eggNestArcDepth/4)<1e-9);
 assert.ok(Math.abs(fresh.world[0].z-fresh.world[2].z-BALANCE.eggNestArcDepth)<1e-9);
 assert.equal(fresh.world[0].z,fresh.world[4].z);
 assert.equal(fresh.world[1].z,fresh.world[3].z);
 console.log(JSON.stringify({rows,eggScale:BALANCE.eggVisualScale,nestSpacing:BALANCE.eggNestSpacing}));
}finally{await vite.close();}
