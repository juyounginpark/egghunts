import {EMOTES,type EmoteId} from './emotes';
import type {PresenceClient} from './presence-client';
import {validRoomCode} from './room-code';
export class FriendsUI{
 private dock=document.createElement('div');private dialog=document.createElement('dialog');private status=document.createElement('p');
 private toggle:HTMLButtonElement;private picker:HTMLElement;
 private inviteRequested=false;
 private pickerTimer:number|undefined;
 constructor(place:HTMLElement,private client:PresenceClient,emote:(id:EmoteId)=>void,private reset:()=>void){
  this.dock.id='emote-dock';
  this.dock.innerHTML='<button id="emote-toggle" type="button" aria-label="이모티콘" aria-expanded="false" aria-controls="emote-picker"><span aria-hidden="true">💬</span></button><div id="emote-picker" class="emote-buttons" role="group" aria-label="이모티콘 선택" hidden></div>';
  place.querySelector('#controls')!.append(this.dock);
  this.toggle=this.dock.querySelector('button')!;this.picker=this.dock.querySelector<HTMLElement>('.emote-buttons')!;
  for(const e of EMOTES){const b=document.createElement('button');b.type='button';b.textContent=e.icon;b.title=e.label;b.setAttribute('aria-label',e.label);b.dataset.emote=e.id;b.onclick=()=>{emote(e.id);this.setPicker(false);this.toggle.focus();};this.picker.append(b);}
  this.toggle.onclick=()=>{this.reset();this.setPicker(this.picker.hidden);};
  document.addEventListener('pointerdown',e=>{if(!this.dock.contains(e.target as Node))this.setPicker(false);});
  this.dock.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();this.setPicker(false);this.toggle.focus();}});
  this.dialog.id='friends-dialog';this.dialog.setAttribute('aria-labelledby','friends-title');
  this.dialog.innerHTML='<header><h2 id="friends-title">친구랑 플레이</h2><button id="friend-close" type="button" aria-label="닫기">×</button></header><button id="invite-generate" type="button" class="primary">초대 코드 생성</button><p id="friend-connection" role="status" hidden></p><form id="friend-form"><label for="friend-code">받은 초대 코드</label><div class="friend-code-row"><input id="friend-code" type="text" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" required aria-label="받은 초대 코드"><button id="friend-join" type="submit" class="secondary">입장</button></div></form>';
  this.status.setAttribute('role','status');this.status.hidden=true;this.dialog.querySelector('header')!.after(this.status);place.append(this.dialog);
  this.dialog.querySelector('#friend-close')!.addEventListener('click',()=>this.dialog.close());
  this.dialog.querySelector('#invite-generate')!.addEventListener('click',()=>{this.inviteRequested=true;this.client.login();this.update(!this.dock.hidden);});
  this.dialog.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();const input=this.dialog.querySelector<HTMLInputElement>('input')!,code=input.value.trim().toUpperCase();if(!validRoomCode(code)){input.setCustomValidity('초대 코드를 확인해 주세요.');input.reportValidity();return;}input.setCustomValidity('');this.inviteRequested=false;this.client.login(code);this.update(!this.dock.hidden);});
  this.dialog.querySelector('input')!.addEventListener('input',e=>(e.target as HTMLInputElement).setCustomValidity(''));
  this.dialog.insertAdjacentHTML('beforeend','<div id="invite-actions" hidden><button id="invite-copy" type="button" class="secondary">코드 복사</button><button id="friend-disconnect" type="button" class="secondary">방 나가기</button></div>');
  this.dialog.querySelector<HTMLButtonElement>('#invite-copy')!.onclick=async()=>{try{await navigator.clipboard.writeText(this.client.code);this.dialog.querySelector('#invite-copy')!.textContent='복사했어요';}catch{this.status.textContent=`초대 코드 ${this.client.code} · 복사할 수 없어요. 코드를 직접 전달해 주세요.`;}};
  this.dialog.querySelector<HTMLButtonElement>('#friend-disconnect')!.onclick=()=>{this.client.logout();this.inviteRequested=false;this.update(!this.dock.hidden);};
  document.addEventListener('hud-collapse',()=>this.closePicker());
 }
 private setPicker(open:boolean){clearTimeout(this.pickerTimer);this.picker.hidden=!open;this.toggle.setAttribute('aria-expanded',String(open));if(open)this.pickerTimer=window.setTimeout(()=>this.closePicker(),8000);}
 closePicker(){this.setPicker(false);}
 open(){this.reset();this.setPicker(false);this.update(!this.dock.hidden);this.dialog.showModal();}
 get active(){return this.dialog.open;}
 update(visible:boolean){
  this.dock.hidden=!visible;if(!visible)this.setPicker(false);
  const issued=this.client.connected,pending=['connecting','reconnecting'].includes(this.client.connection);
  this.status.textContent=issued?`초대 코드 ${this.client.code}`:'';this.status.hidden=!issued;
  const connection=this.dialog.querySelector<HTMLElement>('#friend-connection')!;
  connection.textContent=pending?(this.inviteRequested?'초대 코드 생성 중…':'친구와 연결 중…'):this.client.connected?(issued?'이 코드를 받은 친구가 입장할 수 있어요.':'친구와 연결됐어요.'):'';connection.hidden=!connection.textContent;
  const generate=this.dialog.querySelector<HTMLButtonElement>('#invite-generate')!;generate.hidden=issued;generate.disabled=pending;
  this.dialog.querySelector<HTMLButtonElement>('#friend-join')!.disabled=pending;
  this.dialog.querySelector<HTMLElement>('#invite-actions')!.hidden=!this.client.connected;
 }
}
