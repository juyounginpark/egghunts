import type {Block,Motion} from './region-layout';
import {STAGES} from './stage-data';
import {terrainAt,routePoint,routeLength,shortcut,EXPLORATION_MAPS} from './exploration-route';

/** Walkable surfaces and their solid edges share the same authored footprint. */
export function explorationLayout(stage:number,sculpture:(stage:number,variant:number)=>Block[]){
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
 const stamp=(variant:number,x:number,z:number,scale:number)=>{
  for(const p of sculpture(stage,variant))blocks.push({...p,x:x+p.x*scale,y:p.y*scale,z:z+p.z*scale,w:p.w*scale,h:p.h*scale,d:p.d*scale,solid:true});
 };
 // Distinct silhouettes inherited from each biome, kept off the walking lanes.
 for(const [i,t] of [.06,.18,.5,.72,.96].entries()){
  const p=routePoint(stage,t);stamp(i%3,i%2?-12:12,p.z,i===3?2.6:1.3);
 }
 const nest=routePoint(stage,.94),boss=routePoint(stage,.73),troll=routePoint(stage,.35),entrance=routePoint(stage,.04);
 const post=(x:number,z:number,h=2,c=s.color)=>b(x,h/2,z,.6,h,.6,c,true);
 const arch=(z:number,c=s.color)=>{for(const x of [-8,8])post(x,z,3,c);b(0,3.15,z,16.6,.6,.8,c);};
 const roof=(z:number,c=s.color)=>{for(let j=0;j<4;j++)b(0,3+j*.3,z,15-j*2,.35,4-j*.5,c);};
 const tree=(z:number,c=0x8baa73)=>{
  for(const x of [-8,8]){b(x,1.5,z,1.2,3,1.2,0x886b50,true);for(let j=0;j<3;j++){const p={x:x+(x>0?-1:1)*j*.6,y:2.5+j*.7,z,w:2,h:1,d:2,c};blocks.push({...p,roll:x>0?.35:-.35});}b(x,4.7,z,4,1.3,3,c);}
 };
 // Landmark construction differs in geometry, not only palette.
 switch(stage){
 case 1: tree(boss.z-3);for(const x of [-7,7])b(x,.25,nest.z,1.2,.5,4,0x8b7357,true);break;
 case 2: arch(boss.z);for(const x of [-8,8]){b(x,2,boss.z,2,4,2,0xc89083,true);for(const dx of [-.6,.6])b(x+dx,4.3,boss.z,.55,.6,2,0xe1c573);}break;
 case 3: for(const x of [-9,9])for(let j=0;j<4;j++){b(x+(x>0?-1:1)*j*.55,1+j*.5,boss.z,1,2,.9,j%2?0xc994b7:0xe0b2b2);blocks[blocks.length-1].roll=(x>0?1:-1)*.35;}break;
 case 4: for(const x of [-8,8]){b(x,1.6,boss.z,3,3.2,3,0x514b50,true);b(x,3.8,boss.z,1.1,2,1.1,0x69616b);b(x,1.2,boss.z+1.52,1.8,1.5,.08,0xeaa063);}break;
 case 5: arch(boss.z,0x827762);b(0,3.4,boss.z,2,2,.5,0xdccaaa);b(0,3.6,boss.z+.3,.12,.6,.1,0x514b49);b(.3,3.3,boss.z+.3,.7,.12,.1,0x514b49);break;
 case 6: for(const x of [-9,9]){b(x,2,boss.z,2.5,4,3,0x465570,true);b(x,3,boss.z+1.55,1.6,1.3,.1,x<0?0x81c6c2:0xd39ecb);}break;
 case 7: for(const x of [-9,9])for(let j=0;j<5;j++)b(x,.4+j*.7,boss.z,5-j*.8,.7,5-j*.8,0xd3b883,true);break;
 case 8: tree(boss.z-2,0x779568);for(const x of [-8,8]){b(x,1.2,nest.z,2.8,2.4,2,0xd9d1b8,true);b(x,2.5,nest.z,2,.4,1.4,0xf0e7cd);}break;
 case 9: arch(boss.z,0x81798b);roof(boss.z,0x666680);for(const x of [-7,7])b(x,1.8,boss.z+1,1,.8,1,0xe3b281);break;
 case 10: for(const z of [boss.z,nest.z])for(const x of [-9,9]){post(x,z,3.5,0xe3dfcc);b(x,3.6,z,1.4,.3,1.4,0xd2bf8a);}roof(boss.z,0xdad7c8);break;
 case 11: for(const x of [-8,8]){b(x,1.3,boss.z,2,2.6,4,0x939e9d,true);b(x,2.7,boss.z,3,.4,5,0xb8c6c1);}b(0,3.4,boss.z,16,.6,4,0x7e8c90);break;
 case 12: arch(boss.z,0xb29469);for(const x of [-9,9]){b(x,3.4,boss.z,2,2,.7,0xd5bc87);b(x,3.6,boss.z+.4,.15,.7,.1,0x675b4d);}break;
 case 13: for(const x of [-9,9])for(let j=0;j<3;j++)b(x+(x>0?-1:1)*j*.5,1+j*.7,boss.z,1.5,2.2,2,0xafd0db,true);break;
 case 14: for(const x of [-8,8]){b(x,1.6,boss.z,3,3.2,3,0xc7aecd,true);b(x,3.4,boss.z,3.5,.7,3.5,0xe5d3dc);}break;
 case 15: arch(boss.z,0x80918a);tree(nest.z,0x88a778);for(const x of [-8,8])b(x,2,boss.z,1.5,3,3,0xa3b8af,true);break;
 case 16: tree(boss.z,0x8ba965);for(const x of [-8,8]){b(x,2,nest.z,.8,4,.8,0x91a361,true);for(let i=0;i<5;i++)b(x+Math.cos(i*1.256)*1.1,4,nest.z+Math.sin(i*1.256)*1.1,1.5,.5,1.5,0xe0b5b2);}break;
 case 17: for(const x of [-8,8]){b(x,1,boss.z,2,2,2,0x7d8990,true);b(x,2.6,boss.z,3,1.5,2,0x9a9e91);b(x,3.7,boss.z,1.7,.9,1.6,0xc4b17f);b(x,3.8,boss.z+.85,.8,.18,.1,0x92c4c4);}break;
 case 18: for(const x of [-8,8]){b(x,1.5,boss.z,2.5,3,3,0x9397b0,true);b(x,3.2,boss.z,3,.6,3.5,0xb7bad0);blocks.push({x,y:4,z:boss.z,w:1,h:1,d:4,c:0xd4c9aa,roll:.3});}break;
 case 19: for(const x of [-8,8]){b(x,2,boss.z,1.5,4,2,0x686277,true);b(x,4.2,boss.z,2,.5,2.5,0xbeb8c6);}b(0,4.3,boss.z,16,.8,2,0x777084);break;
 case 20: tree(boss.z,0x92a17b);tree(nest.z,0xaab28e);break;
 }
 // Entrance symbol, middle dragon traces, and a visible rear alcove entrance.
 for(const x of [-3,3]){post(x,entrance.z,1.2);b(x,1.3,entrance.z,.9,.25,.8,s.accent);}
 const trace=routePoint(stage,.57);for(let i=0;i<3;i++)b(trace.x+(stage%2?5:-5),.025,trace.z+i*.6,.4,.05,.3,s.accent);
 for(const x of [-9.5,9.5]){post(x,nest.z,1.4);b(x,1.55,nest.z,1.2,.25,1,s.accent);}
 // Ground-level details keep the representative platform legible at low camera angles.
 for(let j=-2;j<=2;j++){const x=troll.x+j*.55;b(x,terrainAt(stage,x,troll.z).height+.04,troll.z,.4,.08,.5,stage===4?0x8e969b:s.accent);}
 const gate=shortcut(stage);
 if(gate){
  const color=stage===5?0x8c715b:stage===8?0x88694f:stage===14?0xc8b3d1:0x8e9693;
  b(gate.x,.75,gate.z,1.2,1.5,4,color,true);blocks[blocks.length-1].gate=stage;
  for(let i=0;i<3;i++){b(gate.x,.35+i*.4,gate.z+.7,1.3,.13,2.4,s.accent);blocks[blocks.length-1].gate=stage;}
 }
 if(stage===20)b(0,.4,-6-length,27,.8,1,s.color,true);
 return {blocks,motions,title:EXPLORATION_MAPS[stage-1][2]};
}
