// Kick with and without the impact feedback, same camera and time: frames → video/frames/impact_<g>_<on|off>/.
// node scripts/record-impact.mjs [group]
import {chromium} from 'playwright-core';import {homedir} from 'node:os';import {mkdir,rm} from 'node:fs/promises';
const g=process.argv[2]||'B',browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
for(const on of [true,false]){const dir=`video/frames/impact_${g}_${on?'on':'off'}`;await rm(dir,{recursive:true,force:true});await mkdir(dir,{recursive:true});
 const page=await browser.newPage({viewport:{width:960,height:540}});await page.setViewportSize({width:960,height:720});
 await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4&group=${g}${on?'':'&impact=0'}`);await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');
 // Behind the ball until the wind-up fixes the aim, then the camera swings round to the side (unrecorded) so the kick runs across the frame.
 await page.evaluate(()=>{const g=window.__GAME__,p=g.targets().ball;g.placeBall(p[0],p[2]);g.teleport(p[0],p[2]+1.3);g.view(0);g.step(.5);g.interact();for(let i=0;i<300&&!(g.kick&&g.kick.age>=0);i++)g.step(1/60);g.view(1.25);for(let i=0;i<12;i++)g.step(1/60);for(const el of document.body.children)if(el.tagName!=='CANVAS')el.style.visibility='hidden';});
 for(let i=0;i<90;i++){await page.evaluate(()=>{window.__GAME__.step(1/60);return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await page.screenshot({path:`${dir}/${String(i).padStart(4,'0')}.png`});}
 await page.close();}
await browser.close();
