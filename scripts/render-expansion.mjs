// Creates runtime thumbnails and review sheets through the actual game renderer.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
const rows=JSON.parse(await readFile('docs/art/expansion-id-map.json','utf8'));
const legacySource=await readFile('src/stage-pet-catalog.ts','utf8'),legacy=JSON.parse(legacySource.slice(legacySource.indexOf('['),legacySource.lastIndexOf(']')+1));
const stages=process.argv.slice(2).map(Number),chosen=stages.length?rows.filter(r=>stages.includes(r.stageId)):rows;
const server=await createServer({server:{host:'127.0.0.1',port:4331,strictPort:true}});await server.listen();
const browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir('artifacts/expansion',{recursive:true});const records=[],errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4331/scripts/qa/expansion-art.html');await page.waitForFunction(()=>!!window.renderExpansion);
 for(const row of chosen){
  const {image,animated,...record}=await page.evaluate(id=>window.renderExpansion(id),row.id);
  assert.ok(record.mismatch<1e-5,`static/rig mismatch ${row.id}`);
  assert.ok(Number.isFinite(record.bottom)&&record.triangles>0,`empty model ${row.id}`);
  assert.notEqual(image,animated,`missing idle ${row.id}`);
  await writeFile(`public/models/pet-${row.id}.png`,Buffer.from(image.split(',')[1],'base64'));
  records.push({id:row.id,...record});
  if((row.id-321)%19===18)console.log(`Thumbnails ${row.stageId}/20`);
 }
 for(const stage of new Set(chosen.map(r=>r.stageId))){
  const group=chosen.filter(r=>r.stageId===stage),sheet=new PNG({width:5*256,height:4*256});sheet.data.fill(244);
  const comparison=[{id:100+legacy.findIndex(p=>p.stageId===stage)},...group];
  for(const [i,row]of comparison.entries()){
   const source=PNG.sync.read(await readFile(`public/models/pet-${row.id}.png`));
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const a=(Math.floor(y*source.height/256)*source.width+Math.floor(x*source.width/256))*4,b=((Math.floor(i/5)*256+y)*sheet.width+i%5*256+x)*4,alpha=source.data[a+3]/255;
    for(let c=0;c<3;c++)sheet.data[b+c]=Math.round(source.data[a+c]*alpha+244*(1-alpha));sheet.data[b+3]=255;
   }
  }
  await writeFile(`artifacts/expansion/stage-${stage}.png`,PNG.sync.write(sheet));console.log(`Rendered stage ${stage}: ${group.length} models`);
 }
 assert.deepEqual(errors,[]);await writeFile('artifacts/expansion/render-audit.json',JSON.stringify({records,errors},null,2));
 await writeFile('docs/art/expansion-gallery.html',`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>신규 380종</title><style>body{font:16px system-ui;background:#ede8df;margin:24px}section{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}article{background:#fff8ed;padding:12px;border-radius:12px}img{width:100%}small{display:block}</style><h1>신규 캐릭터 380종</h1><p>기존 321개 ID 보존 · 스테이지별 19종 추가 · 생성 모델의 실제 렌더링</p>${Array.from({length:20},(_,i)=>`<h2>스테이지 ${i+1}</h2><section>${rows.filter(r=>r.stageId===i+1).map(r=>`<article><img loading="lazy" src="../../public/models/pet-${r.id}.png"><b>${r.name}</b><small>${r.key} · ID ${r.id} · ${['C','B','A','S','SS','SSS'][r.tier]}</small></article>`).join('')}</section>`).join('')}</html>`);
}finally{await browser.close();await server.close();}
