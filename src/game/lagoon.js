import * as T from 'three';
import {groundHeight,shore} from '../terrain.js';

// 潮池任務：沙灘上的岩石小池，按 E 以 iframe 開啟俯視的 Reef Lagoon（reef/，three r128 單檔）。
// 潟湖本身不改；同源下讀 window.__reef.creatures，凡是丟進或抓起再放的生物入水就記一種。
// 素材組：A、C 用 Opus 程序化生物，B 用 Tripo 模型（潟湖沒有免費模型版）。
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

export function createLagoon({onRelease,onClose}){
 const overlay=document.createElement('section');overlay.id='lagoon';overlay.hidden=true;overlay.setAttribute('aria-label','潮池');
 overlay.innerHTML=`<iframe title="Reef Lagoon 潮池" allow="autoplay"></iframe><div class="lagoon-bar"><div><strong>潮池：放生 7 種海洋生物</strong><span id="lagoon-count">0 / 7</span></div><ol>${SPECIES.map((n,i)=>`<li data-sp="${i}"><kbd>${i+1}</kbd>${n}</li>`).join('')}</ol><button id="lagoon-back">回到沙灘 <kbd>Esc</kbd></button></div>`;
 document.body.append(overlay);
 const frame=overlay.querySelector('iframe'),done=new Set(),seen=new WeakSet(),thrown=new WeakSet();
 let timer=0,src='',known=false;
 function render(){overlay.querySelector('#lagoon-count').textContent=`${done.size} / 7`;overlay.querySelectorAll('li').forEach(li=>li.classList.toggle('done',done.has(+li.dataset.sp)));overlay.classList.toggle('complete',done.size===7);}
 function poll(){
  const reef=frame.contentWindow?.__reef;if(!reef)return;
  // 第一次看到時的生物是開場就在游的，不算；之後新出現或被抓起的才算「放生」。
  for(const c of reef.creatures){if(!known)seen.add(c);else if(!seen.has(c)||c.state==='held')thrown.add(c);
   if(thrown.has(c)&&c.state==='entry'&&!done.has(c.sp)){done.add(c.sp);render();onRelease(c.sp,done.size);}}
  known=true;
 }
 function keys(event){if(event.key==='Escape'){event.preventDefault();close();}}
 function open(group){
  const next=SOURCES[group]??SOURCES.A;
  if(next!==src){src=next;known=false;frame.src=next;frame.onload=()=>{known=false;frame.contentWindow.addEventListener('keydown',keys);};}
  overlay.hidden=false;document.body.classList.add('lagoon-open');render();clearInterval(timer);timer=setInterval(poll,100);
  setTimeout(()=>frame.focus(),50);
 }
 // 離開就卸載 iframe：兩個 WebGL context 並存會拖垮沙灘繪製（軟體渲染下甚至整片空白）；進度記在 done。
 function close(){if(overlay.hidden)return;overlay.hidden=true;frame.onload=null;frame.src='about:blank';src='';document.body.classList.remove('lagoon-open');clearInterval(timer);onClose();}
 function reset(){done.clear();render();}
 overlay.querySelector('#lagoon-back').onclick=close;addEventListener('keydown',e=>{if(!overlay.hidden)keys(e);});
 return {open,close,reset,frame,get isOpen(){return !overlay.hidden;},get released(){return [...done];}};
}
