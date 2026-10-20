import * as T from 'three';
import {groundHeight,shore} from '../terrain.js';
import {SPECIES as TIDE_SPECIES} from '../tidepool/species.js';

// Shared, disposable iframe host; quest progress outlives its WebGL context.
export const SPECIES=['大白鯊','槌頭鯊','座頭鯨','虎鯨','海豚','海龜','蝠鱝'];
const SOURCES={A:'reef/opus/index.html',B:'reef/tripo_lagoon/index.html',C:'reef/opus/index.html'};

export function createTidePool(scene){
 const x=-26,z=shore(x)+4.5,y=groundHeight(x,z),root=new T.Group();root.name='game-tidepool';root.position.set(x,y,z);scene.add(root);
 const pool=new T.Mesh(new T.CircleGeometry(1.7,40),new T.MeshStandardMaterial({color:0x2fb4c2,roughness:.15,metalness:.1,emissive:0x0b5c6e,emissiveIntensity:.35}));pool.rotation.x=-Math.PI/2;pool.position.y=.03;root.add(pool);
 const rockGeo=new T.DodecahedronGeometry(1,0),rockMat=new T.MeshStandardMaterial({color:0xb3a894,roughness:.95,flatShading:true});
 const rocks=new T.InstancedMesh(rockGeo,rockMat,14),dummy=new T.Object3D();rocks.castShadow=true;
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=1.9+.15*Math.sin(i*2.7),s=.28+.12*Math.abs(Math.sin(i*1.9));dummy.position.set(Math.cos(a)*r,s*.35,Math.sin(a)*r);dummy.rotation.set(i,i*.7,i*1.3);dummy.scale.set(s*1.3,s,s*1.1);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}
 root.add(rocks);
 const star=new T.Mesh(new T.OctahedronGeometry(.18),new T.MeshStandardMaterial({color:0xff8a5c,roughness:.6}));star.scale.set(1,.3,1);star.position.set(.6,.06,-.4);root.add(star);
 // 入口站位：池子靠陸地那側
 const point=new T.Vector3(x,groundHeight(x,z+2.6),z+2.6);
 return {root,point,center:new T.Vector3(x,y,z)};
}

export function createLagoon({onRelease,onObserve,onClose}){
 const overlay=document.createElement('section');overlay.id='lagoon';overlay.hidden=true;
 overlay.innerHTML=`<iframe allow="autoplay"></iframe><div class="lagoon-bar"><div><strong></strong><span id="lagoon-count"></span></div><ol></ol><button id="lagoon-back"></button></div>`;
 document.body.append(overlay);
 const frame=overlay.querySelector('iframe'),released=new Set(),observed=new Set();
 let timer=0,known=false,kind='tidepool',seen=new WeakSet(),thrown=new WeakSet();
 const entries=()=>kind==='tidepool'?TIDE_SPECIES.map(s=>({id:s.id,name:s.name})):SPECIES.map((name,id)=>({id,name}));
 const progress=()=>kind==='tidepool'?observed:released;
 function render(){const done=progress(),list=entries();overlay.querySelector('#lagoon-count').textContent=`${done.size} / ${list.length}`;overlay.querySelectorAll('li').forEach((li,i)=>li.classList.toggle('done',done.has(list[i].id)));overlay.classList.toggle('complete',done.size===list.length);}
 function poll(){
  if(kind==='tidepool'){
   for(const id of frame.contentWindow?.__TIDEPOOL__?.found??[]){if(!TIDE_SPECIES.some(s=>s.id===id)||observed.has(id))continue;observed.add(id);onObserve(id,observed.size);}render();return;
  }
  const reef=frame.contentWindow?.__reef;if(!reef)return;
  // Initial swimmers do not count. A newly thrown/re-grabbed animal must enter water.
  for(const c of reef.creatures){if(!known)seen.add(c);else if(!seen.has(c)||c.state==='held')thrown.add(c);
   if(thrown.has(c)&&c.state==='entry'&&!released.has(c.sp)){released.add(c.sp);render();onRelease(c.sp,released.size);}}
  known=true;
 }
 function keys(event){if(event.key==='Escape'){event.preventDefault();close();}}
 function open(group,nextKind='opensea',{muted=false,auto=false}={}){
  kind=nextKind;known=false;seen=new WeakSet();thrown=new WeakSet();
  const tide=kind==='tidepool',title=tide?'潮池觀察：尋找 6 種潮池生物':'外海：放生 7 種大型海洋生物';
  overlay.setAttribute('aria-label',title);frame.title=title;overlay.querySelector('strong').textContent=title;
  overlay.querySelector('ol').innerHTML=entries().map((s,i)=>`<li><kbd>${i+1}</kbd>${s.name}</li>`).join('');
  overlay.querySelector('#lagoon-back').innerHTML=`回到${tide?'沙灘':'小船'} <kbd>Esc</kbd>`;
  const query=new URLSearchParams({group,muted:muted?'1':'0',embedded:'1'});if(auto)query.set('auto','1');if(tide)query.set('found',[...observed].join(','));
  frame.onload=()=>{known=false;frame.contentWindow.addEventListener('keydown',keys);if(!tide&&muted){const sound=frame.contentDocument.querySelector('[data-t="sound"].on');sound?.click();}poll();};
  frame.src=tide?`tidepool.html?${query}`:`${SOURCES[group]??SOURCES.A}`;
  overlay.hidden=false;document.body.classList.add('lagoon-open');render();clearInterval(timer);timer=setInterval(poll,50);frame.focus();
 }
 // Unload on close: concurrent WebGL contexts can blank the beach under SwiftShader.
 function close(){if(overlay.hidden)return;poll();const previous=kind;overlay.hidden=true;frame.onload=null;frame.src='about:blank';document.body.classList.remove('lagoon-open');clearInterval(timer);onClose(previous);}
 function reset(){released.clear();observed.clear();render();}
 overlay.querySelector('#lagoon-back').onclick=close;addEventListener('keydown',e=>{if(!overlay.hidden)keys(e);});
 return {open,close,reset,frame,get kind(){return kind;},get isOpen(){return !overlay.hidden;},get released(){return [...released];},get observed(){return [...observed];}};
}
