import type {Peer} from './multiplayer';
import {RemotePlayerController} from './player-entity';
import {PRESENCE,type MultiplayerConnection} from './presence-config';
import type {AICheckpoint} from './ai-session';
import {createRoomCode} from './room-code';
export type FriendPacket={type:string;[key:string]:unknown};
export class PresenceClient{
 private controllers=new Map<string,RemotePlayerController>();
 private localCode='';
 peers:Peer[]=[];connection:MultiplayerConnection='disconnected';id='self';slot=0;code='';hostId='';epoch=0;
 onPacket:(p:FriendPacket)=>void=()=>{};
 private socket:WebSocket|null=null;private enabled=false;private retryAt=0;private lastSent=0;private lastState='';private current:Peer|null=null;private heartbeat:number|undefined;private lastReceived=0;private mode:'create'|'join'='create';private recover=false;private aiStates=new Map<string,Peer>();
 readonly url=(import.meta.env.VITE_PRESENCE_URL||import.meta.env.VITE_GAME_SERVER_URL||'').replace(/\/game\/?$/,'/presence').replace(/^http/,'ws');
 constructor(private token:()=>string|null,private notify:(message:string)=>void){}
 private setPeers(poses:Peer[]){const next=new Map<string,RemotePlayerController>();for(const pose of poses){const controller=this.controllers.get(pose.id)??new RemotePlayerController(pose);controller.update(pose);next.set(pose.id,controller);}this.controllers=next;this.peers=[...next.values()].map(c=>c.pose);}
 get connected(){return this.connection==='connected';}
 get isHost(){return this.connected&&this.hostId===this.id;}
 login(code?:string){if(!this.url){this.notify('친구 연결을 사용할 수 없어요. 잠시 후 다시 시도해 주세요.');return;}const destination=code?.trim().toUpperCase();if(this.connected&&(!destination||destination===this.code))return;if(this.socket||this.enabled)this.logout();this.recover=false;this.mode=destination?'join':'create';if(!destination&&!this.localCode)this.localCode=createRoomCode();this.code=destination??this.localCode;this.enabled=true;this.retryAt=0;this.connect();}
 logout(){this.enabled=false;clearInterval(this.heartbeat);const socket=this.socket;this.socket=null;socket?.close();this.connection='disconnected';this.setPeers([]);this.id='self';this.slot=0;this.hostId='';this.code='';this.onPacket({type:'offline'});}
 send(packet:object){if(this.connected&&this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify(packet));}
 private connect(){
  if(!this.enabled||!this.url||this.socket||performance.now()<this.retryAt)return;this.connection=this.connection==='disconnected'?'connecting':'reconnecting';
  const socket=new WebSocket(this.url);this.socket=socket;this.lastReceived=performance.now();
  socket.onopen=()=>socket.send(JSON.stringify({type:'join',mode:this.mode,code:this.code,recover:this.recover,token:this.token(),state:this.current}));
  socket.onmessage=e=>{
   this.lastReceived=performance.now();try{
    const p=JSON.parse(e.data);
    if(p.type==='welcome'){if(this.mode==='create')this.localCode=p.code;this.connection='connected';this.recover=true;this.id=p.id;this.slot=p.slot;this.code=p.code;this.mode='join';this.hostId=p.hostId;this.epoch=p.epoch;this.setPeers(p.players);this.lastState='';}
    if(p.type==='host'){if(this.epoch!==p.epoch)this.aiStates.clear();this.hostId=p.hostId;this.epoch=p.epoch;}
    if(p.type==='peer'){const index=this.peers.findIndex(v=>v.id===p.player.id);if(index<0)this.setPeers([...this.peers,p.player]);else this.setPeers(this.peers.map((v,i)=>i===index?{...v,...p.player}:v));}
    if(p.type==='ai'){const old=new Map(this.peers.map(v=>[v.id,v]));this.setPeers([...this.peers.filter(v=>v.kind!=='simulated'),...p.players.map((v:Peer)=>({...old.get(v.id),...v}))]);}
    if(p.type==='leave')this.setPeers(this.peers.filter(v=>v.id!==p.id));
    if(p.type==='error'&&p.message==='ROOM_CODE_TAKEN'){this.logout();this.localCode=createRoomCode();this.login();return;}
    if(p.type==='error'){this.notify(({ROOM_NOT_FOUND:'친구가 초대 코드를 생성했는지, 받은 코드가 맞는지 확인해 주세요.',ROOM_FULL:'친구 다섯 명이 이미 함께하고 있어요.',HOST_CHANGED:'연결을 이어받고 있어요.'} as Record<string,string>)[p.message]??'친구 연결 요청을 처리하지 못했어요.');if(['ROOM_NOT_FOUND','ROOM_FULL','ROOM_CODE_REQUIRED','SIGN_IN','AUTH_NOT_CONFIGURED'].includes(p.message)){this.logout();return;}}
    this.onPacket(p);
   }catch{/* Malformed relay packets cannot replace a save. */}
  };
  socket.onerror=()=>socket.close();socket.onclose=()=>{if(this.socket!==socket)return;clearInterval(this.heartbeat);this.socket=null;this.setPeers([]);this.hostId='';this.connection=this.enabled?'reconnecting':'disconnected';this.retryAt=performance.now()+PRESENCE.reconnectMs;this.onPacket({type:'offline'});};
  clearInterval(this.heartbeat);this.heartbeat=window.setInterval(()=>{if(performance.now()-this.lastReceived>30000){socket.close();return;}if(socket.readyState===WebSocket.OPEN)socket.send('{"type":"ping"}');},PRESENCE.heartbeatMs);
 }
 update(pose:Peer){
  this.current=pose;this.connect();if(!this.connected)return;
  const state=JSON.stringify({...pose,at:0}),previous=this.lastState?JSON.parse(this.lastState):{};
  const moving=Math.hypot(pose.velocity?.x??0,pose.velocity?.z??0)>.01,wasMoving=Math.hypot(previous.velocity?.x??0,previous.velocity?.z??0)>.01;
  const immediate=!this.lastState||moving!==wasMoving||pose.emote?.at!==previous.emote?.at||pose.riding!==previous.riding||Math.hypot(pose.x-(previous.x??pose.x),pose.z-(previous.z??pose.z))>12;
  if(performance.now()-this.lastSent<(immediate?100:PRESENCE.updateMs)||state===this.lastState)return;
  const delta=Object.fromEntries(Object.entries(pose).filter(([k,v])=>k==='at'||JSON.stringify(previous[k])!==JSON.stringify(v)));this.send({type:'position',state:delta});this.lastState=state;this.lastSent=performance.now();
 }
 sendAI(players:Peer[],snapshots?:AICheckpoint[]){const delta=players.map(p=>{const old=this.aiStates.get(p.id);return Object.fromEntries(Object.entries(p).filter(([k,v])=>k==='id'||k==='slot'||k==='at'||!old||JSON.stringify(old[k as keyof Peer])!==JSON.stringify(v)));});this.aiStates=new Map(players.map(p=>[p.id,p]));this.send({type:'ai',epoch:this.epoch,players:delta,snapshots});}
 availability(available:boolean){this.send({type:'availability',available});}
}
