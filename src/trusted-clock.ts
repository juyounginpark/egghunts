export type ClockRecord={offset:number;trustedAt:number;wallAt:number;now:number};
/** Wall time is used only at startup. In-session time advances monotonically. */
export class TrustedClock{
 private anchor:number;
 private started:number;
 private offset=0;
 private trustedAt=0;
 constructor(record?:ClockRecord,private wall=()=>Date.now(),private monotonic=()=>performance.now()){
  this.started=monotonic();this.offset=record?.offset??0;this.trustedAt=record?.trustedAt??0;
  this.anchor=Math.max(record?.now??0,wall()+this.offset);
 }
 now(){return this.anchor+Math.max(0,this.monotonic()-this.started);}
 sync(timestamp:number){
  if(!Number.isFinite(timestamp)||timestamp<=0)throw Error('Invalid trusted timestamp');
  this.offset=timestamp-this.wall();this.anchor=timestamp;this.started=this.monotonic();this.trustedAt=timestamp;
 }
 record():ClockRecord{return {offset:this.offset,trustedAt:this.trustedAt,wallAt:this.wall(),now:this.now()};}
 offlineSeconds(savedAt:number,cap:number){
  const elapsed=(this.now()-savedAt)/1000;
  // Without a fresh trusted timestamp, never award a huge clock jump.
  if(!Number.isFinite(elapsed)||elapsed<0||elapsed>30*86400)return 0;
  return Math.min(elapsed,cap,this.trustedAt>=savedAt?cap:3600);
 }
}
