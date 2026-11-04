// 爬塔到頂的手：梯子數據、手離最近實體的距離，加上側面連拍 → shots/climb/<g>_<t>.png、<g>_sheet.png
// node scripts/probe-climb.mjs [groups] [outdir]   （NOTE=檔名前綴，比較修改前後用）
import { chromium } from 'playwright-core';
import { mkdir,writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
const groups=(process.argv[2]||'A,B,C').split(','),out=process.argv[3]||'shots/climb',PORT=process.env.PORT||5191;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const g of groups){
 const page=await browser.newPage({viewport:{width:640,height:640}});page.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await page.goto(`http://localhost:${PORT}/game.html?auto=1&time=4&group=${g}`);await page.waitForFunction(()=>window.__READY__&&window.__GAME__,null,{timeout:240000});await page.evaluate(()=>window.__TIME__=4);await page.click('#begin');
 const L=await page.evaluate(()=>{const l=window.__GAME__.ladder();return {kind:l.kind??'ladder',own:!!l.own,rungs:l.rungs?.map(v=>+v.toFixed(2)),spacing:l.spacing&&+l.spacing.toFixed(2),over:l.over&&+l.over.toFixed(2),height:l.height&&+l.height.toFixed(2),railDepth:l.railDepth&&+l.railDepth.toFixed(2),roof:l.roof&&+l.roof.toFixed(2),rails:l.handrails?.map(s=>s.length&&[+s[0].y.toFixed(2),+s[s.length-1].y.toFixed(2),s.length]),bottomY:+l.bottom.y.toFixed(2),standY:+l.stand?.y.toFixed(2)};});
 console.log(`--- ${g}`,JSON.stringify(L));
 await page.evaluate(noRails=>{const G=window.__GAME__,p=G.targets().lifeguard;if(noRails)G.ladder().handrails=null;G.teleport(p[0],p[2]);G.step(.3);G.interact();},!!process.env.NO_RAILS);
 const dt=+(process.env.DT||.25),n=+(process.env.N||24),files=[];
 for(let k=0;k<n;k++){const r=await page.evaluate(([dt,close])=>{const G=window.__GAME__,{scene,renderer,camera}=window.__SCENE__,l=G.ladder();G.step(dt);
   const P=window.__EXPLORE__.player,hw=[0,1].map(i=>G.handWorld(i)),nearest=h=>{let best=9;for(const d of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const c=G.physics?.ray?.([h.x,h.y,h.z],d,1);const v=typeof c==='number'?c:c?.toi??c?.distance;if(v!=null&&v<best)best=v;}return +best.toFixed(2);};
   const cam=camera.clone();cam.up.set(0,1,0);const look=(l.top??l.bottom).clone();look.y=P.y+.9;cam.position.copy(look).addScaledVector(l.normal,2.2).addScaledVector(l.right,1.9);cam.position.y+=.6;cam.lookAt(look);cam.fov=45;if(close){cam.position.copy(hw[1]).addScaledVector(l.normal,.55).addScaledVector(l.right,.45);cam.position.y+=.25;cam.lookAt(hw[1]);cam.fov=40;}cam.near=.05;cam.updateProjectionMatrix();renderer.render(scene,cam);
   const c=G.character;return {url:renderer.domElement.toDataURL('image/png'),y:+P.y.toFixed(2),anim:c.animation,hands:hw.map(h=>[+h.x.toFixed(2),+h.y.toFixed(2),+h.z.toFixed(2)]),gap:hw.map(nearest),err:c.ik?.hands};},[dt,!!process.env.CLOSE]);
  const t=((k+1)*dt).toFixed(2),f=`${out}/${process.env.NOTE||''}${g}_${t}.png`;await writeFile(f,Buffer.from(r.url.split(',')[1],'base64'));files.push(f);
  console.log(t.padStart(5),'y',r.y,'手y',r.hands.map(h=>h[1]).join('/'),'距實體',r.gap.join('/'),'ik',JSON.stringify(r.err));}
 await page.close();
 const start=+(process.env.SHEET_FROM||0),py=`from PIL import Image,ImageDraw;import sys
fs=sys.argv[2:];T=240;C=6;R=(len(fs)+C-1)//C;S=Image.new('RGB',(C*T,R*T))
for i,f in enumerate(fs):
  m=Image.open(f).convert('RGB').resize((T,T));ImageDraw.Draw(m).text((6,6),f.split('_')[-1][:-4],fill=(255,255,0));S.paste(m,(i%C*T,i//C*T))
S.save(sys.argv[1])`;
 execFileSync('python3',['-c',py,`${out}/${process.env.NOTE||''}${g}_sheet.png`,...files.slice(start)]);
}
await browser.close();
