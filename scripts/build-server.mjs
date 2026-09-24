// Produce the Edge Function engine from the exact same gameplay rules as the app.
import {build} from 'esbuild';
await build({entryPoints:['server/room-engine.ts'],outfile:'supabase/functions/_shared/room-engine.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',minify:true,define:{'import.meta.env.BASE_URL':'"/"'}});
