import {ExplorerGeometry} from './explorer-geometry';

/** Fixed rig coordinates in eighteenth-of-a-world-unit blocks. +Z is the face. */
export function explorerHair(g:ExplorerGeometry,style:number,hat:number,hair:string,accent:string){
 const b=g.box.bind(g),covered=[1,2,3,4,5,6,11].includes(hat);
 if(hat===11)style=12;
 // Continuous scalp under the silhouette. Previously the crown and lower locks
 // were separated, exposing a skin stripe and an almost bald rear view.
 b(0,3.8,-4.55,style===12?10.1:10.6,5.8,style===12?.45:1.3,hair);
 for(const s of [-1,1])b(s*5,5.2,-.45,style===12?.4:1.15,2.6,8.1,hair);
 const crown=(height:number,width=10.6)=>{b(0,6.8,0,width,covered?1.2:height,9.6,hair);if(!covered&&height>1.6)b(0,7.2+height/2,0,width-2,.6,7.6,hair);};
 const fringe=(x:number,w:number,y=5.8,h=1.3)=>b(x,y,4.55,w,h,1.15,hair);
 // Long locks stay outside the shoulder/pack corridor; no sheet down the back.
 const locks=(bottom:number,width:number)=>{for(const s of [-1,1]){
  const jaw=Math.max(.8,bottom);b(s*5.1,(6.6+jaw)/2,-.6,width,6.6-jaw,7.4,hair);
  if(bottom<.8)b(s*4.9,(.8+bottom)/2,-4.8,Math.min(width,1.5),.8-bottom,1.2,hair);
 }};
 switch(style){
  case 0:crown(1.5);fringe(-1.5,6.6);b(4.8,5,0,1,2,7,hair);break;
  case 1:crown(2);fringe(0,9.8,5.5,2);fringe(-3,2,4.75,.6);break;
  case 2:crown(1.8);fringe(-2.9,4,5.9,1.8);fringe(2.6,4.6,6.35,1);break;
  case 3:crown(1.2);for(const [x,y,z,w,h,d]of [[-3.6,7.8,0,3.4,2.6,8],[0,8.5,-1,3.8,2.6,8],[3.7,7.7,0,3.4,2.6,8],[-3,5.7,4.5,3,2,1.5],[1,6,4.5,3.7,1.8,1.5]])if(!covered||y<7)b(x,y,z,w,h,d,hair);locks(3,1.7);break;
  case 4:crown(1.8);fringe(0,9.5);locks(.2,1.5);b(0,2.5,-4.8,10,6,1.2,hair);break;
  case 5:crown(1.5);fringe(-3,3.8);locks(-3,1.4);b(0,3.8,-4.8,10,3.4,1.1,hair);break;
  case 6:crown(1.5);fringe(0,8.8);for(const s of [-1,1]){b(s*6.3,4.1,-2.8,2.2,2,2.8,accent);b(s*7.2,1.7,-3.1,2.1,3.3,2.4,hair);b(s*7.7,-.3,-3.4,1.5,.8,1.8,hair);}break;
  case 7:crown(1.2);fringe(-2.4,5);b(0,3.6,-5.2,2.5,1.2,2,accent);b(1,2.1,-5.5,3,2.3,2.4,hair);b(2.2,.85,-5.5,2,.4,2,hair);break;
  case 8:crown(1);fringe(0,8,6.3,.75);for(const s of [-1,1])b(s*4.8,4.5,-1,1,2.5,6,hair);break;
  case 9:crown(1.3);fringe(1.7,4.5);if(!covered){b(-3,8.2,0,2.5,2.8,6,hair);b(0,9,0,2.2,3.6,5,hair);b(2.8,8.3,0,2.2,2.4,6,hair);}break;
  case 10:crown(1.7);fringe(-3.2,3.6,5.4,2.3);fringe(.2,3,6,1.2);fringe(3,2.3,6.45,.6);break;
  case 11:crown(1.4);fringe(-1.6,6.5);b(0,6.8,-5.1,2.5,1.1,2,accent);b(1.1,5,-6,3,3.8,2.7,hair);b(2,2.3,-6.1,2.1,1.8,2,hair);break;
  case 12:b(0,6.6,-.2,10.2,.65,9.1,hair);break;
  case 13:crown(2,11);fringe(0,9.6,5.8,1.6);locks(.6,2.2);b(0,2.3,-4.9,10.5,5,1.5,hair);break;
  case 14:crown(1.5);fringe(-1.8,6);locks(1,1.5);for(const s of [-1,1]){b(s*5.6,.7,-1,2.6,1,6.8,hair);b(s*6.4,1.3,-1,1,.8,5.6,hair);}break;
  case 15:crown(1.5);fringe(0,9.5,5.5,2);locks(-1.2,1.6);b(0,2.4,-4.8,10,5.4,1.2,hair);break;
  case 16:crown(1.6);fringe(-3,3.8);for(const s of [-1,1]){b(s*5.1,3.4,-.8,1.8,4.3,7.5,hair);b(s*5.4,.1,-4.6,1.7,2.3,1.5,hair);b(s*4.9,-2,-4.9,1.3,2,1.2,hair);}break;
  case 17:crown(1.4);fringe(-1,7);locks(-1.2,1.6);b(0,5.5,-5.1,3.6,2.5,2,hair);b(0,5.2,-6.2,3,.8,.5,accent);break;
 }
}

export function explorerBackpack(g:ExplorerGeometry,pack:number,accent:string){
 const b=g.box.bind(g),leather='#947253',cream='#e8d9b1',dark='#536154';
 // Every bag has its own shell, not a common cuboid with an icon added.
 switch(pack){
  case 0:b(0,1.5,-4.15,5.8,4.6,1.9,leather);b(0,3.65,-4.6,6.2,1.1,2,cream);b(0,1.8,-5.25,1,3,.45,accent);b(0,.65,-5.53,1.3,.65,.3,'#d1b577');break;
  case 1:b(0,1.1,-4.6,5.2,5.6,2.8,'#72836a');b(0,4.05,-4.7,4.5,.5,2.6,cream);for(const s of [-1,1]){b(s*2.9,1,-4.6,1.2,3,2,leather);b(s*1.6,1.1,-6.1,.6,5,.35,accent);}b(0,-2.1,-4.8,7,1.9,2.6,'#bd976e');b(0,-2.1,-4.8,5.8,2.3,2, '#bd976e');for(const s of [-1,1])b(s*2,-2.1,-6.15,.6,2,.3,dark);break;
  case 2:b(0,.5,-4.5,5.5,2.6,2.6,'#b79761');b(0,2.2,-4.5,6.2,.8,2.9,accent);b(0,3.2,-4.5,4.8,1.2,2.5,cream);b(0,4.1,-4.5,3.1,.7,1.8,cream);for(const s of [-1,1])b(s*1.8,.5,-5.86,.5,2,.3,'#e0c997');break;
  case 3:b(0,1.4,-3.65,5.3,4.8,1,'#687c82');for(const s of [-1,1]){b(s*1.7,1.6,-4.9,2.4,4.6,2.4,'#d8ddd3');b(s*1.7,4.1,-4.9,1.7,.4,1.7,accent);b(s*1.7,-.85,-4.9,1.7,.5,1.7,'#9ba9aa');b(s*1.7,1.8,-6.15,2.4,.7,.25,accent);}break;
  case 4:b(0,.8,-4.2,6.1,3.5,2.1,'#758656');b(0,3,-4.3,4.4,1,2.3,'#a0b176');b(0,3.65,-4.3,2.7,.5,1.8,'#a0b176');b(0,1.6,-5.45,.65,2.2,.35,cream);break;
  case 5:b(-.6,1.4,-4.4,4.8,5,2.4,'#5b8796');b(-.6,4.1,-4.4,5.3,.8,2.6,cream);b(-.6,2,-5.7,.7,3.3,.3,accent);b(2.5,.4,-4.5,1.3,2.8,1.4,'#a7c7c0');b(2.5,2,-4.5,.8,.5,1,leather);break;
  case 6:b(0,1.2,-4.5,5.8,3.6,2.8,'#b79a7d');b(0,-.9,-4.5,4.4,.6,2.2,'#b79a7d');for(const s of [-1,1]){b(s*2,3.6,-4.3,1.7,1.3,1.8,'#b79a7d');b(s*2,3.6,-5.25,.7,.65,.2,'#c99080');b(s*1.25,1.6,-5.97,.5,.6,.25,dark);}b(0,.65,-6.03,.65,.4,.25,'#805e51');break;
  case 7:b(.7,.9,-3.9,3.7,3.4,1.5,accent);b(.7,2.7,-4.1,3.9,.6,1.8,cream);b(.7,.2,-4.78,2.4,1.1,.3,leather);break;
 }
 // Straps sit on the clothing surface with a clear depth, not inside the body.
 for(const s of [-1,1]){b(s*2.55,2.1,3.72,.65,4.5,.32,leather);b(s*2.55,4.3,.45,.65,.45,6.7,leather);}
}

export function explorerClothes(g:ExplorerGeometry,part:string,outfit:number,cloth:string,pants:string,skin:string,accent:string,neck:number){
 const b=g.box.bind(g),boot=[1,3,5,6,7,9,10].includes(outfit),cream='#e8dfc5',dark='#5b584a';
 if(part==='body'){
  // Original body includes a built-in backpack: replace the shell, never overlay it.
  const wide=outfit===9?8.5:8,depth=outfit===9?6.8:6;
  b(0,1.5,.5,wide,6,depth,cloth);
  const pocket=(x:number,y:number,w:number,h:number,c=accent,z=3.75)=>b(x,y,z,w,h,.5,c);
  switch(outfit){
   case 0:pocket(-2.05,2.6,2,1.7,'#bcb98d');b(0,3.8,3.65,.65,1.4,.3,accent);break;
   case 1:pocket(0,2.1,2.5,4.6,cream);for(const s of [-1,1]){pocket(s*2.45,.55,2.4,2,'#405d42');pocket(s*2.45,1.7,2.7,.5,accent);}break;
   case 2:pocket(0,3.55,7.6,1.3,'#d8b783');pocket(0,1.9,1.1,2.2,accent);pocket(1.9,-.1,2.8,1.3,'#906747');break;
   case 3:pocket(0,.35,7.6,3.5,pants);pocket(0,2.1,4.4,2.8,pants);for(const s of [-1,1]){pocket(s*1.8,3.6,.85,2.2,pants);pocket(s*1.8,2.9,.5,.5,cream,4.08);}pocket(0,1.2,2.4,1.2,accent,4.08);break;
   case 4:b(0,3.7,-2.25,6.8,1.7,2.3,cloth);pocket(0,.25,4.8,1.6,'#8c6262');b(0,-1.25,.5,8,.55,6,accent);break;
   case 5:b(0,-.3,.5,8.2,.75,6.2,dark);pocket(0,-.3,1.2,.9,cream,3.95);pocket(-2,2,2.7,2.5,accent);pocket(2.4,3,1.5,1,cream);break;
   case 6:b(0,-1.25,.5,8.7,1.2,6.6,cloth);pocket(.45,1.55,1.1,5.7,'#e7cc71');for(const y of [.4,2,3.6])pocket(.45,y,.4,.45,dark,4.07);pocket(-2.4,.3,2.2,1.3,accent);break;
   case 7:pocket(0,2,4.3,2.8,'#6a8088');pocket(-.7,2.3,1.5,.9,accent,4.1);pocket(1,1.7,.7,.7,cream,4.1);b(0,-1,.5,8.2,.8,6.2,'#85959b');break;
   case 8:for(const y of [-.2,1.1])pocket(0,y,7.8,.65,'#527d97');for(const s of [-1,1])pocket(s*2.25,3.45,2.8,1.6,'#527d97');if(!neck)pocket(0,2.7,.9,2,accent);break;
   case 9:for(const y of [-.35,1.6,3.55])b(0,y,.5,8.6,1.6,6.9,cloth);b(0,4.25,.5,8.7,.8,7,cream);pocket(0,1.2,.7,5.8,accent,4.18);break;
   case 10:b(0,-1.4,.5,8.2,1.3,6.2,cloth);pocket(0,1.2,1.7,5.8,cream);for(const s of [-1,1])pocket(s*2.4,-.5,2.4,1.8,'#9f8c64');break;
   case 11:pocket(-2,2,3.8,4.7,'#526674');pocket(0,1.55,.55,5.8,cream,4.06);pocket(2.1,.4,2.5,.65,accent);break;
   case 12:pocket(-2,2.8,3.8,3,'#789d9a');pocket(2,1.8,3.8,5,'#d4b967');b(0,-1.2,.5,8,.6,6,accent);break;
  }
  if(neck){
   const c=neck===1?'#b55f52':neck===2?'#597f9c':accent;
   // Front knot and narrow neck band stay below the head's lower face.
   b(0,4.25,3.9,5.6,neck===4?1.15:.65,.8,c);
   if(neck===5){b(0,3.1,4.4,.55,1.6,.3,cream);b(0,2.25,4.5,1.3,1.3,.45,'#cbaa64');}
   else if(neck===3){b(0,3.35,4.45,3.1,1,.4,c);b(0,2.65,4.45,1.5,.45,.4,c);}
   else{b(1.7,2.8,4.45,1.4,2.8,.5,c);b(1.7,1.3,4.45,1.4,.35,.5,cream);}
  }
 }else if(part.includes('arm')){
  b(.5,-1,-.5,2,3,4,cloth);
  if([0,3,8,12].includes(outfit))b(.5,-1.9,-.5,2,1.1,4,skin);
  else b(.5,-2.1,-.5,2.1,.55,4.1,accent);
  if(outfit===7||outfit===9)b(.5,-.1,-.5,2.3,1.2,4.3,outfit===7?cream:cloth);
 }else if(part.includes('hand'))b(.5,0,-.5,2,1,4,skin);
 else if(part.includes('leg')){
  b(0,-1,0,3,3,3,pants);
  if([0,2,4,8,12].includes(outfit))b(0,-1.85,0,3,1.3,3,skin);
  if(outfit===3||outfit===5)b(0,-.5,1.68,1.7,1.3,.35,accent);
 }else if(part.includes('foot')){
  const shoe=outfit===7||outfit===8?cream:outfit===6?'#647052':dark;
  b(0,-.5,1,3,1.5,5,shoe);b(0,-1.35,1,3.15,.3,5.15,outfit===8?'#c7c9b8':'#454a40');
  if(boot)b(0,.55,0,3.1,1.5,3.2,shoe);
  b(0,-.1,3.56,2.3,.55,.25,accent);
 }
}
