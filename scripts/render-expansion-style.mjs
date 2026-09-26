// Explicit same-camera comparisons requested by the supplied official art guide.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {PNG} from 'pngjs';
const refs=JSON.parse(await readFile('docs/art/expansion-style-references.json','utf8'));
const ids=process.argv.includes('--all')?Object.keys(refs).map(Number):[323,370,643];
const root='artifacts/expansion-style';await mkdir(root,{recursive:true});
const server=await createServer({optimizeDeps:{entries:['scripts/qa/expansion-art.html']},server:{host:'127.0.0.1',port:4333,strictPort:true,watch:null,hmr:false}});await server.listen();
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4333/scripts/qa/expansion-art.html');await page.waitForFunction(()=>!!window.renderStyleComparison);
 for(const id of ids){
  const pair=refs[id];
  for(const night of [false,true]){
   const images=await page.evaluate(({ids,night})=>window.renderStyleComparison(ids,night),{ids:[pair.form.id,pair.material.id,id],night});
   const sheet=new PNG({width:768,height:352});sheet.data.fill(night?45:244);
   for(let i=0;i<3;i++){
    const source=PNG.sync.read(Buffer.from(images[i].split(',')[1],'base64'));
    for(const size of [256,80])for(let y=0;y<size;y++)for(let x=0;x<size;x++){
     const a=(Math.floor(y*256/size)*256+Math.floor(x*256/size))*4,b=((y+(size===80?264:0))*768+i*256+x+(size===80?88:0))*4,alpha=source.data[a+3]/255;
     for(let c=0;c<3;c++)sheet.data[b+c]=Math.round(source.data[a+c]*alpha+(night?45:244)*(1-alpha));sheet.data[b+3]=255;
    }
   }
   await writeFile(`${root}/pet-${id}-${night?'dim':'neutral'}.png`,PNG.sync.write(sheet));
  }
  if((id-321)%19===18||ids.length===3)console.log(`Style comparison ${id}`);
 }
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(`${root}/index.html`,`<!doctype html><meta charset="utf-8"><title>공식 스타일 비교</title><style>body{background:#ddd;font:16px system-ui}img{width:min(100%,768px);display:block}</style><h1>형태 참조 / 소재 참조 / 신규</h1><p>각 행 동일 카메라·조명·축척. 아래 80px 축소. 어두운 조명은 검수 조건이며 실제 스테이지 야간과 구분.</p>${ids.map(id=>`<h2>ID ${id} · ${refs[id].form.reference} / ${refs[id].material.reference}</h2><img loading="lazy" src="pet-${id}-neutral.png"><img loading="lazy" src="pet-${id}-dim.png">`).join('')}`);
}finally{await browser.close();await server.close();}
