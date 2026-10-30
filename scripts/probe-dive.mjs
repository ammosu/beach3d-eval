// Diving close-ups: row out from the dock, stop, dive (Q), swim down, look up at the surface (Snell's window), rise
// beside the boat and climb back in. node scripts/probe-dive.mjs [groups] [gpu] → shots/dive/<g>_{entry,deep,window,
// rise,reef,fish,buoy,back}.png and the diver's state per step (camera under the surface, diver between seabed and surface).
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
const groups = (process.argv[2] || 'B').split(''), gpu = process.argv[3] === 'gpu';
await mkdir('shots/dive', { recursive: true });
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
    await g(async gr => { window.__TIME__ = 4; await window.__EXPLORE__.switchGroup(gr); await window.__GAME__.sea.ready; }, group);
    await page.click('#begin');
    const step = s => g(s => window.__GAME__.step(s), s);
    const shot = async name => { await g(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await page.screenshot({ path: `shots/dive/${group}_${name}.png` });
      const d = await g(() => ({ mode: window.__GAME__.mode, ...window.__GAME__.diver }));
      const camUnder = d.camera[1] < d.surface; console.log(group, name, d.mode, 'diver y', d.pos[1].toFixed(2), 'surface', d.surface.toFixed(2), 'camera y', d.camera[1].toFixed(2), 'under', d.under);
      return d; };
    const t = await g(() => window.__GAME__.targets());
    await g(([x, z]) => { const G = window.__GAME__; G.teleport(x, z); G.step(.2); G.interact(); G.step(1); }, [t.boat[0], t.boat[2]]);
    const v0 = await g(() => window.__GAME__.vessel);
    await g(a => window.__GAME__.steer(a), Math.atan2(-(t.island.x - v0.x), -(t.island.z - v0.z)));
    await page.keyboard.down('KeyW'); await step(5); await page.keyboard.up('KeyW'); await step(3);
    if (!await g(() => window.__GAME__.dive())) throw new Error(`${group}: could not dive`);
    await step(1.5); const entry = await shot('entry');
    if (!entry.under) { console.log(`${group}: camera not under water after diving`); failed = true; }
    const yaw = (await g(() => window.__GAME__.vessel)).yaw;
    await g(y => window.__EXPLORE__.setView(y + .6, .75), yaw);
    await page.keyboard.down('KeyW'); await step(3.5); await page.keyboard.up('KeyW'); await step(.6);
    const deep = await shot('deep');
    if (!(deep.pos[1] < entry.pos[1] - 1)) { console.log(`${group}: diver did not go down`); failed = true; }
    await g(y => window.__EXPLORE__.setView(y + .6, -.5), yaw); await step(.8); await shot('window');
    await g(y => window.__EXPLORE__.setView(y + 2.6, .2), yaw);
    await page.keyboard.down('Space'); await page.keyboard.down('KeyW'); await step(3); await page.keyboard.up('KeyW'); await page.keyboard.up('Space'); await step(1.5);
    const rise = await shot('rise');
    if (rise.pos[1] > rise.surface - .25) { console.log(`${group}: diver above the surface`); failed = true; }
    // The reef patch on the way out and the one round the buoy (with the animals swimming deeper near a diver).
    for (const [name, x, z, yaw] of [['reef', -4, -84, 0], ['fish', -4, -88.5, 0], ['buoy', 60, -270, 0]]) {
      await g(([x, z, yaw]) => { window.__GAME__.diveTo(x, z, 2.2); window.__EXPLORE__.setView(yaw, x === -4 && z > -89 && z < -88 ? .05 : .35); }, [x, z, yaw]); await step(name === 'buoy' ? 4 : 1.2); await shot(name);
    }
    console.log(group, 'seabed', JSON.stringify(await g(() => window.__GAME__.seabed)));
    const mode = await g(() => window.__GAME__.surface()); await step(1.5); await shot('back');
    if (mode !== 'boat') { console.log(`${group}: did not climb back (${mode})`); failed = true; }
    if (errors.length) { console.log(errors.join('\n')); failed = true; }
    await page.close();
  }
} finally { await browser.close(); }
if (failed) process.exit(1);
