// Ball physics audit (Rapier, src/game/world.js + physics.js): how far a kick at power 0 / 0.5 / 1 carries from the
// ball's start towards the sea (after 3.1 s and once settled), whether the ball rests still on the slope, and the
// walk-into-it push. Stills (SNAP=1) → shots/ball/. node scripts/probe-ball.mjs [groups]
import {chromium} from 'playwright-core';import {homedir} from 'node:os';import {mkdir} from 'node:fs/promises';
const groups=(process.argv[2]||'B').split(''),out='shots/ball';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
for(const g of groups){const page=await browser.newPage({viewport:{width:1280,height:720}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4&group=${g}`);await page.waitForFunction(()=>window.__READY__,null,{timeout:90000});await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');
 const rest=await page.evaluate(()=>{const G=window.__GAME__;G.placeBall(-4,-8);G.teleport(-9,0);const a=G.targets().ball;G.step(5);const b=G.targets().ball;return +Math.hypot(b[0]-a[0],b[2]-a[2]).toFixed(3);});
 console.log(g,'rest drift over 5 s',rest);
 for(const hold of [0,.5,1]){
  const r=await page.evaluate(hold=>{const G=window.__GAME__;G.placeBall(-4,-8);const s=G.targets().ball;G.teleport(s[0],s[2]+1.6);G.view(0);G.step(.3);G.press();for(let t=0;t<hold-1e-6;t+=1/60)G.step(1/60);G.release();
   for(let i=0;i<400&&!(G.kick&&G.kick.hit);i++)G.step(1/60);const hit=G.targets().ball;let peak=hit[1];for(let t=0;t<3.1;t+=1/60){G.step(1/60);peak=Math.max(peak,G.targets().ball[1]);}
   const a=G.targets().ball;G.step(6);const b=G.targets().ball;const d=p=>+Math.hypot(p[0]-s[0],p[2]-s[2]).toFixed(1);return {at3s:d(a),settled:d(b),peak:+(peak-hit[1]).toFixed(2),sea:G.state.ball,endY:+b[1].toFixed(2)};},hold);
  console.log(g,'power',hold,JSON.stringify(r));}
 const push=await page.evaluate(async()=>{const G=window.__GAME__;G.placeBall(-4,-8);G.teleport(-4,-4.5);G.view(0);G.step(.3);return true;});
 await page.keyboard.down('KeyW');const walk=await page.evaluate(()=>{const G=window.__GAME__;const a=G.targets().ball;G.step(2.5);const b=G.targets().ball;return +Math.hypot(b[0]-a[0],b[2]-a[2]).toFixed(2);});await page.keyboard.up('KeyW');
 await page.evaluate(()=>{const G=window.__GAME__;G.placeBall(-4,-8);G.teleport(-4,-4.5);G.view(0);G.step(.3);});
 await page.keyboard.down('KeyW');await page.keyboard.down('ShiftLeft');const run=await page.evaluate(()=>{const G=window.__GAME__;const a=G.targets().ball;G.step(2);const b=G.targets().ball;return +Math.hypot(b[0]-a[0],b[2]-a[2]).toFixed(2);});await page.keyboard.up('ShiftLeft');await page.keyboard.up('KeyW');
 console.log(g,'walked into it 2.5 s: ball moved',walk,'m; ran into it 2 s:',run,'m');
 if(process.env.SNAP){await page.evaluate(()=>{const G=window.__GAME__;G.placeBall(-4,-8);G.teleport(-4,-5);G.view(.3);G.step(.5);});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${out}/${g}_rest.png`});}
 if(errs.length)console.log(g,'errors',errs);await page.close();}
await browser.close();
