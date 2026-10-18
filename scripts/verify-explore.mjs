import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 // Exercise the unavailable-asset path regardless of files being regenerated concurrently.
 await page.route('**/assets/tripo/*.glb',r=>r.fulfill({status:404,body:'unavailable'}));
 await page.goto('http://localhost:5191/scene.html?explore=1&auto=1');await page.waitForFunction(()=>window.__READY__);await page.click('#begin');
 await page.keyboard.press('Space');assert(await page.evaluate(async()=>{const e=window.__EXPLORE__,y=e.player.y;e.update(.05);return e.player.y>y;}));
 await page.evaluate(()=>{for(let i=0;i<100;i++)window.__EXPLORE__.update(1/60);});
 // Approach the boat directly. Collision must stop the player before its expanded box.
 await page.evaluate(async()=>{const e=window.__EXPLORE__,b=e.colliders.find(c=>c.id==='boat').box;const {groundHeight}=await import('/src/terrain.js');e.player.set((b.min.x+b.max.x)/2,0,b.max.z+2);e.player.y=groundHeight(e.player.x,e.player.z);});
 await page.keyboard.down('KeyW');await page.evaluate(()=>{for(let i=0;i<150;i++)window.__EXPLORE__.update(1/60);});await page.keyboard.up('KeyW');
 assert(await page.evaluate(()=>{const e=window.__EXPLORE__,b=e.colliders.find(c=>c.id==='boat').box;return e.player.z>=b.max.z+.31;}));
 await page.click('[data-group=B]');await page.waitForFunction(()=>!window.__EXPLORE__.busy&&window.__EXPLORE__.group==='B');assert.match(await page.locator('#stats').textContent(),/8 個素材/);
 await page.evaluate(async()=>{await Promise.all([window.__EXPLORE__.switchGroup('C'),window.__EXPLORE__.switchGroup('A')]);});await page.waitForFunction(()=>!window.__EXPLORE__.busy&&window.__EXPLORE__.group==='A');
 assert.equal(await page.evaluate(()=>window.__SCENE__.propRoot.children.length),8);
 await page.keyboard.press('KeyP');assert.equal(await page.locator('.hud').isVisible(),false);await page.keyboard.press('KeyP');
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await mobile.goto('http://localhost:5191/scene.html?explore=1&auto=1');await mobile.waitForFunction(()=>window.__READY__);await mobile.tap('#begin');
 const before=await mobile.evaluate(()=>window.__EXPLORE__.player.z);
 await mobile.locator('#stick').dispatchEvent('pointerdown',{pointerId:1,clientX:80,clientY:690});await mobile.locator('#stick').dispatchEvent('pointermove',{pointerId:1,clientX:80,clientY:645});await mobile.evaluate(()=>{for(let i=0;i<120;i++)window.__EXPLORE__.update(1/60);});await mobile.locator('#stick').dispatchEvent('pointerup',{pointerId:1});
 assert(await mobile.evaluate(z=>window.__EXPLORE__.player.z<z-1,before));await mobile.screenshot({path:'shots/explore/mobile.png'});
 console.log('Explore: jump, prop collision, all missing GLBs, rapid switching, photo HUD, touch movement passed.');
}finally{await browser.close();}
