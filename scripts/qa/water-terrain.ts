// Manual-only scenario; execute only when QA is requested.
import assert from 'node:assert/strict';
import {GameState,freshSave} from '../../src/game';
import {waterRegions,terrainAt,pathX,routeLength} from '../../src/exploration-route';
import {explorationLayout} from '../../src/exploration-layout';
const now=1800000060000;
for(let stage=1;stage<=20;stage++){
 const art=explorationLayout(stage,()=>[]);
 for(const p of waterRegions(stage)){
  const wet=terrainAt(stage,p.x,p.z);
  assert.equal(wet.slow,.5);assert.ok(wet.water);assert.ok(p.surface-wet.height>=.48);
  assert.ok(art.blocks.some(b=>b.x===p.x&&b.z===p.z&&Math.abs(b.y+b.h/2-p.surface)<1e-6),'water render matches surface');
  const side=Math.sign(p.x-pathX(stage,p.z));
  assert.equal(terrainAt(stage,pathX(stage,p.z)-side*1.5,p.z).slow,1,'dry bypass');
  const game=new GameState(freshSave(now),()=>now,()=>.5);
  game.x=p.x;game.z=p.z-(stage-1)*48;
  const stat=game.speed,speed=game.movementSpeed,z=game.z;
  game.move(0,-1,.01);
  assert.ok(Math.abs(z-game.z-speed*.5*.01)<1e-6,'movement halves');assert.equal(game.speed,stat,'growth stat unchanged');
  game.x=pathX(stage,p.z)-side*1.5;game.z=p.z-(stage-1)*48;
  const drySpeed=game.movementSpeed,dryZ=game.z;game.move(0,-1,.01);
  assert.ok(Math.abs(dryZ-game.z-drySpeed*.01)<1e-6,'speed restores on exit');
 }
 const z=-6-routeLength(stage)*.14,x=pathX(stage,z);
 assert.ok(terrainAt(stage,x,z).height<terrainAt(stage,x+2.7,z).height,'road below shoulder');
}
console.log('PASS recessed routes, water geometry, dry bypasses, immersion, speed reduction and restoration');
