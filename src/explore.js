import * as T from 'three';
import { groundHeight, shore } from './terrain.js';
import { surfaceHeight, swashReach, WADE_RINGS } from './water.js';
import { landHeight, islandHeight, shoreClear } from './coast.js';
import { loadProps, propRoot } from './props.js';
import './explore.css';
import { creditsButton } from './credits.js';

export function createExplore({ scene, camera, renderer, config, results, group, auto, comparison=false, gameMode=false }) {
  const labels = { A: 'A｜codex 程序化', B: 'B｜Tripo', C: 'C｜免費素材庫' };
  const ui = document.createElement('div'); ui.id = 'explore';
  ui.innerHTML = `<div class="hud panel"><small>BEACH FIELD NOTES / EXPLORE</small><strong id="group-label"></strong><span id="stats"></span><nav aria-label="Prop group">${['A','B','C'].map(g=>`<button data-group="${g}">${g}</button>`).join('')}</nav></div><div class="help panel">WASD 移動 · ←→ 轉向 · 拖曳或滑鼠環顧 · Shift 跑步 · Space 跳躍<br>V 視角 · P 拍照 · M 靜音 · Esc 暫停 <button id="mute">聲音 開</button><button id="view">切換視角</button><button id="photo">拍照</button></div><div id="poi" class="panel" hidden></div><div id="start"><div class="welcome"><small>WALK • COMPARE • DISCOVER</small><h1>Beach 3D — AI 場景驗證</h1><p>沿著海岸散步，近看三種 AI 場景素材。</p><p>WASD 移動，←→ 轉向，滑鼠環顧（或按住拖曳），Shift 跑步，Space 跳躍。<br>1 / 2 / 3 切換素材，V 切換視角，P 拍照，M 靜音。<br>觸控：左側搖桿移動，右側拖曳環顧。</p><button id="begin">點擊開始</button></div></div><div id="stick"><i></i></div><div id="look"></div><button id="jump" class="touch">跳躍</button><button id="exit-photo" hidden>結束拍照 P</button>`;
  document.body.append(ui);
  const $ = s=>ui.querySelector(s), start=$('#start'), poi=$('#poi');
  // C credits: by the group label, and on the start/pause panel (while playing, pointer lock leaves no cursor to hover with).
  const credits=creditsButton();credits.dataset.groupC='';$('#group-label').after(credits);
  const startCredits=creditsButton();startCredits.dataset.groupC='';$('#start .welcome').append(startCredits);
  const keys = new Set(), player = new T.Vector3(-7, groundHeight(-7,12),12);
  const avatar = new T.Group();scene.add(avatar);
  const skin=new T.MeshStandardMaterial({color:0xdba879}), shirt=new T.MeshStandardMaterial({color:0xdc6b42}), pants=new T.MeshStandardMaterial({color:0x284858});
  const capsule=new T.CapsuleGeometry(.16,.35,4,8), sphere=new T.SphereGeometry(.22,12,8);
  function part(mat,x,y,z,sx,sy,sz){const m=new T.Mesh(capsule,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;avatar.add(m);return m;}
  part(shirt,0,1.05,0,1.65,1.1,1);const head=new T.Mesh(sphere,skin);head.position.y=1.65;avatar.add(head);
  head.castShadow=true;
  const shoes=[part(pants,-.15,.07,.045,.9,.25,1.35),part(pants,.15,.07,.045,.9,.25,1.35)];
  const arms=[part(skin,-.34,1.03,0,.65,1,.65),part(skin,.34,1.03,0,.65,1,.65)];
  const legs=[part(pants,-.15,.38,0,.85,1.1,.85),part(pants,.15,.38,0,.85,1.1,.85)];
  // Ripples round the legs in the water: the water shader spreads short waves from these points (x, z, time,
  // strength), the feet in turn while walking, now and then while standing.
  const wade=Array.from({length:WADE_RINGS},()=>new T.Vector4());let wadeNext=0,wadeFoot=0,waterMesh=null;
  let driven=false,gameCamera=null,groupChanged=null,movementSpeed=0,moveSpeed=0,moveAccel=0;const moveDir={x:0,z:0};
  let hold=false,active=false,photo=false,first=false,muted=false,yaw=.15,pitch=.08,velocityY=0,grounded=true,phase=0,splashTime=0,ringIndex=0,busy=false,desired=group;
  let colliders=[],currentResults=results, audio, gain;
  // Player blocking uses the props' real geometry within body height (0.12–1.85 m above the sand), rasterised into
  // 0.2 m cells, so a palm's crown or an umbrella canopy no longer walls off the space under it. Ball, boat and
  // camera keep the whole-prop boxes in `colliders`.
  const CELL=.2,RADIUS=.26,blockCache=new WeakMap(),blocked=new Map(),key=(i,j)=>i*65536+j;
  const va=new T.Vector3(),vb=new T.Vector3(),vc=new T.Vector3(),vp=new T.Vector3(),instanceMatrix=new T.Matrix4(),world=new T.Matrix4();
  // keep(matrix): which instances of an InstancedMesh to include (all by default).
  function rasterise(marker,keep=null){const cells=new Map();marker.updateMatrixWorld(true);
    marker.traverse(o=>{if(!o.isMesh||!o.visible)return;const pos=o.geometry.attributes.position,index=o.geometry.index,count=index?index.count:pos.count;
      for(let n=0;n<(o.isInstancedMesh?o.count:1);n++){world.copy(o.matrixWorld);if(o.isInstancedMesh){o.getMatrixAt(n,instanceMatrix);if(keep&&!keep(instanceMatrix))continue;world.multiply(instanceMatrix);}
        for(let t=0;t<count;t+=3){const ia=index?index.getX(t):t,ib=index?index.getX(t+1):t+1,ic=index?index.getX(t+2):t+2;
          va.fromBufferAttribute(pos,ia).applyMatrix4(world);vb.fromBufferAttribute(pos,ib).applyMatrix4(world);vc.fromBufferAttribute(pos,ic).applyMatrix4(world);
          if(Math.max(va.y,vb.y,vc.y)<-.5||Math.min(va.y,vb.y,vc.y)>4)continue;
          const steps=Math.max(1,Math.ceil(Math.max(va.distanceTo(vb),vb.distanceTo(vc),vc.distanceTo(va))/(CELL/2)));
          for(let u=0;u<=steps;u++)for(let v=0;v<=steps-u;v++){vp.copy(va).multiplyScalar(1-(u+v)/steps).addScaledVector(vb,u/steps).addScaledVector(vc,v/steps);
            const h=vp.y-groundHeight(vp.x,vp.z);if(h<.12||h>1.85)continue;const k=key(Math.floor(vp.x/CELL),Math.floor(vp.z/CELL));cells.set(k,Math.max(cells.get(k)??-Infinity,vp.y));}}}});
    return cells;}
  // The headland's plants, rocks and trunks block the same way, by their real shapes: only instances a walker on the
  // beach can reach (inside the walk area, rooted at most 1.5 m above the sand), rasterised once.
  let shoreCells=null;
  function shoreBlocked(){if(shoreCells)return shoreCells;const plants=scene.getObjectByName('island-vegetation');
    shoreCells=plants?rasterise(plants,m=>{const x=m.elements[12],z=m.elements[14];return x>33&&x<102&&z<29&&islandHeight(x,z)<groundHeight(x,z)+1.5;}):new Map();return shoreCells;}
  function rebuildBlocked(){blocked.clear();for(const [k,top] of shoreBlocked())blocked.set(k,top);for(const marker of propRoot.children){if(!blockCache.has(marker))blockCache.set(marker,rasterise(marker));for(const [k,top] of blockCache.get(marker))blocked.set(k,Math.max(blocked.get(k)??-Infinity,top));}}
  // Distance from (x,z) to the nearest blocking cell the player is not standing above.
  function clearance(x,z){let best=Infinity;const r=Math.ceil(RADIUS/CELL)+1,ci=Math.floor(x/CELL),cj=Math.floor(z/CELL);
    for(let i=ci-r;i<=ci+r;i++)for(let j=cj-r;j<=cj+r;j++){const top=blocked.get(key(i,j));if(top===undefined||player.y>top+.05)continue;
      const dx=Math.max(i*CELL-x,0,x-(i+1)*CELL),dz=Math.max(j*CELL-z,0,z-(j+1)*CELL);best=Math.min(best,Math.hypot(dx,dz));}
    return best;}
  const target=new T.Vector3(),desiredCamera=new T.Vector3(),probe=new T.Vector3();
  let joyX=0,joyY=0,lastPoi=null,lastPoiGroup=null;
  function refresh(){
    colliders=[];let triangles=0;
    propRoot.updateMatrixWorld(true);
    rebuildBlocked();
    for(const marker of propRoot.children){const box=new T.Box3().setFromObject(marker);if(!box.isEmpty())colliders.push({box,id:marker.name,slot:marker.userData.slot});marker.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});}
    $('#group-label').textContent=labels[group];for(const b of ui.querySelectorAll('[data-group-c]'))b.hidden=group!=='C';const missing=currentResults.filter(r=>!['loaded','procedural'].includes(r.status)).length;
    $('#stats').textContent=`${triangles.toLocaleString()} triangles${missing ? ` · ${missing} 個素材尚未提供` : ''}`;
    ui.querySelectorAll('[data-group]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.group===group));});
  }
  if(comparison){
    ui.classList.add('comparison');
    $('.welcome h1').textContent='同一視角，並排探索';
    $('.welcome p').textContent='每個畫面同步移動，只比較道具來源的差異。';
    $('.welcome p + p').innerHTML='WASD 移動，←→ 轉向，滑鼠環顧（或按住拖曳），Shift 跑步，Space 跳躍。<br>V 切換視角，P 拍照，M 靜音；Esc 暫停後可切換比較組別。<br>觸控：左側搖桿移動，右側拖曳環顧。';
  }
  refresh();
  // Serialize the existing singleton loader. Cache detached groups so revisits allocate nothing.
  const cache=new Map();
  async function switchGroup(next){if(comparison)return;desired=next;if(busy||next===group)return;busy=true;$('#stats').textContent='載入素材中…';
    try{while(desired!==group){const requested=desired;cache.set(group,{children:[...propRoot.children],results:currentResults});propRoot.clear();
      if(cache.has(requested)){const saved=cache.get(requested);propRoot.add(...saved.children);currentResults=saved.results;}
      else {const loaded=await loadProps(requested);currentResults=loaded.results;}
      group=requested;refresh();await groupChanged?.(group);
    }}catch(e){$('#stats').textContent=`載入失敗：${e.message}`;}finally{busy=false;}
  }
  function sound(){if(!audio){audio=new AudioContext();gain=audio.createGain();gain.gain.value=muted?0:.13;gain.connect(audio.destination);const buffer=audio.createBuffer(1,audio.sampleRate*8,audio.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown;}const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;noise.connect(filter);filter.connect(gain);noise.start();const lfo=audio.createOscillator(),depth=audio.createGain();lfo.frequency.value=.12;depth.gain.value=.035;lfo.connect(depth);depth.connect(gain.gain);lfo.start();}if(gameMode&&muted)audio.suspend();else audio.resume();}
  function mute(){muted=!muted;if(gain)gain.gain.setTargetAtTime(muted?0:.13,audio.currentTime,.1);if(audio){if(muted)audio.suspend();else audio.resume();}$('#mute').textContent=muted?'聲音 關':'聲音 開';}
  function photoToggle(){photo=!photo;ui.classList.toggle('photo',photo);$('#exit-photo').hidden=!photo;keys.clear();joyX=joyY=0;}
  function jump(){if(active&&!driven&&!photo&&grounded){velocityY=3.6;grounded=false;}}
  // Mouse look needs pointer lock; where it is refused (some Linux / remote desktops) keep playing with drag-to-look.
  function requestLock(){if(auto||matchMedia('(pointer: coarse)').matches)return;const warn=err=>console.warn('Pointer lock unavailable; drag to look instead:',err?.message??err);try{renderer.domElement.requestPointerLock()?.catch?.(warn);}catch(err){warn(err);}}
  function startExperience(){active=true;start.hidden=true;ui.classList.add('started');sound();requestLock();}
  $('#begin').onclick=startExperience;
  $('#mute').onclick=mute;$('#view').onclick=()=>first=!first;$('#photo').onclick=photoToggle;$('#exit-photo').onclick=photoToggle;$('#jump').onpointerdown=jump;
  ui.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>switchGroup(b.dataset.group));
  addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(!gameMode&&e.code==='KeyP')photoToggle();if(e.code==='KeyV'&&(!gameMode||!driven))first=!first;if(e.code==='KeyM')mute();if(e.code==='Space')jump();if(!photo&&/^Digit[123]$/.test(e.code))switchGroup('ABC'[Number(e.code.at(-1))-1]);});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();joyX=joyY=0;});
  document.addEventListener('pointerlockchange',()=>{if(!auto&&!document.pointerLockElement){active=false;keys.clear();if(!photo)start.hidden=false;}});
  function look(dx,dy){if(!active||photo)return;yaw-=dx*.0025;pitch=T.MathUtils.clamp(pitch+dy*.0025,-.55,.85);}
  addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement)look(e.movementX,e.movementY);else if(e.buttons&&e.target===renderer.domElement)look(e.movementX,e.movementY);});
  renderer.domElement.addEventListener('click',()=>{if(active&&!photo&&!document.pointerLockElement)requestLock();});
  function drag(el,move,stop){let id=null,x=0,y=0;el.onpointerdown=e=>{id=e.pointerId;x=e.clientX;y=e.clientY;el.setPointerCapture(id);};el.onpointermove=e=>{if(e.pointerId===id)move(e.clientX-x,e.clientY-y,e);};el.onpointerup=el.onpointercancel=()=>{id=null;stop?.();};}
  drag($('#stick'),(x,y)=>{joyX=T.MathUtils.clamp(x/45,-1,1);joyY=T.MathUtils.clamp(y/45,-1,1);$('#stick i').style.transform=`translate(${joyX*30}px,${joyY*30}px)`;},()=>{joyX=joyY=0;$('#stick i').style.transform='';});
  let lastX=0,lastY=0;drag($('#look'),(x,y)=>{look(x-lastX,y-lastY);lastX=x;lastY=y;},()=>{lastX=lastY=0;});
  // Free space, or a move that gets out of a prop the player is already inside (e.g. after a teleport).
  function allowed(x,z){if(x< -34||x>100||z>27||groundHeight(x,z)<-.65||x>35&&!shoreClear(x,z))return false;const next=clearance(x,z);return next>=RADIUS||next>clearance(player.x,player.z);}
  function cameraBlocked(p){for(const c of colliders){const b=c.box;if(p.x>b.min.x-.2&&p.x<b.max.x+.2&&p.y>b.min.y-.2&&p.y<b.max.y+.2&&p.z>b.min.z-.2&&p.z<b.max.z+.2)return true;}return false;}
  function update(dt){dt=Math.min(dt,.05);let dx=0,dz=0;
    if(active&&!photo&&!busy&&!driven){const forward=hold?0:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-joyY,side=hold?0:Number(keys.has('KeyD'))-Number(keys.has('KeyA'))+joyX;yaw+=(Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowRight')))*2.2*dt;const amount=Math.hypot(forward,side),norm=Math.max(1,amount),wet=groundHeight(player.x,player.z)<.02,target=amount>.01?(keys.has('ShiftLeft')||keys.has('ShiftRight')?4.5:1.8)*(wet?.42:1)*Math.min(1,amount):0;
      // Speed changes at a body's pace, not in one frame: about 0.3 s to start walking, 0.8 s from a walk up to a run
      // or back down (a few shortening strides), 0.3 s to stop from a walk and about a second from a run. The
      // direction follows the input at once; with no input the last one carries the body to a stop.
      if(amount>.01){moveDir.x=(side*Math.cos(yaw)-forward*Math.sin(yaw))/norm/Math.min(1,amount);moveDir.z=(-forward*Math.cos(yaw)-side*Math.sin(yaw))/norm/Math.min(1,amount);}
      const rate=target>moveSpeed?(moveSpeed<1.6?6:3.4):target>.5?3.4:moveSpeed>2.4?4.8:6,before=moveSpeed;
      moveSpeed=target>moveSpeed?Math.min(target,moveSpeed+rate*dt):Math.max(target,moveSpeed-rate*dt);
      moveAccel=dt>0?(moveSpeed-before)/dt:0;
      const speed=moveSpeed;dx=moveDir.x*speed*dt;dz=moveDir.z*speed*dt;
      if(allowed(player.x+dx,player.z))player.x+=dx;else dx=0;if(allowed(player.x,player.z+dz))player.z+=dz;else dz=0;
      // Blocked by a prop: the body stops there instead of keeping its pace against it.
      if(dt>0)moveSpeed=Math.min(moveSpeed,Math.hypot(dx,dz)/dt+.05);
      // Walking downhill the ground drops faster than gravity pulls; stay snapped unless a jump launched us.
      const ground=groundHeight(player.x,player.z);if(grounded&&player.y-ground<.3){player.y=ground;velocityY=0;}else{velocityY-=9.8*dt;player.y=Math.max(ground,player.y+velocityY*dt);if(player.y===ground){velocityY=0;grounded=true;}else grounded=false;}
      const moving=Math.hypot(dx,dz);phase+=moving*5;if(moving>.001){avatar.rotation.y=Math.atan2(dx,dz);}
      const swing=moving>.001?Math.sin(phase)*.55:0;const blend=1-Math.exp(-18*dt);arms[0].rotation.x=legs[1].rotation.x=T.MathUtils.lerp(arms[0].rotation.x,swing,blend);arms[1].rotation.x=legs[0].rotation.x=-arms[0].rotation.x;
    }
    movementSpeed=dt>0?Math.hypot(dx,dz)/dt:movementSpeed;
    if(!driven)avatar.position.copy(player);avatar.position.y+=Math.hypot(dx,dz)>.001?Math.abs(Math.sin(phase))*.045:0;avatar.visible=gameMode||!first;
    if(!photo&&!driven){target.copy(player);target.y+=1.45;desiredCamera.copy(target);if(first){desiredCamera.x-=Math.sin(yaw)*.05;desiredCamera.z-=Math.cos(yaw)*.05;camera.position.copy(desiredCamera);target.x-=Math.sin(yaw)*10;target.z-=Math.cos(yaw)*10;target.y-=Math.sin(pitch)*10;}else{desiredCamera.x+=Math.sin(yaw)*6.2*Math.cos(pitch);desiredCamera.z+=Math.cos(yaw)*6.2*Math.cos(pitch);desiredCamera.y+=.45+Math.sin(pitch)*6.2;
      for(let i=1;!gameCamera&&i<=24;i++){probe.lerpVectors(target,desiredCamera,i/24);if(probe.y<landHeight(probe.x,probe.z)+.35||cameraBlocked(probe)){desiredCamera.lerpVectors(target,desiredCamera,(i-1)/24);break;}}
      if(!gameCamera)camera.position.lerp(desiredCamera,1-Math.exp(-10*dt));}
      camera.position.y=Math.max(camera.position.y,landHeight(camera.position.x,camera.position.z)+.3);camera.lookAt(target);if(gameCamera&&!first)gameCamera.update(dt,player,yaw,pitch);
      let nearest=null,best=4;for(const c of colliders){const d=Math.hypot(Math.max(c.box.min.x-player.x,0,player.x-c.box.max.x),Math.max(c.box.min.z-player.z,0,player.z-c.box.max.z));if(d<best){best=d;nearest=c;}}
      if(nearest!==lastPoi||group!==lastPoiGroup){lastPoi=nearest;lastPoiGroup=group;poi.textContent=nearest?`${nearest.id} · ${labels[group]}${group==='A'?' · code-generated':` · ${nearest.slot.paths[group].split('/').at(-1)}`}`:'';poi.hidden=!nearest;}
      waterMesh??=scene.getObjectByName('lagoon-water');
      if(waterMesh?.material.uniforms.wadeRings){const t=waterMesh.material.uniforms.time.value,deep=player.z-shore(player.x)<swashReach(player.x,t)?surfaceHeight(player.x,player.z,t)-groundHeight(player.x,player.z):0;
        if(deep>.03&&dt>0&&(splashTime-=dt)<=0){const pace=Math.hypot(moveDir.x,moveDir.z)*movementSpeed,side=wadeFoot++%2?.11:-.11,c=Math.cos(avatar.rotation.y),sn=Math.sin(avatar.rotation.y);
          wade[wadeNext++%wade.length].set(player.x+c*side,player.z-sn*side,t,Math.min(1,deep*5)*(pace>.2?.55+.2*Math.min(pace,2.5):.3));splashTime=pace>.2?.3:1.1;}
        for(const r of wade)if(t-r.z>2.4||r.z>t+1e-6)r.w=0;waterMesh.material.uniforms.wadeRings.value.forEach((u,i)=>u.copy(wade[i]));}
    }
  }
  camera.position.set(player.x+1,player.y+3,player.z+5);update(0);
  // Optional game adapter: default Explore and comparison behavior stays unchanged.
  function input(out){out.forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-joyY;out.side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+joyX;out.yaw=yaw;return out;}
  function sfx(kind){if(!audio||muted)return;const osc=audio.createOscillator(),env=audio.createGain(),t=audio.currentTime;const f=kind==='pickup'?880:kind==='kick'?110:kind==='paddle'?230:350;osc.type=kind==='kick'?'sine':'triangle';osc.frequency.setValueAtTime(f,t);osc.frequency.exponentialRampToValueAtTime(kind==='pickup'?1760:55,t+.22);env.gain.setValueAtTime(.001,t);env.gain.linearRampToValueAtTime(kind==='pickup'?.6:.8,t+.015);env.gain.exponentialRampToValueAtTime(.001,t+.28);osc.connect(env);env.connect(gain);osc.start(t);osc.stop(t+.3);osc.onended=()=>{osc.disconnect();env.disconnect();};}
  const api={setFirstPerson(value){first=value;},setCameraController(controller){gameCamera=controller;},onGroupChange(fn){groupChanged=fn;},get speed(){return movementSpeed;},get accel(){return moveAccel;},get airborne(){return !grounded;},start:startExperience,input,sfx,mute,avatar,arms,legs,shoes,setDriven(value){driven=value;velocityY=0;grounded=true;moveSpeed=moveAccel=0;},setHold(value){hold=value;if(value)moveSpeed=moveAccel=0;},setView(angle,elevation=.08){yaw=angle;pitch=elevation;},clearInput(){keys.clear();joyX=joyY=0;moveSpeed=moveAccel=0;},get muted(){return muted;},refresh,update,switchGroup,player,get group(){return group;},get busy(){return busy;},get photo(){return photo;},get first(){return first;},get active(){return active;},get colliders(){return colliders;},clearance};
  if(auto)window.__EXPLORE__=api;
  return api;
}
