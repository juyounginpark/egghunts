import {dioramaHeight} from './diorama-zones';

/** Shared deterministic ground cells: art and movement use the same relief. */
export function reliefCell(stage:number,x:number,z:number,center:number,length:number){
 const cx=Math.round(x),cz=Math.floor(z)+.5,progress=(-cz-6)/length;
 const active=progress>.06&&progress<.85,dist=Math.abs(cx-center);
 const edge=2.3+.22*Math.sin(cz*.7+stage)+.16*Math.sin(cz*1.9);
 const seed=Math.abs(Math.imul(cx+71,73856093)^Math.imul(Math.floor(cz)+391,19349663)^Math.imul(stage,83492791))>>>0;
 const crack=active&&seed%17===0?(seed>>>8)%10:-1;
 const groove=crack>=7?(crack===9?.22:.1):0;
 let top=dioramaHeight(stage,cx,cz,center);
 if(active){
  if(dist<edge-1)top=(progress<.09||progress>.82?-.16:-.32)+(seed%13===0?-.04:seed%11===0?.03:0);
  else if(dist<edge)top=-.16;
  else if(dist<3)top=0;
  else top+=.08;
 }
 return {x:cx,z:cz,top,crack,groove,height:top-(Math.abs(x-cx)<.08?groove:0),trail:dist<edge};
}
