import {randomUUID} from 'node:crypto';
/** Visual state only. No GameState, inventory, physics, economy or persistence. */
export class PresenceRoom{
 players=new Map();
 messages=[];
 sharedEvents=new Map();
 constructor(id=randomUUID()){this.id=id;}
 join(id,state,guest=true){
  if(this.players.size>=5&&!this.players.has(id))throw Error('ROOM_FULL');
  const slot=[0,1,2,3,4].find(n=>![...this.players.values()].some(p=>p.slot===n));
  const player={id,slot:slot??0,isGuest:guest,name:'탐험가',x:0,z:0,rotation:0,appearance:0,carried:null,downUntil:0,attackAt:0};
  this.players.set(id,player);if(state)this.update(id,state);return this.players.get(id);
 }
 update(id,state){
  const old=this.players.get(id);if(!old||!state||typeof state!=='object')throw Error('INVALID_STATE');
  const next={...old};
  for(const key of ['x','z','rotation','appearance','level','speed','downUntil','attackAt']){
   if(state[key]!==undefined){if(!Number.isFinite(state[key])||Math.abs(state[key])>1e14)throw Error('INVALID_STATE');next[key]=state[key];}
  }
  if(Math.abs(next.x)>10000||Math.abs(next.z)>10000)throw Error('INVALID_STATE');
  if(typeof state.name==='string')next.name=state.name.normalize('NFC').replace(/[^\p{L}]/gu,'').slice(0,10)||'탐험가';
  for(const key of ['training','riding'])if(key in state)next[key]=state[key]===true;
  for(const key of ['carried','mountPet'])if(key in state)next[key]=Number.isInteger(state[key])&&state[key]>=0&&state[key]<1000?state[key]:null;
  const seat='seat' in state?(Number.isInteger(state.seat)&&state.seat>=0&&state.seat<6?state.seat:null):old.seat??null;
  if(seat!==null&&[...this.players.values()].some(p=>p.id!==id&&p.seat===seat))throw Error('SEAT_OCCUPIED');next.seat=seat;
  if('activePets' in state)next.activePets=Array.isArray(state.activePets)?state.activePets.filter(n=>Number.isInteger(n)&&n>=0&&n<1000).slice(0,3):[];
  const weight=w=>w&&Number.isFinite(w.weightG)&&Number.isFinite(w.standardWeightG)&&w.weightG>0&&w.weightG<1e9&&w.standardWeightG>0?{weightG:w.weightG,standardWeightG:w.standardWeightG}:undefined;
  if('activePetWeights' in state)next.activePetWeights=Array.isArray(state.activePetWeights)?state.activePetWeights.slice(0,3).map(weight):[];
  if('mountWeight' in state)next.mountWeight=weight(state.mountWeight);
  if(state.velocity&&Number.isFinite(state.velocity.x)&&Number.isFinite(state.velocity.z))next.velocity={x:Math.max(-100,Math.min(100,state.velocity.x)),z:Math.max(-100,Math.min(100,state.velocity.z))};
  next.at=Date.now();this.players.set(id,next);return next;
 }
 chat(id,text){
  const player=this.players.get(id);if(!player)throw Error('NOT_JOINED');
  if(typeof text!=='string'||text.length>160)throw Error('INVALID_CHAT');
  text=text.normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu,'').trim();if(!text||Array.from(text).length>80)throw Error('INVALID_CHAT');
  if(player.chat&&Date.now()-player.chat.at<1200)throw Error('CHAT_COOLDOWN');
  const message={id:randomUUID(),text,at:Date.now()};player.chat=message;this.messages.push({playerId:id,...message});this.messages=this.messages.slice(-50);return message;
 }
 leave(id){this.players.delete(id);}
 // Only trusted server configuration may publish shared events; no client spawn command.
 publish(event){if(this.sharedEvents.size>=50)throw Error('EVENT_CAPACITY');this.sharedEvents.set(event.id,{...event});}
 claim(id,eventId){const event=this.sharedEvents.get(eventId);if(!this.players.has(id)||!event||event.expiresAt<=Date.now()||event.claimedBy)throw Error('EVENT_UNAVAILABLE');event.claimedBy=id;return event;}
}
