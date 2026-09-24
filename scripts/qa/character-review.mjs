import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {browserSession} from './lib.mjs';
import {writeCharacterGallery} from '../write-character-gallery.mjs';
const rows=JSON.parse(await readFile('docs/art/character-concepts.json','utf8'));
const session=await browserSession();
await mkdir('docs/art/previews',{recursive:true});
const decode=data=>Buffer.from(data.split(',')[1],'base64');
const requestedSheet=Number(process.argv[2]??0);
const fromSheet=Number(process.env.CHARACTER_REVIEW_FROM??0);
const stats=requestedSheet||fromSheet?JSON.parse(await readFile('docs/art/character-render-audit.json','utf8')):[];
try{
 const page=await session.browser.newPage();page.setDefaultTimeout(120000);
 await page.goto(`${session.url}/scripts/qa/character-review.html`);
 await page.waitForFunction(()=>!!window.review);
 for(let i=0;i<rows.length;i+=10){
  if(requestedSheet&&Math.floor(i/10)+1!==requestedSheet)continue;
  if(fromSheet&&Math.floor(i/10)+1<fromSheet)continue;
  const result=await page.evaluate(rows=>window.review(rows),rows.slice(i,i+10));
  await writeFile(`docs/art/previews/sheet-${String(i/10+1).padStart(2,'0')}.png`,decode(result.sheet));
  // First six use their authored portrait angles and 384px exports from first-six.mjs.
  for(const icon of result.icons)if(!/^pet-([0-5]|[12]\d\d|3[01]\d)$/.test(icon.key)&&!icon.key.startsWith('guardian-'))await writeFile(`public/models/${icon.key}.png`,decode(icon.png));
  for(const stat of result.stats){const index=stats.findIndex(r=>r.key===stat.key);if(index<0)stats.push(stat);else stats[index]=stat;}
  console.log(`Rendered ${Math.min(i+10,rows.length)}/${rows.length}`);
 }
 await writeFile('docs/art/character-render-audit.json',JSON.stringify(stats,null,2)+'\n');
 await writeCharacterGallery();
}finally{await session.close();}
