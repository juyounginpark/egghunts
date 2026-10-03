import * as T from 'three';
import {loadVoxels,voxelModel} from './voxel';
import {applyExplorerAppearance,disposeExplorerAppearance} from './explorer-model';
import {APPEARANCE_OPTIONS,EXPLORER_PRESETS,normalizeAppearance,randomAppearance,type ExplorerAppearance,type AppearanceKey} from './explorer-appearance';

export class ExplorerEditor{
 appearance:ExplorerAppearance;
 private renderer:T.WebGLRenderer|null=null;private scene=new T.Scene();private camera=new T.PerspectiveCamera(30,1,.1,30);private rig:T.Group|null=null;
 private frame=0;private disposed=false;private observer:ResizeObserver;private category='피부';
 private groups:Record<string,AppearanceKey[]>={'피부':['skinId'],'얼굴':['faceId'],'머리':['hairId','hairColorId'],'옷':['outfitId'],'색상':['accentColorId'],'장식':['accessoryId','backpackId']};
 constructor(private root:HTMLElement,value:unknown,private changed:(a:ExplorerAppearance)=>void=()=>{}){
  this.appearance=normalizeAppearance(value);
  root.innerHTML='<div class="explorer-preview" aria-label="탐험가 3D 미리보기"></div><small class="preview-help">좌우로 드래그해 돌려보세요</small><div class="explorer-presets" aria-label="추천 스타일"></div><div class="explorer-tabs" role="tablist" aria-label="꾸미기 항목"></div><div class="explorer-options" role="tabpanel"></div><button type="button" class="secondary explorer-random">전체 랜덤</button><small class="explorer-note">외형은 게임에서 언제든 다시 변경할 수 있어요.</small>';
  const presets=root.querySelector('.explorer-presets')!;
  for(const p of EXPLORER_PRESETS){const b=document.createElement('button');b.type='button';b.textContent=p.name;b.onclick=()=>this.set(normalizeAppearance({...normalizeAppearance(null),...p.appearance}));presets.append(b);}
  for(const name of Object.keys(this.groups)){const b=document.createElement('button');b.type='button';b.role='tab';b.textContent=name;b.onclick=()=>{this.category=name;this.options();};root.querySelector('.explorer-tabs')!.append(b);}
  root.querySelector<HTMLButtonElement>('.explorer-random')!.onclick=()=>this.set(randomAppearance());
  const host=root.querySelector<HTMLElement>('.explorer-preview')!;
  let pointer:number|null=null,lastX=0;
  host.onpointerdown=e=>{pointer=e.pointerId;lastX=e.clientX;host.setPointerCapture(pointer);};
  host.onpointermove=e=>{if(pointer!==e.pointerId||!this.rig)return;this.rig.rotation.y+=(e.clientX-lastX)*.018;lastX=e.clientX;};
  host.onpointerup=host.onpointercancel=()=>{pointer=null;};
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.options();
  void this.init(host).catch(()=>{if(!this.disposed)host.textContent='미리보기를 불러오지 못했어요. 선택한 외형은 저장할 수 있어요.';});
 }
 private set(a:ExplorerAppearance){this.appearance=a;if(this.rig)applyExplorerAppearance(this.rig,a);this.options();this.changed({...a});}
 private options(){
  this.root.querySelectorAll<HTMLElement>('[role="tab"]').forEach(b=>b.setAttribute('aria-selected',String(b.textContent===this.category)));
  const host=this.root.querySelector('.explorer-options')!;host.replaceChildren();
  for(const key of this.groups[this.category]){
   const group=document.createElement('div');group.className='appearance-options';group.setAttribute('role','group');group.setAttribute('aria-label',key==='hairColorId'?'머리색':key==='backpackId'?'백팩':this.category);
   for(const option of APPEARANCE_OPTIONS[key]){const b=document.createElement('button');b.type='button';b.dataset.appearanceKey=key;b.dataset.option=option.id;b.setAttribute('aria-pressed',String(this.appearance[key]===option.id));b.setAttribute('aria-label',option.label);b.title=option.label;if(option.color){b.className='color-swatch';b.style.setProperty('--swatch',option.color);}else b.textContent=option.label;b.onclick=()=>this.set({...this.appearance,[key]:option.id});group.append(b);}
   host.append(group);
  }
 }
 private async init(host:HTMLElement){
  await loadVoxels(['alkong']);if(this.disposed)return;
  this.renderer=new T.WebGLRenderer({alpha:true,antialias:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(this.renderer.domElement);
  this.scene.add(new T.HemisphereLight(0xfffae9,0x758259,2.5));const sun=new T.DirectionalLight(0xfff0ce,3);sun.position.set(-3,7,5);this.scene.add(sun);
  this.rig=voxelModel('alkong',true);applyExplorerAppearance(this.rig,this.appearance);this.rig.rotation.y=-.3;this.scene.add(this.rig);
  this.camera.position.set(0,1.2,3);this.camera.lookAt(0,.55,0);this.resize();
  const render=()=>{if(this.disposed)return;this.renderer!.render(this.scene,this.camera);this.frame=requestAnimationFrame(render);};render();
 }
 private resize(){if(!this.renderer)return;const r=this.root.querySelector('.explorer-preview')!.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();}
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();if(this.rig)disposeExplorerAppearance(this.rig);this.renderer?.dispose();this.renderer?.forceContextLoss();}
}
