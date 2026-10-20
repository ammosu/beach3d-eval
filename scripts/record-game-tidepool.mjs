// 錄遊戲中的潮池任務（逐格、GPU）→ video/frames/game_tidepool/%05d.png，再編成 video/game_tidepool.mp4
// 用法：node scripts/record-game-tidepool.mjs [A|B|C]
// 沙灘段用 __GAME__.step；潮池段 iframe 載入後以 __TIDEPOOL__.step(0) 凍結時鐘，逐格推進，動作表與 record-tidepool.mjs 相同。
import { chromium } from 'playwright-core';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { TIMELINE, DURATION } from './record-tidepool.mjs';
const FPS = Number(process.env.FPS || 30), group = process.argv[2] || 'B', out = 'video/frames/game_tidepool';
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
  await page.evaluate(async g => {
    window.__TIME__ = 4;
    if (g !== 'B') await window.__EXPLORE__.switchGroup(g);
    const veil = document.createElement('div');
    veil.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:99999';
    document.body.appendChild(veil); window.__VEIL__ = veil;
  }, group);
  const g = (fn, arg) => page.evaluate(fn, arg);
  const tide = () => page.frameLocator('#lagoon iframe');
  let inPool = false;
  // 無頭 GPU 偶爾截到少了水面的畫面：同一格重畫到有兩張完全相同才採用（同 record-tidepool.mjs）
  const frame = async (dt = 1 / FPS) => {
    if (inPool) await g(dt => document.querySelector('#lagoon iframe').contentWindow.__TIDEPOOL__.step(dt), dt);
    else await g(dt => { if (dt) window.__GAME__.step(dt); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, dt);
    const shots = []; let pick = null;
    for (let k = 0; k < (inPool ? 6 : 1) && !pick; k++) {
      if (k) await g(() => document.querySelector('#lagoon iframe').contentWindow.__TIDEPOOL__.step(0));
      const buf = await page.screenshot(); pick = !inPool ? buf : shots.find(s => s.equals(buf)); shots.push(buf);
    }
    if (!pick) { const m = shots.map(s => s.length).sort((a, b) => a - b)[shots.length >> 1]; pick = shots.reduce((a, s) => Math.abs(s.length - m) < Math.abs(a.length - m) ? s : a); }
    await writeFile(`${out}/${String(n++).padStart(5, '0')}.png`, pick);
  };
  const hold = async s => { for (let i = 0; i < s * FPS; i++) await frame(); };
  const veil = async (to, s = 0.4) => { for (let i = 1; i <= s * FPS; i++) { await g(v => window.__VEIL__.style.opacity = v, to ? i / (s * FPS) : 1 - i / (s * FPS)); await frame(inPool ? 0 : undefined); } };
  const press = k => page.keyboard.press(k);
  let curYaw = 0;
  const walkTo = async (x, z, stop = 1, maxS = 6) => {
    let yaw = curYaw;
    await page.keyboard.down('KeyW');
    for (let i = 0; i < maxS * FPS; i++) {
      const p = await g(() => window.__EXPLORE__.player.toArray());
      const dx = x - p[0], dz = z - p[2];
      if (Math.hypot(dx, dz) < stop) break;
      const want = Math.atan2(-dx, -dz), d = Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw));
      yaw += d * 0.12; curYaw = yaw; await g(y => window.__GAME__.view(y), yaw);
      await frame();
    }
    await page.keyboard.up('KeyW');
  };
  const t = await g(() => window.__GAME__.targets());
  const [px, , pz] = t.tidepool;

  // 1. 開場：任務清單，按開始
  await hold(2); await page.click('#begin');
  await g(([x, z]) => { const G = window.__GAME__; G.teleport(x, z); G.view(0); G.step(.4); }, [px + 1.5, pz + 8]);
  curYaw = 0; await hold(1);
  // 2. 走到潮池邊，出現「E 蹲下看看潮池」提示，按 E
  await walkTo(px, pz, 0.6, 8); await hold(1.2);
  await veil(1, .3);
  await press('KeyE');
  await page.waitForFunction(() => document.querySelector('#lagoon iframe').contentWindow?.__READY__, null, { timeout: 120000, polling: 100 });
  // 凍結 iframe 時鐘，從 0 開始與 record-tidepool.mjs 同一份時間表
  await g(() => { const tp = document.querySelector('#lagoon iframe').contentWindow.__TIDEPOOL__; tp.step(0); });
  inPool = true;
  await veil(0, .4);
  // 3. 潮池：觀察、翻石頭（與三組對照影片相同的動作表）
  const queue = [...TIMELINE];
  for (let i = 0; i < DURATION * FPS; i++) {
    const tt = i / FPS;
    while (queue.length && queue[0][0] <= tt + 1e-6) {
      const [, act, arg] = queue.shift();
      const ok = await tide().locator('body').evaluate((_, [act, arg]) => { if (act === 'close') { document.querySelector('#continue').click(); return true; } return window.__TIDEPOOL__[act](arg); }, [act, arg]);
      if (!ok) throw Error(`${act} ${arg} failed at ${tt}s`);
    }
    await frame();
  }
  await hold(1);
  // 4. 回到沙灘：任務清單顯示潮池觀察完成
  await veil(1, .3);
  inPool = false;
  await page.click('#lagoon-back'); await g(() => window.__GAME__.step(.5));
  await veil(0, .4);
  await hold(3.5);
  const state = await g(() => window.__GAME__.state);
  if (errors.length) throw new Error(errors.join('\n'));
  if (!state.tidepool) throw new Error('tidepool quest not completed');
  console.log('frames', n, (n / FPS).toFixed(1) + 's', 'observed', state.observed);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${out}/%05d.png`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', process.env.OUT || 'video/game_tidepool.mp4']);
  console.log('video/game_tidepool.mp4');
} finally { await browser.close(); }
