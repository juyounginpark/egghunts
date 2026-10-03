import {EMOTES,type EmoteId} from './emotes';
import type {PresenceClient} from './presence-client';
export class FriendsUI{
 private dock=document.createElement('div');private dialog=document.createElement('dialog');private status=document.createElement('p');
 private toggle:HTMLButtonElement;private picker:HTMLElement;
 constructor(place:HTMLElement,private client:PresenceClient,emote:(id:EmoteId)=>void,private reset:()=>void){
  this.dock.id='emote-dock';
  this.dock.innerHTML='<button id="emote-toggle" type="button" aria-label="이모티콘" aria-expanded="false" aria-controls="emote-picker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 3v-3H3V6a2 2 0 0 1 2-2Z"/><path d="M8 10h.01M12 10h.01M16 10h.01" stroke-linecap="round" stroke-width="3"/></svg></button><div id="emote-picker" class="emote-buttons" role="group" aria-label="이모티콘 선택" hidden></div>';
  place.querySelector('#controls')!.append(this.dock);
  this.toggle=this.dock.querySelector('button')!;this.picker=this.dock.querySelector<HTMLElement>('.emote-buttons')!;
  for(const e of EMOTES){const b=document.createElement('button');b.type='button';b.textContent=e.icon;b.title=e.label;b.setAttribute('aria-label',e.label);b.dataset.emote=e.id;b.onclick=()=>{emote(e.id);this.setPicker(false);this.toggle.focus();};this.picker.append(b);}
  this.toggle.onclick=()=>{this.reset();this.setPicker(this.picker.hidden);};
  document.addEventListener('pointerdown',e=>{if(!this.dock.contains(e.target as Node))this.setPicker(false);});
  this.dock.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();this.setPicker(false);this.toggle.focus();}});
  this.dialog.id='friends-dialog';this.dialog.setAttribute('aria-labelledby','friends-title');
  this.dialog.innerHTML='<header><h2 id="friends-title">친구와 플레이</h2><button id="friend-close" type="button" aria-label="닫기">×</button></header><button id="friend-create" class="primary">방 만들기</button><form id="friend-form"><label for="friend-code">방 코드</label><div class="friend-code-row"><input id="friend-code" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" required aria-label="방 코드"><button id="friend-join" type="submit" class="secondary">입장</button></div></form><button id="friend-leave" class="secondary">방 나가기</button><small>혼자 모험의 동료는 AI 모험가예요.</small>';
  this.status.setAttribute('role','status');this.status.hidden=true;this.dialog.querySelector('header')!.after(this.status);place.append(this.dialog);
  this.dialog.querySelector('#friend-close')!.addEventListener('click',()=>this.dialog.close());
  this.dialog.querySelector('#friend-create')!.addEventListener('click',()=>this.client.login());
  this.dialog.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();const input=this.dialog.querySelector<HTMLInputElement>('input')!,code=input.value.trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{5}$/.test(code)){input.setCustomValidity('5자리 방 코드를 입력해 주세요.');input.reportValidity();return;}input.setCustomValidity('');this.client.login(code);});
  this.dialog.querySelector('input')!.addEventListener('input',e=>(e.target as HTMLInputElement).setCustomValidity(''));
  this.dialog.querySelector('#friend-leave')!.addEventListener('click',()=>{this.client.logout();this.dialog.close();});
 }
 private setPicker(open:boolean){this.picker.hidden=!open;this.toggle.setAttribute('aria-expanded',String(open));}
 open(){this.reset();this.setPicker(false);this.dialog.showModal();}
 get active(){return this.dialog.open;}
 update(visible:boolean){
  this.dock.hidden=!visible;if(!visible)this.setPicker(false);
  this.status.textContent=this.client.connected?`방 코드 ${this.client.code}`:this.client.connection==='reconnecting'?'친구와 다시 연결 중…':this.client.connection==='connecting'?'방에 연결 중…':'';
  this.status.hidden=!this.status.textContent;
  const create=this.dialog.querySelector<HTMLButtonElement>('#friend-create')!,join=this.dialog.querySelector<HTMLButtonElement>('#friend-join')!;
  create.hidden=this.client.connected;this.dialog.querySelector('form')!.hidden=this.client.connected;
  create.disabled=join.disabled=this.client.connection!=='disconnected';
  this.dialog.querySelector<HTMLElement>('#friend-leave')!.hidden=this.client.connection==='disconnected';
 }
}
