import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts/test-results',{recursive:true});
await build({entryPoints:['scripts/qa/water-terrain.ts'],outfile:'artifacts/test-results/water-terrain.mjs',bundle:true,platform:'node',format:'esm',target:'node22',define:{'import.meta.env.BASE_URL':'"/"'}});
await import('../../artifacts/test-results/water-terrain.mjs?'+Date.now());
