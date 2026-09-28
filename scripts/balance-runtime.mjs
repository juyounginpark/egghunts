import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export async function runtime(baseline=false){
 const code=baseline?await readFile('artifacts/balance-overhaul/baseline-runtime.mjs','utf8'):(await build({stdin:{contents:`export * from './src/balance.ts'; export * from './src/game.ts'; export * from './src/data.ts'; export * from './src/stage-data.ts'; export * from './src/progression.ts'; export * from './src/growth-curve.ts'; export * from './src/weight.ts'; export * from './src/money.ts'; export * from './src/balance-migration.ts'; export * from './src/ultra-secret.ts'; export {mainPath,pathX,routePoint,eggAnchor,bossAnchor} from './src/exploration-route.ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env.BASE_URL':'"/"'}})).outputFiles[0].text;
 await mkdir('artifacts/balance-overhaul',{recursive:true});
 const file=resolve('artifacts/balance-overhaul/'+(baseline?'baseline-runtime.mjs':'current-runtime.mjs'));
 if(!baseline)await writeFile(file,code);
 return {m:await import(pathToFileURL(file).href),code};
}
export function seeded(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export function quantiles(values){const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return {P10:v[Math.floor((v.length-1)*.1)]??null,P50:v[Math.floor((v.length-1)*.5)]??null,P90:v[Math.floor((v.length-1)*.9)]??null,reached:v.length,total:values.length};}
