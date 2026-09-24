import {EGGS,RARITIES} from './data';
import {eggIcon,eggName,type EggAppearance} from './stage-eggs';
export type EggNotice={id:string;at:number;name:string;guest:boolean;egg:EggAppearance};

export class EggNotices{
 private seen=new Set<string>();
 private queue:EggNotice[]=[];
 private until=0;
 private host=document.createElement('aside');
 constructor(parent:HTMLElement){this.host.id='egg-notices';this.host.hidden=true;this.host.setAttribute('role','status');parent.append(this.host);}
 update(notices:EggNotice[],serverTime:number){
  for(const n of notices)if(!this.seen.has(n.id)){
   this.seen.add(n.id);if(serverTime-n.at<15000)this.queue.push(n);
  }
  if(this.seen.size>200)this.seen=new Set([...this.seen].slice(-100));
  if(performance.now()<this.until)return;
  const n=this.queue.shift();this.host.hidden=!n;if(!n)return;
  const def=EGGS[n.egg.type];if(!def)return;
  const rarity=RARITIES[def.tier];
  this.host.replaceChildren();this.host.style.setProperty('--rarity-color',rarity.color);
  const icon=document.createElement('img'),copy=document.createElement('div'),who=document.createElement('small'),tier=document.createElement('b'),name=document.createElement('strong');
  icon.src=eggIcon(n.egg);icon.alt='';who.textContent=`${n.guest?'[GUEST] ':''}${n.name} 님 획득!`;tier.textContent=rarity.name;name.textContent=eggName(n.egg);
  copy.append(who,tier,name);this.host.append(icon,copy);this.until=performance.now()+4000;
 }
}
