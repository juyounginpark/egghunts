import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts/test-results',{recursive:true});
await build({entryPoints:['scripts/qa/exploration-v2.ts'],outfile:'artifacts/test-results/exploration-v2.mjs',bundle:true,platform:'node',format:'esm',target:'node22',define:{'import.meta.env.BASE_URL':'"/"'}});
await import('../../artifacts/test-results/exploration-v2.mjs?'+Date.now());
