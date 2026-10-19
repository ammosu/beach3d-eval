// Deterministic seeking, sand-only wetness, shader compilation and render cost.
// Use the same software rasterizer as shoot.mjs; hardware fps must be profiled separately.
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='shots/water_v2/verification';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:960,height:540}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://localhost:5191/scene.html?group=B&cam=wide&time=0');await page.waitForFunction(()=>window.__READY__);
 await page.evaluate(()=>{const {camera}=window.__SCENE__;camera.position.set(4,5,-3);camera.lookAt(0,0,-16);});
 async function capture(t,name){
  await page.evaluate(t=>{window.__TIME__=t;return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},t);
  assert.equal(await page.evaluate(()=>window.__SCENE__.water.material.uniforms.time.value),t);
  return page.screenshot({path:`${out}/${name}.png`});
 }
 const a=await capture(4,'time4');const b=await capture(6,'time6');const c=await capture(4,'time4_revisited');
 assert(!a.equals(b),'Water/swash must animate');assert(a.equals(c),'Arbitrary reverse time seeking must reproduce exact pixels');
 await page.evaluate(()=>{window.__SCENE__.water.visible=false;});
 const dryA=await capture(4,'sand4');const dryB=await capture(6,'sand6');const dryC=await capture(4,'sand4_revisited');
 assert(!dryA.equals(dryB),'Sand wetness must animate even with the water hidden');assert(dryA.equals(dryC),'Wetness cannot depend on previous frames');
 await page.evaluate(()=>{window.__SCENE__.water.visible=true;});
 const stats=await page.evaluate(async()=>{
  const {renderer,water}=window.__SCENE__;renderer.info.autoReset=false;
  await new Promise(r=>requestAnimationFrame(r));renderer.info.reset();await new Promise(r=>requestAnimationFrame(r));
  const result={waterTriangles:water.geometry.index.count/3,waterVertices:water.geometry.attributes.position.count,frame:{...renderer.info.render},memory:{...renderer.info.memory}};
  renderer.info.autoReset=true;return result;
 });
 assert.deepEqual(errors,[]);
 await writeFile(`${out}/results.json`,JSON.stringify({deterministicSeeking:true,animatedSand:true,shaderErrors:errors,...stats},null,2)+'\n');
 console.log('Water checks passed:',stats);
} finally {await browser.close();}
