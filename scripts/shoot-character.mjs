// 角色固定機位：node scripts/shoot-character.mjs <A|B|C> [outdir] → 全身四面、臉、手、腳與接縫近照＋總表 sheet.png（SwiftShader）
import {chromium} from 'playwright-core';import {mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
const group=process.argv[2]||'A',out=process.argv[3]||`shots/character/${group}`,base=process.env.SCENE_URL||'http://localhost:5191';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const VIEWS={front:[[0,1.0,3.9],[0,.9,0]],q34:[[2.3,1.25,3.1],[0,.9,0]],side:[[3.9,1.0,0],[0,.9,0]],back:[[0,1.0,-3.9],[0,.9,0]],face:[[.28,1.62,.72],[0,1.57,0]],profile:[[.78,1.6,.05],[0,1.57,0]],torso:[[.75,1.35,1.25],[0,1.15,0]],hand:[[.72,.86,.62],[.31,.76,0]],feet:[[.5,.42,.85],[0,.1,.05]]};
const names=[];
try{const page=await browser.newPage({viewport:{width:640,height:640}});page.on('pageerror',e=>console.error('pageerror',e.message));
 await page.goto(`${base}/props.html?capture=1&solo=character&group=${group}`);await page.waitForFunction(()=>window.__READY__,{timeout:120000});
 for(const [pose,views] of [['idle',Object.keys(VIEWS)],['walk',['q34','side']],['run',['q34','side']]]){
  const ok=await page.evaluate(p=>{if(!window.__CHARACTER__.animations.includes(p))return false;window.__CHARACTER__.pose(p,.65);return true;},pose);if(!ok)continue;
  for(const v of views){await page.evaluate(([a,b])=>window.__CHARACTER__.view(a,b),VIEWS[v]);await page.waitForTimeout(150);await page.evaluate(([a,b])=>window.__CHARACTER__.view(a,b),VIEWS[v]);const n=`${out}/${pose}_${v}.png`;await page.screenshot({path:n});names.push(n);}
 }
 console.log(JSON.stringify(await page.evaluate(()=>{const i=window.__CHARACTER__.info();return {source:i.source,triangles:i.triangles,bones:i.bones};})));
}finally{await browser.close();}
execFileSync('python3',['-c',`import sys;from PIL import Image
f=sys.argv[2:];c=5;r=(len(f)+c-1)//c;s=Image.new('RGB',(c*400,r*400))
for i,n in enumerate(f):s.paste(Image.open(n).convert('RGB').resize((400,400)),(i%c*400,i//c*400))
s.save(sys.argv[1])`,`${out}/sheet.png`,...names]);console.log(`${out}/sheet.png`);
