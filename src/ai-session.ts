import {GameState,freshSave,type WorldEgg,type Save} from './game';
import {PlayerEntity} from './player-entity';
import {AI_WORLD,BALANCE,MONGLES,EGGS} from './data';
import {requiredXP,newProgression} from './progression';
import {farmLocal,FARM_PEN} from './village';
import type {EmoteId} from './emotes';
import type {Peer} from './multiplayer';
import {addPetLot,rollEggWeight,type PetLot} from './weight';
import {AI_NAMES} from './ai-names';
export {AI_NAMES} from './ai-names';
export type AIAction='SEARCH_EGG'|'RETURN_BASE'|'EXERCISE'|'REST'|'WANDER'|'CHASE_PLAYER'|'SOCIALIZE'|'ESCAPE'|'IDLE'|'LEAVE';
export type AIPersonality={aggression:number;greed:number;cowardice:number;curiosity:number;sociability:number;skill:number;patience:number;riskTolerance:number};
export type AICheckpoint={id:string;seed:number;randomState:number;slot:number;name:string;sessionAge:number;remaining:number;action:AIAction;x:number;z:number;rotation:number;health:number;carryingEgg:WorldEgg|null;targetId:string|null;decisionIn:number;emoteIn:number;idleIn:number;level:number;trainingProgress:number;activePets:number[];mountPet:number|null;emote:import('./emotes').Emote|null;leaveSoon:boolean;stageStart:number;highestStage:number;target:{x:number;z:number};targetEgg:WorldEgg|null;upgrades:Save['upgrades'];trainingSpeed:number;petLots:PetLot[];hatch:{eggs:Save['eggs'];selected:string|null}};
export class AIRandom{
 constructor(public state:number){}
 next=()=>{this.state=(this.state+0x6D2B79F5)|0;let t=this.state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export interface AIEnvironment{actors():Peer[];attack(actor:PlayerEntity,targetId:string):void;collect(actor:PlayerEntity):boolean;visible(x:number,z:number):boolean;}
export class AIController{
 readonly random:AIRandom;readonly personality:AIPersonality;readonly entity:PlayerEntity;
 action:AIAction;targetId:string|null=null;nextDecisionAt:number;emoteCooldown:number;idleUntil=0;joinedAt:number;plannedLeaveAt:number;leaveSoon=false;
 private target={x:0,z:0};private slowTime=0;private previous={x:0,z:0};private stuck=0;private pickupAt=0;
 private threat:{id:string;until:number}|null=null;private socialAt=0;private greeted=false;private attackReadyAt=0;
 private seenEmotes=new Map<string,number>();private nextEmoteScan=0;
 private reply:{target:string;id:EmoteId;at:number;until:number;sent:boolean}|null=null;
 readonly recentEvents:{name:string;at:number}[]=[];
 errors=0;decisions=0;interactions=0;
 constructor(public seed:number,slot:number,reference:GameState,private env:AIEnvironment,initial:AIAction='SEARCH_EGG',checkpoint?:AICheckpoint){
  this.random=new AIRandom(seed);const r=this.random.next;
  this.personality={aggression:r(),greed:r(),cowardice:r(),curiosity:r(),sociability:r(),skill:.15+r()*.8,patience:r(),riskTolerance:r()};
  const age=30+r()*870,save=freshSave(reference.now());
  save.progression=newProgression();save.progression.stage=reference.progression.stage;save.highestStage=Math.max(reference.progression.stage,reference.save.highestStage??1);
  save.playerName=checkpoint?.name??AI_NAMES[Math.floor(r()*AI_NAMES.length)];save.appearance=Math.floor(r()*3);save.tutorial=99;save.bossWarningSeen=true;
  save.upgrades={...reference.save.upgrades,speed:Math.max(0,reference.save.upgrades.speed+Math.floor(r()*3)-1)};
  save.trainingProgress=Math.min(.99,Math.max(0,(reference.save.trainingProgress??0)*(.75+r()*.5)+age*.00025));
  const pool=MONGLES.map((p,id)=>({pet:p,id})).filter(({pet:p})=>p.region<=Math.min(4,Math.floor(((reference.save.highestStage??1)-1)/4))&&p.tier<4);
  for(let i=0,count=1+Math.floor(r()*3);i<count;i++){const pet=pool[Math.floor(r()*pool.length)];save.mongles[pet.id]++;save.active.push(pet.id);addPetLot(save,pet.id,rollEggWeight({type:pet.pet.tier*5+pet.pet.region,stageId:Math.max(1,pet.pet.stageId)},r));}
  save.mountPet=r()<.4?save.active[Math.floor(r()*save.active.length)]:null;
  if(save.mountPet!==null)save.mongles[save.mountPet]++;
  if(checkpoint){save.highestStage=checkpoint.highestStage;save.upgrades={...checkpoint.upgrades};save.trainingSpeed=checkpoint.trainingSpeed;save.trainingProgress=checkpoint.trainingProgress;save.eggs=structuredClone(checkpoint.hatch.eggs);save.selected=checkpoint.hatch.selected;
   save.mongles=Array(MONGLES.length).fill(0);save.petLots=structuredClone(checkpoint.petLots);for(const lot of save.petLots)save.mongles[lot.species]+=lot.count;save.active=[...checkpoint.activePets];save.mountPet=checkpoint.mountPet;
  }
  const game=new GameState(save,reference.now,r);game.farmSlot=slot;const stageStart=checkpoint?.stageStart??reference.progression.stage;if(game.progression.stage!==stageStart){game.progression.stage=stageStart;game.resetBosses();game.spawn();}
  game.progression.level=Math.max(1,checkpoint?.level??reference.level+Math.floor(r()*5)-2);game.progression.requiredXP=requiredXP(game.level);
  this.entity=new PlayerEntity(checkpoint?.id??`sim-${seed>>>0}`,'simulated',game);
  const now=game.now();this.joinedAt=now-age*1000;this.socialAt=now+6000+r()*14000;this.nextEmoteScan=now+r()*400;
  const roll=r(),duration=roll<.12?120+r()*60:roll>.88?480+r()*420:180+(r()+r())*.5*300;
  this.plannedLeaveAt=now+Math.max(AI_WORLD.initialGraceMs,duration*1000);
  this.action=initial;this.nextDecisionAt=now+300+r()*4700;this.emoteCooldown=now+10000+r()*20000;
  if(game.isNight)this.action=(['REST','EXERCISE','WANDER','IDLE'] as AIAction[])[(slot-1)%4];
  const eggs=game.world.filter(e=>e.stageId===game.progression.stage&&!e.special&&EGGS[e.type].tier<4),egg=eggs[Math.floor(r()*eggs.length)];
  if(this.action==='RETURN_BASE'&&egg){game.x=egg.x;game.z=egg.z;game.pickup(egg);game.x=egg.x*.45;game.z=egg.z*.45;this.target={x:0,z:BALANCE.baseMinZ+2};this.recentEvents.push({name:'eggCollected',at:now-24000});}
  else if(this.action==='EXERCISE'){game.x=game.gym.x;game.z=game.gym.z;game.toggleTraining();this.target=game.gym;}
  else if(this.action==='REST'||this.action==='IDLE'||game.isNight){const pos=farmLocal(slot,0,FARM_PEN.front+1.5);game.x=pos.x;game.z=pos.z;this.target=pos;}
  else if(egg){game.x=egg.x+1.5+r()*3;game.z=egg.z+2+r()*5;this.target={x:egg.x,z:egg.z};this.targetId=egg.id;}
  game.push(0,0);game.hp=game.maxHp*(.55+r()*.45);game.facing={x:.2+r()*.6,z:this.action==='RETURN_BASE'?1:-1};
  this.previous={x:game.x,z:game.z};if(checkpoint)this.restore(checkpoint);
 }
 private restore(s:AICheckpoint){
  const g=this.entity.game,now=g.now();this.random.state=s.randomState;this.joinedAt=now-s.sessionAge;this.plannedLeaveAt=now+s.remaining;
  this.action=s.action;this.targetId=s.targetId;this.nextDecisionAt=now+s.decisionIn;this.emoteCooldown=now+s.emoteIn;this.idleUntil=now+s.idleIn;
  g.x=s.x;g.z=s.z;g.hp=s.health;g.facing={x:Math.sin(s.rotation),z:Math.cos(s.rotation)};g.carried=s.carryingEgg?{...s.carryingEgg}:null;
  g.save.trainingProgress=s.trainingProgress;this.entity.emote=s.emote;this.leaveSoon=s.leaveSoon;
  this.target={...s.target};if(s.targetEgg){g.world=g.world.filter(e=>e.id!==s.targetEgg!.id&&!(e.homeX===s.targetEgg!.homeX&&e.homeZ===s.targetEgg!.homeZ));g.world.push({...s.targetEgg});}
  g.training=s.action==='EXERCISE'&&g.nearGym&&!g.carried;
 }
 checkpoint():AICheckpoint{
  const g=this.entity.game,now=g.now();return {id:this.entity.id,seed:this.seed,randomState:this.random.state,slot:g.farmSlot,name:g.save.playerName!,sessionAge:now-this.joinedAt,remaining:Math.max(0,this.plannedLeaveAt-now),action:this.action,x:g.x,z:g.z,rotation:Math.atan2(g.facing.x,g.facing.z),health:g.hp,carryingEgg:g.carried?{...g.carried}:null,targetId:this.targetId,decisionIn:Math.max(0,this.nextDecisionAt-now),emoteIn:Math.max(0,this.emoteCooldown-now),idleIn:Math.max(0,this.idleUntil-now),level:g.level,trainingProgress:g.save.trainingProgress??0,activePets:[...g.save.active],mountPet:g.mountId,emote:this.entity.emote,leaveSoon:this.leaveSoon,stageStart:g.progression.stage,highestStage:g.save.highestStage??1,target:{...this.target},targetEgg:g.world.find(e=>e.id===this.targetId)??null,upgrades:{...g.save.upgrades},trainingSpeed:g.save.trainingSpeed??0,petLots:(g.save.petLots??[]).filter(l=>l.count>0&&[...(g.save.activeLots??[]),g.save.mountLot].includes(l.key)).map(l=>({...l})),hatch:{eggs:structuredClone(g.save.eggs),selected:g.save.selected}};
 }
 emote(id:EmoteId,important=false){const now=this.entity.game.now();if(now<this.emoteCooldown||this.random.next()>(important?.5:.15)*this.personality.sociability)return;this.entity.emote={id,at:now};this.emoteCooldown=now+10000+this.random.next()*20000;}
 attackedBy(id:string){
  this.reply=null;
  const now=this.entity.game.now();this.threat={id,until:now+6000+this.random.next()*5000};
  this.idleUntil=now+180+(1-this.personality.skill)*850+this.random.next()*350;
  this.nextDecisionAt=this.idleUntil;this.emote(this.personality.cowardice>.6?'surprise':'angry',true);
 }
 private reactToEmotes(now:number){
  const g=this.entity.game,peers=this.env.actors(),r=this.random.next;
  const danger=g.pursuing>=0||g.knockedUntil>now||['CHASE_PLAYER','ESCAPE','LEAVE'].includes(this.action)||!!(this.threat&&this.threat.until>now)||peers.some(p=>p.id!==this.entity.id&&p.action==='CHASE_PLAYER'&&Math.hypot(p.x-g.x,p.z-g.z)<10);
  if(danger)this.reply=null;
  if(now>=this.nextEmoteScan){
   this.nextEmoteScan=now+250+r()*200;
   for(const peer of peers){
    const e=peer.emote;if(peer.id===this.entity.id||!e||this.seenEmotes.get(peer.id)===e.at)continue;
    this.seenEmotes.set(peer.id,e.at);
    if(this.seenEmotes.size>32)this.seenEmotes.delete(this.seenEmotes.keys().next().value!);
    if(danger||this.reply||now<this.emoteCooldown||now-e.at>2500||Math.hypot(peer.x-g.x,peer.z-g.z)>8||r()>.3+this.personality.sociability*.5)continue;
    const at=now+250+(1-this.personality.skill)*650+r()*500;
    this.reply={target:peer.id,id:e.id==='angry'?'surprise':e.id,at,until:at+1000+r()*1000,sent:false};
   }
  }
  const reply=this.reply;if(!reply||now<reply.at)return false;
  const peer=peers.find(p=>p.id===reply.target);
  if(!peer||now>reply.until||Math.hypot(peer.x-g.x,peer.z-g.z)>10){this.reply=null;this.nextDecisionAt=now;return false;}
  const dx=peer.x-g.x,dz=peer.z-g.z,distance=Math.hypot(dx,dz);
  if(g.training)g.toggleTraining();g.velocity={x:0,z:0};if(distance>.05)g.facing={x:dx/distance,z:dz/distance};
  if(!reply.sent){reply.sent=true;this.entity.emote={id:reply.id,at:now};this.emoteCooldown=now+10000+r()*20000;this.socialAt=now+15000;this.interactions++;}
  return true;
 }
 private choose(){
  const g=this.entity.game,r=this.random.next,p=this.personality;this.decisions++;
  const peers=this.env.actors().filter(a=>a.id!==this.entity.id&&(a.health??1)>0&&(a.downUntil??0)<=g.now());
  if(this.threat&&this.threat.until<g.now())this.threat=null;
  const targets=peers.filter(a=>Math.hypot(a.x-g.x,a.z-g.z)<22&&a.z<BALANCE.baseMinZ&&(a.carried!==null||a.id===this.threat?.id||p.aggression>.65&&Math.hypot(a.x-g.x,a.z-g.z)<7));
  const victim=targets.sort((a,b)=>Number(b.id===this.threat?.id)-Number(a.id===this.threat?.id)||Math.hypot(a.x-g.x,a.z-g.z)-Math.hypot(b.x-g.x,b.z-g.z))[0];
  const companion=peers.filter(a=>Math.hypot(a.x-g.x,a.z-g.z)<16&&(!g.isNight||a.z>=BALANCE.baseMinZ)).sort((a,b)=>Math.hypot(a.x-g.x,a.z-g.z)-Math.hypot(b.x-g.x,b.z-g.z))[0];
  const choices:{action:AIAction;score:number}[]=[{action:'WANDER',score:20+p.curiosity*15},{action:'EXERCISE',score:15+p.patience*25},{action:'REST',score:10+p.patience*15},{action:'SEARCH_EGG',score:g.carried||g.isNight?0:60+p.greed*20},{action:'RETURN_BASE',score:g.carried?140:0},{action:'ESCAPE',score:g.hp<g.maxHp*.4&&!g.isAtBase?160:0},{action:'CHASE_PLAYER',score:victim&&!g.carried?25+p.aggression*80+p.greed*20-p.cowardice*35+p.riskTolerance*10:0},{action:'IDLE',score:8+(1-p.skill)*18}];
  choices.push({action:'SOCIALIZE',score:companion&&!g.carried&&!this.threat&&g.now()>=this.socialAt?30+p.sociability*65:0});
  if(this.threat){choices.find(c=>c.action==='ESCAPE')!.score+=p.cowardice*130;choices.find(c=>c.action==='CHASE_PLAYER')!.score+=victim&&!g.carried?30+p.aggression*40:0;}
  if(this.leaveSoon||g.now()>=this.plannedLeaveAt){if(!this.leaveSoon)this.emote('hello');this.leaveSoon=true;this.action='LEAVE';}
  else{choices.sort((a,b)=>b.score-a.score);const roll=r(),rank=roll<.7?0:roll<.92?1:2;this.action=choices[rank].action;if(rank>0)this.errors++;}
  if(g.isNight&&['SEARCH_EGG','WANDER','CHASE_PLAYER'].includes(this.action))this.action='REST';
  this.targetId=this.action==='CHASE_PLAYER'?(victim?.id??null):this.action==='SOCIALIZE'?(companion?.id??null):null;
  this.attackReadyAt=0;this.greeted=false;
  if(g.training&&this.action!=='EXERCISE')g.toggleTraining();
  this.idleUntil=g.now()+(r()<.12?.4+r()*1.6:0)*1000;if(this.idleUntil>g.now())this.errors++;
  this.nextDecisionAt=g.now()+300+r()*1200+(this.action==='EXERCISE'||this.action==='REST'?3000+r()*9000:0);
  if(this.action==='SOCIALIZE'){this.nextDecisionAt=g.now()+3000+r()*3500;this.socialAt=g.now()+18000+r()*24000;}
  if(this.action==='CHASE_PLAYER'){this.nextDecisionAt=g.now()+2500+r()*3000;this.idleUntil=Math.max(this.idleUntil,g.now()+150+(1-p.skill)*700+r()*250);}
  this.setTarget();
 }
 private setTarget(){
  const g=this.entity.game,r=this.random.next;
  if(['RETURN_BASE','ESCAPE','LEAVE'].includes(this.action))this.target={x:0,z:BALANCE.baseMinZ+2};
  else if(this.action==='EXERCISE')this.target=g.gym;
  else if(this.action==='REST')this.target=farmLocal(g.farmSlot,0,FARM_PEN.front+1.5);
  else if(this.action==='SEARCH_EGG'){
   const eggs=g.world.filter(e=>(e.stageId??1)<=Math.max(1,g.save.highestStage??1)&&!e.special).sort((a,b)=>Math.hypot(a.x-g.x,a.z-g.z)-Math.hypot(b.x-g.x,b.z-g.z));
   const egg=eggs[Math.min(eggs.length-1,r()<(1-this.personality.skill)*.25?1:0)];this.targetId=egg?.id??null;this.target=egg?{x:egg.x,z:egg.z}:{x:0,z:-12};
  }else if(this.action==='WANDER')this.target={x:(r()-.5)*10,z:3-r()*22};else this.target={x:g.x,z:g.z};
 }
 update(dt:number){
  const g=this.entity.game,now=g.now(),r=this.random.next;
  const near=this.env.actors().some(a=>a.kind==='human'&&Math.hypot(a.x-g.x,a.z-g.z)<AI_WORLD.fullSimulationDistance);
  this.slowTime+=dt;if(!near&&this.slowTime<.2)return;dt=near?dt:this.slowTime;this.slowTime=0;
  for(let left=dt;left>0;left-=.05)g.tick(Math.min(.05,left));
  for(const e of g.events.splice(0)){this.recentEvents.push({name:e.name,at:now});if(e.name==='player_hit'||e.name==='egg_drop')this.emote('surprise',true);}this.recentEvents.splice(0,Math.max(0,this.recentEvents.length-8));
  if(g.death){if(g.death.remaining<=0)g.revive(false);return;}
  if(g.returnReward){g.returnReward=null;this.emote('love',true);this.nextDecisionAt=now+500+r()*1800;}
  if(g.result!==null)g.result=null;if(g.selected?.hp===0)g.claimHatch(g.selected.id);
  if(this.reactToEmotes(now))return;
  if(g.isAtBase&&g.selected&&r()<dt*.8)g.tap();if(now>=this.nextDecisionAt)this.choose();
  if(this.action==='CHASE_PLAYER'){
   const victim=this.env.actors().find(a=>a.id===this.targetId);
   if(!victim||victim.z>=BALANCE.baseMinZ||g.isAtBase&&g.isNight||Math.hypot(victim.x-g.x,victim.z-g.z)>25||(victim.health??1)<=0){this.nextDecisionAt=now;g.velocity={x:0,z:0};return;}
   this.target={x:victim.x,z:victim.z};const dx=victim.x-g.x,dz=victim.z-g.z,distance=Math.hypot(dx,dz);
   if(distance<BALANCE.batRange){
    if(!this.attackReadyAt)this.attackReadyAt=now+120+(1-this.personality.skill)*650+r()*300;
    if(now>=Math.max(this.idleUntil,this.attackReadyAt)&&now-g.batAt>=BALANCE.batCooldown){
     const miss=r()<.03+(1-this.personality.skill)*.12,angle=Math.atan2(dx,dz)+(miss?1.8:0);g.facing={x:Math.sin(angle),z:Math.cos(angle)};
     const before=g.batAt;this.env.attack(this.entity,victim.id);if(g.batAt!==before){this.interactions++;if(miss)this.errors++;this.emote('laugh');}
     this.attackReadyAt=now+BALANCE.batCooldown+150+r()*650;this.idleUntil=now+250+r()*450;
    }
    if(distance>.1&&distance<BALANCE.batRange*.8&&now<this.attackReadyAt){
     const side=this.seed%2?1:-1;this.target={x:victim.x-dx/distance*1.4+dz/distance*side*.7,z:victim.z-dz/distance*1.4-dx/distance*side*.7};
    }
   }else this.attackReadyAt=0;
  }
  if(this.action==='SOCIALIZE'){
   const companion=this.env.actors().find(a=>a.id===this.targetId);
   if(!companion||g.isNight&&companion.z<BALANCE.baseMinZ||Math.hypot(companion.x-g.x,companion.z-g.z)>20){this.nextDecisionAt=now;g.velocity={x:0,z:0};return;}
   const dx=companion.x-g.x,dz=companion.z-g.z,distance=Math.hypot(dx,dz);
   this.target={x:companion.x+(g.farmSlot%2?1.5:-1.5),z:companion.z+1.5};
   if(distance<3.5){if(distance>.05)g.facing={x:dx/distance,z:dz/distance};g.velocity={x:0,z:0};
    if(!this.greeted){this.greeted=true;this.interactions++;this.emote(companion.emote?.id==='hello'?'hello':r()<.7?'hello':'love',true);}return;}
  }
  if(!g.carried&&this.env.collect(this.entity)){this.action='RETURN_BASE';this.setTarget();this.interactions++;}
  if(this.action==='SEARCH_EGG'&&!g.carried){
   const egg=g.world.find(e=>e.id===this.targetId);
   if(egg&&g.canReachEgg(egg)){
    if(!this.pickupAt)this.pickupAt=now+BALANCE.rareEggPickupSeconds[EGGS[egg.type].tier]*1000+120+(1-this.personality.skill)*700+r()*350;
    if(now>=this.pickupAt){if(r()<.05+(1-this.personality.skill)*.08){this.errors++;this.idleUntil=now+700;this.nextDecisionAt=now;}else{g.pickup(egg);this.action='RETURN_BASE';this.setTarget();this.emote('love',EGGS[egg.type].tier>2);}this.pickupAt=0;}g.velocity={x:0,z:0};return;
   }this.pickupAt=0;
  }
  if(this.action==='EXERCISE'&&Math.hypot(g.x-g.gym.x,g.z-g.gym.z)<BALANCE.gymRadius){if(!g.training&&!g.carried)g.toggleTraining();g.velocity={x:0,z:0};return;}
  if(now<this.idleUntil||['REST','IDLE'].includes(this.action)){g.velocity={x:0,z:0};return;}
  let target=this.target;const gate=farmLocal(g.farmSlot,0,FARM_PEN.front+1.5);
  if(g.isAtBase&&target.z<BALANCE.baseMinZ&&Math.hypot(g.x-gate.x,g.z-gate.z)>1&&Math.hypot(g.x-g.gym.x,g.z-g.gym.z)<5)target=gate;
  const dx=target.x-g.x,dz=target.z-g.z,distance=Math.hypot(dx,dz);
  if(distance<.5){g.velocity={x:0,z:0};return;}
  const deviation=Math.sin(now/1800+this.seed)*(1-this.personality.skill)*.16;
  for(let left=dt;left>0;left-=.05)g.move(dx/distance+deviation,dz/distance-deviation,Math.min(.05,left),false);
  if(Math.hypot(g.x-this.previous.x,g.z-this.previous.z)<.01)this.stuck+=dt;else this.stuck=0;this.previous={x:g.x,z:g.z};
  if(this.stuck>1.5){this.errors++;this.target={x:g.x+(r()-.5)*5,z:g.z+(r()-.5)*5};this.nextDecisionAt=now+1200;this.stuck=0;}
 }
}
export class AISession{
 bots:AIController[]=[];readonly initialSnapshots:AICheckpoint[];private nextJoinAt=0;private startedAt:number;private usedNames=new Set<string>();
 constructor(private reference:()=>GameState,private env:AIEnvironment,private random=()=>Math.random()){
  this.startedAt=reference().now();const actions:AIAction[]=['RETURN_BASE','EXERCISE','SEARCH_EGG','REST'];for(let i=0;i<AI_WORLD.initialPopulation;i++)this.add(i+1,actions[i%actions.length]);this.initialSnapshots=this.checkpoint();
 }
 private add(slot:number,action:AIAction,checkpoint?:AICheckpoint){
  const bot=new AIController(checkpoint?.seed??Math.floor(this.random()*0xffffffff),slot,this.reference(),this.env,action,checkpoint);
  if(!checkpoint){
   const occupied=new Set([...this.env.actors().map(p=>p.name),...this.bots.map(b=>b.entity.game.save.playerName),this.reference().save.playerName]);
   let pool=AI_NAMES.filter(name=>!occupied.has(name)&&!this.usedNames.has(name));
   if(!pool.length){this.usedNames.clear();pool=AI_NAMES.filter(name=>!occupied.has(name));}
   bot.entity.game.save.playerName=pool[Math.floor(bot.random.next()*pool.length)];
  }
  this.usedNames.add(bot.entity.game.save.playerName!);
  this.bots.push(bot);return bot;
 }
 restore(snapshots:AICheckpoint[]){this.bots=[];for(const s of snapshots.slice(0,AI_WORLD.maxParticipants-1))this.add(s.slot,s.action,s);}
 checkpoint(){return this.bots.map(b=>b.checkpoint());}
 update(dt:number,humanSlots:number[]=[0]){
  const now=this.reference().now(),capacity=AI_WORLD.maxParticipants-humanSlots.length;
  for(const bot of this.bots){bot.update(dt);if(humanSlots.includes(bot.entity.game.farmSlot))bot.leaveSoon=true;}
  const excess=Math.max(0,this.bots.length-capacity);if(excess)this.bots.slice(-excess).forEach(b=>{b.leaveSoon=true;b.plannedLeaveAt=Math.min(b.plannedLeaveAt,now+1500);});
  const departing=this.bots.filter(b=>b.leaveSoon&&(b.entity.game.isAtBase||now>=b.plannedLeaveAt+3000)&&now>this.startedAt+AI_WORLD.initialGraceMs).slice(0,Math.max(0,this.bots.length-Math.min(AI_WORLD.minimumPopulation,capacity)));
  if(departing.length){this.bots=this.bots.filter(b=>!departing.includes(b));this.nextJoinAt=now+12000+this.random()*25000;}
  if(this.bots.length<Math.min(AI_WORLD.targetPopulation,capacity)&&now>Math.max(this.nextJoinAt,this.startedAt+AI_WORLD.initialGraceMs)){
   const slot=[0,1,2,3,4].find(s=>!humanSlots.includes(s)&&!this.bots.some(b=>b.entity.game.farmSlot===s));if(slot!==undefined){const entrance=[farmLocal(slot,0,FARM_PEN.front+1.5),{x:0,z:-24},{x:-2,z:-36},{x:0,z:-48}].find(p=>!this.env.visible(p.x,p.z)&&(!this.reference().isNight||p.z>=BALANCE.baseMinZ));if(entrance){const bot=this.add(slot,entrance.z<BALANCE.baseMinZ?'SEARCH_EGG':'REST');bot.entity.game.x=entrance.x;bot.entity.game.z=entrance.z;bot.entity.game.push(0,0);bot.nextDecisionAt=now+500+this.random()*2000;bot.emoteCooldown=now;bot.emote('hello');this.nextJoinAt=now+15000+this.random()*20000;}}
  }
 }
}
