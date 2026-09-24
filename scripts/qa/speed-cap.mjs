// Manual high-stat movement regression; no production balances are changed.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave}=await vite.ssrLoadModule('/src/game.ts');
 const {BALANCE}=await vite.ssrLoadModule('/src/data.ts');
 const {exportRuntime}=await vite.ssrLoadModule('/src/online-state.ts');
 const {runRoom}=await vite.ssrLoadModule('/server/room-engine.ts');
 const now=1800000060000,rows=[];
 for(const stat of [20,40,400,1000000]){
  const game=new GameState(freshSave(now),()=>now,()=>.5);
  game.save.trainingSpeed=stat-BALANCE.speed;
  assert.equal(game.speed,stat);assert.equal(game.movementSpeed,2);
  game.z=-10;game.deadline=now+45000;
  assert.equal(game.speed,stat);assert.equal(game.movementSpeed,Math.min(stat,40));
  const user='speed-diagnostic',members=[{user_id:user,slot:0,last_seen:new Date(now).toISOString()}];
  const request={id:'initial',input:{x:0,z:-1},commands:[]};
  let result=runRoom(null,members,[{user_id:user,state:exportRuntime(game)}],user,request,now);
  result.room.players[user].runtime=exportRuntime(game);
  const start=performance.now();
  result=runRoom(result.room,members,[],user,{...request,id:'move'},now+200);
  const elapsed=performance.now()-start,distance=Math.hypot(result.response.runtime.fields.x,result.response.runtime.fields.z+10);
  assert.ok(distance<=Math.min(stat,40)*.2+.001,'authoritative displacement respects cap');
  assert.equal(result.response.runtime.save.trainingSpeed,stat-BALANCE.speed,'growth is preserved');
  rows.push({stat,movement:Math.min(stat,40),distance,simulationMs:elapsed});
 }
 console.log(JSON.stringify(rows,null,2));
}finally{await vite.close();}
