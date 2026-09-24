import type {GameState} from './game';
import type {Peer} from './multiplayer';
import type {World} from './world';
import {ROUTE_FAR_Z,routeStage} from './stage-data';
import {playerLabel} from './player-identity';
import {uiIcon} from './ui-icons';
import {formatNumber} from './format';

const colors=['#567947','#bd794d','#56899d','#9572a8','#a5903e'];
export class RoomHUD{
 private progress=document.createElement('section');
 private labels=document.createElement('div');
 private rows=new Map<string,{row:HTMLElement;name:HTMLElement;distance:HTMLElement;speed:HTMLElement;label:HTMLElement}>();
 constructor(place:HTMLElement,worldHost:HTMLElement){
  this.progress.id='room-progress';this.progress.setAttribute('aria-label','탐험 진행도');
  this.labels.id='player-labels';place.append(this.progress);worldHost.append(this.labels);
 }
 update(game:GameState,peers:Peer[],world:World,guest:boolean,visible:boolean){
  this.progress.hidden=this.labels.hidden=!visible;if(!visible)return;
  const players=[{id:'self',name:game.save.playerName??'탐험가',level:game.level,isGuest:guest,slot:game.farmSlot,z:game.z,speed:game.speed},...peers].slice(0,5);
  for(const [id,entry]of this.rows)if(!players.some(p=>p.id===id)){entry.row.remove();entry.label.remove();this.rows.delete(id);}
  for(const p of players){
   let entry=this.rows.get(p.id);
   if(!entry){
    const row=document.createElement('div'),name=document.createElement('span'),distance=document.createElement('b'),label=document.createElement('div');
    const speed=document.createElement('b');speed.className='room-speed';speed.innerHTML=uiIcon('speed')+'<span></span>';
    row.className='room-progress-row';label.className='player-nameplate';row.append(name,distance,speed);this.progress.append(row);this.labels.append(label);entry={row,name,distance,speed,label};this.rows.set(p.id,entry);
   }
   const label=playerLabel(p.name,p.isGuest,p.level??1),meters=Math.max(0,Math.floor(-p.z));
   const stage=routeStage(1,p.z);
   const text=meters<=4?'기지':`${stage} · ${meters}m`;
   if(entry.name.textContent!==p.name)entry.name.textContent=p.name;
   if(entry.label.textContent!==label){entry.label.textContent=label;entry.row.title=label;entry.row.setAttribute('aria-label',label);}
   entry.distance.textContent=text;entry.row.style.setProperty('--progress',`${Math.min(100,meters/-ROUTE_FAR_Z*100)}%`);
   const speedText=p.speed===undefined?'—':formatNumber(p.speed,2);entry.speed.lastElementChild!.textContent=speedText;entry.speed.title=`현재 스피드 ${speedText}`;entry.speed.setAttribute('aria-label',entry.speed.title);
   entry.row.style.setProperty('--player-color',colors[p.slot??0]??colors[0]);entry.label.style.setProperty('--player-color',colors[p.slot??0]??colors[0]);
   entry.row.classList.toggle('self',p.id==='self');entry.label.classList.toggle('self',p.id==='self');
   const anchor=world.playerAnchor(p.id==='self'?undefined:p.id);entry.label.hidden=!anchor;
   if(anchor){entry.label.style.left=`${anchor.x}px`;entry.label.style.top=`${anchor.y}px`;}
  }
 }
}
