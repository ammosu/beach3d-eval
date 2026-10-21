import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
const b = await chromium.launch({ executablePath: `${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, headless: true, args: ['--use-gl=angle', '--use-angle=gl-egl'] });
const p = await b.newPage();
p.on('console', m => console.log('C', m.type(), m.text().slice(0, 200))); p.on('pageerror', e => console.log('E', e.message));
p.on('requestfailed', r => console.log('F', r.url()));
p.on('response', r => { if (r.status() >= 400) console.log('R', r.status(), r.url()); });
await p.goto(process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(8000);
console.log(await p.evaluate(() => window.__READY__)); await b.close();
