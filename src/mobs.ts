import type {GameState} from './game';
import type {Hazard} from './hazards';
import {contains} from './hazards';
import {environmentState} from './environment-state';
import {MOB_TYPES} from './exploration-catalog';
import {BALANCE} from './data';
import {EXPLORATION_COMBAT as B,stagePatterns,type HazardDefinition} from './stage-data';
import {routePoint,terrainAt} from './exploration-route';
export type Mob={id:string;type:number;stage:number;x:number;z:number;homeX:number;homeZ:number;hp:number;maxHp:number;phase:'idle'|'approach'|'warning'|'active'|'recovery'|'hit'|'dead'|'return';at:number;serial:number;target:string|null;aimX:number;aimZ:number;fromX:number;fromZ:number;hit:string[];knockX:number;knockZ:number;lastBat:string;respawnAt:number;groundNext:number};
export function mobSight(g:GameState,from:{x:number;z:number},to:{x:number;z:number}){
 g.mapCollision.opened=g.openedShortcuts;
 const end=g.mapCollision.move(from.x,from.z,to.x-from.x,to.z-from.z,g.progression.stage);
 return Math.hypot(end.x-to.x,end.z-to.z)<.08;
}
export function mobSpawn(type:number,slot:number,start:number,now:number):Mob{
 const d=MOB_TYPES[type],p=routePoint(d.stage,slot===0?.16:slot===1?.60:.57),offset=(d.stage-start)*48;
 const x=p.x+(slot===2?(d.stage%2?5:-5):slot===0?-1:1),z=p.z-offset;
 return {id:`mob-${d.stage}-${slot}`,type,stage:d.stage,x,z,homeX:x,homeZ:z,hp:d.hits*B.referenceBat,maxHp:d.hits*B.referenceBat,phase:'idle',at:now,serial:0,target:null,aimX:x,aimZ:z,fromX:x,fromZ:z,hit:[],knockX:0,knockZ:0,lastBat:'',respawnAt:0,groundNext:0};
}
function setPhase(m:Mob,phase:Mob['phase'],now:number){m.phase=phase;m.at=now;}
function kill(m:Mob,now:number){if(m.phase==='dead')return;m.hp=0;m.target=null;m.hit=[];m.knockX=m.knockZ=0;m.respawnAt=now+B.respawnMs;setPhase(m,'dead',now);}
export function hitMobs(g:GameState,swing:string){
 if(g.death||g.carried||g.isAtBase)return;
 const now=g.now();
 for(const m of g.mobs){
  const dx=m.x-g.x,dz=m.z-g.z,l=Math.hypot(dx,dz);
  if(m.hp<=0||m.lastBat===swing||l>BALANCE.batRange||l>.01&&(dx*g.facing.x+dz*g.facing.z)/l<BALANCE.batFacingThreshold||!mobSight(g,g,m))continue;
  m.lastBat=swing;m.hp=Math.max(0,m.hp-g.tapDamage);m.target=null;m.hit=[];m.serial++;
  if(!m.hp)kill(m,now);
  else {setPhase(m,'hit',now);m.knockX=(l?dx/l:g.facing.x)*4;m.knockZ=(l?dz/l:g.facing.z)*4;}
  g.emit('mob_hit',{id:m.id,hp:m.hp});g.revision++;
 }
}
export function mobProjectiles(m:Mob,now:number){
 const d=MOB_TYPES[m.type];if(m.phase!=='active'||d.kind!=='projectile')return [];
 const dx=m.aimX-m.fromX,dz=m.aimZ-m.fromZ,l=Math.hypot(dx,dz)||1,age=(now-m.at)/1000;
 return Array.from({length:d.shots},(_,i)=>age-i*.45).filter(t=>t>=0&&t<d.active).map(t=>({x:m.fromX+dx/l*t*B.projectileSpeed,z:m.fromZ+dz/l*t*B.projectileSpeed}));
}
export function tickMobs(mobs:Mob[],players:Map<string,GameState>,now:number,dt:number){
 const alive=[...players].filter(([,g])=>!g.death&&!g.isAtBase&&!g.isNight);if(!alive.length)return;
 const stages=new Set(alive.flatMap(([,g])=>[Math.max(1,g.stage.id-1),g.stage.id,Math.min(20,g.stage.id+1)]));
 const start=alive[0][1].progression.stage;
 for(const stage of stages)for(let slot=0;slot<(stage<=5?2:3);slot++){
  const id=`mob-${stage}-${slot}`;if(!mobs.some(m=>m.id===id))mobs.push(mobSpawn((stage-1)*2+slot%2,slot,start,now));
 }
 for(const m of mobs){
  if(!stages.has(m.stage))continue;
  const d=MOB_TYPES[m.type],g=alive.find(([,p])=>p.stage.id===m.stage)?.[1];if(!g)continue;
  const offset=(m.stage-start)*48,age=(now-m.at)/1000;
  if(m.phase==='dead'){
   if(now>=m.respawnAt&&!alive.some(([,p])=>Math.hypot(p.x-m.homeX,p.z-m.homeZ)<8)){
    Object.assign(m,mobSpawn(m.type,Number(m.id.split('-')[2]),start,now),{serial:m.serial+1});
   }
   continue;
  }
  const move=(dx:number,dz:number)=>{const p=g.mapCollision.move(m.x,m.z,dx,dz,start);m.x=p.x;m.z=p.z;};
  if(Math.abs(m.x)>13||!Number.isFinite(m.x+m.z)||m.z>-6){kill(m,now);continue;}
  for(const [lane,h] of stagePatterns(m.stage).entries())if(h.tickInterval&&now>=m.groundNext){
   const a=environmentState(h,lane,offset,now);
   if(a.phase==='Active'&&terrainAt(m.stage,m.x,m.z+offset).height<.1&&contains(a,m)){
    m.hp-=h.damage;m.groundNext=now+h.tickInterval*1000;if(m.hp<=0)kill(m,now);
   }
  }
  if(m.hp<=0)continue;
  if(m.phase==='hit'){move(m.knockX*dt,m.knockZ*dt);m.knockX*=Math.exp(-dt*8);m.knockZ*=Math.exp(-dt*8);if(age>=B.hitRecovery)setPhase(m,'return',now);continue;}
  let target=m.target?players.get(m.target):undefined;
  if(target&&(target.death||target.isAtBase||Math.hypot(m.x-m.homeX,m.z-m.homeZ)>B.leash||!mobSight(g,m,target))){m.target=null;setPhase(m,'return',now);}
  if(m.phase==='return'){
   const dx=m.homeX-m.x,dz=m.homeZ-m.z,l=Math.hypot(dx,dz);if(l<.15)setPhase(m,'idle',now);else move(dx/l*Math.min(l,dt*1.8),dz/l*Math.min(l,dt*1.8));continue;
  }
  if(m.phase==='idle'||m.phase==='approach'){
   const candidate=alive.filter(([,p])=>p.stage.id===m.stage&&Math.hypot(p.x-m.homeX,p.z-m.homeZ)<B.aggro&&mobSight(g,m,p)).sort((a,b)=>Math.hypot(a[1].x-m.x,a[1].z-m.z)-Math.hypot(b[1].x-m.x,b[1].z-m.z))[0];
   if(!candidate){if(m.phase==='approach')setPhase(m,'return',now);continue;}
   [m.target,target]=candidate;const dx=target.x-m.x,dz=target.z-m.z,l=Math.hypot(dx,dz);
   if(l>(d.kind==='projectile'?3:1.25)){setPhase(m,'approach',now);move(dx/l*dt*B.enemySpeed,dz/l*dt*B.enemySpeed);continue;}
   const preparing=mobs.filter(v=>v!==m&&v.stage===m.stage&&['warning','active'].includes(v.phase));
   if(preparing.length>=(m.stage<=5?1:2))continue;
   // Lock direction at warning start; never turn at the last instant.
   m.fromX=m.x;m.fromZ=m.z;m.aimX=target.x;m.aimZ=target.z;m.hit=[];m.serial++;setPhase(m,'warning',now);continue;
  }
  if(m.phase==='warning'){if(age>=d.warning)setPhase(m,'active',m.at+d.warning*1000);continue;}
  if(m.phase==='active'){
   if(age>=d.active){setPhase(m,'recovery',m.at+d.active*1000);continue;}
   const dx=m.aimX-m.fromX,dz=m.aimZ-m.fromZ,len=Math.hypot(dx,dz)||1;
   if(d.kind==='dash')move(dx/len*dt*3,dz/len*dt*3);
   for(const [id,p] of alive){
    if(m.hit.includes(id)||!mobSight(g,m,p))continue;
    let contact;
    if(d.kind==='projectile'){
     const projectiles=mobProjectiles(m,now),previous=mobProjectiles(m,now-dt*1000);
     contact=projectiles.some((q,i)=>{
      if(!mobSight(g,{x:m.fromX,z:m.fromZ},q))return false;
      const prev=previous[i]??{x:m.fromX,z:m.fromZ},vx=q.x-prev.x,vz=q.z-prev.z,l2=vx*vx+vz*vz;
      const t=l2?Math.max(0,Math.min(1,((p.x-prev.x)*vx+(p.z-prev.z)*vz)/l2)):0;
      return Math.hypot(p.x-prev.x-vx*t,p.z-prev.z-vz*t)<.45;
     });
    }else{
     const px=p.x-m.x,pz=p.z-m.z,l=Math.hypot(px,pz);
     contact=l<(d.kind==='cone'?1.6:1.15)&&(l<.01||(px*dx+pz*dz)/(l*len)>.5);
    }
    if(!contact)continue;m.hit.push(id);
    p.applyHazard({serial:m.serial,origin:{x:m.x,z:m.z},definition:{id:m.id,damage:d.damage,damagePercent:0,effect:'hit',knockback:0,slowDuration:0,slowMultiplier:1} as HazardDefinition} as Hazard);
   }
  }else if(m.phase==='recovery'&&age>=d.recovery)setPhase(m,'idle',now);
 }
}
