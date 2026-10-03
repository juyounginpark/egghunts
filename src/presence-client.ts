import type {Peer,ChatMessage} from './multiplayer';
import type {GameState} from './game';
import {PRESENCE,type MultiplayerConnection,type SharedEvent} from './presence-config';
export class PresenceClient{
 peers:Peer[]=[];
 chat:ChatMessage|null=null;
 sharedEvents:SharedEvent[]=[];
 connection:MultiplayerConnection='disconnected';
 private socket:WebSocket|null=null;
 private enabled=false;
 private retryAt=0;
 private lastSent=0;
 private lastState='';
 private lastMove=false;
 private lastRotation=0;
 private lastRiding=false;
 private lastX=0;
 private lastZ=0;
 private force=false;
 private current:Peer|null=null;
 private attackAt=0;
 private heartbeat:number|undefined;
 private lastReceived=0;
 readonly url=(import.meta.env.VITE_PRESENCE_URL||import.meta.env.VITE_GAME_SERVER_URL||'').replace(/\/game\/?$/,'/presence').replace(/^http/,'ws');
 constructor(private token:()=>string|null,private notify:(message:string)=>void){}
 get connected(){return this.connection==='connected';}
 async login(){this.enabled=true;this.retryAt=0;this.connect();}
 async logout(){this.enabled=false;clearInterval(this.heartbeat);this.socket?.close();this.socket=null;this.connection='disconnected';this.peers=[];this.chat=null;this.sharedEvents=[];}
 private connect(){
  if(!this.enabled||!this.url||this.socket||performance.now()<this.retryAt)return;
  this.connection=this.connection==='disconnected'?'connecting':'reconnecting';
  const socket=new WebSocket(this.url);this.socket=socket;
  this.lastReceived=performance.now();
  socket.onopen=()=>socket.send(JSON.stringify({type:'join',token:this.token(),state:this.current}));
  socket.onmessage=e=>{
   this.lastReceived=performance.now();
   try{
    const p=JSON.parse(e.data);
    if(p.type==='welcome'){this.connection='connected';this.peers=p.players.map((peer:Peer,index:number)=>({...peer,slot:index+1}));this.force=true;this.sharedEvents=p.sharedEvents??[];}
    if(p.type==='peer'){const index=this.peers.findIndex(v=>v.id===p.player.id);if(index<0){const slot=[1,2,3,4].find(n=>!this.peers.some(peer=>peer.slot===n));this.peers.push({...p.player,slot});}else this.peers[index]={...this.peers[index],...p.player,slot:this.peers[index].slot};this.force=p.joined===true;}
    if(p.type==='leave')this.peers=this.peers.filter(v=>v.id!==p.id);
    if(p.type==='chat'){if(p.self)this.chat=p.message;else{const peer=this.peers.find(v=>v.id===p.playerId);if(peer)peer.chat=p.message;}}
    if(p.type==='shared')this.sharedEvents=p.events;
    if(p.type==='error')this.notify(p.message??'친구 연결을 확인해 주세요.');
   }catch{/* Invalid relay packets never change the game. */}
  };
  socket.onerror=()=>socket.close();
  socket.onclose=()=>{
   if(this.socket!==socket)return;clearInterval(this.heartbeat);this.socket=null;this.peers=[];this.sharedEvents=[];this.chat=null;
   this.connection=this.enabled?'reconnecting':'disconnected';this.retryAt=performance.now()+PRESENCE.reconnectMs;
  };
  clearInterval(this.heartbeat);
  this.heartbeat=window.setInterval(()=>{
   if(performance.now()-this.lastReceived>30000){socket.close();return;}
   if(socket.readyState===WebSocket.OPEN)socket.send('{"type":"ping"}');
  },PRESENCE.heartbeatMs);
 }
 update(game:GameState,rotation:number){
  const active=game.activePetLots;
  this.current={id:'',name:game.save.playerName??'탐험가',x:game.x,z:game.z,rotation,appearance:game.save.appearance??0,level:game.level,
   carried:game.carried?.type??null,downUntil:game.knockedUntil,attackAt:this.attackAt,training:game.training,seat:game.seat,mountPet:game.mountId,riding:game.riding,
   activePets:active.map(l=>l.species),activePetWeights:active.map(l=>({weightG:l.weightG,standardWeightG:l.standardWeightG})),
   mountWeight:game.mountPetLot?{weightG:game.mountPetLot.weightG,standardWeightG:game.mountPetLot.standardWeightG}:undefined,
   velocity:{...game.velocity},at:game.now(),speed:game.speed};
  this.connect();if(!this.connected||this.socket?.readyState!==WebSocket.OPEN)return;
  // A lone player sends no gameplay state. A new peer triggers an immediate refresh.
  if(!this.peers.length&&!this.force)return;
  const moving=Math.hypot(game.velocity.x,game.velocity.z)>.01;
  const turn=Math.abs(Math.atan2(Math.sin(rotation-this.lastRotation),Math.cos(rotation-this.lastRotation)));
  const immediate=this.force||moving!==this.lastMove||turn>Math.PI/3||game.riding!==this.lastRiding||Math.hypot(game.x-this.lastX,game.z-this.lastZ)>12;
  if(!this.force&&performance.now()-this.lastSent<100)return;
  if(!immediate&&performance.now()-this.lastSent<PRESENCE.updateMs)return;
  const state=JSON.stringify({...this.current,at:0});
  if(state===this.lastState&&!immediate)return;
  const previous=this.lastState?JSON.parse(this.lastState):{};
  const delta=this.force?this.current:Object.fromEntries(Object.entries(this.current).filter(([key,value])=>key==='at'||JSON.stringify(previous[key])!==JSON.stringify(value)));
  this.socket.send(JSON.stringify({type:'position',state:delta}));this.lastState=state;this.lastSent=performance.now();
  this.force=false;this.lastMove=moving;this.lastRotation=rotation;this.lastRiding=game.riding;this.lastX=game.x;this.lastZ=game.z;
 }
 async sendChat(text:string){
  if(!this.connected||!text.trim())return false;
  this.socket!.send(JSON.stringify({type:'chat',text}));return true;
 }
 swing(at:number){this.attackAt=at;}
 claimShared(id:string){if(!this.connected)throw Error('공유 이벤트에 연결되지 않았어요.');this.socket!.send(JSON.stringify({type:'claimShared',id}));}
}
