// 錄遊戲中的外海觀察任務（逐格、GPU）→ video/frames/opensea_<g>/%05d.png，再編成 video/game_opensea_<g>.mp4
// 用法：node scripts/record-game-opensea.mjs [A|B|C]　（DRY=1 只推算不截圖，印出每次觀察的時間）
// 不錄的前段：開始、上船、划到浮標前約 40 m。錄的部分三組完全相同：划到浮標旁，接著小船原地慢慢轉一圈，
// 鏡頭跟著掃過四周；有動物浮出水面、提示出現、離上次觀察至少 GAP 秒時按 E（各組模型高度不同，按下的時間可能不同，船與鏡頭路線不變）。
import { chromium } from 'playwright-core';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
const FPS = Number(process.env.FPS || 30), DRY = !!process.env.DRY, group = process.argv[2] || 'B', out = `video/frames/opensea_${group}`;
export const APPROACH = 7, TURN = 32, END = 5, GAP = 2.5;   // 秒：划近、原地轉向一圈、結尾停留、兩次觀察的最短間隔
if (!DRY) { await rm(out, { recursive: true, force: true }); await mkdir(out, { recursive: true }); }
const browser = await chromium.launch({
  executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true,
  args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
});
let n = 0;
const log = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:5191/game.html?auto=1&time=4', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__READY__);
  const g = (fn, arg) => page.evaluate(fn, arg);
  await g(async gr => { window.__TIME__ = 4; await window.__EXPLORE__.switchGroup(gr); await window.__GAME__.sea.ready; }, group);
  await page.click('#begin');
  const step = s => g(s => window.__GAME__.step(s), s);
  const frame = async () => {
    await g(dt => { window.__GAME__.step(dt); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, 1 / FPS);
    if (!DRY) await writeFile(`${out}/${String(n).padStart(5, '0')}.png`, await page.screenshot());
    n++;
  };
  const t = await g(() => window.__GAME__.targets());
  const buoy = t.island, dock = t.dock;
  // 前段（不錄）：上船，划到浮標往岸邊方向約 40 m 處
  await g(([x, z]) => { const G = window.__GAME__; G.teleport(x, z); G.step(.2); G.interact(); G.step(1); }, [t.boat[0], t.boat[2]]);
  const away = Math.hypot(dock.x - buoy.x, dock.z - buoy.z), start = { x: buoy.x + (dock.x - buoy.x) / away * 40, z: buoy.z + (dock.z - buoy.z) / away * 40 };
  for (let i = 0; i < 100; i++) {
    const v = await g(() => window.__GAME__.vessel), dx = start.x - v.x, dz = start.z - v.z, d = Math.hypot(dx, dz);
    if (d < 4) break;
    await g(a => window.__GAME__.steer(a), Math.atan2(-dx, -dz));
    await page.keyboard.down('KeyW'); await step(Math.min(1.5, d / 9)); await page.keyboard.up('KeyW');
  }
  await g(a => window.__GAME__.steer(a), Math.atan2(-(buoy.x - start.x), -(buoy.z - start.z)));
  await step(3);   // 停穩、鏡頭跟上
  // 1. 划向浮標，在離浮標 10 m 處停下，浮標柱不會擋住鏡頭（W 按住，划到 10 m 內放開）
  let yaw = (await g(() => window.__GAME__.vessel)).yaw;
  await page.keyboard.down('KeyW');
  let rowing = true, last = -GAP;
  for (let i = 0; i < APPROACH * FPS; i++) {
    const v = await g(() => window.__GAME__.vessel);
    if (rowing && Math.hypot(buoy.x - v.x, buoy.z - v.z) < 10) { await page.keyboard.up('KeyW'); rowing = false; }
    await frame();
  }
  if (rowing) { await page.keyboard.up('KeyW'); console.log('still rowing after approach'); }
  // 2. 原地慢慢轉一圈，提示出現就按 E
  for (let i = 0; i < (TURN + END) * FPS; i++) {
    if (i < TURN * FPS) { yaw -= 2 * Math.PI / (TURN * FPS); await g(a => window.__GAME__.steer(a), yaw); }
    const label = await g(() => { const p = document.querySelector('#target-prompt'); return p.hidden ? '' : p.innerText; });
    if (/觀察/.test(label) && i / FPS - last >= GAP) { last = i / FPS; await page.keyboard.press('KeyE'); log.push([+(i / FPS + APPROACH).toFixed(2), label.replace(/\s+/g, ' ').trim()]); }
    await frame();
  }
  const state = await g(() => window.__GAME__.state);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(group, 'frames', n, (n / FPS).toFixed(1) + 's', 'spotted', state.spotted, JSON.stringify(log));
  await writeFile(`video/opensea_${group}.json`, JSON.stringify(log));
  if (state.spotted < 7) throw new Error('not all 7 observed');
  if (!DRY) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${out}/%05d.png`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', `video/game_opensea_${group}.mp4`]);
    console.log(`video/game_opensea_${group}.mp4`);
  }
} finally { await browser.close(); }
