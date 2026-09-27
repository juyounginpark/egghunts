import type {Block,Motion} from './region-layout';
import {dioramaZones} from './diorama-zones';
import {explorationLandmark} from './exploration-landmarks';
import {terrainAt} from './exploration-route';

/** A room at toy scale: eight authored scenes, rather than separate prop rows. */
export function toyDioramas(){
 const paper=0xeee1be,wood=0x9c7554,dark=0x625775;
 return dioramaZones(2).map(q=>{
  q={...q,height:terrainAt(2,q.x,q.z).height};
  const blocks:Block[]=[],motions:Motion[]=[],red=q.side<0?0xbd786b:0x8196b5,yellow=q.side<0?0xd8b66e:0xb198bd;
  const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,angle=0,roll=0)=>blocks.push({x:q.x+x,y:q.height+y,z:q.z+z,w,h,d,c,angle,roll,solid:false});
  const gift=(x:number,z:number,s:number,c:number,y=0)=>{
   b(x,y+s*.5,z,s,s,s*.85,c);b(x,y+s+.08,z,s+.12,.16,s*.95,c);
   b(x,y+s+.18,z,s+.14,.055,.14,paper);b(x,y+s+.18,z,.14,.055,s*.95,paper);
   b(x,y+s*.5,z+s*.43,.14,s,.04,paper);
   for(const side of [-1,1])b(x+side*s*.16,y+s+.27,z,.3,.12,.18,paper,side*.35);
  };
  const brick=(x:number,y:number,z:number,w:number,c:number,angle=0)=>{
   b(x,y+.21,z,w,.42,.65,c,angle);
   for(let j=-1;j<=1;j++)if(Math.abs(j*.32)<w/2)b(x+j*.32,y+.47,z,.19,.1,.2,c);
  };
  const book=(x:number,y:number,z:number,w:number,c:number,angle=0)=>{
   b(x,y+.17,z,w,.24,1.35,paper,angle);for(const h of [.025,.315])b(x,y+h,z,w+.1,.055,1.45,c,angle);
   b(x-w*.48*Math.cos(angle),y+.17,z-w*.48*Math.sin(angle),.12,.28,1.4,c,angle);
  };
  const pencil=(x:number,y:number,z:number,length:number,c:number,lying=false,broken=false)=>{
   if(lying){b(x,y+.13,z,length,.18,.2,c,.22);b(x+length*.5,y+.13,z+length*.1,.25,.15,.18,paper,.22);if(!broken)b(x+length*.5+.14,y+.13,z+length*.1,.08,.1,.1,dark);}
   else {b(x,y+length/2,z,.22,length,.22,c);b(x,y+length+.14,z,.16,.28,.16,paper);if(!broken)b(x,y+length+.3,z,.08,.1,.08,dark);}
  };
  const sheet=(x:number,z:number,w=.6,angle=.2)=>{b(x,.025,z,w,.035,w*.7,paper,angle);b(x+w*.25,.055,z-w*.17,w*.23,.035,w*.2,0xd3be98,angle);};
  const pile=(x:number,z:number,count:number,w=2)=>{for(let j=0;j<count;j++)book(x+Math.sin(j*2)*.12,j*.36,z,w-j*.08,j%2?red:yellow,(j%3-1)*.12);};
  switch(q.index){
  case 0: // Wrapping scene: one large gift, two small gifts, loose ribbon.
   gift(-.3,0,1.55,red);gift(1.1,.85,.65,yellow);gift(-1.3,.85,.8,yellow);
   b(.6,.04,1.2,.15,.055,1.2,red,.55);b(.25,.05,1.4,.8,.05,.13,red,-.25);
   brick(-1.6,0,-.8,.65,red,.25);break;
  case 1: // Drawing table scraps sit across the color boundary.
   pencil(0,0,0,2.4,red,true);pencil(-.2,0,.6,1.3,yellow,true,true);pencil(.4,0,-.7,1.8,yellow,true);
   b(.8,.18,1.1,.7,.35,.4,paper,-.2);b(.9,.18,1.1,.3,.36,.41,red,-.2);
   for(let j=0;j<4;j++)b(-1+j*.24,.035,1.2,.12,.04,.07,paper);
   for(let j=0;j<3;j++)b(-.8+j*.25,.028,-1.2,.1,.025,.75,j%2?red:yellow,.35);break;
  case 2: // Fence, fort blocks and a bundle of pencils share one footprint.
   for(const x of [-1.4,-.5,.4]){b(x,.6,-.5,.14,1.2,.15,wood);b(x,.6,-.5,.9,.13,.12,wood);}
   brick(-.7,0,.2,1.3,red);brick(-.4,.43,.2,.65,yellow);brick(1,0,.6,.65,yellow,.35);
   for(let j=0;j<3;j++)pencil(.6+j*.3,0,-.7,1.8+j*.2,j%2?red:yellow);
   b(.9,.7,-.7,1,.12,.28,wood);break;
  case 3: // A crooked book mountain with a broad, low rug spilling underneath.
   b(-.8,.02,.15,3.2,.03,2.8,0xb49bb5,.08);b(-.8,.043,.15,2.85,.02,2.45,0xc5b2be,.08);
   pile(0,0,5,2.65);pile(-1.6,1,2,1.15);brick(1.3,0,.8,.7,red,.3);
   for(let j=0;j<4;j++)b(-2.4,.06,-.8+j*.5,.3,.035,.09,paper);break;
  case 4: // Train station, short decorative track and abandoned luggage.
   for(const x of [-.9,.9])b(x,.95,0,.2,1.9,.25,wood);
   for(let j=0;j<3;j++)b(0,2+j*.17,0,2.5-j*.55,.2,1.5-j*.25,red);
   b(0,1.55,.15,1.2,.45,.15,yellow);b(0,.45,.9,1.3,.6,.65,red);
   for(const x of [-.45,.45])for(const z of [.55,1.25])b(x,.2,z,.32,.32,.15,dark);
   for(const z of [.55,1.25])b(0,.03,z,2.7,.045,.08,wood);
   gift(-1.5,0,.6,yellow);break;
  case 5: // Tipped pencil cup, broken crayons and an open exercise book.
   b(.2,.45,-.5,.9,.85,.7,red,0,-.65);b(.65,.7,-.5,.12,.8,.75,yellow,0,-.65);
   for(let j=0;j<3;j++)pencil(-.7+j*.35,0,.2+j*.35,1.1+j*.35,j%2?red:yellow,true,j===1);
   book(0,0,1.2,1.3,yellow,-.2);b(.5,.42,1.2,.75,.1,1.2,paper,0,-.5);break;
  case 6: // Main block castle: 1.4x its previous authored size, on the terrace.
   for(const p of explorationLandmark(2))blocks.push({...p,x:q.x+p.x*1.4,y:q.height+p.y*1.4,z:q.z+p.z*1.4,w:p.w*1.4,h:p.h*1.4,d:p.d*1.4,solid:false});
   brick(-1.7,0,1.1,.7,red,.4);brick(1.7,0,1.2,.7,yellow,-.3);
   pencil(1.5,0,-.9,1.2,yellow,true,true);break;
  case 7: // Oversized open toy chest, with a lid hinged into the background.
   b(0,.18,0,3.8,.35,2.4,wood);
   for(const x of [-1.8,1.8])b(x,1.2,0,.25,2.2,2.4,red);
   for(const z of [-1.1,1.1])b(0,1.2,z,3.7,2.2,.22,red);
   b(1.7,2.8,0,.24,2.9,2.55,yellow,0,-.45);
   gift(-.6,-.1,.9,yellow,.35);brick(.65,.35,.1,.9,yellow);brick(.4,.8,.1,.65,red);
   pile(-1.3,1.8,3,1.4);break;
  }
  // Local clutter clings to a scene edge; empty spaces between scenes stay clean.
  for(let j=0;j<6;j++){
   const t=j*1.9+q.index*.4,x=Math.sin(t)*(1.2+j%2*.65),z=1.2+Math.cos(t)*.65;
   sheet(x,z,.35+(j%3)*.15,(j-2)*.19);
   if(j%2===0)brick(x*.8,0,z+.25,.35,j%3?red:yellow,t*.12);
  }
  // Two towering desk legs explain the scale of the room without crossing the path.
  if(q.index===4||q.index===7){
   const x=q.side*2.4;
   b(x,3.4,-1.7,.85,6.8,.85,wood);b(x,6.9,-1.7,2.6,.35,3.3,0xc2976c);
   b(x,1.05,-1.7,1.05,.18,1.05,0xb68d62);
  }
  if(q.index===4){const moving:Block[]=[{x:0,y:0,z:0,w:.1,h:.8,d:.1,c:wood,solid:false},{x:.28,y:.24,z:0,w:.55,h:.25,d:.08,c:yellow,solid:false}];motions.push({x:q.x,y:q.height+2.7,z:q.z,kind:'sway',phase:1,blocks:moving});}
  if(q.index===2){
   b(-1.4,1,-1.15,.12,2,.12,wood);
   const blades:Block[]=Array.from({length:4},(_,j)=>{const t=j*Math.PI/2;return {x:Math.cos(t)*.3,y:Math.sin(t)*.3,z:0,w:.4,h:.25,d:.08,c:j%2?red:yellow,roll:t,solid:false};});
   motions.push({x:q.x-1.4,y:q.height+2,z:q.z-1.15,kind:'windmill',phase:0,blocks:blades});
  }
  return {id:`toy-scene-${q.index}`,kind:['wrapping','drawing','pencil-fort','book-mountain','station','pencil-spill','block-castle','toy-chest'][q.index],blocks,motions};
 });
}
