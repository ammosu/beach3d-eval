// Kick impact (hit-stop + camera shake), with and without (?impact=0): frame by frame around the hit. Prints how long the
// body and ball stay held, how far the camera turns and whether it comes back, and the ball's final travel.
// node scripts/probe-impact.mjs [groups]   (POWER=<s held>, else a full-power hook kick)
import {chromium} from 'playwright-core';import {homedir} from 'node:os';
const groups=(process.argv[2]||'ABC').split(''),POWER=process.env.POWER?+process.env.POWER:null;
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
async function run(g,on){const page=await browser.newPage({viewport:{width:960,height:720}});const errors=[];page.on('pageerror',x=>errors.push(x.message));
 await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4&group=${g}${on?'':'&impact=0'}`);await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');
 const r=await page.evaluate(power=>{const g=window.__GAME__,{camera}=window.__SCENE__,p=g.targets().ball;g.placeBall(p[0],p[2]);g.teleport(p[0],p[2]+1.3);g.view(0);g.step(.3);if(power===null)g.interact();else{g.press();for(let t=0;t<power-1e-6;t+=1/60)g.step(1/60);g.release();}
  for(let i=0;i<300&&!(g.kick&&g.kick.hit);i++)g.step(1/60);const ball0=g.targets().ball,age0=g.kick.age,power0=g.kick.power,at=g.feel.kickedAt;const log=[];
  for(let i=0;i<40;i++){g.step(1/60);const b=g.targets().ball,f=new (camera.position.constructor)();camera.getWorldDirection(f);log.push({t:+(window.__TIME__-at).toFixed(3),rate:+g.feel.rate.toFixed(2),age:g.kick?+g.kick.age.toFixed(3):null,moved:+Math.hypot(b[0]-ball0[0],b[1]-ball0[1],b[2]-ball0[2]).toFixed(3),q:camera.quaternion.toArray()});}
  for(let i=0;i<360;i++)g.step(1/60);const end=g.targets().ball;return {power:power0,age0,log,travel:+Math.hypot(end[0]-ball0[0],end[2]-ball0[2]).toFixed(2),kick:g.kick};},POWER);
 await page.close();return {...r,errors};}
const angle=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3])))*180/Math.PI;
for(const g of groups){const a=await run(g,true),b=await run(g,false);
 const held=a.log.filter(l=>l.moved<.01).length,heldOff=b.log.filter(l=>l.moved<.01).length,dev=a.log.map((l,i)=>angle(l.q,b.log[i].q));
 console.log(g,`power ${a.power}`,`ball held ${held} frames (off ${heldOff})`,`peak camera turn ${Math.max(...dev.slice(0,24)).toFixed(2)} deg`,`travel on ${a.travel} off ${b.travel} m`,`errors ${a.errors.length+b.errors.length}`,`kick left ${a.kick===null}`);
 console.log(' t/rate/age/moved',a.log.filter((_,i)=>i<12).map(l=>`${l.t}/${l.rate}/${l.age}/${l.moved}`).join(' '));
 console.log(' off t/age/moved  ',b.log.filter((_,i)=>i<6).map(l=>`${l.t}/${l.age}/${l.moved}`).join(' '));}
await browser.close();
