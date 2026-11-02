// Kick close-ups: side view of the ball kick at fixed ages → shots/kick/<g>_<age>.png, plus a contact sheet per
// group (shots/kick/<g>.png, needs python3 + PIL) and the IK reach errors at each age.
// node scripts/probe-kick.mjs [groups] [outdir]   (VIEW=front: from ahead, on the kicking side; POWER=<s held> charges
// through the real press/release path, else a full-power hook kick)
import {chromium} from 'playwright-core';import {homedir} from 'node:os';import {mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
const groups=(process.argv[2]||'ABC').split(''),out=process.argv[3]||'shots/kick';await mkdir(out,{recursive:true});
const VIEW=process.env.VIEW||'side',POWER=process.env.POWER?+process.env.POWER:null;const AGES=[0,.15,.28,.36,.42,.5,.62,.8];
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
for(const g of groups){const page=await browser.newPage({viewport:{width:960,height:720}});
 await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4&group=${g}`);await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');
 await page.evaluate(power=>{const g=window.__GAME__,p=g.targets().ball;g.teleport(p[0],p[2]+1.3);g.view(0);g.step(.3);if(power===null)g.interact();else{g.press();for(let t=0;t<power-1e-6;t+=1/60)g.step(1/60);g.release();}for(let i=0;i<300&&!(g.kick&&g.kick.age>=0);i++)g.step(1/60);},POWER);
 const files=[];let last=0;
 for(const age of AGES){
  const info=await page.evaluate(([age,last,view])=>{const g=window.__GAME__,{camera}=window.__SCENE__;g.step(Math.max(0,age-last));for(let i=0;i<30&&g.kick&&g.kick.age<age-.002;i++)g.step(1/60); // the hit-stop holds the age back
   // Side view from the kicking-foot side, a little behind the ball: the whole body and the ball in frame.
   const p=window.__EXPLORE__.player,b=g.targets().ball;window.__KICKCAM__??=(()=>{const dx=b[0]-p.x,dz=b[2]-p.z,n=Math.hypot(dx,dz);const f=[dx/n,dz/n],k=g.footWorld(g.kick.foot);let side=[-f[1],f[0]];if((k.x-p.x)*side[0]+(k.z-p.z)*side[1]<0)side=[-side[0],-side[1]];return view==='front'?{x:p.x+f[0]*4.2+side[0]*2.6,z:p.z+f[1]*4.2+side[1]*2.6,tx:p.x+f[0]*.5,tz:p.z+f[1]*.5,y:p.y}:{x:p.x+f[0]*.1+side[0]*4.2,z:p.z+f[1]*.1+side[1]*4.2,tx:p.x+f[0]*.7,tz:p.z+f[1]*.7,y:p.y};})();
   const c=window.__KICKCAM__;window.__GAME__.cameraOverride=true;camera.position.set(c.x,c.y+1.1,c.z);camera.lookAt(c.tx,c.y+.8,c.tz);
   return {age:g.kick?.age??null,ik:g.character.ik};},[age,last,VIEW]);last=age;
  await page.evaluate(()=>{const {camera}=window.__SCENE__,c=window.__KICKCAM__;return new Promise(r=>requestAnimationFrame(()=>{camera.position.set(c.x,c.y+1.1,c.z);camera.lookAt(c.tx,c.y+.8,c.tz);requestAnimationFrame(()=>{camera.position.set(c.x,c.y+1.1,c.z);camera.lookAt(c.tx,c.y+.8,c.tz);r();});}));});
  await page.evaluate(()=>{for(const el of document.body.children)if(el.tagName!=='CANVAS')el.style.visibility='hidden';});const file=`${out}/${g}${VIEW==='front'?'f':''}_${String(age).replace('.','')}.png`;await page.screenshot({path:file});files.push(file);
  console.log(g,age,'feet',JSON.stringify(info.ik?.feet),'hands',JSON.stringify(info.ik?.hands));}
 try{execFileSync('python3',['-c',`import sys;from PIL import Image,ImageDraw
fs=sys.argv[2:];im=[Image.open(f).crop((180,60,780,660)).resize((300,300)) for f in fs];s=Image.new('RGB',(300*4,300*((len(im)+3)//4)))
for i,x in enumerate(im):ImageDraw.Draw(x).text((6,6),fs[i].split('_')[-1][:-4],fill='white');s.paste(x,((i%4)*300,(i//4)*300))
s.save(sys.argv[1])`,`${out}/${g}${VIEW==='front'?'f':''}.png`,...files]);}catch(e){console.log('contact sheet skipped',e.message);}
 await page.close();}
await browser.close();
