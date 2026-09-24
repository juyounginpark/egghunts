import type {Object3D} from 'three';

/** Small authored poses on the existing voxel pivot hierarchy; never move the root. */
export function animatePet(pet:Object3D,id:number,time:number,walking=false,reduced=false){
 if(id<0||id>5)return;
 const parts=pet.userData.idleParts??=Object.fromEntries(['body','head','left_ear','right_ear','tail','eyes'].map(n=>[n,pet.getObjectByName(n)]));
 for(const part of Object.values(parts) as (Object3D|undefined)[])if(part){part.rotation.set(0,0,0);part.scale.set(1,1,1);}
 if(reduced)return;
 const t=time+id*.7,soft=walking?.35:1;
 const turn=(name:string,x=0,y=0,z=0)=>{parts[name]?.rotation.set(x*soft,y*soft,z*soft);};
 const pulse=(period:number,center:number,width:number)=>{const d=(t%period)-center;return Math.exp(-d*d/width);};
 if(id===0){turn('head',-.07-.06*Math.sin(t*1.3),.1*Math.sin(t*.7));turn('left_ear',0,0,.12*Math.sin(t*2));turn('right_ear',0,0,-.12*Math.sin(t*2+.8));}
 if(id===1){const twitch=pulse(5,2,.07);turn('left_ear',twitch*.2,0,twitch*.14);turn('right_ear',twitch*-.15,0,-twitch*.18);if(parts.body)parts.body.scale.y=1-.045*pulse(5,2.3,.25)*soft;turn('head',.1*pulse(5,2.3,.3));}
 if(id===2){turn('tail',0,.18*Math.sin(t*1.7),.08*Math.sin(t*1.7));turn('head',0,-.32*pulse(6,3,1),-.06);}
 if(id===3){turn('head',0,.16*Math.sin(t*.8));turn('tail',.04*Math.sin(t),.18*Math.sin(t*.65));}
 if(id===4){turn('head',-.03,.2*Math.sin(t*.65),.035*Math.sin(t));turn('tail',0,.08*Math.sin(t),-.1*pulse(5,3,.6));}
 if(id===5){const doze=pulse(7,4,2),wake=pulse(7,5.8,.1);turn('body',0,0,.025*Math.sin(t*.8));turn('head',doze*.11-wake*.09);if(parts.eyes)parts.eyes.scale.y=1-doze*.5+wake*.5;}
}

export const petPortraitAngle=(id:number)=>[32,26,-32,40,-30,28][id]??45;
