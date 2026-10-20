// Open-sea probe: row to the buoy, release all 7 animals, then save stills from the boat camera and a wide free camera.
// node scripts/probe-sea.mjs [groups=ABC] [gpu]   → shots/sea/
import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
const [groups='ABC',gpu]=process.argv.slice(2),out='shots/sea';await mkdir(out,{recursive:true});
const args=gpu?['--use-gl=angle','--use-angle=gl-egl']:['--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args});
const errors=[];let page;
const step=s=>page.evaluate(s=>window.__GAME__.step(s),s);
// Render the game camera, or a free camera at eye looking at look (world).
async function snap(name,eye,look){
 const url=await page.evaluate(([eye,look])=>{const {scene,renderer,camera}=window.__SCENE__;let cam=camera;if(eye){cam=camera.clone();cam.position.fromArray(eye);cam.up.set(0,1,0);cam.lookAt(...look);cam.fov=45;cam.updateProjectionMatrix();}renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');},[eye,look]);
 await writeFile(`${out}/${name}.png`,Buffer.from(url.split(',')[1],'base64'));
}
for(const g of groups){
 await page?.close();page=await browser.newPage({viewport:{width:960,height:640}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5191/game.html?auto=1&time=4');await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');
 await page.evaluate(async g=>{await window.__EXPLORE__.switchGroup(g);await window.__GAME__.sea?.ready;const G=window.__GAME__,p=G.targets().boat;G.teleport(p[0],p[2]);G.step(.2);G.interact();G.step(1);},g);
 const island=await page.evaluate(()=>window.__GAME__.targets().island);
 for(let i=0;i<100;i++){const v=await page.evaluate(()=>window.__GAME__.vessel),dx=island.x-v.x,dz=island.z-v.z,d=Math.hypot(dx,dz);if(d<7)break;await page.evaluate(a=>window.__GAME__.steer(a),Math.atan2(-dx,-dz));await page.keyboard.down('KeyW');await step(Math.min(1.5,(d-5)/9));await page.keyboard.up('KeyW');}
 await step(1.5);
 if(!process.env.NOREL)for(let i=0;i<7;i++){await page.evaluate(()=>window.__GAME__.interact());for(let k=0;k<3;k++){await step(.3);if(i<2||k===1)await snap(`sea_${g}_release${i}_${k}`);}}
 await step(2);if(!process.env.NOREL)console.log(g,JSON.stringify(await page.evaluate(()=>({released:window.__GAME__.state.released,opensea:window.__GAME__.state.opensea,sources:window.__GAME__.sea.creatures.map(c=>c.source)}))));
 const v=await page.evaluate(()=>window.__GAME__.vessel);
 for(let k=0;k<(+process.env.FRAMES||12);k++){await step(+process.env.EVERY||1.5);await snap(`sea_${g}_boat${String(k).padStart(2,"0")}`);if(process.env.CAM)console.log(k,JSON.stringify(await page.evaluate(()=>{const c=window.__SCENE__.camera;return {cam:c.position.toArray().map(v=>+v.toFixed(2)),v:window.__GAME__.vessel,audit:window.__GAME__.cameraAudit};})));if(k%3===0)await snap(`sea_${g}_wide${String(k).padStart(2,'0')}`,[v.x+22,9,v.z+18],[island.x,0,island.z+6]);}
}
console.log('errors',JSON.stringify(errors));await browser.close();
