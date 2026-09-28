import {readFile,writeFile} from 'node:fs/promises';
import {browserSession} from './qa/lib.mjs';
const rows=JSON.parse(await readFile('docs/art/stage-pet-designs.json','utf8')).filter(r=>[100,290].includes(r.id));
const session=await browserSession();
try{
 const page=await session.browser.newPage();
 await page.goto(`${session.url}/scripts/qa/stage-pet-review.html`);
 await page.waitForFunction(()=>!!window.reviewStage);
 const result=await page.evaluate(rows=>window.reviewStage(rows),rows);
 for(const pet of result.output){
  const images={'':pet.images[0],'-silhouette':pet.images[4],'-gray':pet.images[5],'-views':pet.sheet,'-idle':pet.strip,'-greeting':pet.greeting};
  for(const [suffix,data] of Object.entries(images))await writeFile(`public/models/${suffix?'stage-previews/':''}pet-${pet.id}${suffix}.png`,Buffer.from(data.split(',')[1],'base64'));
 }
 console.log('Rendered pet-100 and pet-290 portraits, silhouettes and animation strips.');
}finally{await session.close();}
