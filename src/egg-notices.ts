import {EGGS,RARITIES} from './data';
import {eggName,type EggAppearance} from './stage-eggs';
import {STAGES} from './stage-data';
import type {GameState} from './game';
export type EggNotice={id:string;at:number;name:string;guest:boolean;egg:EggAppearance};
type Notice=EggNotice&{kind?:'dawn'|'spawn';eggIds?:string[]};

export class EggNotices{
 private seen=new Set<string>();
 private queue:Notice[]=[];
 private day:number|undefined;
 private observedNight=false;
 private worldIds=new Set<string>();
 private until=0;
 private host=document.createElement('aside');
 constructor(parent:HTMLElement){this.host.id='egg-notices';this.host.hidden=true;this.host.setAttribute('role','status');parent.append(this.host);}
 observeWorld(game:Pick<GameState,'world'|'isNight'|'nightAt'>,at:number){
  this.worldIds=new Set(game.world.map(e=>e.id));
  if(game.isNight){
   this.observedNight=true;
   this.queue=this.queue.filter(n=>!n.kind);
   if(this.host.dataset.kind==='spawn'){this.until=0;this.host.hidden=true;}
   return;
  }
  if(this.day===game.nightAt)return;
  const reset=this.day!==undefined||this.observedNight;
  this.day=game.nightAt;this.observedNight=false;
  this.queue=this.queue.filter(n=>!n.kind);
  const rare=game.world.filter(e=>EGGS[e.type]?.tier>=4).sort((a,b)=>EGGS[b.type].tier-EGGS[a.type].tier||(a.stageId??0)-(b.stageId??0));
  const grouped=new Map<string,Notice>();
  for(const egg of rare){
   const key=`${egg.stageId}:${egg.type}:${egg.variant}:${egg.special}`;
   const existing=grouped.get(key);
   if(existing)existing.eggIds!.push(egg.id);
   else grouped.set(key,{id:`spawn:${game.nightAt}:${egg.id}`,at,name:'',guest:false,kind:'spawn',egg:{...egg},eggIds:[egg.id]});
  }
  const batch=[...grouped.values()];
  if(reset)batch.unshift({id:`dawn:${game.nightAt}`,at,name:'',guest:false,kind:'dawn',egg:{type:0}});
  this.queue.unshift(...batch);
  if(reset)this.until=0;
 }
 update(notices:EggNotice[],serverTime:number){
  for(const n of notices)if(!this.seen.has(n.id)){
   this.seen.add(n.id);if(serverTime-n.at<15000)this.queue.push(n);
  }
  if(this.seen.size>200)this.seen=new Set([...this.seen].slice(-100));
  if(performance.now()<this.until)return;
  let n=this.queue.shift();
  while(n?.kind==='spawn'&&!n.eggIds?.some(id=>this.worldIds.has(id)))n=this.queue.shift();
  this.host.hidden=!n;if(!n)return;
  const def=EGGS[n.egg.type];if(!def)return;
  const rarity=RARITIES[def.tier];
  this.host.replaceChildren();this.host.dataset.kind=n.kind??'acquired';this.host.style.setProperty('--rarity-color',rarity.color);
  const copy=document.createElement('div'),who=document.createElement('small'),tier=document.createElement('b'),name=document.createElement('strong');
  if(n.kind==='dawn'){
   who.textContent='낮이 되었어요!';name.textContent='알이 리셋되었어요!';tier.hidden=true;
  }else{
   const stage=STAGES[(n.egg.stageId??1)-1];
   who.textContent=n.kind==='spawn'?`${n.egg.stageId??1}단계 · ${stage?.name??'탐험 지역'}에 등장!`:`${n.guest?'[GUEST] ':''}${n.name} 님 획득!`;
   tier.textContent=rarity.name;name.textContent=eggName(n.egg);
   const count=n.eggIds?.filter(id=>this.worldIds.has(id)).length??1;
   if(count>1)name.textContent+=` ×${count}`;
  }
  copy.append(who,tier,name);this.host.append(copy);this.until=performance.now()+4000;
 }
}
