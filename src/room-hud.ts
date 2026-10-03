import {APPEARANCE_OPTIONS} from './explorer-appearance';
import type {GameState} from './game';
import type {Peer} from './multiplayer';
import {emoteIcon,EMOTE_DURATION,type Emote} from './emotes';
import type {World} from './world';
import {ROUTE_FAR_Z,routeStage,STAGES} from './stage-data';
import {playerLabel} from './player-identity';
import {uiIcon} from './ui-icons';
import {formatNumber} from './format';

const colors=['#567947','#bd794d','#56899d','#9572a8','#a5903e'];
export class RoomHUD{
 private progress=document.createElement('section');
 private labels=document.createElement('div');
 private collapsed=true;
 private heading=document.createElement('span');
 private count=document.createElement('b');
 private rows=new Map<string,{row:HTMLElement;name:HTMLElement;distance:HTMLElement;speed:HTMLElement;label:HTMLElement;caption:HTMLElement;bubble:HTMLElement;farm:HTMLElement}>();
 constructor(place:HTMLElement,worldHost:HTMLElement){
  this.progress.id='room-progress';this.progress.setAttribute('aria-label','탐험 진행도');
  this.progress.setAttribute('role','button');this.progress.tabIndex=0;
  this.heading.className='room-progress-heading';this.progress.append(this.heading);
  const portrait=document.createElement('img');portrait.src=`${import.meta.env.BASE_URL}models/alkong.png`;portrait.alt='';
  this.heading.append(portrait,this.count);
  const toggle=()=>{this.collapsed=!this.collapsed;this.progress.classList.toggle('collapsed',this.collapsed);this.progress.setAttribute('aria-expanded',String(!this.collapsed));};
  this.progress.classList.add('collapsed');this.progress.setAttribute('aria-expanded','false');
  this.progress.onclick=toggle;this.progress.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}};
  document.addEventListener('pointerdown',e=>{if(!this.progress.contains(e.target as Node))this.close();});
  document.addEventListener('hud-collapse',()=>this.close());
  document.addEventListener('keydown',e=>{if(e.key==='Escape')this.close();});
  this.labels.id='player-labels';place.append(this.progress);worldHost.append(this.labels);
 }
 close(){this.collapsed=true;this.progress.classList.add('collapsed');this.progress.setAttribute('aria-expanded','false');}
 update(game:GameState,peers:Peer[],world:World,guest:boolean,visible:boolean,emote?:Emote|null){
  this.progress.hidden=this.labels.hidden=!visible;if(!visible)return;
  const players=[{id:'self',name:game.save.playerName??'탐험가',level:game.level,isGuest:guest,slot:game.farmSlot,explorerAppearance:game.save.explorerAppearance,z:game.z,speed:game.speed,emote},...peers].slice(0,5);
  this.count.textContent=String(players.length);
  this.progress.setAttribute('aria-label',`참가자 ${players.length}명 · ${this.collapsed?'펼치기':'접기'}`);
  for(const [id,entry]of this.rows)if(!players.some(p=>p.id===id)){entry.row.remove();entry.label.remove();entry.farm.remove();this.rows.delete(id);}
  for(const p of players){
   let entry=this.rows.get(p.id);
   if(!entry){
    const row=document.createElement('div'),name=document.createElement('span'),distance=document.createElement('b'),label=document.createElement('div');
    distance.className='room-location';
    const speed=document.createElement('b');speed.className='room-speed';speed.innerHTML=uiIcon('speed')+'<span></span>';
    const caption=document.createElement('span'),bubble=document.createElement('div');
    caption.className='player-caption';bubble.className='player-emote';bubble.hidden=true;label.append(bubble,caption);
    const farm=document.createElement('div');farm.className='farm-owner-label';
    row.className='room-progress-row';label.className='player-nameplate';row.append(name,distance,speed);this.progress.append(row);this.labels.append(label,farm);entry={row,name,distance,speed,label,caption,bubble,farm};this.rows.set(p.id,entry);
   }
   const label=playerLabel(p.name,p.isGuest,p.level??1),meters=Math.max(0,Math.floor(-p.z));
   const stage=routeStage(1,p.z);
   const text=meters<=4?'기지':`${STAGES[stage-1].name} · ${meters}m`;
   if(entry.name.textContent!==p.name)entry.name.textContent=p.name;
   if(entry.caption.textContent!==label){entry.caption.textContent=label;entry.row.title=label;entry.row.setAttribute('aria-label',label);}
   entry.bubble.hidden=!p.emote||game.now()-p.emote.at>=EMOTE_DURATION;
   entry.bubble.style.opacity=String(p.emote?Math.max(0,Math.min(1,(EMOTE_DURATION-(game.now()-p.emote.at))/350)):0);
   if(p.emote)entry.bubble.textContent=emoteIcon(p.emote.id);
   entry.distance.textContent=text;entry.row.style.setProperty('--progress',`${Math.min(100,meters/-ROUTE_FAR_Z*100)}%`);
   const speedText=p.speed===undefined?'—':formatNumber(p.speed,2);entry.speed.lastElementChild!.textContent=speedText;entry.speed.title=`현재 스피드 ${speedText}`;entry.speed.setAttribute('aria-label',entry.speed.title);
   entry.row.style.setProperty('--player-color',APPEARANCE_OPTIONS.accentColorId.find(c=>c.id===p.explorerAppearance?.accentColorId)?.color??colors[p.slot??0]??colors[0]);entry.label.style.setProperty('--player-color',APPEARANCE_OPTIONS.accentColorId.find(c=>c.id===p.explorerAppearance?.accentColorId)?.color??colors[p.slot??0]??colors[0]);
   entry.row.classList.toggle('self',p.id==='self');entry.label.classList.toggle('self',p.id==='self');
   const farmText=`${p.name}의 농장${p.id==='self'?' (내 농장)':''}`;
   if(entry.farm.textContent!==farmText)entry.farm.textContent=farmText;
   entry.farm.classList.toggle('self',p.id==='self');
   entry.farm.style.setProperty('--player-color',APPEARANCE_OPTIONS.accentColorId.find(c=>c.id===p.explorerAppearance?.accentColorId)?.color??colors[p.slot??0]??colors[0]);
   const farmAnchor=p.slot===undefined?null:world.farmAnchor(p.slot);entry.farm.hidden=!farmAnchor;
   if(farmAnchor)entry.farm.style.transform=`translate3d(${Math.round(farmAnchor.x)}px,${Math.round(farmAnchor.y)}px,0) translate(-50%,-100%)`;
   const anchor=world.playerAnchor(p.id==='self'?undefined:p.id);entry.label.hidden=!anchor;
   if(anchor){
    const dpr=window.devicePixelRatio||1;
    entry.label.style.transform=`translate3d(${Math.round(anchor.x*dpr)/dpr}px,${Math.round(anchor.y*dpr)/dpr}px,0) translate(-50%,-100%)`;
   }
  }
 }
}
