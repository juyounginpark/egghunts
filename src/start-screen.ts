export type StartChoice={name:string;mode:'local'|'friends'};

/** The world and its pre-simulated actors are prepared behind this entry scene. */
export class StartScreen{
 private busy=false;
 constructor(private root:HTMLElement,name:string,private enter:(choice:StartChoice)=>Promise<void>,private entered:(choice:StartChoice)=>void=()=>{}){
  root.classList.add('start-screen');root.setAttribute('aria-labelledby','start-title');
  root.innerHTML=`<div class="start-card"><div class="start-mark" aria-hidden="true"><img src="${import.meta.env.BASE_URL}models/egg-0.png" alt="" /></div><h1 id="start-title">알콩원정대</h1><p class="start-subtitle">작은 알에서 시작되는 모험</p><form id="start-form"><label for="start-name">이름</label><input id="start-name" maxlength="10" autocomplete="nickname" spellcheck="false" required aria-describedby="start-name-help"><small id="start-name-help">한글·영문·숫자·밑줄, 최대 10자</small><div id="start-options"><button id="start-local" type="submit" class="primary">서버접속</button><button id="start-friends" type="button" class="secondary">친구랑 플레이</button></div></form><p id="start-status" role="status" hidden></p><p id="start-error" role="alert" hidden></p><button id="start-reload" type="button" hidden>새로고침</button></div>`;
  const form=root.querySelector<HTMLFormElement>('#start-form')!,input=root.querySelector<HTMLInputElement>('#start-name')!;
  input.value=name;
  const validName=()=>{input.value=input.value.normalize('NFC').trim();input.setCustomValidity(/^[\p{L}\p{N}_]{1,10}$/u.test(input.value)?'':'이름을 1~10자로 입력해 주세요.');return input.reportValidity();};
  input.oninput=()=>input.setCustomValidity('');
  form.onsubmit=e=>{e.preventDefault();if(validName())void this.begin({name:input.value,mode:'local'});};
  root.querySelector<HTMLButtonElement>('#start-friends')!.onclick=()=>{if(validName())void this.begin({name:input.value,mode:'friends'});};
  root.querySelector<HTMLButtonElement>('#start-reload')!.onclick=()=>location.reload();
 }
 private async begin(choice:StartChoice){
  if(this.busy)return;this.busy=true;
  const form=this.root.querySelector<HTMLFormElement>('form')!,status=this.root.querySelector<HTMLElement>('#start-status')!,error=this.root.querySelector<HTMLElement>('#start-error')!,reload=this.root.querySelector<HTMLElement>('#start-reload')!;
  form.hidden=true;error.hidden=reload.hidden=true;status.hidden=false;status.textContent='서버 접속중…';this.root.setAttribute('aria-busy','true');
  try{
   await Promise.all([this.enter(choice),new Promise(resolve=>setTimeout(resolve,700))]);
   this.root.hidden=true;this.entered(choice);
  }catch(reason){
   error.textContent=reason instanceof Error?reason.message:'모험을 준비하지 못했어요. 다시 시도해 주세요.';error.hidden=false;reload.hidden=false;form.hidden=false;status.hidden=true;
  }finally{this.busy=false;this.root.removeAttribute('aria-busy');}
 }
}
