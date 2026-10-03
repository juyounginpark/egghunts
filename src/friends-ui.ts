import {EMOTES,type EmoteId} from './emotes';
import type {PresenceClient} from './presence-client';
export class FriendsUI{
 private dock=document.createElement('div');private dialog=document.createElement('dialog');private status=document.createElement('small');
 constructor(place:HTMLElement,private client:PresenceClient,emote:(id:EmoteId)=>void,reset:()=>void){
  this.dock.id='friends-dock';this.dock.innerHTML='<button id="friends-open" class="secondary">친구와 플레이</button><div class="emote-buttons"></div>';this.dock.append(this.status);place.append(this.dock);
  const buttons=this.dock.querySelector('.emote-buttons')!;for(const e of EMOTES){const b=document.createElement('button');b.textContent=e.icon;b.title=e.label;b.setAttribute('aria-label',e.label);b.dataset.emote=e.id;b.onclick=()=>emote(e.id);buttons.append(b);}
  this.dialog.id='friends-dialog';this.dialog.innerHTML='<h2>친구와 플레이</h2><p>혼자 모험의 동료는 시뮬레이션 모험가예요.<br>방 코드를 공유하면 실제 친구가 합류해요.</p><button id="friend-create" class="primary">방 만들기</button><p>또는</p><label>방 코드 <input id="friend-code" maxlength="5" placeholder="K7D2F" autocomplete="off" autocapitalize="characters"></label><button id="friend-join" class="primary">입장</button><button id="friend-leave" class="secondary">친구 방 나가기</button><button id="friend-close" class="secondary">닫기</button>';place.append(this.dialog);
  this.dock.querySelector('button')!.onclick=()=>{reset();this.dialog.showModal();this.dialog.querySelector<HTMLInputElement>('input')!.focus();};
  this.dialog.querySelector('#friend-close')!.addEventListener('click',()=>this.dialog.close());
  this.dialog.querySelector('#friend-create')!.addEventListener('click',()=>{this.client.login();this.dialog.close();});
  this.dialog.querySelector('#friend-join')!.addEventListener('click',()=>{const input=this.dialog.querySelector<HTMLInputElement>('input')!,code=input.value.trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{5}$/.test(code)){input.setCustomValidity('5자리 방 코드를 입력해 주세요.');input.reportValidity();return;}input.setCustomValidity('');this.client.login(code);this.dialog.close();});
  this.dialog.querySelector('input')!.addEventListener('input',e=>(e.target as HTMLInputElement).setCustomValidity(''));
  this.dialog.querySelector('#friend-leave')!.addEventListener('click',()=>{this.client.logout();this.dialog.close();});
 }
 get active(){return this.dialog.open;}
 update(visible:boolean){this.dock.hidden=!visible;this.status.textContent=this.client.connected?`친구 방 ${this.client.code}`:this.client.connection==='reconnecting'?'친구 연결 복구 중 · 모험은 계속돼요':this.client.connection==='connecting'?'친구 방에 연결 중':'';this.dialog.querySelector<HTMLElement>('#friend-leave')!.hidden=this.client.connection==='disconnected';}
}
