import {STAGES} from './stage-data';
import {STAGE_PET_ROWS} from './stage-pet-catalog';
import {SECRET_DRAGON_ROWS} from './secret-dragon-catalog';
import {stageEggMotif} from './egg-motifs';
import {reorderStages,legacyTheme} from './stage-order';

type Cell=[number,number,number,number];
// These are material motions, not rarity colours: garden / mechanism / water / heat / sky.
export const EGG_EFFECT_FAMILIES=reorderStages([0,1,2,3,2,4,1,3,0,4,4,4,1,2,4,0,0,1,4,4]);
EGG_EFFECT_FAMILIES[18]=4;EGG_EFFECT_FAMILIES[19]=0;
const cache=new Map<string,{cells:Cell[];colors:string[]}>();
const blend=(a:number,b:number,t:number)=>{
 const ch=(shift:number)=>Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t);
 return (ch(16)<<16)|(ch(8)<<8)|ch(0);
};

/** 20³ toy eggs: large shell, one environmental structure, a readable inset.
 * The palette references possible hatchlings of this stage/tier, not a promised result.
 * All bilateral parts are reflected around x=9.5. No per-voxel meshes or textures.
 */
export function designEgg(stage:number,variant:number,tier=0){
 const key=`${stage}:${variant}:${tier}`,cached=cache.get(key);if(cached)return cached;
 if(variant===6){
  const cells:Cell[]=[],colors=['#fff1bf','#e5a74e','#9d87df','#fff9eb'];
  for(let x=2;x<18;x++)for(let y=1;y<19;y++)for(let z=2;z<18;z++){
   const radius=7.5-(y/20)*1.5;
   if(((x-9.5)**2+(z-9.5)**2)/(radius*radius)+(y-9)**2/85>1)continue;
   const ribbon=Math.abs(x-9.5)<1.1||Math.abs(y-9)<1.1;
   cells.push([x,y,z,ribbon?3:y>14?4:1]);
  }
  for(let x=6;x<=13;x++)for(let y=16;y<=19;y++)if(Math.abs(x-9.5)+Math.abs(y-18)<4)cells.push([x,y,9,2]);
  const design={cells,colors};cache.set(key,design);return design;
 }
 const s=STAGES[stage-1],dragon=variant===5,rank=dragon?3:tier>=5?2:tier>=3?1:0;
 const candidates=STAGE_PET_ROWS.filter(p=>p.stageId===stage&&p.tier===tier);
 const pet=dragon?SECRET_DRAGON_ROWS.find(p=>p.stageId===stage):candidates[variant%Math.max(1,candidates.length)];
 const petColor=pet?parseInt(pet.color.slice(1),16):s.color;
 const shell=blend(petColor,0xffefd4,.12),accent=s.accent;
 const material=[4,7,12,16,18,20].includes(legacyTheme(stage))?0x394753:[8,11,13].includes(legacyTheme(stage))?0xb99154:0x806b53;
 const colors=[shell,accent,0xfff0d6,material,blend(shell,material,.38),blend(shell,0xffffff,.38),blend(accent,0xffffff,.45),petColor].map(c=>`#${c.toString(16).padStart(6,'0')}`);
 const cells=new Map<number,Cell>();
 const put=(x:number,y:number,z:number,c:number)=>{if(x>=0&&x<20&&y>=0&&y<20&&z>=0&&z<20)cells.set(x+y*20+z*400,[x,y,z,c]);};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>{
  for(let i=Math.ceil(x-(w-1)/2);i<=Math.floor(x+(w-1)/2);i++)for(let j=Math.ceil(y-(h-1)/2);j<=Math.floor(y+(h-1)/2);j++)for(let k=Math.ceil(z-(d-1)/2);k<=Math.floor(z+(d-1)/2);k++)put(i,j,k,c);
 };
 const pair=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>{box(x,y,z,w,h,d,c);box(19-x,y,z,w,h,d,c);};
 const ring=(y:number,rx:number,rz:number,c:number)=>{
  for(let x=0;x<20;x++)for(let z=0;z<20;z++){
   const q=((x-9.5)/rx)**2+((z-9.5)/rz)**2;
   if(q<=1&&q>=.62)box(x,y,z,1,2,1,c);
  }
 };
 const fin=(spread:number,y:number,c:number)=>{
  for(let i=0;i<spread;i++)pair(4.5-i,y+i,9.5,2,Math.max(2,7-i),4,c);
 };
 const leaf=(x:number,y:number,c:number)=>{
  for(let i=0;i<5;i++)pair(x-i*.5,y+i*.5,9.5,4,2,Math.max(2,6-i),c);
 };
 const mechanical=[2,6,7,13,16,18].includes(legacyTheme(stage)),mineral=[4,8,14,20].includes(legacyTheme(stage));
 const rx=[5.7,6.4,5,6.1,5.5,5.8][variant],ry=[6.8,5.6,7.2,6.2,6.8,7][variant],rz=[5,5.6,4.7,5.4,5.2,5.6][variant];
 const cy=8,top=cy+ry;
 for(let x=0;x<20;x++)for(let y=1;y<17;y++)for(let z=0;z<20;z++){
  const dx=Math.abs(x-9.5)/rx,dy=(y-cy)/ry,dz=Math.abs(z-9.5)/rz;
  const taper=dy>0?1-dy*.17:1;
  const shape=mechanical?Math.max(dx/taper,dz/taper)**3+Math.abs(dy)**3:mineral?((dx+dz)*.7)**2+dy*dy:(dx*dx+dz*dz)/(taper*taper)+dy*dy;
  if(shape>1)continue;
  // Broad material zones: belly, shaded foot, shell, lit cap; no noisy dots.
  let color=y<4?5:y>12?6:1;
  if(z>11&&y>=5&&y<=10&&dx<.48)color=3;
  if(mechanical&&[4,11].includes(y))color=4;
  if(mineral&&y>=7&&y<=8)color=8;
  // Rare shells open along a stepped seam to reveal a contained coloured core.
  if(rank>=2&&z>=10&&Math.abs(x-9.5)<(y>10?2:1)&&y>4&&y<14){if(z>12)continue;color=7;}
  put(x,y,z,color);
 }
 const crown=Math.min(15,Math.round(top)),wide=rank>=2?1:0;
 if(dragon){
  // Document seals use one large motif, all inside the existing shell footprint.
  const disk=(color:number,gap=false)=>{for(let j=0;j<32;j++){const t=j*Math.PI/16;if(gap&&j>4&&j<14)continue;box(9.5+Math.cos(t)*5,9+Math.sin(t)*5,15,2,2,2,color);}};
  if([1,8,15,16,20].includes(stage)){
   leaf(6.5,13,stage===20?4:8);ring(3,6,5,4);box(9.5,9,15,3,4,2,7);
  }else if([2,4,5,7,9,11,12,17,18,19].includes(stage)){
   disk([4,17,19].includes(stage)?4:2,stage===19);
   if([2,12].includes(stage)){box(9.5,10,16,2,6,1,4);box(11,9,16,5,2,1,4);}
   else if(stage===5){box(9.5,9,16,4,4,1,4);box(9.5,6,16,6,2,1,4);}
   else if(stage===17){for(const x of [5.5,13.5])for(const y of [5,13])box(x,y,14.5,2,2,2,3);}
   else if(stage===19){for(const [key,[x,y]]of cells)if((x-8)**2+(y-10)**2<12)cells.delete(key);}
   else box(9.5,9,16,3,3,1,7);
  }else if(stage===3){ring(3,6,5,2);for(let j=0;j<3;j++)pair(5.5-j,4+j*2,10,2,4,2,2);box(9.5,9,15,4,4,2,3);}
  else if(stage===6){box(9.5,9,15,2,12,1,2);ring(8,6,5,3);}
  else if(stage===10){for(let j=0;j<5;j++)box(8+j%2*3,5+j*2,15,4,3,1,2);}
  else if(stage===13){for(let j=0;j<3;j++)box(5.5+j*4,12,10,2,8-j,4,j%2?3:2);}
  else if(stage===14){pair(6.5,10,15,2,8,2,4);box(9.5,13,15,8,2,2,4);box(9.5,10,15,2,2,2,7);}
  const result={cells:[...cells.values()],colors};cache.set(key,result);return result;
 }
 // The stage's strongest construction frames mascot and dragon eggs. The other
 // named variants retain their own shell/lantern/key/etc. outline, not the same hat.
 if(variant===0||dragon)switch(legacyTheme(stage)){
  case 1: // Seed husk with two broad leaves; acorn cap / blossom cup / sprout.
   ring(crown-2,rx+1,rz+1,variant===0?4:8);leaf(6.5,crown,8);
   if(rank>=2)leaf(5.5,5,2);break;
  case 2: // Toy seam and chunky interlocking studs, never tiny pixel speckles.
   box(9.5,crown-1,9.5,10,2,10,2);pair(6.5,crown+1,9.5,4,2,4,3);
   if(rank>=2){pair(3.5,6,9.5,4,6,8,4);pair(3.5,6,13.5,2,2,2,2);}break;
  case 3: // A fan shell growing from the back, with large spaced ribs.
   for(let j=-3;j<=3;j++)box(9.5+j*2,10-Math.abs(j),7.5,2,10-Math.abs(j)*2,4,j%2?2:3);
   if(rank>=1)box(9.5,9,15.5,4,4,2,7);if(rank>=2)fin(3,9,2);break;
  case 4: // Basalt shoulders and a glowing crater, rather than a hat flame.
   pair(4.5,8,9.5,4,10,8,4);ring(crown-1,4+wide,4+wide,4);box(9.5,crown-1,9.5,4,2,4,7);
   if(rank>=2){pair(2.5,11,9.5,2,6,4,4);pair(5.5,5,14.5,2,6,2,2);}break;
  case 5: // Nautilus spiral or jellyfish mantle with substantial curled feet.
   ring(11,rx+1+wide,rz+1,2);
   for(const z of [6.5,12.5]){pair(4.5,3,z,2,4,4,8);pair(3.5,2,z+1,4,2,4,2);}
   if(rank>=1)box(9.5,11,15.5,4,4,2,7);if(dragon)fin(4,8,8);break;
  case 6: // Egg tucked inside a book cover, page layers visible from the side.
   pair(3.5,8,9.5,2,14,10,8);box(9.5,2,9.5,14,2,12,4);
   box(9.5,8,15.5,4,4,2,2);if(rank>=2){pair(1.5,10,8.5,2,10,8,8);box(9.5,15,9.5,6,2,8,3);}break;
  case 7: // Insulated battery capsule, recessed charge window and side terminals.
   ring(3,rx+1,rz+1,4);pair(4.5,11,9.5,2,8+rank*2,4,2);box(9.5,9,14.5,4,6,2,7);
   if(rank>=2)pair(1.5,9,9.5,2,10,6,4);break;
  case 8: // Scarab wing casing / stepped sandstone sun cradle.
   pair(4.5,7,9.5,4,10,8,4);ring(crown-1,4+wide,4+wide,2);
   box(9.5,11,15.5,4,4,2,7);if(rank>=2)fin(4,9,4);break;
  case 9: // Fossil ribs wrap around the shell, with broad vertebral plates.
   for(const y of [4,8,12])ring(y,rx+.5,rz+.5,3);
   for(const z of [5.5,9.5,13.5])box(9.5,15, z,4,4,2,8);
   if(rank>=2)pair(3.5,13,9.5,2,6,4,3);break;
  case 10: // Lantern enclosed by lifted tiled eaves, tassels underneath.
   for(let i=0;i<3;i++)box(9.5,13+i,9.5,16-i*4,2,12-i*2,4);
   pair(4.5,14,9.5,2,4,12,2);pair(7.5,1,9.5,2,2,4,2);
   if(rank>=2)pair(2.5,15,9.5,2,6,4,8);break;
  case 11: // Marble cradle, lyre-like side supports and a sheltered light core.
   box(9.5,2,9.5,14,2,12,3);pair(3.5,8,9.5,2,12,6,3);
   if(rank>=1)box(9.5,15,9.5,14,2,8,4);if(rank>=2)fin(4,10,3);break;
  case 12: // Saucer shell with landing feet and a luminous incubation dome.
   ring(6,8.5,8.5,4);ring(7,8.5,8.5,2);pair(4.5,2,9.5,2,4,4,4);
   if(rank>=2){pair(2.5,12,9.5,2,6,4,2);box(9.5,16,9.5,4,2,4,7);}break;
  case 13: // Boiler bands and paired bent pipes; gauges sit in the shell.
   ring(4,rx+1,rz+1,4);ring(12,rx+1,rz+1,4);
   pair(3.5,10,9.5,2,10,4,4);pair(4.5,15,9.5,4,2,4,4);box(9.5,9,15.5,4,4,2,3);
   if(rank>=2)pair(1.5,8,9.5,2,8,6,2);break;
  case 14: // Split ice petals exposing a frost core.
   for(let i=0;i<4;i++)pair(4.5-i*.5,8+i*2,9.5,4-i%2,4,6, i<2?8:3);
   if(rank>=2){pair(1.5,6,9.5,2,8,6,2);box(9.5,16,9.5,2,4,4,7);}break;
  case 15: // Soft pillow shell with rolled corners and a crescent headboard.
   box(9.5,3,9.5,16,4,12,3);pair(2.5,5,9.5,2,4,10,2);
   for(let i=0;i<5;i++)box(7.5+i,13+i*.5,7.5,4,2,4,2);
   if(rank>=2)pair(3.5,12,8.5,4,6,4,3);break;
  case 16: // Containment ribs and thick living roots, bright fluid inside.
   pair(3.5,9,9.5,2,14,6,4);box(9.5,15,9.5,14,2,10,4);
   pair(5.5,2,9.5,6,2,6,8);box(9.5,9,15.5,4,6,2,7);
   if(rank>=2)leaf(4.5,12,8);break;
  case 17: // Folded leaf cocoon; rare specimens unfurl real wing-shaped casing.
   for(const y of [4,8,12])ring(y,rx,rz,8);
   leaf(6.5,13,8);if(rank>=1)pair(4.5,9,9.5,4,8,4,2);if(rank>=2)fin(4,9,2);break;
  case 18: // Magnetic U-cradle and toothed feet, core remains an egg.
   pair(2.5,9,9.5,4,12,6,4);pair(2.5,15,9.5,4,2,6,2);
   box(9.5,3,9.5,16,2,6,4);if(rank>=2)pair(2.5,3,9.5,4,4,12,8);break;
  case 19: // Planet shell / comet capsule with a broad orbital belt.
   ring(7,9,8,4);ring(8,9,8,2);
   if(rank>=1)pair(5.5,14,9.5,4,4,4,3);if(rank>=2)fin(3,12,7);break;
  case 20: // Separated portal ribs frame a recessed seed of light.
   pair(2.5,9,9.5,2,14,6,4);pair(4.5,16,9.5,6,2,6,2);
   box(9.5,9,14.5,4,8,2,7);if(rank>=2)pair(1.5,10,9.5,2,8,10,3);break;
 }
 if(variant>0&&!dragon){
  const motif=stageEggMotif(stage,variant),palette=[0,1,2,3,4,4,8];
  for(const [x,y,z,c] of motif.cells){
   // Keep only large exterior features; the old uniform central body is replaced.
   if(y>=12||Math.abs(x-9.5)>rx||Math.abs(z-9.5)>rz)put(x,y,z,palette[c]);
  }
  if(rank>=2){
   // Exposed core has thick opposing shell lips, not a common particle crown.
   pair(6.5,8,14.5,2,8,2,5);box(9.5,8,13.5,2,6,2,7);
  }
 }
 // Specimen-specific hatchling echo, chosen from the actual stage/tier pool.
 if(!dragon&&rank>=1){
  if(pet?.shape==='rabbit'||pet?.shape==='cat')pair(6.5,16,9.5,2,4,4,8);
  else if(pet?.shape==='bird')pair(4.5,8,11.5,4,4,2,8);
  else if(pet?.shape==='plant')leaf(7.5,14,8);
 }
 // Dragon seals have large paired horns and an inset diamond, not rainbow particles.
 if(dragon){
  // The crest previews the same wing ecology as the hatched dragon.
  if([3,5,14].includes(legacyTheme(stage)))for(let i=0;i<3;i++)pair(4.5-i,11-i,9.5,2,5-i,4,i===2?7:2);
  else if([1,9,17].includes(legacyTheme(stage)))leaf(6.5,14,8);
  else if([7,12,19,20].includes(legacyTheme(stage))){
   for(let j=0;j<20;j++){const a=j*Math.PI/10;if(stage===20&&j%7<2)continue;box(9.5+Math.cos(a)*8,10+Math.sin(a)*7,9.5,2,2,2,j%4===0?7:2);}
  }else pair(5.5,17,9.5,2,4,4,4);
  box(9.5,9,15.5,4,4,2,7);
 }
 const result={cells:[...cells.values()],colors};cache.set(key,result);return result;
}

const nests=new Map<number,{cells:Cell[];colors:string[]}>();
/** Low stage-specific cradles share the old nest's footprint and egg contact height. */
export function designNest(stage:number){
 const cached=nests.get(stage);if(cached)return cached;
 const s=STAGES[stage-1],mechanical=[2,6,7,12,13,18].includes(legacyTheme(stage)),mineral=[4,8,11,14,19,20].includes(legacyTheme(stage));
 const material=mechanical?0x58606b:mineral?blend(s.color,0x383b4b,.35):blend(s.color,0x735839,.4);
 const colors=[material,blend(s.color,0xf5e2b5,.15),blend(s.accent,material,.3)].map(c=>`#${c.toString(16).padStart(6,'0')}`),cells:Cell[]=[];
 for(let x=1;x<19;x++)for(let z=1;z<19;z++){
  const dx=x-9.5,dz=z-9.5,r=Math.hypot(dx,dz),edge=mechanical?Math.max(Math.abs(dx),Math.abs(dz)):r;
  if(edge>8)continue;
  const band=edge>6,height=band?3:1;
  for(let y=0;y<height;y++)cells.push([x,y,z,band?(y===2?2:1):1]);
  if(band&&((mechanical&&(x%5===0||z%5===0))||(!mechanical&&Math.sin(Math.atan2(dz,dx)*(mineral?6:5))>.8)))cells.push([x,3,z,3]);
 }
 const result={cells,colors};nests.set(stage,result);return result;
}
