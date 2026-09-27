import type {Block,Motion} from './region-layout';
import {explorationWalls} from './exploration-walls';
import {explorationObjects} from './exploration-object-art';
import {biomeGround,dioramaDetails} from './biome-scenery';
import {environmentBackdrops,environmentGroundDetails} from './environment-art';
import {ENVIRONMENT_ART} from './environment-art-data';
import {STAGES} from './stage-data';
import {pathX,routeLength,EXPLORATION_MAPS} from './exploration-route';
import {dioramaHeight} from './diorama-zones';

/** Walkable surfaces and their solid edges share the same authored footprint. */
export function explorationLayout(stage:number,_sculpture:(stage:number,variant:number)=>Block[]){
 const blocks:Block[]=[],motions:Motion[]=[],s=STAGES[stage-1],length=routeLength(stage);
 const [soil,grass,patch]=ENVIRONMENT_ART[stage-1].floor;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,solid=false)=>blocks.push({x,y,z,w,h,d,c,solid});
 for(let depth=.5;depth<length;depth++){
  const z=-6-depth,center=pathX(stage,z);
  for(let x=-13;x<=13;x++){
   const edge=2.1+.35*Math.sin(depth*.27+stage)+.2*Math.sin(x*2+depth*.7);
   const trail=Math.abs(x-center)<edge;
   const top=dioramaHeight(stage,x,z,center),bottom=-.45;
   b(x,(top+bottom)/2,z,1,top-bottom,1,trail?soil:biomeGround(stage,x,z,Math.abs(x-center)>3&&Math.sin(x*.6+z*.19)+Math.cos(z*.3)>.7?patch:grass));
  }
 }
 for(const object of explorationObjects(stage)){blocks.push(...object.blocks);motions.push(...object.motions);}
 const background=environmentBackdrops(stage);blocks.push(...background.blocks);motions.push(...background.motions);
 blocks.push(...environmentGroundDetails(stage));
 if(stage===2)blocks.push(...dioramaDetails(stage));
 if(stage===20)b(0,.4,-6-length,27,.8,1,s.color,true);
 blocks.push(...explorationWalls(stage,length));
 return {blocks,motions,title:EXPLORATION_MAPS[stage-1][2]};
}
