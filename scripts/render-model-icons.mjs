import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
const manifest=JSON.parse(await readFile('public/models/manifest.json','utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.goto('http://localhost:4317');
 await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
 await page.evaluate(async()=>{
   const T=await import('/node_modules/three/build/three.module.js');
   const {loadVoxels,voxelModel}=await import('/src/voxel.ts');
   const renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});
   renderer.setSize(96,96); renderer.setClearColor(0,0);
   const scene=new T.Scene(); scene.add(new T.HemisphereLight(0xfffae9,0x758259,2.5));
   const sun=new T.DirectionalLight(0xfff0ce,3);sun.position.set(-3,7,5);scene.add(sun);
   const camera=new T.OrthographicCamera(-.9,.9,.9,-.9,.1,30);camera.position.set(3,2.5,4);camera.lookAt(0,.5,0);
   window.renderIcon=async(name)=>{
     await loadVoxels([name]); const model=voxelModel(name);scene.add(model);
     renderer.render(scene,camera);const result=renderer.domElement.toDataURL('image/png').split(',')[1];scene.remove(model);return result;
   };
 });
 for(const {name} of manifest.models){
   const image=await page.evaluate(name=>window.renderIcon(name),name);
   await writeFile(`public/models/${name}.png`,Buffer.from(image,'base64'));
 }
 console.log(`Rendered ${manifest.models.length} voxel thumbnails`);
} finally {await browser.close();}
