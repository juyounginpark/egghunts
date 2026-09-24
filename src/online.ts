import type {SupabaseClient} from '@supabase/supabase-js';
import type {GameState,WorldEgg,Boss} from './game';
import {restoreRuntime,type RuntimeState} from './online-state';
import type {Peer} from './multiplayer';
import {BALANCE} from './data';

export const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL||'https://leblcdiqsyxqzwlsnkio.supabase.co';
const PUBLIC_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_2KTon_WzPAci5G4dLyZ5Ww_bPgwmiig';
type Snapshot={serverTime:number;runtime:RuntimeState;world:WorldEgg[];bosses:Boss[];peers:Peer[];slot:number;count:number;events:GameState['events'];errors:string[];commandResults?:{id:string;error:string|null}[]};
type Command={id:string;kind:string;value?:unknown};
const errorText:Record<string,string>={EGG_UNAVAILABLE:'다른 탐험가가 먼저 가져갔어요.',PREPARE_EGG:'알을 꺼내는 중이에요. 다시 시도해 주세요.',RETURN_TO_BASE:'기지로 돌아오세요.',NOT_OWNED:'내 농장에 보유한 것만 사용할 수 있어요.',ROOM_EXPIRED:'방 연결이 만료됐어요. 다시 방을 찾아주세요.',SERVER_NOT_READY:'서버 준비가 필요해요. 잠시 후 다시 시도해 주세요.',SIGN_IN:'다시 로그인해 주세요.'};
export class OnlineGame{
 active=false;
 connected=false;
 latest:Snapshot|null=null;
 peers:Peer[]=[];
 private client!:SupabaseClient;
 private game:GameState|null=null;
 private busy:Promise<void>|null=null;
 private queue:Command[]=[];
 private pending:{operation:string;id:string;input:{x:number;z:number};commands:Command[]}|null=null;
 private vector={x:0,z:0};
 private lastSent=0;
 private retryAt=0;
 private lastError='';
 visualOffset={x:0,z:0};
 private completions=new Map<string,(ok:boolean)=>void>();
 private syncTimer:number|undefined;
 private roundTrip=0;
 constructor(private notify:(s:string)=>void,private syncClock:(n:number)=>void){
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.halt();});
 }
 async enter(host:HTMLElement){
  const {createClient}=await import('@supabase/supabase-js');
  this.client=createClient(SUPABASE_URL,PUBLIC_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
  const {data,error:sessionError}=await this.client.auth.getSession();
  host.innerHTML=`<section class="login-card"><img src="${import.meta.env.BASE_URL}models/egg-0.png" alt=""/><h1>알콩 원정대</h1><form id="room-login"><label for="login-email">이메일</label><input id="login-email" type="email" autocomplete="email" required placeholder="you@example.com"/><details id="otp-fields" hidden><summary>CODE</summary><label for="login-code">인증 코드</label><input id="login-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" pattern="[0-9]{6,8}"/></details><button id="login-submit" class="primary" type="submit">인증 코드 받기</button></form><button id="find-room" class="primary" ${data.session?'':'hidden'}>방 찾기</button><p id="login-status" role="status">최대 5명 · 함께 탐험해요</p><button id="switch-account" class="secondary" ${data.session?'':'hidden'}>다른 계정</button></section>`;
  const form=host.querySelector<HTMLFormElement>('#room-login')!,email=host.querySelector<HTMLInputElement>('#login-email')!,code=host.querySelector<HTMLInputElement>('#login-code')!,submit=host.querySelector<HTMLButtonElement>('#login-submit')!,find=host.querySelector<HTMLButtonElement>('#find-room')!,status=host.querySelector<HTMLElement>('#login-status')!,switchAccount=host.querySelector<HTMLButtonElement>('#switch-account')!;
  form.hidden=!!data.session;let sent=false;
  form.insertAdjacentHTML('afterend',`<button id="guest-login" class="secondary" ${data.session?'hidden':''}>게스트로 시작</button><small id="guest-note" ${data.session&&!data.session.user.is_anonymous?'hidden':''}>게스트 기록은 이 브라우저에서 이어집니다. 로그아웃·브라우저 데이터 삭제 시 복구할 수 없어요.</small>`);
  const guest=host.querySelector<HTMLButtonElement>('#guest-login')!,guestNote=host.querySelector<HTMLElement>('#guest-note')!;
  submit.textContent='로그인 메일 받기';
  host.querySelector('summary')!.textContent='코드로 인증';
  code.oninput=()=>{submit.textContent=code.value.trim()?'코드 확인':sent?'메일 다시 받기':'로그인 메일 받기';};
  if(sessionError)status.textContent='로그인 링크가 만료됐거나 유효하지 않아요. 메일을 다시 받아주세요.';
  await new Promise<void>(resolve=>{
   const {data:listener}=this.client.auth.onAuthStateChange((_event,session)=>{
    if(!session)return;
    form.hidden=true;guest.hidden=true;guestNote.hidden=!session.user.is_anonymous;find.hidden=false;switchAccount.hidden=false;status.textContent=session.user.is_anonymous?'게스트 로그인 완료':'로그인 완료';
   });
   form.onsubmit=async event=>{
    event.preventDefault();submit.disabled=true;
    try{
     if(!sent||!code.value.trim()){const {error}=await this.client.auth.signInWithOtp({email:email.value.trim(),options:{emailRedirectTo:'https://juyounginpark.github.io/egghunts/'}});if(error)throw error;sent=true;email.readOnly=true;host.querySelector<HTMLElement>('#otp-fields')!.hidden=false;code.required=false;submit.textContent='메일 다시 받기';switchAccount.hidden=false;status.textContent='이메일의 로그인 링크를 눌러주세요.';}
     else{const {error}=await this.client.auth.verifyOtp({email:email.value.trim(),token:code.value.trim(),type:'email'});if(error)throw error;form.hidden=true;find.hidden=false;switchAccount.hidden=false;status.textContent='로그인 완료';}
    }catch(err){status.textContent=err instanceof Error?err.message:'인증하지 못했어요.';}finally{submit.disabled=false;}
   };
   guest.onclick=async()=>{
    guest.disabled=submit.disabled=true;status.textContent='게스트로 연결 중…';
    try{const {error}=await this.client.auth.signInAnonymously();if(error)throw error;}
    catch(err){status.textContent=err instanceof Error?err.message:'게스트 로그인에 실패했어요.';}
    finally{guest.disabled=submit.disabled=false;}
   };
   switchAccount.onclick=async()=>{const {error}=await this.client.auth.signOut();if(error){status.textContent=error.message;return;}this.pending=null;form.hidden=false;guest.hidden=false;guestNote.hidden=false;find.hidden=true;switchAccount.hidden=true;sent=false;email.readOnly=false;code.value='';code.required=false;host.querySelector<HTMLElement>('#otp-fields')!.hidden=true;submit.textContent='로그인 메일 받기';};
   find.onclick=async()=>{
    find.disabled=true;status.textContent='빈자리를 찾고 있어요…';
    try{this.pending={operation:'join',id:crypto.randomUUID(),input:{x:0,z:0},commands:[]};await this.flush();this.active=true;listener.subscription.unsubscribe();resolve();}
    catch(err){status.textContent=err instanceof Error?err.message:'방을 찾지 못했어요.';}finally{find.disabled=false;}
   };
  });
 }
 attach(game:GameState){
  this.game=game;if(this.latest)this.apply(this.latest);
  // Network cadence is independent of animation frames and input handlers.
  this.syncTimer??=window.setInterval(()=>this.pump(),50);
 }
 private apply(state:Snapshot){
  this.latest=state;this.peers=state.peers;this.syncClock(state.serverTime+this.roundTrip/2);
  if(this.game){
   const g=this.game,settings=g.save.settings,old={x:g.x+this.visualOffset.x,z:g.z+this.visualOffset.z,death:!!g.death,training:g.training,night:g.isNight,hit:g.hitAt,slot:g.farmSlot,facing:g.facing,velocity:g.velocity};
   restoreRuntime(g,state.runtime,state.world,state.bosses);g.save.settings=settings;g.events.push(...state.events);
   const stable=old.death===!!g.death&&old.training===g.training&&old.night===g.isNight&&old.hit===g.hitAt&&old.slot===g.farmSlot&&!g.launch&&!g.knockback.remaining;
   if(stable&&!g.death&&!g.training&&g.now()>=g.knockedUntil){
    const lead=Math.min(.5,this.roundTrip/2000);
    if(Math.hypot(this.vector.x,this.vector.z)>.01)g.push(this.vector.x*g.speed*lead,this.vector.z*g.speed*lead);
    g.facing=old.facing;g.velocity=old.velocity;
   }
   // Correct the simulation once; ease only the drawn position, never the input velocity.
   this.visualOffset=stable&&Math.hypot(old.x-g.x,old.z-g.z)<Math.max(6,g.speed*2)?{x:old.x-g.x,z:old.z-g.z}:{x:0,z:0};
  }
  for(const error of state.errors)this.notify(errorText[error]??'지금은 사용할 수 없어요.');
 }
 send(kind:string,value?:unknown):Promise<boolean>{
  if(this.completions.size>=64)return Promise.reject(Error('연결을 기다리고 있어요. 잠시 후 다시 시도해 주세요.'));
  const command={id:crypto.randomUUID(),kind,value};this.queue.push(command);
  const completion=new Promise<boolean>(resolve=>this.completions.set(command.id,resolve));
  this.pump();return completion;
 }
 halt(){this.update(0,0);}
 reconcile(dt:number){
  if(!this.game)return;
  const decay=Math.exp(-dt*12);this.visualOffset.x*=decay;this.visualOffset.z*=decay;
  // Only predict knockback motion here; rewards, damage and drops stay on the server.
  if(this.game.knockback.remaining>0){const k=this.game.knockback,step=Math.min(dt,k.remaining);this.game.push(k.x*step,k.z*step);k.remaining=Math.max(0,k.remaining-step);return;}
 }
 update(x:number,z:number){
  const wasStopped=Math.hypot(this.vector.x,this.vector.z)<.01,stopped=Math.hypot(x,z)<.01;
  const length=Math.max(1,Math.hypot(x,z));this.vector={x:x/length,z:z/length};
  if(wasStopped!==stopped)this.lastSent=Math.min(this.lastSent,performance.now()-BALANCE.roomSyncMs);
 }
 private pump(){
  if(!this.active||this.busy||performance.now()<this.retryAt)return;
  if(!this.queue.length&&performance.now()-this.lastSent<BALANCE.roomSyncMs)return;
  void this.flush().catch(()=>{});
 }
 private flush():Promise<void>{
  if(this.busy)return this.busy;
  const work=async()=>{
   this.lastSent=performance.now();
   this.pending??={operation:'update',id:crypto.randomUUID(),input:this.vector,commands:this.queue.splice(0,16)};
   const {data,error}=await this.client.auth.getSession();if(error||!data.session)throw Error('다시 로그인해 주세요.');
   let session=data.session;
   for(let attempt=0;attempt<4;attempt++){
    const started=performance.now();
    const response=await fetch(`${SUPABASE_URL}/functions/v1/game`,{method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(this.pending),signal:AbortSignal.timeout(10000)});
    const state=await response.json();
    if(response.ok){
     this.roundTrip=performance.now()-started;
     const commands=this.pending!.commands;
     this.pending=null;this.connected=true;this.lastError='';this.apply(state);
     for(const command of commands){
      const result=state.commandResults?.find((r:{id:string;error:string|null})=>r.id===command.id);
      this.completions.get(command.id)?.(result?!result.error:!state.errors.length);this.completions.delete(command.id);
     }
     return;
    }
    if(attempt===0&&response.status===401){const refreshed=await this.client.auth.refreshSession();if(!refreshed.error&&refreshed.data.session){session=refreshed.data.session;continue;}}
    if(state.error==='ROOM_EXPIRED')this.pending={...this.pending!,operation:'join'};
    if(attempt<3&&['ROOM_EXPIRED','RETRY','RATE_LIMIT'].includes(state.error)){
     await new Promise(resolve=>setTimeout(resolve,100+Math.random()*150));continue;
    }
    console.warn('Room request failed',response.status,state.error??state.code??'UNKNOWN');
    throw Error(errorText[state.error]??(['RETRY','RATE_LIMIT'].includes(state.error)?'방 동기화가 지연되고 있어요. 다시 연결할게요.':`서버 응답 오류 (${response.status}). 다시 연결할게요.`));
   }
  };
  this.busy=work().catch(error=>{this.connected=false;this.retryAt=performance.now()+1500;const message=error instanceof Error?error.message:'연결이 끊겼어요.';if(this.active&&this.lastError!==message){this.notify(message);this.lastError=message;}throw error;}).finally(()=>{this.busy=null;});
  return this.busy;
 }
}
