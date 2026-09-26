import {BALANCE} from './data';

export function clockText(seconds:number){
 const total=Math.max(0,Math.ceil(seconds)),s=String(total%60).padStart(2,'0'),m=String(Math.floor(total/60)%60).padStart(2,'0');
 return total>=3600?`${String(Math.floor(total/3600)).padStart(2,'0')}:${m}:${s}`:`${m}:${s}`;
}
/** Read the game's phase deadlines; never maintain a second countdown. */
export function cycleClock(now:number,nightAt:number,nightUntil:number){
 const night=now<nightUntil;
 const remaining=Math.max(0,((night?nightUntil:nightAt)-now)/1000);
 const duration=(night?BALANCE.nightDuration:BALANCE.nightInterval-BALANCE.nightDuration)/1000;
 return {night,remaining,text:clockText(remaining),ratio:Math.max(0,Math.min(1,remaining/duration)),warning:!night&&remaining>0&&remaining<=10};
}
