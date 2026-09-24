import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {browserSession} from './lib.mjs';
const rows=JSON.parse(await readFile('docs/art/character-concepts.json','utf8'));
const session=await browserSession();
await mkdir('docs/art/previews',{recursive:true});
const decode=data=>Buffer.from(data.split(',')[1],'base64');
const requestedSheet=Number(process.argv[2]??0);
const stats=requestedSheet?JSON.parse(await readFile('docs/art/character-render-audit.json','utf8')):[];
try{
 const page=await session.browser.newPage();page.setDefaultTimeout(120000);
 await page.goto(`${session.url}/scripts/qa/character-review.html`);
 await page.waitForFunction(()=>!!window.review);
 for(let i=0;i<rows.length;i+=10){
  if(requestedSheet&&Math.floor(i/10)+1!==requestedSheet)continue;
  const result=await page.evaluate(rows=>window.review(rows),rows.slice(i,i+10));
  await writeFile(`docs/art/previews/sheet-${String(i/10+1).padStart(2,'0')}.png`,decode(result.sheet));
  for(const icon of result.icons)await writeFile(`public/models/${icon.key}.png`,decode(icon.png));
  for(const stat of result.stats){const index=stats.findIndex(r=>r.key===stat.key);if(index<0)stats.push(stat);else stats[index]=stat;}
  console.log(`Rendered ${Math.min(i+10,rows.length)}/${rows.length}`);
 }
 await writeFile('docs/art/character-render-audit.json',JSON.stringify(stats,null,2)+'\n');
 const cards=rows.map((r,i)=>`<article data-stage="${r.stage}" data-kind="${r.boss?'boss':i<100?'legacy':'pet'}"><a href="previews/sheet-${String(Math.floor(i/10)+1).padStart(2,'0')}.png"><img loading="lazy" src="../../public/models/${r.key}.png" alt="${r.name}"></a><h2>${r.name}</h2><small>${r.key} · ${r.stage}단계</small><p>${r.concept}</p><p>${r.silhouette.join(' / ')}</p><p>${r.personality} · ${r.ecology}</p></article>`).join('');
 await writeFile('docs/art/character-gallery.html',`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>알콩 원정대 캐릭터 리워크</title><style>body{margin:24px;background:#f5efdb;color:#3e4833;font:15px sans-serif}header{position:sticky;top:0;background:#f5efdb;padding:12px 0}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}article{border:2px solid #b7bd91;border-radius:8px;padding:16px;background:#fff9e8}article[hidden]{display:none}img{width:144px;height:144px}h2{font-size:18px}small{color:#657051}select,input{font:inherit;padding:10px;max-width:100%;margin:4px}p{line-height:1.5}</style><header><h1>펫 300종 · 보스 21종</h1><p>이미지를 누르면 정면·측면·후면·45도·실루엣·32px 검수 시트를 엽니다. 플레이어는 변경하지 않았습니다.</p><input id="search" placeholder="이름 또는 ID"><select id="kind"><option value="">전체</option><option value="pet">스테이지 펫</option><option value="legacy">기존 수집 펫</option><option value="boss">보스</option></select><select id="stage"><option value="">모든 단계</option>${Array.from({length:20},(_,i)=>`<option>${i+1}</option>`).join('')}</select></header><main>${cards}</main><script>const controls=['search','kind','stage'].map(id=>document.getElementById(id));for(const c of controls)c.addEventListener('input',()=>{const [q,k,s]=controls.map(c=>c.value);for(const a of document.querySelectorAll('article'))a.hidden=!a.textContent.includes(q)||(k&&a.dataset.kind!==k)||(s&&a.dataset.stage!==s);});</script></html>`);
}finally{await session.close();}
