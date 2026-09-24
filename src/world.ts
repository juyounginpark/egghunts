import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { EGGS, REGIONS, RARITIES, BALANCE, MONGLES, TRAILS, crackStage } from "./data";
import { eggVisual, petVisual, animateEgg } from "./visuals";
import type { Egg, GameState } from "./game";
import { voxelModel as model, loadVoxels,voxelColliders } from "./voxel";
import {villageMapColliders,type MapCollider} from './map-collision';
import type { Peer } from "./multiplayer";
import { formatNumber } from "./format";
import {petAbilities} from './pet-stats';
import {HazardView} from "./hazard-view";
import {FARM_PLOTS,farmPlot,farmGym} from './village';
import {villageArt} from './world-art';
import {animatePet} from './pet-animation';
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
  private roomFarmKey='';
  private roomFarmPets=new T.Group();
  private async showRoomFarms(players:Peer[]){
    const entries=players.filter(p=>p.slot!==undefined).flatMap(p=>(p.pets??[]).slice(0,3).map((id,i)=>({id,i,slot:p.slot!})));
    const key=JSON.stringify(entries);if(key===this.roomFarmKey)return;this.roomFarmKey=key;
    await loadVoxels(entries.map(p=>`pet-${p.id}`));if(key!==this.roomFarmKey)return;
    this.roomFarmPets.clear();
    for(const p of entries){const pet=petVisual(p.id,p.id<6),plot=farmPlot(p.slot);pet.scale.setScalar(Math.min(1.5,MONGLES[p.id].scale));pet.position.set(plot.x-1+p.i,0,plot.z+1.8);this.roomFarmPets.add(pet);}
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
    const hat=new T.Mesh(new T.BoxGeometry(.65,.16,.6),new T.MeshLambertMaterial({color:[0x99c76b,0xffb677,0x83cdf0][choice]}));
    hat.name='avatar-accessory';hat.position.set(0,1.05,0);hat.rotation.z=choice===1?.16:0;avatar.add(hat);
    if(old instanceof T.Mesh){old.geometry.dispose();(old.material as T.Material).dispose();}
  }
  updatePeers(players:Peer[],visible:boolean,now:number){
    const frameAt=performance.now(),dt=Math.min(.1,Math.max(0,(frameAt-this.peerFrameAt)/1000)),blend=1-Math.exp(-dt*12);this.peerFrameAt=frameAt;
    this.roomFarmPets.visible=visible;void this.showRoomFarms(players).catch(err=>{this.assetError=String(err);});
    for(const [id,avatar] of this.peers)if(!players.some(p=>p.id===id)){
      const accessory=avatar.getObjectByName('avatar-accessory') as T.Mesh;
      if(accessory){accessory.geometry.dispose();(accessory.material as T.Material).dispose();}
      this.scene.remove(avatar);this.peers.delete(id);
    }
    for(const peer of players){
      if(!this.peers.has(peer.id)){const avatar=model('alkong');avatar.position.set(peer.x,0,peer.z);avatar.userData.appearance=-1;this.peers.set(peer.id,avatar);this.scene.add(avatar);}
      const avatar=this.peers.get(peer.id)!;
      if(avatar.userData.snapshot!==peer){
        if(peer.attackAt!==avatar.userData.attackAt&&now-peer.attackAt<1500)avatar.userData.swingReceived=frameAt;
        if(peer.hitAt!==avatar.userData.hitAt&&now<peer.downUntil)avatar.userData.hitReceived=frameAt;
        avatar.userData.snapshot=peer;avatar.userData.receivedAt=frameAt;avatar.userData.attackAt=peer.attackAt;avatar.userData.hitAt=peer.hitAt;
      }
      const lead=Math.min(.2,(frameAt-avatar.userData.receivedAt)/1000),down=now<peer.downUntil;
      const tx=peer.x+(down?0:(peer.velocity?.x??0)*lead),tz=peer.z+(down?0:(peer.velocity?.z??0)*lead);
      const snap=Math.hypot(tx-avatar.position.x,tz-avatar.position.z)>12;
      avatar.visible=visible;avatar.position.x+=(tx-avatar.position.x)*(snap?1:blend);avatar.position.z+=(tz-avatar.position.z)*(snap?1:blend);
      const flight=(frameAt-(avatar.userData.hitReceived??-Infinity))/(BALANCE.batFlightSeconds*1000);
      avatar.position.y=down&&flight>=0&&flight<1?Math.sin(flight*Math.PI)*.65:0;
      avatar.rotation.y+=Math.atan2(Math.sin(peer.rotation-avatar.rotation.y),Math.cos(peer.rotation-avatar.rotation.y))*blend;
      avatar.rotation.z+=( (down?Math.PI/2:0)-avatar.rotation.z)*blend;
      this.animateBat(avatar,frameAt-(avatar.userData.swingReceived??-Infinity));
      const eggKey=peer.egg?.id??peer.carried;
      if(avatar.userData.egg!==eggKey){
        const old=avatar.getObjectByName('peer-egg');if(old)avatar.remove(old);
        if(peer.carried!==null){const egg=this.eggModel(peer.egg??{type:peer.carried});egg.name='peer-egg';egg.position.y=1.12;egg.scale.setScalar(RARITIES[EGGS[peer.carried].tier].scale*.85);avatar.add(egg);}
        avatar.userData.egg=eggKey;
      }
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
  private nightLight=0;
  private lastWorld = "";
  private nests = new Map<string,T.Group>();
  private nestGroup=new T.Group();
  private nightBarrier = new T.Mesh(new T.BoxGeometry(BALANCE.mapX*2,.8,.3),new T.MeshLambertMaterial({color:0xa9875c}));
  private selectionMaterial = new T.MeshBasicMaterial({color:0xff2525,side:T.BackSide});
  private hatchKey = "";
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
    this.renderer.shadowMap.type = T.PCFShadowMap;
    this.renderer.setClearColor(0xe9f0d8);
    host.append(this.renderer.domElement);
    this.petLabels.id="pet-labels";host.append(this.petLabels);
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
    this.scene.fog = new T.Fog(0xe9f0d8, 28, 65);
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
    await loadVoxels([...Array.from({length:20},(_,i)=>`guardian-${i+1}`),"guardian-final","alkong", "tree", "mushroom", "camp", "nest", "crystal", "ruin", "meteor", "pedestal", "barn", "fence", "gate", "well", "carrots", "cabbage", "hay", "flower", "lantern", "feed", "shop", "appletree", "beehive", "teapot", "log", "cart", "stalagmite", "statue", "column", "antenna", "starflower", ...EGGS.map((_, i) => `egg-${i}`)]);
    this.player.add(model("alkong", true));
    this.eggModels = EGGS.map((_, i) => eggVisual(i));
    const groundMaterial = new T.MeshLambertMaterial({ vertexColors: true });
    const chunks: T.BufferGeometry[] = [];
    const block = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: number,
    ) => {
      const g = new T.BoxGeometry(w, h, d).toNonIndexed();
      g.translate(x, y, z);
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
    for (let z = 24; z >= -4; z -= 2) {
      const region = REGIONS.filter((r) => -z >= r.start).at(-1) ?? REGIONS[0];
      for (let x = z >= -4 ? -16 : -8; x <= (z >= -4 ? 16 : 8); x += 2) {
        const path = Math.abs(x) < 2;
        block(x, -0.5, z, 2, 0.9, 2, path ? (REGIONS.indexOf(region)%2 ? 0xb0afb4 : 0xd8d0a5) : region.color);
        const scatter=Math.abs(Math.sin(x*41.7+z*17.3)*43758.5453)%1;
        if (Math.abs(x) >= 4 && scatter>.65) {
          block(x + scatter*1.7-.8, 0.09, z + Math.sin(z*7+x)*.8, 0.15, 0.22, 0.15, 0xf9efd0);
          if(scatter>.85)block(x-.3, 0.07, z-.4, .2,.16,.2,region.color);
        }
      }
    }
    for(const p of villageArt())block(p.x,p.y,p.z,p.w,p.h,p.d,p.c);
    const g = mergeGeometries(chunks);
    chunks.forEach((c) => c.dispose());
    const mesh = new T.Mesh(g, groundMaterial);
    mesh.receiveShadow = true;
    this.terrain.add(mesh);
    const prop = (name:string,x:number,z:number,scale=1,rotation=0,parent:T.Group=this.terrain) => {
      if(!['flower','carrots','cabbage'].includes(name))this.mapColliders.push(...voxelColliders(name,x,z,scale,rotation));
      const g=model(name);g.position.set(x,0,z);g.scale.setScalar(scale);g.rotation.y=rotation;parent.add(g);return g;
    };
    for(const [slot,plot] of FARM_PLOTS.entries()){
      prop("feed",plot.x-2,plot.z+2.5,1,0,this.farm);
      const position=farmGym(slot),gym=new T.Group();gym.name=`gym-${slot}`;gym.position.set(position.x,0,position.z);
      const material=new T.MeshLambertMaterial({color:[0x859e5d,0xc59566,0x7ca3ad,0xac8ab2,0xb8a35a][slot]});
      for(const [w,h,d,x,y,z] of [[1.2,.15,1.6,0,.08,0],[.85,.04,1.35,0,.18,0],[.12,1,.12,-.5,.6,-.7],[.12,1,.12,.5,.6,-.7],[1.1,.12,.12,0,1.05,-.7]]){
        const part=new T.Mesh(new T.BoxGeometry(w,h,d),material);part.position.set(x,y,z);gym.add(part);
      }
      this.farm.add(gym);
      // A numbered tile marks each assigned plot without a text-heavy panel.
      const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d')!;
      ctx.fillStyle='#fff4d7';ctx.fillRect(0,0,64,64);ctx.strokeStyle='#68724d';ctx.lineWidth=6;ctx.strokeRect(3,3,58,58);ctx.fillStyle='#465334';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText(String(slot+1),32,46);
      const tile=new T.Mesh(new T.PlaneGeometry(.8,.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas)}));tile.rotation.x=-Math.PI/2;tile.position.set(plot.x,.025,plot.z);this.farm.add(tile);
    }
    // Collision geometry is identical in the client and the authoritative server.
    this.mapColliders.splice(0,this.mapColliders.length,...villageMapColliders());
    const pedestal = model("pedestal");
    pedestal.scale.set(2.5, 1, 2.5);
    pedestal.position.y = -0.2;
    this.hatch.add(pedestal, this.crack);
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
    this.farmPets.clear();ids.forEach((id,i)=>{const m=petVisual(id,id<6);m.scale.setScalar(Math.min(1.5,MONGLES[id].scale));m.userData.slot=i;this.farmPets.add(m);});
  }
  async updateHatch(key: string, type: number, result: number | null, appearance?:Pick<Egg,'type'|'stageId'|'variant'>) {
    this.hatchKey = key;
    if (result !== null) await loadVoxels([`pet-${result}`]);
    const m =
      result !== null ? petVisual(result) : this.eggModel(appearance??{type});
    if (this.hatchKey !== key) return;
    if (this.hatchModel) this.hatch.remove(this.hatchModel);
    this.hatchModel = m ?? null;
    if (m) {
      m.scale.setScalar(result !== null ? 2 : 2.5);
      this.hatch.add(m);
    }
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
        const top=document.getElementById('top-hud')!.getBoundingClientRect().bottom-host.top;
        const bottom=document.getElementById('bottom-hud')!;
        const end=bottom.hidden?host.height*.8:bottom.getBoundingClientRect().top-host.top;
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
      pet.position.set(plot.x+2*Math.sin(i*2.4+time*.12),0,plot.z+1+Math.cos(i*2.4+time*.12));
      pet.rotation.y=-i*2.4-time*.12;pet.position.y=Math.abs(Math.sin(time*2+i))*.05;animateEgg(pet,time,this.low);
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
      this.eggs.clear();
      for (const e of visibleEggs) {
        const m = this.eggModel(e);
        m.position.set(e.x, 0.06, e.z);
        m.scale.setScalar(RARITIES[EGGS[e.type].tier].scale);
        m.userData.id = e.id;
        const nestScale=m.scale.x*1.45;
        const nestKey=`${e.region}:${e.homeX}:${e.homeZ}`;
        if(e.homeX!==undefined&&!this.nests.has(nestKey)){
          const nest=model("nest");this.nests.set(nestKey,nest);this.nestGroup.add(nest);
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
    this.terrain.children.forEach((m) => {
      if (m instanceof T.Group)
        m.visible = Math.abs(m.position.z - game.z) < 24;
    });
    if (game.flyaway && game.flyaway.at !== this.flyAt) {
      this.flyAt = game.flyaway.at;
      this.flying.clear();
      this.flying.add(this.eggModel(game.flyaway));
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
    const here = new T.Vector3(this.player.position.x, 0, this.player.position.z);
    if (!this.trail.length || this.trail[0].distanceTo(here) > 10) {
      this.trail = Array.from({ length: 500 }, (_, i) =>
        here.clone().add(new T.Vector3(-game.facing.x*i*.1,0,-game.facing.z*i*.1)),
      );
    }
    if (this.trail[0].distanceTo(here) > 0.08) {
      this.trail.unshift(here);
      this.trail.length = Math.min(700, this.trail.length);
    }
    let followerDistance=0;
    this.companions.children.forEach((pet, i) => {
      followerDistance+=Math.max(1.2,pet.scale.x*.6)+(i?Math.max(.4,this.companions.children[i-1].scale.x*.35):.3);
      let length = 0,
        target = this.trail.at(-1)!;
      for (let j = 1; j < this.trail.length; j++) {
        length += this.trail[j].distanceTo(this.trail[j - 1]);
        if (length >= followerDistance) {
          const segment=this.trail[j].distanceTo(this.trail[j-1]);
          target = this.trail[j-1].clone().lerp(this.trail[j],1-(length-followerDistance)/(segment||1));
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
      pet.position.y = walking ? Math.abs(Math.sin(time * 11 - i)) * 0.13 : 0;
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
      animateEgg(pet,time,this.low);
      animatePet(pet,pet.userData.petId,time,walking,this.reducedMotion.matches);
      const aura = pet.getObjectByName("aura");
      if (aura) aura.scale.setScalar(0.45 + Math.sin(time * 2 + i) * 0.025);
    });
    const storageKey = game.save.eggs.map((e) => e.id).join("|");
    if (storageKey !== this.storageKey) {
      this.storageKey = storageKey;
      this.storage.clear();
      game.save.eggs.forEach((e, i) => {
        const m = this.eggModel(e);
        m.scale.setScalar(0.55);
        m.position.set(-4 + (i % 3) * 0.7, 0.8, 0.3 + Math.floor(i / 3) * 0.65);
        this.storage.add(m);
      });
    }
    this.storage.children.forEach((m) => animateEgg(m, time, this.low));
    const sky = !isHatch && game.distance>8 ? new T.Color(game.stage.color).lerp(new T.Color(0xe9f0d8),.6).getHex() : 0xe9f0d8;
    this.renderer.setClearColor(game.isNight && !isHatch ? 0x303d61 : sky);
    (this.scene.fog as T.Fog).color.set(
      game.isNight && !isHatch ? 0x303d61 : sky,
    );
    this.nightLight=T.MathUtils.lerp(this.nightLight,game.isNight&&!isHatch?1:0,1-Math.exp(-dt*2));
    this.sun.intensity=T.MathUtils.lerp(3,.22,this.nightLight);
    this.sun.color.setHex(game.isNight&&!isHatch?0x98b7ff:0xfff5de);
    this.ambient.intensity=T.MathUtils.lerp(2.5,.45,this.nightLight);
    this.ambient.color.setHex(game.isNight&&!isHatch?0x779de7:0xfffae9);
    const moving = !game.death&&(game.training || Boolean(this.player.userData.moving));
    if(game.training)this.player.rotation.y=Math.PI;
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
      this.carry.clear();
      this.carry.userData.id = carryId;
      if (game.carried) {
        const m = this.eggModel(game.carried);
        m.scale.setScalar(RARITIES[EGGS[game.carried.type].tier].scale * 0.85);
        m.position.y = 1.12;
        this.carry.add(m);
      }
    }
    this.carry.children.forEach((m) => animateEgg(m, time, this.low));
    const near = game.near;
    this.highlight.visible = false;
    if (near) this.highlight.position.set(near.x, 0.055, near.z);
    const hatchKey =
      isReward ? `reward:${game.returnReward!.type}:${game.returnReward!.stageId}:${game.returnReward!.variant}` : game.result !== null
        ? `result:${game.result}`
        : (game.selected?.id ?? "empty");
    if (hatchKey !== this.hatchKey)
      void this.updateHatch(hatchKey, game.returnReward?.type ?? game.selected?.type ?? 0, isReward ? null : game.result,game.returnReward??game.selected).catch(err => { this.hatchKey = ""; this.assetError = String(err); });
    this.crack.visible = isHatch && !!game.selected;
    const stage = game.selected ? crackStage(game.selected.hp, EGGS[game.selected.type].hp) : 0;
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
      if (game.result === null) animateEgg(this.hatchModel, time, this.low);
      this.hatchModel.visible = !!game.selected || game.result !== null || isReward;
      const kick = Math.max(0, 1 - (performance.now() - this.hitAt) / 220);
      this.hatchModel.rotation.z = Math.sin(time * 70) * kick * 0.12;
      this.hatchModel.rotation.y = isReward ? time*.8 : isHatch ? -0.25 : 0;
      this.hatchModel.position.y =
        game.result !== null ? Math.abs(Math.sin(time * 3)) * 0.2 : 0;
    }
    const target = isHatch
      ? new T.Vector3(0, 1, 0)
      : new T.Vector3(this.player.position.x, 0.3, game.training?this.player.position.z:game.isAtBase ? 1 : this.player.position.z - 1.4);
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
    this.sun.position.set(game.x - 8, 18, game.z + 10);
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
    this.companions.children.forEach((pet,i)=>{
      const label=this.petLabels.children[i] as HTMLElement|undefined;if(!label)return;
      const p=pet.position.clone();p.y+=(pet.userData.labelHeight??.8)*pet.scale.x+.06;p.project(this.camera);
      const halfWidth=label.offsetWidth/2+4;
      let lx=Math.max(halfWidth,Math.min(this.host.clientWidth-halfWidth,(p.x+1)/2*this.host.clientWidth));
      let ly=(1-p.y)/2*this.host.clientHeight;
      // Prefer a small sideways nudge; never detach labels far above their pet.
      for(const box of labelBoxes)if(Math.abs(box.x-lx)<halfWidth+box.width&&Math.abs(box.y-ly)<box.height+3){lx=Math.max(halfWidth,Math.min(this.host.clientWidth-halfWidth,lx+(lx<box.x?-24:24)));ly=box.y-box.height-4;}
      labelBoxes.push({x:lx,y:ly,height:label.offsetHeight,width:halfWidth});label.style.left=`${lx}px`;label.style.top=`${ly}px`;
      label.hidden=p.z>1||Math.abs(p.x)>.95||Math.abs(p.y)>.85;
    });
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
