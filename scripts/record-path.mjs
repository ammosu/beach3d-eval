// 依 video/path.json 的鏡頭路徑逐格算繪某一組 → video/frames/<group>/%05d.jpg
// 用法：node scripts/record-path.mjs <A|B|C> [fps 覆寫，預覽用] [路徑檔，預設 video/path.json] [輸出資料夾]
// 逐格設定相機與水面時間，與即時效能無關；用本機 GPU（ANGLE gl-egl）算繪。
import { chromium } from 'playwright-core';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
const group = process.argv[2];
if (!['A', 'B', 'C'].includes(group)) throw new Error('Usage: node scripts/record-path.mjs <A|B|C> [fps]');
const path = JSON.parse(await readFile(process.argv[4] || 'video/path.json', 'utf8'));
const fps = Number(process.argv[3] || path.fps);
const out = process.argv[5] || `video/frames/${group}`;
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
let rendererName;
async function launchRenderer(backend) {
  const browser = await chromium.launch({
    executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true,
    args: backend === 'swiftshader'
      ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
      : ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
  });
  try {
    const probe = await browser.newPage();
    const renderer = await probe.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) throw new Error('WebGL2 unavailable');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    });
    await probe.screenshot();
    await probe.close();
    rendererName = renderer;
    console.log(`Render backend: ${renderer}`);
    return browser;
  } catch (error) { await browser.close(); throw error; }
}
let browser;
try { browser = await launchRenderer(process.env.RECORD_RENDERER || 'gpu'); }
catch (error) {
  if (process.env.RECORD_RENDERER) throw error;
  console.warn(`GPU backend unavailable (${error.message.split('\n')[0]}). Using deterministic SwiftShader; this is not a hardware performance measurement.`);
  browser = await launchRenderer('swiftshader');
}
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
  await page.goto(process.env.SCENE_URL || `http://localhost:5191/scene.html?group=${group}&cam=wide&time=0`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__READY__ === true);
  await page.waitForTimeout(Number(process.env.SETTLE_MS || 0));
  await page.evaluate(async keys => {
    const { groundHeight } = await import('/src/terrain.js');
    // Catmull-Rom 穿過關鍵格，相機不低於地面 0.8m
    const cr = (p0, p1, p2, p3, u) => p1.map((_, i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u * u + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u * u * u));
    const sample = (t, k) => {
      let i = keys.findIndex((x, j) => j < keys.length - 1 && t >= x.t && t <= keys[j + 1].t);
      if (i < 0) i = t <= keys[0].t ? 0 : keys.length - 2;
      const a = keys[i], b = keys[i + 1];
      let u = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
      const g = j => keys[Math.min(keys.length - 1, Math.max(0, j))][k];
      return cr(g(i - 1), g(i), g(i + 1), g(i + 2), u);
    };
    const { camera } = window.__SCENE__;
    window.__SETFRAME__ = t => {
      const p = sample(t, 'pos'), q = sample(t, 'target');
      p[1] = Math.max(p[1], groundHeight(p[0], p[2]) + 0.8);
      camera.position.fromArray(p); camera.lookAt(...q);
      window.__TIME__ = t;
    };
  }, path.keys);
  const end = path.keys.at(-1).t, n = Math.round(end * fps);
  const t0 = Date.now();
  for (let f = 0; f <= n; f++) {
    await page.evaluate(t => { window.__SETFRAME__(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, f / fps);
    if (errors.length) throw new Error(errors.join('\n'));
    await page.screenshot({ path: `${out}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    if (f % 30 === 0) console.log(group, f, '/', n, Math.round((Date.now() - t0) / 1000) + 's');
  }
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(`${out}/render-info.json`, JSON.stringify({renderer:rendererName, fps, frameCount:n+1, lastTime:end, width:960, height:540, renderSeconds:(Date.now()-t0)/1000}, null, 2)+'\n');
  console.log(`Completed ${n+1} frames in ${out}`);
} finally { await browser.close(); }
