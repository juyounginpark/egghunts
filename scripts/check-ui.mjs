import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4317");
  await page.locator("#loading").waitFor({ state: "hidden", timeout: 30000 });
  const seed = await page.evaluate(async () => {
    const { freshSave } = await import("/src/game.ts");
    const { EGGS } = await import("/src/data.ts");
    const s = freshSave(Date.now());
    s.mongles.fill(1);
    s.active = [0, 1, 2];
    s.eggs = [4, 9, 14, 19, 24, 34].map((type, i) => ({
      id: `ui-${i}`,
      type,
      hp: EGGS[type].hp,
      distance: 140,
    }));
    s.selected = "ui-5";
    s.dust = 1000;
    return s;
  });
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("alkong:v1:local", JSON.stringify(s));
      sessionStorage.setItem("seeded", "1");
    }
  }, seed);
  await page.reload();
  await page.locator("#loading").waitFor({ state: "hidden" });
  for (const [width, height] of [
    [390, 844],
    [320, 568],
    [360, 640],
    [560, 900],
    [393, 851],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    const layout = await page.evaluate(() => {
      const rect = (id) => {
        const r = document.getElementById(id).getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      };
      return {
        shell: rect("shell"),
        inventory: rect("inventory"),
        top: rect("top-hud"),
        bottom: rect("bottom-hud"),
        controls: rect("controls"),
        queue: rect("egg-queue"),
        slots: document.querySelectorAll(".egg-slot").length,
      };
    });
    assert.equal(layout.slots, 6);
    const pixels=await page.locator('#world canvas').evaluate(c=>({w:c.width,h:c.height,cssW:parseFloat(c.style.width),cssH:parseFloat(c.style.height),filter:getComputedStyle(c).imageRendering}));
    assert.equal(pixels.cssW/pixels.w,1);
    assert.equal(pixels.cssH/pixels.h,1);
    assert.equal(pixels.filter,'auto');
    assert.ok(
      layout.top.bottom < layout.bottom.y,
      `HUD overlap ${width}x${height}`,
    );
    assert.ok(
      layout.inventory.bottom <= layout.controls.y,
      `Inventory overlaps controls ${width}x${height}`,
    );
    assert.ok(
      layout.queue.right === 0 || (layout.queue.right <= layout.shell.right &&
        layout.queue.x >= layout.shell.x),
    );
    await page.screenshot({ path: `artifacts/explore-${width}x${height}.png` });
    console.log(`PASS layout ${width}x${height}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('[data-tab="pets"]');await page.click('[data-tab="collection"]');
  await page.click(".rarity-guide summary");
  let total=0;for(let region=0;region<5;region++){await page.click(`[data-region="${region}"]`);total+=await page.locator(".friend").count();}assert.equal(total,100);await page.click('[data-region="0"]');
  assert.equal(await page.locator(".rarity-guide tbody tr").count(), 7);
  await page.screenshot({ path: "artifacts/collection.png" });
  await page.click('[data-tab="pets"]');await page.click('[data-companion="0"]');
  assert.match(await page.locator("#pet-effects").textContent(), /2\/3/);
  await page.click('[data-tab="hatchery"]');
  await page.screenshot({ path: "artifacts/hatchery.png" });
  await page.click('[data-tab="explore"]');
  await page.goto("http://localhost:4317/?qa=true&scene=night");
  await page.waitForFunction(()=>window.__qa&&document.getElementById('shell')?.dataset.mode);
  await page.locator("#loading").waitFor({state:"hidden"});
  assert.equal(await page.locator("#shell").getAttribute("data-mode"),"base");
  assert.equal(await page.locator("#night-curtain").isVisible(),true);
  await page.goto("http://localhost:4317/?qa=true&scene=egg-near");
  await page.waitForFunction(()=>window.__qa&&document.getElementById('shell')?.dataset.mode);
  await page.locator("#loading").waitFor({state:"hidden"});
  assert.equal(await page.locator("#shell").getAttribute("data-mode"),"expedition");
  for (const selector of ["nav", "#inventory", ".brand", ".status", "#region-sub"])
    assert.equal(await page.locator(selector).isVisible(), false, selector);
  assert.equal(await page.locator("#settings").isVisible(), true);
  assert.equal(await page.locator("#joystick").isVisible(), true);
  assert.equal(await page.locator("#action").isVisible(), true);
  assert.equal(await page.locator("#hint").isVisible(), false);
  await page.screenshot({ path: "artifacts/voxel-expedition.png" });
  for (const [width,height] of [[320,568],[360,640],[560,900],[844,390]]) {
    await page.setViewportSize({width,height});
    const free=await page.evaluate(()=>{
      const top=document.getElementById("top-hud").getBoundingClientRect();
      const bottom=document.getElementById("bottom-hud").getBoundingClientRect();
      return bottom.top-top.bottom;
    });
    assert.ok(free>height*.35, `Expedition world too obscured ${width}x${height}: ${free}`);
  }
  await page.goto("http://localhost:4317/?qa=true&scene=base");
  await page.waitForFunction(()=>window.__qa&&document.getElementById('shell')?.dataset.mode);
  await page.locator("#loading").waitFor({state:"hidden"});
  assert.equal(await page.locator("nav").isVisible(),true);
  assert.equal(await page.locator("#inventory").isVisible(),false);
  await page.click('[data-tab="hatchery"]');
  assert.equal(await page.locator("#inventory").isVisible(),true);
  const missing=await page.locator("img").evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));
  assert.deepEqual(missing, []);
  await page.setViewportSize({width:393,height:851});
  await page.click('#settings');
  await page.selectOption('#quality-setting','low');
  await page.click('#resume');
  const lowPixels=await page.locator('#world canvas').evaluate(c=>[parseFloat(c.style.width)/c.width,parseFloat(c.style.height)/c.height]);
  assert.deepEqual(lowPixels,[3,3]);
  await page.screenshot({ path: "artifacts/secret-night.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS 100 pets, rarity table, equipment UI, night gate and hatchery-only inventory, no browser errors",
  );
} finally {
  await browser.close();
}
