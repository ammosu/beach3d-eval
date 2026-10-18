import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
const group=process.argv[2]||'A';
if(!['A','B','C'].includes(group)) throw new Error('Usage: node scripts/shoot.mjs <A|B|C>');
await mkdir(`shots/${group}`,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(const cam of ['wide','beach','closeup']){
  await page.goto(`http://localhost:5191/?group=${group}&cam=${cam}&time=4`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__READY__===true);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:`shots/${group}/${cam}.png`});
  console.log(`${group}/${cam}`,await page.evaluate(()=>({slots:window.__SCENE__.propRoot.children.length,props:window.__SCENE__.results})));
 }
 if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}
