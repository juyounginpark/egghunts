import {ExplorerEditor,EXPLORER_STEPS} from './explorer-editor';
import {explorerNameError,normalizeAppearance,randomExplorerName,type ExplorerAppearance} from './explorer-appearance';
import type {Save} from './game';
import {loadingIndicator} from './loading-ui';
export type StartChoice={name:string;mode:'local'|'friends';appearance:ExplorerAppearance;createdAt:number};
type EntryAccount={profile:()=>Save;sendCode:(email:string)=>Promise<void>;verifyCode:(email:string,code:string)=>Promise<void>};

/** New profiles are created before the world is exposed; returning saves skip onboarding. */
export class StartScreen{
 private busy=false;private editor:ExplorerEditor|null=null;private name='';private appearance:ExplorerAppearance;private step='account';private email='';
 constructor(private root:HTMLElement,private account:EntryAccount,private enter:(choice:StartChoice)=>Promise<void>,private entered:(choice:StartChoice)=>void=()=>{}){
  const save=account.profile();this.name=save.playerName??'';this.appearance=normalizeAppearance(save.explorerAppearance,save.appearance);
  this.step=save.explorerCreatedAt?'ready':'account';root.classList.add('start-screen');root.setAttribute('aria-labelledby','start-title');this.render();
 }
 private go(step:string){this.step=step;this.render();}
 private render(){
  this.editor?.dispose();this.editor=null;
  this.root.innerHTML=`<div class="start-card"><h1 id="start-title">알콩원정대</h1><div id="entry-content"></div><div id="start-status" hidden>${loadingIndicator}</div><p id="start-error" role="alert" hidden></p></div>`;
  this.root.classList.toggle('creating-explorer',['customize','preview'].includes(this.step));
  const content=this.root.querySelector<HTMLElement>('#entry-content')!;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)content.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
  const button=(id:string,fn:()=>void)=>content.querySelector<HTMLButtonElement>('#'+id)!.onclick=fn;
  if(this.step==='account'){
   content.innerHTML='<div id="start-options"><button id="guest-start" class="primary">게스트 시작</button><button id="entry-login" class="secondary">로그인</button></div>';
   button('guest-start',()=>this.go('name'));button('entry-login',()=>this.go('login'));
  }else if(this.step==='login'){
   content.innerHTML='<h2>이메일 로그인</h2><form id="entry-auth"><label for="entry-email">이메일</label><input id="entry-email" type="email" autocomplete="email" required><button class="primary" type="submit">로그인 메일 받기</button></form><button id="entry-back" class="secondary">뒤로</button>';
   const email=content.querySelector<HTMLInputElement>('input')!;email.value=this.email;
   content.querySelector<HTMLFormElement>('form')!.onsubmit=e=>{e.preventDefault();void this.run(async()=>{this.email=email.value.trim();await this.account.sendCode(this.email);this.go('verify');});};button('entry-back',()=>this.go(this.account.profile().explorerCreatedAt?'ready':'account'));
  }else if(this.step==='verify'){
   content.innerHTML='<h2>인증 코드를 입력해 주세요</h2><p class="start-subtitle">이메일의 로그인 링크를 열어 주세요. 인증 코드가 함께 왔다면 여기 입력해도 됩니다.</p><form id="entry-auth"><label for="entry-code">인증 코드</label><input id="entry-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" maxlength="8" required><button type="submit" class="primary">로그인</button></form><button id="entry-back" class="secondary">다른 이메일 사용</button>';
   content.querySelector<HTMLFormElement>('form')!.onsubmit=e=>{e.preventDefault();const code=content.querySelector<HTMLInputElement>('input')!.value;void this.run(async()=>{await this.account.verifyCode(this.email,code);const s=this.account.profile();this.name=s.playerName??'';this.appearance=normalizeAppearance(s.explorerAppearance,s.appearance);this.go(s.explorerCreatedAt?'ready':'name');});};button('entry-back',()=>this.go('login'));
  }else if(this.step==='name'||this.step==='ready'){
   const ready=this.step==='ready';
   content.innerHTML=`<h2>${ready?'다시 만나 반가워요!':'당신의 탐험가는 어떤 이름인가요?'}</h2><form id="start-form"><label class="sr-only" for="start-name">탐험가 이름</label><input id="start-name" maxlength="12" autocomplete="nickname" spellcheck="false" required aria-describedby="start-name-help"><small id="start-name-help">한글·영문·숫자 2~12자</small><button id="random-name" type="button" class="secondary">랜덤 이름</button><div id="start-options"><button id="start-local" type="submit" class="primary">${ready?'탐험 시작':'다음 >'}</button>${ready?'<button id="start-friends" type="button" class="secondary">친구랑 플레이</button><button id="entry-customize" type="button" class="secondary">탐험가 꾸미기</button><button id="entry-login" type="button" class="secondary">로그인</button>':''}</div></form>${ready?'':'<button id="entry-back" class="secondary">뒤로</button>'}`;
   const input=content.querySelector<HTMLInputElement>('#start-name')!;input.value=this.name;
   const valid=()=>{input.value=input.value.normalize('NFC').trim();const legacy=ready&&input.value===this.account.profile().playerName;input.setCustomValidity(legacy?'':explorerNameError(input.value));if(!input.reportValidity())return false;this.name=input.value;return true;};
   input.oninput=()=>input.setCustomValidity('');button('random-name',()=>{input.value=randomExplorerName();input.setCustomValidity('');});
   if(!ready){
    const room=document.createElement('div');room.className='entry-name-room preview-only';content.insertBefore(room,content.querySelector('form'));
    this.editor=new ExplorerEditor(room,this.appearance,()=>{},{staged:true});this.editor.showPreview();
   }
   content.querySelector<HTMLFormElement>('form')!.onsubmit=e=>{e.preventDefault();if(valid()){if(ready)void this.begin('local');else this.go('customize');}};
   if(ready){button('entry-login',()=>this.go('login'));button('start-friends',()=>{if(valid())void this.begin('friends');});button('entry-customize',()=>{if(valid())this.go('customize');});}else button('entry-back',()=>this.go('account'));
  }else{
   let stage=this.step==='preview'?4:0;
   content.innerHTML='<small class="entry-step-count"></small><h2 id="entry-stage-title"></h2><p id="explorer-name-preview"></p><div id="explorer-editor"></div><div class="entry-footer"><button id="entry-back" class="secondary">이름 변경</button><button id="entry-next" class="primary">다음 ›</button></div><button id="entry-finish" class="entry-finish" type="button">이 모습으로 완성 보기</button>';
   const profile=this.account.profile();
   this.editor=new ExplorerEditor(content.querySelector('#explorer-editor')!,this.appearance,a=>{this.appearance=a;},{staged:true,stage:profile.highestStage??1});
   const show=()=>{
    const preview=stage===4;this.step=preview?'preview':'customize';
    content.querySelector('#entry-stage-title')!.textContent=preview?'준비됐어!':EXPLORER_STEPS[stage];
    content.querySelector('.entry-step-count')!.textContent=preview?'완성':`${stage+1} / 4 · 나만의 탐험가 만들기`;
    content.querySelector('#explorer-name-preview')!.textContent=preview?`${this.name} · LV.${profile.progression?.level??1} 탐험가`:this.name;
    content.querySelector('#entry-back')!.textContent=preview?'다시 꾸미기':stage===0?'이름 변경':'‹ 이전';
    content.querySelector('#entry-next')!.textContent=preview?'탐험 시작!':stage===3?'완성 보기':'다음 ›';
    content.querySelector<HTMLElement>('#entry-finish')!.hidden=preview;
    if(preview)this.editor!.showPreview();else this.editor!.go(EXPLORER_STEPS[stage]);
   };
   button('entry-back',()=>{if(stage===0){this.go('name');return;}stage--;show();});
   button('entry-next',()=>{if(stage===4){this.editor?.wave();void this.begin('local');}else{stage++;show();}});
   button('entry-finish',()=>{stage=4;show();});show();
  }
 }
 private async run(fn:()=>Promise<void>){
  if(this.busy)return;this.busy=true;this.root.setAttribute('aria-busy','true');this.root.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);
  this.root.querySelector<HTMLElement>('#start-status')!.hidden=false;
  const error=this.root.querySelector<HTMLElement>('#start-error')!;error.hidden=true;
  try{await fn();}catch(reason){console.warn('Explorer entry',reason);const target=this.root.querySelector<HTMLElement>('#start-error')!;target.textContent='완료하지 못했어요. 잠시 후 다시 시도해 주세요.';target.hidden=false;}
  finally{this.busy=false;this.root.removeAttribute('aria-busy');this.root.querySelector<HTMLElement>('#start-status')!.hidden=true;this.root.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=false);}
 }
 private async begin(mode:'local'|'friends'){
  const choice={name:this.name,mode,appearance:this.appearance,createdAt:this.account.profile().explorerCreatedAt??Date.now()};
  await this.run(async()=>{await this.enter(choice);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)await this.root.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out'}).finished;this.editor?.dispose();this.root.hidden=true;this.entered(choice);});
 }
}
