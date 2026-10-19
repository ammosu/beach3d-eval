// 錄一段遊戲模式精華（逐格、GPU）→ video/frames/game/%05d.jpg，再用 ffmpeg 編碼成 video/game.mp4
// 用法：node scripts/record-game.mjs
// 透過 game.html?auto=1 的 window.__GAME__ 逐格推進（step 1/30 秒）；段落之間黑幕淡出淡入、黑幕期間快轉不錄。
import { chromium } from 'playwright-core';
import { mkdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
const FPS = 30, out = 'video/frames/game';
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true,
  args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
});
let n = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:5191/game.html?auto=1&time=4', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__READY__);
  await page.evaluate(() => {
    window.__TIME__ = 4;
    const veil = document.createElement('div');
    veil.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:99999';
    document.body.appendChild(veil); window.__VEIL__ = veil;
  });
  const g = (fn, arg) => page.evaluate(fn, arg);
  const frame = async (dt = 1 / FPS) => {
    await g(dt => { if (dt) window.__GAME__.step(dt); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, dt);
    await page.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
  };
  const hold = async s => { for (let i = 0; i < s * FPS; i++) await frame(); };
  const veil = async (to, s = 0.4) => { for (let i = 1; i <= s * FPS; i++) { await g(v => window.__VEIL__.style.opacity = v, to ? i / (s * FPS) : 1 - i / (s * FPS)); await frame(); } };
  const cut = async fn => { await veil(1); await fn(); await veil(0); };
  const press = k => page.keyboard.press(k);
  let curYaw = 0;
  // 走向目標：鏡頭方向平滑轉向，按住 W，最多 maxS 秒
  const walkTo = async (x, z, stop = 1, maxS = 6) => {
    let yaw = curYaw;
    await page.keyboard.down('KeyW');
    for (let i = 0; i < maxS * FPS; i++) {
      const p = await g(() => window.__EXPLORE__.player.toArray());
      const dx = x - p[0], dz = z - p[2];
      if (Math.hypot(dx, dz) < stop) break;
      let want = Math.atan2(-dx, -dz), d = Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw));
      yaw += d * 0.12; curYaw = yaw; await g(y => window.__GAME__.view(y), yaw);
      await frame();
    }
    await page.keyboard.up('KeyW');
  };
  const t = await g(() => window.__GAME__.targets());
  const ffwd = s => g(s => window.__GAME__.step(s), s);
  const teleport = (x, z, yaw) => (yaw != null && (curYaw = yaw), g)(([x, z, yaw]) => { const G = window.__GAME__; G.teleport(x, z); if (yaw != null) G.view(yaw); G.step(.4); }, [x, z, yaw]);

  // 1. 開場畫面
  await hold(2.5); await page.click('#begin'); await hold(0.5);
  // 2. 撿兩個貝殼（實際走過去），其餘黑幕中撿完
  const shells = [...t.shells].sort((a, b) => a.z - b.z).reverse();
  for (const s of shells.slice(0, 2)) { await walkTo(s.x, s.z, 0.9); await press('KeyE'); await hold(1); }
  await cut(async () => { for (const s of shells.slice(2)) { await teleport(s.x, s.z + .8); await press('KeyE'); await ffwd(.8); } });
  await hold(1);
  // 3. 踢沙灘球進海
  await cut(() => teleport(t.ball[0], t.ball[2] + 4, 0));
  await walkTo(t.ball[0], t.ball[2] + 1.3, 0.3, 3); await press('KeyE'); await hold(4);
  // 4. 躺椅休息
  await cut(() => teleport(t.umbrella[0] + 2, t.umbrella[2] + 4, Math.atan2(2, 4)));
  await walkTo(t.umbrella[0], t.umbrella[2], 0.6, 3); await press('KeyE'); await hold(4); await press('KeyE'); await hold(.5);
  // 5. 救生塔看海
  await cut(() => teleport(t.lifeguard[0] - 2, t.lifeguard[2] + 5, Math.atan2(-2, 5)));
  await walkTo(t.lifeguard[0], t.lifeguard[2], 0.6, 3); await press('KeyE'); await hold(4); await press('KeyE'); await hold(.5);
  // 6. 上船划向小島（錄一段），黑幕中划到小島再回來，錄靠岸下船
  await cut(() => teleport(t.boat[0] - 1, t.boat[2] + 3, Math.atan2(-1, 3)));
  await walkTo(t.boat[0], t.boat[2], 0.6, 3); await press('KeyE'); await hold(1);
  const paddle = async (goal, rec, maxS) => {
    await page.keyboard.down('KeyW');
    for (let i = 0; i < maxS * FPS; i++) {
      const v = await g(() => window.__GAME__.vessel), dx = goal.x - v.x, dz = goal.z - v.z;
      if (Math.hypot(dx, dz) < 7) break;
      await g(a => window.__GAME__.steer(a), Math.atan2(-dx, -dz));
      if (rec) await frame(); else await ffwd(1 / FPS);
    }
    await page.keyboard.up('KeyW');
  };
  await paddle({ x: 12, z: -65 }, true, 7);
  await cut(async () => { await paddle({ x: 12, z: -65 }, false, 60); await paddle(t.island, false, 90); await paddle({ x: 12, z: -65 }, false, 90); });
  await hold(.5);
  await paddle(t.dock, true, 8);
  await cut(async () => { await paddle(t.dock, false, 60); });
  await press('KeyE'); await hold(1.5);
  // 7. 完成畫面
  await hold(3);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('frames', n, (n / FPS).toFixed(1) + 's', await g(() => window.__GAME__.completed));
} finally { await browser.close(); }
