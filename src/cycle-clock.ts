import {BALANCE} from './data';

export function clockText(seconds:number){
 const total=Math.max(0,Math.ceil(seconds)),s=String(total%60).padStart(2,'0'),m=String(Math.floor(total/60)%60).padStart(2,'0');
 return total>=3600?`${String(Math.floor(total/3600)).padStart(2,'0')}:${m}:${s}`:`${m}:${s}`;
}
/** Read the game's phase deadlines; never maintain a second countdown. */
export function cycleClock(now:number,nightAt:number,nightUntil:number){
 const deepNight=now<nightUntil,normalNight=!deepNight&&now>=nightAt-BALANCE.normalNightDuration;
 const night=deepNight||normalNight;
 const deadline=deepNight?nightUntil:normalNight?nightAt:nightAt-BALANCE.normalNightDuration;
 const remaining=Math.max(0,(deadline-now)/1000);
 const duration=(deepNight?BALANCE.nightDuration:normalNight?BALANCE.normalNightDuration:BALANCE.nightInterval-BALANCE.nightDuration-BALANCE.normalNightDuration)/1000;
 return {night,deepNight,normalNight,deadline,remaining,text:clockText(remaining),ratio:Math.max(0,Math.min(1,remaining/duration)),warning:!deepNight&&remaining>0&&remaining<=BALANCE.warningSeconds};
}
