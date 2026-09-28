import {BALANCE} from './data';

/** Shared wall-clock weather for visuals and movement; reconnecting never rerolls. */
export function rainStrength(now:number){
 const window=Math.floor(now/BALANCE.rainInterval);
 const hash=(seed:number)=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);};
 if(hash(window)>=BALANCE.rainChance)return 0;
 const start=15000+hash(window+71)*90000,age=now-window*BALANCE.rainInterval-start;
 if(age<0||age>BALANCE.rainDuration)return 0;
 return Math.max(0,Math.min(1,age/4000,(BALANCE.rainDuration-age)/5000));
}

export function windStrength(now:number){
 const window=Math.floor(now/BALANCE.windInterval);
 const hash=(seed:number)=>{const n=Math.sin(seed*91.7+713.3)*15731.743;return n-Math.floor(n);};
 if(hash(window)>=BALANCE.windChance)return 0;
 const age=now-window*BALANCE.windInterval-(15000+hash(window+37)*100000);
 return age<0||age>BALANCE.windDuration?0:Math.max(0,Math.min(1,age/4000,(BALANCE.windDuration-age)/5000));
}
