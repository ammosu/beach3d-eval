// Coconuts (src/game/coconuts.js) and carrying (src/game/index.js): pick one up, walk with it, throw it at full and
// half charge along the camera, set one down with a tap, and check it floats. Stills → shots/carry/<g>_<step>.png.
// node scripts/probe-carry.mjs [groups]
import {chromium} from 'playwright-core';import {homedir} from 'node:os';import {mkdir} from 'node:fs/promises';
const groups=(process.argv[2]||'B').split(''),out='shots/carry';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
for(const g of groups){const page=await browser.newPage({viewport:{width:960,height:720}});const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4&group=${g}`);await page.waitForFunction(()=>window.__READY__,null,{timeout:90000});await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');
 const snap=async name=>{await page.evaluate(()=>{for(const el of document.body.children)if(el.tagName!=='CANVAS')el.style.visibility='hidden';});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${out}/${g}_${name}.png`});await page.evaluate(()=>{for(const el of document.body.children)el.style.visibility='';});};
 const cam=async()=>page.evaluate(()=>{const p=window.__EXPLORE__.player,{camera}=window.__SCENE__,y=window.__EXPLORE__.avatar.rotation.y;window.__GAME__.cameraHold=true;camera.position.set(p.x+Math.cos(y)*3.2+Math.sin(y)*1.2,p.y+1.6,p.z-Math.sin(y)*3.2+Math.cos(y)*1.2);camera.lookAt(p.x,p.y+1,p.z);});
 console.log(g,'coconuts',JSON.stringify(await page.evaluate(()=>window.__GAME__.coconuts.items.map(c=>c.pos))));
 // Pick up the first coconut.
 const pick=await page.evaluate(()=>{const G=window.__GAME__,c=G.coconuts.items[0].pos;G.teleport(c[0]+1.2,c[2]+.4);G.step(.2);G.interact();G.step(.55);return null;});
 await snap('reach');
 const got=await page.evaluate(()=>{const G=window.__GAME__;G.step(1.2);return G.coconuts;});console.log(g,'after pickup carry',got.carry,JSON.stringify(got.items[0]));
 // Walk with it.
 await page.evaluate(()=>{const G=window.__GAME__;G.teleport(-8,4);G.view(0);G.step(.2);});await page.keyboard.down('KeyW');await page.evaluate(()=>window.__GAME__.step(1.2));await snap('carry');await page.keyboard.up('KeyW');
 await page.evaluate(()=>window.__GAME__.step(.6));
 // Charge 1 s (full) towards the sea and throw.
 const from=await page.evaluate(()=>{const G=window.__GAME__;G.view(0);G.step(.2);G.press();G.step(.8);return window.__EXPLORE__.player.toArray();});await snap('windup');
 const thrown=await page.evaluate(()=>{const G=window.__GAME__;G.release();G.step(.1);const a=G.coconuts.toss;G.step(.12);const b=G.coconuts;G.step(3);const c=G.coconuts;return {a,b:b.items[0],c:c.items[0],carry:c.carry};});
 console.log(g,'throw',JSON.stringify(thrown),'from',from.map(x=>+x.toFixed(2)),'dist',+Math.hypot(thrown.c.pos[0]-from[0],thrown.c.pos[2]-from[2]).toFixed(1));
 // Pick up the second, set it down with a tap.
 await page.evaluate(()=>{const G=window.__GAME__,c=G.coconuts.items[1].pos;G.teleport(c[0]+1.2,c[2]+.4);G.step(.2);G.interact();G.step(1.8);});
 const placed=await page.evaluate(()=>{const G=window.__GAME__;const p=window.__EXPLORE__.player.toArray();G.press();G.step(1/60);G.release();G.step(.25);return {p};});await snap('place');
 const after=await page.evaluate(()=>{const G=window.__GAME__;G.step(1.5);return G.coconuts;});
 console.log(g,'placed',JSON.stringify(after.items[1]),'carry',after.carry,'from',placed.p.map(x=>+x.toFixed(2)));
 // Is the thrown one floating (in the sea after 3 s)? Step 5 s more and report height vs drawn water.
 const fl=await page.evaluate(()=>{const G=window.__GAME__;G.step(5);const c=G.coconuts.items[0].pos;const w=G.wave(c[0],c[2],window.__TIME__);return {pos:c,water:+w.drawn.toFixed(2)};});console.log(g,'thrown one later',JSON.stringify(fl));
 if(errs.length)console.log(g,'errors',errs);await page.close();}
await browser.close();
