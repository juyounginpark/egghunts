import type {Block,Motion} from './region-layout';
import {explorationWalls} from './exploration-walls';
import {explorationObjects} from './exploration-object-art';
import {biomeGround,dioramaDetails} from './biome-scenery';
import {environmentBackdrops,environmentGroundDetails} from './environment-art';
import {ENVIRONMENT_ART} from './environment-art-data';
import {STAGES} from './stage-data';
import {pathX,routeLength,EXPLORATION_MAPS,waterAt,waterRegions} from './exploration-route';
import {reliefCell} from './terrain-relief';
import {brushArt} from './brush';

/** Walkable surfaces and their solid edges share the same authored footprint. */
export function explorationLayout(stage:number,_sculpture:(stage:number,variant:number)=>Block[]){
 const blocks:Block[]=[],motions:Motion[]=[],s=STAGES[stage-1],length=routeLength(stage);
 const [soil,grass,patch]=ENVIRONMENT_ART[stage-1].floor;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,solid=false)=>blocks.push({x,y,z,w,h,d,c,solid});
 for(let depth=.5;depth<length;depth++){
  const z=-6-depth,center=pathX(stage,z);
  for(let x=-13;x<=13;x++){
   const cell=reliefCell(stage,x,z,center,length),water=waterAt(stage,x,z),bottom=-1.05;
   const color=cell.trail?soil:biomeGround(stage,x,z,Math.abs(x-center)>3&&Math.sin(x*.6+z*.19)+Math.cos(z*.3)>.7?patch:grass);
   const top=water?water.surface-water.depth:cell.top;
   const ground=(dx:number,w:number,h:number)=>b(x+dx,(h+bottom)/2,z,w,h-bottom,1,color);
   if(!water&&cell.groove){ground(-.29,.42,top);ground(.29,.42,top);ground(0,.16,top-cell.groove);}
   else ground(0,1,top);
   if(water){
    b(x,water.surface-.035,z,1,.07,1,stage===13?0x79b5ca:0x6caaa9);
    if((x+Math.floor(z))%3===0)b(x-.12,water.surface+.012,z,.38,.025,.06,0xb0d8cd);
   }else if(cell.crack>=0){
    const ink=ENVIRONMENT_ART[stage-1].floor[2];
    for(let j=-1;j<=1;j++)b(x+j*.15,top+.008,z+j*.22,.035,.016,.25,ink);
    b(x+.22,top+.01,z-.1,.3,.018,.035,ink);
   }
   if(!water&&waterRegions(stage).some(p=>Math.abs(x-p.x)/p.rx+Math.abs(z-p.z)/p.rz<1.95)){
    b(x,top+.009,z,.72,.018,.66,0x819d8d);
    if((x+Math.floor(z))%3===0)b(x+.2,top+.06,z-.2,.22,.1,.25,patch);
   }
  }
 }
 for(const [i,p] of waterRegions(stage).entries()){
  motions.push({x:p.x,y:p.surface+.025,z:p.z,kind:'drift',phase:i+stage,travel:{x:.22,y:0,z:.18},blocks:[{x:0,y:0,z:0,w:.55,h:.025,d:.06,c:0xc0dfd4,solid:false},{x:.55,y:0,z:.2,w:.22,h:.025,d:.06,c:0xa5d2c8,solid:false}]});
 }
 for(const object of explorationObjects(stage)){blocks.push(...object.blocks);motions.push(...object.motions);}
 const background=environmentBackdrops(stage);blocks.push(...background.blocks);motions.push(...background.motions);
 blocks.push(...environmentGroundDetails(stage));
 blocks.push(...brushArt(stage));
 if(stage===2)blocks.push(...dioramaDetails(stage));
 if(stage===20)b(0,.4,-6-length,27,.8,1,s.color,true);
 blocks.push(...explorationWalls(stage,length));
 return {blocks,motions,title:EXPLORATION_MAPS[stage-1][2]};
}
