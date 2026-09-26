import type {Object3D} from 'three';

/** Opt-in poses for the appended models; legacy animation and materials stay intact. */
export function animateExpansionPet(pet:Object3D,time:number,walking:boolean,reduced:boolean){
 const parts:Object3D[]=pet.userData.expansionParts??=(()=>{
  const result:Object3D[]=[];
  pet.traverse(part=>{if(part.userData.restRotation){part.userData.expansionPosition=part.position.clone();result.push(part);}});
  return result;
 })();
 for(const part of parts){
  const r=part.userData.restRotation,s=part.userData.restScale;
  part.rotation.set(r[0],r[1],r[2]);part.scale.set(s[0],s[1],s[2]);part.position.copy(part.userData.expansionPosition);
 }
 if(reduced)return;
 const t=time*.72+(pet.userData.petId-321)*.31,w=walking?.3:1,beat=Math.max(0,Math.sin(t*.75))**4;
 // One main gesture, with delayed appendage follow-through instead of every
 // part oscillating independently. Locomotion remains a separate leg cycle.
 const gesture=Math.sin(t*.75)*beat,follow=Math.sin((t-.35)*.75)*Math.max(0,Math.sin((t-.35)*.75))**4;
 const motion=pet.userData.artMotion as string,form=pet.userData.artForm as string;
 for(const part of parts){
  const name=part.name,index=Number(name.match(/_(\d+)$/)?.[1]??0),phase=t-index*.5;
  if(name==='head'){part.rotation.y+=gesture*.09*w;part.rotation.x+=beat*.08*w;}
  if(name==='eyes')part.scale.y*=1-.85*Math.exp(-((t%5.7-5.1)**2)/.006);
  if(name.includes('ear'))part.rotation.z+=follow*(name.startsWith('left')?1:-1)*.045*w;
  if(name.startsWith('tail')||name==='trunk'||name==='neck'||name.startsWith('abdomen_'))part.rotation.y+=follow*.055*w;
  if(name.startsWith('plate_')||name.startsWith('feather_'))part.rotation.x+=follow*.04*w;
  if(name.startsWith('arm_'))part.rotation.x+=gesture*.08*w;
  if(name.includes('leg'))part.rotation.x+=Math.sin(t*(walking?9:1)+index*.8)*(walking?.35:.03)*(name.startsWith('left')?1:-1);
  if(name.endsWith('_arm')||name.endsWith('_tip')){
   const sign=name.startsWith('left')?1:-1;
   part.rotation.z+=(name.endsWith('_tip')?follow:gesture)*sign*(['butterfly','moth','bird','bat','phoenix','griffin','queen','peacock'].includes(form)?.13:.06)*w;
  }
  if(name==='prop'){part.rotation.x+=beat*-.1*w;part.rotation.z+=gesture*.035*w;}
  if(name==='crest'||name==='mane'||name==='shell')part.rotation.z+=follow*.025*w;
  if(name==='token')part.position.y+=beat*.08*w;
  if(['wheel','paddlewheel','saw','vane','millstone','gramophone','carousel','coils','orbit','armillary','planet','satellites','dish'].includes(motion)&&['prop','token','crest'].includes(name))part.rotation.y+=t*.25;
  if(['clock','starclock','barometer','gauge','pendulum','yo-yo'].includes(motion)&&name==='token')part.rotation.z+=Math.sin(t)*.65*w;
  if(['frog','toad','puffer','slime','cloud'].includes(form)&&name==='body')part.scale.y*=1+.035*Math.sin(t)*w;
  if(['equalizer','radiator','compressor','bellows','suction','footpads','balloonfeet','cloudwheels'].includes(motion)&&name.startsWith('plate_'))part.scale.y*=1+.2*Math.sin(phase)*w;
  if(['flower','umbrella','parasol','candyumbrella','palace','petalshield','throne','resonators'].includes(motion)&&['crest','prop'].includes(name))part.scale.x*=1-.08*beat*w;
  if(['broken','segmented','hollowspiral','seals','split'].includes(motion)&&name!=='head'&&name!=='eyes')part.rotation.y+=Math.sin(phase-.8)*.04*w;
 }
}
