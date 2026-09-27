// Compatibility for old snapshots and manual tools; no pads are spawned.
type RetiredPad={id:string;stage:number;x:number;z:number;height:number;multiplier:number;duration:number};
export function speedPads(_stage:number):RetiredPad[]{return [];}
export type SpeedPadState={stage:number;inside:string[];cooldowns:Record<string,number>;effects:{multiplier:number;until:number}[];blend:number};
export const freshPads=():SpeedPadState=>({stage:0,inside:[],cooldowns:{},effects:[],blend:1});
export function updatePads(s:SpeedPadState,_stage:number,_x:number,_z:number,_now:number,_dt:number,_disabled=false){Object.assign(s,freshPads());}
