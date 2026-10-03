import {randomUUID} from 'node:crypto';
const emotes=new Set(['hello','love','laugh','angry','surprise','go']);
export class PresenceRoom{
 players=new Map();bots=new Map();pendingSlots=new Set();sharedEvents=new Map();drops=new Map();checkpoints=[];checkpointAt=0;aiSeen=Date.now();hostId=null;epoch=0;
 constructor(id=randomUUID()){this.id=id;}
 get humanCount(){return [...this.players.values()].filter(p=>p.kind==='human').length;}
 join(id,state,guest=true,reservedSlot){
  if(this.humanCount>=5)throw Error('ROOM_FULL');
  const used=[...this.players.values()].filter(p=>p.kind==='human').map(p=>p.slot),slot=reservedSlot??[0,1,2,3,4].find(s=>!used.includes(s));
  if(used.includes(slot))throw Error('ROOM_FULL');
  const evicted=[...this.bots.values()].find(p=>p.slot===slot);if(evicted)this.removeBot(evicted.id);
  this.players.set(id,{id,slot,kind:'human',isGuest:guest,name:'탐험가',x:0,z:0,rotation:0,appearance:0,carried:null,attackAt:0,downUntil:0,available:true});
  let player;try{player=this.update(id,state??{});}catch(e){this.players.delete(id);throw e;}this.assignHost();return {player,evicted};
 }
 assignHost(){if(this.hostId&&this.players.get(this.hostId)?.available!==false)return false;this.hostId=[...this.players.values()].find(p=>p.kind==='human'&&p.available!==false)?.id??null;this.epoch++;this.aiSeen=Date.now();return true;}
 update(id,state){
  const old=this.players.get(id);if(!old||!state||typeof state!=='object')throw Error('INVALID_STATE');const next={...old};
  for(const key of ['x','z','rotation','appearance','level','speed','health','maxHealth','downUntil','hitAt','attackAt'])if(key in state){if(!Number.isFinite(state[key])||Math.abs(state[key])>1e14)throw Error('INVALID_STATE');next[key]=state[key];}
  if(Math.abs(next.x)>10000||Math.abs(next.z)>10000)throw Error('INVALID_STATE');
  if(typeof state.name==='string')next.name=state.name.normalize('NFC').replace(/[^\p{L}\p{N}_]/gu,'').slice(0,10)||'탐험가';
  for(const key of ['training','riding'])if(key in state)next[key]=state[key]===true;
  for(const key of ['carried','mountPet'])if(key in state)next[key]=Number.isInteger(state[key])&&state[key]>=0&&state[key]<(key==='carried'?36:721)?state[key]:null;
  if('seat' in state)next.seat=Number.isInteger(state.seat)&&state.seat>=0&&state.seat<4?state.seat:null;
  if(next.seat!==null&&next.seat!==undefined&&[...this.players.values()].some(p=>p.id!==id&&p.seat===next.seat))next.seat=null;
  if('activePets' in state)next.activePets=Array.isArray(state.activePets)?state.activePets.filter(n=>Number.isInteger(n)&&n>=0&&n<721).slice(0,3):[];
  const weight=w=>w&&Number.isFinite(w.weightG)&&Number.isFinite(w.standardWeightG)&&w.weightG>0&&w.weightG<1e9&&w.standardWeightG>0?{weightG:w.weightG,standardWeightG:w.standardWeightG}:undefined;
  if('activePetWeights' in state)next.activePetWeights=Array.isArray(state.activePetWeights)?state.activePetWeights.slice(0,3).map(weight):[];
  if('mountWeight' in state)next.mountWeight=weight(state.mountWeight);
  if(state.velocity&&Number.isFinite(state.velocity.x)&&Number.isFinite(state.velocity.z))next.velocity={x:Math.max(-100,Math.min(100,state.velocity.x)),z:Math.max(-100,Math.min(100,state.velocity.z))};
  if('emote' in state){next.emote=state.emote&&emotes.has(state.emote.id)?{id:state.emote.id,at:old.emote&&old.emoteSource===state.emote.at?old.emote.at:Date.now()}:null;next.emoteSource=state.emote?.at;}
  next.at=Date.now();this.players.set(id,next);if(next.kind==='simulated')this.bots.set(id,next);return next;
 }
 owns(human,id){return human===id&&this.players.get(id)?.kind==='human'||human===this.hostId&&this.bots.has(id);}
 removeBot(id){this.bots.delete(id);this.players.delete(id);this.checkpoints=this.checkpoints.filter(s=>s.id!==id);}
 ai(id,epoch,states,snapshots){
  if(id!==this.hostId||epoch!==this.epoch)throw Error('HOST_CHANGED');if(!Array.isArray(states)||states.length>5-this.humanCount)throw Error('AI_CAPACITY');
  const ids=new Set(),slots=new Set([...this.players.values()].filter(p=>p.kind==='human').map(p=>p.slot));
  for(const s of states){if(typeof s.id!=='string'||!s.id.startsWith('sim-')||ids.has(s.id)||!Number.isInteger(s.slot)||s.slot<0||s.slot>4||slots.has(s.slot))throw Error('INVALID_AI');ids.add(s.id);slots.add(s.slot);}
  for(const bot of this.bots.values())if(!ids.has(bot.id))this.removeBot(bot.id);
  for(const s of states){if(!this.players.has(s.id))this.players.set(s.id,{id:s.id,kind:'simulated',slot:s.slot});this.update(s.id,s);}
  if(snapshots){if(!Array.isArray(snapshots)||snapshots.length!==states.length||JSON.stringify(snapshots).length>24000||snapshots.some(s=>!ids.has(s.id)||!Number.isFinite(s.seed)||!Number.isFinite(s.randomState)))throw Error('INVALID_HANDOVER');this.checkpoints=structuredClone(snapshots);this.checkpointAt=Date.now();}
  this.checkpoints=this.checkpoints.filter(s=>ids.has(s.id)).map(s=>{const p=this.bots.get(s.id);return {...s,x:p.x,z:p.z,rotation:p.rotation,health:p.health,emote:p.emote??null,carryingEgg:p.carried===null?null:s.carryingEgg};});
  this.aiSeen=Date.now();return [...this.bots.values()];
 }
 handover(){const age=Math.max(0,Date.now()-this.checkpointAt);return this.checkpoints.map(s=>({...s,sessionAge:s.sessionAge+age,remaining:Math.max(0,s.remaining-age),decisionIn:Math.max(0,s.decisionIn-age),emoteIn:Math.max(0,s.emoteIn-age),idleIn:Math.max(0,s.idleIn-age)}));}
 leave(id){this.players.delete(id);if(id===this.hostId)this.hostId=null;this.assignHost();}
 publish(event){if(this.sharedEvents.size>=50)throw Error('EVENT_CAPACITY');this.sharedEvents.set(event.id,{...event});}
 claim(id,eventId){const event=this.sharedEvents.get(eventId);if(!this.players.has(id)||!event||event.expiresAt<=Date.now()||event.claimedBy)throw Error('EVENT_UNAVAILABLE');event.claimedBy=id;return event;}
}
