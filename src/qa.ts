// Imported only behind import.meta.env.DEV. Never included in the release bundle.
import { GameState, freshSave } from "./game";
import { EGGS, BALANCE } from "./data";
import {HAZARDS} from "./stage-data";
import type { World } from "./world";
import type { Input } from "./input";

let clock = 1_800_000_060_000;
let seed = Number(new URLSearchParams(location.search).get("seed") ?? 1001);
export const now = () => clock;
export let visualTime=2;
export const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
export const enabled = new URLSearchParams(location.search).get("qa") === "true";
export function prepare(game: GameState, scene: string) {
  clock=Math.floor(clock/BALANCE.nightInterval)*BALANCE.nightInterval+60000;
  seed=Number(new URLSearchParams(location.search).get("seed")??1001);
  const state = freshSave(clock);
  const revision=game.revision;
  state.tutorial = scene === "tutorial" ? 0 : 5;
  state.settings.sound = false;
  state.settings.haptic = false;
  Object.assign(game, new GameState(state, now, random));
  if (["upgrade", "collection", "pets", "store"].includes(scene)) {
    state.dust = 1000;
    state.mongles.fill(1);
    state.active = [0, 1, 2];
  }
  if(scene==='store')state.eggs=[{id:'sale-egg',type:11,hp:880,distance:43}];
  if (["egg-near", "rare-near", "egg-carry", "urgent", "egg-loss"].includes(scene)) {
    const egg = game.world[2];
    egg.type = scene === "rare-near" ? 30 : 0;
    egg.hp = EGGS[egg.type].hp;
    game.z = egg.z + 1;
    game.deadline = clock + game.duration * 1000;
    if (["egg-carry", "urgent", "egg-loss"].includes(scene)) game.interact();
    if (scene === "urgent") game.deadline = clock + 4000;
    if (scene === "egg-loss") { game.deadline = clock; game.tick(1 / 60); }
  }
  if (scene.startsWith("hatch") || scene === "result") {
    state.eggs = [{id: "qa-egg", type: 0, hp: scene === "hatch-cracked" ? 12 : 30, distance: 14}];
    state.selected = "qa-egg";
    if (["result", "hatch-burst"].includes(scene)) game.damage(30);
  }
  if(scene==="night") {clock=game.nightAt;game.tick(.01);}
  if(scene==="training"){game.x=BALANCE.gymX;game.z=BALANCE.gymZ;game.interact();game.tick(1);}
  if(scene.startsWith('hazard-')||scene==='low-health'){
    const id=scene==='low-health'?5:Number(scene.slice(7));game.selectStage(id);game.x=0;game.z=-14;game.deadline=clock+45000;
    game.pickup(game.world[2]);game.hazards.reset(id);const d=HAZARDS.find(h=>h.stageId===id)!;
    game.hazards.spawn(d,{x:0,z:-14,vx:0,vz:0,facing:game.facing,carrying:false,metal:false,moving:false});
    if(scene==='low-health')game.hp=25;
  }
  if(scene.startsWith('region-')){const id=Number(scene.slice(7));game.selectStage(id);game.x=0;game.z=-17;game.deadline=clock+45000;}
  if(['death','death-choice','revive'].includes(scene)){
    game.selectStage(5);game.z=-12;game.deadline=clock+30000;game.pickup(game.world[2]);game.hp=1;game.receiveHit(0);
    if(scene==='revive'){game.revive(true);clock+=300;}else clock+=scene==='death'?400:900;
  }
  if(scene==="farm-pets") {state.mongles[0]=state.mongles[4]=state.mongles[19]=1;state.active=[0,4,19];}
  if(scene.startsWith("stage-")) {const stage=Number(scene.slice(6));game.z=-[14,43,74,108,142][stage]+5;game.deadline=clock+45000;}
  game.revision=revision+1;
}
export function attach(game: GameState, world: World, input: Input, setTab: (tab: string) => void, save: () => Promise<void>) {
  const scene = new URLSearchParams(location.search).get("scene") ?? "base";
  if (new URLSearchParams(location.search).get("restore") !== "true") prepare(game, scene);
  setTab(scene.startsWith("hatch") || scene === "result" ? "hatchery" : ["upgrade", "collection", "pets", "store", "shop", "stages", "traits"].includes(scene) ? scene : "explore");
  const step = (seconds: number, vector?: {x: number; z: number}) => {
    for (let t = 0; t < seconds - 1e-8; t += 1 / 60) {
      const dt = Math.min(1 / 60, seconds - t);
      clock += dt * 1000;
      if (vector) game.move(vector.x, vector.z, dt);
      else {
        const v = input.vector();
        game.move(v.x * .832 + v.y * .555, -v.x * .555 + v.y * .832, dt);
      }
      game.tick(dt);
    }
  };
  const state = () => ({...game.snapshot(),stageId:game.stage.id,knockback:game.knockback,hp:game.hp,maxHp:game.maxHp, x: game.x, z: game.z, carried: game.carried, remaining: game.remaining, speed: game.speed, dps: game.dps, result: game.result, flyaway: game.flyaway, message: game.message, near: game.near, input: input.vector(),isNight:game.isNight,training:game.training,returnReward:game.returnReward});
  const qa = {
    pattern:(id:string,active=false)=>{
      const d=HAZARDS.find(h=>h.id===id)!;prepare(game,`hazard-${d.stageId}`);setTab('explore');
      game.pickup(game.world[2]);game.hazards.reset(d.stageId);const h=game.hazards.spawn(d,{x:game.x,z:game.z,vx:0,vz:0,facing:game.facing,carrying:false,metal:false,moving:false});
      h.phase=active?'Active':'Telegraph';h.elapsed=active?d.activeDuration*.4:h.warning*.5;game.events=[];
    },
    selectStage:(id:number)=>game.selectStage(id),
    region:(id:number,z=-17)=>{prepare(game,`region-${id}`);game.z=z;setTab('explore');},
    eggGallery:(id:number)=>{prepare(game,`region-${id}`);game.world=game.world.filter(e=>e.stageId===id);for(const e of game.world){e.type=0;e.hp=30;}setTab('explore');},
    cycle:(night:boolean)=>{clock=night?game.nightAt:game.nightUntil+1000;game.tick(.01);},
    daylight:()=>{clock=Math.floor(clock/BALANCE.nightInterval)*BALANCE.nightInterval+60000;game.nightUntil=0;},
    followMetrics:()=>world.followerMetrics(),
    followStep:(seconds:number,x:number,z:number)=>{for(let t=0;t<seconds;t+=1/60){step(1/60,{x,z});world.render(game,'explore',1/60,visualTime+=1/60);}},
    regionArt:()=>({terrain:world.hazardsView.regions.metrics(),guardian:world.hazardsView.guardians.metrics()}),
    animationTime:(seconds:number)=>{visualTime=seconds;},
    spawnHazard:(id:string)=>{const d=HAZARDS.find(h=>h.id===id)!;return game.hazards.spawn(d,{x:game.x,z:game.z,vx:0,vz:0,facing:game.facing,carrying:!!game.carried,metal:false,moving:false}).serial;},
    gainXP:(xp:number)=>game.gainXP(xp),
    hit:()=>game.receiveHit(0),
    routeWalk:(seconds:number,direction=-1)=>{game.immunity=9999;game.save.upgrades.speed=20;step(seconds,{x:0,z:direction});},
    wakeGuardian:()=>{const b=game.bosses.find(b=>b.stageId===game.stage.id)!;b.mode='chase';b.target=game.carried?.id??null;},
    hazards:()=>game.hazards.attacks.map(h=>({id:h.definition.id,phase:h.phase,target:h.target,warning:h.warning,elapsed:h.elapsed})),
    multiplayerFixture:(x:number,z:number,rotation:number,carry:boolean)=>{
      game.x=x;game.z=z;game.deadline=clock+45000;game.world=[];
      game.carried=carry?{id:'network-test-egg',type:0,hp:30,distance:14,x,z,expires:game.nightAt}:null;
      world.player.rotation.y=rotation;game.revision++;
    },
    state, step, save,
    scene: (name: string) => { prepare(game, name); setTab(name.startsWith("hatch") || name === "result" ? "hatchery" : ["upgrade", "collection", "pets", "store", "shop", "stages", "traits"].includes(name) ? name : "explore"); },
    metrics: () => ({...world.renderer.info.render, memory: {...world.renderer.info.memory}, objects: world.scene.children.length, bat:world.player.getObjectByName("bat")?.visible, projection:world.camera.projectionMatrix.toArray(), camera: world.camera.position.toArray(), player: world.player.position.clone().project(world.camera).toArray(), fallen:Math.abs(world.player.rotation.z)>1,selection:world.eggs.children.filter(m=>m.getObjectByName('selection-outline')?.visible).map(m=>m.userData.id), near:game.near?.id}),
    wait: (seconds: number) => { clock += seconds * 1000; },
    // Real game movement and economy remain under test; only clock/input are controlled.
    travel: (x: number, z: number) => {
      for(let i=0; i<12000 && Math.hypot(game.x-x,game.z-z)>.12; i++) {
        const dx=x-game.x,dz=z-game.z,l=Math.hypot(dx,dz);
        step(Math.min(1/60,l/game.speed),{x:dx/l,z:dz/l});
        if(game.flyaway) break;
      }
    },
    grant: (dust: number) => { game.save.dust = dust; game.revision++; },
    balance: BALANCE,
  };
  Object.assign(window, {__qa: qa});
}
