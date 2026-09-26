// Manual checks. Run only when explicitly requested.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave,parseSave}=await vite.ssrLoadModule('/src/game.ts');
 const {migrateBalance}=await vite.ssrLoadModule('/src/balance-migration.ts');
 const {weeklyDay}=await vite.ssrLoadModule('/src/weekly.ts');
 let now=Date.UTC(2026,8,26,1);
 const old=freshSave(now);delete old.balanceVersion;old.dust='1e40';old.trainingSpeed=1e8;old.mongles[17]=2;
 migrateBalance(old,now);assert.equal(old.dust,500);assert.equal(old.trainingSpeed,8);assert.equal(old.mongles[17],2);assert.equal(old.balanceAdjustment.dust,'1e40');
 const once=structuredClone(old);migrateBalance(old,now);assert.deepEqual(old,once);
 const g=new GameState(freshSave(now),()=>now,()=>.5);
 for(let i=0;i<6;i++){assert.equal(g.claimWeekly(),true);assert.equal(g.claimWeekly(),false);now+=86400000;}
 g.save.eggs=Array.from({length:6},(_,i)=>({id:`full-${i}`,type:0,hp:12,hpVersion:4,distance:0}));
 assert.equal(g.claimWeekly(),false);assert.equal(g.save.weekly.claimed,6);
 g.save.eggs=[];assert.equal(g.claimWeekly(),true);assert.equal(g.save.mongles[320],1);
 const egg=g.save.eggs[0];assert.equal(egg.type,35);assert.equal(g.claimWeekly(),false);
 g.save.selected=egg.id;g.damage(32);assert.equal(g.claimHatch(egg.id),true);assert.equal(g.save.mongles[320],2);
 const restored=parseSave(JSON.stringify(g.snapshot()),now);assert.equal(restored.weekly.claimed,7);assert.equal(restored.mongles[320],2);
 now+=3*86400000;g.result=null;assert.equal(g.weeklyIndex,0);assert.equal(g.claimWeekly(),true);
 assert.equal(weeklyDay(Date.UTC(2026,8,26,15))-weeklyDay(Date.UTC(2026,8,26,14,59,59)),1);
 console.log('PASS one-time balance migration, seven rewards, duplicate claim, full inventory, guaranteed hatch and reload');
}finally{await vite.close();}
