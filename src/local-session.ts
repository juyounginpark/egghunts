import {AISession,type AIEnvironment,type AICheckpoint} from './ai-session';
import {PlayerEntity,HumanController} from './player-entity';
import {BALANCE} from './data';
import type {GameState,WorldEgg} from './game';
import type {Peer} from './multiplayer';
import type {PresenceClient,FriendPacket} from './presence-client';
import type {EmoteId} from './emotes';
export class LocalSession{
 human:HumanController;ai:AISession;
 private lastAI=0;private lastCheckpoint=-Infinity;private lastEpoch=0;private botSignature='';private wasConnected=false;private pending=new Map<string,number>();private lastHumanSignature='';
 private drops=new Map<string,{egg:WorldEgg;actor:string;expiresAt:number}>();
 constructor(private game:()=>GameState,public multiplayer:PresenceClient,visible:(x:number,z:number)=>boolean,random?:()=>number){
  this.human=new HumanController(new PlayerEntity('self','human',game()));
  const env:AIEnvironment={actors:()=>[this.human.entity.pose(),...this.peers],attack:(a,t)=>this.attack(a,t),collect:a=>this.collect(a),visible};
  this.ai=new AISession(game,env,random);multiplayer.onPacket=p=>this.packet(p);
 }
 get peers():Peer[]{return this.multiplayer.connected?this.multiplayer.isHost?[...this.multiplayer.peers.filter(p=>p.kind!=='simulated'),...(this.ai?.bots??[]).map(b=>({...b.entity.pose(),action:b.action}))]:this.multiplayer.peers:(this.ai?.bots??[]).map(b=>({...b.entity.pose(),action:b.action}));}
 private localActor(id:string){return this.human.entity.id===id?this.human.entity:this.ai.bots.find(b=>b.entity.id===id)?.entity;}
 emote(id:EmoteId){const now=this.game().now();if(now-(this.human.entity.emote?.at??0)<1800)return;this.human.entity.emote={id,at:now};}
 attack(actor:PlayerEntity,targetId?:string){
  const g=actor.game,now=g.now();if(g.death||g.carried||g.training||now<g.knockedUntil||now-g.batAt<BALANCE.batCooldown)return;
  g.batAt=now;
  for(const target of [this.human.entity.pose(),...this.peers]){
   if(target.id===actor.id||targetId&&target.id!==targetId)continue;
   const dx=target.x-g.x,dz=target.z-g.z,distance=Math.hypot(dx,dz);
   if(distance>BALANCE.batRange||distance>.01&&(dx*g.facing.x+dz*g.facing.z)/distance<BALANCE.batFacingThreshold)continue;
   if(this.multiplayer.connected)this.multiplayer.send({type:'attack',actor:actor.id,target:target.id});else this.hit(actor.id,target.id);
   break;
  }
 }
 private hit(actorId:string,targetId:string){
  const target=this.localActor(targetId);if(!target||this.multiplayer.connected&&target.kind==='simulated'&&!this.multiplayer.isHost)return;
  const attacker=actorId===this.human.entity.id?this.human.entity.pose():this.peers.find(p=>p.id===actorId);if(!attacker)return;
  const g=target.game,egg=g.carried;if(!g.receiveBat(g.x-attacker.x,g.z-attacker.z))return;
  if(egg){if(target.kind!=='human')g.world=g.world.filter(e=>e.id!==egg.id);const dropped={...egg,x:g.x,z:g.z};
   if(this.multiplayer.connected)this.multiplayer.send({type:'drop',actor:targetId,egg:dropped});this.drops.set(egg.id,{actor:targetId,egg:dropped,expiresAt:g.now()+60000});
  }
  this.ai.bots.find(b=>b.entity.id===targetId)?.attackedBy(actorId);
 }
 collect(actor=this.human.entity){
  const g=actor.game;if(g.carried||g.death||g.now()<g.knockedUntil)return false;
  const drop=[...this.drops.values()].find(d=>d.expiresAt>g.now()&&Math.hypot(d.egg.x-g.x,d.egg.z-g.z)<BALANCE.interaction);
  if(!drop)return false;
  if(this.multiplayer.connected){if(g.now()-(this.pending.get(drop.egg.id)??0)>2000){this.pending.set(drop.egg.id,g.now());this.multiplayer.send({type:'collect',actor:actor.id,eggId:drop.egg.id});}return actor.kind==='human';}
  const owner=this.localActor(drop.actor);if(owner)owner.game.world=owner.game.world.filter(e=>e.id!==drop.egg.id);this.drops.delete(drop.egg.id);g.world=g.world.filter(e=>e.id!==drop.egg.id);g.pickup({...drop.egg});return true;
 }
 private packet(p:FriendPacket){
  if(p.type==='welcome'){const previousId=this.human.entity.id;this.human.entity.id=this.multiplayer.id;for(const drop of this.drops.values())if(drop.actor===previousId)drop.actor=this.multiplayer.id;for(const drop of (p.drops??[]) as {actor:string;egg:WorldEgg}[])this.drops.set(drop.egg.id,{...drop,expiresAt:this.game().now()+60000});this.game().farmSlot=this.multiplayer.slot;this.wasConnected=true;}
  if(p.type==='host'&&this.multiplayer.isHost){const changed=this.lastEpoch!==this.multiplayer.epoch;this.lastEpoch=this.multiplayer.epoch;const snapshots=p.snapshots as AICheckpoint[];if(changed&&snapshots?.length)this.ai.restore(snapshots);const slots=[this.multiplayer.slot,...this.multiplayer.peers.filter(v=>v.kind==='human').map(v=>v.slot??0)];this.ai.bots=this.ai.bots.filter(b=>!slots.includes(b.entity.game.farmSlot));}
  if(p.type==='evict'){const bot=this.ai.bots.find(b=>b.entity.id===p.id);if(bot){bot.leaveSoon=true;bot.nextDecisionAt=this.game().now();bot.plannedLeaveAt=this.game().now()-2000;}}
  if(p.type==='attack')this.hit(p.actor as string,p.target as string);
  if(p.type==='drop'){const egg=p.egg as WorldEgg;this.drops.set(egg.id,{actor:p.actor as string,egg,expiresAt:this.game().now()+60000});}
  if(p.type==='collected'){const egg=p.egg as WorldEgg,drop=this.drops.get(egg.id),owner=drop?this.localActor(drop.actor):undefined;if(owner)owner.game.world=owner.game.world.filter(e=>e.id!==egg.id);this.drops.delete(egg.id);this.pending.delete(egg.id);const actor=this.localActor(p.actor as string);if(actor&&(!this.multiplayer.connected||actor.kind==='human'||this.multiplayer.isHost)&&!actor.game.carried)actor.game.pickup({...egg});}
  if(p.type==='offline'&&this.wasConnected){this.wasConnected=false;const previousId=this.human.entity.id;for(const drop of this.drops.values())if(drop.actor===previousId)drop.actor='self';this.pending.clear();this.human.entity.id='self';this.game().farmSlot=0;const snapshot=this.ai.checkpoint();this.ai.restore(snapshot.filter(s=>s.slot!==0));}
 }
 update(dt:number){
  this.human.entity.game=this.game();this.multiplayer.update(this.human.entity.pose());
  if(!this.multiplayer.connected||this.multiplayer.isHost){
   const humanSlots=this.multiplayer.connected?[this.multiplayer.slot,...this.multiplayer.peers.filter(p=>p.kind==='human').map(p=>p.slot??0)]:[0];
   const signature=humanSlots.join(',');if(signature!==this.lastHumanSignature){this.lastHumanSignature=signature;this.lastCheckpoint=-Infinity;}this.ai.update(dt,humanSlots);
   if(this.multiplayer.isHost&&performance.now()-this.lastAI>=500){
    const signature=this.ai.bots.map(b=>b.entity.id+':'+(b.entity.game.carried?.id??'')).join('|');const snapshots=signature!==this.botSignature||performance.now()-this.lastCheckpoint>=5000?this.ai.checkpoint():undefined;this.botSignature=signature;
    this.multiplayer.sendAI(this.ai.bots.filter(b=>!humanSlots.includes(b.entity.game.farmSlot)).map(b=>({...b.entity.pose(),action:b.action})),snapshots);
    this.lastAI=performance.now();if(snapshots)this.lastCheckpoint=this.lastAI;
   }
  }
  for(const [id,drop]of this.drops)if(drop.expiresAt<this.game().now()){
   const owner=this.localActor(drop.actor);if(owner&&!owner.game.world.some(e=>e.id===id)&&owner.game.carried?.id!==id)owner.game.world.push(drop.egg);this.drops.delete(id);
  }
 }
 get visibleDrops(){return [...this.drops.values()].map(d=>d.egg);}
}
