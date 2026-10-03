import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const root='artifacts/test-results/mobile-hud';await mkdir(root,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:4358,strictPort:true},plugins:[{name:'mobile-hud-access',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/main.ts'))return code+'\nObject.assign(window,{__mobile:{get game(){return game},get input(){return input},get session(){return session},get world(){return world},multiplayer,cloud}});';}}]});
await server.listen();const browser=await chromium.launch({channel:process.env.CI?undefined:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const page=await ctx.newPage(),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
const shot=name=>page.screenshot({path:`${root}/${name}.png`});
const box=async id=>page.locator('#'+id).boundingBox();
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
try{
 await page.goto('http://127.0.0.1:4358');await page.locator('#guest-start').waitFor({timeout:60000});await shot('01-account');
 await page.locator('#guest-start').click();await page.locator('#start-name').fill('시발');await page.locator('#start-local').click();assert.equal(await page.locator('#explorer-editor').count(),0);
 await page.locator('#start-name').fill('탐험가123456789');await page.locator('#start-local').click();await page.locator('.explorer-preview canvas').waitFor({timeout:30000});
 await page.getByRole('tab',{name:'머리',exact:true}).click();await page.locator('[data-option="hair-6"]').click();await page.locator('[data-option="haircolor-9"]').click();
 await page.getByRole('tab',{name:'장식',exact:true}).click();await page.locator('[data-option="accessory-6"]').click();await shot('02-customize');
 const preview=await page.locator('.explorer-preview').boundingBox();await page.mouse.move(preview.x+preview.width/2,preview.y+80);await page.mouse.down();await page.mouse.move(preview.x+preview.width/2+80,preview.y+80,{steps:8});await page.mouse.up();
 await page.locator('#entry-next').click();await page.locator('.explorer-preview canvas').waitFor();await shot('03-preview');await page.locator('#entry-next').click();await page.locator('#loading').waitFor({state:'hidden',timeout:60000});
 assert.equal(await page.evaluate(()=>window.__mobile.game.save.explorerAppearance.hairId),'hair-6');assert.equal(await page.evaluate(()=>window.__mobile.multiplayer.connected),false);assert.equal(await page.evaluate(()=>window.__mobile.session.ai.bots.length),2);
 assert.equal(await page.locator('#room-progress').isVisible(),false);await page.waitForTimeout(350);
 assert.equal(await page.evaluate(()=>window.__mobile.world.player.getObjectByName('head').children[0].userData.explorerOwned),true);await shot('04-collapsed');
 const before=await box('joystick'),action=await box('action');await page.locator('#hud-toggle').click();await page.waitForTimeout(220);
 const pad=await box('joystick'),emoteButton=await box('emote-toggle');await page.mouse.move(pad.x+pad.width/2,pad.y+pad.height/2);await page.mouse.down();await page.mouse.move(emoteButton.x+emoteButton.width/2,emoteButton.y+emoteButton.height/2,{steps:8});await page.mouse.up();assert.equal(await page.locator('#emote-picker').isVisible(),false);
 assert.deepEqual(await box('joystick'),before);assert.deepEqual(await box('action'),action);assert.equal(await page.locator('#room-progress').getAttribute('aria-expanded'),'false');
 for(const [width,height] of [[320,568],[360,800],[390,844],[430,932]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const hud=await box('main-hud'),toggle=await box('hud-toggle'),settings=await box('settings'),time=await box('cycle-remaining'),income=await box('income-rate');
  assert.ok(hud.height<=80,`HUD height ${hud.height}`);assert.ok(hud.x>=0&&hud.x+hud.width<=width);assert.ok(!overlap(settings,toggle));assert.ok(!overlap(time,income));
  assert.ok(!overlap(await box('joystick'),await box('emote-toggle')));assert.ok(!overlap(await box('emote-toggle'),await box('action')));
  await page.locator('#room-progress').click();assert.equal(await page.locator('#room-progress').getAttribute('aria-expanded'),'true');await shot(`${width}-explorers`);
  await page.locator('#hud-toggle').click();assert.equal(await page.locator('#room-progress').getAttribute('aria-expanded'),'false');await page.locator('#hud-toggle').click();
  await page.locator('#emote-toggle').click();assert.equal(await page.locator('#emote-picker').isVisible(),true);assert.ok(!overlap(await box('emote-picker'),await box('joystick')));await shot(`${width}-emotes`);
  await page.locator('[data-emote="hello"]').click();assert.equal(await page.locator('#emote-picker').isVisible(),false);
  await page.locator('#settings').click();await page.locator('#friends-open').click();assert.equal(await page.locator('#friend-leave').count(),0);assert.equal(await page.locator('#room-code').count(),0);
  const input=await box('friend-code'),join=await box('friend-join');assert.ok(input.width>80&&input.height>=44&&!overlap(input,join));await shot(`${width}-friends`);await page.locator('#friend-close').click();
  results.push({width,height,hud,input});
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-top','47px');document.documentElement.style.setProperty('--safe-bottom','34px');});await page.waitForTimeout(200);assert.ok((await box('main-hud')).y>=47);await shot('safe-area');
 await page.locator('#settings').click();await page.locator('#customize-explorer').click();await page.locator('.explorer-wardrobe canvas').waitFor();await page.getByRole('tab',{name:'옷',exact:true}).click();await page.locator('[data-option="outfit-7"]').click();await page.locator('#wardrobe-save').click();assert.equal(await page.evaluate(()=>window.__mobile.game.save.explorerAppearance.outfitId),'outfit-7');
 await page.locator('#resume').click();await page.evaluate(()=>window.__mobile.cloud.persist());await page.reload();await page.locator('#start-local').waitFor({timeout:60000});assert.equal(await page.locator('#guest-start').count(),0);await page.locator('#start-local').click();await page.locator('#loading').waitFor({state:'hidden',timeout:60000});assert.equal(await page.evaluate(()=>window.__mobile.game.save.explorerAppearance.outfitId),'outfit-7');
 assert.deepEqual(errors,[]);await writeFile(`${root}/results.json`,JSON.stringify({results,errors,onboarding:true,persistence:true,device:'Chromium touch/mobile emulation; not physical iOS/Toss'},null,2));console.log('PASS onboarding, appearance persistence, compact HUD, 4 mobile sizes, panels, controls and safe area');
}finally{await browser.close();await server.close();}
