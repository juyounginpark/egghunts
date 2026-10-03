type Point={x:number;z:number;at:number;moving:boolean};
/** Visual-only buffered server positions. Combat continues using the newest state. */
export class GuardianMotion{
 private points:Point[]=[];
 private clock=0;
 private received=0;
 private gaps:number[]=[];
 private delay=.35;
 private displayed:{x:number;z:number}|null=null;
 reset(){this.points=[];this.gaps=[];this.clock=0;this.received=0;this.delay=.35;this.displayed=null;}
 sample(x:number,z:number,at:number,received:number,moving=true){
  const last=this.points.at(-1);
  if(last&&at<=last.at)return;
  if(last){
   this.gaps.push(Math.max(0,received-this.received));this.gaps=this.gaps.slice(-8);
   const desired=Math.max(.2,Math.min(.75,Math.max(...this.gaps)*1.2));
   this.delay+=(desired-this.delay)*(desired>this.delay?.5:.08);
  }
  else this.clock=at-this.delay;
  this.received=received;this.points.push({x,z,at,moving});this.points=this.points.slice(-12);
 }
 position(dt:number,now:number){
  const last=this.points.at(-1)!;
  const desired=last.at+Math.max(0,now-this.received)-this.delay;
  // Keep the playback clock running during packet gaps. The old last.at + .1
  // clamp repeatedly stopped and restarted the boss whenever the buffer emptied.
  const error=desired-(this.clock+dt);
  // A suspended tab or a slow frame must not leave playback seconds behind.
  if(error>1)this.clock=desired;
  else this.clock+=dt+Math.max(-dt*.25,Math.min(dt*.25,error));
  const first=this.points[0];
  let a=first,b=last;
  for(let i=1;i<this.points.length;i++){a=this.points[i-1];b=this.points[i];if(b.at>=this.clock)break;}
  const span=b.at-a.at;
  let x=first.x,z=first.z;
  if(span>0&&this.clock>first.at){
   // Short visual-only coasting eases to rest rather than hitting a hard stop.
   // Never extrapolate a sleeping/waking guardian or alter authoritative combat.
   const ahead=this.clock>b.at&&b.moving?.3*(1-Math.exp(-(this.clock-b.at)/.3)):0;
   const t=Math.max(0,Math.min(1,(this.clock-a.at)/span))+ahead/span;
   x=a.x+(b.x-a.x)*t;z=a.z+(b.z-a.z)*t;
  }
  this.displayed??={x,z};
  const blend=1-Math.exp(-dt*18);
  this.displayed.x+=(x-this.displayed.x)*blend;this.displayed.z+=(z-this.displayed.z)*blend;
  return this.displayed;
 }
}
