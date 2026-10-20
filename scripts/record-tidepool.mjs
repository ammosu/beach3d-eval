// 潮池 A/B/C 錄影：node scripts/record-tidepool.mjs <A|B|C> [fps] [outdir]
// ?time=0 凍結時鐘，每格用 __TIDEPOOL__.step(1/fps) 推進；三組照同一份時間表翻石頭、觀察 → <outdir>/f_00000.png
import {chromium} from 'playwright-core';import {homedir} from 'node:os';import fs from 'node:fs';
const [group,fpsArg,outArg]=process.argv.slice(2);const fps=Number(fpsArg||30),out=outArg||`video/frames/tidepool_${group}`;
export const DURATION=24;
// [虛擬秒數, 動作, 參數]；字幕由 tools/make_tidepool.py 依同一份表產生
export const TIMELINE=[
 [2,'observe','starfish'],[3.8,'close'],[4.3,'observe','anemone'],[6.1,'close'],[6.6,'observe','urchin'],[8.4,'close'],
 [9,'lift',3],[9.8,'lift',0],[10.8,'observe','hermit_crab'],[12.6,'close'],
 [13.1,'lift',4],[13.7,'lift',1],[14.7,'observe','octopus'],[16.5,'close'],
 [17,'lift',5],[17.4,'lift',6],[17.8,'lift',7],[18.4,'lift',2],[19.4,'observe','nudibranch'],[21.4,'close'],
];
if(import.meta.url===`file://${process.argv[1]}`){
 fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
 const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];
 // 錄影時停用頁面自己的 rAF 迴圈，只靠 step() 畫面；兩邊同時畫會偶爾截到缺水面的半成品
 await p.addInitScript(()=>{window.requestAnimationFrame=()=>0;});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://localhost:5191/tidepool.html?group=${group}&auto=1&time=0&muted=1`);await p.waitForFunction(()=>window.__READY__,null,{polling:100});await p.waitForTimeout(800);
 const queue=[...TIMELINE];const n=Math.round(DURATION*fps);
 for(let i=0;i<n;i++){
  const t=i/fps;
  while(queue.length&&queue[0][0]<=t+1e-6){const [,act,arg]=queue.shift();
   const ok=await p.evaluate(([act,arg])=>{const tp=window.__TIDEPOOL__;if(act==='close'){document.querySelector('#continue').click();return true;}return tp[act](arg);},[act,arg]);
   if(!ok)throw Error(`${group} ${act} ${arg} failed at ${t}s`);}
  await p.evaluate(dt=>window.__TIDEPOOL__.step(dt),i?1/fps:0);
  // 無頭 GPU 偶爾截到少了水面的畫面（同一時間重畫就正常）：同一格重畫到有兩張完全相同才採用
  const shots=[];let pick=null;
  for(let k=0;k<6&&!pick;k++){if(k)await p.evaluate(()=>window.__TIDEPOOL__.step(0));const buf=await p.screenshot();pick=shots.find(s=>s.equals(buf));shots.push(buf);}
  if(!pick){const m=shots.map(s=>s.length).sort((a,b)=>a-b)[shots.length>>1];pick=shots.reduce((a,s)=>Math.abs(s.length-m)<Math.abs(a.length-m)?s:a);}  // 細微差異：取檔案大小居中的那張
  fs.writeFileSync(`${out}/f_${String(i).padStart(5,'0')}.png`,pick);
 }
 const found=await p.evaluate(()=>window.__TIDEPOOL__.found.length);await b.close();
 if(errs.length)throw Error(errs.join('\n'));console.log(group,n,'frames, found',found);
}
