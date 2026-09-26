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
/** Continuous solid skirts with stepped-back rock masses keep the playable width. */
export function explorationWalls(stage:number,length:number):Block[]{
 const out:Block[]=[],[rock,face,cap]=palettes[stage-1];
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,solid=true)=>out.push({x,y,z,w,h,d,c,solid});
 for(const side of [-1,1])for(let start=0,index=0;start<length;start+=3,index++){
  const depth=Math.min(3,length-start),z=-6-start-depth/2;
  const rise=(index*7+stage*3)%5;
  const h=2.4+rise*.28+(side<0?.7:0);
  // All footprints start outside x=12.5; landing and return paths stay inside.
  b(side*14,1,z,3,2,depth,rock);
  b(side*14.5,2+(h-2)/2,z,3,h-2,depth,face);
  b(side*16.3,h*.5,z,2.8,h+1.2,depth,rock);
  b(side*14.6,h+.12,z,2.7,.24,depth,cap);
  const x=side*14.3;
  if([1,8,16,20].includes(stage)){
   // Turf shelves and thick roots emerging from the canyon rock.
   if(index%2===0){b(x,h+.35,z,2.2,.5,1.9,cap);b(side*12.8,1.15,z,.38,1.8,.65,stage===16?0x8f7954:0x79644e);}
   if(stage===16&&index%3===0){b(x,h+.8,z,.45,1,.5,0xd7c9a4);b(x,h+1.3,z,1.6,.4,1.5,0xc39484);}
  }else if(stage===2){
   b(x,h+.5,z,1.9,.75,2,index%2?0xb58179:0x7ca4b0);
   for(const dz of [-.5,.5])b(x,h+.93,z+dz,.55,.15,.55,cap);
  }else if(stage===3){
   if(index%2===0){b(x,h+.6,z,.5,1.2,.5,cap);b(x+side*.4,h+.8,z,1.2,.35,.5,cap);b(x,h+.3,z+.5,.4,.7,.4,0x9b83aa);}
  }else if(stage===4){
   b(x,h+.6,z,1,1.2,1.4,rock);if(index%3===0)b(side*12.48,.85,z,.06,.6,.25,0xc38a57,false);
  }else if([5,9,10].includes(stage)){
   for(let row=0;row<3;row++)b(side*12.55,.35+row*.6,z+(row%2?.25:0),.2,.08,depth-.4,rock,false);
   if(index%3===0)b(x,h+.4,z,1.1,.55,2.6,stage===9?0x696879:cap);
  }else if(stage===7){
   for(let row=0;row<3;row++)b(side*(12.65+row*.2),.65+row*.6,z,.35,.12,depth,cap,false);
   b(x,h+.3,z,2,.4,depth,face);
  }else if([6,11,12,17].includes(stage)){
   b(side*12.7,1.3,z,.35,1.9,.38,cap);
   if(index%2===0){b(x,h+.5,z,1.8,.8,1.8,rock);b(side*12.48,1.45,z,.07,.18,1.2,cap,false);}
   if(stage===12)b(side*13.1,h+.5,z,.55,.55,depth,cap);
  }else if(stage===13){
   b(x,h+.6,z,1.1,1.3,1.4,face);b(x,h+1.3,z,.7,.2,1,cap);
  }else if(stage===14){
   b(x,h+.45,z,2.2,.65,2.4,cap);b(x,h+.82,z,1.5,.12,1.8,face);
  }else if(stage===15){
   b(x,h+.4,z,1.5,.7,1.8,rock);if(index%3===0)b(x,h+.9,z,.6,.3,.65,0x8ea264);
  }else if(stage===18){
   b(x,h+.3,z,1.8,.5,2,face);if(index%3===0)b(side*12.48,1,z,.06,.3,.8,cap,false);
  }else if(stage===19){
   b(x,h+.65,z,.8,1.3,1.6,rock);b(side*12.48,1.2,z,.06,.8,.13,cap,false);
  }
 }
 return out;
}
