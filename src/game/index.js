import * as T from 'three';
import {groundHeight,shore} from '../terrain.js';
import {sampleWater} from '../water.js';
import {propRoot} from '../props.js';
import {createObjects,fallbackBoat} from './objects.js';
import {createBall} from './physics.js';
import {createCharacter} from './character.js';
import {findSurface,surfacesAt} from './surfaces.js';
import {createGameCamera,MIN_BOOM} from './camera.js';
import {createTidePool,createLagoon} from './lagoon.js';
import '../game.css';

export async function createGame({scene,camera,renderer,water,config,explore:e,auto}) {
 document.body.classList.add('game-mode');document.querySelector('#loading')?.remove();
 const $=s=>document.querySelector(s),time=()=>water.material.uniforms.time.value;
 const welcome=$('.welcome');welcome.innerHTML=`<span class="postmark" aria-hidden="true">☀</span><p class="invitation">給自己一小段海邊時光</p><h1>海灘小任務</h1><p>收集潮間帶的小驚喜，踢球、歇腳、登高，<br>翻石尋找潮池的小住客。<br>再划向外海放生，帶著海風回來。</p><div class="trip-details"><span>7 個小任務</span><span>約 6–9 分鐘</span></div><button id="begin">開始玩</button><p class="start-controls">WASD 移動 · 滑鼠環顧 · E 互動<br>觸控：左側搖桿移動，右側拖曳環顧</p><a href="/">回海邊場景實驗室</a>`;
 // Reuse the original start handler, including gesture-gated ambience/pointer lock.
 // The old node was replaced, so transfer its behavior through an explicit adapter.
 const ui=document.createElement('div');ui.id='game';ui.innerHTML=`<section class="quest-book" aria-label="任務清單"><header><h2>海灘小任務</h2><span id="game-clock">0:00</span></header><p class="quest-intro">慢慢走，海風會等你。</p><ul><li data-quest="shells"><i></i><span>撿貝殼 <b id="shell-count">0 / 8</b></span></li><li data-quest="ball"><i></i><span>把沙灘球踢進海裡</span></li><li data-quest="lounger"><i></i><span>在躺椅上休息</span></li><li data-quest="tower"><i></i><span>登上救生塔看海</span></li><li data-quest="tidepool"><i></i><span>潮池觀察 <b id="tidepool-hud">0 / 6</b></span></li><li data-quest="opensea"><i></i><span>在外海放生大型海洋生物 <b id="lagoon-hud">0 / 7</b></span></li><li data-quest="boat"><i></i><span>划到小島，再回岸邊</span></li></ul><p id="footnote">額外的小紀念：在沙上留下腳印</p></section><div id="navigation"><span id="nav-arrow">↑</span><span id="nav-text"></span></div><div id="game-toast" role="status" aria-live="polite"></div><div id="target-prompt"><kbd>E</kbd><span></span></div><button id="interact" disabled>互動 <kbd>E</kbd></button><div class="game-controls">WASD 移動　滑鼠環顧　E 互動　Shift 跑步<br>1 / 2 / 3 素材　M 靜音　Esc 暫停</div><button id="game-audio" aria-label="切換聲音">聲音 開</button><div id="game-fade"></div><section id="complete" hidden role="dialog" aria-modal="true" aria-labelledby="complete-title"><div><span class="postmark" aria-hidden="true">☀</span><p>海風、浪花，和你的小小足跡</p><h1 id="complete-title">今天的海灘，收集完成。</h1><p>8 枚貝殼 · 6 種潮池生物 · 7 種海洋生物</p><strong id="finish-time"></strong><p id="finish-bonus"></p><button id="replay">再玩一次</button><a href="/">回到首頁</a></div></section>`;document.body.append(ui);
 const objects=createObjects(scene,water.material.uniforms.time,config);
 const state={shells:0,ball:false,lounger:false,tower:false,tidepool:false,observed:0,opensea:false,released:0,boat:false,island:false,footprints:0};
 const pool=createTidePool(scene);
 const lagoon=createLagoon({onRelease(sp,count){state.released=count;e.sfx('pickup');if(count===7)state.opensea=true;renderHud();},onObserve(id,count){state.observed=count;state.tidepool=count===6;renderHud();},onClose(kind){e.clearInput();if(kind==='tidepool')leave();if(running&&!completed&&!auto)e.start();}});
 let running=false,completed=false,elapsed=0,mode='walk',modeAge=0,toastUntil=-1,fadeAt=-100,lastHud='',near=null,currentGroup=e.group,paddleClock=0,boatSpeed=0,boatYaw=0,footDistance=0;
 const lastPlayer=e.player.clone(),returnPoint=e.player.clone(),target=new T.Vector3(),camGoal=new T.Vector3(),camLook=new T.Vector3(),screen=new T.Vector3(),input={},wave={};
 const anchors={};for(const id of ['umbrella','lifeguard','boat']){const slot=config.slots.find(s=>s.id===id);anchors[id]={id,x:slot.pos[0],z:slot.pos[2],y:groundHeight(slot.pos[0],slot.pos[2]),box:null,point:new T.Vector3()};}
 const anchorList=Object.values(anchors),interaction={kind:'',label:'',position:null,item:null};
 const dock={x:4,z:shore(4)-9},island={x:60,z:-286};
 const vessel=new T.Group();vessel.name='game-rowboat';scene.add(vessel);vessel.visible=false;
 const oar=new T.Group(),oarMat=new T.MeshStandardMaterial({color:0xc7a075});const shaft=new T.Mesh(new T.CylinderGeometry(.035,.035,2.6,6),oarMat);shaft.rotation.z=Math.PI/2;oar.add(shaft);const blade=new T.Mesh(new T.BoxGeometry(.5,.055,.25),oarMat);blade.position.x=1.25;oar.add(blade);oar.position.set(.5,.7,.1);vessel.add(oar);
 let boatModel=null,hiddenBoat=null,fallbackModel=null;
 const followCamera=createGameCamera(camera,propRoot);e.setCameraController(followCamera);
 for(const child of e.avatar.children)child.visible=false;
 const characterCache=new Map();let character=await createCharacter(e.group);characterCache.set(e.group,character);e.avatar.add(character.root);
 let boatSeat=null;const climbStart=new T.Vector3();
 async function switchCharacter(group){character.root.removeFromParent();if(!characterCache.has(group))characterCache.set(group,await createCharacter(group));character=characterCache.get(group);e.avatar.add(character.root);syncAnchors();followCamera.refresh();if(mode==='rest'){e.player.copy(anchors.umbrella.surface.point);e.avatar.rotation.set(0,anchors.umbrella.surface.yaw,0);}if(mode==='tower')e.player.copy(anchors.lifeguard.surface.point);updateCharacter(0);}
 e.onGroupChange(switchCharacter);
 function updateCharacter(dt){const pose=mode==='rest'?(anchors.umbrella.surface.kind==='lounger'?'lie':'sand'):mode==='boat'?'paddle':mode==='tower'&&modeAge<1.1?'climb':'stand';character.update(dt,{speed:mode==='walk'?e.speed:0,airborne:e.airborne,pose,first:e.first,fade:followCamera.distance<2.2?.4:1});const info=character.info();let node=$('#character-stats');if(!node){node=document.createElement('span');node.id='character-stats';$('#stats').after(node);}node.textContent=`角色 ${info.source}${info.fallback?'（備援）':''} · ${info.triangles.toLocaleString()} triangles`;}
 const ringMat=new T.MeshBasicMaterial({color:0xffe18a,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false});const destination=new T.Mesh(new T.TorusGeometry(8,.2,8,64),ringMat);destination.rotation.x=-Math.PI/2;destination.position.set(island.x,.6,island.z);scene.add(destination);
 const buoy=new T.Mesh(new T.CylinderGeometry(.2,.4,4,8),new T.MeshStandardMaterial({color:0xffb64f}));buoy.position.set(island.x,2,island.z);scene.add(buoy);
 function syncAnchors(){
  for(const a of anchorList){const c=e.colliders.find(c=>c.id===a.id);a.box=c?.box??null;const slot=config.slots.find(s=>s.id===a.id);const half=(slot.maxLen??3)*.5;const edge=a.box?a.box.max.z:a.z+half;a.point.set(a.x,groundHeight(a.x,edge+1.05),edge+1.05);}
  for(const a of anchorList){const source=propRoot.children.find(c=>c.name===a.id);a.surface=findSurface(source,a.id,e.group,a);}
  const a=anchors.umbrella,seat=a.surface.point;a.point.set(seat.x,groundHeight(seat.x,(a.box?.max.z??seat.z)+.8),(a.box?.max.z??seat.z)+.8);
  const tower=anchors.lifeguard;tower.climb=new T.Vector3(tower.surface.point.x,groundHeight(tower.surface.point.x,(tower.box?.max.z??tower.z)+.25),(tower.box?.max.z??tower.z)+.25);
  // Current group geometry is shared by a detached clone; source transforms stay intact.
  if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;
  if(boatModel)vessel.remove(boatModel);
  const source=propRoot.children.find(c=>c.name==='boat');
  if(source?.children.length){boatModel=source.clone(true);boatModel.position.set(0,-groundHeight(4,8),0);const box=new T.Box3().setFromObject(boatModel),size=box.getSize(new T.Vector3());if(size.x>size.z)boatModel.rotation.y=Math.PI/2;}
  else boatModel=fallbackModel??=fallbackBoat();vessel.add(boatModel);
  vessel.updateMatrixWorld(true);const oldPosition=vessel.position.clone(),oldRotation=vessel.quaternion.clone();vessel.position.set(0,0,0);vessel.quaternion.identity();vessel.updateMatrixWorld(true);boatSeat=findSurface(boatModel,'boat',e.group,{x:0,z:0});vessel.position.copy(oldPosition);vessel.quaternion.copy(oldRotation);vessel.updateMatrixWorld(true);
  if(mode==='boat'&&source){source.visible=false;hiddenBoat=source;}
 }
 syncAnchors();
 const ball=createBall(objects.ball,()=>e.colliders,()=>{if(!state.ball){state.ball=true;toast('球進海裡了！讓它跟著浪花漂吧。');}},()=>e.sfx('splash'));
 function toast(message){$('#game-toast').textContent=message;toastUntil=time()+3.5;}
 function renderHud(){const signature=`${state.shells},${state.ball},${state.lounger},${state.tower},${state.observed},${state.released},${state.boat},${state.footprints>0},${Math.floor(elapsed)}`;if(signature===lastHud)return;lastHud=signature;$('#shell-count').textContent=`${state.shells} / 8`;$('#tidepool-hud').textContent=`${state.observed} / 6`;$('#lagoon-hud').textContent=`${state.released} / 7`;for(const key of ['shells','ball','lounger','tower','tidepool','opensea','boat']){const done=key==='shells'?state.shells===8:state[key],li=$(`[data-quest=${key}]`);li.classList.toggle('done',done);li.querySelector('i').textContent=done?'✓':'';li.setAttribute('aria-label',`${li.textContent}，${done?'已完成':'未完成'}`);}$('#game-clock').textContent=formatTime(elapsed);if(state.footprints)$('#footnote').textContent='✓ 留下腳印，讓浪花慢慢帶走';}
 function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
 function begin(){running=true;document.body.classList.add('game-playing');$('#start').hidden=true;$('#begin').textContent='繼續玩';welcome.querySelector('h1').textContent='海灘小任務';renderHud();}
 // `start` is exported by Explore so the same gesture enables sound and controls.
 $('#begin').onclick=()=>{e.start();begin();};
 function fade(){fadeAt=time();}
 function seated(){/* Poses are blended on the active skeleton in updateCharacter. */}
 function enter(next){e.setFirstPerson(false);returnPoint.copy(e.player);mode=next;modeAge=0;e.setDriven(true);e.clearInput();fade();if(next==='rest'){e.player.copy(anchors.umbrella.surface.point);e.avatar.rotation.set(0,anchors.umbrella.surface.yaw,0);toast('聽一會兒海浪。按 E 或「互動」起身。');}if(next==='tower'){climbStart.copy(anchors.lifeguard.climb);e.player.copy(climbStart);e.avatar.rotation.set(0,Math.PI,0);toast('從高處看看整座海灣。按 E 下塔。');}if(next==='tidepool'){camGoal.copy(pool.center).add(new T.Vector3(0,9,7));camLook.copy(pool.center);document.exitPointerLock?.();lagoon.open(e.group,'tidepool',{muted:e.muted,auto});}if(next==='boat'){vessel.visible=true;vessel.position.set(dock.x,0,dock.z);boatSpeed=0;boatYaw=0;seated(true);syncAnchors();$('.game-controls').innerHTML='W / S 划行　A / D 轉向　E 靠岸下船<br>抵達浮標按 E 往海裡看，放生後再返回';toast('W / S 划行，A / D 轉向。向金色浮標出發！');}}
 function leave(){if(mode==='tidepool'&&lagoon.isOpen){lagoon.close();return;}if(mode==='boat'){if(Math.hypot(vessel.position.x-dock.x,vessel.position.z-dock.z)>11){toast('先回到岸邊的金色圓環，才能下船。');return;}if(state.island){state.boat=true;toast('小島往返完成，歡迎回岸！');}vessel.visible=false;if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;}mode='walk';$('.game-controls').innerHTML='WASD 移動　滑鼠環顧　E 互動　Shift 跑步<br>1 / 2 / 3 素材　M 靜音　Esc 暫停';e.player.copy(returnPoint);e.avatar.rotation.set(0,Math.PI,0);seated(false);e.setDriven(false);e.setView(0);e.clearInput();lastPlayer.copy(e.player);fade();}
 function setNear(kind,label,position,item=null){interaction.kind=kind;interaction.label=label;interaction.position=position;interaction.item=item;return interaction;}
 function nearTarget(){if(lagoon.isOpen)return null;if(mode==='boat'&&Math.hypot(vessel.position.x-island.x,vessel.position.z-island.z)<11)return setNear('opensea','往海裡看：放生大型海洋生物',vessel.position);if(mode==='boat'&&Math.hypot(vessel.position.x-dock.x,vessel.position.z-dock.z)>11)return null;if(mode!=='walk')return setNear('leave',mode==='rest'?'起身，繼續散步':mode==='tower'?'走下救生塔':mode==='tidepool'?'回到沙灘':'靠岸下船',e.player);let best=2.4,result=null;for(const item of objects.items){if(item.collected)continue;const d=Math.hypot(item.x-e.player.x,item.z-e.player.z);if(d<best){best=d;result=item;}}
  if(result)return setNear('shell','撿起貝殼',result,result);
  if(e.player.distanceTo(objects.ball.position)<2.3)return setNear('ball','踢球，朝海邊！',objects.ball.position);
  if(e.player.distanceTo(pool.point)<2.6)return setNear('tidepool','蹲下看看潮池',pool.point);
  for(const a of anchorList){if(e.player.distanceTo(a.point)<2.4)return setNear(a.id,a.id==='boat'?'推船下水，划向小島':a.id==='umbrella'?'坐下，聽海':'爬上救生塔',a.point);}return null;
 }
 function interact(){if(!running||completed||!e.active||e.busy||lagoon.isOpen)return;near=nearTarget();if(!near){if(mode==='boat')toast('划回岸邊的金色圓環，就能下船。');return;}
  if(near.kind==='leave'){leave();return;}
  if(near.kind==='opensea'){e.clearInput();document.exitPointerLock?.();lagoon.open(e.group,'opensea',{muted:e.muted,auto});return;}
  if(near.kind==='shell'){const item=near.item;if(item.collected)return;item.collected=true;item.born=time();state.shells++;objects.burst(item.x,item.y+.25,item.z,time());character.trigger('interact');e.sfx('pickup');toast(state.shells===8?'8 枚貝殼收齊了。謝謝海灘的小禮物！':`找到第 ${state.shells} 枚貝殼`);}
  if(near.kind==='ball'){ball.kick(e.player);character.trigger('kick');e.sfx('kick');}
  if(near.kind==='umbrella')enter('rest');if(near.kind==='lifeguard')enter('tower');if(near.kind==='boat')enter('boat');if(near.kind==='tidepool')enter('tidepool');renderHud();
 }
 addEventListener('keydown',event=>{if(event.code==='KeyE'&&!event.repeat){event.preventDefault();interact();}});$('#interact').onclick=interact;$('#game-audio').onclick=()=>e.mute();
 function complete(){camera.position.fromArray(config.cameras.wide.pos);target.fromArray(config.cameras.wide.target);camera.lookAt(target);completed=true;running=false;e.setDriven(true);e.clearInput();document.exitPointerLock?.();$('#start').hidden=true;$('#complete').hidden=false;document.body.classList.add('game-complete');$('#finish-time').textContent=`這次的海邊時光　${formatTime(elapsed)}`;$('#finish-bonus').textContent=state.footprints?'還留下了一串會消失的腳印。':'下次來，試著在沙灘上留一串腳印。';$('#replay').focus();}
 function reset(){if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;vessel.visible=false;mode='walk';completed=false;running=false;elapsed=0;boatSpeed=0;footDistance=0;for(const key of Object.keys(state))state[key]=['shells','footprints','released','observed'].includes(key)?0:false;lagoon.reset();objects.reset();ball.reset();e.player.set(-7,groundHeight(-7,12),12);lastPlayer.copy(e.player);e.avatar.rotation.set(0,0,0);seated(false);e.setDriven(false);e.setView(.15);e.clearInput();$('#complete').hidden=true;document.body.classList.remove('game-complete');lastHud='';$('#footnote').textContent='額外的小紀念：在沙上留下腳印';e.start();begin();fade();}
 $('#replay').onclick=reset;
 document.addEventListener('pointerlockchange',()=>{if(completed||mode==='tidepool'||lagoon.isOpen)$('#start').hidden=true;});
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
  vessel.updateMatrixWorld(true);e.player.copy(boatSeat.point).applyMatrix4(vessel.matrixWorld);e.avatar.position.copy(e.player);e.avatar.rotation.set(vessel.rotation.x,boatYaw+Math.PI,vessel.rotation.z,'YXZ');
  oar.rotation.y=Math.sin(t*6)*Math.min(1,Math.abs(boatSpeed)/4)*.6;oar.rotation.z=Math.sin(t*6+.7)*.22;
  if(Math.abs(boatSpeed)>1&&(paddleClock-=dt)<=0){e.sfx('paddle');paddleClock=.8;}
  const dist=Math.hypot(vessel.position.x-island.x,vessel.position.z-island.z);if(!state.island&&dist<11){state.island=true;objects.burst(vessel.position.x,vessel.position.y+1,vessel.position.z,t);e.sfx('pickup');toast('抵達浮標！按 E 往海裡看，放生後再划回岸邊。');}
  camGoal.set(vessel.position.x+Math.sin(boatYaw)*9,vessel.position.y+4.8,vessel.position.z+Math.cos(boatYaw)*9);camLook.set(vessel.position.x-Math.sin(boatYaw)*7,1,vessel.position.z-Math.cos(boatYaw)*7);
 }
 function update(dt,t){
  if(lagoon.isOpen){document.body.classList.remove('game-paused');return;}
  if(e.group!==currentGroup&&!e.busy){currentGroup=e.group;if(mode==='rest')e.player.copy(anchors.umbrella.surface.point);else if(mode==='tower')e.player.copy(anchors.lifeguard.surface.point);}
  document.body.classList.toggle('game-paused',running&&!e.active&&!completed&&mode!=='tidepool');
  const active=running&&e.active&&!e.busy&&!completed,simDt=active?dt:0;
  if(active)elapsed+=dt;
  const moved=Math.hypot(e.player.x-lastPlayer.x,e.player.z-lastPlayer.z);
  if(active&&mode==='walk'){footDistance+=moved<1?moved:0;if(footDistance>.55&&groundHeight(e.player.x,e.player.z)>.015){objects.footprint(e.player.x,e.player.z,e.avatar.rotation.y,t);state.footprints++;footDistance=0;}}
  if(running&&!completed)ball.update(simDt,t,e.player,moved>.001&&mode==='walk');
  if(mode!=='walk'){
   modeAge+=simDt;
   if(mode==='boat')boatUpdate(simDt,t);
   else if(mode==='tidepool'){/* 潮池觀察在 iframe 裡進行 */}
   else{if(mode==='tower'){const progress=T.MathUtils.smoothstep(modeAge,0,1.1);e.player.lerpVectors(climbStart,anchors.lifeguard.surface.point,progress);}e.avatar.position.copy(e.player);if(mode==='rest'){const p=e.player;camGoal.set(p.x-3.3,p.y+2.6,p.z+4);camLook.set(p.x,p.y+.4,p.z);if(modeAge>1.2&&!state.lounger){state.lounger=true;e.sfx('pickup');}}else{camGoal.set(e.player.x-4,e.player.y+2.8,e.player.z+6);camLook.set(e.player.x,e.player.y+.8,e.player.z);if(modeAge>1.2&&!state.tower){state.tower=true;e.sfx('pickup');}}}

   camera.position.lerp(camGoal,1-Math.exp(-3*dt));target.lerp(camLook,1-Math.exp(-3*dt));camera.lookAt(target);
  }else{camera.getWorldDirection(target);target.multiplyScalar(10).add(camera.position);}
  updateCharacter(simDt);if(e.first&&mode==='walk'){camera.getWorldDirection(screen);camera.position.copy(character.head());camera.lookAt(screen.add(camera.position));}if(!completed&&!e.first)followCamera.enforce(character.head());
  lastPlayer.copy(e.player);objects.update(t);
  destination.visible=mode==='boat';buoy.visible=mode==='boat';const dest=state.island&&state.opensea?dock:island;destination.position.set(dest.x,.6,dest.z);sampleWater(dest.x,dest.z,t,wave);destination.position.y=wave.height+.14;buoy.position.set(dest.x,wave.height+1.4,dest.z);
  near=active?nearTarget():null;const prompt=$('#target-prompt'),button=$('#interact');button.disabled=!near;button.firstChild.textContent=mode==='boat'?(near?.kind==='opensea'?'往海裡看 ':near?'下船 ':'划行中 '):mode==='tower'?'下塔 ':mode==='rest'?'起身 ':'互動 ';objects.halo.visible=!!near&&mode==='walk';prompt.hidden=!near;
  if(near){const p=near.position;screen.set(p.x,p.y??p.height??groundHeight(p.x,p.z),p.z);if(near.kind==='shell')screen.y=near.item.y;if(near.kind==='shell'&&screen.y<.04){sampleWater(screen.x,screen.z,t,wave);screen.y=Math.max(screen.y,wave.height);}objects.halo.position.set(screen.x,screen.y+.025,screen.z);screen.y+=1.2;screen.project(camera);const onScreen=screen.z<1&&screen.z>-1&&Math.abs(screen.x)<.95&&Math.abs(screen.y)<.95;prompt.hidden=!onScreen;prompt.style.left=`${(screen.x*.5+.5)*innerWidth}px`;prompt.style.top=`${(-screen.y*.5+.5)*innerHeight}px`;prompt.querySelector('span').textContent=near.label;}
  let goal=null,label='';if(mode==='boat'){goal=dest;label=state.island&&state.opensea?'岸邊圓環 · E 下船':'外海浮標 · E 放生';}else if(state.shells<8){let d=Infinity;for(const item of objects.items){const n=Math.hypot(item.x-e.player.x,item.z-e.player.z);if(!item.collected&&n<d){d=n;goal=item;}}label='下一枚貝殼';}else if(!state.ball){goal=objects.ball.position;label='沙灘球';}else if(!state.lounger){goal=anchors.umbrella.point;label='躺椅';}else if(!state.tower){goal=anchors.lifeguard.point;label='救生塔';}else if(!state.tidepool){goal=pool.point;label='潮池';}else if((!state.opensea||!state.boat)){goal=anchors.boat.point;label='岸上的小船';}
  if(goal){const dx=goal.x-e.player.x,dz=goal.z-e.player.z;$('#nav-text').textContent=`${label}　${Math.round(Math.hypot(dx,dz))} m`;e.input(input);$('#nav-arrow').style.transform=`rotate(${Math.atan2(dx,-dz)+(mode==='boat'?boatYaw:input.yaw)}rad)`;}$('#navigation').hidden=!goal||!active||mode==='rest'||mode==='tower'||mode==='tidepool';
  $('#game-audio').textContent=e.muted?'聲音 關':'聲音 開';$('#game-audio').setAttribute('aria-pressed',String(e.muted));$('#game-toast').classList.toggle('visible',active&&t<toastUntil);$('#game-fade').style.opacity=String(Math.max(0,1-(t-fadeAt)/.65)*.65);renderHud();
  if(active&&mode==='walk'&&state.shells===8&&state.ball&&state.lounger&&state.tower&&state.tidepool&&state.opensea&&state.boat)complete();
 }
 // Test actions use the real input/interaction/physics path; no quest-state setter.
 function contact(){
  const id=mode==='rest'?'umbrella':mode==='tower'?'lifeguard':mode==='boat'?'boat':null;if(!id)return null;
  const source=mode==='boat'?boatModel:propRoot.children.find(c=>c.name===id),surface=anchors[id].surface;
  const box=source?.children.length||source?.isMesh?new T.Box3().setFromObject(source):null;
  const hits=box?surfacesAt(source,e.player.x,e.player.z,box):[];
  const nearest=hits.sort((a,b)=>Math.abs(a.point.y-e.player.y)-Math.abs(b.point.y-e.player.y))[0];
  const contactY=surface.kind==='sand'&&mode!=='boat'?groundHeight(e.player.x,e.player.z):nearest?.point.y;
  return {id,mode,real:mode==='boat'?!!nearest:surface.real,kind:surface.kind,player:e.player.toArray(),contactY,gap:contactY==null?null:e.player.y-contactY,inside:!box||(e.player.x>=box.min.x&&e.player.x<=box.max.x&&e.player.z>=box.min.z&&e.player.z<=box.max.z),feet:character.rig.foot.map(b=>b?.getWorldPosition(new T.Vector3()).toArray()),head:character.head().toArray(),box};
 }
 const api={update,interact,reset,contact,get character(){return character.info();},get cameraAudit(){return {minimum:MIN_BOOM,distance:followCamera.distance,minObserved:followCamera.minObserved};},surfaces(){return Object.fromEntries(anchorList.map(a=>[a.id,{kind:a.surface.kind,real:a.surface.real,point:a.surface.point.toArray(),box:a.surface.box?.clone(),player:e.player.toArray()}]));},get state(){return {...state};},lagoon,overlay:lagoon,tidepool:{get found(){return lagoon.observed;}},opensea:{get released(){return lagoon.released;}},get suspended(){return lagoon.isOpen;},get mode(){return mode;},get completed(){return completed;},get elapsed(){return elapsed;}};
 if(auto){Object.assign(api,{teleport(x,z){if(mode!=='walk')throw Error('Teleport is only available on foot');e.player.set(x,groundHeight(x,z),z);lastPlayer.copy(e.player);},targets(){return {shells:objects.items.map(s=>({x:s.x,y:s.y,z:s.z,collected:s.collected})),ball:objects.ball.position.toArray(),umbrella:anchors.umbrella.point.toArray(),tidepool:pool.point.toArray(),lagoon:pool.point.toArray(),lifeguard:anchors.lifeguard.point.toArray(),boat:anchors.boat.point.toArray(),dock,island};},step(seconds){let remaining=seconds;while(remaining>1e-6){const dt=Math.min(1/60,remaining);window.__TIME__=time()+dt;water.material.uniforms.time.value=window.__TIME__;e.update(dt);update(dt,window.__TIME__);remaining-=dt;}},steer(angle){if(mode!=='boat')throw Error('Not in boat');boatYaw=angle;},view(yaw){e.setView(yaw);},wave(x,z,t){return {...sampleWater(x,z,t,{})};}});Object.defineProperty(api,'vessel',{get(){return {x:vessel.position.x,y:vessel.position.y,z:vessel.position.z,yaw:boatYaw,speed:boatSpeed};}});window.__GAME__=api;}
 update(0,time());return api;
}
