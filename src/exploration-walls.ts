import type {Block} from './region-layout';

// Base rock, exposed face, themed cap. Broad strata replace voxel noise.
const palettes=[
 [0x77856c,0xa5ab8b,0x799853], [0x8d8298,0xc8a787,0xe4c268],
 [0x607f89,0x93b8b1,0xd09eaf], [0x41444e,0x66616a,0xb47750],
 [0x635d69,0x92817c,0x718375], [0x394759,0x65778c,0x83b5bd],
 [0x9f7951,0xc4a474,0xe1c391], [0x667365,0x919879,0x638a56],
 [0x514960,0x8a7d91,0xc1a680], [0x9d9eab,0xd3d4cc,0xe4d5ac],
 [0x586876,0x8a9e9f,0x9fba8e], [0x786652,0xab9272,0xc6aa78],
 [0x6c9ba9,0xa0c6d3,0xe1ece8], [0x95859f,0xc4b3c8,0xe8d8c4],
 [0x5e665c,0x93958a,0xa68364], [0x6d7652,0x9b9472,0x92ae69],
 [0x555f68,0x919796,0xb99b64], [0x676279,0xa2a0b7,0xd2c9c3],
 [0x393544,0x6d657d,0xa9a1ba], [0x737b62,0xa5ac8d,0xd7c9a5],
];
/** Irregular buttresses, recessed gullies and rear peaks leave x=±12.5 clear. */
export function explorationWalls(stage:number,length:number):Block[]{
 const out:Block[]=[],[rock,face,cap]=palettes[stage-1];
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,solid=true)=>out.push({x,y,z,w,h,d,c,solid});
 for(const side of [-1,1])for(let start=0,index=0;start<length;start+=3,index++){
  const depth=Math.min(3,length-start),z=-6-start-depth/2;
  const wave=(Math.sin(index*.69+stage*1.7+side*2)+1)/2;
  const noise=((index*17+stage*11+(side+1)*7)%13)/12;
  const inset=Math.round((wave*1.6+noise*.6)*4)/4;
  const edge=12.5+inset,width=18-edge;
  const h=2.8+Math.round((wave*2.3+noise*.8)*4)/4;
  // The broad silhouette undulates in plan as well as elevation. No new road obstacles.
  b(side*(edge+width/2),.75,z,width,1.5,depth,rock);
  b(side*(edge+.4+(width-.8)/2),1.5+(h-1.5)/2,z,width-.8,h-1.5,depth,face);
  b(side*(edge+1.7),h+.12,z,2.2,.24,depth,cap);
  const x=side*(edge+1.6);
  // Wide low talus, a projecting shoulder and a taller rear ridge form each cluster.
  if(index%2===0){
   b(side*(12.5+inset*.4+.65),.48,z+.15,1.3,.96,depth*.7,rock);
   b(side*(edge+.35),1.7,z-.15,.7,1.3,depth*.6,face);
  }
  const peak=h+1.3+wave*1.8;
  b(side*18.3,peak*.5,z,3.6,peak,depth,rock);
  if(index%3!==1){
   b(side*(18.2+noise*.6),peak+.45,z,2.1,.9,depth*.8,face);
   b(side*(18.5+noise*.5),peak+1.03,z,1.1,.26,depth*.55,cap);
  }
  if([1,8,16,20].includes(stage)){
   // Turf shelves and thick roots emerging from the canyon rock.
   if(index%2===0){b(x,h+.35,z,2.2,.5,1.9,cap);b(side*(edge+.3),1.15,z,.38,1.8,.65,stage===16?0x8f7954:0x79644e);}
   if(stage===16&&index%3===0){b(x,h+.8,z,.45,1,.5,0xd7c9a4);b(x,h+1.3,z,1.6,.4,1.5,0xc39484);}
  }else if(stage===2){
   b(x,h+.5,z,1.9,.75,2,index%2?0xb58179:0x7ca4b0);
   for(const dz of [-.5,.5])b(x,h+.93,z+dz,.55,.15,.55,cap);
  }else if(stage===3){
   if(index%2===0){b(x,h+.6,z,.5,1.2,.5,cap);b(x+side*.4,h+.8,z,1.2,.35,.5,cap);b(x,h+.3,z+.5,.4,.7,.4,0x9b83aa);}
  }else if(stage===4){
   b(x,h+.6,z,1,1.2,1.4,rock);if(index%3===0)b(side*(edge-.02),.85,z,.06,.6,.25,0xc38a57,false);
  }else if([5,9,10].includes(stage)){
   for(let row=0;row<3;row++)b(side*(edge+.05),.35+row*.6,z+(row%2?.25:0),.2,.08,depth-.4,rock,false);
   if(index%3===0)b(x,h+.4,z,1.1,.55,2.6,stage===9?0x696879:cap);
  }else if(stage===7){
   for(let row=0;row<3;row++)b(side*(edge+.15+row*.2),.65+row*.6,z,.35,.12,depth,cap,false);
   b(x,h+.3,z,2,.4,depth,face);
  }else if([6,11,12,17].includes(stage)){
   b(side*(edge+.2),1.3,z,.35,1.9,.38,cap);
   if(index%2===0){b(x,h+.5,z,1.8,.8,1.8,rock);b(side*(edge-.02),1.45,z,.07,.18,1.2,cap,false);}
   if(stage===12)b(side*(edge+.6),h+.5,z,.55,.55,depth,cap);
  }else if(stage===13){
   b(x,h+.6,z,1.1,1.3,1.4,face);b(x,h+1.3,z,.7,.2,1,cap);
  }else if(stage===14){
   b(x,h+.45,z,2.2,.65,2.4,cap);b(x,h+.82,z,1.5,.12,1.8,face);
  }else if(stage===15){
   b(x,h+.4,z,1.5,.7,1.8,rock);if(index%3===0)b(x,h+.9,z,.6,.3,.65,0x8ea264);
  }else if(stage===18){
   b(x,h+.3,z,1.8,.5,2,face);if(index%3===0)b(side*(edge-.02),1,z,.06,.3,.8,cap,false);
  }else if(stage===19){
   b(x,h+.65,z,.8,1.3,1.6,rock);b(side*(edge-.02),1.2,z,.06,.8,.13,cap,false);
  }
 }
 return out;
}
