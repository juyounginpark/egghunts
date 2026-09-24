import {uiIcon} from './ui-icons';
import {formatNumber as num} from './format';

export function statBadge(icon:Parameters<typeof uiIcon>[0],value:string,label:string){
  return `<span class="stat-badge" role="img" aria-label="${label}" title="${label}">${uiIcon(icon)}<strong>${value}</strong></span>`;
}
export function petAbilities(pet:{clickMultiplier:number;autoMultiplier:number;speedMultiplier:number},all=false){
  return [
    {icon:'tap' as const,label:'터치 피해',value:pet.clickMultiplier},
    {icon:'auto' as const,label:'자동 피해',value:pet.autoMultiplier},
    {icon:'speed' as const,label:'이동 속도',value:pet.speedMultiplier},
  ].filter(stat=>all||stat.value>1).map(stat=>statBadge(stat.icon,`×${num(stat.value,2)}`,`${stat.label} ×${num(stat.value,2)}`)).join('');
}
export function petIncomeBadge(amount:number,seconds:number){
  return statBadge('dust',`+${num(amount)}<small>/${seconds}초</small>`,`별가루 ${seconds}초마다 ${num(amount)}개`);
}
