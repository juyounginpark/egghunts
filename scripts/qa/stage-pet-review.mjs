import {readFile,writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';import {browserSession} from './lib.mjs';
const sample=process.argv.includes('--sample'),sampleIds=[100,103,108,120,125,128,160,168,210,218,290,298,300,311,319];
const secrets=process.argv.includes('--secrets'),refresh=process.argv.includes('--refresh')||secrets;
const stages=process.argv.slice(2).filter(s=>!s.startsWith('--')).map(Number);const selected=sample?[1,3,7,12,20]:stages.length?stages:Array.from({length:20},(_,i)=>i+1);
const rows=JSON.parse(await readFile('docs/art/stage-pet-designs.json','utf8'));const session=await browserSession(),stats=refresh?JSON.parse(await readFile('docs/art/stage-render-all-audit.json','utf8')).stats:[],errors=[];
const png=s=>Buffer.from(s.split(',')[1],'base64');
try{
 const page=await session.browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(`${session.url}/scripts/qa/stage-pet-review.html`);await page.waitForFunction(()=>!!window.reviewStage);
 await mkdir('docs/art/previews/stages',{recursive:true});await mkdir('public/models/stage-previews',{recursive:true});
 for(const stage of selected){
  const batch=rows.filter(r=>r.stage===stage&&(!sample||sampleIds.includes(r.id))&&(!refresh||(secrets?r.secretDragon:[3,6].includes(r.slot))));const result=await page.evaluate(rows=>window.reviewStage(rows),batch);
  if(!refresh)await writeFile(`docs/art/previews/stages/${sample?'sample-':''}stage-${stage}.png`,png(result.sheet));
  for(const r of result.output){
   await writeFile(`public/models/pet-${r.id}.png`,png(r.images[0]));
   await writeFile(`public/models/stage-previews/pet-${r.id}-silhouette.png`,png(r.images[4]));
   await writeFile(`public/models/stage-previews/pet-${r.id}-gray.png`,png(r.images[5]));
   await writeFile(`public/models/stage-previews/pet-${r.id}-views.png`,png(r.sheet));
   await writeFile(`public/models/stage-previews/pet-${r.id}-idle.png`,png(r.strip));
   await writeFile(`public/models/stage-previews/pet-${r.id}-greeting.png`,png(r.greeting));
   assert.notDeepEqual(r.poses[0],r.poses[10],`${r.id}: head idle`);const stat={id:r.id,triangles:r.triangles,animated:true},index=stats.findIndex(s=>s.id===r.id);if(index>=0)stats[index]=stat;else stats.push(stat);
  }
  console.log(`Rendered stage ${stage}: ${batch.filter(r=>!r.secretDragon).length} ordinary + ${batch.filter(r=>r.secretDragon).length} secret, views and idle.`);
  if(refresh){const sheet=await page.evaluate(async rows=>{
   const canvas=document.createElement('canvas');canvas.width=1152;canvas.height=576;const ctx=canvas.getContext('2d');ctx.fillStyle='#f5efdb';ctx.fillRect(0,0,1152,576);
   for(const [i,r]of rows.entries()){
    const x=i%6*192,y=Math.floor(i/6)*288;ctx.fillStyle=r.secretDragon?'#eadab3':'#fff9e8';ctx.fillRect(x+4,y+4,184,276);
    for(const silhouette of [false,true]){const img=new window.Image();img.src=`/models/${silhouette?'stage-previews/':''}pet-${r.id}${silhouette?'-silhouette':''}.png?refresh=${Date.now()}`;await img.decode();ctx.drawImage(img,x+(silhouette?74:4),y+(silhouette?228:4),silhouette?44:184,silhouette?44:184);}
    ctx.fillStyle='#3e4833';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(r.name,x+96,y+206,178);ctx.font='11px sans-serif';ctx.fillText(r.secretDragon?'SECRET':r.role,x+96,y+223,178);
   }return canvas.toDataURL();
  },rows.filter(r=>r.stage===stage));await writeFile(`docs/art/previews/stages/stage-${stage}.png`,png(sheet));}
 }
 assert.deepEqual(errors,[]);await writeFile(`docs/art/stage-render-${sample?'sample':selected.length===20?'all':'pilot'}-audit.json`,JSON.stringify({stats,errors},null,2)+'\n');
}finally{await session.close();}
