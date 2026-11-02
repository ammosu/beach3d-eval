// Legs through a kick and a coconut throw, close up: camera fixed in the world, low, from the plant-foot side (kick) or
// beside the thrower, so the supporting leg is in front. Sheets → shots/legs/<g>_<kick|kickf|throw|throwf>.png; logs each
// foot's height over the sand and how far it moved, hip height and knee bend.
// node scripts/probe-legs.mjs [groups] [outdir]
import {chromium} from 'playwright-core';import {homedir} from 'node:os';import {mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
const groups=(process.argv[2]||'B').split(''),out=process.argv[3]||'shots/legs';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
const sheet=(name,files)=>execFileSync('python3',['-c',`import sys;from PIL import Image,ImageDraw
fs=sys.argv[2:];im=[Image.open(f).crop((200,90,760,650)).resize((300,300)) for f in fs];s=Image.new('RGB',(300*5,300*((len(im)+4)//5)))
for i,x in enumerate(im):ImageDraw.Draw(x).text((6,6),fs[i].split('_')[-1][:-4],fill='white');s.paste(x,((i%5)*300,(i//5)*300))
s.save(sys.argv[1])`,name,...files]);
const measure=()=>{const g=window.__GAME__,c=window.__EXPLORE__.player,f=[0,1].map(i=>g.footWorld(i));return {p:[c.x,c.z].map(v=>+v.toFixed(2)),f:f.map(v=>[+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(2)]),ik:g.character.ik?.feet?.map(v=>v==null?null:+v.toFixed(3))};};
async function open(g){const page=await browser.newPage({viewport:{width:960,height:720}});await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4&group=${g}`);await page.waitForFunction(()=>window.__READY__,null,{timeout:90000});await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');await page.evaluate(()=>{for(const el of document.body.children)if(el.tagName!=='CANVAS')el.style.visibility='hidden';});return page;}
async function shoot(page,file,view){await page.evaluate(view=>new Promise(r=>{const {camera}=window.__SCENE__,put=()=>{camera.position.set(...view.pos);camera.lookAt(...view.at);};put();requestAnimationFrame(()=>{put();requestAnimationFrame(()=>{put();r();});});}),view);await page.screenshot({path:file});}
for(const g of groups){
 for(const front of [false,true]){
  // Kick
  let page=await open(g);const AGES=[0,.1,.2,.28,.36,.42,.5,.6,.7,.8,.9,1,1.1,1.3];
  const dirs=await page.evaluate(()=>{const g=window.__GAME__,p=g.targets().ball;g.placeBall(p[0],p[2]);g.teleport(p[0],p[2]+1.3);g.view(0);g.step(.3);g.interact();for(let i=0;i<300&&!(g.kick&&g.kick.age>=0);i++)g.step(1/60);const k=g.kick,P=window.__EXPLORE__.player,hit=g.footWorld(k.foot),other=g.footWorld(1-k.foot);const f=k.dir,r=[f[1],-f[0]];const s=(other.x-hit.x)*r[0]+(other.z-hit.z)*r[1]>0?1:-1;return {foot:k.foot,f,side:[r[0]*s,r[1]*s],P:[P.x,P.y,P.z]};});
  const c=dirs.P,view=front?{pos:[c[0]-dirs.f[0]*3.2+dirs.side[0]*1,c[1]+1,c[2]-dirs.f[1]*3.2+dirs.side[1]*1],at:[c[0]+dirs.f[0]*.5,c[1]+.75,c[2]+dirs.f[1]*.5]}:{pos:[c[0]+dirs.f[0]*.5+dirs.side[0]*4.2,c[1]+1,c[2]+dirs.f[1]*.5+dirs.side[1]*4.2],at:[c[0]+dirs.f[0]*.5,c[1]+.8,c[2]+dirs.f[1]*.5]};
  let files=[],last=0,x;for(const age of AGES){x=await page.evaluate(([age,last])=>{const g=window.__GAME__;g.step(Math.max(0,age-last));for(let i=0;i<30&&g.kick&&g.kick.age<age-.002;i++)g.step(1/60);return null;},[age,last]);last=age;const file=`${out}/${g}k${front?'f':''}_${String(age).replace('.','')}.png`;await shoot(page,file,view);files.push(file);
   if(!front)console.log(g,'kick',age,'kicking',dirs.foot,JSON.stringify(await page.evaluate(measure)));}
  sheet(`${out}/${g}_kick${front?'f':''}.png`,files);await page.close();
  // Throw
  page=await open(g);const t=await page.evaluate(()=>{const G=window.__GAME__,c=G.coconuts.items[0].pos;G.teleport(c[0]+1.2,c[2]+.4);G.step(.2);G.interact();G.step(1.8);G.teleport(-8,4);G.view(0);G.step(.6);const P=window.__EXPLORE__.player;return {P:[P.x,P.y,P.z],carry:G.coconuts.carry};});
  const v2=front?{pos:[t.P[0]+.6,t.P[1]+1,t.P[2]-4.2],at:[t.P[0],t.P[1]+.85,t.P[2]-.1]}:{pos:[t.P[0]+4.2,t.P[1]+1,t.P[2]-.2],at:[t.P[0],t.P[1]+.85,t.P[2]-.1]};
  files=[];const STEPS=[['hold0',0],['hold.3',.3],['hold.8',.5],['rel0',-1],['rel.07',.07],['rel.14',.07],['rel.2',.06],['rel.3',.1],['rel.4',.1],['rel.5',.1],['rel.7',.2]];
  await page.evaluate(()=>window.__GAME__.press());for(const [name,dt] of STEPS){await page.evaluate(dt=>{const G=window.__GAME__;if(dt<0){G.release();for(let i=0;i<120&&!(G.coconuts.toss&&G.coconuts.toss.age>=0);i++)G.step(1/60);}else G.step(dt);},dt);const file=`${out}/${g}t${front?'f':''}_${name.replace('.','')}.png`;await shoot(page,file,v2);files.push(file);
   if(!front)console.log(g,'throw',name,JSON.stringify(await page.evaluate(measure)));}
  sheet(`${out}/${g}_throw${front?'f':''}.png`,files);await page.close();
 }}
await browser.close();
