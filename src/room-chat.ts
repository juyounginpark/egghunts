import {BALANCE} from './data';
import {uiIcon} from './ui-icons';
import type {ChatMessage,Peer} from './multiplayer';

export class RoomChat{
 private host=document.createElement('div');
 private input:HTMLInputElement;
 private form:HTMLFormElement;
 private toggle:HTMLButtonElement;
 private sending=false;
 private log=document.createElement('div');
 private lastMessages=new Map<string,string>();
 private logVisibleUntil=0;
 constructor(parent:HTMLElement,private stop:()=>void,send:(text:string)=>Promise<boolean>){
  this.host.id='room-chat';this.host.hidden=true;
  this.host.innerHTML=`<button type="button" class="icon-btn" aria-label="채팅 열기" aria-expanded="false">${uiIcon('chat')}</button><form hidden><input aria-label="같은 방에 메시지 보내기" placeholder="메시지…" maxlength="${BALANCE.chatMaxLength}" autocomplete="off"/><button type="submit" aria-label="보내기">↑</button><button type="button" class="chat-close" aria-label="닫기">×</button></form>`;
  parent.append(this.host);this.input=this.host.querySelector('input')!;this.form=this.host.querySelector('form')!;this.toggle=this.host.querySelector('button')!;
  this.log.id='room-chat-log';this.log.setAttribute('role','log');this.log.setAttribute('aria-label','채팅 로그');this.log.setAttribute('aria-live','polite');this.log.setAttribute('aria-relevant','additions');this.log.tabIndex=0;this.log.dataset.empty='true';this.host.append(this.log);
  this.log.addEventListener('pointerdown',event=>{event.stopPropagation();this.stop();});
  this.log.hidden=true;
  this.toggle.onclick=()=>{this.stop();this.form.hidden=false;this.updateLogVisibility();this.log.scrollTop=this.log.scrollHeight;this.host.classList.add('composing');this.toggle.hidden=true;this.toggle.setAttribute('aria-expanded','true');this.input.focus();};
  this.host.querySelector<HTMLButtonElement>('.chat-close')!.onclick=()=>this.close();
  this.input.addEventListener('focus',()=>this.stop());
  this.input.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();this.close();}if(event.key==='Enter'&&event.isComposing)event.preventDefault();});
  this.form.onsubmit=async event=>{
   event.preventDefault();const text=this.input.value.trim();if(!text||this.sending)return;
   this.sending=true;const button=this.form.querySelector<HTMLButtonElement>('[type=submit]')!;button.disabled=true;
   try{if(await send(text)){this.input.value='';this.close();}}
   finally{this.sending=false;button.disabled=false;}
  };
 }
 get active(){return !this.host.hidden&&!this.form.hidden;}
 private updateLogVisibility(){this.log.hidden=this.form.hidden&&performance.now()>=this.logVisibleUntil;}
 close(){this.form.hidden=true;this.updateLogVisibility();this.host.classList.remove('composing');this.input.blur();this.toggle.hidden=false;this.toggle.setAttribute('aria-expanded','false');}
 update(connected:boolean,name:string,chat:ChatMessage|null|undefined,peers:Peer[]){
  if(!connected){if(this.lastMessages.size){this.lastMessages.clear();this.log.replaceChildren();this.log.dataset.empty='true';}this.logVisibleUntil=0;this.log.hidden=true;return;}
  const players=[{id:'self',name,chat},...peers].filter(p=>p.chat).sort((a,b)=>a.chat!.at-b.chat!.at);
  const follow=this.log.hidden||this.log.scrollHeight-this.log.scrollTop-this.log.clientHeight<24;
  let added=false;
  for(const p of players){
   const message=p.chat!;if(this.lastMessages.get(p.id)===message.id)continue;
   this.lastMessages.set(p.id,message.id);
   const row=document.createElement('div'),sender=document.createElement('b'),text=document.createElement('span');
   sender.textContent=`${p.name}${p.id==='self'?' (나)':''}: `;text.textContent=message.text;row.append(sender,text);this.log.append(row);added=true;
   while(this.log.childElementCount>50)this.log.firstElementChild!.remove();
  }
  if(added){this.log.dataset.empty='false';this.logVisibleUntil=performance.now()+5000;}
  this.updateLogVisibility();
  if(added&&follow)this.log.scrollTop=this.log.scrollHeight;
 }
 show(visible:boolean){if(!visible&&!this.form.hidden)this.close();this.host.hidden=!visible;}
}
