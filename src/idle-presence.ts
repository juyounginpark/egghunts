import {BALANCE} from './data';

/** Position-based presence; network heartbeats and menu clicks do not reset it. */
export class IdlePresence{
 private anchor:{x:number;z:number;training:boolean;since:number}|null=null;
 update(x:number,z:number,training:boolean,now:number){
  const a=this.anchor;
  if(a&&now-a.since>=(a.training?BALANCE.trainingIdleTimeout:BALANCE.idleTimeout))return true;
  if(!a||(training&&!a.training)||Math.hypot(x-a.x,z-a.z)>.25)this.anchor={x,z,training,since:now};
  else a.training=training;
  const current=this.anchor!;
  return now-current.since>=(current.training?BALANCE.trainingIdleTimeout:BALANCE.idleTimeout);
 }
}
