import {BALANCE} from './data';
import {uiIcon} from './ui-icons';

export class RoomChat{
 private host=document.createElement('div');
 private input:HTMLInputElement;
 private form:HTMLFormElement;
 private toggle:HTMLButtonElement;
 private sending=false;
 constructor(parent:HTMLElement,private stop:()=>void,send:(text:string)=>Promise<boolean>){
  this.host.id='room-chat';this.host.hidden=true;
  this.host.innerHTML=`<button type="button" class="icon-btn" aria-label="채팅 열기" aria-expanded="false">${uiIcon('chat')}</button><form hidden><input aria-label="같은 방에 메시지 보내기" placeholder="메시지…" maxlength="${BALANCE.chatMaxLength}" autocomplete="off"/><button type="submit" aria-label="보내기">↑</button><button type="button" class="chat-close" aria-label="닫기">×</button></form>`;
  parent.append(this.host);this.input=this.host.querySelector('input')!;this.form=this.host.querySelector('form')!;this.toggle=this.host.querySelector('button')!;
  this.toggle.onclick=()=>{this.stop();this.form.hidden=false;this.toggle.hidden=true;this.toggle.setAttribute('aria-expanded','true');this.input.focus();};
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
 close(){this.form.hidden=true;this.input.blur();this.toggle.hidden=false;this.toggle.setAttribute('aria-expanded','false');}
 show(visible:boolean){if(!visible&&!this.form.hidden)this.close();this.host.hidden=!visible;}
}
