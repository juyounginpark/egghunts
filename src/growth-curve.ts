/** Continuous growth with diminishing gains above the threshold. */
export function softenGrowth(value:number,threshold:number){
  return value<=threshold?value:threshold*(1+Math.log10(value/threshold));
}
