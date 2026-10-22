// Close-ups of the game extras per group (castle built, kite in the air, a crab out of its hole, a bird) → shots/extras/<g>_<what>.png
// usage: node scripts/probe-extras.mjs [groups]
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
import {homedir} from 'node:os';
const groups=(process.argv[2]||'ABC').split(''),out='shots/extras';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
page.on('pageerror',e=>console.log('pageerror',e.message));
await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4`);await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);
await page.click('#begin');
const g=(f,...a)=>page.evaluate(f,...a),shot=async name=>{await page.waitForTimeout(400);await page.screenshot({path:`${out}/${name}.png`});console.log(name);};
// Point the scene camera straight at a world point from an offset, after the game's own frame (the game camera is overridden for this still only).
// The game sets its camera every frame, so the still pins the scene camera inside renderer.render (only for the scene camera, not the bloom passes).
async function look(target,offset,name){await g(([t,o])=>{const s=window.__SCENE__,r=s.renderer;if(!r.__pinned){const orig=r.render.bind(r);r.render=(scene,cam)=>{const p=window.__PIN__;if(p&&cam===s.camera){cam.position.set(...p.pos);cam.lookAt(...p.at);cam.updateMatrixWorld();}return orig(scene,cam);};r.__pinned=true;}window.__PIN__={pos:[t[0]+o[0],t[1]+o[1],t[2]+o[2]],at:t};},[target,offset]);await shot(name);await g(()=>{window.__PIN__=null;});}
for(const group of groups){
 await g(x=>window.__EXPLORE__.switchGroup(x),group);await page.waitForTimeout(2500);
 const p=await g(()=>window.__GAME__.targets());
 await g(([x,z])=>{const G=window.__GAME__;G.teleport(x,z+1);G.view(.65);G.step(.3);},[p.castle[0],p.castle[2]]);await page.keyboard.press('KeyE');
 await g(()=>{const G=window.__GAME__;G.step(G.extras.castle.startedAt+4.5-window.__TIME__);});await shot(`${group}_castle`);
 await g(()=>{const G=window.__GAME__;G.step(G.extras.castle.startedAt+6.6-window.__TIME__);});await page.keyboard.press('KeyE');await g(()=>window.__GAME__.step(4.2));
 await g(([x,z])=>{const G=window.__GAME__;G.teleport(x,z);G.step(.3);},[p.kite[0],p.kite[2]]);await page.keyboard.press('KeyE');await g(()=>window.__GAME__.step(8));await shot(`${group}_kite`);
 const k=await g(()=>window.__SCENE__.scene.getObjectByName('extra-kite').position.toArray());await look(k,[-4,-1.5,6],`${group}_kite_close`);
 await page.keyboard.press('KeyE');await g(()=>window.__GAME__.step(6));
 // A crab out walking, from 1.2 m away and low (the player is moved off so it does not hide).
 await g(()=>{const G=window.__GAME__;G.teleport(-7,14);G.step(.2);});let crab=null;
 for(let n=0;n<60&&!crab;n++)crab=await g(()=>{window.__GAME__.step(.3);return window.__GAME__.extras.crabs.find(c=>c.state==='walking');});
 if(crab){const pos=await g(i=>{const r=window.__SCENE__.scene.getObjectByName('extra-crabs');let best=null;r.traverse(o=>{if(o.isGroup&&o.visible&&o.parent===r){const d=Math.hypot(o.position.x-i[0],o.position.z-i[1]);if(!best||d<best.d)best={d,p:o.position.toArray()};}});return best.p;},[crab.x,crab.z]);await look([pos[0],pos[1]+.05,pos[2]],[.5,.45,1.0],`${group}_crab`);}
 const bird=await g(()=>{const r=window.__SCENE__.scene.getObjectByName('extra-birds');return r.children[1].position.toArray();});await look(bird,[2.2,.8,2.2],`${group}_bird`);
}
await browser.close();
