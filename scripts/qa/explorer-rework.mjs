import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const root='artifacts/test-results/explorer-rework';await mkdir(root,{recursive:true});
const vite=await createServer({cacheDir:'node_modules/.vite-explorer-rework',server:{host:'127.0.0.1',port:4359,strictPort:true}});await vite.listen();
const {ExplorerGeometry}=await vite.ssrLoadModule('/src/explorer-geometry.ts');
const area=g=>{const p=g.attributes.position;let area=0;for(let i=0;i<p.count;i+=3){const a=[0,1,2].map(k=>p.array[(i+1)*3+k]-p.array[i*3+k]),b=[0,1,2].map(k=>p.array[(i+2)*3+k]-p.array[i*3+k]);area+=Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])/2;}return area;};
for(const [offset,expected]of [[0,24],[1,32],[2,40]]){const g=new ExplorerGeometry();g.box(0,0,0,2,2,2,'red');g.box(offset,0,0,2,2,2,'blue');const mesh=g.finish();assert.ok(Math.abs(area(mesh)-expected)<1e-5);mesh.dispose();}
console.log('PASS solid surface area: identical, intersecting and adjacent boxes');
const browser=await chromium.launch({channel:process.env.CI?undefined:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/review.html',route=>route.fulfill({contentType:'text/html',body:'<html><body style="margin:0;background:#ece9da"></body></html>'}));
 await page.goto('http://127.0.0.1:4359/review.html');
 await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),{loadVoxels,voxelModel}=await import('/src/voxel.ts'),{applyExplorerAppearance,disposeExplorerAppearance}=await import('/src/explorer-model.ts'),{normalizeAppearance,APPEARANCE_OPTIONS}=await import('/src/explorer-appearance.ts');
  await loadVoxels(['alkong']);
  const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(240,280);renderer.setClearColor('#ece9da');
  const scene=new T.Scene();scene.add(new T.HemisphereLight(0xfffae9,0x758259,2.2));const sun=new T.DirectionalLight(0xffedc6,2.6);sun.position.set(-3,5,4);scene.add(sun);
  const camera=new T.PerspectiveCamera(30,240/280,.1,30);camera.position.set(0,.73,2.9);camera.lookAt(0,.57,0);
  const rig=voxelModel('alkong',true);scene.add(rig);
  window.review=async(key,angle)=>{
   const options=APPEARANCE_OPTIONS[key],canvas=document.createElement('canvas');canvas.width=960;canvas.height=Math.ceil(options.length/4)*312;const ctx=canvas.getContext('2d');ctx.fillStyle='#ece9da';ctx.fillRect(0,0,canvas.width,canvas.height);const triangles=[];
   for(let i=0;i<options.length;i++){
    const a=normalizeAppearance({headAccessoryId:'headwear-0',hairId:'hair-0',hairColorId:'haircolor-1',backpackId:'backpack-7',[key]:options[i].id});applyExplorerAppearance(rig,a);rig.rotation.y=angle;
    if(key==='hairId'){
     const head=rig.getObjectByName('head').children.find(o=>o.isMesh),probe=new T.Mesh(head.geometry,head.material);probe.updateMatrixWorld(true);
     const hit=new T.Raycaster(new T.Vector3(0,3/18,-1),new T.Vector3(0,0,1)).intersectObject(probe)[0];
     if(!hit)throw Error(`Missing rear scalp ${options[i].id}`);
     const rgb=head.geometry.attributes.color,c=new T.Color('#64422f'),v=hit.face.a;
     if(Math.abs(rgb.getX(v)-c.r)+Math.abs(rgb.getY(v)-c.g)+Math.abs(rgb.getZ(v)-c.b)>.001)throw Error(`Exposed rear scalp ${options[i].id}`);
    }
    rig.traverse(o=>{if(o.isMesh){if(![...o.geometry.attributes.position.array].every(Number.isFinite))throw Error('non-finite geometry');}});
    renderer.render(scene,camera);triangles.push(renderer.info.render.triangles);const x=i%4*240,y=Math.floor(i/4)*312;ctx.drawImage(renderer.domElement,x,y);ctx.fillStyle='#354b35';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText(`${options[i].id} ${options[i].label}`,x+120,y+300);
   }
   document.body.replaceChildren(canvas);return {png:canvas.toDataURL(),triangles};
  };
  window.finishReview=()=>{disposeExplorerAppearance(rig);renderer.dispose();renderer.forceContextLoss();};
 });
 const results=[];
 for(const [key,angle,name]of [['outfitId',.35,'outfits-front'],['outfitId',Math.PI-.35,'outfits-back'],['hairId',.4,'hair-front'],['hairId',Math.PI-.4,'hair-back'],['backpackId',Math.PI-.4,'backpacks'],['headAccessoryId',.35,'headwear']]){
  const result=await page.evaluate(([key,angle])=>window.review(key,angle),[key,angle]);await writeFile(`${root}/${name}.png`,Buffer.from(result.png.split(',')[1],'base64'));assert.ok(Math.max(...result.triangles)<20000);results.push({name,count:result.triangles.length,maxTriangles:Math.max(...result.triangles)});console.log('PASS',name,result.triangles.length,'variants, max triangles',Math.max(...result.triangles));
 }
 await page.evaluate(()=>window.finishReview());assert.deepEqual(errors,[]);await writeFile(`${root}/results.json`,JSON.stringify({surfaceArea:true,results,errors,device:'Headless Chromium/software rendering, not physical mobile'},null,2));
}finally{await browser.close();await vite.close();}
