import * as T from 'three';
import {loadVoxels,voxelModel} from './voxel';
import {applyExplorerAppearance,disposeExplorerAppearance} from './explorer-model';
import {explorerRoom} from './explorer-room';
import {appearanceOptions,normalizeAppearance,randomAppearance,type ExplorerAppearance,type AppearanceKey} from './explorer-appearance';

export const EXPLORER_STEPS=['얼굴','머리','옷','장식'] as const;
export type ExplorerStep=typeof EXPLORER_STEPS[number];
const groups:Record<ExplorerStep,{key:AppearanceKey;label:string}[]>={
 '얼굴':[{key:'skinId',label:'피부'},{key:'eyeId',label:'눈'},{key:'eyebrowId',label:'눈썹'},{key:'mouthId',label:'입'},{key:'cheekId',label:'볼'}],
 '머리':[{key:'hairId',label:'스타일'},{key:'hairColorId',label:'색상'}],
 '옷':[{key:'outfitId',label:'의상'},{key:'accentColorId',label:'포인트색'}],
 '장식':[{key:'headAccessoryId',label:'머리'},{key:'faceAccessoryId',label:'얼굴'},{key:'neckAccessoryId',label:'목'},{key:'backpackId',label:'가방'}],
};
type Options={stage?:number;staged?:boolean};
type View={y:number;distance:number;angle:number;limit:number};
const views={face:{y:.78,distance:1.48,angle:0,limit:Math.PI/9},hair:{y:.76,distance:1.95,angle:0,limit:Math.PI/4},body:{y:.57,distance:2.85,angle:-.18,limit:Infinity},back:{y:.6,distance:2.55,angle:Math.PI*.92,limit:Infinity},neck:{y:.66,distance:2.15,angle:0,limit:Infinity}};

/** One reusable editor, including the room, category framing and lifecycle cleanup. */
export class ExplorerEditor{
 appearance:ExplorerAppearance;
 private renderer:T.WebGLRenderer|null=null;private scene=new T.Scene();private camera=new T.PerspectiveCamera(30,1,.1,30);private rig:T.Group|null=null;
 private room:T.Mesh|null=null;private frame=0;private disposed=false;private observer:ResizeObserver;
 private category:ExplorerStep='얼굴';private key:AppearanceKey='skinId';private preview=false;
 private target:View={...views.body};private current={...views.body};private transitionAt=0;private from={...views.body};
 private angle=-.18;private angleTarget=-.18;private pointer:number|null=null;private lastX=0;
 private blinkAt=2+Math.random()*2;private smileAt=10+Math.random()*10;private smileUntil=0;private tiltUntil=0;private outfitUntil=0;private waveUntil=0;
 private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;private lastFrame=0;
 private initial:ExplorerAppearance;
 constructor(private root:HTMLElement,value:unknown,private changed:(a:ExplorerAppearance)=>void=()=>{},private config:Options={}){
  this.appearance=normalizeAppearance(value);this.initial={...this.appearance};root.classList.add('explorer-editor');root.classList.toggle('staged-editor',!!config.staged);
  root.innerHTML='<div class="explorer-preview" aria-label="탐험가 준비실 3D 미리보기"><span class="preview-loading">준비실을 열고 있어요…</span></div><small class="preview-help">좌우로 드래그해 돌려보세요</small><div class="explorer-tabs" role="tablist" aria-label="꾸미기 단계"></div><div class="explorer-subtabs" role="tablist" aria-label="세부 항목"></div><div class="explorer-options" role="tabpanel"></div><button type="button" class="secondary explorer-random">전체 랜덤</button><small class="explorer-note">외형은 나중에 기지의 옷장에서 언제든 바꿀 수 있어요.</small>';
  for(const category of EXPLORER_STEPS){const b=document.createElement('button');b.type='button';b.role='tab';b.textContent=category;b.onclick=()=>this.go(category);root.querySelector('.explorer-tabs')!.append(b);}
  root.querySelector<HTMLButtonElement>('.explorer-random')!.onclick=()=>{
   const host=root.querySelector('.explorer-preview')!;
   if(!this.reduced)host.animate([{opacity:.85},{opacity:1}],{duration:160,easing:'ease-out'});
   this.set(randomAppearance(Math.random,0,config.stage??1));this.tiltUntil=performance.now()/1000+.4;
  };
  const host=root.querySelector<HTMLElement>('.explorer-preview')!;
  host.onpointerdown=e=>{this.pointer=e.pointerId;this.lastX=e.clientX;host.setPointerCapture(e.pointerId);};
  host.onpointermove=e=>{if(this.pointer!==e.pointerId)return;this.angleTarget+=(e.clientX-this.lastX)*.013;this.angleTarget=T.MathUtils.clamp(this.angleTarget,-this.target.limit,this.target.limit);this.lastX=e.clientX;};
  host.onpointerup=host.onpointercancel=host.onlostpointercapture=()=>{this.pointer=null;};
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.options();this.frameView();
  void this.init(host).catch(()=>{if(!this.disposed){this.releaseRenderer();host.textContent='미리보기를 불러오지 못했어요. 선택한 외형은 저장할 수 있어요.';}});
 }
 go(category:ExplorerStep){this.preview=false;this.root.classList.remove('preview-only');this.category=category;this.key=groups[category][0].key;this.options();this.frameView();}
 showPreview(){this.preview=true;this.root.classList.add('preview-only');this.frameView();this.waveUntil=performance.now()/1000+1.1;}
 wave(){this.waveUntil=performance.now()/1000+.7;}
 private set(a:ExplorerAppearance){
  this.appearance=normalizeAppearance(a);if(this.rig)applyExplorerAppearance(this.rig,this.appearance);
  const now=performance.now()/1000;this.smileUntil=now+.6;if(Math.random()<.17)this.tiltUntil=now+.6;
  if(this.category==='옷')this.outfitUntil=now+.35;
  this.options();this.changed({...this.appearance});
 }
 private pool(){return appearanceOptions(this.key,this.config.stage??1,this.initial[this.key]);}
 private choose(delta:number){const pool=this.pool(),i=pool.findIndex(o=>o.id===this.appearance[this.key]);this.set({...this.appearance,[this.key]:pool[(i+delta+pool.length)%pool.length].id});}
 private options(){
  this.root.querySelectorAll<HTMLElement>('.explorer-tabs [role="tab"]').forEach(b=>b.setAttribute('aria-selected',String(b.textContent===this.category)));
  const subtabs=this.root.querySelector('.explorer-subtabs')!;subtabs.replaceChildren();
  for(const item of groups[this.category]){const b=document.createElement('button');b.type='button';b.role='tab';b.textContent=item.label;b.dataset.key=item.key;b.setAttribute('aria-selected',String(this.key===item.key));b.onclick=()=>{this.key=item.key;this.options();this.frameView();};subtabs.append(b);}
  const host=this.root.querySelector<HTMLElement>('.explorer-options')!;host.replaceChildren();host.dataset.key=this.key;
  const pool=this.pool(),i=Math.max(0,pool.findIndex(o=>o.id===this.appearance[this.key])),selected=pool[i];
  const stepper=document.createElement('div');stepper.className='appearance-stepper';
  const previous=document.createElement('button'),next=document.createElement('button'),caption=document.createElement('div');
  for(const [button,delta,label] of [[previous,-1,'이전'],[next,1,'다음']] as const){button.type='button';button.textContent=delta<0?'‹':'›';button.dataset.step=String(delta);button.setAttribute('aria-label',`${label} ${groups[this.category].find(g=>g.key===this.key)!.label}`);button.onclick=()=>this.choose(delta);}
  const title=document.createElement('strong'),count=document.createElement('small');title.textContent=selected.label;count.textContent=`${String(i+1).padStart(2,'0')} / ${pool.length}`;caption.append(title,count);caption.setAttribute('aria-live','polite');stepper.append(previous,caption,next);host.append(stepper);
  if(selected.color){
   const swatches=document.createElement('div');swatches.className='appearance-swatches';swatches.setAttribute('role','group');swatches.setAttribute('aria-label','색상 선택');
   for(const option of pool){const b=document.createElement('button');b.type='button';b.className='color-swatch';b.style.setProperty('--swatch',option.color!);b.dataset.option=option.id;b.setAttribute('aria-label',option.label);b.setAttribute('aria-pressed',String(this.appearance[this.key]===option.id));b.onclick=()=>this.set({...this.appearance,[this.key]:option.id});swatches.append(b);}host.append(swatches);
  }
  if(this.key==='eyebrowId'){const hint=document.createElement('small');hint.className='explorer-note';hint.textContent='눈썹 색은 머리색을 따라가요.';host.append(hint);}
 }
 private frameView(){
  const type=this.preview?'body':this.key==='backpackId'?'back':this.key==='faceAccessoryId'||this.category==='얼굴'?'face':this.key==='headAccessoryId'||this.category==='머리'?'hair':this.key==='neckAccessoryId'?'neck':'body';
  this.from={...this.current};this.target={...views[type]};this.transitionAt=performance.now();
  this.angleTarget=this.target.angle;
  this.root.querySelector('.preview-help')!.textContent=type==='face'?'얼굴을 가까이 살펴보세요':type==='back'?'등을 돌려 가방을 보여드릴게요':'좌우로 드래그해 돌려보세요';
  this.root.dataset.view=type;
 }
 private async init(host:HTMLElement){
  await loadVoxels(['alkong']);if(this.disposed)return;
  this.renderer=new T.WebGLRenderer({alpha:false,antialias:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0xe5dfc8);host.querySelector('.preview-loading')?.remove();host.append(this.renderer.domElement);
  this.scene.add(new T.HemisphereLight(0xfffae9,0x758259,2.2));const sun=new T.DirectionalLight(0xffedc6,2.6);sun.position.set(-3,5,4);this.scene.add(sun);
  this.room=explorerRoom();this.scene.add(this.room);
  this.rig=voxelModel('alkong',true);applyExplorerAppearance(this.rig,this.appearance);this.scene.add(this.rig);this.resize();
  this.transitionAt=performance.now();
  const render=(now:number)=>{if(this.disposed)return;
   const dt=Math.min(.05,(now-this.lastFrame)/1000||0);this.lastFrame=now;
   if(!document.hidden){
    const t=this.reduced?1:Math.min(1,(now-this.transitionAt)/340),ease=t*t*(3-2*t);
    this.current.y=T.MathUtils.lerp(this.from.y,this.target.y,ease);this.current.distance=T.MathUtils.lerp(this.from.distance,this.target.distance,ease);
    this.angle+=Math.atan2(Math.sin(this.angleTarget-this.angle),Math.cos(this.angleTarget-this.angle))*(this.reduced?1:1-Math.exp(-dt*12));this.rig!.rotation.y=this.angle;
    // A narrow preview needs extra width for hair and headwear, not a cropped face.
    const distance=this.current.distance*Math.max(1,.8/this.camera.aspect);
    this.camera.position.set(0,this.current.y+.035,distance);this.camera.lookAt(0,this.current.y,0);
    this.animate(now/1000);this.renderer!.render(this.scene,this.camera);
   }
   this.frame=requestAnimationFrame(render);
  };this.frame=requestAnimationFrame(render);
 }
 private animate(t:number){
  if(!this.rig||this.reduced)return;
  const head=this.rig.getObjectByName('head'),eyes=this.rig.getObjectByName('explorer-eyes'),mouth=this.rig.getObjectByName('explorer-mouth'),body=this.rig.getObjectByName('body');
  if(t>this.blinkAt+.16)this.blinkAt=t+2.8+Math.random()*3.5;
  if(t>this.smileAt){this.smileUntil=t+.9;this.smileAt=t+10+Math.random()*10;}
  if(eyes){const scale=t>=this.blinkAt?.15:1;eyes.scale.y=scale;eyes.position.y=3.4/18*(1-scale);}
  if(mouth){mouth.rotation.z=t<this.smileUntil?.04:0;mouth.scale.y=t<this.smileUntil?.9:1;}
  if(head){head.rotation.z=t<this.tiltUntil?Math.sin((this.tiltUntil-t)*7)*.065:Math.sin(t*.7)*.012;head.rotation.y=Math.sin(t*.53)*.018;}
  if(body)body.rotation.z=Math.sin(t*.9)*.012;
  const arm=this.rig.getObjectByName('right_arm'),left=this.rig.getObjectByName('left_arm');
  if(arm)arm.rotation.z=t<this.waveUntil?1.6+Math.sin(t*13)*.16:t<this.outfitUntil?.25:0;
  if(left)left.rotation.z=t<this.outfitUntil?-.25:0;
  const foot=this.rig.getObjectByName('left_foot');if(foot)foot.rotation.y=Math.sin(t*.37)*.03;
 }
 private resize(){if(!this.renderer)return;const r=this.root.querySelector('.explorer-preview')!.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();}
 private releaseRenderer(){
  if(this.rig){disposeExplorerAppearance(this.rig);this.scene.remove(this.rig);this.rig=null;}
  if(this.room){this.room.geometry.dispose();(this.room.material as T.Material).dispose();this.scene.remove(this.room);this.room=null;}
  this.renderer?.dispose();this.renderer?.forceContextLoss();this.renderer=null;
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.releaseRenderer();}
}
