// 外海划船：node boat.mjs <port> <outdir> [frames=90] [preRow=6] [viewOff=2.2] [group=B]
// STEP=秒 可改每格推進的時間（找特定時間點用）。上船 → 朝浮標划 preRow 秒（不錄）→ 按住 W 繼續划，每格 1/30 s；鏡頭固定在船的側後方（back m 後、side m 側、up m 高），隱藏 HUD
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
const [port, outdir, frames = '90', preRow = '6', back = '3.6', side = '2.6', up = '1.7', group = 'B'] = process.argv.slice(2);
await mkdir(outdir, { recursive: true });
const browser = await chromium.launch({ executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true, args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://localhost:${port}/game.html?auto=1&time=4`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__READY__);
  const g = (fn, arg) => page.evaluate(fn, arg);
  await g(async gr => { window.__TIME__ = 4; await window.__EXPLORE__.switchGroup(gr); if (window.__GAME__.sea) await window.__GAME__.sea.ready; }, group);
  await page.click('#begin');
  await g(() => { for (const el of document.body.querySelectorAll('*')) if (el.tagName !== 'CANVAS' && !el.querySelector('canvas') && !el.closest('canvas')) el.style.visibility = 'hidden';
    const cam = window.__SCENE__.camera, orig = cam.lookAt.bind(cam);
    cam.lookAt = (...a) => { const C = window.__CAM__; if (C) { cam.position.set(...C.pos); return orig(...C.look); } return orig(...a); }; });
  const t = await g(() => window.__GAME__.targets());
  await g(([x, z]) => { const G = window.__GAME__; G.pushBoat = false; G.teleport(x, z); G.step(.2); G.interact(); G.step(1); }, [t.boat[0], t.boat[2]]);
  const buoy = t.island;
  const aim = async () => { const v = await g(() => window.__GAME__.vessel); const a = Math.atan2(-(buoy.x - v.x), -(buoy.z - v.z)); await g(a => window.__GAME__.steer(a), a); return a; };
  let yaw = await aim();
  await page.keyboard.down('KeyW');
  for (let i = 0; i < +preRow * 4; i++) { yaw = await aim(); await g(() => window.__GAME__.step(.25)); }
  const log = [];
  for (let i = 0; i < +frames; i++) {
    await g(([b, sd, u, st]) => { const G = window.__GAME__; G.step(st); const v = G.vessel, s = Math.sin(v.yaw), c = Math.cos(v.yaw);
      window.__CAM__ = { pos: [v.x + s * b + c * sd, v.y + u, v.z + c * b - s * sd], look: [v.x - s * 1.2, v.y + .2, v.z - c * 1.2] };
      window.__SCENE__.camera.lookAt(0, 0, 0); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, [+back, +side, +up, +(process.env.STEP || 0) || 1 / 30]);
    await page.screenshot({ path: `${outdir}/${String(i).padStart(4, '0')}.png` });
    log.push(await g(() => ({ t: window.__TIME__, ...window.__GAME__.vessel })));
  }
  await page.keyboard.up('KeyW');
  await writeFile(`${outdir}/log.json`, JSON.stringify(log));
  console.log(port, 'first', JSON.stringify(log[0]), 'last', JSON.stringify(log.at(-1)), errors.join('|'));
} finally { await browser.close(); }
