// Water close-ups for shading work (SwiftShader, same time as the stills): surf zone, shallow water seen from above,
// open water towards the sun (glints), far water from high up, the swash on the sand.
// node scripts/shoot-water.mjs [outdir] [time] → <outdir>/{surf,shallow,sun,far,swash}.png (default shots/water)
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
const out=process.argv[2]||'shots/water',time=Number(process.argv[3]||4);
await mkdir(out,{recursive:true});
const views={
 surf:{pos:[-6,1.7,-4],target:[4,0,-22]},
 shallow:{pos:[3,2.6,-8.5],target:[3,0,-13.5]},
 sun:{pos:[0,2.2,-14],target:[45,0,-90]},
 far:{pos:[-10,28,6],target:[10,0,-90]},
 swash:{pos:[-2,1.3,-6.5],target:[2,0,-11.5]},
};
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://localhost:5191/scene.html?group=B&cam=wide&time=${time}`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__READY__===true);
 for(const [name,v] of Object.entries(views)){
  await page.evaluate(v=>{const {camera}=window.__SCENE__;camera.position.fromArray(v.pos);camera.lookAt(...v.target);
   return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},v);
  await page.screenshot({path:`${out}/${name}.png`});console.log(`${out}/${name}.png`);
 }
 if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}
