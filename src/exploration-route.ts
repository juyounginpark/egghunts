/** Authored centre lines; progress is cumulative walking distance, not world Z. */
export type RoutePoint={x:number;z:number};
export const EXPLORATION_MAPS=[
 ['연잎 길','돌다리','거목과 뿌리 둥지',[-2,2,-2,0]],
 ['블록 다리','블록 보도','블록 성과 보관실',[-4,-4,4,2]],
 ['조개 보행판','모래길','진주 산호 전당',[3,-3,2,-1]],
 ['철제 작업판','작업 통로','거대한 화로',[-4,3,3,0]],
 ['체육관 무대','교실 복도','시계 홀과 교장실',[-3,-3,3,0]],
 ['고가 보행로','상점가','네온 타워',[0,3,-2,0]],
 ['모래 능선','석재 길','피라미드',[3,1,-3,0]],
 ['통나무 다리','돌다리','거대 뿌리와 알껍질',[-2,0,3,0]],
 ['둥근 돌다리','등불 장터','달문 마당',[3,-2,-2,0]],
 ['구름다리','대리석 회랑','월계수 신전',[-3,0,3,0]],
 ['젤 사이 통로','연구 복도','원형 실험실',[-4,1,4,0]],
 ['비행선 갑판','화물 회랑','시계탑 기계실',[2,-3,-1,0]],
 ['얼음 지름길','눈길','빙하 전정과 얼음굴',[-3,3,1,0]],
 ['침대 지름길','러그 길','베개 성',[3,3,-3,0]],
 ['진흙 사이 마른 길','콘크리트 보도','재생 온실',[-3,2,-3,0]],
 ['버섯 발판','뿌리 경사','꽃뿌리 둥지',[3,-3,3,0]],
 ['쌍방향 컨베이어','공장 보행로','로봇 조립장',[-2,2,2,0]],
 ['분화구 테두리','관측 데크','천문대 돔',[4,0,-3,0]],
 ['위층 돌다리','아래 돌길','경계의 문',[-3,3,-3,0]],
 ['거목 뿌리','정원 산책로','첫 둥지',[2,-3,3,0]],
] as const;
const cache=new Map<number,RoutePoint[]>();
export function routeLength(stage:number){return stage===20?225:48;}
export function mainPath(stage:number){
 let points=cache.get(stage);if(points)return points;
 const xs=EXPLORATION_MAPS[stage-1][3],length=routeLength(stage);
 points=[{x:0,z:-6},...[.18,.36,.56,.74].map((t,i)=>({x:xs[i],z:-6-length*t})),{x:0,z:-6-length*.94},{x:0,z:-6-length}];
 cache.set(stage,points);return points;
}
export function routePoint(stage:number,progress:number):RoutePoint{
 const path=mainPath(stage),lengths=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.z-path[i].z));
 let distance=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,progress));
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const t=distance/lengths[i];return {x:path[i].x+(path[i+1].x-path[i].x)*t,z:path[i].z+(path[i+1].z-path[i].z)*t};}distance-=lengths[i];}
 return path[path.length-1];
}
export function routeProgress(stage:number,x:number,z:number){
 const path=mainPath(stage);let nearest=Infinity,result=0,along=0,total=0;
 for(let i=1;i<path.length;i++)total+=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(l*l)));
  const distance=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
  if(distance<nearest){nearest=distance;result=(along+t*l)/total;}along+=l;
 }
 return {progress:result,distance:nearest};
}
export function pathX(stage:number,z:number){
 const path=mainPath(stage);
 for(let i=1;i<path.length;i++)if(z>=path[i].z){const t=Math.max(0,Math.min(1,(z-path[i-1].z)/(path[i].z-path[i-1].z)));return path[i-1].x+(path[i].x-path[i-1].x)*t;}
 return 0;
}
export function terrainAt(stage:number,x:number,z:number){
 const {progress:t,distance}=routeProgress(stage,x,z),center=pathX(stage,z),side=stage%2?1:-1;
 const arena=t>=.64,landing=t>=.25&&t<=.45,bypass=t>=.17&&t<=.65&&Math.abs(x-(center+side*6))<=2;
 const connectors=(Math.abs(t-.19)<.035||Math.abs(t-.61)<.035)&&Math.abs(x-center-side*3)<=5;
 const optional=[5,8,14,17].includes(stage)&&Math.abs(t-.53)<.045&&Math.abs(x-center-side*3)<=4;
 const walk=distance<=2.2||arena&&Math.abs(x)<=11||landing&&Math.abs(x-center)<=6.5||bypass||connectors||optional;
 const bridge=t>=.22&&t<=.48&&Math.abs(x-center)<1.9;
 const ramp=Math.max(0,Math.min(1,(t-.22)/.035,(.48-t)/.035));
 const height=bridge?(stage<=5?.24:stage===19?.9:.55)*ramp*Math.min(1,(1.9-Math.abs(x-center))/.5):0;
 const slow=landing&&!bridge&&!bypass&&[1,3,7,8,11,15,20].includes(stage)?.65:1;
 const ice=stage===13&&(bridge||t>=.18&&t<=.25&&distance<2.2);
 return {walk,height,slow,bridge,landing,progress:t,center,bypass,ice};
}
export function explorationHeight(x:number,z:number,start=1){
 if(z>-6)return 0;
 const stage=Math.min(20,start+Math.max(0,Math.floor((-z-6)/48))),offset=(stage-start)*48;
 return terrainAt(stage,x,z+offset).height;
}
export function shortcut(stage:number){
 if(![5,8,14,17].includes(stage))return null;
 const p=routePoint(stage,.53),side=stage%2?1:-1;
 return {...p,x:p.x+side*3,label:stage===14?'펼치기':stage===17?'치우기':'밀기'};
}
export function eggAnchor(stage:number,slot:number){
 const p=routePoint(stage,.9+(slot%3)*.025);
 return {x:(slot-2)*2.4,z:p.z};
}
