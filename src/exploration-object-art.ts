import type {Block,Motion} from './region-layout';
import {environmentAssemblies} from './environment-art';
export {objectShape} from './scenery-shapes';
export type ObjectAssembly={id:string;kind:string;blocks:Block[];motions:Motion[]};
export function explorationObjects(stage:number):ObjectAssembly[]{return environmentAssemblies(stage);}
/** Retained for saved tooling; speed pads have been removed. */
export function speedPadArt(_stage:number){return {blocks:[] as Block[],motions:[] as Motion[]};}
