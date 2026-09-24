// Manual server simulation profile. No production account/save is modified.
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave}=await vite.ssrLoadModule('/src/game.ts');
 const {BALANCE}=await vite.ssrLoadModule('/src/data.ts');
 const {ROUTE}=await vite.ssrLoadModule('/src/stage-data.ts');
 const {exportRuntime}=await vite.ssrLoadModule('/src/online-state.ts');
 const {runRoom}=await vite.ssrLoadModule('/server/room-engine.ts');
 const now=1800000060000,rows=[];
 for(const count of [1,5])for(const stage of [1,10,20])for(const speed of [2,20,40]){
  const members=Array.from({length:count},(_,i)=>({user_id:`profile-${i}`,slot:i,last_seen:new Date(now).toISOString()}));
  let result=runRoom(null,members,[],members[0].user_id,{id:'join',commands:[]},now),room=result.room;
  for(const p of Object.values(room.players)){
   const g=new GameState(freshSave(now),()=>now,()=>.5);
   g.save.trainingSpeed=speed-BALANCE.speed;g.z=-(stage-1)*ROUTE.length-12;g.deadline=now+45000;g.immunity=999;
   p.runtime=exportRuntime(g);p.input={x:0,z:-1};
  }
  const times=[];let bytes=0;
  for(let i=1;i<=60;i++){
   const at=now+i*100;
   const start=performance.now();result=runRoom(room,members,[],members[i%count].user_id,{id:`move-${i}`,input:{x:0,z:-1},commands:[]},at);
   times.push(performance.now()-start);room=result.room;bytes=Math.max(bytes,JSON.stringify(result.response).length);
  }
  times.sort((a,b)=>a-b);rows.push({count,stage,speed,p50:times[29],p95:times[56],max:times[59],maxBytes:bytes});
 }
 const label=process.argv[2]??'latest';if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid label');
 await mkdir('artifacts/performance',{recursive:true});await writeFile(`artifacts/performance/distance-latency-${label}.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
}finally{await vite.close();}
