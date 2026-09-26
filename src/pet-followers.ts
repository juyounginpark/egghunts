import * as T from 'three';
import {animateEgg} from './visuals';
import {animatePet} from './pet-animation';
import {MONGLES} from './data';
import {explorationHeight} from './exploration-route';

/** Shared local/remote trail spacing and articulated companion animation. */
export function followPets(companions:T.Group,trail:T.Vector3[],position:T.Vector3,facing:{x:number;z:number},dt:number,time:number,low:boolean,reducedMotion:boolean,maxSize=Infinity){
    const here = new T.Vector3(position.x, 0, position.z);
    if (!trail.length || trail[0].distanceTo(here) > 10) {
      trail = Array.from({ length: 500 }, (_, i) =>
        here.clone().add(new T.Vector3(-facing.x*i*.1,0,-facing.z*i*.1)),
      );
    }
    if (trail[0].distanceTo(here) > 0.08) {
      trail.unshift(here);
      trail.length = Math.min(700, trail.length);
    }
    let followerDistance=0;
    companions.children.forEach((pet, i) => {
      const natural=MONGLES[pet.userData.petId].scale;
      const size=Math.max(.001,pet.userData.bodyWidth??1,pet.userData.bodyHeight??1,pet.userData.bodyDepth??1);
      pet.userData.followScale=Math.min(natural,pet.userData.petId>=100?3.2/Math.max(1,pet.userData.bodyWidth??1):Infinity,maxSize/size);
      pet.scale.setScalar(pet.userData.followScale);
      const radius=(p:T.Object3D)=>p.scale.x*Math.max(.6,(p.userData.bodyDepth??1)*.5);
      followerDistance+=Math.max(1.2,radius(pet))+(i?Math.max(.4,radius(companions.children[i-1])):.6);
      let length = 0,
        target = trail.at(-1)!;
      for (let j = 1; j < trail.length; j++) {
        length += trail[j].distanceTo(trail[j - 1]);
        if (length >= followerDistance) {
          const segment=trail[j].distanceTo(trail[j-1]);
          target = trail[j-1].clone().lerp(trail[j],1-(length-followerDistance)/(segment||1));
          break;
        }
      }
      target = target.clone();

      const delta = target.clone().sub(pet.position);
      delta.y = 0;
      const walking = delta.length() > 0.08;
      if (walking){const angle=Math.atan2(delta.x,delta.z),diff=Math.atan2(Math.sin(angle-pet.rotation.y),Math.cos(angle-pet.rotation.y));pet.rotation.y+=diff*(1-Math.exp(-dt*10));}
      if(pet.position.distanceTo(target)>15)pet.position.copy(target);
      pet.position.lerp(target, 1 - Math.exp(-dt * 12));
      pet.position.y = explorationHeight(pet.position.x,pet.position.z)+(walking ? Math.abs(Math.sin(time * 11 - i)) * 0.13 : 0);
      for (const [j, name] of ["left_leg", "right_leg"].entries()) {
        const leg = pet.getObjectByName(name);
        if (leg)
          leg.rotation.x = walking
            ? Math.sin(time * 11 - i) * (j ? -0.55 : 0.55)
            : 0;
      }
      pet.children
        .filter((c) => c.name === "wing")
        .forEach(
          (w, k) => (w.rotation.z = Math.sin(time * 10) * (k ? -0.3 : 0.3)),
        );
      animateEgg(pet,time,low);
      animatePet(pet,pet.userData.petId,time,walking,reducedMotion);
      const aura = pet.getObjectByName("aura");
      if (aura) aura.scale.setScalar(0.45 + Math.sin(time * 2 + i) * 0.025);
    });
    return trail;
}
