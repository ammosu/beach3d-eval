import * as T from 'three';
import { groundHeight } from './terrain.js';
import { loadProps, propRoot } from './props.js';
import './explore.css';

export function createExplore({ scene, camera, renderer, config, results, group, auto, comparison=false, gameMode=false }) {
  const labels = { A: 'A｜codex 程序化', B: 'B｜Tripo', C: 'C｜免費素材庫' };
  const ui = document.createElement('div'); ui.id = 'explore';
  ui.innerHTML = `<div class="hud panel"><small>BEACH FIELD NOTES / EXPLORE</small><strong id="group-label"></strong><span id="stats"></span><nav aria-label="Prop group">${['A','B','C'].map(g=>`<button data-group="${g}">${g}</button>`).join('')}</nav></div><div class="help panel">WASD / 方向鍵 移動 · Shift 跑步 · Space 跳躍<br>V 視角 · P 拍照 · M 靜音 · Esc 暫停 <button id="mute">聲音 開</button><button id="view">切換視角</button><button id="photo">拍照</button></div><div id="poi" class="panel" hidden></div><div id="start"><div class="welcome"><small>WALK • COMPARE • DISCOVER</small><h1>Beach 3D — AI 場景驗證</h1><p>沿著海岸散步，近看三種 AI 場景素材。</p><p>WASD / 方向鍵移動，滑鼠環顧，Shift 跑步，Space 跳躍。<br>1 / 2 / 3 切換素材，V 切換視角，P 拍照，M 靜音。<br>觸控：左側搖桿移動，右側拖曳環顧。</p><button id="begin">點擊開始</button></div></div><div id="stick"><i></i></div><div id="look"></div><button id="jump" class="touch">跳躍</button><button id="exit-photo" hidden>結束拍照 P</button>`;
  document.body.append(ui);
  const $ = s=>ui.querySelector(s), start=$('#start'), poi=$('#poi');
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
  const rings=[], ringGeo=new T.RingGeometry(.25,.29,24);for(let i=0;i<10;i++){const m=new T.Mesh(ringGeo,new T.MeshBasicMaterial({color:0xe5ffff,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);rings.push({mesh:m,age:2});}
  let driven=false;
  let active=false,photo=false,first=false,muted=false,yaw=.15,pitch=.08,velocityY=0,phase=0,splashTime=0,ringIndex=0,busy=false,desired=group;
  let colliders=[],currentResults=results, audio, gain;
  const target=new T.Vector3(),desiredCamera=new T.Vector3(),probe=new T.Vector3();
  let joyX=0,joyY=0,lastPoi=null,lastPoiGroup=null;
  function refresh(){
    colliders=[];let triangles=0;
    propRoot.updateMatrixWorld(true);
    for(const marker of propRoot.children){const box=new T.Box3().setFromObject(marker);if(!box.isEmpty())colliders.push({box,id:marker.name,slot:marker.userData.slot});marker.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});}
    $('#group-label').textContent=labels[group];const missing=currentResults.filter(r=>!['loaded','procedural'].includes(r.status)).length;
    $('#stats').textContent=`${triangles.toLocaleString()} triangles${missing ? ` · ${missing} 個素材尚未提供` : ''}`;
    ui.querySelectorAll('[data-group]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.group===group));});
  }
  if(comparison){
    ui.classList.add('comparison');
    $('.welcome h1').textContent='同一視角，並排探索';
    $('.welcome p').textContent='每個畫面同步移動，只比較道具來源的差異。';
    $('.welcome p + p').innerHTML='WASD / 方向鍵移動，滑鼠環顧，Shift 跑步，Space 跳躍。<br>V 切換視角，P 拍照，M 靜音；Esc 暫停後可切換比較組別。<br>觸控：左側搖桿移動，右側拖曳環顧。';
  }
  refresh();
  // Serialize the existing singleton loader. Cache detached groups so revisits allocate nothing.
  const cache=new Map();
  async function switchGroup(next){if(comparison)return;desired=next;if(busy||next===group)return;busy=true;$('#stats').textContent='載入素材中…';
    try{while(desired!==group){const requested=desired;cache.set(group,{children:[...propRoot.children],results:currentResults});propRoot.clear();
      if(cache.has(requested)){const saved=cache.get(requested);propRoot.add(...saved.children);currentResults=saved.results;}
      else {const loaded=await loadProps(requested);currentResults=loaded.results;}
      group=requested;refresh();
    }}catch(e){$('#stats').textContent=`載入失敗：${e.message}`;}finally{busy=false;}
  }
  function sound(){if(!audio){audio=new AudioContext();gain=audio.createGain();gain.gain.value=muted?0:.13;gain.connect(audio.destination);const buffer=audio.createBuffer(1,audio.sampleRate*8,audio.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown;}const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;noise.connect(filter);filter.connect(gain);noise.start();const lfo=audio.createOscillator(),depth=audio.createGain();lfo.frequency.value=.12;depth.gain.value=.035;lfo.connect(depth);depth.connect(gain.gain);lfo.start();}if(gameMode&&muted)audio.suspend();else audio.resume();}
  function mute(){muted=!muted;if(gain)gain.gain.setTargetAtTime(muted?0:.13,audio.currentTime,.1);if(audio){if(muted)audio.suspend();else audio.resume();}$('#mute').textContent=muted?'聲音 關':'聲音 開';}
  function photoToggle(){photo=!photo;ui.classList.toggle('photo',photo);$('#exit-photo').hidden=!photo;keys.clear();joyX=joyY=0;}
  function jump(){if(active&&!driven&&!photo&&player.y<=groundHeight(player.x,player.z)+.01)velocityY=3.6;}
  function startExperience(){active=true;start.hidden=true;ui.classList.add('started');sound();if(!auto&&!matchMedia('(pointer: coarse)').matches)renderer.domElement.requestPointerLock()?.catch(()=>{start.hidden=false;active=false;});}
  $('#begin').onclick=startExperience;
  $('#mute').onclick=mute;$('#view').onclick=()=>first=!first;$('#photo').onclick=photoToggle;$('#exit-photo').onclick=photoToggle;$('#jump').onpointerdown=jump;
  ui.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>switchGroup(b.dataset.group));
  addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(!gameMode&&e.code==='KeyP')photoToggle();if(!gameMode&&e.code==='KeyV')first=!first;if(e.code==='KeyM')mute();if(e.code==='Space')jump();if(!photo&&/^Digit[123]$/.test(e.code))switchGroup('ABC'[Number(e.code.at(-1))-1]);});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();joyX=joyY=0;});
  document.addEventListener('pointerlockchange',()=>{if(!auto&&!document.pointerLockElement){active=false;keys.clear();if(!photo)start.hidden=false;}});
  function look(dx,dy){if(!active||photo)return;yaw-=dx*.0025;pitch=T.MathUtils.clamp(pitch+dy*.0025,-.55,.85);}
  addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement)look(e.movementX,e.movementY);});
  function drag(el,move,stop){let id=null,x=0,y=0;el.onpointerdown=e=>{id=e.pointerId;x=e.clientX;y=e.clientY;el.setPointerCapture(id);};el.onpointermove=e=>{if(e.pointerId===id)move(e.clientX-x,e.clientY-y,e);};el.onpointerup=el.onpointercancel=()=>{id=null;stop?.();};}
  drag($('#stick'),(x,y)=>{joyX=T.MathUtils.clamp(x/45,-1,1);joyY=T.MathUtils.clamp(y/45,-1,1);$('#stick i').style.transform=`translate(${joyX*30}px,${joyY*30}px)`;},()=>{joyX=joyY=0;$('#stick i').style.transform='';});
  let lastX=0,lastY=0;drag($('#look'),(x,y)=>{look(x-lastX,y-lastY);lastX=x;lastY=y;},()=>{lastX=lastY=0;});
  function allowed(x,z){if(x< -34||x>35||z>27||groundHeight(x,z)<-.65)return false;for(const c of colliders){const b=c.box;if(player.y>b.max.y+.05)continue;if(x>b.min.x-.32&&x<b.max.x+.32&&z>b.min.z-.32&&z<b.max.z+.32){const oldDepth=Math.min(player.x-b.min.x+.32,b.max.x+.32-player.x,player.z-b.min.z+.32,b.max.z+.32-player.z);const newDepth=Math.min(x-b.min.x+.32,b.max.x+.32-x,z-b.min.z+.32,b.max.z+.32-z);if(oldDepth<=0||newDepth>=oldDepth)return false;}}return true;}
  function cameraBlocked(p){for(const c of colliders){const b=c.box;if(p.x>b.min.x-.2&&p.x<b.max.x+.2&&p.y>b.min.y-.2&&p.y<b.max.y+.2&&p.z>b.min.z-.2&&p.z<b.max.z+.2)return true;}return false;}
  function update(dt){dt=Math.min(dt,.05);let dx=0,dz=0;
    if(active&&!photo&&!busy&&!driven){const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-joyY,side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+joyX;const norm=Math.max(1,Math.hypot(forward,side)),wet=groundHeight(player.x,player.z)<.02,speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?5:2.7)*(wet?.42:1);dx=(side*Math.cos(yaw)-forward*Math.sin(yaw))/norm*speed*dt;dz=(-forward*Math.cos(yaw)-side*Math.sin(yaw))/norm*speed*dt;
      if(allowed(player.x+dx,player.z))player.x+=dx;else dx=0;if(allowed(player.x,player.z+dz))player.z+=dz;else dz=0;
      velocityY-=9.8*dt;player.y=Math.max(groundHeight(player.x,player.z),player.y+velocityY*dt);if(player.y===groundHeight(player.x,player.z))velocityY=0;
      const moving=Math.hypot(dx,dz);phase+=moving*5;if(moving>.001){avatar.rotation.y=Math.atan2(dx,dz);if(wet&&(splashTime-=dt)<=0){const r=rings[ringIndex++%rings.length];r.age=0;r.mesh.position.set(player.x,.09,player.z);r.mesh.visible=true;splashTime=.22;}}
      const swing=moving>.001?Math.sin(phase)*.55:0;const blend=1-Math.exp(-18*dt);arms[0].rotation.x=legs[1].rotation.x=T.MathUtils.lerp(arms[0].rotation.x,swing,blend);arms[1].rotation.x=legs[0].rotation.x=-arms[0].rotation.x;
    }
    if(!driven)avatar.position.copy(player);avatar.position.y+=Math.hypot(dx,dz)>.001?Math.abs(Math.sin(phase))*.045:0;avatar.visible=!first;
    if(!photo&&!driven){target.copy(player);target.y+=1.45;desiredCamera.copy(target);if(first){desiredCamera.x-=Math.sin(yaw)*.05;desiredCamera.z-=Math.cos(yaw)*.05;camera.position.copy(desiredCamera);target.x-=Math.sin(yaw)*10;target.z-=Math.cos(yaw)*10;target.y-=Math.sin(pitch)*10;}else{desiredCamera.x+=Math.sin(yaw)*6.2*Math.cos(pitch);desiredCamera.z+=Math.cos(yaw)*6.2*Math.cos(pitch);desiredCamera.y+=.45+Math.sin(pitch)*6.2;
      for(let i=1;i<=24;i++){probe.lerpVectors(target,desiredCamera,i/24);if(probe.y<groundHeight(probe.x,probe.z)+.35||cameraBlocked(probe)){desiredCamera.lerpVectors(target,desiredCamera,(i-1)/24);break;}}
      camera.position.lerp(desiredCamera,1-Math.exp(-10*dt));}
      camera.position.y=Math.max(camera.position.y,groundHeight(camera.position.x,camera.position.z)+.3);camera.lookAt(target);
      let nearest=null,best=4;for(const c of colliders){const d=Math.hypot(Math.max(c.box.min.x-player.x,0,player.x-c.box.max.x),Math.max(c.box.min.z-player.z,0,player.z-c.box.max.z));if(d<best){best=d;nearest=c;}}
      if(nearest!==lastPoi||group!==lastPoiGroup){lastPoi=nearest;lastPoiGroup=group;poi.textContent=nearest?`${nearest.id} · ${labels[group]}${group==='A'?' · code-generated':` · ${nearest.slot.paths[group].split('/').at(-1)}`}`:'';poi.hidden=!nearest;}
      for(const r of rings){if(r.age<1){r.age+=dt;r.mesh.scale.setScalar(1+r.age*3);r.mesh.material.opacity=(1-r.age)*.45;}else r.mesh.visible=false;}
    }
  }
  camera.position.set(player.x+1,player.y+3,player.z+5);update(0);
  // Optional game adapter: default Explore and comparison behavior stays unchanged.
  function input(out){out.forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-joyY;out.side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+joyX;out.yaw=yaw;return out;}
  function sfx(kind){if(!audio||muted)return;const osc=audio.createOscillator(),env=audio.createGain(),t=audio.currentTime;const f=kind==='pickup'?880:kind==='kick'?110:kind==='paddle'?230:350;osc.type=kind==='kick'?'sine':'triangle';osc.frequency.setValueAtTime(f,t);osc.frequency.exponentialRampToValueAtTime(kind==='pickup'?1760:55,t+.22);env.gain.setValueAtTime(.001,t);env.gain.linearRampToValueAtTime(kind==='pickup'?.6:.8,t+.015);env.gain.exponentialRampToValueAtTime(.001,t+.28);osc.connect(env);env.connect(gain);osc.start(t);osc.stop(t+.3);osc.onended=()=>{osc.disconnect();env.disconnect();};}
  const api={start:startExperience,input,sfx,mute,avatar,arms,legs,shoes,setDriven(value){driven=value;velocityY=0;},setView(angle,elevation=.08){yaw=angle;pitch=elevation;},clearInput(){keys.clear();joyX=joyY=0;},get muted(){return muted;},refresh,update,switchGroup,player,get group(){return group;},get busy(){return busy;},get photo(){return photo;},get first(){return first;},get active(){return active;},get colliders(){return colliders;}};
  if(auto)window.__EXPLORE__=api;
  return api;
}
