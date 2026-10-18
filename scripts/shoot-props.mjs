import {chromium} from 'playwright-core';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
const group=process.argv[2]||'A';
const config=JSON.parse(await readFile('assets/props.json','utf8'));
await mkdir(`shots/${group}/props`,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:800,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});let counts;
for(const slot of config.slots.filter(s=>!process.argv[3]||s.id===process.argv[3])){await page.goto(`http://localhost:5191/props.html?group=${group}&solo=${slot.id}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__READY__);await page.screenshot({path:`shots/${group}/props/${slot.id}.png`});counts=await page.evaluate(()=>window.__PROP__.results);console.log(slot.id);}
await writeFile(`shots/${group}/props/triangles.json`,JSON.stringify(counts,null,2));if(errors.length)throw Error(errors.join('\n'));}finally{await browser.close();}
