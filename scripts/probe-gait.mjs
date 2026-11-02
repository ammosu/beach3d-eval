// Walk and run width, A/B/C: how far each foot and knee sits from the body's centre line over a stride (cm, signed along the body's right, min/avg/max over
// the stride; narrow = feet close to one line), the closest and widest, and stills from in front (shots/gait/).
// node scripts/probe-gait.mjs [groups] [outdir]
import {chromium} from 'playwright-core';import {homedir} from 'node:os';import {mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
const groups=(process.argv[2]||'ABC').split(''),out=process.argv[3]||'shots/gait';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
for(const g of groups){const page=await browser.newPage({viewport:{width:960,height:720}});
 await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4&group=${g}`);await page.waitForFunction(()=>window.__READY__,null,{timeout:90000});await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');await page.evaluate(()=>{for(const el of document.body.children)if(el.tagName!=='CANVAS')el.style.visibility='hidden';});
 for(const [name,keys] of [['idle',[]],['walk',['KeyW']],['run',['KeyW','ShiftLeft']]]){
  await page.evaluate(()=>{const G=window.__GAME__;G.teleport(-20,-6);G.view(Math.PI/2);G.step(.6);});for(const k of keys)await page.keyboard.down(k);await page.evaluate(()=>window.__GAME__.step(1.4));
  const r=await page.evaluate(()=>{const G=window.__GAME__,L=[];for(let i=0;i<72;i++){G.step(1/60);L.push(G.legs());}return L;});
  const stat=(k,i)=>{const v=r.map(x=>x[k][i]);return [Math.min(...v),v.reduce((a,b)=>a+b)/v.length,Math.max(...v)].map(x=>+(x*100).toFixed(1));};
  const hip=r.map(x=>x.hip);console.log(g,name,`speed ${r[0].speed.toFixed(1)}`,'side',r[0].side,'hip min/avg/max',[Math.min(...hip),hip.reduce((a,b)=>a+b)/hip.length,Math.max(...hip)].map(x=>+(x*100).toFixed(1)),'foot',stat('foot',0),stat('foot',1),'knee',stat('knee',0),stat('knee',1));
  const files=[];for(let i=0;i<4;i++){await page.evaluate(()=>{const G=window.__GAME__,{camera}=window.__SCENE__,P=window.__EXPLORE__.player,y=window.__EXPLORE__.avatar.rotation.y;G.step(.1);const put=()=>{const p=window.__EXPLORE__.player;camera.position.set(p.x+Math.sin(y)*4.2,p.y+1,p.z+Math.cos(y)*4.2);camera.lookAt(p.x,p.y+.85,p.z);};return new Promise(r=>{put();requestAnimationFrame(()=>{put();requestAnimationFrame(()=>{put();r();});});});});const f=`${out}/${g}_${name}_${i}.png`;await page.screenshot({path:f});files.push(f);}
  execFileSync('python3',['-c',`import sys;from PIL import Image
fs=sys.argv[2:];s=Image.new('RGB',(300*len(fs),300))
for i,f in enumerate(fs):s.paste(Image.open(f).crop((230,110,730,610)).resize((300,300)),(i*300,0))
s.save(sys.argv[1])`,`${out}/${g}_${name}.png`,...files]);
  for(const k of keys)await page.keyboard.up(k);}
 await page.close();}
await browser.close();
