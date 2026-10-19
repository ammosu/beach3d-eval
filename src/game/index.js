import * as T from 'three';
import {groundHeight,shore} from '../terrain.js';
import {sampleWater} from '../water.js';
import {propRoot} from '../props.js';
import {createObjects,fallbackBoat} from './objects.js';
import {createBall} from './physics.js';
import '../game.css';

export function createGame({scene,camera,renderer,water,config,explore:e,auto}) {
 document.body.classList.add('game-mode');document.querySelector('#loading')?.remove();
 const $=s=>document.querySelector(s),time=()=>water.material.uniforms.time.value;
 const welcome=$('.welcome');welcome.innerHTML=`<span class="postmark" aria-hidden="true">☀</span><p class="invitation">給自己一小段海邊時光</p><h1>海灘小任務</h1><p>收集潮間帶的小驚喜，踢球、歇腳、登高。<br>最後划向小島，再帶著海風回來。</p><div class="trip-details"><span>5 個小任務</span><span>約 3–5 分鐘</span></div><button id="begin">開始玩</button><p class="start-controls">WASD 移動 · 滑鼠環顧 · E 互動<br>觸控：左側搖桿移動，右側拖曳環顧</p><a href="/">回海邊場景實驗室</a>`;
 // Reuse the original start handler, including gesture-gated ambience/pointer lock.
 // The old node was replaced, so transfer its behavior through an explicit adapter.
 const ui=document.createElement('div');ui.id='game';ui.innerHTML=`<section class="quest-book" aria-label="任務清單"><header><h2>海灘小任務</h2><span id="game-clock">0:00</span></header><p class="quest-intro">慢慢走，海風會等你。</p><ul><li data-quest="shells"><i></i><span>撿貝殼 <b id="shell-count">0 / 8</b></span></li><li data-quest="ball"><i></i><span>把沙灘球踢進海裡</span></li><li data-quest="lounger"><i></i><span>在躺椅上休息</span></li><li data-quest="tower"><i></i><span>登上救生塔看海</span></li><li data-quest="boat"><i></i><span>划到小島，再回岸邊</span></li></ul><p id="footnote">額外的小紀念：在沙上留下腳印</p></section><div id="navigation"><span id="nav-arrow">↑</span><span id="nav-text"></span></div><div id="game-toast" role="status" aria-live="polite"></div><div id="target-prompt"><kbd>E</kbd><span></span></div><button id="interact" disabled>互動 <kbd>E</kbd></button><div class="game-controls">WASD 移動　滑鼠環顧　E 互動　Shift 跑步<br>1 / 2 / 3 素材　M 靜音　Esc 暫停</div><button id="game-audio" aria-label="切換聲音">聲音 開</button><div id="game-fade"></div><section id="complete" hidden role="dialog" aria-modal="true" aria-labelledby="complete-title"><div><span class="postmark" aria-hidden="true">☀</span><p>海風、浪花，和你的小小足跡</p><h1 id="complete-title">今天的海灘，收集完成。</h1><p>8 枚貝殼 · 5 個海邊回憶</p><strong id="finish-time"></strong><p id="finish-bonus"></p><button id="replay">再玩一次</button><a href="/">回到首頁</a></div></section>`;document.body.append(ui);
 const objects=createObjects(scene,water.material.uniforms.time,config);
 const state={shells:0,ball:false,lounger:false,tower:false,boat:false,island:false,footprints:0};
 let running=false,completed=false,elapsed=0,mode='walk',modeAge=0,toastUntil=-1,fadeAt=-100,lastHud='',near=null,currentGroup=e.group,paddleClock=0,boatSpeed=0,boatYaw=0,footDistance=0;
 const lastPlayer=e.player.clone(),returnPoint=e.player.clone(),target=new T.Vector3(),camGoal=new T.Vector3(),camLook=new T.Vector3(),screen=new T.Vector3(),input={},wave={};
 const anchors={};for(const id of ['umbrella','lifeguard','boat']){const slot=config.slots.find(s=>s.id===id);anchors[id]={id,x:slot.pos[0],z:slot.pos[2],y:groundHeight(slot.pos[0],slot.pos[2]),box:null,point:new T.Vector3()};}
 const anchorList=Object.values(anchors),interaction={kind:'',label:'',position:null,item:null};
 const dock={x:4,z:shore(4)-9},island={x:60,z:-286};
 const vessel=new T.Group();vessel.name='game-rowboat';scene.add(vessel);vessel.visible=false;
 const oar=new T.Group(),oarMat=new T.MeshStandardMaterial({color:0xc7a075});const shaft=new T.Mesh(new T.CylinderGeometry(.035,.035,2.6,6),oarMat);shaft.rotation.z=Math.PI/2;oar.add(shaft);const blade=new T.Mesh(new T.BoxGeometry(.5,.055,.25),oarMat);blade.position.x=1.25;oar.add(blade);oar.position.set(.5,.7,.1);vessel.add(oar);
 let boatModel=null,hiddenBoat=null,fallbackModel=null;
 const lounger=new T.Group();lounger.name='game-rest-seat';const seatMat=new T.MeshStandardMaterial({color:0xffefcf});const seat=new T.Mesh(new T.BoxGeometry(.95,.12,1.65),seatMat);seat.position.y=.48;lounger.add(seat);const back=new T.Mesh(new T.BoxGeometry(.95,.12,.75),seatMat);back.position.set(0,.7,.95);back.rotation.x=-.65;lounger.add(back);for(const x of [-.37,.37])for(const z of [-.65,.65]){const leg=new T.Mesh(new T.BoxGeometry(.07,.5,.07),oarMat);leg.position.set(x,.23,z);lounger.add(leg);}scene.add(lounger);
 const towerDeck=new T.Mesh(new T.BoxGeometry(1.7,.12,1.4),new T.MeshStandardMaterial({color:0xeee3c8}));towerDeck.name='game-lookout-deck';scene.add(towerDeck);const deckPosts=new T.InstancedMesh(new T.BoxGeometry(.09,1,.09),oarMat,4);scene.add(deckPosts);const deckDummy=new T.Object3D();
 const ringMat=new T.MeshBasicMaterial({color:0xffe18a,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false});const destination=new T.Mesh(new T.TorusGeometry(8,.2,8,64),ringMat);destination.rotation.x=-Math.PI/2;destination.position.set(island.x,.6,island.z);scene.add(destination);
 const buoy=new T.Mesh(new T.CylinderGeometry(.2,.4,4,8),new T.MeshStandardMaterial({color:0xffb64f}));buoy.position.set(island.x,2,island.z);scene.add(buoy);
 function syncAnchors(){
  for(const a of anchorList){const c=e.colliders.find(c=>c.id===a.id);a.box=c?.box??null;const slot=config.slots.find(s=>s.id===a.id);const half=(slot.maxLen??3)*.5;const edge=a.box?a.box.max.z:a.z+half;a.point.set(a.x,groundHeight(a.x,edge+1.05),edge+1.05);}
  const a=anchors.umbrella;lounger.position.set(a.box?a.box.min.x-.8:a.x-2.7,0,a.z);lounger.position.y=groundHeight(lounger.position.x,lounger.position.z);a.point.set(lounger.position.x-.85,lounger.position.y,lounger.position.z+.65);
  const tower=anchors.lifeguard;towerDeck.position.set(tower.x,(tower.box?.min.y??tower.y)+2.45,(tower.box?.max.z??tower.z+2)+.75);
  for(let i=0;i<4;i++){deckDummy.position.set(towerDeck.position.x+(i%2?-.7:.7),towerDeck.position.y/2,towerDeck.position.z+(i<2?-.5:.5));deckDummy.scale.set(1,towerDeck.position.y,1);deckDummy.updateMatrix();deckPosts.setMatrixAt(i,deckDummy.matrix);}deckPosts.instanceMatrix.needsUpdate=true;
  // Current group geometry is shared by a detached clone; source transforms stay intact.
  if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;
  if(boatModel)vessel.remove(boatModel);
  const source=propRoot.children.find(c=>c.name==='boat');
  if(source?.children.length){boatModel=source.clone(true);boatModel.position.set(0,-groundHeight(4,8),0);const box=new T.Box3().setFromObject(boatModel),size=box.getSize(new T.Vector3());if(size.x>size.z)boatModel.rotation.y=Math.PI/2;}
  else boatModel=fallbackModel??=fallbackBoat();vessel.add(boatModel);
  if(mode==='boat'&&source){source.visible=false;hiddenBoat=source;}
 }
 syncAnchors();
 const ball=createBall(objects.ball,()=>e.colliders,()=>{if(!state.ball){state.ball=true;toast('球進海裡了！讓它跟著浪花漂吧。');}},()=>e.sfx('splash'));
 function toast(message){$('#game-toast').textContent=message;toastUntil=time()+3.5;}
 function renderHud(){const signature=`${state.shells},${state.ball},${state.lounger},${state.tower},${state.boat},${state.footprints>0},${Math.floor(elapsed)}`;if(signature===lastHud)return;lastHud=signature;$('#shell-count').textContent=`${state.shells} / 8`;for(const key of ['shells','ball','lounger','tower','boat']){const done=key==='shells'?state.shells===8:state[key],li=$(`[data-quest=${key}]`);li.classList.toggle('done',done);li.querySelector('i').textContent=done?'✓':'';li.setAttribute('aria-label',`${li.textContent}，${done?'已完成':'未完成'}`);}$('#game-clock').textContent=formatTime(elapsed);if(state.footprints)$('#footnote').textContent='✓ 留下腳印，讓浪花慢慢帶走';}
 function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
 function begin(){running=true;document.body.classList.add('game-playing');$('#start').hidden=true;$('#begin').textContent='繼續玩';welcome.querySelector('h1').textContent='海灘小任務';renderHud();}
 // `start` is exported by Explore so the same gesture enables sound and controls.
 $('#begin').onclick=()=>{e.start();begin();};
 function fade(){fadeAt=time();}
 function seated(value){e.avatar.rotation.set(0,Math.PI,0);for(let i=0;i<2;i++){e.legs[i].rotation.x=value?Math.PI/2:0;e.legs[i].position.y=value?.60:.38;e.legs[i].position.z=value?.28:0;e.shoes[i].position.y=value?.60:.07;e.shoes[i].position.z=value?.66:.045;e.arms[i].rotation.x=value?-.35:0;}}
 function enter(next){returnPoint.copy(e.player);mode=next;modeAge=0;e.setDriven(true);e.clearInput();fade();if(next==='rest'){e.player.copy(lounger.position);e.player.y-=.1;seated(true);toast('聽一會兒海浪。按 E 或「互動」起身。');}if(next==='tower'){e.player.copy(towerDeck.position);e.player.y+=.07;seated(false);toast('從高處看看整座海灣。按 E 下塔。');}if(next==='boat'){vessel.visible=true;vessel.position.set(dock.x,0,dock.z);boatSpeed=0;boatYaw=0;seated(true);syncAnchors();$('.game-controls').innerHTML='W / S 划行　A / D 轉向　E 靠岸下船<br>跟隨上方箭頭，抵達浮標後再返回';toast('W / S 划行，A / D 轉向。向金色浮標出發！');}}
 function leave(){if(mode==='boat'){if(Math.hypot(vessel.position.x-dock.x,vessel.position.z-dock.z)>11){toast('先回到岸邊的金色圓環，才能下船。');return;}if(state.island){state.boat=true;toast('小島往返完成，歡迎回岸！');}vessel.visible=false;if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;}mode='walk';$('.game-controls').innerHTML='WASD 移動　滑鼠環顧　E 互動　Shift 跑步<br>1 / 2 / 3 素材　M 靜音　Esc 暫停';e.player.copy(returnPoint);e.avatar.rotation.set(0,Math.PI,0);seated(false);e.setDriven(false);e.setView(0);e.clearInput();lastPlayer.copy(e.player);fade();}
 function setNear(kind,label,position,item=null){interaction.kind=kind;interaction.label=label;interaction.position=position;interaction.item=item;return interaction;}
 function nearTarget(){if(mode==='boat'&&Math.hypot(vessel.position.x-dock.x,vessel.position.z-dock.z)>11)return null;if(mode!=='walk')return setNear('leave',mode==='rest'?'起身，繼續散步':mode==='tower'?'走下救生塔':'靠岸下船',e.player);let best=2.4,result=null;for(const item of objects.items){if(item.collected)continue;const d=Math.hypot(item.x-e.player.x,item.z-e.player.z);if(d<best){best=d;result=item;}}
  if(result)return setNear('shell','撿起貝殼',result,result);
  if(e.player.distanceTo(objects.ball.position)<2.3)return setNear('ball','踢球，朝海邊！',objects.ball.position);
  for(const a of anchorList){if(e.player.distanceTo(a.point)<2.4)return setNear(a.id,a.id==='boat'?'推船下水，划向小島':a.id==='umbrella'?'坐下，聽海':'爬上救生塔',a.point);}return null;
 }
 function interact(){if(!running||completed||!e.active||e.busy)return;near=nearTarget();if(!near){if(mode==='boat')toast('划回岸邊的金色圓環，就能下船。');return;}
  if(near.kind==='leave'){leave();return;}
  if(near.kind==='shell'){const item=near.item;if(item.collected)return;item.collected=true;item.born=time();state.shells++;objects.burst(item.x,item.y+.25,item.z,time());e.sfx('pickup');toast(state.shells===8?'8 枚貝殼收齊了。謝謝海灘的小禮物！':`找到第 ${state.shells} 枚貝殼`);}
  if(near.kind==='ball'){ball.kick(e.player);e.sfx('kick');}
  if(near.kind==='umbrella')enter('rest');if(near.kind==='lifeguard')enter('tower');if(near.kind==='boat')enter('boat');renderHud();
 }
 addEventListener('keydown',event=>{if(event.code==='KeyE'&&!event.repeat){event.preventDefault();interact();}});$('#interact').onclick=interact;$('#game-audio').onclick=()=>e.mute();
 function complete(){camera.position.fromArray(config.cameras.wide.pos);target.fromArray(config.cameras.wide.target);camera.lookAt(target);completed=true;running=false;e.setDriven(true);e.clearInput();document.exitPointerLock?.();$('#start').hidden=true;$('#complete').hidden=false;document.body.classList.add('game-complete');$('#finish-time').textContent=`這次的海邊時光　${formatTime(elapsed)}`;$('#finish-bonus').textContent=state.footprints?'還留下了一串會消失的腳印。':'下次來，試著在沙灘上留一串腳印。';$('#replay').focus();}
 function reset(){if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;vessel.visible=false;mode='walk';completed=false;running=false;elapsed=0;boatSpeed=0;footDistance=0;for(const key of Object.keys(state))state[key]=['shells','footprints'].includes(key)?0:false;objects.reset();ball.reset();e.player.set(-7,groundHeight(-7,12),12);lastPlayer.copy(e.player);e.avatar.rotation.set(0,0,0);seated(false);e.setDriven(false);e.setView(.15);e.clearInput();$('#complete').hidden=true;document.body.classList.remove('game-complete');lastHud='';$('#footnote').textContent='額外的小紀念：在沙上留下腳印';e.start();begin();fade();}
 $('#replay').onclick=reset;
 document.addEventListener('pointerlockchange',()=>{if(completed)$('#start').hidden=true;});
 function boatUpdate(dt,t){
  e.input(input);const driving=running&&e.active&&!e.busy;const f=driving?input.forward:0,s=driving?input.side:0;
  boatYaw-=s*dt*1.15;boatSpeed+=(f*9-boatSpeed)*(1-Math.exp(-2*dt));
  const x=vessel.position.x-Math.sin(boatYaw)*boatSpeed*dt,z=vessel.position.z-Math.cos(boatYaw)*boatSpeed*dt;
  let allowed=groundHeight(x,z)<-.7&&x>-48&&x<145&&z>-304;
  for(const c of e.colliders){const b=c.box;if(x>b.min.x-1&&x<b.max.x+1&&z>b.min.z-1.8&&z<b.max.z+1.8)allowed=false;}
  // Keep out of both existing island meshes (which are separate from terrain.js).
  if(((x-114)/66)**2+((z+58)/80)**2<1||((x-90)/108)**2+((z+340)/43)**2<1)allowed=false;
  if(allowed){vessel.position.x=x;vessel.position.z=z;}else boatSpeed=0;
  sampleWater(vessel.position.x,vessel.position.z,t,wave);vessel.position.y=wave.height+.06;
  const c=Math.cos(boatYaw),sine=Math.sin(boatYaw),localNX=c*wave.nx-sine*wave.nz,localNZ=sine*wave.nx+c*wave.nz;vessel.rotation.set(Math.atan2(localNZ,wave.ny),boatYaw,-Math.atan2(localNX,wave.ny),'YXZ');
  e.player.copy(vessel.position);e.player.y+=.08;e.avatar.position.copy(e.player);e.avatar.rotation.set(vessel.rotation.x,boatYaw+Math.PI,vessel.rotation.z,'YXZ');
  oar.rotation.y=Math.sin(t*6)*Math.min(1,Math.abs(boatSpeed)/4)*.6;oar.rotation.z=Math.sin(t*6+.7)*.22;
  if(Math.abs(boatSpeed)>1&&(paddleClock-=dt)<=0){e.sfx('paddle');paddleClock=.8;}
  const dist=Math.hypot(vessel.position.x-island.x,vessel.position.z-island.z);if(!state.island&&dist<11){state.island=true;objects.burst(vessel.position.x,vessel.position.y+1,vessel.position.z,t);e.sfx('pickup');toast('抵達小島！轉身划回岸邊的金色圓環。');}
  camGoal.set(vessel.position.x+Math.sin(boatYaw)*9,vessel.position.y+4.8,vessel.position.z+Math.cos(boatYaw)*9);camLook.set(vessel.position.x-Math.sin(boatYaw)*7,1,vessel.position.z-Math.cos(boatYaw)*7);
 }
 function update(dt,t){
  if(e.group!==currentGroup&&!e.busy){currentGroup=e.group;syncAnchors();if(mode==='rest'){e.player.copy(lounger.position);e.player.y-=.1;}else if(mode==='tower'){e.player.copy(towerDeck.position);e.player.y+=.07;}}
  document.body.classList.toggle('game-paused',running&&!e.active&&!completed);
  const active=running&&e.active&&!e.busy&&!completed,simDt=active?dt:0;
  if(active)elapsed+=dt;
  const moved=Math.hypot(e.player.x-lastPlayer.x,e.player.z-lastPlayer.z);
  if(active&&mode==='walk'){footDistance+=moved<1?moved:0;if(footDistance>.55&&groundHeight(e.player.x,e.player.z)>.015){objects.footprint(e.player.x,e.player.z,e.avatar.rotation.y,t);state.footprints++;footDistance=0;}}
  if(running&&!completed)ball.update(simDt,t,e.player,moved>.001&&mode==='walk');
  if(mode!=='walk'){
   modeAge+=simDt;
   if(mode==='boat')boatUpdate(simDt,t);
   else{e.avatar.position.copy(e.player);if(mode==='rest'){camGoal.set(lounger.position.x-3.3,lounger.position.y+2.5,lounger.position.z+4.8);camLook.set(lounger.position.x+1,1.4,lounger.position.z-12);if(modeAge>1.2&&!state.lounger){state.lounger=true;e.sfx('pickup');}}else{camGoal.set(e.player.x-4,e.player.y+4.1,e.player.z+7);camLook.set(e.player.x-5,e.player.y-1,e.player.z-10);if(modeAge>1.2&&!state.tower){state.tower=true;e.sfx('pickup');}}}
   camera.position.lerp(camGoal,1-Math.exp(-3*dt));target.lerp(camLook,1-Math.exp(-3*dt));camera.lookAt(target);
  }else{camera.getWorldDirection(target);target.multiplyScalar(10).add(camera.position);}
  lastPlayer.copy(e.player);objects.update(t);
  destination.visible=mode==='boat';buoy.visible=mode==='boat';const dest=state.island?dock:island;destination.position.set(dest.x,.6,dest.z);sampleWater(dest.x,dest.z,t,wave);destination.position.y=wave.height+.14;buoy.position.set(dest.x,wave.height+1.4,dest.z);
  near=active?nearTarget():null;const prompt=$('#target-prompt'),button=$('#interact');button.disabled=!near;button.firstChild.textContent=mode==='boat'?(near?'下船 ':'划行中 '):mode==='tower'?'下塔 ':mode==='rest'?'起身 ':'互動 ';objects.halo.visible=!!near&&mode==='walk';prompt.hidden=!near;
  if(near){const p=near.position;screen.set(p.x,p.y??p.height??groundHeight(p.x,p.z),p.z);if(near.kind==='shell')screen.y=near.item.y;if(near.kind==='shell'&&screen.y<.04){sampleWater(screen.x,screen.z,t,wave);screen.y=Math.max(screen.y,wave.height);}objects.halo.position.set(screen.x,screen.y+.025,screen.z);screen.y+=1.2;screen.project(camera);const onScreen=screen.z<1&&screen.z>-1&&Math.abs(screen.x)<.95&&Math.abs(screen.y)<.95;prompt.hidden=!onScreen;prompt.style.left=`${(screen.x*.5+.5)*innerWidth}px`;prompt.style.top=`${(-screen.y*.5+.5)*innerHeight}px`;prompt.querySelector('span').textContent=near.label;}
  let goal=null,label='';if(mode==='boat'){goal=dest;label=state.island?'岸邊圓環 · E 下船':'小島浮標';}else if(state.shells<8){let d=Infinity;for(const item of objects.items){const n=Math.hypot(item.x-e.player.x,item.z-e.player.z);if(!item.collected&&n<d){d=n;goal=item;}}label='下一枚貝殼';}else if(!state.ball){goal=objects.ball.position;label='沙灘球';}else if(!state.lounger){goal=anchors.umbrella.point;label='躺椅';}else if(!state.tower){goal=anchors.lifeguard.point;label='救生塔';}else if(!state.boat){goal=anchors.boat.point;label='岸上的小船';}
  if(goal){const dx=goal.x-e.player.x,dz=goal.z-e.player.z;$('#nav-text').textContent=`${label}　${Math.round(Math.hypot(dx,dz))} m`;e.input(input);$('#nav-arrow').style.transform=`rotate(${Math.atan2(dx,-dz)+(mode==='boat'?boatYaw:input.yaw)}rad)`;}$('#navigation').hidden=!goal||!active||mode==='rest'||mode==='tower';
  $('#game-audio').textContent=e.muted?'聲音 關':'聲音 開';$('#game-audio').setAttribute('aria-pressed',String(e.muted));$('#game-toast').classList.toggle('visible',active&&t<toastUntil);$('#game-fade').style.opacity=String(Math.max(0,1-(t-fadeAt)/.65)*.65);renderHud();
  if(active&&mode==='walk'&&state.shells===8&&state.ball&&state.lounger&&state.tower&&state.boat)complete();
 }
 // Test actions use the real input/interaction/physics path; no quest-state setter.
 const api={update,interact,reset,get state(){return {...state};},get mode(){return mode;},get completed(){return completed;},get elapsed(){return elapsed;}};
 if(auto){Object.assign(api,{teleport(x,z){if(mode!=='walk')throw Error('Teleport is only available on foot');e.player.set(x,groundHeight(x,z),z);lastPlayer.copy(e.player);},targets(){return {shells:objects.items.map(s=>({x:s.x,y:s.y,z:s.z,collected:s.collected})),ball:objects.ball.position.toArray(),umbrella:anchors.umbrella.point.toArray(),lifeguard:anchors.lifeguard.point.toArray(),boat:anchors.boat.point.toArray(),dock,island};},step(seconds){let remaining=seconds;while(remaining>1e-6){const dt=Math.min(1/60,remaining);window.__TIME__=time()+dt;water.material.uniforms.time.value=window.__TIME__;e.update(dt);update(dt,window.__TIME__);remaining-=dt;}},steer(angle){if(mode!=='boat')throw Error('Not in boat');boatYaw=angle;},view(yaw){e.setView(yaw);},wave(x,z,t){return {...sampleWater(x,z,t,{})};}});Object.defineProperty(api,'vessel',{get(){return {x:vessel.position.x,y:vessel.position.y,z:vessel.position.z,yaw:boatYaw,speed:boatSpeed};}});window.__GAME__=api;}
 update(0,time());return api;
}
