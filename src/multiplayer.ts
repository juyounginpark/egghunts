export type Peer={id:string;at?:number;speed?:number;name:string;level?:number;isGuest?:boolean;x:number;z:number;rotation:number;appearance:number;downUntil:number;attackAt:number;hitAt?:number;velocity?:{x:number;z:number};carried:number|null;slot?:number;pets?:number[];activePets?:number[];egg?:import('./game').WorldEgg|null};
export type NetworkEgg={id:string;type:number;x:number;z:number};
export class Multiplayer {
  peers:Peer[]=[];
  drops:NetworkEgg[]=[];
  onHit:(hit:{id:string;x:number;z:number;until:number})=>void=()=>{};
  private lastHit='';
  connected=false;
  private token='';
  private busy=false;
  private lastSent=0;
  readonly url=import.meta.env.VITE_MULTIPLAYER_URL || (import.meta.env.DEV?'http://127.0.0.1:4330':'');
  constructor(private syncClock:(time:number)=>void,private notify:(message:string)=>void){}
  async login(){
    if(!this.url)throw Error('멀티플레이 서버 배포 후 연결할 수 있어요.');
    const response=await fetch(`${this.url}/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error('농장 서버에 연결하지 못했어요.');
    const session=await response.json();this.token=session.token;this.syncClock(session.serverTime);this.connected=true;
    this.notify('게스트 로그인 완료 · 같은 서버의 친구가 보여요');
  }
  async logout(){
    this.connected=false;this.peers=[];this.drops=[];
    try{await fetch(`${this.url}/logout`,{method:'POST',headers:{Authorization:`Bearer ${this.token}`},signal:AbortSignal.timeout(3000)});}catch{/* Disconnected sessions expire on server. */}
    this.token='';
  }
  async attack(){
    if(!this.connected)return;
    await fetch(`${this.url}/attack`,{method:'POST',headers:{Authorization:`Bearer ${this.token}`},signal:AbortSignal.timeout(3000)});
  }
  async claim(id:string):Promise<NetworkEgg>{
    const r=await fetch(`${this.url}/claim`,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify({id}),signal:AbortSignal.timeout(3000)});
    if(!r.ok)throw Error('다른 친구가 먼저 집었거나 너무 멀어요.');return r.json();
  }
  async update(x:number,z:number,rotation:number,appearance:number,carried:number|null){
    if(!this.connected||this.busy||performance.now()-this.lastSent<100)return;
    this.busy=true;this.lastSent=performance.now();
    try{
      const response=await fetch(`${this.url}/state`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${this.token}`},body:JSON.stringify({x,z,rotation,appearance,carried}),signal:AbortSignal.timeout(3000)});
      if(!response.ok)throw Error('연결 종료');
      const state=await response.json();this.peers=state.players;this.drops=state.drops;this.syncClock(state.serverTime);
      if(state.hit&&state.hit.id!==this.lastHit){this.lastHit=state.hit.id;this.onHit(state.hit);}
    }catch{this.connected=false;this.peers=[];this.notify('친구 연결이 끊겼어요. 설정에서 다시 연결할 수 있어요.');}
    finally{this.busy=false;}
  }
}
