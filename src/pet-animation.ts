import type {Object3D} from 'three';

/** Small authored poses on the existing voxel pivot hierarchy; never move the root. */
export function animatePet(pet:Object3D,id:number,time:number,walking=false,reduced=false){
 if(id>=100&&id<320){animateStagePet(pet,id,time,walking,reduced);return;}
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

export const petPortraitAngle=(id:number)=>id>=100?([12,19].includes(id>=300?id-299:Math.floor((id-100)/10)+1)?-35:35):[32,26,-32,40,-30,28][id]??45;

/** One short greeting on hatch, layered over the same authored idle rig. */
export function greetPet(pet:Object3D,id:number,elapsed:number,reduced=false){
 if(reduced||id<100||elapsed<0||elapsed>2.4)return;
 const slot=id>=300?10:(id-100)%10,pulse=Math.sin(Math.PI*elapsed/2.4),double=Math.sin(elapsed*Math.PI*2)*pulse;
 const rotate=(part:string,x=0,y=0,z=0)=>{const p=pet.getObjectByName(part);if(p){p.rotation.x+=x;p.rotation.y+=y;p.rotation.z+=z;}};
 rotate('head',-(slot===1?-.16:.13)*pulse,slot===8?.35*pulse:0,slot===3?.12*double:0);
 if([0,7,9,10].includes(slot)){rotate('left_arm',0,0,.28*pulse);rotate('right_arm',0,0,-.28*pulse);}
 if(slot===1){const b=pet.getObjectByName('body');if(b)b.scale.y*=1-.09*pulse;}
 if(slot===2)rotate('body',-.09*pulse);
 if(slot===3)rotate('tail',0,.3*double);
 if(slot===4)rotate('float',-.22*pulse);
 if(slot===5){rotate('left_leg',.18*double);rotate('right_leg',-.18*double);}
 if(slot===6)rotate('crown',0,.35*pulse);
}

function animateStagePet(pet:Object3D,id:number,time:number,walking:boolean,reduced:boolean){
 const stage=id>=300?id-299:Math.floor((id-100)/10)+1,slot=id>=300?10:(id-100)%10;
 const parts=pet.userData.stageParts??=Object.fromEntries(['body','head','eyes','left_ear','right_ear','left_arm','right_arm','left_leg','right_leg','tail','tail_1','tail_2','tail_3','left_tip','right_tip','crown','float'].map(n=>[n,pet.getObjectByName(n)]));
 for(const part of Object.values(parts) as (Object3D|undefined)[])if(part){const r=part.userData.restRotation??[0,0,0],s=part.userData.restScale??[1,1,1];part.rotation.set(r[0],r[1],r[2]);part.scale.set(s[0],s[1],s[2]);}
 if(reduced)return;
 const t=time*(.65+(stage%5)*.13)+slot*.43,weight=walking?.35:1;
 const wave=Math.sin(t),beat=Math.max(0,Math.sin(t*.7))**6;
 const pose=(name:string,x=0,y=0,z=0)=>{const p=parts[name];if(p){const r=p.userData.restRotation??[0,0,0];p.rotation.set(r[0]+x*weight,r[1]+y*weight,r[2]+z*weight);}};
 // Environment cadence: stepped mechanisms, drifting water, delayed void parts.
 const cadence=[2,7,18].includes(stage)?Math.round(wave*3)/3:[3,5,12,19,20].includes(stage)?Math.sin(t*.65):wave;
 if(slot===0)pose('head',-.06*cadence,.14*Math.sin(t*.6));
 if(slot===1){pose('left_ear',beat*.19,0,beat*.12);pose('right_ear',-beat*.11,0,-beat*.14);pose('head',.08*beat);}
 if(slot===2){pose('body',.035*cadence,0,.03*wave);pose('head',.1*beat);}
 if(slot===3){pose('tail',.05*wave,.22*cadence);pose('left_arm',.09*wave,0,.1*beat);pose('head',0,.18*wave,.045*wave);}
 if(slot===4){pose('float',.1*cadence,.1*Math.sin(t*.4));pose('head',-.06*wave);}
 if(slot===5){pose('left_leg',.1*wave);pose('right_leg',-.1*wave);pose('head',0,.08*cadence);}
 if(slot===6){pose('tail',0,.2*beat,.06*wave);pose('head',0,0,.09*cadence);}
 if(slot===7){pose('left_arm',0,.12*wave,.1*beat);pose('right_arm',0,-.12*wave,-.1*beat);pose('head',-.04*beat);}
 if(slot===8){pose('head',0,.3*beat);pose('tail',0,-.14*wave);pose('left_arm',.06*wave,0,.17*cadence);pose('right_arm',-.06*wave,0,-.17*cadence);}
 if(slot===9||slot===10){pose('left_arm',.05*wave,0,.13*cadence);pose('right_arm',-.05*wave,0,-.13*cadence);pose('tail',0,.12*Math.sin(t*.6));pose('head',-.06*beat,.08*wave);}
 pose('crown',.05*cadence,slot===6?.18*beat:0,stage===1?.07*wave:0);
 pose('float',.06*Math.sin(t*.6-.8),.08*Math.sin(t*.4-.8),stage===20?.08*Math.sin(t-1):0);
 for(let i=1;i<=3;i++)pose(`tail_${i}`,0,.07*Math.sin(t*.85-i*.65));
 pose('left_tip',0,.05*Math.sin(t-.6),.045*cadence);pose('right_tip',0,-.05*Math.sin(t-.6),-.045*cadence);
}
