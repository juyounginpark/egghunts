// Manual checks; run when requested. No live accounts or rewards are modified.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const {GameState,freshSave,parseSave}=await vite.ssrLoadModule('/src/game.ts');
 const {EGGS,BALANCE,eggMaxHp}=await vite.ssrLoadModule('/src/data.ts');
 const {runRoom}=await vite.ssrLoadModule('/server/room-engine.ts');
 const {exportRuntime}=await vite.ssrLoadModule('/src/online-state.ts');
 const now=Date.UTC(2026,8,27,1);
 const make=(random=()=>.5)=>new GameState(freshSave(now),()=>now,random);
 for(const random of [()=>0,()=>.5,()=>.999999]){
  const g=make(random);assert.equal(g.redeemCoupon(' freepet '),null);
  const e=g.save.eggs[0];assert.equal(EGGS[e.type].rarity,'SS');assert.equal(e.hp,eggMaxHp(e));
  assert.ok(e.stageId>=1&&e.stageId<=20);assert.ok(e.variant>=0&&e.variant<5);
  assert.equal(g.redeemCoupon('FREEPET'),'COUPON_USED');assert.equal(g.save.eggs.length,1);
  const restored=new GameState(parseSave(JSON.stringify(g.snapshot()),now),()=>now);
  restored.save.eggs=[];assert.equal(restored.redeemCoupon('FREEPET'),'COUPON_USED');
 }
 const full=make();full.save.eggs=Array.from({length:BALANCE.inventory},(_,i)=>({id:`full-${i}`,type:0,hp:12,hpVersion:4,distance:0}));
 assert.equal(full.redeemCoupon('FREEPET'),'COUPON_INVENTORY_FULL');assert.equal(full.save.redeemedCoupons,undefined);
 full.save.eggs.pop();assert.equal(full.redeemCoupon('FREEPET'),null);assert.equal(full.save.eggs.length,BALANCE.inventory);
 const bad=make();for(const code of ['','NOPE','constructor','__proto__'])assert.equal(bad.redeemCoupon(code),'COUPON_INVALID');
 bad.z=-30;assert.equal(bad.redeemCoupon('FREEPET'),'RETURN_TO_BASE');assert.equal(bad.save.redeemedCoupons,undefined);
 const members=[{user_id:'coupon-test',slot:0,last_seen:new Date(now).toISOString()}];
 const request={id:'request-1',commands:[{id:'coupon-1',kind:'coupon',value:'FREEPET'}]};
 let r=runRoom(null,members,[{user_id:'coupon-test',state:exportRuntime(make())}],'coupon-test',request,now,{guest:true});
 assert.deepEqual(r.response.errors,[]);assert.equal(r.response.runtime.save.eggs.length,1);
 r=runRoom(r.room,members,[],'coupon-test',request,now,{guest:true});assert.equal(r.response.runtime.save.eggs.length,1);
 r=runRoom(r.room,members,[],'coupon-test',{id:'request-2',commands:[{id:'coupon-2',kind:'coupon',value:'freepet'}]},now+100,{guest:false});
 assert.ok(r.response.errors.includes('COUPON_USED'));assert.equal(r.response.runtime.save.eggs.length,1);
 const persisted=JSON.parse(JSON.stringify(r.response.runtime));
 r=runRoom(null,members,[{user_id:'coupon-test',state:persisted}],'coupon-test',{id:'request-3',commands:[{id:'coupon-3',kind:'coupon',value:'FREEPET'}]},now+200,{guest:false});
 assert.ok(r.response.errors.includes('COUPON_USED'));assert.equal(r.response.runtime.save.eggs.length,1);
 console.log('PASS SS reward, stage/variant bounds, duplicate/retry, full inventory, invalid code, base restriction, save reload and guest-to-permanent identity flag');
}finally{await vite.close();}
