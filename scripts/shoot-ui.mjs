// Game UI states for interface review: node scripts/shoot-ui.mjs <mobile|desktop> <outdir> [group]
// → <outdir>/seg-1..7.png: start, near a shell, tower, tide pool, boat at sea (toast), pause, complete.
import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import {mkdir} from 'node:fs/promises';
const [profile='desktop',out='shots/ui',group='B']=process.argv.slice(2);await mkdir(out,{recursive:true});
const mobile=profile==='mobile',port=process.env.PORT||5191;
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage(mobile?{viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true}:{viewport:{width:1440,height:900}});
 page.on('pageerror',e=>console.error('pageerror',e.message));
 await page.goto(`http://localhost:${port}/game.html?auto=1&time=4&group=${group}${mobile?'&lite=1':''}`);
 await page.waitForFunction(()=>window.__READY__,null,{timeout:180000});await page.evaluate(()=>window.__TIME__=4);
 let n=0;const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__SCENE__.renderer.getContext().finish();r();}))));await page.screenshot({path:`${out}/seg-${++n}.png`});console.log('shot',n,name);};
 const g=(f,a)=>page.evaluate(f,a);
 await shot('start');
 await page.click('#begin');
 const t=await g(()=>window.__GAME__.targets());
 await g(s=>{const G=window.__GAME__;G.teleport(s.x,s.z+.8);G.step(.3);G.interact();G.step(1.3);},t.shells[0]);
 await g(s=>{const G=window.__GAME__;G.teleport(s.x,s.z+1.6);G.view(0);G.step(.6);},t.shells[1]);await shot('near shell');
 await g(p=>{const G=window.__GAME__;G.teleport(p[0],p[2]);G.step(.2);G.interact();G.step(5.5);},t.lifeguard);await shot('tower');
 await g(()=>{const G=window.__GAME__;G.interact();G.step(5.5);});
 // The rock pool, then out in the boat.
 await g(p=>{const G=window.__GAME__;G.teleport(p[0],p[2]);G.step(.3);G.interact();},t.tidepool);
 await page.waitForFunction(()=>document.querySelector('#lagoon iframe')?.contentWindow?.__READY__,null,{timeout:180000});
 await g(()=>{const T=document.querySelector('#lagoon iframe').contentWindow.__TIDEPOOL__;T.stones.forEach((_,i)=>T.lift(i));T.step(1);T.species.slice(0,2).forEach(s=>T.observe(s.id));T.step(.5);});
 await page.waitForTimeout(1500);await shot('tide pool');
 await page.click('#lagoon-back');await g(()=>window.__GAME__.step(.5));
 await g(p=>{const G=window.__GAME__;G.teleport(p[0],p[2]);G.step(.2);G.interact();G.step(1.6);},t.boat);
 await page.keyboard.down('KeyW');await g(()=>window.__GAME__.step(5));await page.keyboard.up('KeyW');
 await g(()=>{const G=window.__GAME__;G.step(.5);G.interact();G.step(.3);});await shot('boat toast');
 // Pause: what losing pointer lock shows outside automation (game-paused's rules: auto stays active, so the frame loop clears the class).
 await g(()=>{document.querySelector('#start').hidden=false;document.head.insertAdjacentHTML('beforeend','<style id=paused-sim>#game{visibility:hidden}#explore .hud{display:none!important}</style>');});await shot('pause');
 await g(()=>{document.querySelector('#start').hidden=true;document.querySelector('#paused-sim').remove();});
 // Complete: the real dialog, filled as complete() fills it.
 await g(()=>{document.body.classList.add('game-complete');const c=document.querySelector('#complete');c.hidden=false;c.querySelector('#finish-time').textContent='這次的海邊時光　9:42';c.querySelector('#finish-bonus').textContent='還留下了一串會消失的腳印。';});await shot('complete');
}finally{await browser.close();}
