// 用法：node record.mjs <codex|opus> <port> <fps> <outdir>
// 虛擬時鐘：接管 performance.now／Date.now／requestAnimationFrame／setTimeout，固定 Math.random 種子，
// 每 1/30 秒推進一格；照同一份時間表按鍵；每 30/fps 格截一張 → <outdir>/f_00000.png
import { chromium } from '../node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
const [who, port, fpsArg, outdir] = process.argv.slice(2);
const fps = Number(fpsArg || 30), SIM = 30, every = Math.round(SIM / fps);
const DURATION = 46;
// [虛擬秒數, 動作]；字幕由 compose_reef.py 依同一份表產生
export const TIMELINE = [
  [7, '1'], [10.5, '2'], [14, '3'], [19, '4'], [23, '5'], [26, '6'], [29, '7'],
  [34, 'r'], [38, 'w'],
];
fs.mkdirSync(outdir, { recursive: true });

const clock = () => {
  let vt = 0, seed = 12345, nextId = 1;
  const base = 1760000000000, timers = new Map(), rafs = new Map();
  Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  performance.now = () => vt;
  Date.now = () => base + vt;
  window.requestAnimationFrame = cb => { const id = nextId++; rafs.set(id, cb); return id; };
  window.cancelAnimationFrame = id => rafs.delete(id);
  window.setTimeout = (cb, ms = 0, ...a) => { const id = nextId++; timers.set(id, { at: vt + Math.max(0, ms), cb, a }); return id; };
  window.clearTimeout = id => timers.delete(id);
  window.__step = ms => {
    const end = vt + ms;
    for (;;) {
      let due = null;
      for (const [id, t] of timers) if (t.at <= end && (!due || t.at < due[1].at)) due = [id, t];
      if (!due) break;
      timers.delete(due[0]); vt = Math.max(vt, due[1].at);
      try { typeof due[1].cb === 'function' && due[1].cb(...due[1].a); } catch (e) { console.error(e); }
    }
    vt = end;
    const cbs = [...rafs.values()]; rafs.clear();
    for (const cb of cbs) { try { cb(vt); } catch (e) { console.error(e); } }
  };
};

const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
  args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.addInitScript(clock);
await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.waitForFunction(() => document.querySelector('canvas'), null, { timeout: 30000 });
await page.waitForTimeout(1500); // 讓 shader 編譯、縮圖渲染完（虛擬時間不動）
let n = 0, ti = 0;
const total = DURATION * SIM;
for (let f = 0; f < total; f++) {
  const t = f / SIM;
  while (ti < TIMELINE.length && TIMELINE[ti][0] <= t) { await page.keyboard.press(TIMELINE[ti][1]); ti++; }
  await page.evaluate(ms => window.__step(ms), 1000 / SIM);
  if (f % every === 0) await page.screenshot({ path: `${outdir}/f_${String(n++).padStart(5, '0')}.png` });
}
console.log(`${who}: ${n} frames → ${outdir}`, errs.length ? '\nerrors: ' + errs.slice(0, 5).join('\n') : '');
await browser.close();
