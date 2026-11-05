// The wreck site and the fishing boat at anchor (src/game/wreck.js, shared by all groups): where they lie, seabed and
// water depth, stills. node scripts/probe-wreck.mjs [groups] [gpu] → shots/wreck/<g>_{site,plane,cannon,cache,trawler_beach,trawler_boat,trawler_under}.png
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
const groups = (process.argv[2] || 'B').split(''), gpu = process.argv[3] === 'gpu';
await mkdir('shots/wreck', { recursive: true });
const browser = await chromium.launch({
  executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true,
  args: gpu ? ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
let failed = false;
try {
  for (const group of groups) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('http://localhost:5191/game.html?auto=1&time=4', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__READY__);
    const g = (fn, arg) => page.evaluate(fn, arg);
    await g(async gr => { window.__TIME__ = 4; await window.__EXPLORE__.switchGroup(gr); await window.__GAME__.sea.ready; await window.__GAME__.wreck.ready; }, group);
    await page.click('#begin');
    const step = s => g(s => window.__GAME__.step(s), s);
    const shot = async name => { await g(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await page.screenshot({ path: `shots/wreck/${group}_${name}.png` }); };
    const info = await g(() => { const { ready, gap, ...w } = window.__GAME__.wreck; return w; });
    console.log(group, JSON.stringify(info));
    if (!info.trawler.loaded || info.placed.length !== 7) { console.log(`${group}: models missing`); failed = true; }
    const { site, trawler } = info;
    // Look at (lx, lz) from (x, z): yaw 0 faces -z.
    const look = (x, z, tx, tz, pitch, above = 2.2, off = .28) => g(([x, z, tx, tz, pitch, above, off]) => { window.__GAME__.diveTo(x, z, above); window.__EXPLORE__.setView(Math.atan2(-(tx - x), -(tz - z)) + off, pitch); }, [x, z, tx, tz, pitch, above, off]);
    const t = await g(() => window.__GAME__.targets());
    // From the beach, on foot.
    await g(([x, z]) => { window.__GAME__.teleport(x, z); window.__GAME__.step(.2); }, [-6, -8]);
    await g(([x, z, tx, tz]) => window.__EXPLORE__.setView(Math.atan2(-(tx - x), -(tz - z)), .02), [-6, -8, trawler.x, trawler.z]);
    await step(.3); await shot('trawler_beach');
    // Row towards the fishing boat until it stops or 30 s pass.
    await g(([x, z]) => { const G = window.__GAME__; G.teleport(x, z); G.step(.2); G.interact(); G.step(1); }, [t.boat[0], t.boat[2]]);
    for (let i = 0; i < 16; i++) {
      const v = await g(() => window.__GAME__.vessel);
      await g(a => window.__GAME__.steer(a), Math.atan2(-(trawler.x - v.x), -(trawler.z - v.z)));
      await page.keyboard.down('KeyW'); await step(2.5); await page.keyboard.up('KeyW');
    }
    await step(2);
    const v = await g(() => window.__GAME__.vessel);
    const gap = Math.hypot(v.x - trawler.x, v.z - trawler.z);
    console.log(group, 'rowed to', v.x.toFixed(1), v.z.toFixed(1), 'from trawler', gap.toFixed(1), 'speed', v.speed.toFixed(2));
    if (gap < 3.9) { console.log(`${group}: rowboat inside the hull`); failed = true; }
    await g(([x, z, tx, tz]) => window.__EXPLORE__.setView(Math.atan2(-(tx - x), -(tz - z)), .05), [v.x, v.z, trawler.x, trawler.z]);
    await step(.3); await shot('trawler_boat');
    if (!await g(() => window.__GAME__.dive())) throw new Error(`${group}: could not dive`);
    await step(1.5);
    await look(trawler.x + 7, trawler.z + 7, trawler.x, trawler.z, -.3, 15); await step(.5); await shot('trawler_under');
    // The site, from afar and each corner.
    const { x, z } = site;
    for (const [name, cx, cz, tx, tz, p] of [['far', x - 26, z + 16, x, z, .1], ['site', x - 13, z + 10, x, z, .25], ['plane', x + 6, z - 7, x, z, .3], ['cannon', x - 11.5, z + 6.5, x - 7.5, z + 3.5, .35], ['cache', x + 4, z + 2.5, x + 5.5, z + 6, .5]]) {
      await look(cx, cz, tx, tz, p); await step(.5); await shot(name);
    }
    // Swim straight at each solid for 6 s from 5 m out (W held, along the view): the middle of the body must stay clear.
    for (const [name, tx, tz, above, fx, fz] of [['plane', x, z, .9, 0, 5], ['cannon', x - 7.5, z + 3.5, .8, -5, 0], ['chest', x + 6, z + 5, .5, 5, 0], ['hull', trawler.x, trawler.z, 16.3, -5, -3.5]]) {
      const sx = tx + fx, sz = tz + fz;
      await g(([sx, sz, tx, tz, above]) => { const G = window.__GAME__; G.diveTo(sx, sz, above); window.__EXPLORE__.setView(Math.atan2(-(tx - sx), -(tz - sz)), 0); G.step(.1); }, [sx, sz, tx, tz, above]);
      await page.keyboard.down('KeyW');
      const r = await g(async () => { const G = window.__GAME__; let min = Infinity, kind = null, cam = Infinity; const start = G.diver.pos; for (let i = 0; i < 60; i++) { G.step(.1); const p = G.diver.pos, h = G.wreck.gap(p[0], p[1], p[2]); if (h.gap < min) { min = h.gap; kind = h.kind; } const c = G.diver.camera; cam = Math.min(cam, G.wreck.gap(c[0], c[1], c[2]).gap); } const end = G.diver.pos; return { min, kind, cam, moved: Math.hypot(end[0] - start[0], end[2] - start[2]), speed: Math.hypot(...G.diver.vel) }; });
      await page.keyboard.up('KeyW');
      console.log(group, 'swim at', name, 'nearest', r.min.toFixed(2), r.kind, 'camera', r.cam.toFixed(2), 'moved', r.moved.toFixed(1), 'speed', r.speed.toFixed(2));
      if (r.min < .2 || r.cam < .1) { console.log(`${group}: diver went into ${r.kind}`); failed = true; }
      await shot(`swim_${name}`);
    }
    if (errors.length) { console.log(errors.join('\n')); failed = true; }
    await page.close();
  }
} finally { await browser.close(); }
if (failed) process.exit(1);
