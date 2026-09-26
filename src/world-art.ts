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
 const beam=(x:number,y:number,xx:number,yy:number,z:number,width:number,c:number,depth=width)=>blocks.push({x:(x+xx)/2,y:(y+yy)/2,z,w:width,h:Math.hypot(xx-x,yy-y)+width*.2,d:depth,c,roll:-Math.atan2(xx-x,yy-y)});
 const arc=(x:number,y:number,z:number,r:number,start:number,end:number,c:number,width=.32)=>{
  const count=Math.ceil(Math.abs(end-start)*8);
  for(let i=0;i<count;i++){const t=start+(end-start)*i/count,u=start+(end-start)*(i+1)/count;beam(x+Math.cos(t)*r,y+Math.sin(t)*r,x+Math.cos(u)*r,y+Math.sin(u)*r,z,width,c);}
 };
 return {blocks,b,roof,tree,arch,ring,beam,arc};
}

export {circularVillageArt as villageArt} from './village-art';

/** Stage ecology becomes architecture: large readable landmarks plus tailored paths. */
export function stageLandmarks(stage:number,length:number){
 const {blocks,b,roof,tree,arch,ring,beam,arc}=builder(),s=STAGES[stage-1];
 const x=(stage%2?8.6:-8.6)*ROAD_WIDTH_SCALE,z=-Math.min(38,length*.34),c=s.color,a=s.accent;
 const tower=(xx:number,zz:number,h:number,w=2)=>{b(xx,h/2,zz,w,h,w,c);b(xx,h+.15,zz,w+.4,.3,w+.4,a);};
 switch(stage){
  case 1: // A seed mill with broad sails and terraced orchard roots.
   tower(x,z,4,2.7);roof(x,4.3,z,3.5,3.5,0x6d895a);b(x,3.6,z+1.6,5.5,.28,.25,cream);b(x,3.6,z+1.6,.28,5.5,.25,cream);for(const dx of [-1.5,1.5])tree(x+dx,z+4,1.5);break;
  case 2: // A toy station with block turrets and a locomotive frontage.
   for(const dx of [-2,2]){tower(x+dx,z,4.5,1.3);for(const dz of [-.6,.6])b(x+dx,5,z+dz,1.6,.7,.4,a);}b(x,2,z,3.5,4,3,c);roof(x,4,z,4,3.8,a);for(const dz of [3,4.5,6]){b(x,1,z+dz,2.4,1.4,1.3,a);for(const side of [-1,1])b(x+side*1.3,.4,z+dz,.3,.7,.7,dark);}break;
  case 3: // Fan corals surround a sheltered pearl pavilion.
   b(x,1,z,1.3,1.3,1.3,cream);ring(x,.2,z,2.8,a,false);break;
  case 4: // Broad stepped crater and branching lava gutters.
   for(let j=0;j<6;j++)b(x,j*.65+.3,z,5.6-j*.65,.7,5.6-j*.65,dark);ring(x,4,z,1.1,a,false);for(let j=0;j<8;j++)b(x+Math.sin(j)*.5,.06,z+2+j,.45,.08,1.1,a);break;
  case 5: // Ribbed deep-sea ruin with a suspended lure.
   b(x,3.8,z+1,.18,1.4,.18,a);b(x,3.1,z+1,.6,.6,.6,cream);break;
  case 6: // Library bell tower, book spines and an open folio roof.
   tower(x,z,5,2.7);for(let j=0;j<5;j++)b(x-1+j*.5,2,z+1.45,.35,2.5,.3,j%2?a:cream);break;
  case 7: // Circuit cathedral: thin antenna spires and luminous bus lines.
   for(const dx of [-2,0,2]){tower(x+dx,z,dx?5:7,dx?1.2:1.8);for(let j=1;j<6;j++)b(x+dx,j,z+1,.8,.12,.12,a);}ring(x,6,z,2.3,a);break;
  case 8: // Sun tomb with a visible entrance and stepped sand shoulders.
   for(let j=0;j<9;j++)b(x,.3+j*.55,z,6-j*.55,.56,6-j*.55,c);b(x,1,z+2.8,1.1,2,.2,dark);ring(x,5.8,z,1.25,gold);break;
  case 9: // Giant fern canopy held above a rib-cage fossil.
   tree(x,z,2.5,0x6e8c58);break;
  case 10: // Moon gate and three layers of curved tiled eaves.
   arch(x,z,3,4,wood);for(let j=0;j<3;j++){roof(x,3+j,z,5-j*.8,3-j*.35,dark);for(const side of [-1,1])b(x+side*(2.4-j*.4),3.5+j,z,.45,.5,3-j*.35,a);}ring(x,6.2,z,1.1,gold);break;
  case 11: // Open marble temple; split roof lets lightning pass through.
   for(const dx of [-2,2])for(const dz of [-1.5,1.5])b(x+dx,2.2,z+dz,.6,4.4,.6,cream);break;
  case 12: // Landing saucer with long stilts and a recessed reactor.
   for(const dx of [-2,2])for(const dz of [-2,2])b(x+dx,1.7,z+dz,.35,3.4,.35,dark);for(let j=0;j<3;j++)b(x,3+j*.4,z,6-j*1.5,.5,6-j*1.5,c);ring(x,3,z,3,a,false);b(x,1.8,z,1,2.2,1,a);break;
  case 13: // Suspended cargo airship and twin steam stacks.
   for(let j=0;j<5;j++)b(x,4+Math.sin(j*Math.PI/4)*.6,z-3+j*1.5,3.8,.9,1.6,j%2?cream:c);b(x,2.4,z,2,1.2,3,wood);for(const side of [-1,1]){tower(x+side*2.3,z+3,4,.65);ring(x+side*2.4,3.6,z,1,gold);}break;
  case 14: // Folded glacier nave, translucent-looking pale facets.
   b(x,.2,z,5,.4,4,c);break;
  case 15: // Pillow observatory with floating stair-shaped cloud shelves.
   for(let j=0;j<4;j++)b(x,1+j*.65,z,5-j*.65,.8,4-j*.5,cream);roof(x,3.8,z,3.4,3.4,a);ring(x,5.4,z,1.1,gold);for(let j=0;j<5;j++)b(x+(j%2?2:-2),1+j*.65,z+3+j,1.5,.3,1.3,cream);break;
  case 16: // Containment greenhouse: filter towers overtaken by living roots.
   for(const dx of [-2,2])tower(x+dx,z,3,.9);b(x,.3,z,2.8,.6,2.6,c);break;
  case 17: // Giant hive nursery with layered comb balconies and leaf canopy.
   for(let j=0;j<7;j++)b(x,.6+j*.7,z,4.8-Math.abs(j-3)*.5,.62,3.8,gold);for(const dx of [-1,1])for(const y of [1.3,2.8,4.3])b(x+dx,y,z+2,.65,.65,.15,dark);b(x,5.6,z,6,.35,4.8,a);break;
  case 18: // Magnet gantry and a compacted salvage stack.
   arch(x,z,4.5,5.3,dark);for(let j=0;j<4;j++)b(x+(j%2?1:-1),.5+j*.45,z+2,1.8,.8,1.6,j%2?c:wood);break;
  case 19: // Armillary observatory with an orbiting-looking stone causeway.
   tower(x,z,2.2,3.5);b(x,4.5,z,1.7,1.7,1.7,c);break;
  case 20: // A broken creation gate: three nested frames, a seed of light.
   b(x,3.5,z,.6,1,.6,gold);for(const side of [-1,1])b(x+side*2,.4,z+3,1.4,.8,2,c);break;
 }
 // Large authored gestures break the old stack-of-boxes silhouettes. These stay
 // on the banks; the server's playable surface, covers and route are unchanged.
 switch(stage){
  case 1: // Branching root buttresses and seed sails.
   for(const side of [-1,1]){beam(x,2,x+side*2.7,.3,z,.55,wood);beam(x+side*.9,4.5,x+side*3.4,6.1,z,.6,c,1.1);}break;
  case 2: // Crown drawbridge and bent wooden toy track.
   for(const side of [-1,1])beam(x+side*2,4,x+side*3.2,5.4,z,.6,a);
   arc(x,.8,z+5,2.3,0,Math.PI,gold,.25);break;
  case 3: // Open, ribbed bivalve with a broad hollow interior.
   for(let i=0;i<9;i++){const t=.12+i*Math.PI*.11;beam(x,.65,x+Math.cos(t)*3.6,.65+Math.sin(t)*4.7,z-1+i*.07,.4,i%2?a:cream,.7);}
   arc(x,.65,z-.7,3.6,0,Math.PI,cream,.42);break;
  case 4: // Broken caldera rim: inclined basalt teeth, low hot fissures.
   for(let i=0;i<9;i++){const t=i*Math.PI*2/9;beam(x+Math.cos(t)*2.1,2.7,x+Math.cos(t)*2.8,4+(i%3)*.25,z+Math.sin(t)*2.1,.65,dark,.85);}
   for(const side of [-1,1])beam(x,2.5,x+side*2.1,.2,z+2.5,.2,a);break;
  case 5: // Curved leviathan ribs; light lives inside the dark carcass.
   for(let i=0;i<4;i++)arc(x,1,z+i*1.4,2.6-i*.18,.1,Math.PI-.1,c,.48);break;
  case 6: // Open folio canopy, paper wings above a crooked school bell.
   beam(x,5.4,x-3.5,6.4,z,.28,cream,3);beam(x,5.4,x+3.5,6.4,z,.28,cream,3);
   arc(x,4.8,z+1.8,.6,0,Math.PI,a,.22);break;
  case 7: // Split signal antenna, deliberate gap at its apex.
   for(const side of [-1,1]){beam(x+side*3,3,x+side*1.8,7.5,z,.35,a);beam(x+side*1.8,7.5,x+side*.5,8.3,z,.35,a);}break;
  case 8: // Solar crescent crown above the stepped sandstone mass.
   arc(x,5.7,z,1.7,-.3,Math.PI+1.5,gold,.5);break;
  case 9: // Fossil ribs rise from the floor, fern fingers spread above them.
   for(let i=0;i<4;i++)arc(x,.8,z+i*1.6,2.5,0,Math.PI,cream,.38);
   for(const side of [-1,1])beam(x,5.4,x+side*3.6,6.6,z,.45,c,1.3);break;
  case 10: // Crescent rather than a filled square moon.
   arc(x,6.4,z-1,1.6,.55,5.5,0xffc890,.5);
   for(const side of [-1,1])beam(x+side*1.8,3.8,x+side*3,4.5,z,.3,a,3);break;
  case 11: // Open pediment and winged marble shoulders.
   beam(x-3,4.9,x,6.8,z,.5,cream);beam(x,6.8,x+3,4.9,z,.5,cream);
   for(const side of [-1,1])for(let i=0;i<3;i++)beam(x+side*2,3,x+side*(3.4+i*.5),4.7+i*.2,z+i*.3,.3,cream);break;
  case 12: // Tilted landing fins and a hollow containment halo.
   arc(x,3.8,z-1,3.2,.15,Math.PI*1.85,a,.25);
   for(const side of [-1,1])beam(x+side*2.2,3,x+side*3.5,.2,z,.35,dark);break;
  case 13: // Hanging keel and diagonal airship rigging.
   for(const side of [-1,1]){beam(x+side*1.7,4.5,x+side*.8,1.9,z,.14,gold);beam(x,4.8,x+side*4.1,4,z,.25,c,2.2);}break;
  case 14: // Long slanted glacial crystals with pale ridges.
   for(const side of [-1,1])for(let i=0;i<3;i++)beam(x+side*(.8+i*.6),.2,x+side*(1.4+i*.9),5.8-i*.8,z+i*.35,.55,i%2?cream:a,.8);break;
  case 15: // An unclosed clock above cloud pillows, pendulum leaning sideways.
   arc(x,5.6,z,1.8,-.3,4.6,a,.4);beam(x,5.6,x+1.2,4.2,z+.4,.16,gold);break;
  case 16: // Exposed greenhouse ribs and growth escaping containment.
   for(let i=0;i<3;i++)arc(x,2.5,z+i,2.1,0,Math.PI,wood,.2);
   for(const side of [-1,1])beam(x+side*2,.3,x+side*3.4,3.5,z,.5,c);break;
  case 17: // Enormous bent grass blades dwarf the comb nursery.
   for(const side of [-1,1]){beam(x+side*3,0,x+side*2.6,4.5,z,.35,c);beam(x+side*2.6,4.5,x+side*.8,7,z,.5,a,.8);}break;
  case 18: // Diagonal crane boom and a visibly open horseshoe magnet.
   beam(x-2,4.8,x+3,7,z,.55,dark);beam(x+3,7,x+3,4.7,z,.12,gold);
   arc(x+3,4.2,z,.9,0,Math.PI,a,.38);break;
  case 19: // Incomplete nested orbital arcs frame the central planet.
   arc(x,4.5,z-.7,3.3,-.45,4.5,a,.22);arc(x,4.5,z+.6,2.9,2.9,7.7,gold,.3);
   beam(x-2.7,2.4,x+2.7,6.5,z,.16,cream);break;
  case 20: // Missing keystone, disconnected contours and roots of first light.
   for(const side of [-1,1]){beam(x+side*3,.3,x+side*2.7,5,z,.4,cream);beam(x+side*2.7,5,x+side*1.2,7,z,.4,gold);}
   arc(x,3.5,z+1,2,.4,2.5,a,.18);arc(x,3.5,z+1,2,3.4,5.5,a,.18);break;
 }
 // RegionLayout owns paths and native bank clusters; avoid a second repeated
 // row of generic plinths and floor stripes competing with this focal structure.
 return blocks;
}
