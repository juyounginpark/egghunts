import type {SupabaseClient} from '@supabase/supabase-js';
import type {GameState,WorldEgg,Boss} from './game';
import {restoreRuntime,type RuntimeState} from './online-state';
import type {Peer} from './multiplayer';

export const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL||'https://leblcdiqsyxqzwlsnkio.supabase.co';
const PUBLIC_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_2KTon_WzPAci5G4dLyZ5Ww_bPgwmiig';
type Snapshot={serverTime:number;runtime:RuntimeState;world:WorldEgg[];bosses:Boss[];peers:Peer[];slot:number;count:number;events:GameState['events'];errors:string[]};
type Command={id:string;kind:string;value?:unknown};
const errorText:Record<string,string>={EGG_UNAVAILABLE:'다른 탐험가가 먼저 가져갔어요.',PREPARE_EGG:'알을 꺼내는 중이에요. 다시 시도해 주세요.',RETURN_TO_BASE:'기지로 돌아오세요.',NOT_OWNED:'내 농장에 보유한 것만 사용할 수 있어요.',ROOM_EXPIRED:'방 연결이 만료됐어요. 다시 방을 찾아주세요.',SERVER_NOT_READY:'서버 준비가 필요해요. 잠시 후 다시 시도해 주세요.',SIGN_IN:'다시 로그인해 주세요.'};
export class OnlineGame{
 active=false;
 connected=false;
 latest:Snapshot|null=null;
 peers:Peer[]=[];
 onState:()=>void=()=>{};
 private client!:SupabaseClient;
 private game:GameState|null=null;
 private busy:Promise<void>|null=null;
 private queue:Command[]=[];
 private pending:{operation:string;id:string;input:{x:number;z:number};commands:Command[]}|null=null;
 private vector={x:0,z:0};
 private lastSent=0;
 private retryAt=0;
 private lastError='';
 constructor(private notify:(s:string)=>void,private syncClock:(n:number)=>void){}
 async enter(host:HTMLElement){
  const {createClient}=await import('@supabase/supabase-js');
  this.client=createClient(SUPABASE_URL,PUBLIC_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const {data}=await this.client.auth.getSession();
  host.innerHTML=`<section class="login-card"><img src="${import.meta.env.BASE_URL}models/egg-0.png" alt=""/><h1>알콩 원정대</h1><form id="room-login"><label for="login-email">이메일</label><input id="login-email" type="email" autocomplete="email" required placeholder="you@example.com"/><div id="otp-fields" hidden><label for="login-code">인증 코드</label><input id="login-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" pattern="[0-9]{6,8}"/></div><button id="login-submit" class="primary" type="submit">인증 코드 받기</button></form><button id="find-room" class="primary" ${data.session?'':'hidden'}>방 찾기</button><p id="login-status" role="status">최대 5명 · 함께 탐험해요</p><button id="switch-account" class="secondary" ${data.session?'':'hidden'}>다른 계정</button></section>`;
  const form=host.querySelector<HTMLFormElement>('#room-login')!,email=host.querySelector<HTMLInputElement>('#login-email')!,code=host.querySelector<HTMLInputElement>('#login-code')!,submit=host.querySelector<HTMLButtonElement>('#login-submit')!,find=host.querySelector<HTMLButtonElement>('#find-room')!,status=host.querySelector<HTMLElement>('#login-status')!,switchAccount=host.querySelector<HTMLButtonElement>('#switch-account')!;
  form.hidden=!!data.session;let sent=false;
  await new Promise<void>(resolve=>{
   form.onsubmit=async event=>{
    event.preventDefault();submit.disabled=true;
    try{
     if(!sent){const {error}=await this.client.auth.signInWithOtp({email:email.value.trim()});if(error)throw error;sent=true;email.readOnly=true;host.querySelector<HTMLElement>('#otp-fields')!.hidden=false;code.required=true;submit.textContent='인증하기';status.textContent='이메일로 받은 코드를 입력해 주세요.';code.focus();}
     else{const {error}=await this.client.auth.verifyOtp({email:email.value.trim(),token:code.value.trim(),type:'email'});if(error)throw error;form.hidden=true;find.hidden=false;switchAccount.hidden=false;status.textContent='로그인 완료';}
    }catch(err){status.textContent=err instanceof Error?err.message:'인증하지 못했어요.';}finally{submit.disabled=false;}
   };
   switchAccount.onclick=async()=>{await this.client.auth.signOut();form.hidden=false;find.hidden=true;switchAccount.hidden=true;sent=false;email.readOnly=false;code.required=false;host.querySelector<HTMLElement>('#otp-fields')!.hidden=true;submit.textContent='인증 코드 받기';};
   find.onclick=async()=>{
    find.disabled=true;status.textContent='빈자리를 찾고 있어요…';
    try{this.pending={operation:'join',id:crypto.randomUUID(),input:{x:0,z:0},commands:[]};await this.flush();this.active=true;resolve();}
    catch(err){status.textContent=err instanceof Error?err.message:'방을 찾지 못했어요.';}finally{find.disabled=false;}
   };
  });
 }
 attach(game:GameState){this.game=game;if(this.latest)this.apply(this.latest);}
 private apply(state:Snapshot){
  this.latest=state;this.peers=state.peers;this.syncClock(state.serverTime);
  if(this.game){const settings=this.game.save.settings;restoreRuntime(this.game,state.runtime,state.world,state.bosses);this.game.save.settings=settings;this.game.events.push(...state.events);}
  for(const error of state.errors)this.notify(errorText[error]??'지금은 사용할 수 없어요.');
  this.onState();
 }
 async send(kind:string,value?:unknown){
  this.queue.push({id:crypto.randomUUID(),kind,value});
  if(this.busy)await this.busy;
  await this.flush();
 }
 halt(){this.vector={x:0,z:0};}
 update(x:number,z:number){
  const wasStopped=Math.hypot(this.vector.x,this.vector.z)<.01,stopped=Math.hypot(x,z)<.01;
  this.vector={x,z};
  if(!this.active||this.busy||performance.now()<this.retryAt||performance.now()-this.lastSent<(wasStopped!==stopped?50:200))return;
  void this.flush().catch(()=>{});
 }
 private flush():Promise<void>{
  if(this.busy)return this.busy;
  const work=async()=>{
   this.lastSent=performance.now();
   this.pending??={operation:'update',id:crypto.randomUUID(),input:this.vector,commands:this.queue.splice(0,16)};
   const {data,error}=await this.client.auth.getSession();if(error||!data.session)throw Error('다시 로그인해 주세요.');
   const response=await fetch(`${SUPABASE_URL}/functions/v1/game`,{method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(this.pending),signal:AbortSignal.timeout(10000)});
   const state=await response.json();
   if(!response.ok){if(state.error==='ROOM_EXPIRED')this.pending={...this.pending,operation:'join'};throw Error(errorText[state.error]??'서버에 연결하지 못했어요. 다시 시도해 주세요.');}
   this.pending=null;this.connected=true;this.lastError='';this.apply(state);
  };
  this.busy=work().catch(error=>{this.connected=false;this.retryAt=performance.now()+1500;const message=error instanceof Error?error.message:'연결이 끊겼어요.';if(this.active&&this.lastError!==message){this.notify(message);this.lastError=message;}throw error;}).finally(()=>{this.busy=null;});
  return this.busy;
 }
}
