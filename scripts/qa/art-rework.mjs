// Explicitly requested visual audit; uses production model/rendering modules.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {ready} from './lib.mjs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{port:4324,strictPort:true,host:'127.0.0.1'},plugins:[{name:'art-review-fixture',enforce:'pre',transform(code,id){
 if(id.replaceAll('\\','/').endsWith('/src/main.ts'))return code.replace('ready = true;','ready = true; window.__art={world,game};');
}}]});await server.listen();
const browser=await chromium.launch({channel:'msedge',headless:true});
const root='artifacts/art-rework',session={browser,url:'http://127.0.0.1:4324',close:async()=>{await browser.close();await server.close();}},errors=[],checks=[];
await mkdir(root,{recursive:true});
const bytes=s=>Buffer.from(s.split(',')[1],'base64');
async function sheet(images,columns,name,cell=320){
 const out=new PNG({width:columns*cell,height:Math.ceil(images.length/columns)*cell});out.data.fill(245);
 for(const [i,buffer]of images.entries()){const p=PNG.sync.read(buffer);for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
  const a=(Math.floor(y*p.height/cell)*p.width+Math.floor(x*p.width/cell))*4,b=((Math.floor(i/columns)*cell+y)*out.width+i%columns*cell+x)*4,alpha=p.data[a+3]/255;
  for(let c=0;c<3;c++)out.data[b+c]=Math.round(p.data[a+c]*alpha+245*(1-alpha));out.data[b+3]=255;
 }}await writeFile(`${root}/${name}.png`,PNG.sync.write(out));
}
try{
 const page=await session.browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(`${session.url}/scripts/qa/art-rework.html`);await page.waitForFunction(()=>!!window.artReview);
 const pairs=[],environments=[],finishes=[],eggs=[],dragons=[];
 for(const id of [120,130,280,302,303,318]){const output=await page.evaluate(id=>window.artReview.beforeAfter(id),id);pairs.push(...output.map(bytes));}
 await sheet(pairs,2,'before-after');
 for(const stage of [3,4,19]){const output=await page.evaluate(stage=>window.artReview.environment(stage),stage);environments.push(...output.map(bytes));}
 await sheet(environments,2,'environment-before-after',640);
 for(let stage=1;stage<=20;stage++){
  const pair=await page.evaluate(stage=>window.artReview.eggPair(stage),stage);eggs.push(...pair.images.map(bytes));
  const sample=await page.evaluate(id=>window.artReview.specimen(id),299+stage);assert.ok(sample.mismatch<1e-5,`static and rig bounds ${stage}: ${sample.mismatch}`);finishes.push(...sample.images.map(bytes));
  dragons.push(await readFile(`public/models/pet-${299+stage}.png`));checks.push({stage,name:pair.name,staticRigError:sample.mismatch});console.log(`Art comparison ${stage}/20`);
 }
 await sheet(eggs,4,'egg-hatch-correspondence');await sheet(finishes,4,'gray-color-effects-dark');await sheet(dragons,5,'twenty-dragons');
 await page.setViewportSize({width:390,height:844});await ready(page,session.url,'base');
 const gameplay=[];
 for(const stage of [3,4,19]){
  await page.evaluate(stage=>{
   window.__qa.region(stage,-34);const {game}=window.__art,ids=[100+(stage-1)*10,103+(stage-1)*10,299+stage];
   for(const id of ids)game.save.mongles[id]=1;game.save.active=ids;game.revision++;
  },stage);
  await page.waitForFunction(()=>window.__art.world.companions.children.length===3);await page.waitForTimeout(600);
  const metrics=await page.evaluate(()=>window.__qa.metrics());assert.ok(metrics.calls<250);assert.ok(metrics.triangles<500000);gameplay.push({stage,...metrics});
  await page.screenshot({path:`${root}/mobile-stage-${stage}-pets.png`});
 }
 assert.deepEqual(errors,[]);await writeFile(`${root}/visual-audit.json`,JSON.stringify({checks,gameplay,errors},null,2));
 const files=['before-after','environment-before-after','twenty-dragons','egg-hatch-correspondence','gray-color-effects-dark'];
 await writeFile(`${root}/index.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{background:#ece8dc;font:16px system-ui;max-width:1280px;margin:auto;padding:20px}img{width:100%;height:auto}a{color:#356}h2{margin-top:48px}</style><h1>전체 아트 검수</h1><p>전후: 각 행 왼쪽 기존 / 오른쪽 변경. 동일 카메라·조명. 환경은 비교용 지형 렌더이며 실제 플레이 화면은 별도 링크.</p><p>알 대응: 일반 알·대표 후보 / 드래곤 알·전용 드래곤. 일반 알은 특정 결과를 보장하지 않음.</p><p>재질 비교: 회색 / 컬러 / 효과 / 어두운 배경.</p><a href="play/contact-sheet.png">20개 실제 플레이 화면</a> · <a href="../../docs/art/stage-gallery.html">220종 도감</a>${files.map(f=>`<h2>${f}</h2><img src="${f}.png" loading="lazy">`).join('')}</html>`);
}finally{await session.close();}
