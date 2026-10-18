import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import assert from 'node:assert/strict';
await mkdir('shots/explore',{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5191/scene.html?explore=1&auto=1&group=A&time=4');await page.waitForFunction(()=>window.__READY__);
 await page.screenshot({path:'shots/explore/start.png'});await page.click('#begin');
 // Fixed simulation steps keep the scripted walk reproducible even under SwiftShader.
 async function walk(key,steps){await page.keyboard.down(key);await page.evaluate(n=>{for(let i=0;i<n;i++)window.__EXPLORE__.update(1/60);},steps);await page.keyboard.up(key);await page.evaluate(()=>{for(let i=0;i<45;i++)window.__EXPLORE__.update(1/60);});}
 const initial=await page.evaluate(()=>window.__EXPLORE__.player.toArray());
 await walk('KeyW',170);await page.screenshot({path:'shots/explore/walk1.png'});
 await walk('KeyD',110);await page.screenshot({path:'shots/explore/walk2.png'});
 const walked=await page.evaluate(()=>window.__EXPLORE__.player.toArray());assert(Math.hypot(walked[0]-initial[0],walked[2]-initial[2])>3);
 await page.keyboard.press('Digit2');await page.waitForFunction(()=>!window.__EXPLORE__.busy&&window.__EXPLORE__.group==='B');
 assert.deepEqual(await page.evaluate(()=>window.__EXPLORE__.player.toArray()),walked);
 await page.screenshot({path:'shots/explore/group_switch.png'});
 await page.keyboard.press('Digit3');await page.waitForFunction(()=>!window.__EXPLORE__.busy&&window.__EXPLORE__.group==='C');
 await page.keyboard.press('Digit1');await page.waitForFunction(()=>!window.__EXPLORE__.busy&&window.__EXPLORE__.group==='A');
 await page.keyboard.press('KeyV');assert(await page.evaluate(()=>window.__EXPLORE__.first));await page.keyboard.press('KeyV');
 await page.keyboard.press('KeyP');const frozen=await page.evaluate(()=>window.__EXPLORE__.player.toArray());await walk('KeyW',120);assert.deepEqual(await page.evaluate(()=>window.__EXPLORE__.player.toArray()),frozen);await page.keyboard.press('KeyP');
 await walk('KeyW',2400);assert(await page.evaluate(async()=>{const {groundHeight}=await import('/src/terrain.js');const p=window.__EXPLORE__.player;return groundHeight(p.x,p.z)>=-.65&&window.__SCENE__.camera.position.y>groundHeight(window.__SCENE__.camera.position.x,window.__SCENE__.camera.position.z);}));
 assert.deepEqual(errors,[]);console.log('Explore: walk, group A/B/C, retained position, perspective, photo freeze, deep-water and camera bounds passed.');
} finally {await browser.close();}
