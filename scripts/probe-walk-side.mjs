// Side view in the real game, after terrain IK. Eight equal phases per gait.
// node scripts/probe-walk-side.mjs [groups=A] [outdir=shots/walk-side]
// Stance drift is the horizontal path/extent of the ankle, not a velocity-selected subset.
import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const groups=(process.argv[2]||'A').split(''),out=process.argv[3]||'shots/walk-side';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],summaries=[];
try{for(const group of groups)for(const gait of ['walk','run']){
 const page=await browser.newPage({viewport:{width:640,height:640}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4&group=${group}`);await page.waitForFunction(()=>window.__READY__,null,{timeout:120000});await page.click('#begin');
 await page.evaluate(()=>{window.__TIME__=4;const G=window.__GAME__;G.teleport(-30,10);G.view(-Math.PI/2);G.step(.7);});
 const base=await page.evaluate(()=>{const a=window.__EXPLORE__.avatar;return a.worldToLocal(window.__GAME__.footWorld(0)).z;});
 await page.keyboard.down('KeyW');if(gait==='run')await page.keyboard.down('ShiftLeft');await page.evaluate(()=>window.__GAME__.step(2));
 // Measure the period from the foot moving backward across its standing fore/aft line.
 const measure=await page.evaluate(({base})=>{
  const G=window.__GAME__,a=window.__EXPLORE__.avatar,dt=1/240,cross=[];let previous=a.worldToLocal(G.footWorld(0)).z-base,t=0;
  while(cross.length<3&&t<4){G.step(dt);t+=dt;const z=a.worldToLocal(G.footWorld(0)).z-base;if(previous>0&&z<=0)cross.push(t-dt+dt*previous/(previous-z));previous=z;}
  if(cross.length<3)throw Error('No complete gait cycle detected');return {period:(cross[2]-cross[0])/2,elapsed:t,zero:cross[2],speed:G.legs().speed};
 },{base});
 const footprintsBefore=await page.evaluate(()=>window.__GAME__.state.footprints);
 const period=measure.period,initialPhase=(measure.elapsed-measure.zero)/period;
 const rows=await page.evaluate(({period,initialPhase})=>{
  const G=window.__GAME__,a=window.__EXPLORE__.avatar,dt=1/240,rows=[],names=G.character.group==='A'?['thighL','calfL','footL','thighR','calfR','footR']:null;
  const bones=names?.map(n=>a.getObjectByName(n)),sample=(t)=>{
   const feet=[G.footWorld(0),G.footWorld(1)],P=window.__EXPLORE__.player;
   const knees=bones?[0,1].map(i=>{const p=bones[i*3].getWorldPosition(P.clone()),k=bones[i*3+1].getWorldPosition(P.clone()),f=bones[i*3+2].getWorldPosition(P.clone());return Math.acos(Math.max(-1,Math.min(1,k.clone().sub(p).normalize().dot(f.sub(k).normalize()))))*180/Math.PI;}):null;
   return {t,phase:initialPhase+t/period,p:P.toArray(),feet:feet.map(v=>v.toArray()),local:feet.map(v=>a.worldToLocal(v.clone()).toArray()),knees,legs:G.legs(),ik:G.character.ik.feet};};
  for(let k=0;k<=Math.ceil(period*3/dt);k++){if(k)G.step(dt);rows.push(sample(k*dt));}return rows;
 },{period,initialPhase});
 // Every complete intended support window, including heel contact and toe-off.
 // A's duty fractions are the authored support intervals. B/C use a documented 50% diagnostic window.
 const duty=group==='A'?(gait==='walk'?.56:.34):.5,stances=[];
 for(let foot=0;foot<2;foot++)for(let cycle=0;cycle<5;cycle++){
  const center=cycle+foot*.5,start=center-duty/2,end=center+duty/2;
  if(start<rows[0].phase||end>rows.at(-1).phase)continue;
  const segment=rows.filter(r=>r.phase>=start&&r.phase<=end);if(segment.length<3)continue;
  let path=0,extent=0;for(let i=1;i<segment.length;i++){const p=segment[i].feet[foot],q=segment[i-1].feet[foot];path+=Math.hypot(p[0]-q[0],p[2]-q[2]);for(let j=0;j<i;j++){const q=segment[j].feet[foot];extent=Math.max(extent,Math.hypot(p[0]-q[0],p[2]-q[2]));}}
  stances.push({foot,start,end,samples:segment.length,pathCm:path*100,extentCm:extent*100});
 }
 const footprintsAfter=await page.evaluate(()=>window.__GAME__.state.footprints);
 const summary={group,gait,footprints:footprintsAfter-footprintsBefore,speed:measure.speed,period,duty,stances,maxSlideCm:Math.max(...stances.map(s=>s.extentCm)),maxPathCm:Math.max(...stances.map(s=>s.pathCm)),maxKneeDeg:rows[0].knees?[0,1].map(i=>Math.max(...rows.map(r=>r.knees[i]))):null,maxIK:Math.max(...rows.flatMap(r=>r.ik).filter(v=>v!=null))};
 if(!stances.length||!Number.isFinite(summary.maxSlideCm)||Math.abs(measure.speed-(gait==='walk'?1.8:4.5))>.05)throw Error('Probe did not obtain steady dry-sand locomotion');
 summaries.push(summary);console.log(JSON.stringify(summary));
 await writeFile(`${out}/${group}_${gait}.json`,JSON.stringify({summary,rows},null,2));
 // Move to the next measured phase zero; render a clone camera so frame callbacks cannot move it.
 const phaseNow=rows.at(-1).phase,until=(Math.ceil(phaseNow)-phaseNow)*period;await page.evaluate(t=>window.__GAME__.step(t),until);
 const files=[];for(let k=0;k<8;k++){
  if(k)await page.evaluate(t=>window.__GAME__.step(t),period/8);
  const file=`${out}/${group}_${gait}_${k}.png`,url=await page.evaluate(()=>{const {scene,renderer,camera}=window.__SCENE__,a=window.__EXPLORE__.avatar,cam=camera.clone();cam.position.copy(a.localToWorld(cam.position.clone().set(3.3,1.0,0)));cam.up.set(0,1,0);cam.lookAt(a.localToWorld(cam.position.clone().set(0,.87,0)));cam.fov=39;cam.updateProjectionMatrix();renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');});await writeFile(file,Buffer.from(url.split(',')[1],'base64'));files.push(file);
 }
 execFileSync('python3',['-c',`import sys;from PIL import Image,ImageDraw
fs=sys.argv[2:];im=Image.new('RGB',(4*360,2*390),(235,232,224));d=ImageDraw.Draw(im)
for i,f in enumerate(fs):
 im.paste(Image.open(f).convert('RGB').resize((360,360)),((i%4)*360,(i//4)*390));d.text(((i%4)*360+12,(i//4)*390+365),f'{i}/8 cycle',fill=(35,40,40))
im.save(sys.argv[1])`,`${out}/${group}_${gait}_sheet.png`,...files]);
 await page.close();
}}finally{await browser.close();}
await writeFile(`${out}/summary.json`,JSON.stringify({summaries,errors},null,2));console.log('errors',JSON.stringify(errors));if(errors.length)process.exitCode=1;
