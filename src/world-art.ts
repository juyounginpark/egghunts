import type {Block} from './region-layout';
import {STAGES,ROAD_WIDTH_SCALE} from './stage-data';
export {circularVillageArt as villageArt} from './village-art';

/** Authored document landmarks. All parts are batched; the central path stays clear. */
export function stageLandmarks(stage:number,length:number){
 const blocks:Block[]=[],s=STAGES[stage-1],c=s.color,a=s.accent;
 const x=(stage%2?8.6:-8.6)*ROAD_WIDTH_SCALE,z=-Math.min(38,length*.34);
 const ivory=0xe8e2ce,wood=0x826247,iron=0x45464f,gold=0xc9a566;
 const b=(dx:number,y:number,dz:number,w:number,h:number,d:number,col=c,roll=0)=>blocks.push({x:x+dx,y,z:z+dz,w,h,d,c:col,roll});
 const beam=(xx:number,y:number,xx2:number,y2:number,dz:number,w:number,col:number,depth=w)=>b((xx+xx2)/2,(y+y2)/2,dz,w,Math.hypot(xx2-xx,y2-y)+w*.2,depth,col,-Math.atan2(xx2-xx,y2-y));
 const arc=(xx:number,y:number,dz:number,rx:number,ry:number,col:number,start=0,end=Math.PI*2,w=.35)=>{
  for(let i=0;i<28;i++){const t=start+(end-start)*i/28,u=start+(end-start)*(i+1)/28;beam(xx+Math.cos(t)*rx,y+Math.sin(t)*ry,xx+Math.cos(u)*rx,y+Math.sin(u)*ry,dz,w,col);}
 };
 const tree=(dx:number,dz:number,h:number)=>{beam(dx,0,dx-.4,h,dz,.65,wood);for(const side of [-1,1]){beam(dx-.4,h*.55,dx+side*2,h*.85,dz,.45,wood);b(dx+side*1.5,h,dz,3,1.5,3,0x729576);}b(dx,h+1,dz,3,1.4,2.6,0x8aa774);};
 switch(stage){
 case 1: // Seed mill and broad garden roots.
  b(0,2,0,2.6,4,2.8,wood);b(0,4.3,0,3.4,.6,3.4,c);b(0,3,1.7,6,.35,.3,ivory);b(0,3,1.7,.35,6,.3,ivory);tree(-3,3,2.5);tree(3,4,2);break;
 case 2: // Open music-box castle, hinged lid and brass winding key.
  b(0,.5,0,6,1,4,0xb54f5b);b(0,3,-2,6,4,.4,0x557ca5,-.12);
  for(const side of [-1,1]){b(side*2,2,0,1,3,1,a);b(side*2,4,0,1.4,1,1.4,ivory);}arc(0,2,2,1,1,gold);b(0,1.3,2,.35,1.4,.35,gold);break;
 case 3: // Open fan-coral arch with visible branching fingers.
  for(const side of [-1,1])for(let j=0;j<5;j++){beam(side*2,.2,side*(3-j*.3),2+j*.75,0,.42,j%2?a:ivory);beam(side*(3-j*.3),2+j*.75,side*(4-j*.35),2.7+j*.75,0,.26,a);}arc(0,.3,0,3.4,5.6,a,0,Math.PI,.45);b(0,.7,1,1.2,1.2,1.2,ivory);break;
 case 4: // Forge anvil: recognisable waist, overhanging horn, low molten channel.
  b(0,.4,0,5,.8,4,iron);b(0,1.7,0,2.5,2.2,2.8,iron);b(0,3.1,0,6.5,1.1,3.8,iron);beam(3,3.2,5,3.5,0,.8,iron,2);
  for(let j=0;j<6;j++)b(-2+j*.6,.06,2+j,.35,.12,1.2,a);b(-4,1,1,1.2,2,2,wood);break;
 case 5: // Clock classroom with an empty upper floor and hanging bell.
  for(const dx of [-2.5,2.5])b(dx,2.8,0,.5,5.6,.6,wood);b(0,2.5,0,5.5,.3,3.5,wood);b(0,5.7,0,6,.4,3,ivory);arc(0,4.2,.3,1.2,1.2,gold);beam(0,4.2,.7,4.7,.4,.15,iron);b(0,1.8,0,.2,1.2,.2,gold);b(0,1.1,0,1.1,.6,1.1,gold);break;
 case 6: // Three advertisement towers, no alien saucer silhouettes.
  for(let j=0;j<3;j++){const h=4+j*1.5;b((j-1)*2,h/2,0,1.4,h,1.4,iron);b((j-1)*2,h-1,1,1.6,2,.2,j===1?0xd7dedd:j===0?0x5bc5c3:0xd276be);}break;
 case 7: // Sun gate: a real open disc and blue glazed stone feet.
  for(const side of [-1,1]){b(side*2.7,1.5,0,1.1,3,1.5,0x416b8b);b(side*2.7,.25,0,2,.5,2,gold);}arc(0,3.6,0,2.8,2.8,gold);break;
 case 8: // Long-neck fossil arch above a quiet wetland.
  for(const side of [-1,1])beam(side*3,0,side*2,3.5,0,1.4,c,2);arc(0,3.5,0,2,2.6,0xa6b292,0,Math.PI,.85);tree(4,3,4);break;
 case 9: // Moonlit zelkova and a bent stone bridge.
  tree(0,-1,5);arc(0,.1,3,3.8,1.3,0xa6a1a4,0,Math.PI,.7);arc(0,6,-2,1.5,1.5,ivory);for(const side of [-1,1]){b(side*3,2,2,.15,4,.15,wood);b(side*3,3,2,.8,1.1,.8,a);}break;
 case 10: // Roofless circular cloud temple.
  for(let j=0;j<8;j++){const t=j*Math.PI/4;b(Math.cos(t)*3,2.1,Math.sin(t)*2.2,.5,4.2,.5,ivory);b(Math.cos(t)*3,4.4,Math.sin(t)*2.2,1,.35,1,gold);}arc(0,4.5,-1,3.4,.7,ivory);break;
 case 11: // Partly open disk hangar, warm experimental terrain.
  for(let j=0;j<6;j++)b(0,1+j*.45,0,7-j*.65,.5,5-j*.5,0xbfc7c5);b(0,1.5,2.6,4,2,.25,iron);b(0,3.2,3,4,.4,2,ivory,-.12);for(const side of [-1,1])b(side*3,1,3,.7,2,.7,a);break;
 case 12: // Airship berth, fabric envelope, wood deck and mooring lines.
  for(let j=0;j<7;j++)b(0,5,(-3+j)*1.1,4-Math.abs(j-3)*.6,2.1,1.3,ivory);b(0,2,0,2,1,4,wood);for(const side of [-1,1])beam(side*1,2,side*1.7,4.5,0,.12,gold);b(0,.3,2,7,.6,6,wood);break;
 case 13: // Ice gate, tall tapering slabs with a large negative space.
  for(const side of [-1,1]){beam(side*3,0,side*2.3,5,0,.9,0x8ebdcc,1.4);beam(side*2.3,5,side*.4,6.7,0,.65,0xd7e8df,1);}b(0,.1,0,7,.2,3,c);break;
 case 14: // Horizontal crescent clock over floating pillow stairs.
  arc(0,5,0,3.5,1.6,gold,.45,Math.PI*2-.45,.5);beam(0,5,2,5.6,.2,.15,iron);for(let j=0;j<5;j++)b(-2+j,1+j*.5,3+j*.8,1.8,.45,1.6,j%2?ivory:a);break;
 case 15: // Cooling tower reclaimed by a living canopy.
  for(let j=0;j<7;j++){const w=4.7-Math.sin(j*Math.PI/6)*1.4;for(const side of [-1,1])b(side*w/2,.4+j*.65,0,.6,.7,3,0x898a78);}tree(1,1,4);beam(-2,0,1,5.2,1,.35,0x66875c);break;
 case 16: // Hollow acorn village, dome cap and branch-scale grasses.
  for(const side of [-1,1])b(side*2,2,0,1.2,4,3.2,wood);b(0,4.4,0,5.8,1.1,4.4,gold);b(0,5.5,0,.5,1.5,.5,wood);for(const side of [-1,1])beam(side*4,0,side*2.5,7,2,.3,c);break;
 case 17: // Sleeping robot head factory, mismatched large replacement panels.
  b(0,2.1,0,6,4.2,4,iron);b(-1.6,2.5,2.1,1.6,.5,.2,0xe3bd63);b(1.6,2.5,2.1,1.6,.5,.2,0x6c97bc);b(0,1,2.2,2.5,.4,.2,ivory);b(-3.3,2,0,.7,2,2,gold);beam(3,3,5,5,0,.6,iron);break;
 case 18: // Open armillary, visible lens and independent inclined orbits.
  b(0,1,0,3.5,2,3.5,ivory);arc(0,4.8,0,3.4,3.2,gold,-.4,5.4,.25);arc(0,4.8,.5,3.2,1.4,a,.2,5.7,.28);beam(-2,3,2,6,0,.5,ivory);break;
 case 19: // Empty stone ring. No planet, seed or star-field fills its centre.
  arc(0,3.7,0,3.1,3.5,ivory,.3,2.8,.65);arc(0,3.7,0,3.1,3.5,0x6e6178,3.3,6.1,.65);for(const side of [-1,1])b(side*3.7,.4,2,1.8,.8,2,iron);break;
 case 20: // First tree: roots and branches close one living circle above black soil.
  b(0,.1,0,7,.2,5,0x39352f);arc(0,3.6,0,3.1,3.4,wood,0,Math.PI*2,.55);for(const side of [-1,1]){beam(0,.3,side*4,.1,1,.5,wood);beam(side*2.8,4.5,side*4.2,6,0,.4,wood);b(side*3.5,6.2,0,2.5,1,2.2,side<0?0x8fb784:0xc38c66);}b(0,1.1,0,.7,1,.7,gold);break;
 }
 return blocks;
}
