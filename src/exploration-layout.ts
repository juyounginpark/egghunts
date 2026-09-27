import type {Block,Motion} from './region-layout';
import {explorationWalls} from './exploration-walls';
import {explorationObjects,speedPadArt} from './exploration-object-art';
import {STAGES} from './stage-data';
import {terrainAt,routeLength,EXPLORATION_MAPS} from './exploration-route';

/** Walkable surfaces and their solid edges share the same authored footprint. */
export function explorationLayout(stage:number,_sculpture:(stage:number,variant:number)=>Block[]){
 const blocks:Block[]=[],motions:Motion[]=[],s=STAGES[stage-1],length=routeLength(stage);
 const soil=[0xc7ad7a,0xd1a774,0xd5c9a1,0x64626a,0xa18a70,0x81939b,0xd8bf88,0xa08769,0x8a7a8d,0xe0ddcd,0x9ba8a6,0xae9377,0xe3ece9,0xdacbc9,0x92978b,0xb4a17e,0x989c9b,0xc6c7d1,0x9691a6,0xc2c69d][stage-1];
 const landingColor=[0x7ebcad,0xc7a7c0,0x769f91,0x3e4144,0xa6b4aa,0x9ba5ac,0xc6aa77,0x759e96,0x979098,0xd7e3e8,0x9abd86,0xa48a6e,0xeff3ee,0xe6d6d5,0x726b58,0x8aab6b,0x707d86,0xb1a9c0,0x777188,0x8aba9a][stage-1];
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,solid=false)=>blocks.push({x,y,z,w,h,d,c,solid});
 for(let depth=.5;depth<length;depth++){
  const z=-6-depth;
  for(let x=-13;x<=13;x++){
   const surface=terrainAt(stage,x,z);
   if(surface.walk){
    const color=surface.ice?0xaacfdc:surface.bridge?(stage===17?0x6b7980:s.accent):surface.landing&&!surface.bypass?landingColor:soil;
    b(x,surface.height/2-.14,z,1,surface.height+.28,1,color);
    if(surface.bridge&&stage===17&&Math.floor(depth)%2===0){b(x,surface.height+.025,z,.45,.05,.15,0xf0ce77);}
   }else{
    // Low cutaway walls visibly delimit the route without hiding faces or warnings.
    b(x,.28,z,1,.56,1,s.color,true);
    if(Math.abs(x)>11&&Math.floor(depth)%4===0)b(x,.8,z,1.05,1,1.05,s.color,true);
   }
  }
 }
 for(const object of explorationObjects(stage)){blocks.push(...object.blocks);motions.push(...object.motions);}
 const pads=speedPadArt(stage);blocks.push(...pads.blocks);motions.push(...pads.motions);
 if(stage===20)b(0,.4,-6-length,27,.8,1,s.color,true);
 blocks.push(...explorationWalls(stage,length));
 return {blocks,motions,title:EXPLORATION_MAPS[stage-1][2]};
}
