import type {SupabaseClient} from '@supabase/supabase-js';
import type {GameState,WorldEgg,Boss} from './game';
import {restoreRuntime,type RuntimeState} from './online-state';
import type {Peer} from './multiplayer';
import {BALANCE,COUPON_ERRORS} from './data';
import {playerName} from './player-identity';
import type {EggNotice} from './egg-notices';
import {restoreSnapshotSections} from './snapshot-stream';
import type {ChatMessage} from './multiplayer';

export const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL||'https://leblcdiqsyxqzwlsnkio.supabase.co';
const PUBLIC_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_2KTon_WzPAci5G4dLyZ5Ww_bPgwmiig';
// Login remains on Supabase; all room operations must use the same game host.
const GAME_URL=import.meta.env.VITE_GAME_SERVER_URL||`${SUPABASE_URL}/functions/v1/game`;
const HOSTED_EDGE=!import.meta.env.VITE_GAME_SERVER_URL;
type Snapshot={serverTime:number;runtime:RuntimeState;world:WorldEgg[];bosses:Boss[];peers:Peer[];chat?:ChatMessage|null;eggNotices?:EggNotice[];isGuest?:boolean;slot:number;count:number;events:GameState['events'];errors:string[];commandResults?:{id:string;error:string|null}[]};
type Command={id:string;kind:string;value?:unknown};
const errorText:Record<string,string>={...COUPON_ERRORS,CANNOT_EQUIP:'빈 착용 칸과 남은 펫 수량을 확인해 주세요.',WEEKLY_INVENTORY_FULL:'알 보관함 한 칸을 비워 주세요.',WEEKLY_UNAVAILABLE:'오늘 보상을 이미 받았거나 수령할 수 없는 상태예요.',EGG_UNAVAILABLE:'다른 탐험가가 먼저 가져갔어요.',PREPARE_EGG:'알을 꺼내는 중이에요. 다시 시도해 주세요.',RETURN_TO_BASE:'기지로 돌아오세요.',NOT_OWNED:'내 농장에 보유한 것만 사용할 수 있어요.',ROOM_EXPIRED:'방 연결이 만료됐어요. 다시 방을 찾아주세요.',SERVER_NOT_READY:'서버 준비가 필요해요. 잠시 후 다시 시도해 주세요.',SIGN_IN:'다시 로그인해 주세요.'};
Object.assign(errorText,{SEAT_OCCUPIED:'이미 다른 탐험가가 앉아 있어요.',SEAT_UNAVAILABLE:'빈 통나무 의자 가까이에서 앉아 주세요.'});
Object.assign(errorText,{INSUFFICIENT_SPEED:'알을 획득하기 위한 속도가 부족해요.',SHORTCUT_UNAVAILABLE:'빈손으로 지름길 장치 가까이에서 사용해 주세요.'});
export class OnlineGame{
 active=false;
 connected=false;
 latest:Snapshot|null=null;
 peers:Peer[]=[];
 private client!:SupabaseClient;
 private game:GameState|null=null;
 private busy:Promise<void>|null=null;
 private queue:Command[]=[];
 private pending:{operation:string;id:string;input:{x:number;z:number;slow?:boolean};inputAt?:number;inputRevision?:number;commands:Command[]}|null=null;
 private vector={x:0,z:0,slow:false};
 private lastInput={x:0,z:0,slow:false};
 private inputAt=0;
 private receivedAt=0;
 private lastSent=0;
 private retryAt=0;
 private lastError='';
 visualOffset={x:0,z:0};
 private completions=new Map<string,(ok:boolean)=>void>();
 private syncTimer:number|undefined;
 private roundTrip=0;
 private predictionLead=0;
 private inputRevision=0;
 private idleAcknowledgedRevision=-1;
 private accessToken='';
 private playerAccountId='';
 private emailLinkBusy=false;
 private emailLinkSentAt=0;
 private leaving=false;
 private socket:WebSocket|null=null;
 private warmSocket:WebSocket|null=null;
 private warmReady=false;
 private warmTimer:number|undefined;
 private socketRetryAt=0;
 private socketRequest:{id:string;resolve:(value:Response)=>void;reject:()=>void;timer:number}|null=null;
 private connectSocket(warm=false){
  if(this.leaving||(warm?!!this.warmSocket:!!this.socket)||performance.now()<this.socketRetryAt)return;
  const socket=new WebSocket(GAME_URL.replace(/^http/,'ws'));
  if(warm){this.warmSocket=socket;this.warmReady=false;}else this.socket=socket;
  const baseline=new Map<string,unknown>();
  const opened=window.setTimeout(()=>{if(socket.readyState===WebSocket.CONNECTING||socket===this.warmSocket&&!this.warmReady)socket.close();},5000);
  socket.onopen=()=>{
   if(warm)socket.send(JSON.stringify({token:this.accessToken,hello:true}));
   else {clearTimeout(opened);this.scheduleWarmSocket();}
  };
  socket.onmessage=event=>{
   try{const message=JSON.parse(event.data);
    if(message.ready===true&&socket===this.warmSocket){clearTimeout(opened);this.warmReady=true;return;}
    const request=this.socketRequest;if(socket!==this.socket||!request||request.id!==message.id)return;
    const body=message.format==='sections-v1'?restoreSnapshotSections(message.body,baseline):message.body;
    clearTimeout(request.timer);this.socketRequest=null;
    request.resolve(new Response(JSON.stringify(body),{status:message.status,headers:{'Content-Type':'application/json','Server-Timing':message.timing??''}}));
   }catch{socket.close();}
  };
  socket.onerror=()=>socket.close();
  socket.onclose=()=>{
   clearTimeout(opened);
   if(this.warmSocket===socket){this.warmSocket=null;this.warmReady=false;return;}
   if(this.socket!==socket)return;
   this.socket=null;clearTimeout(this.warmTimer);
   this.socketRetryAt=performance.now()+1000;
   const request=this.socketRequest;this.socketRequest=null;if(request){clearTimeout(request.timer);request.reject();}
  };
 }
 private scheduleWarmSocket(){
  clearTimeout(this.warmTimer);
  if(!HOSTED_EDGE)return;
  // Hosted sockets were observed dropping after 24–31s under sustained play,
  // before our 110s wall-clock close. Prepare ahead of that observed window.
  this.warmTimer=window.setTimeout(()=>this.connectSocket(true),15000);
 }
 private async requestState(request:NonNullable<OnlineGame['pending']>,token:string):Promise<Response>{
  if(request.operation==='update'&&!this.leaving){
   if(this.warmReady&&this.warmSocket?.readyState===WebSocket.OPEN){
    const old=this.socket;this.socket=this.warmSocket;this.warmSocket=null;this.warmReady=false;
    this.scheduleWarmSocket();old?.close(1000,'Warm handoff');
   }
   this.connectSocket();
   const connecting=this.socket;
   if(connecting?.readyState===WebSocket.CONNECTING)await new Promise<void>(resolve=>{
    const done=()=>{clearTimeout(timer);connecting.removeEventListener('open',done);connecting.removeEventListener('close',done);resolve();};
    const timer=window.setTimeout(done,1200);
    connecting.addEventListener('open',done,{once:true});connecting.addEventListener('close',done,{once:true});
   });
   if(this.leaving)throw Error('LEFT_ROOM');
   if(this.socket?.readyState===WebSocket.OPEN){
    try{return await new Promise<Response>((resolve,reject)=>{
     const timer=window.setTimeout(()=>{this.socket?.close();reject(Error('STREAM_TIMEOUT'));},5000);
     this.socketRequest={id:request.id,resolve,reject:()=>reject(Error('STREAM_CLOSED')),timer};
     this.socket!.send(JSON.stringify({token,request,stream:1}));
    });}catch{/* Replay the same request ID through HTTP; rewards remain idempotent. */}
   }
  }
  if(this.leaving)throw Error('LEFT_ROOM');
  return fetch(GAME_URL,{method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(10000)});
 }
 constructor(private notify:(s:string)=>void,private syncClock:(n:number)=>void){
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.halt();});
  // Reload/navigation is a transport disconnect, not an explicit room departure.
  window.addEventListener('pagehide',()=>{this.halt();void this.leave(false);});
  window.addEventListener('pageshow',event=>{if(event.persisted&&this.leaving)location.reload();});
 }
 async leave(releaseMembership=true){
  if(this.leaving)return;
  this.leaving=true;this.active=false;this.connected=false;this.peers=[];this.latest=null;
  this.socket?.close();
  this.warmSocket?.close();clearTimeout(this.warmTimer);
  clearInterval(this.syncTimer);this.syncTimer=undefined;this.vector={x:0,z:0,slow:false};this.queue=[];this.pending=null;
  for(const complete of this.completions.values())complete(false);this.completions.clear();
  if(!releaseMembership||!this.accessToken)return;
  try{await fetch(GAME_URL,{method:'POST',keepalive:true,headers:{apikey:PUBLIC_KEY,Authorization:`Bearer ${this.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({operation:'leave'}),signal:AbortSignal.timeout(5000)});}
  catch{/* A crashed/offline browser is also removed by the server membership lease. */}
 }
 async enter(host:HTMLElement){
  const {createClient}=await import('@supabase/supabase-js');
  this.client=createClient(SUPABASE_URL,PUBLIC_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
  const {data,error:sessionError}=await this.client.auth.getSession();
  host.innerHTML=`<section class="login-card"><img src="${import.meta.env.BASE_URL}models/egg-0.png" alt=""/><h1>알콩 원정대</h1><form id="room-login"><label for="login-email">이메일</label><input id="login-email" type="email" autocomplete="email" required placeholder="you@example.com"/><details id="otp-fields" hidden><summary>CODE</summary><label for="login-code">인증 코드</label><input id="login-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" pattern="[0-9]{6,8}"/></details><button id="login-submit" class="primary" type="submit">인증 코드 받기</button></form><button id="find-room" class="primary" ${data.session?'':'hidden'}>방 찾기</button><p id="login-status" role="status">최대 5명 · 함께 탐험해요</p><button id="switch-account" class="secondary" ${data.session?'':'hidden'}>다른 계정</button></section>`;
  const form=host.querySelector<HTMLFormElement>('#room-login')!,email=host.querySelector<HTMLInputElement>('#login-email')!,code=host.querySelector<HTMLInputElement>('#login-code')!,submit=host.querySelector<HTMLButtonElement>('#login-submit')!,find=host.querySelector<HTMLButtonElement>('#find-room')!,status=host.querySelector<HTMLElement>('#login-status')!,switchAccount=host.querySelector<HTMLButtonElement>('#switch-account')!;
  form.hidden=!!data.session;let sent=false;
  find.insertAdjacentHTML('beforebegin','<div id="name-fields"><label for="player-name">탐험가 이름</label><input id="player-name" autocomplete="nickname" maxlength="10" minlength="1" placeholder="한글·영어 최대 10자"/><small>공백·숫자·특수문자 불가</small></div>');
  const nameFields=host.querySelector<HTMLElement>('#name-fields')!,nameInput=host.querySelector<HTMLInputElement>('#player-name')!;
  let accountId=data.session?.user.id??'';
  nameFields.hidden=!data.session;nameInput.value=localStorage.getItem(`alkong:name:${accountId}`)??'';
  form.insertAdjacentHTML('afterend',`<button id="guest-login" class="secondary" ${data.session?'hidden':''}>게스트로 시작</button><small id="guest-note" ${data.session&&!data.session.user.is_anonymous?'hidden':''}>게스트 기록은 이 브라우저에서 이어집니다. 로그아웃·브라우저 데이터 삭제 시 복구할 수 없어요.</small>`);
  const guest=host.querySelector<HTMLButtonElement>('#guest-login')!,guestNote=host.querySelector<HTMLElement>('#guest-note')!;
  submit.textContent='로그인 메일 받기';
  host.querySelector('summary')!.textContent='코드로 인증';
  code.oninput=()=>{submit.textContent=code.value.trim()?'코드 확인':sent?'메일 다시 받기':'로그인 메일 받기';};
  if(sessionError)status.textContent='로그인 링크가 만료됐거나 유효하지 않아요. 메일을 다시 받아주세요.';
  await new Promise<void>(resolve=>{
   const {data:listener}=this.client.auth.onAuthStateChange((_event,session)=>{
    if(!session)return;
    accountId=session.user.id;nameInput.value=localStorage.getItem(`alkong:name:${accountId}`)??'';nameFields.hidden=false;
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
   switchAccount.onclick=async()=>{const {error}=await this.client.auth.signOut();if(error){status.textContent=error.message;return;}this.pending=null;nameFields.hidden=true;nameInput.value="";form.hidden=false;guest.hidden=false;guestNote.hidden=false;find.hidden=true;switchAccount.hidden=true;sent=false;email.readOnly=false;code.value='';code.required=false;host.querySelector<HTMLElement>('#otp-fields')!.hidden=true;submit.textContent='로그인 메일 받기';};
   find.onclick=async()=>{
    let name:string;
    try{name=playerName(nameInput.value);}catch{status.textContent='닉네임은 한글·영어만 최대 10자로 입력해 주세요.';nameInput.focus();return;}
    find.disabled=true;status.textContent='빈자리를 찾고 있어요…';
    try{this.playerAccountId=accountId;this.pending={operation:'join',id:crypto.randomUUID(),input:{x:0,z:0},commands:[{id:crypto.randomUUID(),kind:'name',value:name}]};await this.flush();if(this.latest?.errors.length)throw Error('이름을 저장하지 못했어요. 다시 시도해 주세요.');localStorage.setItem(`alkong:name:${accountId}`,name);this.active=true;listener.subscription.unsubscribe();resolve();}
    catch(err){status.textContent=err instanceof Error?err.message:'방을 찾지 못했어요.';}finally{find.disabled=false;}
   };
  });
 }
 mountEmailLink(host:HTMLElement){
  host.innerHTML='<fieldset class="sound-settings email-link"><legend>이메일 연동</legend><p class="email-link-status" role="status">계정 확인 중…</p><form hidden><p>이메일을 인증하면 지금의 펫·알·진행 기록을 다른 기기에서도 이어갈 수 있어요.</p><label>연동할 이메일<input type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label><button type="submit" class="secondary">인증 메일 받기</button></form><div class="email-link-code" hidden><p>메일의 인증 링크를 누르세요. 코드가 있다면 아래에 입력해도 돼요.</p><form><label>인증 코드<input inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" maxlength="8" required></label><button type="submit" class="secondary">코드 확인</button></form></div><button type="button" class="secondary email-link-check">연동 상태 확인</button></fieldset>';
  const field=host.querySelector('fieldset')!,status=host.querySelector<HTMLElement>('.email-link-status')!,form=host.querySelector<HTMLFormElement>('form')!,email=form.querySelector('input')!,send=form.querySelector('button')!,codeBox=host.querySelector<HTMLElement>('.email-link-code')!,codeForm=codeBox.querySelector('form')!,code=codeForm.querySelector('input')!,check=host.querySelector<HTMLButtonElement>('.email-link-check')!;
  let pendingEmail='';
  const account=async()=>{
   const {data,error}=await this.client.auth.getUser();if(error)throw error;
   if(!data.user||data.user.id!==this.playerAccountId)throw Error('현재 플레이 계정과 로그인 계정이 달라요. 게임을 다시 열어 주세요.');
   return data.user;
  };
  const refresh=async()=>{
   const user=await account();
   const linked=!user.is_anonymous&&!!user.email_confirmed_at&&!!user.email;
   form.hidden=codeBox.hidden=linked;
   if(linked){
    status.textContent=`연동 완료 · ${user.email}\n다음 로그인부터 이 이메일을 사용하세요. 기존 기록은 그대로 유지돼요.`;
    check.hidden=true;
    const {error}=await this.client.auth.refreshSession();if(error)throw error;
    return true;
   }
   pendingEmail=user.new_email??'';
   if(pendingEmail)email.value=pendingEmail;
   codeBox.hidden=!pendingEmail;send.textContent=pendingEmail?'인증 메일 다시 받기':'인증 메일 받기';
   status.textContent=pendingEmail?'이메일 인증을 기다리고 있어요. 인증 후 연동 상태 확인을 눌러 주세요.':'게스트 계정 · 이메일을 연동해 기록을 보관하세요.';
   return false;
  };
  const run=async(action:()=>Promise<unknown>)=>{
   if(this.emailLinkBusy){status.textContent='이전 요청을 처리하고 있어요. 잠시 후 다시 눌러 주세요.';return;}
   this.emailLinkBusy=true;field.disabled=true;
   try{await action();}
   catch(err){
    const failure=err as {code?:string;message?:string};
    const messages:Record<string,string>={email_exists:'이미 다른 계정에 연결된 이메일이에요. 다른 이메일을 사용해 주세요.',user_already_exists:'이미 사용 중인 이메일이에요. 다른 이메일을 사용해 주세요.',otp_expired:'인증 코드가 만료됐거나 올바르지 않아요. 메일을 다시 받아 주세요.',over_email_send_rate_limit:'메일 요청이 많아요. 잠시 후 다시 시도해 주세요.',over_request_rate_limit:'요청이 많아요. 잠시 후 다시 시도해 주세요.',manual_linking_disabled:'이메일 연동이 아직 서버에서 활성화되지 않았어요.',email_address_not_authorized:'현재 메일 발송 설정에서 이 주소로 보낼 수 없어요.'};
    status.textContent=messages[failure.code??'']??failure.message??'연동하지 못했어요. 연결을 확인하고 다시 시도해 주세요.';
   }finally{field.disabled=false;this.emailLinkBusy=false;}
  };
  form.onsubmit=event=>{event.preventDefault();void run(async()=>{
   const user=await account();if(!user.is_anonymous&&user.email_confirmed_at){await refresh();return;}
   if(Date.now()-this.emailLinkSentAt<60000)throw Error('인증 메일은 1분 뒤에 다시 받을 수 있어요.');
   const address=email.value.trim();
   const {data,error}=await this.client.auth.updateUser({email:address},{emailRedirectTo:'https://juyounginpark.github.io/egghunts/'});if(error)throw error;
   if(data.user.id!==this.playerAccountId)throw Error('계정이 변경됐어요. 게임을 다시 열어 주세요.');
   this.emailLinkSentAt=Date.now();pendingEmail=address;code.value='';
   if(!await refresh()){pendingEmail=address;codeBox.hidden=false;send.textContent='인증 메일 다시 받기';status.textContent='인증 메일을 보냈어요. 메일함과 스팸함을 확인해 주세요.';}
  });};
  codeForm.onsubmit=event=>{event.preventDefault();void run(async()=>{
   const user=await account();if(!user.is_anonymous&&user.email_confirmed_at){await refresh();return;}
   const address=user.new_email||pendingEmail;if(!address)throw Error('먼저 인증 메일을 받아 주세요.');
   const {data,error}=await this.client.auth.verifyOtp({email:address,token:code.value.trim(),type:'email_change'});if(error)throw error;
   if(data.user&&data.user.id!==this.playerAccountId)throw Error('계정이 변경됐어요. 게임을 다시 열어 주세요.');
   await refresh();
  });};
  check.onclick=()=>{void run(refresh);};
  void run(refresh);
 }
 attach(game:GameState){
  this.game=game;if(this.latest)this.apply(this.latest);
  // Network cadence is independent of animation frames and input handlers.
  this.syncTimer??=window.setInterval(()=>this.pump(),50);
 }
 private apply(state:Snapshot,acknowledgedInput?:{x:number;z:number},acknowledgedRevision?:number){
  this.latest=state;this.peers=state.peers;this.syncClock(state.serverTime+this.roundTrip/2);
  this.receivedAt=performance.now();
  if(this.game){
   const g=this.game,settings=g.save.settings,offset=this.visualOffset,old={x:g.x+offset.x,z:g.z+offset.z,death:!!g.death,training:g.training,night:g.isNight,hit:g.hitAt,slot:g.farmSlot,facing:g.facing,velocity:g.velocity};
   restoreRuntime(g,state.runtime,state.world,state.bosses,false);g.save.settings=settings;g.events.push(...state.events);
   g.roomSnapshotTime=state.serverTime/1000;
   const stable=old.death===!!g.death&&old.training===g.training&&old.night===g.isNight&&old.hit===g.hitAt&&old.slot===g.farmSlot&&!g.launch&&!g.knockback.remaining;
   if(stable&&!g.death&&!g.training&&g.now()>=g.knockedUntil){
    const lead=this.predictionLead;
    const speed=this.vector.slow?Math.min(BALANCE.slowWalkSpeed,g.movementSpeed):g.movementSpeed;
    if(Math.hypot(this.vector.x,this.vector.z)>.01)g.push(this.vector.x*speed*lead,this.vector.z*speed*lead);
    g.facing=old.facing;g.velocity=old.velocity;
   }
   // Correct the simulation once; ease only the drawn position, never the input velocity.
   const continuous=stable&&Math.hypot(old.x-g.x,old.z-g.z)<Math.max(6,g.movementSpeed*2);
   this.visualOffset=continuous?{x:old.x-g.x,z:old.z-g.z}:{x:0,z:0};
   const idle=Math.hypot(this.vector.x,this.vector.z)<.01;
   const currentStop=idle&&acknowledgedRevision===this.inputRevision&&acknowledgedInput&&Math.hypot(acknowledgedInput.x,acknowledgedInput.z)<.01;
   if(!continuous)this.idleAcknowledgedRevision=-1;
   else if(currentStop){
    // Keep the release position through the first stop acknowledgement. Later
    // idle packets retain that offset, so server-driven motion (wind, etc.) still shows.
    if(this.idleAcknowledgedRevision===this.inputRevision)this.visualOffset=offset;
    this.idleAcknowledgedRevision=this.inputRevision;
   }
   // Presentation must stay inside the shared interaction tolerance. Keeping a
   // large release offset indefinitely made nearby eggs unreachable on the server.
   const offsetLength=Math.hypot(this.visualOffset.x,this.visualOffset.z);
   if(offsetLength>BALANCE.roomVisualOffsetMax){
    const scale=BALANCE.roomVisualOffsetMax/offsetLength;
    this.visualOffset.x*=scale;this.visualOffset.z*=scale;
   }
  }
  for(const error of state.errors)this.notify(error==='CHAT_COOLDOWN'?'잠깐 기다렸다 보내주세요.':error==='INVALID_CHAT'?`메시지는 ${BALANCE.chatMaxLength}자 이내로 입력해 주세요.`:errorText[error]??'지금은 사용할 수 없어요.');
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
  const distance=Math.hypot(this.visualOffset.x,this.visualOffset.z),moving=Math.hypot(this.vector.x,this.vector.z)>.01;
  const speed=this.vector.slow?Math.min(BALANCE.slowWalkSpeed,this.game.movementSpeed):this.game.movementSpeed;
  // A late packet must not briefly accelerate or reverse an otherwise steady walk.
  // Network error is corrected during the next walk, never as unsolicited
  // movement after release. Authoritative collisions/rewards remain at game.x/z.
  const amount=moving?Math.min(distance*(1-Math.exp(-dt*3)),speed*BALANCE.roomMovingCorrectionRatio*dt):0;
  const decay=distance>0?1-amount/distance:0;this.visualOffset.x*=decay;this.visualOffset.z*=decay;
  // Only predict knockback motion here; rewards, damage and drops stay on the server.
  if(this.game.knockback.remaining>0){const k=this.game.knockback,step=Math.min(dt,k.remaining);this.game.push(k.x*step,k.z*step);k.remaining=Math.max(0,k.remaining-step);return;}
 }
 update(x:number,z:number,slow=false){
  const wasStopped=Math.hypot(this.vector.x,this.vector.z)<.01,stopped=Math.hypot(x,z)<.01;
  const length=Math.max(1,Math.hypot(x,z));this.vector={x:x/length,z:z/length,slow};
  if(wasStopped!==stopped){
   // Gameplay clock is deliberately slewed after login; input timestamps need
   // the latest network anchor instead of that potentially stale offset.
   this.inputAt=this.latest?this.latest.serverTime+this.roundTrip/2+performance.now()-this.receivedAt:0;
   this.inputRevision++;this.idleAcknowledgedRevision=-1;
   if(stopped&&this.game)this.game.velocity={x:0,z:0};
   this.lastSent=Math.min(this.lastSent,performance.now()-BALANCE.roomSyncMs);
   this.pump();
  }
  else if(slow!==this.lastInput.slow||Math.hypot(this.vector.x-this.lastInput.x,this.vector.z-this.lastInput.z)>.25){
   // Prioritize turns without turning every analog jitter into a database tick.
   this.lastSent=Math.min(this.lastSent,performance.now()-BALANCE.roomSyncMs+50);
   this.pump();
  }
 }
 private pump(){
  if(this.leaving||!this.active||this.busy||performance.now()<this.retryAt)return;
  if(!this.queue.length&&performance.now()-this.lastSent<BALANCE.roomSyncMs)return;
  void this.flush().catch(()=>{});
 }
 private flush():Promise<void>{
  if(this.busy)return this.busy;
  const work=async()=>{
   this.lastSent=performance.now();
   this.pending??={operation:'update',id:crypto.randomUUID(),input:this.vector,inputAt:this.inputAt,inputRevision:this.inputRevision,commands:this.queue.splice(0,16)};
   this.lastInput={...this.pending.input,slow:this.pending.input.slow===true};
   const {data,error}=await this.client.auth.getSession();if(error||!data.session)throw Error('다시 로그인해 주세요.');
   if(this.playerAccountId&&data.session.user.id!==this.playerAccountId)throw Error('로그인 계정이 변경됐어요. 게임을 다시 열어 주세요.');
   let session=data.session;
   this.accessToken=session.access_token;
   for(let attempt=0;attempt<4;attempt++){
    if(this.leaving)return;
    const started=performance.now();
    const response=await this.requestState(this.pending!,session.access_token);
    const state=await response.json();
    if(this.leaving)return;
    if(response.ok){
     this.roundTrip=performance.now()-started;
     const lead=Math.min(.5,this.roundTrip/2000);this.predictionLead=this.predictionLead?this.predictionLead+(lead-this.predictionLead)*.15:lead;
     const commands=this.pending!.commands,acknowledgedInput=this.pending!.input,acknowledgedRevision=this.pending!.inputRevision;
     this.pending=null;this.connected=true;this.lastError='';this.apply(state,acknowledgedInput,acknowledgedRevision);
     if(acknowledgedInput.x!==this.vector.x||acknowledgedInput.z!==this.vector.z||!!acknowledgedInput.slow!==this.vector.slow)this.lastSent=performance.now()-BALANCE.roomSyncMs;
     for(const command of commands){
      const result=state.commandResults?.find((r:{id:string;error:string|null})=>r.id===command.id);
      this.completions.get(command.id)?.(result?!result.error:!state.errors.length);this.completions.delete(command.id);
     }
     return;
    }
    if(attempt===0&&response.status===401){const refreshed=await this.client.auth.refreshSession();if(!refreshed.error&&refreshed.data.session){session=refreshed.data.session;this.accessToken=session.access_token;continue;}}
    if(state.error==='ROOM_EXPIRED')this.pending={...this.pending!,operation:'join'};
    if(attempt<3&&['ROOM_EXPIRED','RETRY','RATE_LIMIT'].includes(state.error)){
     await new Promise(resolve=>setTimeout(resolve,100+Math.random()*150));continue;
    }
    console.warn('Room request failed',response.status,state.error??state.code??'UNKNOWN');
    throw Error(errorText[state.error]??(['RETRY','RATE_LIMIT'].includes(state.error)?'방 동기화가 지연되고 있어요. 다시 연결할게요.':`서버 응답 오류 (${response.status}). 다시 연결할게요.`));
   }
  };
  this.busy=work().catch(error=>{this.connected=false;this.retryAt=performance.now()+1500;const message=error instanceof Error?error.message:'연결이 끊겼어요.';if(this.active&&this.lastError!==message){this.notify(message);this.lastError=message;}throw error;}).finally(()=>{this.busy=null;this.pump();});
  return this.busy;
 }
}
