import type {Block} from './region-layout';

/** Full-size silhouettes authored in metres, not enlarged miniature props. */
export function explorationLandmark(stage:number):Block[]{
 const out:Block[]=[],wood=0x79533d,leaf=0x62865a,stone=0xa8afa5,ivory=0xe1d8bf,dark=0x39434c,gold=0xc5a15c;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>out.push({x,y,z,w,h,d,c,solid:true});
 const column=(x:number,z:number,h:number,c=stone)=>{b(x,h/2,z,.42,h,.42,c);b(x,.15,z,.7,.3,.7,c);b(x,h-.1,z,.68,.2,.68,c);};
 const arch=(w:number,h:number,z:number,c=stone)=>{for(const x of [-w/2,w/2])b(x,h/2,z,.55,h,.8,c);b(0,h,z,w+.55,.45,.85,c);};
 const roof=(y:number,w:number,d:number,c:number)=>{for(let i=0;i<4;i++)b(0,y+i*.22,0,w-i*.55,.26,d-i*.4,c);};
 const ring=(y:number,r:number,c:number)=>{for(let i=0;i<16;i++){const a=i*Math.PI/8;b(Math.cos(a)*r,y,Math.sin(a)*r,.38,.25,.38,c);}};
 const window=(x:number,y:number,z:number,c=0xa8c6bd)=>{b(x,y,z,.55,.75,.06,dark);b(x,y,z+.04,.4,.58,.04,c);};
 const foliage=(x:number,y:number,z:number,w:number,c=leaf)=>{b(x,y,z,w,.65,w*.8,c);b(x-.15,y+.42,z-.08,w*.72,.3,w*.62,c);};
 switch(stage){
 case 1: // Split hollow trunk, broad layered crown, exposed roots.
  for(const x of [-.8,.8]){b(x,1.65,0,.75,3.3,1.5,wood);b(x*1.5,.25,.4,1.2,.5,1.6,wood);}
  b(0,2.9,0,2,1,1.6,wood);b(0,.1,0,1.1,.2,1.3,0x4b4434);
  for(const [x,y,z,w] of [[-1,3.2,0,2.1],[1,3.5,-.3,2.2],[0,4.1,.3,2.5]])foliage(x,y,z,w);
  for(const x of [-1,1]){b(x,1.4,.83,.2,.25,.16,0xc2b38b);b(x*.45,.1,1.1,.4,.2,.6,leaf);}break;
 case 2: // Toy castle with offset towers, block joints and flags.
  arch(2.2,2.1,0,0xbc8c72);
  for(const x of [-1.35,1.35]){b(x,1.6,0,.95,3.2,1.1,0x7395aa);b(x,3.3,0,1.15,.3,1.25,gold);for(const z of [-.4,.4])b(x,3.6,z,.5,.4,.25,0xbe7468);b(x,4,0,.07,.6,.07,dark);b(x+.25,4.15,0,.5,.28,.08,0xc68577);window(x,1.7,.57);}
  for(const x of [-.5,.5])b(x,2.5,.48,.4,.35,.3,gold);break;
 case 3: // Coral fan framing a pearl basin.
  for(let i=-2;i<=2;i++){const h=2.7-Math.abs(i)*.5,x=i*.55;b(x,h/2,-.4,.36,h,.4,0xbd889c);b(x+(i<0?-.35:.35),h*.65,-.4,.75,.3,.35,0xcd9aaa);foliage(x,h,-.4,.7,0x9a85af);}
  ring(.35,1.2,0x7aa2a6);b(0,.2,.2,1.8,.2,1.5,0x659699);b(0,.65,.2,.85,.8,.75,ivory);b(-.2,.95,.55,.2,.15,.05,0xffefc9);break;
 case 4: // Open furnace mouth, chimney and forging fixtures.
  arch(1.7,2.6,0,0x57535c);b(0,.85,.25,1.2,1.5,.25,0x552f2e);b(0,.55,.44,.9,.65,.08,0xe69a50);b(0,.2,.85,2.7,.4,1.2,dark);
  b(.85,3.5,-.4,.7,2.2,.8,0x47434c);b(.85,4.55,-.4,1,.2,1,gold);for(const x of [-1.1,1.1]){b(x,1.5,.5,.22,1.8,.18,0x947054);b(x,2.5,.5,.5,.25,.3,gold);}break;
 case 5: // School entrance, clock face and lopsided bell tower.
  arch(2.2,2.2,0,0x93867e);b(0,2.6,0,3,.5,1.4,0x667666);roof(2.9,3.5,1.8,0x5d6273);
  b(-.7,3.75,-.15,1,1.25,.8,0x9b8b7c);b(-.7,3.8,.29,.7,.7,.06,ivory);b(-.7,3.95,.34,.07,.3,.04,dark);b(-.55,3.8,.34,.35,.06,.04,dark);
  for(const x of [-1.05,1.05]){window(x,1.35,.46,0xc0b994);b(x,.2,.9,.65,.3,.5,0x72816a);}break;
 case 6: // Asymmetric skyline with recessed storefront and restrained neon.
  for(const [x,h,c] of [[-1,3.1,0x536474],[.2,4.6,0x3c4d60],[1.2,2.5,0x6a7880]]){b(x,h/2,-.2,.85,h,1.1,c);for(let j=1;j<h;j+=.7)b(x,j,.37,.5,.12,.04,j%2?0x87c5b7:0xc9ab91);}
  b(0,.85,.6,1.7,1.7,.6,dark);b(0,1.8,.98,2,.2,.18,0xa2d4cb);b(-.4,.7,.94,.55,1.25,.04,0x6d9b9c);b(.6,2.8,.48,.12,1.4,.1,0xd29aae);break;
 case 7: // Stepped pyramid, dark entry and paired obelisks.
  for(let i=0;i<6;i++)b(0,.25+i*.48,-.3,3.6-i*.5,.5,2.8-i*.36,0xc8aa78);
  b(0,.7,1.16,.75,1.35,.07,0x675744);for(const x of [-1.55,1.55]){column(x,1.1,2.2,0xb08b5f);b(x,2.3,1.1,.25,.3,.25,gold);}
  for(let i=0;i<3;i++)b(0,.08+i*.1,1.9-i*.3,1.25,.16,.4,0xdfc79a);
  b(1.1,.35,1.5,.9,.55,1.35,0xb89563);b(1.1,.95,1.9,.65,.7,.6,0xc9aa78);b(1.1,1.25,1.9,.9,.22,.65,gold);
  for(const x of [.92,1.28])b(x,1,2.22,.1,.08,.03,dark);break;
 case 8: // Ancient roots curl around a cracked giant eggshell.
  for(const x of [-1.2,1.2]){b(x,1.5,-.3,.8,3,1.3,wood);b(x*.7,.4,.45,1.25,.65,1.5,wood);foliage(x,3.1,-.3,1.9,0x57794c);}
  b(0,2.8,-.5,2.6,.6,1,wood);ring(.35,1,ivory);for(const x of [-.75,.7])b(x,.65,.3,.35,.9,.6,0xd4c7a4);b(.5,1.15,.1,.45,.35,.45,ivory);break;
 case 9: // Moon gate with layered eaves and hanging lanterns.
  arch(2.6,2.8,0,0x8b7b82);roof(2.95,3.8,1.4,0x525365);b(0,2.6,.45,.8,.55,.15,0xb6a58c);
  for(const x of [-1.55,1.55]){b(x,2.3,.4,.07,.7,.07,wood);b(x,1.9,.4,.45,.55,.4,0xd2b579);b(x,1.55,.4,.06,.2,.06,0xb98175);}break;
 case 10: // Colonnaded temple, stepped plinth and triangular pediment.
  for(let j=0;j<3;j++)b(0,.12+j*.16,0,3.6-j*.3,.22,2.3-j*.2,ivory);
  for(const x of [-1.2,-.4,.4,1.2])column(x,.45,2.8,0xd5d6c9);b(0,2.9,0,3.5,.35,1.7,ivory);roof(3.1,3.5,1.9,0xc4c7bd);b(0,3.6,1,.35,.35,.08,gold);
  b(0,1.25,1.2,.5,1.35,.4,ivory);b(0,2.1,1.2,.4,.45,.4,ivory);
  for(const side of [-1,1])for(let j=0;j<3;j++)b(side*(.35+j*.22),1.9+j*.12,1.1,.3,.55-j*.08,.15,ivory);break;
 case 11: // Saucer laboratory, segmented crown and hatch.
  for(let i=0;i<3;i++)b(0,1.8+i*.4,0,3.6-i*.8,.45,2.6-i*.5,i===2?0x94b69d:0x75878b);
  for(const x of [-1.15,1.15])column(x,0,1.7,dark);b(0,.85,.3,1.2,1.7,.5,0x56686c);b(0,.8,.58,.75,1.4,.04,0xa3c3a6);for(const x of [-1,-.5,0,.5,1])b(x,1.95,1.35,.16,.16,.06,0xc9deb7);break;
 case 12: // Clock machinery with exposed wheel and brass pipework.
  b(-.5,1.9,0,1.5,3.8,1.2,0x8b7358);roof(3.85,2,1.6,dark);b(-.5,2.8,.65,1,1,.08,ivory);b(-.5,2.95,.72,.08,.5,.05,dark);b(-.3,2.8,.72,.4,.08,.05,dark);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;b(1+Math.cos(a)*.65,1.2+Math.sin(a)*.65,.3,.28,.28,.35,gold);}b(1,1.2,.3,.25,.25,.5,dark);for(const x of [-1.45,1.6]){b(x,1.2,-.2,.2,2.4,.2,gold);b(x,2.45,-.2,.4,.2,.4,gold);}break;
 case 13: // Ice cavern, jagged roof and snow lip.
  arch(2.2,2.2,0,0x92bac9);for(const [x,h] of [[-1.5,2.4],[-.65,3.3],[.4,3.7],[1.4,2.8]]){b(x,h*.55,-.5,.7,h,.9,0xa7cdd6);b(x,h+.1,-.5,.45,.35,.6,0xdce8e5);}
  for(const x of [-.6,.6])b(x,1.95,.47,.2,.75,.25,0xdce8e5);b(0,.05,.7,3.2,.2,1.5,ivory);break;
 case 14: // Pillow castle, stitched cushions and tall bedposts.
  for(const x of [-1.1,1.1]){column(x,0,3,0xb8a084);for(let j=0;j<3;j++)b(x,.55+j*.7,0,1.15,.6,1.1,j%2?0xc2aec6:0xd9ccba);b(x,2.75,0,.6,.3,.6,gold);}
  b(0,2.2,0,1.4,.65,1.1,0xd6bdd0);b(0,.25,.4,2.7,.5,1.6,0xb29dab);for(const x of [-1.1,0,1.1])b(x,2.5,.57,.2,.08,.04,ivory);break;
 case 15: // Broken greenhouse with exposed ribs and living foliage.
  for(const x of [-1.3,1.3])for(const z of [-.6,.6])column(x,z,x<0?2.7:2,0x69776e);
  for(const y of [1,2.3])b(0,y,-.65,2.8,.12,.12,0x778d7b);for(const x of [-.7,0,.7])b(x,2.8,0,.1,.15,1.6,0x899b88);
  b(-.7,.3,0,1,.6,1,0x697a5d);foliage(-.7,1,0,1.3,0x83a475);foliage(.6,1.8,-.6,1.6,0x6c9168);b(.7,.1,.6,1,.2,.8,0x958b73);break;
 case 16: // Oversized mushroom canopy and exposed seed chamber.
  for(const [x,h,r] of [[-1,2.6,1.9],[.9,3.5,2.4]]){b(x,h/2,0,.5,h,.55,ivory);b(x,h,0,r,.5,r*.8,0xb87972);b(x,h+.32,0,r*.65,.2,r*.55,0xcc9990);for(const dx of [-.35,.35])b(x+dx,h+.45,.15,.24,.08,.25,ivory);}
  ring(.25,1,wood);b(0,.4,.65,.85,.7,.8,0xb9a675);break;
 case 17: // A full-size unfinished robot held inside the assembly gantry.
  arch(2.9,3.5,0,dark);for(const x of [-1.45,1.45]){b(x,1.5,.43,.28,2.5,.12,0xadb1a8);b(x,3.3,.46,.5,.22,.06,gold);}
  b(.4,2.85,0,.1,1.1,.1,dark);b(.4,2.2,0,.55,.2,.4,gold);for(const x of [.15,.65])b(x,1.95,0,.12,.45,.18,stone);
  b(0,1.1,.25,1.5,1.65,1,0x7d9291);b(0,2.3,.25,1.05,.75,.85,0x9ca8a1);
  for(const x of [-.27,.27])b(x,2.4,.7,.17,.12,.04,0xc4d4bf);
  b(0,1.3,.78,.7,.65,.07,dark);for(const y of [1.1,1.35,1.6])b(0,y,.83,.6,.07,.04,gold);
  b(-1,1.4,.2,.45,1.1,.5,stone);b(1,1.6,.2,.4,.6,.45,stone);b(1,.8,.2,.12,.95,.12,dark);break;
 case 18: // Observatory dome, shutter slit and projecting telescope.
  b(0,1,0,2.7,2,2,0x8a889c);for(let i=0;i<4;i++)b(0,2.1+i*.35,-.1,3-i*.55,.4,2.4-i*.4,0xb2b4c4);
  b(.2,2.8,1,.45,.8,.1,dark);b(.2,2.6,1.3,.5,.5,1.3,gold);b(.2,2.6,1.98,.65,.65,.12,dark);window(-.8,1.2,1.03,0xa9bfce);break;
 case 19: // Broken offset portal: open centre remains visible.
  for(const [x,h,z] of [[-1.2,3.6,0],[1.2,2.8,-.2]]){b(x,h/2,z,.65,h,.85,0x645d76);b(x,.2,z,1,.4,1.1,0x857f92);b(x,h-.2,z,.9,.3,1,0xa299b2);}
  b(-.4,3.5,0,1.4,.45,.85,0x82778f);b(.85,3.3,-.2,.8,.4,.7,0x82778f);for(const x of [-1.2,1.2])b(x,1.6,.46,.13,1.4,.04,0xaebac1);ring(.06,1.25,0x8d899c);break;
 case 20: // Split garden tree, flowering crown and inlaid stone roots.
  for(const x of [-.9,.9]){b(x,1.8,0,.7,3.6,1.25,0xafa181);b(x*1.35,.3,.5,1.3,.5,1.5,0xbab294);foliage(x,3.5,0,2.4,0xb5b480);}
  b(0,3,0,2.1,.75,1,0xafa181);foliage(0,4.25,-.2,2.5,0xd0c491);
  for(const x of [-1.4,0,1.4])b(x,3.8,.8,.4,.22,.35,0xe2c6ae);ring(.1,1.2,gold);
  b(0,.14,.75,1.2,.12,1.2,0xa3c5b5);for(const x of [-.4,.4]){b(x,.65,.75,.28,1,.3,0xb2d2c4);b(x,1.2,.75,.15,.2,.15,ivory);}break;
 }
 return out;
}
