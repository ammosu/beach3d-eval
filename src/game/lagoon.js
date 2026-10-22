import * as T from 'three';
import {groundHeight,shore} from '../terrain.js';
import {SPECIES as TIDE_SPECIES} from '../tidepool/species.js';
import {rockGeometry,rippleNormals,grainGLSL} from '../tidepool/scene.js';

// Disposable iframe host for the tide pool; quest progress outlives its WebGL context. (The open sea lives in the beach scene: sea.js.)

// The rock pool on the beach, built like the tide-pool page's (same rock shape and grain) so the close-up does not look
// like a different place: a ring of rocks holding a flat sheet of water over wet sand. The beach falls away seaward
// (about 25 cm across the pool), so the water is level and the rocks on the low side stand taller to hold it.
const POOL_RX=1.75,POOL_RZ=1.5,rimShape=a=>1+.055*Math.sin(a*5)+.035*Math.cos(a*9);
function poolMaterial(color,kind,center,level){
 const mat=new T.MeshStandardMaterial({color,roughness:kind==='sand'?.94:.8,metalness:0});
 mat.onBeforeCompile=s=>{
  s.uniforms.poolCenter={value:center};s.uniforms.poolLevel={value:level};
  s.vertexShader='varying vec3 poolWorld;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npoolWorld=(modelMatrix*vec4(position,1.)).xyz;');
  s.fragmentShader='uniform vec3 poolCenter;uniform float poolLevel;varying vec3 poolWorld;\n'+grainGLSL+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 q=poolWorld-poolCenter;
   float broad=noise3(q*6.),fine=noise3(q*90.);
   float basin=1.-smoothstep(.9,1.2,length(q.xz/vec2(${POOL_RX},${POOL_RZ})));
   // Wet below the water line and a hand's width above it (splashed), with green algae in patches.
   float wet=(1.-smoothstep(poolLevel+.02,poolLevel+.09,poolWorld.y))*basin;
   diffuseColor.rgb*=.72+broad*.36+fine*.18;
   ${kind==='sand'?`diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.7,.8,.76),wet*.5);`:`
   float strata=pow(.5+.5*sin(q.y*40.+broad*5.+q.x*2.),12.);
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.3,strata*.22);
   diffuseColor.rgb*=mix(1.,.55,wet);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.075,.115,.045),wet*smoothstep(.45,.73,noise3(q*14.))*.45);
   // Dry tops bleached lighter, crusted with pale barnacle speckle.
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.75,.68),(1.-wet)*smoothstep(.72,.8,noise3(q*55.))*.5);`}
  `).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.32,wet);');
 };
 mat.customProgramCacheKey=()=>`beach-pool-${kind}`;return mat;
}

export function createTidePool(scene){
 const x=-26,z=shore(x)+4.5,y=groundHeight(x,z),root=new T.Group();root.name='game-tidepool';root.position.set(x,y,z);scene.add(root);
 let seed=611;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const ground=(lx,lz)=>groundHeight(x+lx,z+lz)-y,level=.1,bedY=(px,pz)=>Math.max(ground(px,pz)+.012,level-.1-.06*(1-Math.min(1,(px/POOL_RX)**2+(pz/POOL_RZ)**2))),center=new T.Vector3(x,y,z),worldLevel={value:y+level};
 const outline=new T.Shape();
 for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,r=rimShape(a)*1.04,px=Math.cos(a)*POOL_RX*r,pz=-Math.sin(a)*POOL_RZ*r;if(!i)outline.moveTo(px,pz);else outline.lineTo(px,pz);}
 // Bottom: on the sand where it is higher, else a shallow bed under the water (hidden at the edge by the rocks).
 const bedGeo=new T.ShapeGeometry(outline,32).rotateX(-Math.PI/2),bp=bedGeo.attributes.position;
 for(let i=0;i<bp.count;i++)bp.setY(i,bedY(bp.getX(i),bp.getZ(i)));
 bedGeo.computeVertexNormals();
 const bed=new T.Mesh(bedGeo,poolMaterial('#b7aa92','sand',center,worldLevel));bed.receiveShadow=true;root.add(bed);
 const ripples=rippleNormals();ripples.repeat.set(1.6,1.6);
 const water=new T.Mesh(new T.ShapeGeometry(outline,32).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:0x74bdb3,roughness:.06,metalness:0,transparent:true,opacity:.34,depthWrite:false,normalMap:ripples,normalScale:new T.Vector2(.35,.35)}));
 water.position.y=level;water.renderOrder=3;root.add(water);
 const rockGeo=rockGeometry(),palette=['#aaa398','#b4a490','#9b9d9a','#c2ab8f','#a59f97'].map(c=>poolMaterial(c,'rock',center,worldLevel));
 function rock(px,pz,sx,sy,sz,sink=.04){const m=new T.Mesh(rockGeo,palette[Math.floor(rand()*palette.length)]);m.position.set(px,ground(px,pz)-sink,pz);m.scale.set(sx,sy,sz);m.rotation.set(rand()*.25,rand()*6,rand()*.22);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
 // The rim: every rock reaches at least 8 cm over the water.
 for(let i=0;i<34;i++){const a=i/34*Math.PI*2+rand()*.05,r=rimShape(a),px=Math.cos(a)*POOL_RX*1.06*r,pz=-Math.sin(a)*POOL_RZ*1.06*r;
  const sy=Math.max(.16+rand()*.12,level-ground(px,pz)+.12+rand()*.08),s=.2+rand()*.14;rock(px,pz,Math.max(s,sy*.8),sy,Math.max(s*.9,sy*.75));}
 // A few stones under the water, and outcrops and loose stones on the sand around (none on the path in from the land side).
 for(let i=0;i<5;i++){const a=rand()*Math.PI*2,r=.25+rand()*.5,px=Math.cos(a)*POOL_RX*r,pz=Math.sin(a)*POOL_RZ*r,s=.14+rand()*.12;const m=rock(px,pz,s*1.3,s*.45,s);m.position.y=bedY(px,pz)-.02;}
 for(let i=0;i<22;i++){const a=rand()*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a-Math.PI/2),Math.cos(a-Math.PI/2)))<.55)continue;
  const r=1.45+rand()*1.6,px=Math.cos(a)*POOL_RX*r,pz=Math.sin(a)*POOL_RZ*r,s=.12+rand()**2*.4;rock(px,pz,s*(1+rand()),s*(.35+rand()*.45),s*(.7+rand()),s*.25);}
 const pebbles=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),poolMaterial('#b0a796','rock',center,worldLevel),300),dummy=new T.Object3D();
 for(let i=0;i<300;i++){const a=rand()*Math.PI*2,inside=i<70,r=inside?rand()*.9:1.2+rand()*2.4,px=Math.cos(a)*POOL_RX*r,pz=Math.sin(a)*POOL_RZ*r,s=inside?.012+rand()*.025:.015+rand()*.045;
  dummy.position.set(px,inside?bedY(px,pz)+s*.2:ground(px,pz)+s*.15,pz);dummy.rotation.set(0,rand()*6,0);dummy.scale.set(s,s*.45,s*.75);dummy.updateMatrix();pebbles.setMatrixAt(i,dummy.matrix);}
 pebbles.castShadow=pebbles.receiveShadow=true;root.add(pebbles);
 // A starfish on the bottom, seen through the water.
 const arm=new T.Shape();for(let i=0;i<=10;i++){const a=i/10*Math.PI*2,r=i%2?.07:.2;if(!i)arm.moveTo(Math.cos(a)*r,Math.sin(a)*r);else arm.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
 const star=new T.Mesh(new T.ExtrudeGeometry(arm,{depth:.025,bevelEnabled:true,bevelSize:.02,bevelThickness:.015,bevelSegments:2}).rotateX(-Math.PI/2),new T.MeshStandardMaterial({color:0xe8693f,roughness:.7}));
 star.position.set(.55,bedY(.55,-.35)+.012,-.35);star.rotation.y=.4;star.receiveShadow=true;root.add(star);
 // 入口站位：池子靠陸地那側
 const point=new T.Vector3(x,groundHeight(x,z+2.6),z+2.6);
 return {root,point,center:new T.Vector3(x,y,z)};
}

export function createLagoon({onObserve,onClose}){
 const overlay=document.createElement('section');overlay.id='lagoon';overlay.hidden=true;
 overlay.innerHTML=`<iframe allow="autoplay"></iframe><div class="lagoon-bar"><div><strong></strong><span id="lagoon-count"></span></div><ol></ol><button id="lagoon-back"></button></div>`;
 document.body.append(overlay);
 const frame=overlay.querySelector('iframe'),observed=new Set(),title='潮池觀察：尋找 6 種潮池生物';
 let timer=0;
 function render(){overlay.querySelector('#lagoon-count').textContent=`${observed.size} / ${TIDE_SPECIES.length}`;overlay.querySelectorAll('li').forEach((li,i)=>li.classList.toggle('done',observed.has(TIDE_SPECIES[i].id)));overlay.classList.toggle('complete',observed.size===TIDE_SPECIES.length);}
 function poll(){for(const id of frame.contentWindow?.__TIDEPOOL__?.found??[]){if(!TIDE_SPECIES.some(s=>s.id===id)||observed.has(id))continue;observed.add(id);onObserve(id,observed.size);}render();}
 function keys(event){if(event.key==='Escape'){event.preventDefault();close();}}
 function open(group,{muted=false,auto=false}={}){
  overlay.setAttribute('aria-label',title);frame.title=title;overlay.querySelector('strong').textContent=title;
  overlay.querySelector('ol').innerHTML=TIDE_SPECIES.map((s,i)=>`<li><kbd>${i+1}</kbd>${s.name}</li>`).join('');
  overlay.querySelector('#lagoon-back').innerHTML='回到沙灘 <kbd>Esc</kbd>';
  const query=new URLSearchParams({group,muted:muted?'1':'0',embedded:'1',found:[...observed].join(',')});if(auto)query.set('auto','1');
  frame.onload=()=>{frame.contentWindow.addEventListener('keydown',keys);poll();};
  frame.src=`tidepool.html?${query}`;
  overlay.hidden=false;document.body.classList.add('lagoon-open');render();clearInterval(timer);timer=setInterval(poll,50);frame.focus();
 }
 // Unload on close: concurrent WebGL contexts can blank the beach under SwiftShader.
 function close(){if(overlay.hidden)return;poll();overlay.hidden=true;frame.onload=null;frame.src='about:blank';document.body.classList.remove('lagoon-open');clearInterval(timer);onClose();}
 function reset(){observed.clear();render();}
 overlay.querySelector('#lagoon-back').onclick=close;addEventListener('keydown',e=>{if(!overlay.hidden)keys(e);});
 return {open,close,reset,frame,get isOpen(){return !overlay.hidden;},get observed(){return [...observed];}};
}
