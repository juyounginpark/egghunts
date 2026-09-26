import {build} from 'vite';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const baseline=JSON.parse(await readFile('docs/art/expansion-baseline.json','utf8'));
const files=['src/data.ts','src/game.ts','src/panels.ts','src/pet-animation.ts','src/voxel.ts'];
const sources=new Map(files.map(file=>[file,execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'show',`${baseline.commit}:${file}`],{encoding:'utf8'})]));
await build({base:'/egghunts/',build:{outDir:'artifacts/expansion/baseline-build',emptyOutDir:false,copyPublicDir:false},plugins:[{name:'preserved-release-comparison',enforce:'pre',transform(code,id){const file=files.find(file=>id.replaceAll('\\','/').endsWith('/'+file));if(file)return sources.get(file);}}]});
async function size(folder){let bytes=0;for(const file of await readdir(folder))if(file.endsWith('.js'))bytes+=gzipSync(await readFile(`${folder}/${file}`)).length;return bytes;}
const before=await size('artifacts/expansion/baseline-build/assets'),after=await size('dist/assets');
const report={scope:'All emitted JavaScript chunks, including lazy chunks',before,after,delta:after-before,budget:300*1024,withinBudget:after<=300*1024};
await writeFile('artifacts/expansion/bundle-budget.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
