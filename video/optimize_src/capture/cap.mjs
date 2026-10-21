// 優化前後對照擷取：同一動作序列、同一鏡頭，分別對舊 commit（PORT）與 HEAD（5191）錄格。
// node cap.mjs <walk|climb|lounger> <before|after> <port> [group]
import { chromium } from 'playwright-core';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
const [key, side, port, group = 'B'] = process.argv.slice(2);
const W = `${homedir()}/explainer-videos/beach3d-eval/optimize/assets/${key}`, out = `${W}/${side}`;
const RAW = process.env.RAW ? `${W}/raw_${side}` : null;
await rm(out, { recursive: true, force: true }); await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true,
  args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(`http://localhost:${port}/game.html?auto=1&time=4&group=${group}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__READY__);
await page.evaluate(() => { window.__TIME__ = 4; });
await page.click('#begin');
await page.waitForFunction(() => !window.__EXPLORE__.busy);
const g = (fn, arg) => page.evaluate(fn, arg);
let n = 0;
// 自由鏡頭：eye/look 為角色本地座標（mode 'avatar'）或世界座標（'world'）。先讓頁面自己的繪製迴圈跑兩格（舊版的 update(0) 問題要照實呈現），再用自訂鏡頭畫一張。
const shot = async (eye, look, mode = 'avatar', fov = 40, frames = 1) => {
  await g(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const url = await g(([eye, look, mode, fov]) => {
    const { scene, renderer, camera } = window.__SCENE__, a = window.__EXPLORE__.avatar, cam = camera.clone();
    a.updateWorldMatrix(true, false);
    const P = v => mode === 'avatar' ? a.localToWorld(cam.position.clone().fromArray(v)) : cam.position.clone().fromArray(v);
    cam.up.set(0, 1, 0); cam.position.copy(P(eye)); cam.lookAt(P(look)); cam.fov = fov; cam.aspect = 16 / 9; cam.updateProjectionMatrix();
    renderer.render(scene, cam); return renderer.domElement.toDataURL('image/jpeg', .92);
  }, [eye, look, mode, fov]);
  await writeFile(`${out}/${String(n++).padStart(4, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
};
const step = s => g(s => window.__GAME__.step(s), s);
if (key === 'walk') {
  await g(() => { const G = window.__GAME__; G.teleport(-4, 4); G.view(Math.PI / 2); G.step(.5); });
  // 站好後鏡頭固定在世界座標：跟著角色平移，但不轉
  await page.keyboard.down('KeyW');
  await step(.6);
  for (let i = 0; i < 75; i++) {
    await step(1 / 30);
    const p = await g(() => window.__EXPLORE__.player.toArray());
    await shot([p[0] - .3, p[1] + .9, p[2] + 3.4], [p[0] - .3, p[1] + .55, p[2]], 'world', 38);
  }
  await page.keyboard.up('KeyW');
}
if (key === 'climb') {
  await g(() => { const G = window.__GAME__, p = G.targets().lifeguard; G.teleport(p[0], p[2]); G.step(.3); G.interact(); });
  const L = await g(() => { const l = window.__GAME__.ladder(); return { kind: l.kind, bottom: l.bottom.toArray(), top: l.top.toArray(), normal: l.normal.toArray(), right: l.right.toArray() }; });
  console.log(JSON.stringify(L));
  const add = (a, b, k) => a.map((v, i) => v + b[i] * k);
  const mid = add(L.bottom, add(L.top, L.bottom, -1), .55);
  const E = (process.env.CEYE || '2.6,1.9,.9').split(',').map(Number);
  let eye = add(add(mid, L.normal, E[0]), L.right, E[1]); eye[1] += E[2];
  const look = [...mid]; look[1] += .5;
  const DT = Number(process.env.DT || 1 / 60), N = Number(process.env.N || 96);
  for (let i = 0; i < N; i++) { await step(DT); await shot(eye, look, 'world', 40); }
}
if (key === 'lounger') {
  await g(() => { const G = window.__GAME__, p = G.targets().umbrella; G.teleport(p[0], p[2]); G.step(.3); G.interact(); G.step(2); });
  const e = process.env.EYE ? process.env.EYE.split(',').map(Number) : [2.2, 1.4, 1.2];
  console.log(JSON.stringify(await g(() => { const a = window.__EXPLORE__.avatar; return [a.position.toArray(), a.rotation.y]; })));
  if (process.env.WEYE) await shot(process.env.WEYE.split(',').map(Number), process.env.WLOOK.split(',').map(Number), 'world', 40);
  else await shot(e, [0, .4, 0], 'avatar', 40);
}
if (errors.length) console.log('errors', errors);
console.log(key, side, 'frames', n);
await browser.close();
