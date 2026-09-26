// Manual production layout audit. Creates one guest, reads a room, then leaves.
// No movement, egg pickup, rewards, or edits to existing player profiles.
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createServer} from 'vite';

const page='https://juyounginpark.github.io/egghunts/';
const auth='https://leblcdiqsyxqzwlsnkio.supabase.co';
const apikey='sb_publishable_2KTon_WzPAci5G4dLyZ5Ww_bPgwmiig';
const report={at:new Date().toISOString(),page,limits:'Guest snapshot and static layout audit; no browser rendering or device test. Guest profile remains after logout.'};
const get=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`GET ${r.status}`);return r.text();};
const html=await get(page),queue=[...html.matchAll(/(?:src|href)="([^"]+\.js)"/g)].map(m=>new URL(m[1],page).href),seen=new Set(),sources=[];
while(queue.length){
 const url=queue.shift();if(seen.has(url))continue;seen.add(url);
 const code=await get(url);sources.push(code);
 for(const m of code.matchAll(/["'](\.\.?\/[^"']+\.js)["']/g)){const next=new URL(m[1],url);if(next.origin===new URL(page).origin&&!seen.has(next.href))queue.push(next.href);}
}
const code=sources.join('\n');
report.client={assets:[...seen],route:code.match(/entrance:\s*6,length:\s*\d+,finalLength:\s*\d+/)?.[0]??null};
const endpoint=code.match(/https:\/\/egghunts\.[a-zA-Z0-9.-]+\/game/)?.[0];
if(!endpoint)throw Error('Cannot identify deployed game endpoint');
report.endpoint=endpoint;
let session,joined=false;
const post=async operation=>{
 const r=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({operation,id:randomUUID(),input:{x:0,z:0},commands:[]}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error(`Game ${operation}: ${r.status}`);return r.json();
};
try{
 const r=await fetch(`${auth}/auth/v1/signup`,{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error(`Guest auth: ${r.status}`);session=await r.json();
 const state=await post('join');joined=true;
 report.server={routeVersion:state.runtime.save.routeVersion,stageOrderVersion:state.runtime.save.stageOrderVersion,worldCount:state.world.length,bossCount:state.bosses.length,stages:Array.from({length:20},(_,i)=>({stage:i+1,eggs:state.world.filter(e=>e.stageId===i+1).map(e=>({z:e.z,homeZ:e.homeZ,special:!!e.special})),bosses:state.bosses.filter(b=>b.stageId===i+1).map(b=>({z:b.z,homeZ:b.homeZ,final:!!b.final,mode:b.mode}))}))};
}finally{
 if(joined){await post('leave');report.leftRoom=true;}
 if(session){const r=await fetch(`${auth}/auth/v1/logout`,{method:'POST',headers:{apikey,Authorization:`Bearer ${session.access_token}`},signal:AbortSignal.timeout(15000)});report.loggedOut=r.ok;}
}
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave}=await vite.ssrLoadModule('/src/game.ts');
 const {stagePatterns,environmentPlacement,ROUTE}=await vite.ssrLoadModule('/src/stage-data.ts');
 const {buildRegionLayout}=await vite.ssrLoadModule('/src/region-layout.ts');
 const now=Date.now(),game=new GameState(freshSave(now),()=>now,()=>.5);
 report.local={route:ROUTE,stages:game.route.map(r=>({stage:r.stage,start:r.start,end:r.end,eggs:game.world.filter(e=>e.stageId===r.stage).length,bosses:game.bosses.filter(b=>b.stageId===r.stage).length,obstacleBlocks:buildRegionLayout(r.stage,r.end-r.start).blocks.filter(b=>b.obstacle).length,hazards:stagePatterns(r.stage).map((h,i)=>({id:h.id,...environmentPlacement(r.stage,i,r.offset)}))}))};
}finally{await vite.close();}
await mkdir('artifacts/test-results',{recursive:true});
await writeFile('artifacts/test-results/stage-layout-live.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({client:report.client,server:{routeVersion:report.server.routeVersion,worldCount:report.server.worldCount,bossCount:report.server.bossCount,stage2:report.server.stages[1]},localStage2:report.local.stages[1],leftRoom:report.leftRoom,loggedOut:report.loggedOut},null,2));
