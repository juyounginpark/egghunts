import type {SupabaseClient,Session} from '@supabase/supabase-js';
import {LocalSaveStore,migrateLegacyProfile,type LocalProfile} from './local-save';
import {TrustedClock} from './trusted-clock';
import {freshSave,type Save} from './game';
import {LOCAL_FIRST,BALANCE} from './data';
type CloudProfile={profile:unknown;revision:number;updatedAt:number};
export const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL||'https://leblcdiqsyxqzwlsnkio.supabase.co';
const PUBLIC_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_2KTon_WzPAci5G4dLyZ5Ww_bPgwmiig';
export class CloudSave{
 readonly store=new LocalSaveStore();
 clock=new TrustedClock();
 record!:LocalProfile;
 conflict:CloudProfile|null=null;
 status='기기 저장';
 private client:SupabaseClient|null=null;
 private session:Session|null=null;
 private busy=false;
 private timer:number|undefined;
 private key='guest';
 private initial='';
 private generation=0;
 private syncedGeneration=0;
 constructor(private snapshot:()=>Save,private apply:(save:Save)=>void,private notify:(message:string)=>void){}
 async load(legacy:()=>Promise<Save>,qa=false){
  this.key=qa?'qa':localStorage.getItem('alkong:last-account')??'guest';
  const stored=await this.store.read(this.key);
  this.clock=new TrustedClock(stored?.clock);
  const profile=stored?migrateLegacyProfile(stored.profile,this.clock.now()):await legacy();
  this.record=stored?{...stored,profile}:{version:2,profile,revision:0,updatedAt:this.clock.now(),dirty:false,accountId:null};
  this.initial=JSON.stringify(profile);return profile;
 }
 token(){return this.session?.access_token??null;}
 get guest(){return !this.session||this.session.user.is_anonymous===true;}
 async persist(){
  const profile=this.snapshot();
  // snapshot stamps the save; compare the actual payload to avoid clean initial uploads.
  const changed=JSON.stringify({...profile,lastSavedAt:0})!==JSON.stringify({...this.record.profile,lastSavedAt:0});
  if(changed){this.generation++;this.record.dirty=true;}
  this.record={...this.record,profile,updatedAt:this.clock.now(),clock:this.clock.record()};
  await this.store.write(this.key,this.record);
 }
 flush(){
  this.record={...this.record,profile:this.snapshot(),dirty:true,updatedAt:this.clock.now(),clock:this.clock.record()};
  this.generation++;this.store.mirror(this.key,this.record);
  void this.persist();void this.sync();
 }
 async initialize(){
  try{
   const {createClient}=await import('@supabase/supabase-js');
   this.client=createClient(SUPABASE_URL,PUBLIC_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(8000)})}});
   this.client.auth.onAuthStateChange((_event,session)=>{this.session=session;if(session)setTimeout(()=>void this.loadAccount().catch(e=>this.failure(e)),0);});
   const {data}=await this.client.auth.getSession();this.session=data.session;
   if(this.session)await this.loadAccount();
  }catch(e){this.failure(e);}
  this.timer??=window.setInterval(()=>void this.sync(),LOCAL_FIRST.cloudSaveMs);
 }
 private failure(error:unknown){this.status='기기 저장 · 클라우드 연결 대기';console.warn('Cloud save',error);}
 private async rpc(name:string,args:Record<string,unknown>={}){
  if(!this.client)throw Error('로그인을 먼저 해 주세요.');
  const {data,error}=await this.client.rpc(name,args);if(error)throw error;
  if(Number.isFinite(data?.serverTime))this.clock.sync(data.serverTime);
  return data;
 }
 private accountLoading:Promise<void>|null=null;
 private loadAccount(){
  if(this.accountLoading)return this.accountLoading;
  this.accountLoading=this.doLoadAccount().finally(()=>{this.accountLoading=null;});return this.accountLoading;
 }
 private async doLoadAccount(){
  const id=this.session?.user.id;if(!id)return;
  // Save both device and account copies before switching namespaces.
  await this.persist();
  const response=await this.rpc('game_local_load');
  if(this.session?.user.id!==id)return;
  const remote=response.profile as CloudProfile|null;
  if(this.record.accountId!==id){
   await this.store.backup('before-account-switch',this.record);
   const cached=await this.store.read(id);
   this.key=id;localStorage.setItem('alkong:last-account',id);
   if(cached){this.record=cached;this.apply(migrateLegacyProfile(cached.profile,this.clock.now()));}
   else {
    const profile=this.record.accountId?freshSave(this.clock.now()):this.record.profile;
    this.record={...this.record,profile,accountId:id,revision:0};this.apply(profile);
   }
  }
  if(remote&&remote.revision>this.record.revision){
   const p=this.record.profile;
   const fresh=p.eggs.length===0&&!p.mongles.some(n=>n>0)&&Object.values(p.upgrades).every(n=>n===0)&&p.best===0&&p.dust===BALANCE.startingDust;
   const untouched=fresh||JSON.stringify(this.record.profile)===this.initial||!this.record.dirty;
   if(untouched)await this.useCloud(remote);
   else {this.conflict=remote;await this.store.backup('conflict-local',this.record);this.status='클라우드 저장 충돌 · 설정에서 선택';this.notify(this.status);return;}
  }
  if(!remote)this.record.dirty=true;
  await this.store.write(this.key,this.record);this.status='클라우드 연결됨';
 }
 async useCloud(remote=this.conflict){
  if(!remote)return;
  await this.store.backup('before-cloud-load',this.record);
  const profile=migrateLegacyProfile(remote.profile,this.clock.now());
  this.record={version:2,profile,revision:remote.revision,updatedAt:remote.updatedAt,dirty:false,accountId:this.session?.user.id??this.record.accountId,clock:this.clock.record()};
  this.conflict=null;this.initial=JSON.stringify(profile);this.apply(profile);await this.store.write(this.key,this.record);this.status='클라우드 저장 불러옴';
 }
 async keepLocal(){
  if(!this.conflict)return;
  await this.store.backup('conflict-cloud',{...this.record,profile:migrateLegacyProfile(this.conflict.profile,this.clock.now()),revision:this.conflict.revision});
  this.record.revision=this.conflict.revision;this.record.dirty=true;this.conflict=null;await this.persist();await this.sync();
 }
 async restoreLegacy(profile:Save){
  await this.store.backup('before-legacy-restore',this.record);
  this.apply(migrateLegacyProfile(profile,this.clock.now()));this.record.dirty=true;
  await this.persist();this.status='기존 저장 복원됨';
 }
 async sync(){
  if(this.busy||this.conflict||!this.session||this.record.accountId!==this.session.user.id)return;
  this.busy=true;
  try{
   await this.persist();
   if(!this.record.dirty){await this.rpc('game_local_time');return;}
   const generation=this.generation,profile=structuredClone(this.record.profile),accountId=this.record.accountId,key=this.key;
   const result=await this.rpc('game_local_save',{p_profile:profile,p_revision:this.record.revision});
   if(this.record.accountId!==accountId||this.key!==key)return;
   if(result.conflict){this.conflict=result.profile;this.status='클라우드 저장 충돌 · 설정에서 선택';await this.store.backup('conflict-local',this.record);this.notify(this.status);return;}
   this.syncedGeneration=generation;this.record.revision=result.revision;
   this.record.dirty=this.generation!==this.syncedGeneration;this.record.clock=this.clock.record();
   await this.store.write(this.key,this.record);this.status='클라우드 저장됨';
  }catch(e){this.failure(e);}finally{this.busy=false;}
 }
 mountAccount(host:HTMLElement){
  host.innerHTML='<details class="cloud-settings"><summary>클라우드 저장</summary><fieldset class="sound-settings"><legend class="sr-only">클라우드 저장</legend><p role="status"></p><button type="button" data-account="guest" class="secondary">게스트 계정 연결</button><button type="button" data-account="sync" class="secondary">지금 저장</button><button type="button" data-account="cloud" class="secondary" hidden>클라우드 저장 선택</button><button type="button" data-account="local" class="secondary" hidden>현재 기기 저장 선택</button></fieldset></details>';
  const status=host.querySelector('p')!;host.querySelector('details')!.open=!!this.conflict;
  const update=()=>{status.textContent=this.status;host.querySelectorAll<HTMLButtonElement>('[data-account="cloud"],[data-account="local"]').forEach(b=>b.hidden=!this.conflict);};update();
  const run=async(fn:()=>Promise<unknown>)=>{try{await fn();}catch(e){status.textContent=e instanceof Error?e.message:'계정 연결 실패';return;}update();};
  host.querySelector<HTMLButtonElement>('[data-account="guest"]')!.onclick=()=>void run(async()=>{if(!this.client)await this.initialize();if(!this.client)throw Error('인증 연결 실패');const {error}=await this.client.auth.signInAnonymously();if(error)throw error;await this.loadAccount();});
  host.querySelector<HTMLButtonElement>('[data-account="sync"]')!.onclick=()=>void run(()=>this.sync());
  host.querySelector<HTMLButtonElement>('[data-account="cloud"]')!.onclick=()=>void run(()=>this.useCloud());
  host.querySelector<HTMLButtonElement>('[data-account="local"]')!.onclick=()=>void run(()=>this.keepLocal());
 }
}
