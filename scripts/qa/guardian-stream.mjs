import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('artifacts/test-results',{recursive:true});
await build({entryPoints:['src/guardian-motion.ts'],outfile:'artifacts/test-results/guardian-motion.mjs',bundle:true,platform:'node',format:'esm'});
const {GuardianMotion}=await import('../../artifacts/test-results/guardian-motion.mjs?'+Date.now());
const motion=new GuardianMotion();let next=0,last=0,maxStep=0,stops=0;
for(let frame=0;frame<600;frame++){
 const now=frame/60;
 if(now>=next){motion.sample(now*8,0,now,now);next=now+(now>3&&now<3.2?.95:.2);}
 const p=motion.position(1/60,now);
 if(now>1){const step=p.x-last;maxStep=Math.max(maxStep,step);if(step<.0001)stops++;assert.ok(step>=-.0001,'no reverse correction');}
 last=p.x;
}
console.log(JSON.stringify({maxFrameDistance:maxStep,stalledFrames:stops,normalFrameDistance:8/60}));
assert.ok(maxStep<8/60*1.5,'packet recovery must not jump');
await build({entryPoints:['src/game.ts','src/brush.ts'],outdir:'artifacts/test-results/guardian-state',bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'},define:{'import.meta.env.BASE_URL':'"/"'}});
const {GameState,freshSave}=await import('../../artifacts/test-results/guardian-state/game.mjs?'+Date.now());
const {brushRegions}=await import('../../artifacts/test-results/guardian-state/brush.mjs?'+Date.now());
const now=1800000060000,g=new GameState(freshSave(now),()=>now,()=>.5),boss=g.bosses[0],egg=g.world.find(e=>e.guardian===0);
g.carried=egg;g.world=g.world.filter(e=>e!==egg);const bush=brushRegions(1)[2];g.x=bush.x;g.z=bush.z;
boss.mode='chase';boss.target=egg.id;boss.x=g.x;boss.z=g.z+3;
g.tickBosses(1/60,0);assert.equal(boss.mode,'idle');assert.equal(boss.x,boss.homeX);assert.equal(boss.z,boss.homeZ);assert.equal(g.carried.id,egg.id);
g.x=0;g.tickBosses(1/60,0);assert.equal(boss.mode,'chase','reacquire visible egg carrier');
g.carried=null;g.tickBosses(1/60,0);assert.equal(boss.mode,'idle');assert.equal(boss.x,boss.homeX);assert.equal(boss.z,boss.homeZ);
console.log('PASS boss concealment, visible reacquisition and instant return');
