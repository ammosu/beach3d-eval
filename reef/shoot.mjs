// 用法：node shoot.mjs <codex|opus> <port>  → shots/<who>-{start,throw,rain,mobile}.png
import { chromium } from '../node_modules/playwright-core/index.mjs';
const [who, port] = process.argv.slice(2);
const url = `http://127.0.0.1:${port}/index.html`;
const browser = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
  args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const errs = [];
async function page(vp) {
  const p = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => m.type() === 'error' && errs.push('console: ' + m.text()));
  await p.goto(url); await p.waitForTimeout(4000); return p;
}
const d = await page({ width: 1600, height: 900 });
await d.screenshot({ path: `shots/${who}-start.png` });
for (const k of ['3', '4', '1', '7']) { await d.keyboard.press(k); await d.waitForTimeout(350); }
await d.waitForTimeout(1300);
await d.screenshot({ path: `shots/${who}-throw.png` });
await d.waitForTimeout(5000);
await d.keyboard.press('r'); await d.keyboard.press('w'); await d.waitForTimeout(2500);
await d.screenshot({ path: `shots/${who}-rain.png` });
const m = await page({ width: 390, height: 844 });
await m.screenshot({ path: `shots/${who}-mobile.png` });
console.log(errs.length ? errs.slice(0, 10).join('\n') : 'no errors');
await browser.close();
