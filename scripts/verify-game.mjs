import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=process.env.GAME_SHOTS||'shots/game';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
function monitor(page,missing=false){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!(missing&&/404|Failed to load resource/.test(m.text())))errors.push(m.text());});}
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});monitor(page);
 await page.goto('http://localhost:5191/game.html?auto=1&time=4');await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);
 const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${output}/${name}.png`});console.log('shot',name);};
 const step=seconds=>page.evaluate(s=>window.__GAME__.step(s),seconds);
 const at=async(x,z)=>{await page.evaluate(([x,z])=>{const g=window.__GAME__;g.teleport(x,z);g.step(.35);},[x,z]);};
 const e=()=>page.keyboard.press('KeyE');
 assert.equal(await page.evaluate(()=>window.__EXPLORE__.group),'B');await shot('start');await page.click('#begin');
 // On-foot input and passive footprints use the shared controller.
 await page.keyboard.down('KeyW');await step(1.5);await page.keyboard.up('KeyW');assert((await page.evaluate(()=>window.__GAME__.state)).footprints>0);
 const targets=await page.evaluate(()=>window.__GAME__.targets());console.log('targets',JSON.stringify(targets));
 await at(targets.shells[0].x,targets.shells[0].z+1);await shot('shells');
 for(const shell of targets.shells){await at(shell.x,shell.z+.8);await e();await step(.75);}
 assert.equal((await page.evaluate(()=>window.__GAME__.state)).shells,8);
 await at(targets.ball[0],targets.ball[2]+1.3);await e();await step(4);assert((await page.evaluate(()=>window.__GAME__.state)).ball,'ball must reach deep water');await at(-4,-12);await shot('ball');
 await at(targets.umbrella[0],targets.umbrella[2]);await e();await step(2);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'rest');assert((await page.evaluate(()=>window.__GAME__.state)).lounger);await shot('lounger');await e();
 await at(targets.lifeguard[0],targets.lifeguard[2]);await e();await step(2);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'tower');assert((await page.evaluate(()=>window.__GAME__.state)).tower);await shot('tower');await e();
 await at(targets.boat[0],targets.boat[2]);await e();await step(1);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'boat');
 // An attempted early disembark at sea must be rejected. All travel uses W
 // physics, including acceleration, depth restrictions, and wave pose.
 async function paddleTo(goal){for(let i=0;i<100;i++){const v=await page.evaluate(()=>window.__GAME__.vessel),dx=goal.x-v.x,dz=goal.z-v.z,d=Math.hypot(dx,dz);if(d<7)return;await page.evaluate(a=>window.__GAME__.steer(a),Math.atan2(-dx,-dz));await page.keyboard.down('KeyW');await step(Math.min(1.5,(d-5)/9));await page.keyboard.up('KeyW');}throw Error('Boat failed to reach target');}
 await paddleTo({x:12,z:-65});await e();assert.equal(await page.evaluate(()=>window.__GAME__.mode),'boat');await shot('boat');
 await paddleTo(targets.island);assert((await page.evaluate(()=>window.__GAME__.state)).island);assert.equal((await page.evaluate(()=>window.__GAME__.state)).boat,false);
 await paddleTo({x:12,z:-65});await paddleTo(targets.dock);await e();await step(1);assert((await page.evaluate(()=>window.__GAME__.state)).boat);assert(await page.evaluate(()=>window.__GAME__.completed));assert(await page.locator('#complete').isVisible());await shot('complete');
 const result=await page.evaluate(()=>({state:window.__GAME__.state,elapsed:window.__GAME__.elapsed}));
 await page.click('#replay');assert.equal((await page.evaluate(()=>window.__GAME__.state)).shells,0);assert.equal(await page.evaluate(()=>window.__GAME__.completed),false);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'walk');
 // Switching uses keyboard and must retain progress/player position.
 for(const key of ['Digit1','Digit3','Digit2']){await page.keyboard.press(key);await page.waitForFunction(()=>!window.__EXPLORE__.busy);}
 assert.equal(await page.evaluate(()=>window.__EXPLORE__.group),'B');
 // CPU water field is seekable and reacts to time.
 const waves=await page.evaluate(()=>{const g=window.__GAME__;return [g.wave(12,-70,4),g.wave(12,-70,6),g.wave(12,-70,4)];});assert.deepEqual(waves[0],waves[2]);assert.notEqual(waves[0].height,waves[1].height);
 await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});monitor(mobile);await mobile.goto('http://localhost:5191/game.html?auto=1&time=4');await mobile.waitForFunction(()=>window.__READY__);await mobile.tap('#begin');
 const before=await mobile.evaluate(()=>window.__EXPLORE__.player.z);await mobile.locator('#stick').dispatchEvent('pointerdown',{pointerId:1,clientX:75,clientY:680});await mobile.locator('#stick').dispatchEvent('pointermove',{pointerId:1,clientX:75,clientY:635});await mobile.evaluate(()=>window.__GAME__.step(1));await mobile.locator('#stick').dispatchEvent('pointerup',{pointerId:1});assert((await mobile.evaluate(()=>window.__EXPLORE__.player.z))<before-1);
 await mobile.evaluate(()=>{const g=window.__GAME__,s=g.targets().shells[0];g.teleport(s.x,s.z+.8);g.step(.5);});await mobile.tap('#interact');assert.equal((await mobile.evaluate(()=>window.__GAME__.state)).shells,1);await mobile.evaluate(()=>window.__GAME__.step(1));await mobile.screenshot({path:`${output}/mobile.png`});assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.close();
 // Missing meshes still expose every slot interaction and a usable boat.
 const missing=await browser.newPage({viewport:{width:800,height:600}});monitor(missing,true);await missing.route('**/assets/tripo/*.glb',r=>r.fulfill({status:404,body:'unavailable'}));await missing.goto('http://localhost:5191/game.html?auto=1&time=4');await missing.waitForFunction(()=>window.__READY__);await missing.click('#begin');
 for(const [id,mode] of [['umbrella','rest'],['lifeguard','tower'],['boat','boat']]){await missing.evaluate(id=>{const g=window.__GAME__,p=g.targets()[id];g.teleport(p[0],p[2]);g.step(.2);g.interact();g.step(2);},id);assert.equal(await missing.evaluate(()=>window.__GAME__.mode),mode);await missing.keyboard.press('KeyE');await missing.evaluate(()=>window.__GAME__.step(.2));}
 assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify({...result,errors,checks:['all quests','boat round trip','early disembark blocked','restart','ABC keys','CPU waves seek','mobile joystick and interaction','missing assets']},null,2));console.log('Game verification passed',result);
}finally{await browser.close();}
