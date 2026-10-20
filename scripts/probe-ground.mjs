// Prop grounding audit: for each prop, the vertices in its lowest 6 cm (its feet or base) and how far each sits above
// the sand under it. node scripts/probe-ground.mjs [groups=ABC]
// Per prop: n bottom vertices, min / median / max gap in cm (positive = floating, negative = buried).
import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
const [groups='ABC']=process.argv.slice(2);
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-gl=angle','--use-angle=gl-egl']});
for(const g of groups){
 const page=await browser.newPage();await page.goto(`http://localhost:5191/scene.html?group=${g}&time=4`);await page.waitForFunction(()=>window.__READY__);
 const r=await page.evaluate(async()=>{const {groundHeight}=await import('/src/terrain.js');const out={};const V=window.__SCENE__.propRoot.children[0].position.constructor;
  for(const prop of window.__SCENE__.propRoot.children){prop.updateMatrixWorld(true);const pts=[];const v=new V();
   prop.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i+=1){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);pts.push([v.x,v.y,v.z]);}});
   if(!pts.length)continue;const minY=Math.min(...pts.map(p=>p[1]));const low=pts.filter(p=>p[1]<minY+.06).map(p=>p[1]-groundHeight(p[0],p[2])).sort((a,b)=>a-b);
   const cm=x=>Math.round(x*100);out[prop.name]={n:low.length,min:cm(low[0]),med:cm(low[low.length>>1]),max:cm(low.at(-1))};}
  return out;});
 console.log(g,Object.entries(r).map(([k,v])=>`${k} ${v.min}/${v.med}/${v.max}`).join(' | '));
 await page.close();
}
await browser.close();
