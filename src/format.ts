const UNIT=10_000_000;
const formatters=new Map<number,Intl.NumberFormat>();
export function numberSuffix(index:number){
  let result='';
  while(index>0){index--;result=String.fromCharCode(65+index%26)+result;index=Math.floor(index/26);}
  return result;
}
export function formatNumber(value:number,decimals=0){
  if(!Number.isFinite(value))return '—';
  let scaled=Math.abs(value),unit=0;
  while(scaled>=UNIT){scaled/=UNIT;unit++;}
  const precision=unit?2:decimals;
  // Carry a rounded boundary forward instead of showing "10,000,000Z".
  if(Number(scaled.toFixed(precision))>=UNIT){scaled/=UNIT;unit++;}
  const digits=unit?2:decimals;
  let formatter=formatters.get(digits);
  if(!formatter){formatter=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:digits});formatters.set(digits,formatter);}
  return formatter.format(value<0?-scaled:scaled)+numberSuffix(unit);
}
