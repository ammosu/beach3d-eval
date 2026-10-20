// IK probe: drive one game action per group and save close-up stills from a free camera, plus IK reach errors.
// node scripts/probe-ik.mjs <boat|shell|tower|walk> [groups=ABC] [gpu]
import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
const [action='boat',groups='ABC',gpu]=process.argv.slice(2),out='shots/ik';await mkdir(out,{recursive:true});
const args=gpu?['--use-gl=angle','--use-angle=gl-egl']:['--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args});
const errors=[];let page;
const step=s=>page.evaluate(s=>window.__GAME__.step(s),s);
// Render a free camera, framed relative to the avatar (local offsets: +z is the avatar's forward).
async function snap(name,eye,look=[0,1,0]){
 const url=await page.evaluate(([eye,look])=>{const {scene,renderer,camera}=window.__SCENE__,a=window.__EXPLORE__.avatar;const cam=camera.clone();a.updateWorldMatrix(true,false);
  const p=a.localToWorld(cam.position.clone().fromArray(eye)),q=a.localToWorld(cam.position.clone().fromArray(look));cam.up.set(0,1,0);cam.position.copy(p);cam.lookAt(q);cam.fov=40;cam.updateProjectionMatrix();renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');},[eye,look]);
 await writeFile(`${out}/${name}.png`,Buffer.from(url.split(',')[1],'base64'));
}
// Extreme close-up of hand i, from the avatar's front-side.
async function snapHand(name,i,eye=[.35,.25,.45]){
 const url=await page.evaluate(([i,eye])=>{const {scene,renderer,camera}=window.__SCENE__,a=window.__EXPLORE__.avatar,G=window.__GAME__;const cam=camera.clone();const h=G.handWorld(i);const off=a.localToWorld(h.clone().set(...eye)).sub(a.localToWorld(h.clone().set(0,0,0)));
  cam.up.set(0,1,0);cam.position.copy(h).add(off);cam.lookAt(h);cam.fov=30;cam.near=.02;cam.updateProjectionMatrix();renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');},[i,eye]);
 await writeFile(`${out}/${name}.png`,Buffer.from(url.split(',')[1],'base64'));
}
// World camera beside the tower ladder.
async function snapLadder(name,out_=4.5,side=2.2,up=1.6){
 const url=await page.evaluate(([o,sd,u])=>{const {scene,renderer,camera}=window.__SCENE__,l=window.__GAME__.ladder();const cam=camera.clone();cam.up.set(0,1,0);if(l.kind==='stairs'){const mid=l.bottom.clone().lerp(l.top,.5);cam.position.copy(mid).addScaledVector(l.right,-5).addScaledVector(l.normal,1.5);cam.position.y+=1.6;cam.lookAt(mid);}else{cam.position.copy(l.bottom).addScaledVector(l.normal,o).addScaledVector(l.right,sd);cam.position.y+=u;}const look=l.kind==='stairs'?l.bottom.clone().lerp(l.top,.5):l.top.clone();look.y-=l.kind==='stairs'?-.6:.2;cam.lookAt(look);cam.fov=45;cam.updateProjectionMatrix();renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');},[out_,side,up]);
 await writeFile(`${out}/${name}.png`,Buffer.from(url.split(',')[1],'base64'));
}
const info=()=>page.evaluate(()=>window.__GAME__.character);
for(const g of groups){
 // A fresh page per group: modes like the boat cannot be left anywhere.
 await page?.close();page=await browser.newPage({viewport:{width:960,height:640}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5191/game.html?auto=1&time=4'+(process.env.QS??''));await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');if(process.env.THUMB)await page.evaluate(v=>window.__THUMB__=+v,process.env.THUMB);
 await page.evaluate(async g=>{await window.__EXPLORE__.switchGroup(g);window.__GAME__.teleport(-22,10);window.__GAME__.step(.3);},g);
 if(action==='shell'){
  await page.evaluate(()=>{const G=window.__GAME__,s=G.targets().shells[0];G.teleport(s.x+.9,s.z+.9);G.step(.3);G.interact();});
  let total=0;for(const dt of [.2,.3,.15,.15,.1,.12,.15,.2,.4]){await step(dt);total+=dt;const c=await info();console.log(g,total.toFixed(2),c.animation,JSON.stringify(c.ik.hands),JSON.stringify(await page.evaluate(()=>window.__GAME__.state.shells)));await snap(`shell_${g}_${total.toFixed(2)}`,[2.3,1.1,.9],[0,.55,.35]);}
  await snap(`shell_${g}_front`,[0,1.2,2.4],[0,.6,0]);
 }
 if(action==='walk'){
  await page.evaluate(()=>{const G=window.__GAME__;G.teleport(-4,4);G.view(Math.PI/2);G.step(.3);});await page.keyboard.down('KeyW');
  for(let k=0;k<8;k++){await step(.13);const c=await info();console.log(g,k,c.animation,JSON.stringify(c.ik.feet));await snap(`walk_${g}_${k}`,[2.6,.7,0],[0,.5,0]);}
  await page.keyboard.up('KeyW');
 }
 if(action==='blend'){
  await page.evaluate(()=>{const G=window.__GAME__;G.teleport(-4,4);G.view(Math.PI/2);G.step(.3);});await page.keyboard.down('KeyW');await step(1);await page.keyboard.down('ShiftLeft');
  for(let k=0;k<10;k++){await step(.08);const c=await info();console.log(g,k,c.animation,c.clipTime?.toFixed(3),JSON.stringify(c.ik.feet?.map(x=>x&&+x.toFixed(3))));await snap(`blend_${g}_${k}`,[2.6,.8,0],[0,.6,0]);}
  await page.keyboard.up('ShiftLeft');for(let k=10;k<16;k++){await step(.1);const c=await info();console.log(g,k,c.animation);await snap(`blend_${g}_${k}`,[2.6,.8,0],[0,.6,0]);}
  await page.keyboard.up('KeyW');
 }
 if(action==='tower'){
  await page.evaluate(()=>{const G=window.__GAME__,p=G.targets().lifeguard;G.teleport(p[0],p[2]);G.step(.3);});await snap(`tower_${g}_approach`,[3.5,2.6,-5.5],[0,1.6,-1.2]);
  await page.evaluate(()=>window.__GAME__.interact());
  let total=0;for(const dt of (process.env.STEPS??'.3,.3,.3,.3,.3,.3,.4,.5,.8').split(',').map(Number)){await step(dt);total+=dt;const c=await info();console.log(g,total.toFixed(2),c.animation,JSON.stringify(c.ik),JSON.stringify(await page.evaluate(()=>window.__GAME__.contact()?.gap)));if(process.env.FOLLOW)await snap(`tower_${g}_${total.toFixed(2)}`,process.env.FOLLOW.includes(',')?process.env.FOLLOW.split(',').map(Number):[3,1.2,.5],[0,1.1,0]);else await snapLadder(`tower_${g}_${total.toFixed(2)}`,...(process.env.NEAR?[2.4,1.3,2.2]:[]));}
 }
 if(action==='boat'){
  await page.evaluate(()=>{const G=window.__GAME__,p=G.targets().boat;G.teleport(p[0],p[2]);G.step(.2);G.interact();G.step(1);});
  await snap(`boat_${g}_rest`,[2.2,1.6,2.6],[0,.6,0]);
  if(process.env.QUICK){for(const i of [0,1])await snapHand(`boat_${g}_gripAxis${i}`,i,[.5*(i?-1:1),.02,.02]);await snapHand(`boat_${g}_grip1`,1,[.3,.25,.45]);continue;}
  await page.keyboard.down('KeyW');
  for(const [k,s] of [[0,.35],[1,.35],[2,.35],[3,.35]]){await step(s);await snap(`boat_${g}_${k}`,[2.4,1.8,2.8],[0,.6,0]);console.log(g,k,JSON.stringify((await info()).ik),JSON.stringify(await page.evaluate(()=>window.__GAME__.vessel)));}
  await snap(`boat_${g}_top`,[0,4.5,.6],[0,0,0]);await snap(`boat_${g}_front`,[0,1.4,3.2],[0,.7,0]);await snap(`boat_${g}_side`,[3.4,1.2,0],[0,.7,0]);for(const i of [0,1]){await snapHand(`boat_${g}_grip${i}`,i,[.3*(i?1:-1),.25,.45]);await snapHand(`boat_${g}_gripTop${i}`,i,[0,.6,.1]);await snapHand(`boat_${g}_gripAxis${i}`,i,[.5*(i?-1:1),.02,.02]);}
 }
}
console.log('errors',JSON.stringify(errors));await browser.close();
