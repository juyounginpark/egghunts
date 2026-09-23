import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const dir = await mkdtemp(join(tmpdir(), "egghunts-test-"));
try {
  for (const name of ["data", "stage-data", "progression", "hazards", "game"]) {
    const source=(await readFile(`src/${name}.ts`,'utf8')).replace(/from "\.\/([\w-]+)"/g,'from "./$1.mjs"');
    await writeFile(
      join(dir, `${name}.mjs`),
      ts.transpile(source, {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      }),
    );
  }
  const { GameState, freshSave, parseSave } = await import(
    pathToFileURL(join(dir, "game.mjs"))
  );
  const { EGGS, MONGLES, RARITIES, rollEgg, rarityChances } = await import(
    pathToFileURL(join(dir, "data.mjs"))
  );
  let clock = 1000000;
  const make = (random = () => 0.1) =>
    new GameState(freshSave(clock), () => clock, random);
  let passed = 0;
  function check(name, fn) {
    clock=1000000;
    fn();
    passed++;
    console.log(`PASS ${name}`);
  }
  function steal(g, region = 0) {
    const e = g.world.find((e) => e.guardian === region);
    g.x = e.x;
    g.z = e.z;
    g.interact();
    return e;
  }
  check("35 eggs, 100 unique pets, probability totals 100%", () => {
    assert.equal(EGGS.length, 35);
    assert.equal(MONGLES.length, 100);
    assert.equal(new Set(MONGLES.map((m) => m.name)).size, 100);
    assert.ok(
      Math.abs(RARITIES.reduce((n, r) => n + r.chance, 0) - 100) < 1e-9,
    );
  });
  check("all rarity probability boundaries and biome pools", () => {
    for (let region = 0; region < 5; region++) {
      let offset = 0;
      const chances = rarityChances(region);
      assert.ok(Math.abs(chances.reduce((a,b)=>a+b,0)-100)<1e-9);
      chances.forEach((chance, tier) => {
        assert.equal(rollEgg(region, () => (offset + chance / 2) / 100), tier * 5 + region);
        assert.equal(rollEgg(region, () => (offset + chance - 1e-7) / 100), tier * 5 + region);
        assert.ok(MONGLES.some((m) => m.region === region && m.tier === tier));
        offset += chance;
      });
    }
    assert.equal(EGGS[rollEgg(0, () => 0.99799)].rarity, "SSS");
    assert.equal(EGGS[rollEgg(0, () => 0.99801)].rarity, "Secret");
    assert.deepEqual(rarityChances(4), rarityChances(0));
  });
  check("five eggs per stage in front of guardian", () => {
    const g = make();
    assert.equal(g.world.length, 100);
    g.route.forEach((b, i) => {
      const eggs = g.world.filter((e) => e.guardian === i);
      assert.equal(eggs.length, 5);
      eggs.forEach((e) => {
        assert.equal(EGGS[e.type].region, Math.floor((b.stage-1)/4));
        assert.ok(e.z > -b.home - 3);
      });
    });
  });
  // Latest design supersedes immediate boss egg theft and combat buttons.
  check("theft wakes guardian; contact during attack telegraph keeps HP and egg",()=>{
    const g=make(),egg=steal(g);g.deadline=clock+45000;g.bosses[0].x=g.x;g.bosses[0].z=g.z;g.tick(.7);
    assert.equal(g.bosses[0].mode,'chase');assert.equal(g.carried.id,egg.id);assert.equal(g.hp,g.maxHp);
  });
  check("boss hit drops carried egg even across old secured boundary",()=>{
    const g=make();g.selectStage(5);const egg=steal(g,1);g.deadline=clock+45000;g.carried.secured=true;g.receiveHit(1);
    assert.equal(g.carried,null);assert.ok(g.hp<g.maxHp);assert.ok(g.world.some(e=>e.id===egg.id));
  });
  check("manual drop remains available for repick instead of guardian theft",()=>{
    const g=make(),egg=steal(g,2);g.interact();g.tick(.01);assert.ok(g.world.some(e=>e.id===egg.id));g.interact();assert.equal(g.carried.id,egg.id);
  });
  check("growth shortens the same carrying return route",()=>{
    const run=upgrade=>{const g=make();g.save.upgrades.speed=upgrade;steal(g,2);let seconds=0;while(g.z<-58&&seconds<20){g.move(0,1,.05);g.tick(.05);seconds+=.05;}return seconds;};
    assert.ok(run(6)<run(0));
  });
  check("base stores egg and full inventory never deletes carried egg", () => {
    const g = make();
    const egg = steal(g);
    g.deadline = clock + 40000;
    g.x = 0;
    g.z = 0;
    g.tick(0.01);
    assert.equal(g.save.eggs[0].id, egg.id);
    assert.equal(g.carried, null);
    g.save.eggs = Array.from({ length: 6 }, (_, i) => ({
      ...egg,
      id: `stored-${i}`,
    }));
    const next = steal(g);
    g.deadline = clock + 40000;
    g.x = g.z = 0;
    g.tick(0.01);
    assert.equal(g.carried.id, next.id);
  });
  check("night rerolls 100 eggs once and announces Secret regions", () => {
    const g = make(() => 0.9999);
    const before = g.world[0].id;
    clock = g.nightAt;
    g.tick(0.01);
    assert.equal(g.world.length, 100);
    assert.notEqual(g.world[0].id, before);
    assert.ok(g.announcement.includes("SECRET"));
    assert.equal(g.world.filter(e=>e.stageId===20).length,5);
    assert.equal(g.announcementId, 1);
    assert.ok(g.isNight);
    g.tick(0.01);
    assert.equal(g.announcementId, 1);
  });
  check("ordinary night does not emit Secret announcement", () => {
    const g = make();
    clock = g.nightAt;
    g.tick(0.01);
    assert.ok(!g.announcement.includes("SECRET"));
  });
  check("night refresh preserves carried egg, position and open route",()=>{
    const g=make();const e=steal(g,3);const position=[g.x,g.z];
    const onset=g.nightAt;clock=onset;g.tick(.01);assert.equal(g.nightAt-onset,180000);
    assert.equal(g.carried.id,e.id);assert.deepEqual([g.x,g.z],position);assert.equal(g.world.length,99);
    assert.ok(!g.world.some(v=>v.id===e.id));g.move(0,-1,1);assert.ok(g.z<position[1]);
  });
  check("all egg tiers hatch a matching biome and rarity pet", () => {
    EGGS.forEach((e, type) => {
      const g = make();
      g.save.eggs = [{ id: "hatch", type, hp: e.hp, distance: 10 }];
      g.save.selected = "hatch";
      g.damage(e.hp);
      assert.notEqual(g.result, null);
      assert.equal(MONGLES[g.result].region, e.region);
      assert.equal(MONGLES[g.result].tier, e.tier);
    });
  });
  check("night refresh preserves dropped egg for recovery",()=>{
    const g=make();const e=steal(g,1);g.z=-27;g.interact();clock=g.nightAt;g.tick(.01);
    assert.ok(g.world.some(v=>v.id===e.id));assert.equal(g.world.length,100);
  });
  check(
    "old-night recovered egg replaces its nest without creating a sixth egg",
    () => {
      const g = make();
      const e = steal(g);
      clock = g.nightAt;
      g.tick(0.01);
      g.carried=null;g.restoreEgg(e, 0);
      assert.equal(g.world.filter((v) => v.guardian === 0).length, 5);
      assert.ok(g.world.some((v) => v.id === e.id));
    },
  );
  check("old three-pet saves migrate without losing eggs", () => {
    const save = freshSave(clock);
    save.mongles = [1, 2, 3];
    save.active = [1];
    save.eggs = [{ id: "legacy", type: 1, hp: 400, distance: 33 }];
    const migrated = parseSave(JSON.stringify(save), clock);
    assert.equal(migrated.mongles.length, 100);
    assert.equal(migrated.mongles[2], 3);
    assert.equal(migrated.eggs[0].id, "legacy");
  });
  check(
    "reload preserves escaped status, pursuing boss, and night clock",
    () => {
      const g = make();
      steal(g, 1);
      g.z = -27;
      g.deadline = clock + 40000;
      g.tick(0.01);
      const restored = new GameState(
        parseSave(JSON.stringify(g.snapshot()), clock),
        () => clock,
      );
      assert.equal(restored.carried.id, g.carried.id);
      assert.equal(restored.bosses[1].target, g.carried.id);
      assert.equal(restored.nightAt, g.nightAt);
      assert.equal(restored.world.length, 99);
    },
  );
  check(
    "equipped pets multiply speed, auto and clicks without changing night or duration",
    () => {
      const g = make();
      const speed = g.speed,
        dps = g.dps,
        duration = g.duration;
      g.save.active = [1, 2, 3];
      assert.ok(g.speed > speed);
      assert.ok(g.dps > dps);
      assert.equal(g.duration, duration);
      assert.ok(g.clickMultiplier > 1);
    },
  );
  console.log(`${passed} gameplay checks passed.`);
} finally {
  await rm(dir, { recursive: true, force: true });
}
