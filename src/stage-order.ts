/** Document design numbers are not pet IDs. Legacy groups keep their array indices. */
export const STAGE_ORDER_VERSION=2;
export const OLD_TO_STAGE=[0,1,2,3,4,19,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20];
export const STAGE_TO_OLD=[0,1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,5,20];
export const legacyTheme=(stage:number)=>stage===19?20:STAGE_TO_OLD[stage];
export function reorderStages<T>(rows:T[]):T[]{return STAGE_TO_OLD.slice(1).map(old=>rows[old-1]);}
