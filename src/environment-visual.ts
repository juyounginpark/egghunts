import * as T from 'three';
import {cycleClock} from './cycle-clock';
import {BALANCE} from './data';
import type {GameState} from './game';
import {dioramaUniforms} from './diorama-material';
import {FARM_PLOTS,farmLocal} from './village';

// Three's physically scaled lights need larger intensities than normalized art guides.
export const ENVIRONMENT_PRESETS=[
 {at:0,name:'day',sun:0xfff2d9,power:2.6,sky:0xfff4df,ground:0x859377,ambient:1.8,fog:0xe9f0d8,near:28,far:65,height:18,ao:.12,rim:.025,rimColor:0xffedce,emission:0,saturation:1},
 {at:.55,name:'day',sun:0xffefd1,power:2.6,sky:0xfff1df,ground:0x859377,ambient:1.8,fog:0xe9ecd4,near:28,far:65,height:18,ao:.12,rim:.025,rimColor:0xffedce,emission:0,saturation:1},
 {at:.75,name:'golden',sun:0xffc884,power:2.2,sky:0xf1dac2,ground:0x898394,ambient:1.5,fog:0xecd7b6,near:27,far:61,height:12,ao:.15,rim:.04,rimColor:0xffddb0,emission:.18,saturation:1},
 {at:.92,name:'sunset',sun:0xffaa7d,power:1.65,sky:0x9cb7d1,ground:0x666985,ambient:1.2,fog:0xbab8c2,near:25,far:56,height:7,ao:.18,rim:.09,rimColor:0xffd7ac,emission:.55,saturation:.97},
 {at:1,name:'night',sun:0x9ebed9,power:.75,sky:0xa2c3d0,ground:0x52657f,ambient:1.15,fog:0x354f60,near:23,far:52,height:10,ao:.2,rim:.2,rimColor:0xb9e0e6,emission:1,saturation:.88},
] as const;

/** A deterministic view of the HUD's clock, never a second gameplay clock. */
export class EnvironmentVisualController {
 readonly uniforms=dioramaUniforms();
 progress=0;
 preview:number|null=null;
 readonly enabled={ao:true,fog:true,rim:true,emissive:true,shadows:true};
 private tint=new T.Color();
 private fog=new T.Fog(0xe9f0d8,28,65);
 private lampMaterial=new T.MeshLambertMaterial({color:0xd9b96d,emissive:0xffc477});
 private lamps=new T.InstancedMesh(new T.BoxGeometry(1,1,1),this.lampMaterial,14);
 private contactMaterial:T.MeshBasicMaterial;
 private playerShadow:T.Mesh;
 private contacts:T.InstancedMesh;
 private marker=new T.Object3D();
 constructor(private scene:T.Scene,private renderer:T.WebGLRenderer,private sun:T.DirectionalLight,private ambient:T.HemisphereLight){
  scene.userData.diorama=this.uniforms;
  // A shared 32px radial texture replaces expensive SSAO and shadow lights.
  const pixels=new Uint8Array(32*32*4);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);
   pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(255*Math.pow(Math.max(0,1-r*r),2));
  }
  const map=new T.DataTexture(pixels,32,32);map.magFilter=map.minFilter=T.LinearFilter;map.needsUpdate=true;
  this.contactMaterial=new T.MeshBasicMaterial({color:0x626c64,map,transparent:true,opacity:.22,depthWrite:false});
  const plane=new T.PlaneGeometry(1,1);plane.rotateX(-Math.PI/2);
  this.playerShadow=new T.Mesh(plane,this.contactMaterial.clone());
  this.contacts=new T.InstancedMesh(plane,this.contactMaterial,48);this.contacts.frustumCulled=false;
  let index=0;
  const lamp=(x:number,y:number,z:number,w:number,h:number,d:number,angle=0)=>{
   this.marker.position.set(x,y,z);this.marker.scale.set(w,h,d);this.marker.rotation.set(0,angle,0);this.marker.updateMatrix();this.lamps.setMatrixAt(index++,this.marker.matrix);
  };
  for(const [slot,plot] of FARM_PLOTS.entries())for(const side of [-1,1]){const p=farmLocal(slot,side*.8,1.39);lamp(p.x,1.45,p.z,.34,.4,.035,plot.rotation);}
  for(const side of [-1,1])for(const z of [-1,11])lamp(side*2.5,1.7,z,.49,.51,.49);
  this.lamps.instanceMatrix.needsUpdate=true;
  scene.add(this.lamps,this.contacts,this.playerShadow);
 }
 update(game:GameState,hatch:boolean,low:boolean,player:T.Object3D,peers:Iterable<T.Object3D>){
  const clock=cycleClock(game.now(),game.nightAt,game.nightUntil);
  let progress=clock.night?1:1-clock.ratio;
  // Dawn also derives from the authoritative cycle, including resume/reload.
  const daySeconds=(BALANCE.nightInterval-BALANCE.nightDuration)/1000;
  if(!clock.night&&progress*daySeconds<8)progress=1-T.MathUtils.smoothstep(progress*daySeconds,0,8);
  this.progress=hatch?0:this.preview??progress;
  const b=ENVIRONMENT_PRESETS.find(p=>p.at>=this.progress)??ENVIRONMENT_PRESETS[4];
  const index=ENVIRONMENT_PRESETS.indexOf(b),a=ENVIRONMENT_PRESETS[Math.max(0,index-1)];
  const t=a===b?0:T.MathUtils.smoothstep(this.progress,a.at,b.at);
  const number=(key:'power'|'ambient'|'near'|'far'|'height'|'ao'|'rim'|'emission'|'saturation')=>T.MathUtils.lerp(a[key],b[key],t);
  const color=(target:T.Color,key:'sun'|'sky'|'ground'|'fog'|'rimColor')=>target.setHex(a[key]).lerp(this.tint.setHex(b[key]),t);
  color(this.sun.color,'sun');this.sun.intensity=number('power');
  this.sun.position.set(game.x-8,number('height'),game.z+10);
  color(this.ambient.color,'sky');color(this.ambient.groundColor,'ground');this.ambient.intensity=number('ambient');
  color(this.fog.color,'fog');
  if(!hatch&&game.distance>8)this.fog.color.lerp(this.tint.set(game.stage.color),.1*(1-this.progress));
  this.fog.near=number('near');this.fog.far=number('far');
  this.scene.fog=this.enabled.fog?this.fog:null;this.renderer.setClearColor(this.fog.color);
  this.uniforms.uDioramaAO.value=this.enabled.ao?number('ao'):0;
  this.uniforms.uDioramaRim.value=this.enabled.rim?number('rim')*(low?.75:1):0;
  color(this.uniforms.uDioramaRimColor.value,'rimColor');this.uniforms.uDioramaSaturation.value=number('saturation');
  this.lampMaterial.emissiveIntensity=this.enabled.emissive?number('emission')*1.8:0;
  this.lamps.visible=!hatch&&game.z>-25;
  this.renderer.shadowMap.enabled=!low&&this.enabled.shadows;
  this.playerShadow.visible=this.contacts.visible=!hatch&&this.enabled.ao;
  const height=Math.max(0,player.position.y),size=1/(1+height*.18);
  this.playerShadow.position.set(player.position.x,.075,player.position.z);this.playerShadow.scale.set(1.15*size,1,.85*size);
  (this.playerShadow.material as T.MeshBasicMaterial).opacity=.24/(1+height*.5);
  this.contactMaterial.color.copy(this.ambient.groundColor);
  (this.playerShadow.material as T.MeshBasicMaterial).color.copy(this.ambient.groundColor);
  let count=0;
  const contact=(x:number,z:number,w:number,d:number)=>{
   if(count>=48||Math.abs(z-game.z)>28)return;
   this.marker.position.set(x,.073,z);this.marker.rotation.set(0,0,0);this.marker.scale.set(w,1,d);this.marker.updateMatrix();this.contacts.setMatrixAt(count++,this.marker.matrix);
  };
  for(const p of FARM_PLOTS)contact(p.x,p.z,4.8,4.8);
  for(const side of [-1,1]){contact(side*4.5,1,3.4,3.4);contact(side*2.25,-4.7,1.2,1.2);}
  for(const peer of peers)if(peer.visible)contact(peer.position.x,peer.position.z,1.15,.85);
  for(const boss of game.bosses)contact(boss.x,boss.z,2.4,1.9);
  this.contacts.count=count;this.contacts.instanceMatrix.needsUpdate=true;
 }
}
