// 場景頁靜態截圖：node still.mjs <port> <group> <out.png> [camPos x,y,z] [target x,y,z] [time]
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
const [port, group, out, pos, tgt, time = '4'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true, args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://localhost:${port}/scene.html?group=${group}&cam=closeup&time=${time}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__READY__ === true);
  if (pos) await page.evaluate(([p, t]) => { const S = window.__SCENE__, c = S.camera; c.position.set(...p); c.lookAt(...t); if (S.controls) { S.controls.target.set(...t); S.controls.update(); } }, [pos.split(',').map(Number), tgt.split(',').map(Number)]);
  await page.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n > 8 ? r() : requestAnimationFrame(f)); f(); }));
  await page.screenshot({ path: out });
  console.log(out, await page.evaluate(() => Object.keys(window.__SCENE__)));
} finally { await browser.close(); }
