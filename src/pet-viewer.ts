import * as T from 'three';
import {loadVoxels,voxelModel} from './voxel';
import {animatePet,petPortraitAngle} from './pet-animation';
import {MONGLES} from './data';

/** A single transient renderer, lazy-loaded only when inspecting a pet. */
export async function openPetViewer(id:number){
 if(!MONGLES[id]||document.querySelector('.pet-viewer'))return;
 const previous=document.activeElement as HTMLElement|null;
 const dialog=document.createElement('dialog');dialog.className='pet-viewer';
 dialog.innerHTML=`<header><h2>${MONGLES[id].name}</h2><button aria-label="닫기" class="viewer-close">×</button></header><div class="pet-viewport" aria-label="펫 3D 모델"></div><div class="pet-views">${['45°','정면','측면','후면'].map((v,i)=>`<button data-view="${i}" aria-pressed="${i===0}">${v}</button>`).join('')}</div><button class="viewer-motion" aria-pressed="false">동작 멈춤</button>`;
 document.body.append(dialog);dialog.showModal();
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 let renderer:T.WebGLRenderer|undefined,frame=0,closed=false,playing=true;
 const cleanup=()=>{if(closed)return;closed=true;cancelAnimationFrame(frame);renderer?.dispose();renderer?.forceContextLoss();dialog.remove();previous?.focus();};
 dialog.addEventListener('close',cleanup);dialog.querySelector('.viewer-close')!.addEventListener('click',()=>dialog.close());
 try{
  await loadVoxels([`pet-${id}`]);if(closed)return;
  renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const host=dialog.querySelector<HTMLElement>('.pet-viewport')!;host.append(renderer.domElement);
  const scene=new T.Scene(),model=voxelModel(`pet-${id}`,true);scene.add(model,new T.HemisphereLight(0xfffaed,0x79836a,2.4));
  const light=new T.DirectionalLight(0xfff4dd,2.6);light.position.set(-3,6,5);scene.add(light);
  const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
  const camera=new T.OrthographicCamera(),extent=Math.max(size.x,size.y,size.z)*.78;
  const view=(index:number)=>{const a=[model.userData.previewAngle??petPortraitAngle(id),0,90,180][index]*Math.PI/180;camera.position.set(center.x+Math.sin(a)*4,center.y+(index===0?1:0.2),center.z+Math.cos(a)*4);camera.lookAt(center);dialog.querySelectorAll('[data-view]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));};view(0);
  dialog.querySelectorAll<HTMLElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>view(Number(b.dataset.view))));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');playing=!reduced.matches;
  const motion=dialog.querySelector<HTMLButtonElement>('.viewer-motion')!;
  const label=()=>{motion.textContent=playing?'동작 멈춤':'동작 보기';motion.setAttribute('aria-pressed',String(!playing));};label();
  motion.onclick=()=>{playing=!playing;label();};
  let time=0,last=performance.now();
  const render=(now:number)=>{if(closed)return;frame=requestAnimationFrame(render);const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden)return;if(playing)time+=dt;animatePet(model,id,time,false,reduced.matches);const w=host.clientWidth,h=host.clientHeight;if(renderer!.domElement.width!==Math.round(w*renderer!.getPixelRatio())||renderer!.domElement.height!==Math.round(h*renderer!.getPixelRatio()))renderer!.setSize(w,h);const aspect=w/h;camera.left=-extent*aspect;camera.right=extent*aspect;camera.top=extent;camera.bottom=-extent;camera.near=.01;camera.far=20;camera.updateProjectionMatrix();renderer!.render(scene,camera);};render(last);
 }catch{renderer?.dispose();dialog.querySelector('.pet-viewport')!.textContent='모델을 불러오지 못했어요. 닫고 다시 시도해 주세요.';}
}
