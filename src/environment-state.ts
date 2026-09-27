import {environmentPlacement,type HazardDefinition} from './stage-data';
import type {Hazard,HazardPhase} from './hazards';
export function environmentState(d:HazardDefinition,lane:number,offset:number,clock:number):Hazard{
 const base=environmentPlacement(d.stageId,lane,offset),recovery=d.recoveryDuration??.4;
 const period=d.telegraphDuration+d.activeDuration+recovery+d.cooldown;
 const time=clock/1000+d.stageId*2.7+lane*6,cycle=Math.floor(time/period),age=time-cycle*period;
 const floor=d.movement==='floor';
 const phase:HazardPhase=floor?'Active':age<d.telegraphDuration?'Telegraph':age<d.telegraphDuration+d.activeDuration?'Active':age<d.telegraphDuration+d.activeDuration+recovery?'Recovery':'Cooldown';
 const elapsed=floor?0:phase==='Telegraph'?age:phase==='Active'?age-d.telegraphDuration:age-d.telegraphDuration-d.activeDuration;
 const target={...base};
 if(d.movement==='cross')target.x+=-3+(phase==='Active'?elapsed/d.activeDuration:0)*6;
 if(d.movement==='wall')target.z+=phase==='Active'?1.5-elapsed/d.activeDuration*3:1.5;
 return {serial:floor?d.stageId*100+lane:cycle*100+d.stageId*3+lane,definition:d,phase,elapsed,origin:{...target},target,angle:0,warning:d.telegraphDuration,hit:false,dotClock:0,gaze:0,member:lane,blocked:false,environment:true};
}
