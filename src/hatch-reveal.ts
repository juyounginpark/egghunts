import * as T from 'three';
import {loadVoxels,voxelModel} from './voxel';
import {animatePet,petPortraitAngle} from './pet-animation';
import {EGGS,MONGLES,petIcon} from './data';
import {eggIcon,type EggAppearance} from './stage-eggs';

/** Presentation only: ownership is already committed by claimHatch on the server. */
export function startHatchReveal(card:HTMLElement,id:number,egg:EggAppearance|undefined,onReveal:()=>void){
 const overlay=document.createElement('div');overlay.className='hatch-sequence';
 const appearance=egg??{type:Math.max(0,EGGS.findIndex(e=>e.tier===MONGLES[id].tier))};
 overlay.innerHTML=`<div class="hatch-egg"><img src="${eggIcon(appearance)}" alt="부화하는 알"/><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 15 40 38 57 47 44 64 56 86"/></svg></div><div class="hatch-pet"></div><p role="status">두근두근…</p><button class="secondary hatch-skip">건너뛰기</button>`;
 card.append(overlay);
 const host=overlay.querySelector<HTMLElement>('.hatch-pet')!,label=overlay.querySelector('p')!;
 let renderer:T.WebGLRenderer|undefined,frame=0,closed=false,model:T.Group|undefined,started=0,announced=false;
 const silhouette=new T.MeshBasicMaterial({color:0x242b22});
 const finish=()=>{if(closed)return;closed=true;cancelAnimationFrame(frame);renderer?.dispose();renderer?.forceContextLoss();silhouette.dispose();overlay.remove();card.classList.remove('hatch-revealing');if(!announced){announced=true;onReveal();}};
 overlay.querySelector('button')!.onclick=finish;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 void (async()=>{
  let scene:T.Scene|undefined,camera:T.OrthographicCamera|undefined,center=new T.Vector3();
  try{
   await loadVoxels([`pet-${id}`]);if(closed)return;
   renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
   scene=new T.Scene();model=voxelModel(`pet-${id}`,true);scene.add(model,new T.HemisphereLight(0xfffaed,0x79836a,2.4));
   const light=new T.DirectionalLight(0xfff4dd,2.6);light.position.set(-3,6,5);scene.add(light);
   const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());center=bounds.getCenter(new T.Vector3());
   const extent=Math.max(size.x,size.y,size.z)*.85;
   camera=new T.OrthographicCamera(-extent,extent,extent,-extent,.01,30);
  }catch{
   renderer?.dispose();renderer=undefined;host.innerHTML=`<img src="${petIcon(id)}" alt=""/>`;
  }
  if(closed)return;
  started=performance.now();
  const render=(now:number)=>{
   if(closed)return;if(!card.isConnected){finish();return;}
   const age=(now-started)/1000;
   const silhouetteAt=reduced?.4:2.2,colorAt=reduced?.8:3.2,endAt=reduced?1.2:4.8;
   overlay.dataset.phase=age<silhouetteAt?'egg':age<colorAt?'silhouette':'color';
   overlay.classList.toggle('cracking',age>(reduced?.2:1.3));
   if(age>=colorAt&&!announced){announced=true;onReveal();}
   label.textContent=age<silhouetteAt?'두근두근…':age<colorAt?'누구일까요?':MONGLES[id].name;
   if(scene&&camera&&renderer&&model){
    scene.overrideMaterial=age<colorAt?silhouette:null;
    const spin=reduced?0:Math.max(0,Math.min(1,(age-colorAt)/1.3))*Math.PI*2;
    const angle=petPortraitAngle(id)*Math.PI/180+spin;
    camera.position.set(center.x+Math.sin(angle)*5,center.y+1.1,center.z+Math.cos(angle)*5);camera.lookAt(center);
    const width=Math.max(1,host.clientWidth);if(renderer.domElement.width!==Math.round(width*renderer.getPixelRatio()))renderer.setSize(width,width);
    if(age>=colorAt)animatePet(model,id,age-colorAt,false,reduced);
    renderer.render(scene,camera);
   }
   if(age>=endAt){finish();return;}frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);
 })();
 return finish;
}
