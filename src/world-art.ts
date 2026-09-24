import type {Block} from './region-layout';
import {STAGES,ROAD_WIDTH_SCALE} from './stage-data';

const cream=0xf3e7c4,stone=0xb7b59b,wood=0x80644c,gold=0xd4ad62,dark=0x384b44;
function builder(){
 const blocks:Block[]=[];
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>blocks.push({x,y,z,w,h,d,c});
 const roof=(x:number,y:number,z:number,w:number,d:number,c:number)=>{for(let i=0;i<5;i++)b(x,y+i*.22,z,w-(w-.25)*i/4,.24,d,c);b(x,y+1.05,z,.25,.16,d+.3,gold);};
 const tree=(x:number,z:number,size=1,c=0x81965e)=>{b(x,size,z,.45,size*2,.45,wood);b(x,size*2.1,z,size*2.3,size*1.1,size*2,c);b(x-.25,size*2.7,z,size*1.6,size*.65,size*1.4,c);};
 const arch=(x:number,z:number,w:number,h:number,c:number)=>{for(const side of [-1,1]){b(x+side*w/2,h/2,z,.6,h,.8,c);b(x+side*w/2,.18,z,.95,.36,1.1,stone);}b(x,h,z,w+.9,.5,1.2,c);b(x,h+.4,z,w*.65,.3,1,cream);};
 const ring=(x:number,y:number,z:number,r:number,c:number,vertical=true)=>{for(let i=0;i<16;i++){const a=i*Math.PI/8;b(x+Math.cos(a)*r,vertical?y+Math.sin(a)*r:y,vertical?z:z+Math.sin(a)*r,.42,.42,.42,c);}};
 return {blocks,b,roof,tree,arch,ring};
}

export {circularVillageArt as villageArt} from './village-art';

/** Stage ecology becomes architecture: large readable landmarks plus tailored paths. */
export function stageLandmarks(stage:number,length:number){
 const {blocks,b,roof,tree,arch,ring}=builder(),s=STAGES[stage-1];
 const x=(stage%2?8.6:-8.6)*ROAD_WIDTH_SCALE,z=-Math.min(38,length*.34),c=s.color,a=s.accent;
 const tower=(xx:number,zz:number,h:number,w=2)=>{b(xx,h/2,zz,w,h,w,c);b(xx,h+.15,zz,w+.4,.3,w+.4,a);};
 switch(stage){
  case 1: // A seed mill with broad sails and terraced orchard roots.
   tower(x,z,4,2.7);roof(x,4.3,z,3.5,3.5,0x6d895a);b(x,3.6,z+1.6,5.5,.28,.25,cream);b(x,3.6,z+1.6,.28,5.5,.25,cream);for(const dx of [-1.5,1.5])tree(x+dx,z+4,1.5);break;
  case 2: // A toy station with block turrets and a locomotive frontage.
   for(const dx of [-2,2]){tower(x+dx,z,4.5,1.3);for(const dz of [-.6,.6])b(x+dx,5,z+dz,1.6,.7,.4,a);}b(x,2,z,3.5,4,3,c);roof(x,4,z,4,3.8,a);for(const dz of [3,4.5,6]){b(x,1,z+dz,2.4,1.4,1.3,a);for(const side of [-1,1])b(x+side*1.3,.4,z+dz,.3,.7,.7,dark);}break;
  case 3: // Fan corals surround a sheltered pearl pavilion.
   arch(x,z,4,3,cream);for(const side of [-1,1])for(let j=0;j<5;j++)b(x+side*(1+j*.38),2+j*.65,z,.55,3-j*.3,1,a);b(x,1,z,1.3,1.3,1.3,cream);ring(x,1,z+1,1.4,a);break;
  case 4: // Broad stepped crater and branching lava gutters.
   for(let j=0;j<6;j++)b(x,j*.65+.3,z,5.6-j*.65,.7,5.6-j*.65,dark);ring(x,4,z,1.1,a,false);for(let j=0;j<8;j++)b(x+Math.sin(j)*.5,.06,z+2+j,.45,.08,1.1,a);break;
  case 5: // Ribbed deep-sea ruin with a suspended lure.
   for(let j=0;j<4;j++)arch(x,z+j*1.3,3.8-j*.3,4+j*.35,c);b(x,5.2,z+1,.25,1.7,.25,a);b(x,4.2,z+1,.8,.8,.8,cream);for(const side of [-1,1])for(let j=0;j<4;j++)b(x+side*(2+j*.3),.6,z+j,1,.8,.8,c);break;
  case 6: // Library bell tower, book spines and an open folio roof.
   tower(x,z,5,2.7);roof(x,5.3,z,3.6,4,dark);for(let j=0;j<5;j++){b(x-1+j*.5,2,z+1.45,.35,2.5,.3,j%2?a:cream);b(x-1+j*.5,1.3,z+1.65,.3,.1,.1,gold);}arch(x,z-3,2.5,3.5,wood);break;
  case 7: // Circuit cathedral: thin antenna spires and luminous bus lines.
   for(const dx of [-2,0,2]){tower(x+dx,z,dx?5:7,dx?1.2:1.8);for(let j=1;j<6;j++)b(x+dx,j,z+1,.8,.12,.12,a);}ring(x,6,z,2.3,a);break;
  case 8: // Sun tomb with a visible entrance and stepped sand shoulders.
   for(let j=0;j<9;j++)b(x,.3+j*.55,z,6-j*.55,.56,6-j*.55,c);b(x,1,z+2.8,1.1,2,.2,dark);ring(x,5.8,z,1.25,gold);break;
  case 9: // Giant fern canopy held above a rib-cage fossil.
   tree(x,z,2.5,0x6e8c58);for(let j=0;j<5;j++)arch(x,z+1+j,3.7,2.5,cream);for(const side of [-1,1])b(x+side*1.9,.4,z+5,1.6,.8,2.5,wood);break;
  case 10: // Moon gate and three layers of curved tiled eaves.
   arch(x,z,3,4,wood);for(let j=0;j<3;j++){roof(x,3+j,z,5-j*.8,3-j*.35,dark);for(const side of [-1,1])b(x+side*(2.4-j*.4),3.5+j,z,.45,.5,3-j*.35,a);}ring(x,6.2,z,1.1,gold);break;
  case 11: // Open marble temple; split roof lets lightning pass through.
   for(const dx of [-2,2])for(const dz of [-1.5,1.5]){tower(x+dx,z+dz,4.5,.65);b(x+dx,2.2,z+dz,.45,4.4,.45,cream);}roof(x,4.8,z,5.5,4.5,cream);for(let j=0;j<5;j++)b(x+(j%2?.3:0),5.9+j*.4,z,.45,.5,.4,gold);break;
  case 12: // Landing saucer with long stilts and a recessed reactor.
   for(const dx of [-2,2])for(const dz of [-2,2])b(x+dx,1.7,z+dz,.35,3.4,.35,dark);for(let j=0;j<3;j++)b(x,3+j*.4,z,6-j*1.5,.5,6-j*1.5,c);ring(x,3,z,3,a,false);b(x,1.8,z,1,2.2,1,a);break;
  case 13: // Suspended cargo airship and twin steam stacks.
   for(let j=0;j<5;j++)b(x,4+Math.sin(j*Math.PI/4)*.6,z-3+j*1.5,3.8,.9,1.6,j%2?cream:c);b(x,2.4,z,2,1.2,3,wood);for(const side of [-1,1]){tower(x+side*2.3,z+3,4,.65);ring(x+side*2.4,3.6,z,1,gold);}break;
  case 14: // Folded glacier nave, translucent-looking pale facets.
   for(const dx of [-2,-1,0,1,2])for(let j=0;j<5-Math.abs(dx);j++)b(x+dx,1+j*1.1,z,1.1,1.2,2.8-j*.35,(j+dx)%2?cream:a);b(x,1,z+1.4,1.2,2,.18,c);break;
  case 15: // Pillow observatory with floating stair-shaped cloud shelves.
   for(let j=0;j<4;j++)b(x,1+j*.65,z,5-j*.65,.8,4-j*.5,cream);roof(x,3.8,z,3.4,3.4,a);ring(x,5.4,z,1.1,gold);for(let j=0;j<5;j++)b(x+(j%2?2:-2),1+j*.65,z+3+j,1.5,.3,1.3,cream);break;
  case 16: // Containment greenhouse: filter towers overtaken by living roots.
   for(const dx of [-2,2])tower(x+dx,z,5,.9);b(x,2,z,2.8,3.5,2.6,c);for(let j=0;j<5;j++){b(x,1+j*.55,z+1.4,2.7,.15,.15,a);b(x+Math.sin(j)*1.8,.15,z+j,1.2,.3,1.3,0x77935b);}break;
  case 17: // Giant hive nursery with layered comb balconies and leaf canopy.
   for(let j=0;j<7;j++)b(x,.6+j*.7,z,4.8-Math.abs(j-3)*.5,.62,3.8,gold);for(const dx of [-1,1])for(const y of [1.3,2.8,4.3])b(x+dx,y,z+2,.65,.65,.15,dark);b(x,5.6,z,6,.35,4.8,a);break;
  case 18: // Magnet gantry and a compacted salvage stack.
   arch(x,z,4.5,5.3,dark);for(const dx of [-2,2])for(let j=0;j<4;j++)b(x+dx,j+1,z,.8,.18,1.2,gold);ring(x,4,z,1.1,a);for(let j=0;j<4;j++)b(x+(j%2?1:-1),.5+j*.45,z+2,1.8,.8,1.6,j%2?c:wood);break;
  case 19: // Armillary observatory with an orbiting-looking stone causeway.
   tower(x,z,2.2,3.5);ring(x,4.5,z,2.5,gold);ring(x,4.5,z,2.5,a,false);b(x,4.5,z,1.7,1.7,1.7,c);for(let j=0;j<6;j++)b(x+Math.sin(j*.8)*2,.2,z+3+j,1.5,.4,1.1,cream);break;
  case 20: // A broken creation gate: three nested frames, a seed of light.
   for(let j=0;j<3;j++)arch(x,z-j,4.8-j*.8,6-j*.7,j%2?gold:cream);ring(x,3.5,z,1.8,a);b(x,3.5,z,.6,1,.6,gold);for(const side of [-1,1])b(x+side*2,.4,z+3,1.4,.8,2,c);break;
 }
 // Opposite-bank scenery varies in scale so the focal landmark keeps its identity.
 for(const depth of [.13,.58,.86]){
  const zz=-6-length*depth;
  if([1,9,17].includes(stage))tree(-Math.sign(x)*8.5,zz,1.6,c);
  else{b(-Math.sign(x)*8.5,1.1,zz,2.2,2.2,2.8,c);b(-Math.sign(x)*8.5,2.35,zz,2.8,.3,3.2,a);}
 }
 // The playable center stays uncluttered; paths use shape and material, not labels.
 for(let zz=-8;zz>-length-4;zz-=3){
  if([3,5,14].includes(stage))for(const side of [-1,1])b(side*3.7*ROAD_WIDTH_SCALE,.006,zz,1,.03,2.5,a);
  else if([2,7,12,13,18].includes(stage))for(const side of [-1,1]){b(side*3.6*ROAD_WIDTH_SCALE,.02,zz,.12,.04,2.8,gold);b(side*3.6*ROAD_WIDTH_SCALE,.04,zz,1,.05,.2,dark);}
  else for(const side of [-1,1])b(side*3.7*ROAD_WIDTH_SCALE,.015,zz,.55,.05,1.1,stage===4?dark:cream);
 }
 return blocks;
}
