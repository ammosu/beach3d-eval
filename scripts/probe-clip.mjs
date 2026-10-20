// Clipping audit: drive each scene interaction per group and report avatar vertices inside props (and the sand).
// node scripts/probe-clip.mjs [actions=rest,tower,boat,shell,ball] [groups=ABC]   (GPU headless)
// Each line: group action time → per target {n: vertices behind the surface, max: depth in m, worst bone}.
// SNAP=1 also saves stills around the avatar at each audit → shots/clip/<g>_<action>_<label>_{side,front,top}.png
import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('shots/clip',{recursive:true});
const [actions='rest,tower,boat,shell,ball',groups='ABC']=process.argv.slice(2);
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
const errors=[];
const fmt=r=>r.filter(t=>t.n).map(t=>`${t.id}:${t.n}/${(t.max*100).toFixed(0)}cm@${t.worst?.bone}`+(process.env.DETAIL?` at ${t.worst?.at?.map(x=>x.toFixed(2))} n ${t.worst?.normal}`:'')).join(' ')||'clean';
for(const g of groups)for(const action of actions.split(',')){
 const page=await browser.newPage({viewport:{width:640,height:400}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5191/game.html?auto=1&time=4');await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');
 await page.evaluate(async g=>{await window.__EXPLORE__.switchGroup(g);},g);
 const snap=async name=>{for(const [view,eye,look] of [['side',[2.2,1.1,0],[0,.6,0]],['front',[0,1.3,2.2],[0,.6,0]],['top',[.3,2.6,.3],[0,.5,0]]]){
  const url=await page.evaluate(([eye,look])=>{const {scene,renderer,camera}=window.__SCENE__,a=window.__EXPLORE__.avatar;const cam=camera.clone();a.updateWorldMatrix(true,false);cam.position.copy(a.localToWorld(cam.position.clone().fromArray(eye)));cam.up.set(0,1,0);cam.lookAt(a.localToWorld(cam.position.clone().fromArray(look)));cam.fov=50;cam.near=.05;cam.updateProjectionMatrix();renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');},[eye,look]);
  await writeFile(`shots/clip/${name}_${view}.png`,Buffer.from(url.split(',')[1],'base64'));}};
 const audit=async label=>{const r=await page.evaluate(()=>window.__GAME__.penetration());console.log(g,action,label,fmt(r));if(process.env.SNAP)await snap(`${g}_${action}_${label}`);};
 const run=(fn,arg)=>page.evaluate(fn,arg);
 if(action==='rest'){await run(()=>{const G=window.__GAME__,a=G.targets().umbrella;G.teleport(a[0],a[2]);G.step(.3);G.interact();});for(const t of [.5,1,2,4])await run(t=>window.__GAME__.step(t),t>1?t/2:t),await audit(`t${t}`);}
 if(action==='tower'){await run(()=>{const G=window.__GAME__,p=G.targets().lifeguard;G.teleport(p[0],p[2]);G.step(.3);G.interact();});let t=0;for(let i=0;i<16;i++){await run(()=>window.__GAME__.step(.25));t+=.25;await audit(`t${t.toFixed(2)}`);}}
 if(action==='boat'){await run(()=>{const G=window.__GAME__,p=G.targets().boat;G.teleport(p[0],p[2]);G.step(.2);G.interact();G.step(1);});await audit('seated');await page.keyboard.down('KeyW');for(let i=0;i<6;i++){await run(()=>window.__GAME__.step(.2));await audit(`row${i}`);}await page.keyboard.up('KeyW');}
 if(action==='shell'){await run(()=>{const G=window.__GAME__,s=G.targets().shells[0];G.teleport(s.x+.9,s.z+.9);G.step(.3);G.interact();});for(let i=0;i<8;i++){await run(()=>window.__GAME__.step(.2));await audit(`t${(i*.2+.2).toFixed(1)}`);}}
 if(action==='ball'){const b=await run(()=>window.__GAME__.targets().ball);await run(b=>{const G=window.__GAME__;G.teleport(b[0]+1.2,b[2]);G.view(Math.PI/2);G.step(.3);},b);await page.keyboard.down('KeyW');for(let i=0;i<8;i++){await run(()=>window.__GAME__.step(.15));await audit(`t${(i*.15).toFixed(2)}`);}await page.keyboard.up('KeyW');}
 await page.close();
}
console.log('errors',JSON.stringify(errors));await browser.close();
