import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.env.GAME_SHOTS||'shots/game/round3/iteration1';await mkdir(output,{recursive:true});await mkdir('shots/characters',{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1000,height:700}});page.on('pageerror',e=>console.error(e));
try{
 if(process.env.CHARACTERS_ONLY!=='1'){
 await page.goto('http://localhost:5191/game.html?auto=1&time=4');await page.waitForFunction(()=>window.__READY__,{timeout:120000});await page.click('#begin');
 const data={};
 for(const group of ['B','A','C']){
  await page.evaluate(async group=>{await window.__EXPLORE__.switchGroup(group);window.__GAME__.step(.1);},group);
  data[group]=await page.evaluate(()=>({character:window.__GAME__.character,surfaces:window.__GAME__.surfaces()}));console.log(group,JSON.stringify(data[group]));
  for(const [id,name] of [['umbrella','lounger'],['lifeguard','tower'],...(group==='B'?[['boat','boat']]:[])]){
   await page.evaluate(id=>{const g=window.__GAME__,p=g.targets()[id];g.teleport(p[0],p[2]);g.step(.25);g.interact();g.step(2);},id);
   await page.screenshot({path:`${output}/${group}_${name}.png`});await page.evaluate(()=>{window.__GAME__.interact();window.__GAME__.step(.2);});
  }
  if(group==='B'){await page.evaluate(()=>{const g=window.__GAME__,p=g.targets().ball;g.teleport(p[0],p[2]+3);g.view(0);g.step(.5);});await page.keyboard.down('KeyW');await page.evaluate(()=>window.__GAME__.step(.6));await page.keyboard.up('KeyW');await page.screenshot({path:`${output}/B_walking-ball.png`});}
 }
 await writeFile(`${output}/inspection.json`,JSON.stringify(data,null,2));
 }
 const characters=[];
 for(const group of ['A','B','C']){await page.goto(`http://localhost:5191/props.html?capture=1&solo=character&group=${group}`);await page.waitForFunction(()=>window.__READY__);for(const animation of ['idle','walk']){const info=await page.evaluate(a=>window.__CHARACTER__.pose(a),animation);assert.equal(info.animation,animation);characters.push(info);console.log('character',group,animation,info.triangles);await page.screenshot({path:`shots/characters/${group}_${animation}.png`});}}
 await page.goto('http://localhost:5191/props.html?capture=1&solo=character&compare=1');await page.waitForFunction(()=>window.__READY__);const comparison=await page.evaluate(()=>{window.__CHARACTER__.pose('walk');return window.__CHARACTER__.comparison();});assert.equal(comparison.length,3);assert(comparison.every(c=>c.animation==='walk'));await page.screenshot({path:'shots/characters/compare.png'});await writeFile('shots/characters/results.json',JSON.stringify({characters,comparison},null,2));
}finally{await browser.close();}
