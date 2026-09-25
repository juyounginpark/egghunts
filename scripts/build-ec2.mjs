import {build} from 'esbuild';
// Release artifact has no npm install or TypeScript compilation on the 1GB VM.
await build({entryPoints:['server/ec2-host.mjs'],outfile:'dist-server/host.mjs',bundle:true,format:'esm',platform:'node',target:'node24',external:['bufferutil','utf-8-validate'],banner:{js:"import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);"},define:{'import.meta.env.BASE_URL':'"/"'}});
