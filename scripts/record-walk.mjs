// 三組角色同一段走位（逐格、GPU）→ video/frames/walk_<group>/%05d.jpg，供投影片並排比較
// 用法：node scripts/record-walk.mjs <A|B|C>
// 走位：從沙灘走到陽傘 → 躺上躺椅 → 起身走向救生塔；隱藏 HUD 只留畫面。
import { chromium } from 'playwright-core';
import { mkdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
const group = process.argv[2];
if (!['A', 'B', 'C'].includes(group)) throw new Error('Usage: node scripts/record-walk.mjs <A|B|C>');
const FPS = 30, out = `video/frames/walk_${group}`;
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true,
  args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
});
let n = 0;
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://localhost:5191/game.html?auto=1&time=4&group=${group}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__READY__);
  await page.click('#begin');
  await page.waitForFunction(() => !window.__EXPLORE__.busy);
  await page.addStyleTag({ content: 'body > *:not(canvas) { display: none !important; }' });
  await page.evaluate(() => { window.__TIME__ = 4; });
  const g = (fn, arg) => page.evaluate(fn, arg);
  const frame = async () => {
    await g(() => { window.__GAME__.step(1 / 30); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
    await page.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 });
  };
  const hold = async s => { for (let i = 0; i < s * FPS; i++) await frame(); };
  let yaw = 0;
  // 固定步數走向目標（三組步數一致，畫面才對得齊）
  const walk = async (x, z, frames) => {
    await page.keyboard.down('KeyW');
    for (let i = 0; i < frames; i++) {
      const p = await g(() => window.__EXPLORE__.player.toArray());
      const dx = x - p[0], dz = z - p[2];
      if (Math.hypot(dx, dz) > 0.5) {
        const want = Math.atan2(-dx, -dz), d = Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw));
        yaw += d * 0.12; await g(y => window.__GAME__.view(y), yaw);
      } else await page.keyboard.up('KeyW');
      await frame();
    }
    await page.keyboard.up('KeyW');
  };
  const t = await g(() => window.__GAME__.targets());
  const [ux, , uz] = t.umbrella, [lx, , lz] = t.lifeguard;
  yaw = Math.atan2(2, 5);
  await g(([x, z, y]) => { const G = window.__GAME__; G.teleport(x, z); G.view(y); G.step(.5); }, [ux + 2, uz + 7, yaw]);
  await hold(0.5);
  await walk(ux, uz + 0.8, 150);
  await page.keyboard.press('KeyE'); await hold(3);
  await page.keyboard.press('KeyE'); await hold(0.5);
  await walk(lx, lz + 3, 150);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(group, 'frames', n);
} finally { await browser.close(); }
