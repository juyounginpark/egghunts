import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {runRoom} from '../../supabase/functions/_shared/room-engine.js';
import {runtime} from '../balance-runtime.mjs';
const {m}=await runtime();
let now=1800000060000,room=null;
const members=[{user_id:'balance-test',slot:0,last_seen:new Date(now).toISOString()}];
const call=(commands=[],extra={})=>{
 now+=200;
 const result=runRoom(room,members,[],'balance-test',{id:randomUUID(),input:{x:0,z:0},commands:commands.map(([kind,value])=>({id:randomUUID(),kind,value})),...extra},now);
 room=JSON.parse(JSON.stringify(result.room));return result.response;
};
const saved=()=>room.players['balance-test'].runtime.save;
call();
saved().dust=1000000;
const price=m.growthCost('speed',0),before=saved().dust;
call([['upgrade','speed']]);assert.equal(saved().dust,before-price);assert.equal(saved().upgrades.speed,1);
const forged=saved().dust;call([],{save:{dust:1e30},x:999,z:-900});assert.equal(saved().dust,forged);
call([['coupon','FREEPET']]);assert.equal(saved().eggs[0].stageId,1);assert.equal(m.EGGS[saved().eggs[0].type].tier,2);
assert.ok(call([['coupon','FREEPET']]).errors.includes('COUPON_USED'));
for(let i=0;i<3;i++){call([['adStart']]);now+=10000;assert.deepEqual(call([['adClaim']]).errors,[]);}
const wallet=saved().dust;call([['adStart']]);now+=10000;assert.ok(call([['adClaim']]).errors.includes('AD_DAILY_LIMIT'));assert.equal(saved().dust,wallet);
// Migrate a trusted old profile without touching its asset ledger.
saved().balanceVersion=1;delete saved().trainingProgress;saved().trainingSpeed=12345;
saved().dust='123456789012345678901234567890';saved().mongles[100]=2;m.ensurePetLots(saved());
const lots=structuredClone(saved().petLots),claimed=structuredClone(saved().redeemedCoupons);
call();assert.equal(saved().balanceVersion,2);assert.equal(saved().legacyTrainingSpeed,12345);assert.equal(saved().trainingProgress,1);
assert.equal(saved().dust,'123456789012345678901234567890');assert.deepEqual(saved().petLots,lots);assert.deepEqual(saved().redeemedCoupons,claimed);
const checkpoint=structuredClone(saved());call();assert.equal(saved().dust,checkpoint.dust);assert.equal(saved().legacyTrainingSpeed,checkpoint.legacyTrainingSpeed);
const local=new m.GameState(structuredClone(saved()),()=>now,()=>.5,true);
assert.equal(local.cost('speed'),m.growthCost('speed',saved().upgrades.speed));
await writeFile('artifacts/balance-overhaul/server.json',JSON.stringify({passed:['shared purchase price','forged wallet rejected','starter coupon once','daily ad cap','v1 migration preserves exact wallet/lots/claims','idempotent reconnect']},null,2));
console.log('PASS authoritative balance purchases, coupons, ads and migration');
