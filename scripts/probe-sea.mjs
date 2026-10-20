// Open-sea probe: row to the buoy, observe all 7 animals as they surface (stills at each sighting), then save stills from the boat camera and a wide free camera.
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
 if(!process.env.NOREL)for(let i=0,idle=0,yaw=0,t0=0;i<400&&(await page.evaluate(()=>window.__GAME__.state.spotted))<7;i++){
  const label=await page.evaluate(()=>{const p=document.querySelector('#target-prompt');return p.hidden?'':p.innerText;});
  if(/觀察/.test(label)){const n=await page.evaluate(()=>window.__GAME__.state.spotted);if(process.env.WHY)console.log(await page.evaluate(()=>{const G=window.__GAME__,{camera}=window.__SCENE__,t=window.__TIME__;return G.sea.creatures.filter(c=>!c.seen).map(c=>{const p=G.sea.pose(c.i,t);if(!p.showing)return null;const v=p.pos.clone().project(camera);return [c.spec.id,+(p.depth+c.top).toFixed(2),+p.pos.distanceTo(G.vessel).toFixed(1),+v.x.toFixed(2),+v.y.toFixed(2)];}).filter(Boolean);}));await snap(`sea_${g}_spot${n}`);await page.evaluate(()=>window.__GAME__.interact());console.log(g,'t',i*.5,label.trim());idle=0;}
  else if(++idle%12===0){yaw+=1.2;await page.evaluate(a=>window.__GAME__.steer(a),yaw);}
  await step(.5);}
 if(!process.env.NOREL)console.log(g,JSON.stringify(await page.evaluate(()=>({spotted:window.__GAME__.state.spotted,opensea:window.__GAME__.state.opensea,sources:window.__GAME__.sea.creatures.map(c=>c.source)}))));
 const v=await page.evaluate(()=>window.__GAME__.vessel);
 for(let k=0;k<(+process.env.FRAMES||12);k++){await step(+process.env.EVERY||1.5);await snap(`sea_${g}_boat${String(k).padStart(2,"0")}`);if(process.env.CAM)console.log(k,JSON.stringify(await page.evaluate(()=>{const c=window.__SCENE__.camera;return {cam:c.position.toArray().map(v=>+v.toFixed(2)),v:window.__GAME__.vessel,audit:window.__GAME__.cameraAudit};})));if(k%3===0)await snap(`sea_${g}_wide${String(k).padStart(2,'0')}`,[v.x+22,9,v.z+18],[island.x,0,island.z+6]);}
}
console.log('errors',JSON.stringify(errors));await browser.close();
