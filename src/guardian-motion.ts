type Point={x:number;z:number;at:number};
/** Visual-only buffered server positions. Combat continues using the newest state. */
export class GuardianMotion{
 private points:Point[]=[];
 private clock=0;
 private received=0;
 private gaps:number[]=[];
 private delay=.35;
 reset(){this.points=[];this.gaps=[];this.clock=0;this.received=0;this.delay=.35;}
 sample(x:number,z:number,at:number,received:number){
  const last=this.points.at(-1);
  if(last&&at<=last.at)return;
  if(last){this.gaps.push(received-this.received);this.gaps=this.gaps.slice(-8);this.delay=Math.max(.2,Math.min(.75,Math.max(...this.gaps)*1.1));}
  else this.clock=at-this.delay;
  this.received=received;this.points.push({x,z,at});this.points=this.points.slice(-12);
 }
 position(dt:number,now:number){
  const last=this.points.at(-1)!;
  const desired=last.at+Math.max(0,now-this.received)-this.delay;
  // Slew playback speed by at most 10%; packet arrival cannot jump the pose.
  const error=desired-(this.clock+dt);
  this.clock+=dt+Math.max(-dt*.1,Math.min(dt*.1,error));
  const first=this.points[0];if(this.clock<=first.at)return first;
  let a=first,b=last;
  for(let i=1;i<this.points.length;i++){a=this.points[i-1];b=this.points[i];if(b.at>=this.clock)break;}
  const span=b.at-a.at;if(span<=0)return b;
  // Brief packet gaps can coast for 100ms, then stop instead of inventing a chase.
  const t=Math.min(1+.1/span,Math.max(0,(this.clock-a.at)/span));
  return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
 }
}
