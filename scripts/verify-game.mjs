import {chromium} from 'playwright-core';
import {homedir} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=process.env.GAME_SHOTS||'shots/game';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
function monitor(page,missing=false){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!((missing||/assets\/tidepool\/.*\.glb/.test(m.location().url))&&/404|Failed to load resource/.test(m.text())))errors.push(m.text());});}
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});monitor(page);
 await page.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4`);await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>window.__TIME__=4);
 const shot=async name=>{let frame;for(let attempt=0;attempt<3;attempt++){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__SCENE__.renderer.getContext().finish();r();}))));frame=await page.screenshot({path:`${output}/${name}.png`});if(frame.length>100000)break;}assert(frame.length>100000,`${name}: unexpectedly empty software-rendered frame`);console.log('shot',name);};
 const step=async seconds=>{await page.evaluate(s=>window.__GAME__.step(s),seconds);const audit=await page.evaluate(()=>window.__GAME__.cameraAudit);assert(audit.minObserved>=audit.minimum-1e-5,JSON.stringify(audit));};
 const at=async(x,z)=>{await page.evaluate(([x,z])=>{const g=window.__GAME__;g.teleport(x,z);g.step(.35);},[x,z]);};
 const e=()=>page.keyboard.press('KeyE');
 assert.equal(await page.evaluate(()=>window.__EXPLORE__.group),'B');await shot('start');await page.click('#begin');
 // On-foot input and passive footprints use the shared controller.
 await page.keyboard.down('KeyW');await step(1.5);await page.keyboard.up('KeyW');assert((await page.evaluate(()=>window.__GAME__.state)).footprints>0);
 // The beach runs on to the headland's forest edge: walkers reach it but do not walk up into the island.
 {await page.evaluate(()=>{const g=window.__GAME__;g.teleport(56,2);g.view(1.5*Math.PI);g.step(.3);});await page.keyboard.down('KeyW');await step(14);await page.keyboard.up('KeyW');
  const p=await page.evaluate(async()=>{const [x,y,z]=window.__GAME__.boardInfo().player,u=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/\/src\/coast\.js/.test(n)),m=await import(u),t=await import('/src/terrain.js');return {x,z,lift:Math.max(-9,m.islandHeight(x,z)-t.groundHeight(x,z))};});
  console.log('headland',JSON.stringify(p));assert(p.x>75,'walk along the beach to the headland');assert(p.lift<=.16,'stay out of the island hill');await shot('headland');}
 const targets=await page.evaluate(()=>window.__GAME__.targets());console.log('targets',JSON.stringify(targets));
 await at(targets.shells[0].x,targets.shells[0].z+1);await shot('shells');
 for(const shell of targets.shells){await at(shell.x,shell.z+.8);await e();await step(1.3);}
 assert.equal((await page.evaluate(()=>window.__GAME__.state)).shells,8);
 await at(targets.ball[0],targets.ball[2]+3);await page.keyboard.down('KeyW');await step(.6);await page.keyboard.up('KeyW');await shot('B_walking-ball');await at(targets.ball[0],targets.ball[2]+1.3);await e();await step(4);assert((await page.evaluate(()=>window.__GAME__.state)).ball,'ball must reach deep water');await at(-4,-12);await shot('ball');
 await at(targets.umbrella[0],targets.umbrella[2]);await e();await step(2);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'rest');assert((await page.evaluate(()=>window.__GAME__.state)).lounger);await shot('lounger');await e();
 await at(targets.lifeguard[0],targets.lifeguard[2]);await e();await step(5.5);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'tower');assert((await page.evaluate(()=>window.__GAME__.state)).tower);await shot('tower');await e();await step(5.5);
 // The rock pool records six small intertidal species, with progress surviving iframe unload.
 await at(targets.tidepool[0],targets.tidepool[2]);await e();assert.equal(await page.evaluate(()=>window.__GAME__.mode),'tidepool');
 await page.waitForFunction(()=>document.querySelector('#lagoon iframe').contentWindow.__READY__,null,{timeout:120000});
 assert.match(await page.locator('#lagoon iframe').getAttribute('src'),/tidepool.html.*group=B/);
 await page.evaluate(()=>{const t=document.querySelector('#lagoon iframe').contentWindow.__TIDEPOOL__;t.stones.forEach((_,i)=>t.lift(i));t.step(1);t.species.forEach(s=>t.observe(s.id));});
 await page.waitForFunction(()=>window.__GAME__.state.tidepool);assert.equal((await page.evaluate(()=>window.__GAME__.state)).observed,6);
 await page.screenshot({path:`${output}/tidepool.png`});console.log('shot tidepool');
 await page.click('#lagoon-back');await step(.5);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'walk');assert(await page.locator('#lagoon').isHidden());assert.equal(await page.locator('#lagoon iframe').getAttribute('src'),'about:blank');
 await e();await page.waitForFunction(()=>document.querySelector('#lagoon iframe').contentWindow.__READY__,null,{timeout:120000});assert.equal(await page.evaluate(()=>document.querySelector('#lagoon iframe').contentWindow.__TIDEPOOL__.found.length),6);await page.click('#lagoon-back');await step(.2);
 // Launch: hold W to push the boat from where it lies down the beach into the water, then climb in.
 await page.evaluate(()=>window.__GAME__.pushBoat=true);await at(targets.boat[0],targets.boat[2]);await e();await step(.5);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'boat');assert(await page.evaluate(()=>window.__GAME__.launch.active));
 // S pulls the boat back (a hull run into a lounger can be backed off), then W pushes it on again.
 {const v=()=>page.evaluate(()=>window.__GAME__.vessel);await page.keyboard.down('KeyW');await step(2);await page.keyboard.up('KeyW');const a=await v();await page.keyboard.down('KeyS');await step(2.5);await page.keyboard.up('KeyS');const b=await v();
  console.log('pull back',JSON.stringify({a,b}));assert(Math.hypot(b.x-a.x,b.z-a.z)>.5&&b.z>a.z,'S must pull the boat back up the beach');}
 {let worst=0;await page.keyboard.down('KeyW');for(let i=0;i<60&&await page.evaluate(()=>window.__GAME__.launch.active);i++){await step(.5);const l=await page.evaluate(()=>({...window.__GAME__.launch,ik:window.__GAME__.character.ik.hands}));if(l.active&&l.board<0)worst=Math.max(worst,...l.ik);if(i===8)await shot('push');}
  await page.keyboard.up('KeyW');const v=await page.evaluate(()=>window.__GAME__.vessel),launch=await page.evaluate(()=>window.__GAME__.launch);console.log('launch',JSON.stringify({v,worst}));
  assert(!launch.active,'boat must be launched within 30 s');assert(worst<.5,`pusher hands off the stern by ${worst}`);assert(v.z<-15,'launched into the water');}
 await page.evaluate(()=>window.__GAME__.pushBoat=false);   // the per-group checks below board directly
 // An attempted early disembark at sea must be rejected. All travel uses W
 // physics, including acceleration, depth restrictions, and wave pose.
 async function paddleTo(goal){for(let i=0;i<100;i++){const v=await page.evaluate(()=>window.__GAME__.vessel),dx=goal.x-v.x,dz=goal.z-v.z,d=Math.hypot(dx,dz);if(d<7)return;await page.evaluate(a=>window.__GAME__.steer(a),Math.atan2(-dx,-dz));await page.keyboard.down('KeyW');await step(Math.min(1.5,(d-5)/9));await page.keyboard.up('KeyW');}throw Error('Boat failed to reach target');}
 await paddleTo({x:12,z:-65});await e();assert.equal(await page.evaluate(()=>window.__GAME__.mode),'boat');await shot('boat');
 await paddleTo(targets.island);assert((await page.evaluate(()=>window.__GAME__.state)).island);assert.equal((await page.evaluate(()=>window.__GAME__.state)).boat,false);
 // Around the buoy the animals already swim in the beach sea; E observes one while it is above the water in view, without
 // leaving the boat or opening an overlay. Wait, and turn the boat now and then, until all 7 have shown themselves.
 assert.match(await page.locator('#nav-text').innerText(),/按 E 觀察/);
 await page.evaluate(()=>window.__GAME__.sea.ready);
 for(let i=0,idle=0,yaw=0;i<400&&(await page.evaluate(()=>window.__GAME__.state)).spotted<7;i++){
  if(!await page.locator('#target-prompt').isHidden()&&/觀察/.test(await page.locator('#target-prompt').innerText())){await e();idle=0;assert.equal(await page.evaluate(()=>window.__GAME__.mode),'boat');assert(await page.locator('#lagoon').isHidden());}
  else if(++idle%12===0){yaw+=1.2;await page.evaluate(a=>window.__GAME__.steer(a),yaw);}
  await step(.5);}
 assert.equal((await page.evaluate(()=>window.__GAME__.state)).spotted,7);assert((await page.evaluate(()=>window.__GAME__.state)).opensea);
 assert.deepEqual(await page.evaluate(()=>window.__GAME__.sea.creatures.map(c=>c.source)),Array(7).fill('B'));
 assert(await page.evaluate(()=>window.__GAME__.sea.creatures.every(c=>c.holder.visible)));const v=await page.evaluate(()=>window.__GAME__.vessel);assert(Math.hypot(v.x-targets.island.x,v.z-targets.island.z)<14);
 await shot('opensea');await e();assert.equal((await page.evaluate(()=>window.__GAME__.state)).spotted,7);
 await paddleTo({x:12,z:-65});await paddleTo(targets.dock);await e();await step(1);assert((await page.evaluate(()=>window.__GAME__.state)).boat);assert(await page.evaluate(()=>window.__GAME__.completed));assert(await page.locator('#complete').isVisible());await shot('complete');
 const result=await page.evaluate(()=>({state:window.__GAME__.state,elapsed:window.__GAME__.elapsed}));
 await page.click('#replay');assert.equal((await page.evaluate(()=>window.__GAME__.state)).shells,0);assert.equal((await page.evaluate(()=>window.__GAME__.state)).observed,0);assert.equal((await page.evaluate(()=>window.__GAME__.state)).spotted,0);assert.equal(await page.evaluate(()=>window.__GAME__.completed),false);assert.equal(await page.evaluate(()=>window.__GAME__.mode),'walk');
 // Switching uses keyboard and must retain progress/player position.
 const beforeSwitch=await page.evaluate(()=>({position:window.__EXPLORE__.player.toArray(),state:window.__GAME__.state}));
 for(const key of ['Digit1','Digit3','Digit2']){await page.keyboard.press(key);await page.waitForFunction(()=>!window.__EXPLORE__.busy);}
 assert.equal(await page.evaluate(()=>window.__EXPLORE__.group),'B');assert.deepEqual(await page.evaluate(()=>({position:window.__EXPLORE__.player.toArray(),state:window.__GAME__.state})),beforeSwitch);
 // Every source uses a real skinned character and the same physical contacts.
 const characterChecks=[],contacts=[];
 for(const group of ['A','B','C']){
  await page.evaluate(async group=>{await window.__EXPLORE__.switchGroup(group);window.__GAME__.teleport(-22,10);window.__GAME__.step(.4);},group);
  let info=await page.evaluate(()=>window.__GAME__.character);
  assert.equal(info.fallback,false);assert(info.skinnedMeshes>0&&info.bones>=17);assert(info.triangles>1000);assert.equal(info.animation,'idle');
  if(group==='B')assert(info.clips.length>=4);if(group==='C')assert(info.clips.length>=20);
  const idlePose=info.poseSample;
  await page.keyboard.down('KeyW');await step(.45);info=await page.evaluate(()=>window.__GAME__.character);assert.equal(info.animation,'walk');assert.notDeepEqual(info.poseSample,idlePose);
  await page.keyboard.down('ShiftLeft');await step(.9);// speeds up from a walk to a run over ~0.8 s
  info=await page.evaluate(()=>window.__GAME__.character);assert.equal(info.animation,'run');if(group!=='A')assert(info.clipTime>0);await page.keyboard.up('ShiftLeft');await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');await step(.12);assert.equal((await page.evaluate(()=>window.__GAME__.character)).animation,'jump');await step(.9);
  characterChecks.push(info);
  for(const [id,name] of [['umbrella','lounger'],['lifeguard','tower'],['boat','boat']]){
   await page.evaluate(id=>{const g=window.__GAME__,p=g.targets()[id];g.teleport(p[0],p[2]);g.step(.2);g.interact();g.step(.4);if(id==='lifeguard'&&!['climb','walk'].includes(g.character.animation))throw Error('Ladder did not animate');g.step(id==="lifeguard"?5.3:1.6);},id);
   const contact=await page.evaluate(()=>window.__GAME__.contact());console.log('contact',group,name,JSON.stringify(contact));assert(contact,`${group}/${id}`);assert(contact.inside,`${group}/${id} outside prop bounds`);assert(Math.abs(contact.gap)<.1,`${group}/${id} contact gap ${contact.gap}`);if(group!=='C'||id!=='umbrella')assert(contact.real,`${group}/${id} must hit source geometry`);
   // Feet are ankle bones: the Tripo v3 humanoid's sit about 0.15 m above its soles.
   if(id==='lifeguard')for(const foot of contact.feet)assert(Math.abs(foot[1]-contact.contactY)<.18,`${group} foot not on deck: ${foot[1]-contact.contactY}`);
   contacts.push({group,...contact});if(id!=='boat'||group==='B')await shot(`${group}_${name}`);
   await e();await step(id==="lifeguard"?5.5:.25);
  }
 }
 await page.keyboard.press('KeyV');await step(.1);assert(await page.evaluate(()=>window.__EXPLORE__.first&&window.__GAME__.character.headHidden));await page.keyboard.press('KeyV');await step(.1);assert.equal(await page.evaluate(()=>window.__GAME__.character.headHidden),false);
 await page.evaluate(()=>{const g=window.__GAME__,p=g.targets().ball;g.teleport(p[0],p[2]+1.3);g.interact();g.step(.12);});assert(await page.evaluate(()=>window.__GAME__.kick));await step(1.6);assert.equal(await page.evaluate(()=>window.__GAME__.kick),null);
 await page.evaluate(()=>{const g=window.__GAME__,p=g.targets().shells[0];g.teleport(p.x,p.z+.8);g.interact();g.step(.35);});assert.equal((await page.evaluate(()=>window.__GAME__.character)).animation,'interact');await step(1);
 // With dt frozen, neither clips nor procedural poses advance.
 const frozen=await page.evaluate(()=>{const g=window.__GAME__,before=g.character;g.step(0);return [before,g.character];});assert.deepEqual(frozen[0],frozen[1]);
 // Exercise the shoreline and positions within broad foliage bounds: never collapse the boom.
 for(const p of [[-4,-8],[-4,-5],[-3,-3],[9,-5],[6,3],[22,1]]){await at(...p);await page.evaluate(()=>{for(let i=0;i<24;i++){window.__GAME__.view(i*Math.PI/12);window.__GAME__.step(1/30);}});}
 assert((await page.evaluate(()=>window.__GAME__.cameraAudit)).minObserved>=1.6-1e-5);
 const cpuUpdates=await page.evaluate(async()=>{await window.__EXPLORE__.switchGroup('B');const g=window.__GAME__,out=[];for(const [x,z] of [[-20,10],[-4,-8],[-4,-3],[6,3]]){g.teleport(x,z);g.step(.1);const t=performance.now();g.step(1);out.push({x,z,msPerUpdate:(performance.now()-t)/60});}return out;});console.log('CPU updates (not GPU frame rate)',cpuUpdates);
 // CPU water field is seekable and reacts to time.
 const waves=await page.evaluate(()=>{const g=window.__GAME__;return [g.wave(12,-70,4),g.wave(12,-70,6),g.wave(12,-70,4)];});assert.deepEqual(waves[0],waves[2]);assert.notEqual(waves[0].height,waves[1].height);
 await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});monitor(mobile);await mobile.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4`);await mobile.waitForFunction(()=>window.__READY__);await mobile.tap('#begin');
 const before=await mobile.evaluate(()=>window.__EXPLORE__.player.z);await mobile.locator('#stick').dispatchEvent('pointerdown',{pointerId:1,clientX:75,clientY:680});await mobile.locator('#stick').dispatchEvent('pointermove',{pointerId:1,clientX:75,clientY:635});await mobile.evaluate(()=>window.__GAME__.step(1));await mobile.locator('#stick').dispatchEvent('pointerup',{pointerId:1});assert((await mobile.evaluate(()=>window.__EXPLORE__.player.z))<before-1);
 await mobile.evaluate(()=>{const g=window.__GAME__,s=g.targets().shells[0];g.teleport(s.x,s.z+.8);g.step(.5);});await mobile.tap('#interact');await mobile.evaluate(()=>window.__GAME__.step(1.3));assert.equal((await mobile.evaluate(()=>window.__GAME__.state)).shells,1);await mobile.evaluate(()=>window.__GAME__.step(1));await mobile.screenshot({path:`${output}/mobile.png`});assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.close();
 // Missing meshes still expose every slot interaction and a usable boat.
 const missing=await browser.newPage({viewport:{width:800,height:600}});monitor(missing,true);await missing.route('**/assets/tripo/*.glb',r=>r.fulfill({status:404,body:'unavailable'}));await missing.route('**/assets/character/*.glb',r=>r.fulfill({status:404,body:'unavailable'}));await missing.goto(`http://localhost:${process.env.PORT||5191}/game.html?auto=1&time=4`);await missing.waitForFunction(()=>window.__READY__);await missing.click('#begin');assert.equal(await missing.evaluate(()=>window.__GAME__.character.fallback),true);
 for(const [id,mode] of [['umbrella','rest'],['lifeguard','tower'],['boat','boat']]){await missing.evaluate(id=>{const g=window.__GAME__,p=g.targets()[id];g.teleport(p[0],p[2]);g.step(.2);g.interact();g.step(2);},id);assert.equal(await missing.evaluate(()=>window.__GAME__.mode),mode);await missing.keyboard.press('KeyE');await missing.evaluate(()=>window.__GAME__.step(.2));}
 await missing.route('**/assets/character_C/character.glb',r=>r.fulfill({status:404,body:'unavailable'}));await missing.goto(`http://localhost:${process.env.PORT||5191}/game.html?group=C&auto=1&time=4`);await missing.waitForFunction(()=>window.__READY__);assert.equal(await missing.evaluate(()=>window.__GAME__.character.fallback),true);
 await missing.close();
 assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify({...result,errors,characterChecks,contacts,cpuUpdates,checks:['seven quests','six tide-pool observations','tide-pool progress survives iframe unload','offshore observation at buoy','Esc and back preserve boat mode and vessel','overlay iframe unload','boat round trip','early disembark blocked','restart','ABC keys','CPU waves seek','mobile joystick and interaction','missing assets and characters','ABC real surface contacts','ABC skeleton idle walk run jump','minimum camera boom across scripted run','frozen animation clock']},null,2));console.log('Game verification passed',result);
}finally{await browser.close();}
