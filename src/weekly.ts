import {WEEKLY_EVENT} from './data';
export type WeeklyProgress={claimed:number;lastDay:number};
export const weeklyDay=(now:number)=>Math.floor((now+WEEKLY_EVENT.dayOffsetMs)/86400000);
export function validateWeekly(value:WeeklyProgress|undefined){
 if(value&&(!Number.isSafeInteger(value.claimed)||value.claimed<0||!Number.isSafeInteger(value.lastDay)||value.lastDay<0))throw Error('Invalid weekly progress');
}
