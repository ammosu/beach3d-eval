import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output='shots/tidepool';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],errors=[];
function monitor(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/404|Failed to load resource/.test(m.text()))errors.push(m.text());});}
try{
 for(const group of ['A','B','C']){
  const page=await browser.newPage({viewport:{width:1280,height:800}});monitor(page);await page.goto(`http://localhost:5191/tidepool.html?auto=1&time=4&muted=1&group=${group}`);await page.waitForFunction(()=>window.__READY__,null,{timeout:120000});
  const shot=async suffix=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${output}/${group}_${suffix}.png`});};
  await shot('start');assert.equal(await page.evaluate(()=>window.__TIDEPOOL__.observe('octopus')),false,'hidden creatures cannot be observed');
  // A real pointer click lifts a stone; the other stones use the same public action.
  const point=await page.evaluate(()=>window.__TIDEPOOL__.project(0));await page.mouse.click(point.x,point.y);assert((await page.evaluate(()=>window.__TIDEPOOL__.stones))[0].lifted);
  await page.evaluate(()=>{const t=window.__TIDEPOOL__;for(let i=0;i<t.stones.length;i++)t.lift(i);t.step(1);});await shot('lifted');
  for(const id of await page.evaluate(()=>window.__TIDEPOOL__.species.map(s=>s.id))){assert(await page.evaluate(id=>window.__TIDEPOOL__.observe(id),id),id);}
  assert(await page.evaluate(()=>window.__TIDEPOOL__.done));assert.equal(await page.locator('#collection .found').count(),6);await shot('done');
  // A frozen clock is repeatable, including stones, creatures, water and caustics.
  const frozen=await page.evaluate(()=>window.__SCENE__.scene.children.map(c=>[c.position.toArray(),c.rotation.toArray()]));await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>window.__SCENE__.scene.children.map(c=>[c.position.toArray(),c.rotation.toArray()])),frozen);
  results.push(await page.evaluate(()=>({group:window.__TIDEPOOL__.group,found:window.__TIDEPOOL__.found,species:window.__TIDEPOOL__.species})));await page.close();console.log('Verified tide pool',group);
 }
 // Force absent GLBs even when assets have arrived in parallel.
 for(const group of ['B','C']){const page=await browser.newPage();monitor(page);await page.route('**/assets/tidepool/**/*.glb',r=>r.fulfill({status:404,body:'missing'}));await page.goto(`http://localhost:5191/tidepool.html?auto=1&time=3&group=${group}`);await page.waitForFunction(()=>window.__READY__);assert(await page.evaluate(()=>window.__TIDEPOOL__.species.every(s=>s.fallback&&s.source==='A')));await page.close();}
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});monitor(mobile);await mobile.goto('http://localhost:5191/tidepool.html?auto=1&time=4&muted=1');await mobile.waitForFunction(()=>window.__READY__);const p=await mobile.evaluate(()=>window.__TIDEPOOL__.project(0));await mobile.touchscreen.tap(p.x,p.y);await mobile.evaluate(()=>window.__TIDEPOOL__.step(1));assert((await mobile.evaluate(()=>window.__TIDEPOOL__.stones))[0].lifted);const crab=await mobile.evaluate(()=>window.__TIDEPOOL__.project('hermit_crab'));await mobile.touchscreen.tap(crab.x,crab.y);assert(await mobile.locator('#observation').isVisible());assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.screenshot({path:`${output}/mobile.png`});await mobile.close();
 const normal=await browser.newPage();monitor(normal);await normal.goto('http://localhost:5191/tidepool.html?time=2');await normal.waitForFunction(()=>window.__READY__);assert(await normal.evaluate(()=>!window.__TIDEPOOL__.observe&&!window.__TIDEPOOL__.lift&&!window.__TIDEPOOL__.step));await normal.close();
 assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify({results,errors},null,2));console.log('Tide-pool verification passed');
}finally{await browser.close();}
