import {eggMaxHp} from './data';
import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { EGGS, RARITIES, BALANCE, MONGLES, TRAILS, crackStage,DAMAGE_OVER_TIME } from "./data";
import { eggVisual, petVisual, animateEgg,nestVisual } from "./visuals";
import type { Egg, GameState } from "./game";
import { voxelModel as model, loadVoxels } from "./voxel";
import {villageMapColliders,type MapCollider} from './map-collision';
import type { Peer } from "./multiplayer";
import { formatNumber } from "./format";
import {petAbilities} from './pet-stats';
import {HazardView} from "./hazard-view";
import {FARM_PLOTS,farmPlot,farmGym,farmLocal} from './village';
import {villageArt} from './world-art';
import {animatePet,greetPet} from './pet-animation';
import {followPets} from './pet-followers';
import {GuardianMotion} from './guardian-motion';
import {firstEggTarget} from './tutorial';
import {HatchBurst} from './hatch-burst';
import {EnvironmentVisualController} from './environment-visual';
import {dioramaMaterial} from './diorama-material';

export class World {
  networkOffset={x:0,z:0};
  chasePressure=0;
  private reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  readonly mapColliders:MapCollider[]=[];
  hazardsView=new HazardView();
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera = new T.OrthographicCamera();
  player = new T.Group();
  private peers = new Map<string,T.Group>();
  private peerPets=new Map<string,{group:T.Group;trail:T.Vector3[];key:string|null;request:number;retryAt:number}>();
  private clearPetInstances(group:T.Group){
    group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});group.clear();
  }
  private syncPeerPets(peer:Peer,avatar:T.Group,visible:boolean,dt:number,time:number){
    let entry=this.peerPets.get(peer.id);
    if(!entry){entry={group:new T.Group(),trail:[],key:null,request:0,retryAt:0};this.peerPets.set(peer.id,entry);this.scene.add(entry.group);}
    entry.group.visible=visible;
    const ids=(peer.activePets??[]).filter(id=>Number.isInteger(id)&&!!MONGLES[id]).slice(0,BALANCE.maxCompanions),key=ids.join(',');
    if(entry.key!==key&&time>=entry.retryAt){
      entry.key=key;const request=++entry.request,current=entry;
      this.clearPetInstances(current.group);
      void loadVoxels(ids.map(id=>`pet-${id}`)).then(()=>{
        if(this.peerPets.get(peer.id)!==current||current.request!==request)return;
        for(const id of ids){const pet=petVisual(id);pet.scale.setScalar(MONGLES[id].scale);pet.position.copy(avatar.position);current.group.add(pet);}
      }).catch(err=>{if(this.peerPets.get(peer.id)===current&&current.request===request){current.key=null;current.retryAt=time+2;this.assetError=String(err);}});
    }
    entry.trail=followPets(entry.group,entry.trail,avatar.position,{x:Math.sin(avatar.rotation.y),z:Math.cos(avatar.rotation.y)},dt,time,this.low,this.reducedMotion.matches);
  }
  playerAnchor(id?:string){
    const avatar=id?this.peers.get(id):this.player;if(!avatar||!avatar.visible)return null;
    const p=avatar.position.clone();p.y+=1.85;p.project(this.camera);
    return Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z<1?{x:(p.x+1)/2*this.host.clientWidth,y:(1-p.y)/2*this.host.clientHeight}:null;
  }
  private roomFarmKey='';
  private roomFarmPets=new T.Group();
  private async showRoomFarms(players:Peer[]){
    const entries=players.filter(p=>p.slot!==undefined).flatMap(p=>(p.pets??[]).slice(0,3).map((id,i)=>({id,i,slot:p.slot!})));
    const key=JSON.stringify(entries);if(key===this.roomFarmKey)return;this.roomFarmKey=key;
    await loadVoxels(entries.map(p=>`pet-${p.id}`));if(key!==this.roomFarmKey)return;
    this.roomFarmPets.clear();
    for(const p of entries){const pet=petVisual(p.id,p.id<6||p.id>=100),plot=farmPlot(p.slot);pet.scale.setScalar(Math.min(1.5,MONGLES[p.id].scale));const at=farmLocal(p.slot,-.6+p.i*.6,3);pet.position.set(at.x,0,at.z);pet.rotation.y=plot.rotation;this.roomFarmPets.add(pet);}
  }
  private appearance=-1;
  private batGeometry=new T.BoxGeometry(.13,.13,1.25);
  private batMaterial=new T.MeshLambertMaterial({color:0xc48c55});
  private swungAt=-Infinity;
  private peerFrameAt=0;
  swingBat(now:number){if(now-this.swungAt<BALANCE.batCooldown)return false;this.swungAt=now;return true;}
  private animateBat(avatar:T.Group,age:number){
    let bat=avatar.getObjectByName('bat') as T.Mesh|undefined;
    if(!bat){bat=new T.Mesh(this.batGeometry,this.batMaterial);bat.name='bat';avatar.add(bat);}
    bat.visible=age>=0&&age<350;
    if(bat.visible){const angle=-1.3+age/350*2.6;bat.position.set(Math.sin(angle)*.65,.65,Math.cos(angle)*.65);bat.rotation.y=angle;}
  }
  private decorateAvatar(avatar:T.Object3D,choice:number){
    const old=avatar.getObjectByName('avatar-accessory');if(old)avatar.remove(old);
    const hat=new T.Mesh(new T.BoxGeometry(.65,.16,.6),dioramaMaterial({color:[0x99c76b,0xffb677,0x83cdf0][choice]},true));
    hat.name='avatar-accessory';hat.position.set(0,1.05,0);hat.rotation.z=choice===1?.16:0;avatar.add(hat);
    if(old instanceof T.Mesh){old.geometry.dispose();(old.material as T.Material).dispose();}
  }
  updatePeers(players:Peer[],visible:boolean,now:number){
    const frameAt=performance.now(),dt=Math.min(.1,Math.max(0,(frameAt-this.peerFrameAt)/1000)),blend=1-Math.exp(-dt*12);this.peerFrameAt=frameAt;
    this.roomFarmPets.visible=visible;void this.showRoomFarms(players).catch(err=>{this.assetError=String(err);});
    for(const [id,avatar] of this.peers)if(!players.some(p=>p.id===id)){
      const accessory=avatar.getObjectByName('avatar-accessory') as T.Mesh;
      if(accessory){accessory.geometry.dispose();(accessory.material as T.Material).dispose();}
      this.clearPetInstances(avatar);this.scene.remove(avatar);this.peers.delete(id);
      const pets=this.peerPets.get(id);if(pets){this.clearPetInstances(pets.group);this.scene.remove(pets.group);this.peerPets.delete(id);}
    }
    for(const peer of players){
      if(!this.peers.has(peer.id)){const avatar=new T.Group(),rig=model('alkong',true);rig.name='peer-rig';avatar.add(rig);avatar.position.set(peer.x,0,peer.z);avatar.userData.appearance=-1;avatar.userData.motion=new GuardianMotion();this.peers.set(peer.id,avatar);this.scene.add(avatar);}
      const avatar=this.peers.get(peer.id)!;
      const motion=avatar.userData.motion as GuardianMotion;
      const down=now<peer.downUntil;
      if(avatar.userData.snapshot!==peer){
        const previous=avatar.userData.snapshot as Peer|undefined;
        const interval=previous?Math.max(0,((peer.at??frameAt)-(previous.at??frameAt))/1000):0;
        // Compare server samples, not the intentionally delayed render position.
        // At speed 40 even a normal 350ms interpolation gap exceeds 12 units.
        const teleported=previous&&Math.hypot(peer.x-previous.x,peer.z-previous.z)>Math.max(12,BALANCE.maxMovementSpeed*interval*1.5+2);
        if(teleported||down!==avatar.userData.down)motion.reset();
        motion.sample(peer.x,peer.z,(peer.at??frameAt)/1000,frameAt/1000);avatar.userData.down=down;
        if(peer.attackAt!==avatar.userData.attackAt&&now-peer.attackAt<1500)avatar.userData.swingReceived=frameAt;
        if(peer.hitAt!==avatar.userData.hitAt&&now<peer.downUntil)avatar.userData.hitReceived=frameAt;
        avatar.userData.snapshot=peer;avatar.userData.receivedAt=frameAt;avatar.userData.attackAt=peer.attackAt;avatar.userData.hitAt=peer.hitAt;
      }
      const position=motion.position(dt,frameAt/1000);
      const snap=Math.hypot(position.x-avatar.position.x,position.z-avatar.position.z)>12;
      const beforeX=avatar.position.x,beforeZ=avatar.position.z;
      avatar.visible=visible;avatar.position.x=position.x;avatar.position.z=position.z;
      const fresh=frameAt-avatar.userData.receivedAt<1200;
      const speed=dt>0&&!snap?Math.hypot(avatar.position.x-beforeX,avatar.position.z-beforeZ)/dt:0;
      const walking=!down&&fresh&&speed>.08;
      avatar.userData.walkBlend=(avatar.userData.walkBlend??0)+((walking?1:0)-(avatar.userData.walkBlend??0))*(1-Math.exp(-dt*16));
      avatar.userData.walkPhase=(avatar.userData.walkPhase??0)+dt*9*Math.min(1.6,Math.max(.6,speed/1.6));
      const rig=avatar.getObjectByName('peer-rig')!,stride=Math.sin(avatar.userData.walkPhase)*avatar.userData.walkBlend;
      rig.position.y=down?0:Math.abs(stride)*.07;
      for(const side of ['left','right']){
        const sign=side==='left'?1:-1,leg=rig.getObjectByName(`${side}_leg`),arm=rig.getObjectByName(`${side}_arm`);
        if(leg)leg.rotation.x=down?.2:stride*.4*sign;
        if(arm)arm.rotation.x=down?-.35:peer.carried!==null?-2.4:-stride*.3*sign;
      }
      const flight=(frameAt-(avatar.userData.hitReceived??-Infinity))/(BALANCE.batFlightSeconds*1000);
      avatar.position.y=down&&flight>=0&&flight<1?Math.sin(flight*Math.PI)*.65:0;
      avatar.rotation.y+=Math.atan2(Math.sin(peer.rotation-avatar.rotation.y),Math.cos(peer.rotation-avatar.rotation.y))*blend;
      avatar.rotation.z+=( (down?Math.PI/2:0)-avatar.rotation.z)*blend;
      this.animateBat(avatar,frameAt-(avatar.userData.swingReceived??-Infinity));
      const eggKey=peer.carried===null?null:`${peer.egg?.id??''}:${peer.carried}:${peer.egg?.stageId??''}:${peer.egg?.variant??''}`;
      if(avatar.userData.egg!==eggKey){
        const old=avatar.getObjectByName('peer-egg');if(old){old.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});avatar.remove(old);}
        if(peer.carried!==null){const egg=this.eggModel(peer.egg??{type:peer.carried});egg.name='peer-egg';egg.position.y=1.12;egg.scale.setScalar(RARITIES[EGGS[peer.carried].tier].scale*.85*BALANCE.eggVisualScale);avatar.add(egg);}
        avatar.userData.egg=eggKey;
      }
      const held=avatar.getObjectByName('peer-egg');if(held)animateEgg(held,frameAt/1000,this.low);
      this.syncPeerPets(peer,avatar,visible,dt,frameAt/1000);
      if(avatar.userData.appearance!==peer.appearance){this.decorateAvatar(avatar,peer.appearance);avatar.userData.appearance=peer.appearance;}
    }
  }
  terrain = new T.Group();
  eggs = new T.Group();
  hatch = new T.Group();
  farm = new T.Group();
  farmPets = new T.Group();
  private farmKey = "";
  private petLabels = document.createElement("div");
  private peerPetLabels = document.createElement('div');
  private peerPetLabelEntries=new Map<string,{id:number;label:HTMLDivElement}>();
  private trainingGains:{el:HTMLDivElement;at:number}[]=[];
  showTrainingGain(amount:number,at:number){
    const el=document.createElement('div');el.className='training-gain';el.textContent=`+${formatNumber(amount,3)}`;
    this.host.append(el);this.trainingGains.push({el,at});
    while(this.trainingGains.length>4)this.trainingGains.shift()!.el.remove();
  }
  private footTrail = new T.InstancedMesh(new T.BoxGeometry(.12,.08,.12), new T.MeshBasicMaterial({color:0xffdc89}), 24);
  private lifeEffects = new T.InstancedMesh(new T.BoxGeometry(.1,.1,.1),new T.MeshBasicMaterial({color:0xffe6a0,transparent:true,depthWrite:false}),32);
  private storage = new T.Group();
  private storageKey = "";
  private trail: T.Vector3[] = [];
  private low = false;
  private hudMeasureAt = -1;
  private viewportOffset = 0;
  private eggModels: T.Group[] = [];
  private stageEggModels=new Map<string,T.Group>();
  private eggModel(egg:Pick<Egg,'type'|'stageId'|'variant'>){
    if(!egg.stageId||egg.variant===undefined)return this.eggModels[egg.type].clone();
    const key=`${egg.stageId}:${egg.variant}:${egg.type}`;
    if(!this.stageEggModels.has(key))this.stageEggModels.set(key,eggVisual(egg.type,egg));
    return this.stageEggModels.get(key)!.clone();
  }
  private ambient=new T.HemisphereLight(0xfffae9,0x758259,2.5);
  readonly environment:EnvironmentVisualController;
  private lastWorld = "";
  private nests = new Map<string,T.Group>();
  private nestGroup=new T.Group();
  private nightBarrier = new T.Mesh(new T.BoxGeometry(BALANCE.mapX*2,.8,.3),new T.MeshLambertMaterial({color:0xa9875c}));
  private selectionMaterial = new T.MeshBasicMaterial({color:0xff2525,side:T.BackSide});
  private hatchKey = "";
  private hatchBurst=new HatchBurst();
  private damageDirection=document.createElement('div');
  private birth?:{id:number;egg:Pick<Egg,'type'|'stageId'|'variant'>;at:number;done:()=>void;onBirth?:()=>void};
  private carry = new T.Group();
  private focus = new T.Vector3();
  private healthAnchor = new T.Vector3();
  private ring: T.Mesh;
  private highlight: T.Mesh;
  private sun: T.DirectionalLight;
  private hatchModel: T.Group | null = null;
  private crack = new T.Group();
  private companions = new T.Group();
  private companionKey = "";
  private flying = new T.Group();
  private flyAt = 0;
  hitAt = 0;
  assetError = "";
  constructor(public host: HTMLElement) {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.setClearColor(0xe9f0d8);
    host.append(this.renderer.domElement);
    this.damageDirection.id='damage-direction';this.damageDirection.hidden=true;this.damageDirection.setAttribute('aria-hidden','true');host.append(this.damageDirection);
    this.petLabels.id="pet-labels";host.append(this.petLabels);
    this.peerPetLabels.id='peer-pet-labels';host.append(this.peerPetLabels);
    this.scene.add(this.farm,this.farmPets,this.roomFarmPets,this.footTrail);
    this.scene.add(this.hazardsView.group);
    this.scene.add(this.nestGroup);
    this.nightBarrier.position.set(0,.65,BALANCE.baseMinZ-.25);
    this.scene.add(this.nightBarrier,this.lifeEffects);
    this.lifeEffects.frustumCulled=false;
    this.footTrail.frustumCulled=false;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "알콩 원정대 3D 탐험 세계",
    );
    this.scene.add(this.ambient);
    this.sun = new T.DirectionalLight(0xfff0ce, 3);
    this.sun.position.set(-8, 18, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -16;
    this.sun.shadow.camera.right = 16;
    this.sun.shadow.camera.top = 16;
    this.sun.shadow.camera.bottom = -16;
    this.sun.shadow.normalBias = 0.04;
    this.sun.shadow.camera.near=.5;
    this.sun.shadow.camera.far=55;
    this.environment=new EnvironmentVisualController(this.scene,this.renderer,this.sun,this.ambient);
    this.scene.add(
      this.sun,
      this.sun.target,
      this.terrain,
      this.player,
      this.eggs,
      this.hatch,
      this.companions,
      this.storage,
    );
    this.player.add(this.carry);
    this.ring = new T.Mesh(
      new T.RingGeometry(1.95, 2.2, 4),
      new T.MeshBasicMaterial({
        color: 0x648847,
        side: T.DoubleSide,
        transparent: true,
        opacity: 0.6,
      }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.045;
    this.terrain.add(this.ring);
    this.highlight = new T.Mesh(
      new T.RingGeometry(0.65, 0.72, 4),
      new T.MeshBasicMaterial({ color: 0xfff5bb, side: T.DoubleSide }),
    );
    this.highlight.rotation.x = -Math.PI / 2;
    this.highlight.position.y = 0.07;
    this.scene.add(this.highlight, this.flying);
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    // Render directly at display size instead of enlarging a low-resolution image.
    this.renderer.setPixelRatio(this.low?1:Math.min(window.devicePixelRatio||1,1.5));
    this.renderer.setSize(w,h);
    const span = 17;
    this.camera.left = (-span * w) / h / 2;
    this.camera.right = (span * w) / h / 2;
    this.camera.top = span / 2;
    this.camera.bottom = -span / 2;
    this.camera.near = 0.1;
    this.camera.far = 180;
    this.camera.updateProjectionMatrix();
    this.hudMeasureAt = -1;
  }
  async init() {
    await loadVoxels([...Array.from({length:20},(_,i)=>`guardian-${i+1}`),"guardian-final","alkong","pedestal","feed"]);
    this.player.add(model("alkong", true));
    this.eggModels = EGGS.map((_, i) => eggVisual(i));
    const groundMaterial = dioramaMaterial({ vertexColors: true });
    const chunks: T.BufferGeometry[] = [];
    const block = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: number,
      angle=0,
    ) => {
      const g = new T.BoxGeometry(w, h, d).toNonIndexed();
      g.rotateY(angle);g.translate(x, y, z);
      const c = new T.Color(color);
      g.setAttribute(
        "color",
        new T.Float32BufferAttribute(
          Array.from({ length: g.attributes.position.count }, () => [
            c.r,
            c.g,
            c.b,
          ]).flat(),
          3,
        ),
      );
      chunks.push(g);
    };
    for(const p of villageArt())block(p.x,p.y,p.z,p.w,p.h,p.d,p.c,p.angle??0);
    const g = mergeGeometries(chunks);
    chunks.forEach((c) => c.dispose());
    const mesh = new T.Mesh(g, groundMaterial);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.terrain.add(mesh);
    for(const [slot,plot] of FARM_PLOTS.entries()){
      const feed=farmLocal(slot,-1,2.5),bowl=model('feed');bowl.position.set(feed.x,0,feed.z);bowl.scale.setScalar(.7);bowl.rotation.y=plot.rotation;this.farm.add(bowl);
      const position=farmGym(slot),gym=new T.Group();gym.name=`gym-${slot}`;gym.position.set(position.x,0,position.z);gym.rotation.y=plot.rotation;
      const material=new T.MeshLambertMaterial({color:[0x859e5d,0xc59566,0x7ca3ad,0xac8ab2,0xb8a35a][slot]});
      for(const [w,h,d,x,y,z] of [[1.2,.15,1.6,0,.08,0],[.85,.04,1.35,0,.18,0],[.12,1,.12,-.5,.6,-.7],[.12,1,.12,.5,.6,-.7],[1.1,.12,.12,0,1.05,-.7]]){
        const part=new T.Mesh(new T.BoxGeometry(w,h,d),material);part.position.set(x,y,z);gym.add(part);
      }
      this.farm.add(gym);
      // A numbered tile marks each assigned plot without a text-heavy panel.
      const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d')!;
      ctx.fillStyle='#fff4d7';ctx.fillRect(0,0,64,64);ctx.strokeStyle='#68724d';ctx.lineWidth=6;ctx.strokeRect(3,3,58,58);ctx.fillStyle='#465334';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText(String(slot+1),32,46);
      const tile=new T.Mesh(new T.PlaneGeometry(.8,.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas)}));tile.rotation.x=-Math.PI/2;const label=farmLocal(slot,0,2.3);tile.position.set(label.x,.065,label.z);this.farm.add(tile);
    }
    // Collision geometry is identical in the client and the authoritative server.
    this.mapColliders.splice(0,this.mapColliders.length,...villageMapColliders());
    const pedestal = model("pedestal");
    pedestal.scale.set(2.5, 1, 2.5);
    pedestal.position.y = -0.2;
    this.crack.scale.setScalar(BALANCE.eggPresentationScale);
    this.hatch.add(pedestal, this.crack,this.hatchBurst);
    this.hatch.visible = false;
  }
  quality(low: boolean) {
    this.low = low;
    this.resize();
    this.renderer.shadowMap.enabled = !low;
  }
  async showCompanions(ids: number[]) {
    const key = ids.join(",");
    if (key === this.companionKey) return;
    this.companionKey = key;
    await loadVoxels(ids.map(i => `pet-${i}`));
    const models = ids.map((i) => petVisual(i));
    if (this.companionKey !== key) return;
    this.companions.clear();
    models.forEach((m, i) => {
      m.position.copy(this.player.position);
      m.userData.petId = ids[i];
      m.scale.setScalar(MONGLES[ids[i]].scale);
      this.companions.add(m);
    });
  }
  async showFarmPets(game: GameState) {
    const all=game.save.mongles.flatMap((count,i)=>count&&!game.save.active.includes(i)?[i]:[]);
    const page=Math.floor(game.now()/12000);
    const ids=all.length<=BALANCE.farmPetsVisible?all:Array.from({length:BALANCE.farmPetsVisible},(_,i)=>all[(page*BALANCE.farmPetsVisible+i)%all.length]);
    const key=ids.join(',');if(key===this.farmKey)return;this.farmKey=key;
    await loadVoxels(ids.map(i=>`pet-${i}`));if(key!==this.farmKey)return;
    this.farmPets.clear();ids.forEach((id,i)=>{const m=petVisual(id,id<6||id>=100);m.scale.setScalar(Math.min(1.5,MONGLES[id].scale));m.userData.slot=i;this.farmPets.add(m);});
  }
  async updateHatch(key: string, type: number, result: number | null, appearance?:Pick<Egg,'type'|'stageId'|'variant'>) {
    this.hatchKey = key;
    if (result !== null) await loadVoxels([`pet-${result}`]);
    const m =
      result !== null ? petVisual(result) : this.eggModel(appearance??{type});
    if (this.hatchKey !== key) return;
    if (this.hatchModel) {this.clearPetInstances(this.hatchModel);this.hatch.remove(this.hatchModel);}
    this.hatchModel = m ?? null;
    if (m) {
      m.scale.setScalar(result !== null ? 2 : 2.5*BALANCE.eggPresentationScale);
      this.hatch.add(m);
    }
  }
  shakeHatch(){this.hitAt=performance.now();}
  showHatchHit(amount:number,point?:{x:number;y:number}){
    if(!Number.isFinite(amount)||amount<=0||this.birth)return;
    this.hitAt=performance.now();
    const touch=document.getElementById('hatch-touch');if(!touch||touch.hidden)return;
    const rect=touch.getBoundingClientRect(),host=this.host.getBoundingClientRect();
    const effect=document.createElement('div');effect.className='hatch-hit-feedback';effect.setAttribute('aria-hidden','true');
    effect.style.left=`${(point?.x??rect.left+rect.width/2)-host.left}px`;effect.style.top=`${(point?.y??rect.top+rect.height*.35)-host.top}px`;
    const number=document.createElement('b');number.textContent=`−${amount<.01?'<0.01':formatNumber(amount)}`;effect.append(number);
    if(!this.reducedMotion.matches)for(let i=0;i<6;i++){
      const spark=document.createElement('i'),angle=i*Math.PI/3;
      spark.style.setProperty('--dx',`${Math.cos(angle)*45}px`);spark.style.setProperty('--dy',`${Math.sin(angle)*35}px`);effect.append(spark);
    }
    const active=this.host.querySelectorAll('.hatch-hit-feedback');if(active.length>=8)active[0].remove();
    this.host.append(effect);
    const motion=effect.animate([{opacity:1,transform:'translate(-50%,-50%) scale(1.12)'},{opacity:0,transform:`translate(-50%,${this.reducedMotion.matches?'-50%':'-140%'}) scale(1)`}],{duration:650,easing:'ease-out'});
    motion.onfinish=()=>effect.remove();
  }
  async revealHatch(id:number,egg:Pick<Egg,'type'|'stageId'|'variant'>,onBirth:()=>void){
    // Hold the original egg while the result asset loads. Ownership was already
    // committed, so a failed asset request must still release the result UI.
    let finish!:()=>void;
    const completed=new Promise<void>(resolve=>{finish=resolve;});
    const birth=this.birth={id,egg,at:Infinity,done:finish,onBirth};
    let timeout=0;
    try{
      await Promise.race([loadVoxels([`pet-${id}`]),new Promise<never>((_,reject)=>{timeout=window.setTimeout(()=>reject(Error('Pet asset timeout')),15000);})]);
      clearTimeout(timeout);birth.at=performance.now();await completed;
    }
    finally{clearTimeout(timeout);if(this.birth===birth)this.birth=undefined;this.hatchBurst.visible=false;}
  }
  private positionHatchTouch(){
    const button=document.getElementById('hatch-touch');
    if(!button||button.hidden||!this.hatchModel)return;
    this.hatchModel.updateWorldMatrix(true,true);
    const box=new T.Box3().setFromObject(this.hatchModel),rect=this.host.getBoundingClientRect();
    const points=[];
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(this.camera));
    const left=Math.max(8,(Math.min(...points.map(p=>p.x))+1)*rect.width/2),right=Math.min(rect.width-8,(Math.max(...points.map(p=>p.x))+1)*rect.width/2);
    const top=(1-Math.max(...points.map(p=>p.y)))*rect.height/2,bottom=(1-Math.min(...points.map(p=>p.y)))*rect.height/2;
    Object.assign(button.style,{left:`${left}px`,top:`${top}px`,width:`${Math.max(44,right-left)}px`,height:`${Math.max(44,bottom-top)}px`});
    // The model bounds can be asymmetric; center the prompt on the viewport.
    button.querySelector('span')!.style.left=`${rect.width/2-left}px`;
  }
  followerMetrics(){return this.companions.children.map(p=>({x:p.position.x,z:p.position.z,rotation:p.rotation.y,scale:p.scale.x}));}
  render(game: GameState, mode: string, dt: number, time: number) {
    this.animateBat(this.player,game.now()-this.swungAt);
    if(this.appearance!==(game.save.appearance??0)){this.appearance=game.save.appearance??0;this.decorateAvatar(this.player,this.appearance);}
    if (time - this.hudMeasureAt > 0.3 || this.hudMeasureAt < 0) {
      this.hudMeasureAt = time;
      const host = this.host.getBoundingClientRect();
      // Exploration overlays never change framing; the hatchery has its own layout.
      const hatchLayout=mode==='hatchery'||game.result!==null||!!game.returnReward;
      if(hatchLayout){
        const top=game.returnReward?host.height*.12:document.getElementById('top-hud')!.getBoundingClientRect().bottom-host.top;
        const bottom=document.getElementById('bottom-hud')!;
        const end=game.returnReward?document.getElementById('reward-copy')!.getBoundingClientRect().top-host.top:bottom.hidden?host.height*.8:bottom.getBoundingClientRect().top-host.top-36;
        this.viewportOffset=host.height/2-(top+end)/2;
      }else this.viewportOffset = -host.height * .05;
      this.camera.setViewOffset(
        host.width,
        host.height,
        0,
        this.viewportOffset,
        host.width,
        host.height,
      );
    }
    const isReward=!!game.returnReward;
    const isHatch = mode === "hatchery" || game.result !== null || isReward;
    this.hazardsView.render(game,!isHatch,time);
    this.nestGroup.visible=!isHatch;
    this.farm.visible=this.farmPets.visible=!isHatch && game.z>-22;
    if(this.farm.visible)void this.showFarmPets(game).catch(err=>{this.assetError=String(err);});
    this.farmPets.children.forEach((pet,i)=>{
      const plot=farmPlot(game.farmSlot);
      const at=farmLocal(game.farmSlot,Math.sin(i*2.4+time*.12),2.8+Math.cos(i*2.4+time*.12)*.35);pet.position.set(at.x,0,at.z);
      pet.rotation.y=plot.rotation-i*2.4-time*.12;pet.position.y=Math.abs(Math.sin(time*2+i))*.05;animateEgg(pet,time,this.low);
      animatePet(pet,pet.userData.petId,time,false,this.reducedMotion.matches);
    });
    this.roomFarmPets.children.forEach(pet=>animatePet(pet,pet.userData.petId,time,false,this.reducedMotion.matches));
    this.terrain.visible =
      this.player.visible =
      this.eggs.visible =
      this.companions.visible =
      this.storage.visible =
        !isHatch;
    this.hatch.visible = isHatch;
    const deathAge=game.death?(game.now()-game.death.at)/1000:Infinity;
    const reviveAge=(game.now()-game.revivedAt)/1000;
    const fall=game.death?(this.reducedMotion.matches?1:T.MathUtils.smoothstep(deathAge,.05,.8)):0;
    this.player.scale.setScalar(1);
    this.player.rotation.z=game.death?-Math.PI*.49*fall:T.MathUtils.lerp(this.player.rotation.z,game.now()<game.knockedUntil?Math.PI/2:0,1-Math.exp(-dt*15));
    this.player.rotation.x=.1*fall;
    const bat=this.player.getObjectByName('bat');if(game.death&&bat)bat.visible=false;
    this.lifeEffects.visible=!isHatch&&(deathAge<.8||reviveAge<1.5);
    if(this.lifeEffects.visible){
      const dying=!!game.death,age=dying?deathAge:reviveAge;
      const material=this.lifeEffects.material as T.MeshBasicMaterial;
      material.color.set(dying?0xd5c39e:0xffe29b);material.opacity=Math.max(0,1-age/(dying?.8:1.5));
      const particle=new T.Object3D();
      for(let i=0;i<32;i++){
        const angle=i*2.399,radius=dying?age*(.3+i%4*.15):Math.max(0,1.4-age)*(1+i%3*.2);
        particle.position.set(game.x+Math.cos(angle)*radius,(dying?.08:.3)+age*(dying?.2:1)+i%4*(dying?.025:.15),game.z+Math.sin(angle)*radius);
        particle.scale.setScalar(dying?1:1.6);particle.rotation.set(angle,age*3,angle);particle.updateMatrix();this.lifeEffects.setMatrixAt(i,particle.matrix);
      }
      this.lifeEffects.instanceMatrix.needsUpdate=true;
    }
    this.nightBarrier.visible=game.isNight&&!isHatch;
    const visibleEggs=game.world.filter(e=>Math.abs(e.z-game.z)<24);
    const worldKey = visibleEggs.map((e) => e.id).join("|");
    if (worldKey !== this.lastWorld) {
      this.lastWorld = worldKey;
      const existing=new Map(this.eggs.children.map(m=>[m.userData.id as string,m]));
      const visibleIds=new Set(visibleEggs.map(e=>e.id));
      for(const [id,m]of existing)if(!visibleIds.has(id)){
        this.clearPetInstances(m as T.Group);this.eggs.remove(m);
      }
      for (const e of visibleEggs) {
        if(existing.has(e.id))continue;
        const m = this.eggModel(e);
        m.position.set(e.x, 0.06, e.z);
        m.scale.setScalar(RARITIES[EGGS[e.type].tier].scale*BALANCE.eggVisualScale);
        m.userData.id = e.id;
        const nestScale=m.scale.x*1.45;
        const nestKey=`${e.region}:${e.homeX}:${e.homeZ}`;
        if(e.homeX!==undefined&&!this.nests.has(nestKey)){
          const nest=nestVisual(e);this.nests.set(nestKey,nest);this.nestGroup.add(nest);
        }
        const nest=this.nests.get(nestKey);
        if(nest){nest.position.set(e.homeX??e.x,.02,e.homeZ??e.z);nest.scale.setScalar(nestScale);}
        m.position.y=e.x===e.homeX&&e.z===e.homeZ ? .02+2.5/18*nestScale : .03;
        const shell=m.children.find(child=>child instanceof T.Mesh && !(child instanceof T.InstancedMesh)) as T.Mesh;
        const outline=new T.Mesh(shell.geometry,this.selectionMaterial);
        outline.name="selection-outline";outline.scale.setScalar(1.035);outline.visible=false;m.add(outline);
        this.eggs.add(m);
      }
    }
    this.eggs.children.forEach((m) => {
      const egg=game.world.find(e=>e.id===m.userData.id);
      if(egg){
        const held=game.bosses.some(b=>b.loot?.id===egg.id);
        const atNest=egg.x===egg.homeX&&egg.z===egg.homeZ;
        m.position.set(egg.x,held?1.2:atNest?.02+2.5/18*m.scale.x*1.45:.03,egg.z);
      }
      m.getObjectByName("selection-outline")!.visible=!game.carried&&game.near?.id===m.userData.id;
      m.visible = Math.abs(m.position.z - game.z) < 22;
      if (m.visible) animateEgg(m, time, this.low);
    });
    // Previously every visited nest stayed renderable for the whole expedition.
    for(const nest of this.nests.values())nest.visible=Math.abs(nest.position.z-game.z)<28;
    this.terrain.children.forEach((m) => {
      if (m instanceof T.Group)
        m.visible = Math.abs(m.position.z - game.z) < 24;
    });
    if (game.flyaway && game.flyaway.at !== this.flyAt) {
      this.flyAt = game.flyaway.at;
      this.clearPetInstances(this.flying);
      const egg=this.eggModel(game.flyaway);
      egg.scale.setScalar(BALANCE.eggVisualScale);
      this.flying.add(egg);
    }
    const flyAge = game.flyaway ? (game.now() - game.flyaway.at) / 1000 : 10;
    this.flying.visible = flyAge < 2.5 && !isHatch;
    if (this.flying.visible) {
      this.flying.position.set(flyAge * 3, 1 + flyAge * 2, 0);
      this.flying.rotation.z = -flyAge * 2;
    }
    this.player.position.set(
      game.x+this.networkOffset.x,
      game.death ? .4*fall : game.knockback.remaining>0 ? Math.sin(game.knockback.remaining/.28*Math.PI)*.65 : game.launch ? Math.sin(game.launch.elapsed * Math.PI) * 2.5 : game.training ? .2+Math.abs(Math.sin(time*14))*.05 : reviveAge<.7?Math.sin(reviveAge/.7*Math.PI)*.4:0,
      game.z+this.networkOffset.z,
    );
    this.trail=followPets(this.companions,this.trail,this.player.position,game.facing,dt,time,this.low,this.reducedMotion.matches);
    const storageKey = game.save.eggs.map((e) => e.id).join("|");
    if (storageKey !== this.storageKey) {
      this.storageKey = storageKey;
      this.clearPetInstances(this.storage);
      game.save.eggs.forEach((e, i) => {
        const m = this.eggModel(e);
        m.scale.setScalar(0.55*BALANCE.eggPresentationScale);
        m.position.set(-4 + (i % 3) * 0.7*BALANCE.eggPresentationScale, 0.8, 0.3 + Math.floor(i / 3) * 0.65*BALANCE.eggPresentationScale);
        this.storage.add(m);
      });
    }
    this.storage.children.forEach((m) => animateEgg(m, time, this.low));
    this.environment.update(game,isHatch,this.low,this.player,this.peers.values());
    const moving = !game.death&&(game.training || Boolean(this.player.userData.moving));
    if(game.training)this.player.rotation.y=farmPlot(game.farmSlot).rotation+Math.PI;
    const rig = this.player.children[1];
    if (rig) {
      rig.position.y = game.death?0:moving
        ? Math.abs(Math.sin(time * 9)) * 0.07
        : Math.sin(time * 2) * 0.025;
      for (const side of ["left", "right"]) {
        const sign = side === "left" ? 1 : -1;
        const leg = rig.getObjectByName(`${side}_leg`),
          arm = rig.getObjectByName(`${side}_arm`);
        if (leg) leg.rotation.x = game.death?.2*fall:moving ? Math.sin(time * 9) * 0.4 * sign : 0;
        if (arm)
          arm.rotation.x = game.death?-.35*fall:game.carried
            ? -2.4
            : moving
              ? -Math.sin(time * 9) * 0.3 * sign
              : 0;
      }
    }
    const carryId = game.carried?.id ?? "";
    if (this.carry.userData.id !== carryId) {
      this.clearPetInstances(this.carry);
      this.carry.userData.id = carryId;
      if (game.carried) {
        const m = this.eggModel(game.carried);
        m.scale.setScalar(RARITIES[EGGS[game.carried.type].tier].scale * 0.85*BALANCE.eggVisualScale);
        m.position.y = 1.12;
        this.carry.add(m);
      }
    }
    this.carry.children.forEach((m) => animateEgg(m, time, this.low));
    const near = game.near;
    this.highlight.visible = false;
    if (near) this.highlight.position.set(near.x, 0.055, near.z);
    const birthAge=this.birth?(performance.now()-this.birth.at)/1000:-1;
    const birthEgg=this.birth&&birthAge<1.05?this.birth.egg:undefined;
    const shownResult=birthEgg?null:game.result;
    const appearance=birthEgg??game.returnReward??game.selected;
    const hatchKey = birthEgg?`birth:${this.birth!.id}`:
      isReward ? `reward:${game.returnReward!.type}:${game.returnReward!.stageId}:${game.returnReward!.variant}` : shownResult !== null
        ? `result:${shownResult}`
        : (game.selected?.id ?? "empty");
    if (hatchKey !== this.hatchKey)
      void this.updateHatch(hatchKey, appearance?.type ?? 0, isReward ? null : shownResult,appearance).catch(err => { this.hatchKey = ""; this.assetError = String(err); });
    this.hatchBurst.update(birthAge,this.birth?MONGLES[this.birth.id].tier:0,this.reducedMotion.matches,this.low);
    if(this.birth&&birthAge>=1.05&&this.birth.onBirth){this.birth.onBirth();this.birth.onBirth=undefined;}
    if(this.birth&&birthAge>=2.7)this.birth.done();
    this.crack.visible = isHatch && !!game.selected && game.result===null && !isReward;
    const stage = game.selected ? crackStage(game.selected.hp, eggMaxHp(game.selected)) : 0;
    if (this.crack.userData.stage !== stage) {
      this.crack.userData.stage = stage;
      for (const child of [...this.crack.children]) {
        (child as T.Mesh).geometry.dispose();
        this.crack.remove(child);
      }
      for (let i = 0; i < stage * 3; i++) {
        const m = new T.Mesh(
          new T.BoxGeometry(0.07, 0.17, 0.045),
          new T.MeshBasicMaterial({ color: stage === 3 ? 0xffdf72 : 0x736957 }),
        );
        m.position.set(Math.sin(i * 2) * 0.28, 0.4 + i * 0.11, 0.84);
        m.rotation.z = i % 2 ? 0.5 : -0.5;
        this.crack.add(m);
      }
    }
    if (this.hatchModel) {
      animateEgg(this.hatchModel, time, this.low);
      if(shownResult!==null){animatePet(this.hatchModel,shownResult,time,false,this.reducedMotion.matches);this.hatchModel.userData.greetingAt??=time;greetPet(this.hatchModel,shownResult,time-this.hatchModel.userData.greetingAt,this.reducedMotion.matches);}
      this.hatchModel.visible = !!game.selected || game.result !== null || isReward;
      const hitAge=(performance.now()-this.hitAt)/1000;
      const kick = Math.max(0, 1 - hitAge / .36);
      this.hatchModel.rotation.z = this.reducedMotion.matches?0:Math.sin(hitAge * 48) * kick * 0.23;
      this.hatchModel.position.x=this.reducedMotion.matches?0:Math.sin(hitAge*48)*kick*.1;
      this.hatchModel.rotation.y = birthEgg&&!this.reducedMotion.matches&&birthAge>=0 ? birthAge*birthAge*30 : isReward ? time*.8 : isHatch ? -0.25 : 0;
      this.hatchModel.position.y =
        shownResult !== null ? Math.abs(Math.sin(time * 3)) * 0.2 : 0;
    }
    const target = isHatch
      ? new T.Vector3(0, 1, 0)
      : new T.Vector3(this.player.position.x, 0.3, game.training?this.player.position.z:game.isAtBase ? Math.max(1,this.player.position.z) : this.player.position.z - 1.4);
    this.focus.lerp(target, 1 - Math.exp(-dt * 6));
    this.camera.position.copy(this.focus).add(new T.Vector3(8, 11, 12));
    this.camera.lookAt(this.focus);
    if(!isHatch&&!this.reducedMotion.matches&&this.chasePressure>0){
      const strength=.1*this.chasePressure*this.chasePressure;
      this.camera.position.x+=Math.sin(time*39)*strength;
      this.camera.position.y+=Math.sin(time*47+1)*strength*.65;
    }
    // Picking up an egg or showing a contextual button must not zoom the map.
    this.camera.zoom = isHatch ? 1.4 : .78;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();this.positionHatchTouch();
    const guide=document.getElementById('first-egg-arrow');
    const guideEgg=mode==='explore'&&!isHatch&&document.getElementById('modal')!.hidden?firstEggTarget(game):undefined;
    if(guide){
      guide.hidden=!guideEgg;
      if(guideEgg){
        const p=new T.Vector3(guideEgg.x,2,guideEgg.z).project(this.camera);
        guide.style.left=`${Math.max(40,Math.min(this.host.clientWidth-40,(p.x+1)*this.host.clientWidth/2))}px`;
        guide.style.top=`${Math.max(180,Math.min(this.host.clientHeight-180,(1-p.y)*this.host.clientHeight/2))}px`;
      }
    }
    const hit=game.hitSource,hitAge=hit?(game.now()-hit.at)/1000:Infinity;
    this.damageDirection.hidden=isHatch||game.isAtBase||hitAge<0||hitAge>DAMAGE_OVER_TIME.directionSeconds;
    if(hit&&!this.damageDirection.hidden){
      const p=new T.Vector3(game.x,.8,game.z).project(this.camera),source=new T.Vector3(hit.x,.8,hit.z).project(this.camera);
      const dx=(source.x-p.x)*this.host.clientWidth,dy=-(source.y-p.y)*this.host.clientHeight;
      const angle=Math.hypot(dx,dy)>.01?Math.atan2(dy,dx):-Math.PI/2;
      this.damageDirection.style.left=`${Math.max(18,Math.min(this.host.clientWidth-18,(p.x+1)*this.host.clientWidth/2+Math.cos(angle)*64))}px`;
      this.damageDirection.style.top=`${Math.max(18,Math.min(this.host.clientHeight-18,(1-p.y)*this.host.clientHeight/2+Math.sin(angle)*64))}px`;
      this.damageDirection.style.transform=`translate(-50%,-50%) rotate(${angle+Math.PI/2}rad)`;
      this.damageDirection.style.opacity=String(Math.min(1,(DAMAGE_OVER_TIME.directionSeconds-hitAge)*3));
    }
    for(const gain of [...this.trainingGains]){
      const age=(game.now()-gain.at)/1000;
      if(age>1.3){gain.el.remove();this.trainingGains=this.trainingGains.filter(g=>g!==gain);continue;}
      const p=this.player.position.clone();p.y+=1.3+age*.7;p.project(this.camera);
      gain.el.style.left=`${(p.x+1)/2*this.host.clientWidth}px`;gain.el.style.top=`${(1-p.y)/2*this.host.clientHeight}px`;gain.el.style.opacity=String(Math.min(1,(1.3-age)*2));
      gain.el.hidden=isHatch;
    }
    this.sun.target.position.set(game.x, 0, game.z);
    const labelIds=game.save.active.join(',');
    if(this.petLabels.dataset.ids!==labelIds){
      this.petLabels.dataset.ids=labelIds;
      this.petLabels.innerHTML=game.save.active.map(id=>`<div class="pet-label"><b><span style="color:${RARITIES[MONGLES[id].tier].color}">[${RARITIES[MONGLES[id].tier].name}]</span> ${MONGLES[id].name}</b><div class="stat-badges">${petAbilities(MONGLES[id])}</div></div>`).join('');
    }
    this.petLabels.hidden=isHatch;
    const labelBoxes:{x:number;y:number;height:number;width:number}[]=[];
    const positionPetLabel=(pet:T.Object3D,label:HTMLElement)=>{
      const p=pet.position.clone();p.y+=(pet.userData.labelHeight??.8)*pet.scale.x+.06;p.project(this.camera);
      label.hidden=p.z>1||Math.abs(p.x)>.95||Math.abs(p.y)>.85;
      if(label.hidden)return;
      const halfWidth=label.offsetWidth/2+4;
      const lx=Math.max(halfWidth,Math.min(this.host.clientWidth-halfWidth,(p.x+1)/2*this.host.clientWidth));
      const ly=(1-p.y)/2*this.host.clientHeight,height=label.offsetHeight;
      // Keep the label attached to its pet. Crowded labels yield in stable order
      // instead of pushing each other around; extra release space prevents flicker.
      const gap=label.dataset.occluded==='true'?8:2;
      const occluded=labelBoxes.some(box=>Math.abs(box.x-lx)<halfWidth+box.width+gap&&ly-height<box.y+gap&&ly>box.y-box.height-gap);
      label.dataset.occluded=String(occluded);label.hidden=occluded;
      if(!occluded)labelBoxes.push({x:lx,y:ly,height,width:halfWidth});
      label.style.left=`${lx}px`;label.style.top=`${ly}px`;
    };
    this.companions.children.forEach((pet,i)=>{
      const label=this.petLabels.children[i] as HTMLElement|undefined;if(label)positionPetLabel(pet,label);
    });
    this.peerPetLabels.hidden=isHatch||mode!=='explore';
    const peerLabelKeys=new Set<string>();
    for(const [owner,entry] of this.peerPets)entry.group.children.forEach((pet,index)=>{
      const id=pet.userData.petId as number,definition=MONGLES[id];if(!definition)return;
      const key=`${owner}:${index}`;peerLabelKeys.add(key);
      let row=this.peerPetLabelEntries.get(key);
      if(!row||row.id!==id){
        row?.label.remove();const label=document.createElement('div'),name=document.createElement('b'),tier=document.createElement('span');
        label.className='pet-label peer-pet-label';tier.style.color=RARITIES[definition.tier].color;
        tier.textContent=`[${RARITIES[definition.tier].name}]`;name.append(tier,` ${definition.name}`);label.append(name);
        this.peerPetLabels.append(label);row={id,label};this.peerPetLabelEntries.set(key,row);
      }
      if(!entry.group.visible){row.label.hidden=true;return;}
      positionPetLabel(pet,row.label);
    });
    for(const [key,row] of this.peerPetLabelEntries)if(!peerLabelKeys.has(key)){row.label.remove();this.peerPetLabelEntries.delete(key);}
    const trailDef=TRAILS[game.save.equippedTrail??0];
    this.footTrail.visible=!isHatch&&moving&&trailDef.multiplier>1;
    (this.footTrail.material as T.MeshBasicMaterial).color.set(trailDef.color);
    const marker=new T.Object3D();
    for(let i=0;i<24;i++){const p=this.trail[Math.min(this.trail.length-1,i*2)];if(!p)continue;marker.position.copy(p);marker.position.x+=Math.sin(i*2)*.16;marker.position.y=.1;marker.scale.setScalar(1-i/28);marker.updateMatrix();this.footTrail.setMatrixAt(i,marker.matrix);}
    this.footTrail.instanceMatrix.needsUpdate=true;
    const health=document.getElementById('health-hud');
    if(health){
      this.healthAnchor.copy(this.player.position);this.healthAnchor.y+=1.4;this.healthAnchor.project(this.camera);
      health.hidden=isHatch||mode!=='explore'||game.hp>=game.maxHp||game.hp<=0||Math.abs(this.healthAnchor.x)>1||Math.abs(this.healthAnchor.y)>1||this.healthAnchor.z>1;
      health.style.left=`${(this.healthAnchor.x+1)/2*this.host.clientWidth}px`;
      health.style.top=`${(1-this.healthAnchor.y)/2*this.host.clientHeight}px`;
    }
    this.terrain.visible=!isHatch;
    this.renderer.render(this.scene, this.camera);
  }
}
