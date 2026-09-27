import type {Block,Motion} from './region-layout';
import {explorationWalls} from './exploration-walls';
import {explorationObjects} from './exploration-object-art';
import {biomeScenery,biomeGround,dioramaDetails} from './biome-scenery';
import {STAGES} from './stage-data';
import {pathX,routeLength,EXPLORATION_MAPS} from './exploration-route';
import {dioramaHeight} from './diorama-zones';

/** Walkable surfaces and their solid edges share the same authored footprint. */
export function explorationLayout(stage:number,_sculpture:(stage:number,variant:number)=>Block[]){
 const blocks:Block[]=[],motions:Motion[]=[],s=STAGES[stage-1],length=routeLength(stage);
 const soil=[0xc7ad7a,0xd1a774,0xd5c9a1,0x64626a,0xa18a70,0x81939b,0xd8bf88,0xa08769,0x8a7a8d,0xe0ddcd,0x9ba8a6,0xae9377,0xe3ece9,0xdacbc9,0x92978b,0xb4a17e,0x989c9b,0xc6c7d1,0x9691a6,0xc2c69d][stage-1];
 const grass=[0x8ca776,0xb8b1a0,0x8ba9a4,0x53565c,0x7d8577,0x687b83,0xc9ad77,0x6f8d6a,0x7c8090,0xb1b7a0,0x819887,0x8e8975,0xc4d9d9,0xb9b1c4,0x788373,0x8ca06b,0x747e82,0x949baa,0x6c697e,0x91af86][stage-1];
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,solid=false)=>blocks.push({x,y,z,w,h,d,c,solid});
 for(let depth=.5;depth<length;depth++){
  const z=-6-depth,center=pathX(stage,z);
  for(let x=-13;x<=13;x++){
   const edge=2.1+.35*Math.sin(depth*.27+stage)+.2*Math.sin(x*2+depth*.7);
   const trail=Math.abs(x-center)<edge;
   const top=dioramaHeight(stage,x,z,center),bottom=-.45;
   b(x,(top+bottom)/2,z,1,top-bottom,1,trail?soil:biomeGround(stage,x,z,grass));
  }
 }
 for(const object of explorationObjects(stage)){blocks.push(...object.blocks);motions.push(...object.motions);}
 const scenery=biomeScenery(stage,blocks);blocks.push(...scenery.blocks);motions.push(...scenery.motions);
 blocks.push(...dioramaDetails(stage));
 if(stage===20)b(0,.4,-6-length,27,.8,1,s.color,true);
 blocks.push(...explorationWalls(stage,length));
 return {blocks,motions,title:EXPLORATION_MAPS[stage-1][2]};
}
