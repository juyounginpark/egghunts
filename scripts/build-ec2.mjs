import {build} from 'esbuild';
// Release artifact has no npm install or TypeScript compilation on the 1GB VM.
const source=process.argv.includes('--legacy')?{entryPoints:['server/ec2-host.mjs']}:{stdin:{contents:"import {startPresenceHost} from './server/presence-host.mjs'; await startPresenceHost();",resolveDir:process.cwd(),loader:'js'}};
await build({...source,outfile:'dist-server/host.mjs',bundle:true,format:'esm',platform:'node',target:'node24',external:['bufferutil','utf-8-validate'],banner:{js:"import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);"},define:{'import.meta.env.BASE_URL':'"/"'}});
