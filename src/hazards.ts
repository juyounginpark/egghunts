import { HAZARD_BALANCE as B, STAGE_COVERS, stagePatterns, environmentPlacement, type HazardDefinition, type Cover } from "./stage-data";
export type Point={x:number;z:number};
export type HazardPhase='Idle'|'Telegraph'|'Active'|'Recovery'|'Cooldown';
export type Hazard={serial:number;definition:HazardDefinition;phase:HazardPhase;elapsed:number;origin:Point;target:Point;angle:number;warning:number;hit:boolean;dotClock:number;gaze:number;member:number;blocked:boolean;environment?:boolean};
export type HazardPlayer=Point&{vx:number;vz:number;facing:Point;carrying:boolean;metal:boolean;moving:boolean;stageOffset?:number;guardianAwake?:boolean;guardianStage?:number;guardianOffset?:number};
export function blockedByCover(from:Point,to:Point,covers:Cover[]=STAGE_COVERS){
 const dx=to.x-from.x,dz=to.z-from.z,len=dx*dx+dz*dz;if(!len)return false;
 return covers.some(c=>{const t=((c.x-from.x)*dx+(c.z-from.z)*dz)/len;return t>0&&t<1&&Math.hypot(from.x+dx*t-c.x,from.z+dz*t-c.z)<c.radius;});
}
export function contains(h:Hazard,p:Point){
 const d=h.definition,dx=p.x-h.target.x,dz=p.z-h.target.z;
 if(d.shape==='wall')return Math.abs(dz)<=d.width&&Math.abs(dx)<=d.length/2&&Math.abs(dx-Math.sin(h.elapsed*.45)*1.2)>1.6;
 if(d.shape==='ellipse')return (dx/d.radius)**2+(dz/(d.radius*.75))**2<=1;
 if(d.shape==='line'){const along=dx*Math.cos(h.angle)+dz*Math.sin(h.angle),cross=-dx*Math.sin(h.angle)+dz*Math.cos(h.angle);return Math.abs(along)<=d.length/2&&Math.abs(cross)<=d.width;}
 if(d.shape==='cone'){const x=p.x-h.origin.x,z=p.z-h.origin.z,len=Math.hypot(x,z);return len<=d.radius&&(len===0||(x*Math.cos(h.angle)+z*Math.sin(h.angle))/len>.5);}
 const radius=d.radius*Math.min(1,h.elapsed/d.activeDuration),angle=Math.atan2(dz,dx);
 const gap=Math.abs(Math.atan2(Math.sin(angle-h.angle),Math.cos(angle-h.angle)))<B.waveGap;
 return !gap&&Math.abs(Math.hypot(dx,dz)-radius)<.3;
}
export class HazardManager{
 attacks:Hazard[]=[];time=0;private next=new Map<string,number>();private serial=0;stage=0;
 snapshot(){return {attacks:this.attacks,time:this.time,next:[...this.next],serial:this.serial,stage:this.stage};}
 restore(s:ReturnType<HazardManager['snapshot']>){this.attacks=s.attacks;this.time=s.time;this.next=new Map(s.next);this.serial=s.serial;this.stage=s.stage;}
 reset(stage=0){this.attacks=[];this.time=0;this.next.clear();this.stage=stage;}
 spawn(d:HazardDefinition,p:HazardPlayer,member=0){
  const lead=d.targetingType==='predict'?B.prediction:0;
  const target={x:Math.max(-5.7,Math.min(5.7,p.x+p.vx*lead+(member-1)*(d.count>1?1.6:0))),z:p.z+p.vz*lead};
  const origin={x:p.x>0?-5.8:5.8,z:target.z-1};
  if(d.shape==='cone'){origin.x=p.x;origin.z=p.z-2;}
  const angle=Math.atan2(target.z-origin.z,target.x-origin.x);
  const h:Hazard={serial:++this.serial,definition:d,phase:'Telegraph',elapsed:-member*.3,origin,target,angle,warning:d.telegraphDuration*(p.carrying?1+d.carryTelegraphBonus:1),hit:false,dotClock:0,gaze:0,member,blocked:false};
  this.attacks.push(h);return h;
 }
 tick(dt:number,stage:number,p:HazardPlayer,hit:(h:Hazard)=>void,push:(x:number,z:number)=>void,status:(effect:string,seconds:number)=>void,secret=false,clock?:number){
  if(this.stage!==stage)this.reset(stage);
  if(clock!==undefined)this.syncEnvironment(stage,p,clock);
  for(let rest=dt;rest>1e-9;rest-=B.step){const step=Math.min(B.step,rest);this.step(step,stage,p,hit,push,status,secret);}
 }
 private syncEnvironment(stage:number,p:HazardPlayer,clock:number){
  const prior=new Map(this.attacks.filter(h=>h.environment).map(h=>[h.definition.id,h]));
  this.attacks=this.attacks.filter(h=>!h.environment);
  for(const [lane,d] of stagePatterns(stage).entries()){
   const place=environmentPlacement(stage,lane,p.stageOffset??0);
   if(Math.abs(place.z-p.z)>36)continue;
   const period=d.telegraphDuration+d.activeDuration+B.recovery+d.cooldown;
   const time=clock/1000+stage*2.7+lane*6,cycle=Math.floor(time/period),age=time-cycle*period;
   const phase:HazardPhase=age<d.telegraphDuration?'Telegraph':age<d.telegraphDuration+d.activeDuration?'Active':age<d.telegraphDuration+d.activeDuration+B.recovery?'Recovery':'Cooldown';
   if(phase==='Cooldown')continue;
   const elapsed=phase==='Telegraph'?age:phase==='Active'?age-d.telegraphDuration:age-d.telegraphDuration-d.activeDuration;
   const old=prior.get(d.id),serial=cycle*100+stage*2+lane;
   const h:Hazard={serial,definition:d,phase,elapsed,origin:{...place},target:{...place},angle:0,warning:d.telegraphDuration,hit:old?.serial===serial?old.hit:false,dotClock:0,gaze:0,member:lane,blocked:false,environment:true};
   if(['orb','train','raptor','flame'].includes(d.visual))h.target.x=place.x-4+(phase==='Active'?elapsed/d.activeDuration:0)*8;
   h.origin={...h.target};this.attacks.push(h);
  }
 }
 private step(dt:number,stage:number,p:HazardPlayer,hit:(h:Hazard)=>void,push:(x:number,z:number)=>void,status:(effect:string,seconds:number)=>void,secret:boolean){
  this.time+=dt;
  for(const h of this.attacks){
   const d=h.definition;if(!h.environment)h.elapsed+=dt;
   if(h.elapsed<0)continue;
   if(h.phase==='Telegraph'){
    if(d.targetingType==='track'&&h.elapsed<h.warning-d.freezeBefore){h.target.x=p.x+(h.member-1)*(d.count>1?1.6:0);h.target.z=p.z;}
    if(d.effect==='ice'&&d.id==='thin-ice'&&!contains(h,p))h.elapsed=Math.min(h.elapsed,.2);
    if(d.effect==='ice'&&p.carrying)h.elapsed+=dt*(B.iceCarryRate-1);
    if(!h.environment&&h.elapsed+1e-8>=h.warning){h.phase='Active';h.elapsed=0;}
    continue;
   }
   if(h.phase==='Recovery'){if(!h.environment&&h.elapsed>=B.recovery){h.phase='Cooldown';h.elapsed=0;}continue;}
   if(h.phase==='Cooldown')continue;
   if(h.phase!=='Active')continue;
   if(h.elapsed>d.activeDuration){h.phase='Recovery';h.elapsed=0;continue;}
   if(d.targetingType==='sweep')h.target.x=Math.sin(h.elapsed*2)*4;
   if(h.environment&&['hay','train','book','raptor','gear','orb','flame'].includes(d.visual)){
    const lane=stagePatterns(stage).findIndex(d=>d.id===h.definition.id);const p0=environmentPlacement(stage,lane,p.stageOffset??0);h.target.x=p0.x-4+h.elapsed/d.activeDuration*8;h.origin={...h.target};
   }
   if(d.visual==='orb'&&!h.environment){
    const dx=p.x-h.origin.x,dz=p.z-h.origin.z,l=Math.hypot(dx,dz)||1;
    h.origin.x+=dx/l*B.projectileSpeed*dt;h.origin.z+=dz/l*B.projectileSpeed*dt;
    if(blockedByCover({x:h.origin.x-dx/l*.5,z:h.origin.z-dz/l*.5+(p.stageOffset??0)},{x:h.origin.x,z:h.origin.z+(p.stageOffset??0)})){h.blocked=true;h.phase='Recovery';continue;}
   }
   const inRange=d.visual==='orb'&&!h.environment?Math.hypot(p.x-h.origin.x,p.z-h.origin.z)<.6:contains(h,p);
   if(!inRange){h.gaze=0;continue;}
   if(d.blockable&&blockedByCover({x:h.origin.x,z:h.origin.z+(p.stageOffset??0)},{x:p.x,z:p.z+(p.stageOffset??0)})){h.blocked=true;if(d.effect!=='wind')h.phase='Recovery';continue;}
   if(d.effect==='wind'){push(Math.cos(h.angle)*B.windSpeed*dt,Math.sin(h.angle)*B.windSpeed*dt);continue;}
   if(d.effect==='delay'){status('delay',B.inputDelay);continue;}
   if(d.effect==='stone'){
    const dx=h.origin.x-p.x,dz=h.origin.z-p.z,l=Math.hypot(dx,dz)||1;
    if((dx*p.facing.x+dz*p.facing.z)/l>.5)h.gaze+=dt;else h.gaze=0;
    if(h.gaze>=B.stoneSeconds&&!h.hit){status('stone',B.stoneDuration);h.hit=true;}continue;
   }
   if(d.effect==='pull'){
    const dx=h.target.x-p.x,dz=h.target.z-p.z,l=Math.hypot(dx,dz);
    if(l>B.centerRadius){const amount=B.pullSpeed*(d.visual==='magnet'&&p.metal?B.metalPull:1)*dt;push(dx/l*amount,dz/l*amount);status('magnet',.1);continue;}
   }
   if(d.effect==='dot'){h.dotClock-=dt;if(h.dotClock>0)continue;h.dotClock=B.dotInterval;hit(h);continue;}
   if(!h.hit){h.hit=true;hit(h);}
  }
  this.attacks=this.attacks.filter(h=>h.phase!=='Cooldown'||h.elapsed<h.definition.cooldown);
 }
}
