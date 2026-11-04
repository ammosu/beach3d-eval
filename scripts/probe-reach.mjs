// 互動距離與搖桿跑步：道具四個方向都有提示且能互動、東西遠一點也能撿／踢、被擋住就不提示；手機搖桿推到底會跑
// node scripts/probe-reach.mjs [groups]   → shots/reach/
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
const groups=(process.argv[2]||'A,B,C').split(','),PORT=process.env.PORT||5191,out='shots/reach';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let bad=0;const check=(ok,msg)=>{if(!ok)bad++;console.log(ok?'  ok ':'  NG ',msg);};
const label=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>{const b=document.querySelector('#interact');r(b.disabled?null:b.firstChild.textContent.trim());}))));
const open=async(g,opt={})=>{const p=await browser.newPage({viewport:{width:1280,height:720},...opt});p.on('pageerror',e=>{bad++;console.log('  PAGEERROR',e.message);});await p.goto(`http://localhost:${PORT}/game.html?auto=1&group=${g}&time=4`);await p.waitForFunction(()=>window.__READY__&&window.__GAME__,null,{timeout:240000});await p.evaluate(()=>document.querySelector('#begin').click());await p.waitForTimeout(200);return p;};
for(const g of groups){console.log(`--- ${g}`);const p=await open(g);
 // 道具：box 外 2.5 m，四個方向
 const WANT={umbrella:'坐下',lifeguard:'爬上救生塔',boat:'推船下水'};
 for(const id of Object.keys(WANT)){for(const [n,sx,sz] of [['海側',0,1],['陸側',0,-1],['左',-1,0],['右',1,0]]){
  const r=await p.evaluate(([id,sx,sz])=>{const G=window.__GAME__,c=window.__EXPLORE__.colliders.find(c=>c.id===id);if(!c)return{skip:1};const b=c.box,x=sx?(sx>0?b.max.x+2.5:b.min.x-2.5):(b.min.x+b.max.x)/2,z=sz?(sz>0?b.max.z+2.5:b.min.z-2.5):(b.min.z+b.max.z)/2;G.teleport(x,z);G.step(.1);return{x:+x.toFixed(1),z:+z.toFixed(1),walk:window.__EXPLORE__.canWalk(x,z)};},[id,sx,sz]);
  if(r.skip){check(false,`${id} 找不到 collider`);continue;}
  const l=await label(p);
  if(!r.walk){console.log(`  --  ${id} ${n} (${r.x},${r.z}) 走不到，略過`);continue;}
  if(l?.startsWith(WANT[id])){check(true,`${id} ${n} 2.5 m 提示「${l}」`);continue;}
  check(!!l,`${id} ${n} 2.5 m 有更近的目標「${l}」`);
  await p.evaluate(([id,sx,sz])=>{const G=window.__GAME__,b=window.__EXPLORE__.colliders.find(c=>c.id===id).box;G.teleport(sx?(sx>0?b.max.x+.6:b.min.x-.6):(b.min.x+b.max.x)/2,sz?(sz>0?b.max.z+.6:b.min.z-.6):(b.min.z+b.max.z)/2);G.step(.1);},[id,sx,sz]);const l2=await label(p);check(l2?.startsWith(WANT[id]),`${id} ${n} 走近到 0.6 m 提示「${l2}」`);}
 }
 // 從陸側進出：真的進得去、出來回原地
 for(const [id,mode] of [['umbrella','rest'],['lifeguard','tower'],['boat','boat']]){
  const r=await p.evaluate(([id])=>{const G=window.__GAME__,b=window.__EXPLORE__.colliders.find(c=>c.id===id).box;G.teleport((b.min.x+b.max.x)/2,b.min.z-2);G.step(.2);G.interact();G.step(.5);return G.mode??G.state?.mode;},[id]);
  check(r===mode,`${id} 從陸側互動 → mode=${r}`);
  await p.evaluate(()=>{const G=window.__GAME__;if(G.leave)G.leave();});await p.reload();await p.waitForFunction(()=>window.__READY__&&window.__GAME__,null,{timeout:240000});await p.evaluate(()=>document.querySelector('#begin').click());
 }
 // 貝殼 3 m：提示、撿到
 const s=await p.evaluate(()=>{const G=window.__GAME__,E=window.__EXPLORE__;for(const it of G.targets().shells)for(const a of [0,1,2,3,4,5]){const x=it.x+3*Math.cos(a),z=it.z+3*Math.sin(a);if(!E.canWalk(x,z))continue;let ok=true;for(let r=.25;r<2.3;r+=.25)if(!E.canWalk(x-Math.cos(a)*r,z-Math.sin(a)*r))ok=false;if(!ok)continue;G.teleport(x,z);G.step(.1);return{x,z};}return null;});
 check((await label(p))==='撿起貝殼',`貝殼 3 m 提示「${await label(p)}」`);
 const got=await p.evaluate(()=>{const G=window.__GAME__,b=G.state.shells;G.interact();for(let i=0;i<40;i++)G.step(.1);return G.state.shells-b;});check(got===1,`貝殼 3 m 按一下自己走過去撿到 (+${got})`);
 // 球 3.2 m
 const k=await p.evaluate(()=>{const G=window.__GAME__;const S=G.targets().shells.filter(i=>!i.collected),E=window.__EXPLORE__,o=[];let spot=null;for(let x=-30;x<40&&!spot;x+=1.5)for(let z=-20;z<20&&!spot;z+=1.5){if(!E.canWalk(x,z)||!E.canWalk(x+3.2,z))continue;if(S.every(i=>Math.hypot(i.x-x-3.2,i.z-z)>4)&&E.canWalk(x+1.6,z))spot=[x,z];}G.placeBall(spot[0],spot[1]);G.teleport(spot[0]+3.2,spot[1]);G.step(.1);const b=G.targets().ball;G.view(0);G.step(.2);return b;});
 check((await label(p))?.startsWith('踢球'),`球 3.2 m 提示「${await label(p)}」`);
 const moved=await p.evaluate(b=>{const G=window.__GAME__;G.interact();for(let i=0;i<60;i++)G.step(.1);const c=G.targets().ball;return Math.hypot(c[0]-b[0],c[2]-b[2]);},k);check(moved>3,`球 3.2 m 走過去踢出 ${moved.toFixed(1)} m`);
 // 擋在道具後面的貝殼：放一個在塔的另一邊，直線穿過道具就不提示
 const blocked=await p.evaluate(()=>{const G=window.__GAME__,E=window.__EXPLORE__,o=[];for(const it of G.targets().shells)for(let a=0;a<6.28;a+=.2){const d=2.9,x=it.x+d*Math.cos(a),z=it.z+d*Math.sin(a);if(!E.canWalk(x,z))continue;let hit=false;for(let r=.25;r<d-.72;r+=.25)if(!E.canWalk(x-Math.cos(a)*r,z-Math.sin(a)*r))hit=true;if(hit)o.push([x,z]);}return o[0]??null;});
 if(blocked){await p.evaluate(([x,z])=>{const G=window.__GAME__;G.teleport(x,z);G.step(.1);},blocked);const l=await label(p);check(l!=='撿起貝殼',`路被擋住的貝殼不提示（得到「${l}」）`);}else console.log('  --  沒有路被擋住的貝殼');
 // 球隔著船：直線會穿過船，不該提示踢球；繞到同一側就有
 const across=await p.evaluate(()=>{const G=window.__GAME__,E=window.__EXPLORE__,b=E.colliders.find(c=>c.id==='boat').box,x=(b.min.x+b.max.x)/2;G.placeBall(x,b.min.z-.6);G.teleport(x,b.max.z+.6);G.step(.1);return{d:+(b.max.z-b.min.z+1.2).toFixed(2)};});
 const la=await label(p);if(across.d>2.3&&across.d<3.5)check(!la?.startsWith('踢球'),`球隔著船 ${across.d} m 不提示踢球（得到「${la}」）`);else console.log(`  --  船寬 ${across.d} m，不在測試範圍`);
 await p.close();
 // 手機：真的拖搖桿
 const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const m=await c.newPage();m.on('pageerror',e=>{bad++;console.log('  PAGEERROR',e.message);});
 await m.goto(`http://localhost:${PORT}/game.html?auto=1&lite=1&group=${g}&time=4`);await m.waitForFunction(()=>window.__READY__&&window.__GAME__,null,{timeout:240000});await m.evaluate(()=>document.querySelector('#begin').click());await m.waitForTimeout(200);
 const cdp=await c.newCDPSession(m),st=await m.locator('#stick').boundingBox(),cx=st.x+st.width/2,cy=st.y+st.height/2;
 await m.evaluate(()=>{const G=window.__GAME__;G.teleport(-7,12);G.view(0);G.step(.2);});
 const speedAt=async dy=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy+dy}]});await m.waitForFunction(px=>{const y=/,\s*(-?[\d.]+)px\)/.exec(document.querySelector('#stick i').style.transform)?.[1];return y!=null&&Math.abs(+y-px)<.5;},Math.max(-1,dy/45)*30,{timeout:30000});return m.evaluate(()=>{const G=window.__GAME__;G.step(1.2);return{v:+window.__EXPLORE__.speed.toFixed(2),run:document.querySelector('#stick').classList.contains('run')};});};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});
 const half=await speedAt(-22);check(half.v>.5&&half.v<1.9&&!half.run,`搖桿半推 走 ${half.v} m/s`);
 const full=await speedAt(-44);check(full.v>4&&full.run,`搖桿推到底 跑 ${full.v} m/s（run=${full.run}）`);
 if(g===groups[0])await m.screenshot({path:`${out}/stick-run.png`});
 const back=await speedAt(-20);check(back.v<1.9&&!back.run,`收回半推 回到走 ${back.v} m/s`);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 // 手機看到的提示
 await m.evaluate(()=>{const G=window.__GAME__,b=window.__EXPLORE__.colliders.find(c=>c.id==='lifeguard').box;G.teleport((b.min.x+b.max.x)/2,b.min.z-2.5);G.step(.2);});const ml=await label(m);if(g===groups[0])await m.screenshot({path:`${out}/phone-prompt.png`});
 check(ml==='爬上救生塔',`手機 塔後方 2.5 m 按鈕「${ml}」`);
 await c.close();}
await browser.close();console.log(bad?`失敗 ${bad} 項`:'全部通過');process.exit(bad?1:0);
