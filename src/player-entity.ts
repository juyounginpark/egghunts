import type {GameState} from './game';
import type {Peer} from './multiplayer';
import {EMOTE_DURATION,type Emote} from './emotes';
/** All local actors use the actual game engine; remote actors carry render state only. */
export class PlayerEntity{
 emote:Emote|null=null;
 remotePose:Peer|null=null;
 constructor(public id:string,public kind:'human'|'simulated'|'remote',private engine?:GameState){}
 get game(){if(!this.engine)throw Error('Remote actors have no owned game engine');return this.engine;}
 set game(value:GameState){this.engine=value;}
 get position(){return this.remotePose?{x:this.remotePose.x,z:this.remotePose.z}:{x:this.game.x,z:this.game.z};}
 get health(){return this.remotePose?this.remotePose.health??0:this.game.hp;}
 get inventory(){return this.engine?.inventory??null;}
 get pets(){return this.engine?.activePetLots??[];}
 pose():Peer{
  if(this.remotePose)return this.remotePose;
  const g=this.game,weight=(w:{weightG:number;standardWeightG:number})=>({weightG:w.weightG,standardWeightG:w.standardWeightG});
  return {id:this.id,kind:this.kind==='simulated'?'simulated':'human',name:g.save.playerName??'탐험가',slot:g.farmSlot,x:g.x,z:g.z,rotation:Math.atan2(g.facing.x,g.facing.z),appearance:g.save.appearance??0,level:g.level,health:g.hp,maxHealth:g.maxHp,carried:g.carried?.type??null,downUntil:g.knockedUntil,hitAt:Number.isFinite(g.hitAt)?g.hitAt:0,attackAt:g.batAt,training:g.training,seat:g.seat,activePets:g.activePetLots.map(l=>l.species),activePetWeights:g.activePetLots.map(weight),mountPet:g.mountId,mountWeight:g.mountPetLot?weight(g.mountPetLot):undefined,riding:g.riding,speed:g.speed,velocity:{...g.velocity},at:g.now(),emote:this.emote&&g.now()-this.emote.at<EMOTE_DURATION?this.emote:null};
 }
}
export class HumanController{
 constructor(public entity:PlayerEntity){}
 move(x:number,z:number,dt:number,slow=false){this.entity.game.move(x,z,dt,slow);}
 pickup(egg:import('./game').WorldEgg){this.entity.game.pickup(egg);}
}
export class RemotePlayerController{
 readonly entity:PlayerEntity;
 constructor(pose:Peer){this.entity=new PlayerEntity(pose.id,'remote');this.entity.remotePose=pose;}
 get pose(){return this.entity.pose();}
 update(delta:Partial<Peer>){this.entity.remotePose={...this.pose,...delta};}
}
