import {add} from '../src/money';
import {GameState,freshSave,type WorldEgg,type Boss} from '../src/game';
import {BALANCE,EGGS,MONGLES,UPGRADES} from '../src/data';
import {exportRuntime,restoreRuntime,migrateStageRuntime,type RuntimeState} from '../src/online-state';
import {migrateStageWorld} from '../src/stage-migration';
import {playerName} from '../src/player-identity';
import type {EggNotice} from '../src/egg-notices';
export {snapshotSections} from '../src/snapshot-stream';

type Member={user_id:string;slot:number;last_seen:string};
type Command={id:string;kind:string;value?:unknown};
type StopPoint={at:number;x:number;z:number;hit:number;egg:string|null;base:boolean};
type Player={runtime:RuntimeState;input:{x:number;z:number;slow?:boolean};seen:number;receipts:string[];chat?:{id:string;text:string;at:number};guest?:boolean;motionStart?:number;motion?:StopPoint[];commandErrors?:{id:string;error:string}[];preparation?:{id:string;at:number;x:number;z:number;hit:number};adAt?:number};
export type Room={stageOrderVersion?:2;at:number;cycle:number;world:WorldEgg[];bosses:Boss[];players:Record<string,Player>;eggNotices?:EggNotice[]};
export type RequestInput={id:string;input?:{x:number;z:number;slow?:boolean};inputAt?:number;commands?:Command[]};
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
export function runRoom(previous:Room|null,members:Member[],profiles:{user_id:string;state:RuntimeState|null}[],user:string,request:RequestInput,now:number,identity?:{guest:boolean}){
 if(previous&&previous.stageOrderVersion!==2){migrateStageWorld(previous.world,previous.bosses);for(const p of Object.values(previous.players))migrateStageRuntime(p.runtime);previous.stageOrderVersion=2;}
 for(const p of profiles)if(p.state)migrateStageRuntime(p.state);
 if(!members.some(m=>m.user_id===user))throw Error('ROOM_EXPIRED');
 if(!request||typeof request.id!=='string'||request.id.length>80||!Array.isArray(request.commands??[])||(request.commands?.length??0)>16)throw Error('INVALID_REQUEST');
 const vector=request.input??{x:0,z:0};
 if(![vector.x,vector.z].every(v=>Number.isFinite(v)&&Math.abs(v)<=1.001))throw Error('INVALID_INPUT');
 if(vector.slow!==undefined&&typeof vector.slow!=='boolean')throw Error('INVALID_INPUT');
 const cycle=Math.floor(now/BALANCE.nightInterval);
 const fresh=!previous||cycle!==previous.cycle?new GameState(freshSave(now),()=>now,random):null;
 const joinedNow=!previous?.players[user];
 const room:Room=previous??{stageOrderVersion:2,at:now,cycle:Math.floor(now/BALANCE.nightInterval),world:fresh!.world,bosses:fresh!.bosses,players:{}};
 // Disconnected players cannot keep an egg or operate an unoccupied plot.
 for(const [id,p] of Object.entries(room.players))if(!members.some(m=>m.user_id===id)){
  const egg=p.runtime.fields.carried as WorldEgg|null;
  if(egg&&!room.world.some(e=>e.id===egg.id)){egg.x=egg.homeX??egg.x;egg.z=egg.homeZ??egg.z;room.world.push(egg);}
  delete room.players[id];
 }
 let simTime=room.at;
 const games=new Map<string,GameState>();
 for(const m of members){
  let p=room.players[m.user_id];
  if(!p){
   const stored=profiles.find(p=>p.user_id===m.user_id)?.state;
   const g=new GameState(stored?structuredClone(stored.save):freshSave(now),()=>now,random);
   if(stored)g.offline(Math.max(0,(now-(stored.save.productionAt??stored.save.lastSavedAt))/1000));
   // Local saves are kept on the device; only a previously committed server save is loaded.
   g.x=g.z=0;g.carried=null;g.deadline=0;g.death=null;g.hp=g.maxHp;g.training=false;
   g.roomManaged=true;g.farmSlot=m.slot;
   p=room.players[m.user_id]={runtime:exportRuntime(g),input:{x:0,z:0},seen:now,receipts:[]};
  }
  const g=new GameState(structuredClone(p.runtime.save),()=>simTime,random,true);
  restoreRuntime(g,p.runtime,room.world,room.bosses);g.farmSlot=m.slot;g.events=[];
  g.settleProduction(Math.min(now,p.seen+BALANCE.offlineCap*1000));
  if(m.user_id===user)g.save.productionAt=now;
  games.set(m.user_id,g);
 }
 const self=games.get(user)!,player=room.players[user];
 if(identity)player.guest=identity.guest;
 const stopAt=Number.isFinite(request.inputAt)&&Math.hypot(vector.x,vector.z)<.01&&Math.hypot(player.input.x,player.input.z)>.01
  ? Math.max(player.motionStart??0,now-BALANCE.roomStopRewindMs,Math.min(now,request.inputAt!)):null;
 // Release latency compensation uses only positions already simulated by the server.
 // It cannot restore an egg, health, rewards, or move through a new collision.
 if(stopAt!==null&&!player.receipts.includes(`request:${request.id}`)&&!self.death&&!self.training&&!self.launch&&!self.knockback.remaining){
  const history=player.motion??[],before=history.findLast(p=>p.at<=stopAt),after=history.find(p=>p.at>=stopAt);
   if(before&&after&&before.hit===(Number.isFinite(self.hitAt)?self.hitAt:0)&&after.hit===before.hit&&before.egg===(self.carried?.id??null)&&after.egg===before.egg&&before.base===self.isAtBase&&after.base===before.base){
   const t=after.at===before.at?0:(stopAt-before.at)/(after.at-before.at);
   self.push(before.x+(after.x-before.x)*t-self.x,before.z+(after.z-before.z)*t-self.z);
  }
 }
 if(!joinedNow&&now-player.seen<10&&!player.receipts.includes(`request:${request.id}`))throw Error('RATE_LIMIT');
 if(cycle!==room.cycle){
  room.world=fresh!.world;room.bosses=fresh!.bosses;room.cycle=cycle;
  for(const [id,g] of games){g.failExpedition('night');g.world=room.world;g.bosses=room.bosses;delete room.players[id].preparation;}
 }
 for(const g of games.values()){
  g.nightAt=(cycle+1)*BALANCE.nightInterval;
  g.nightUntil=now-cycle*BALANCE.nightInterval<BALANCE.nightDuration?cycle*BALANCE.nightInterval+BALANCE.nightDuration:0;
 }
 // Never accept client coordinates, speed, dt, balances, ownership or RNG.
 // Bounded grace covers an ordinary round trip without losing movement time.
 const duration=Math.min(BALANCE.roomInputGraceMs/1000,Math.max(0,(now-room.at)/1000));
 for(let elapsed=0;elapsed<duration-1e-9;){
  const dt=Math.min(1/30,duration-elapsed);elapsed+=dt;simTime=now-(duration-elapsed)*1000;
  for(const [id,g] of games){
   const p=room.players[id];g.world=room.world;g.bosses=room.bosses;
   const active=id===user||simTime-p.seen<BALANCE.roomInputGraceMs;
   if(active){const v=simTime-p.seen<=BALANCE.roomInputGraceMs?p.input:{x:0,z:0};
    const moveDt=id===user&&stopAt!==null?Math.max(0,Math.min(dt,(stopAt-(simTime-dt*1000))/1000)):dt;
    g.move(v.x,v.z,moveDt,p.input.slow===true);g.tick(dt);
    (p.motion??=[]).push({at:simTime,x:g.x,z:g.z,hit:Number.isFinite(g.hitAt)?g.hitAt:0,egg:g.carried?.id??null,base:g.isAtBase});
    p.motion=p.motion.filter(point=>point.at>=now-BALANCE.roomStopRewindMs-50);
   }
   else if(g.death&&g.deathChoiceRemaining<=0)g.revive(false);
   room.world=g.world;
   if(p.preparation&&(Math.hypot(g.x-p.preparation.x,g.z-p.preparation.z)>.05||(Number.isFinite(g.hitAt)?g.hitAt:0)!==(p.preparation.hit??0)||g.death||g.carried))delete p.preparation;
  }
  // Every boss advances exactly once, against the player holding its target egg.
  for(let index=0;index<room.bosses.length;index++){
   const boss=room.bosses[index];
   const owner=[...games.values()].find(g=>g.carried?.id===boss.target)??self;
   owner.world=room.world;owner.bosses=room.bosses;owner.tickBosses(dt,index);room.world=owner.world;
  }
 }
 simTime=now;room.at=now;self.world=room.world;self.bosses=room.bosses;
 const errors:string[]=[];
 const duplicate=player.receipts.includes(`request:${request.id}`);
 if(!duplicate){
  for(const command of request.commands??[]){
   if(!command||typeof command.id!=='string'||command.id.length>80||typeof command.kind!=='string')throw Error('INVALID_COMMAND');
   if(player.receipts.includes(command.id))continue;
   player.receipts.push(command.id);
   try{
    if(command.kind==='attack'){
     if(now-self.batAt>=BALANCE.batCooldown&&!self.death&&!self.carried&&!self.training&&!self.launch&&self.knockback.remaining<=0&&now>=self.knockedUntil){
      self.batAt=now;
      const length=Math.hypot(vector.x,vector.z);if(length>.01)self.facing={x:vector.x/length,z:vector.z/length};
      for(const [id,target] of games){
       const dx=target.x-self.x,dz=target.z-self.z,distance=Math.hypot(dx,dz);
       if(id===user||now-room.players[id].seen>BALANCE.roomInputGraceMs||distance>BALANCE.batRange||(distance>.01&&(dx*self.facing.x+dz*self.facing.z)/distance<BALANCE.batFacingThreshold))continue;
       target.world=self.world;
       if(target.receiveBat(distance>.01?dx:self.facing.x,distance>.01?dz:self.facing.z))delete room.players[id].preparation;
      }
     }
    }else applyCommand(self,player,command,now);
   }catch(e){const error=e instanceof Error?e.message:'ACTION_FAILED';(player.commandErrors??=[]).push({id:command.id,error});}
  }
  player.receipts.push(`request:${request.id}`);player.receipts=player.receipts.slice(-128);
  if(player.commandErrors)player.commandErrors=player.commandErrors.filter(c=>player.receipts.includes(c.id));
  if(vector.x!==player.input.x||vector.z!==player.input.z){player.motionStart=now;player.motion=[];}
  player.input=vector;player.seen=now;
 }
 const commandResults=(request.commands??[]).map(c=>({id:c.id,error:player.commandErrors?.find(e=>e.id===c.id)?.error??null}));
 errors.push(...commandResults.flatMap(c=>c.error?[c.error]:[]));
 room.world=self.world;
 const tutorialSteps:Record<string,number>={expedition_start:1,egg_pickup:2,egg_saved:3,mongle_obtained:4,upgrade_purchase:5,trail_purchase:5};
 for(const g of games.values())for(const event of g.events)g.save.tutorial=Math.max(g.save.tutorial??0,tutorialSteps[event.name]??0);
 room.eggNotices=(room.eggNotices??[]).filter(n=>now-n.at<60000);
 for(const [id,g] of games)for(const event of g.events)if(event.name==='egg_saved'){
  const p=event.params,noticeId=`${id}:${p.id}`;
  if(!room.eggNotices.some(n=>n.id===noticeId))room.eggNotices.push({id:noticeId,at:now,name:g.save.playerName??`농장 ${g.farmSlot+1}`,guest:!!room.players[id].guest,egg:{type:Number(p.type),stageId:Number(p.stageId),variant:Number(p.variant),special:p.special===1}});
 }
 room.eggNotices=room.eggNotices.slice(-30);
 const events=self.events.splice(0);
 for(const [id,g] of games){g.world=room.world;g.bosses=room.bosses;room.players[id].runtime=exportRuntime(g);}
 for(const p of Object.values(room.players))if(p.chat&&now-p.chat.at>=BALANCE.chatDurationMs)delete p.chat;
 const peers=[...games].filter(([id])=>id!==user).map(([id,g])=>({
  id,at:now,name:g.save.playerName??`농장 ${g.farmSlot+1}`,level:g.level,isGuest:!!room.players[id].guest,slot:g.farmSlot,x:g.x,z:g.z,rotation:Math.atan2(g.facing.x,g.facing.z),appearance:g.save.appearance??0,
  speed:g.speed,downUntil:g.knockedUntil,attackAt:g.batAt,hitAt:g.hitAt,velocity:g.velocity,carried:g.carried?.type??null,egg:g.carried,chat:room.players[id].chat??null,
  activePets:g.save.active.filter(id=>g.save.mongles[id]>0).slice(0,BALANCE.maxCompanions),
  pets:g.save.mongles.flatMap((n,i)=>n&&!g.save.active.includes(i)?[i]:[]).slice(0,6),
 }));
 // Notice IDs start with the authenticated owner's UUID, not the nickname.
 const eggNotices=room.eggNotices.filter(notice=>!notice.id.startsWith(`${user}:`));
 return {room,response:{serverTime:now,runtime:player.runtime,world:room.world,bosses:room.bosses,peers,eggNotices,chat:player.chat??null,isGuest:!!player.guest,slot:self.farmSlot,count:members.length,events,errors,commandResults}};
}
function applyCommand(g:GameState,p:Player,c:Command,now:number){
 const integer=()=>{if(!Number.isSafeInteger(c.value)||Number(c.value)<0)throw Error('INVALID_ID');return Number(c.value);};
 const text=()=>{if(typeof c.value!=='string'||c.value.length>160)throw Error('INVALID_ID');return c.value;};
 const atBase=()=>{if(!g.isAtBase||g.death)throw Error('RETURN_TO_BASE');};
 switch(c.kind){
  case 'chat':{
   if(typeof c.value!=='string'||c.value.length>BALANCE.chatMaxLength*2)throw Error('INVALID_CHAT');
   const message=c.value.normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu,'').trim().replace(/\s+/g,' ');
   if(!message||Array.from(message).length>BALANCE.chatMaxLength)throw Error('INVALID_CHAT');
   if(p.chat&&now-p.chat.at<BALANCE.chatCooldownMs)throw Error('CHAT_COOLDOWN');
   p.chat={id:c.id,text:message,at:now};break;
  }
  case 'prepare':{const egg=g.world.find(e=>e.id===text());if(!egg||g.carried||g.death||!g.canReachEgg(egg))throw Error('EGG_UNAVAILABLE');
   p.preparation={id:egg.id,at:now,x:g.x,z:g.z,hit:Number.isFinite(g.hitAt)?g.hitAt:0};break;}
  case 'pickup':{const egg=g.world.find(e=>e.id===text());if(!egg||g.carried||g.death||g.isNight||!g.canReachEgg(egg))throw Error('EGG_UNAVAILABLE');
   const seconds=BALANCE.rareEggPickupSeconds[EGGS[egg.type].tier],prep=p.preparation;
   if(seconds&&(!prep||prep.id!==egg.id||now-prep.at<seconds*1000||Math.hypot(g.x-prep.x,g.z-prep.z)>.05||(Number.isFinite(g.hitAt)?g.hitAt:0)!==(prep.hit??0)))throw Error('PREPARE_EGG');
   g.pickup(egg);delete p.preparation;break;}
  case 'drop':if(g.carried)g.interact();break;
  case 'train':atBase();g.toggleTraining();break;
  case 'tap':atBase();g.tap();break;
  case 'claimHatch':atBase();if(!g.claimHatch(text()))throw Error('EGG_NOT_READY');break;
  case 'select':atBase();if(!g.save.eggs.some(e=>e.id===text()))throw Error('NOT_OWNED');g.save.selected=text();g.revision++;break;
  case 'equip':{atBase();const id=integer();if(!g.save.mongles[id])throw Error('NOT_OWNED');
   if(g.save.active.includes(id))g.save.active=g.save.active.filter(i=>i!==id);
   else if(g.save.active.length<BALANCE.maxCompanions)g.save.active.push(id);g.revision++;break;}
  case 'upgrade':atBase();if(!Object.hasOwn(UPGRADES,text()))throw Error('INVALID_UPGRADE');g.upgrade(text() as keyof typeof UPGRADES);break;
  case 'name':g.save.playerName=playerName(c.value);break;
  case 'trail':atBase();g.buyTrail(integer());break;
  case 'sellEgg':atBase();g.sellEgg(text());break;
  case 'sellPet':atBase();if(!MONGLES[integer()])throw Error('INVALID_PET');g.sellPet(integer());break;
  case 'claimPet':g.claimPet(integer());break;
  case 'claimDragon':atBase();if(!g.claimDragon(integer()))throw Error('DRAGON_NOT_READY');break;
  case 'claimRegion':g.claimRegion(integer());break;
  case 'claimStage':g.claimStage(integer());break;
  case 'claimCollection':g.claimCollection();break;
  case 'claimStageCollection':g.claimStageCollection();break;
  case 'return':g.revive(false);break;
  case 'reviveAd':if(!g.beginReviveAd())throw Error('CANNOT_REVIVE');break;
  case 'revive':g.revive(true);break;
  case 'adStart':atBase();if(p.adAt===undefined)p.adAt=now;break;
  case 'adClaim':atBase();if(p.adAt===undefined||now-p.adAt<BALANCE.virtualAdDuration)throw Error('WAIT_FOR_AD');g.save.dust=add(g.save.dust,BALANCE.virtualAdReward);delete p.adAt;break;
  case 'result':g.result=null;break;
  case 'reward':g.returnReward=null;break;
  case 'tutorial':g.save.tutorial=5;break;
  case 'warning':g.save.bossWarningSeen=true;break;
  case 'appearance':if(integer()>2)throw Error('INVALID_APPEARANCE');g.save.appearance=integer();break;
  default:throw Error('UNKNOWN_ACTION');
 }
 g.revision++;
}
