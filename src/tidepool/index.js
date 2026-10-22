import * as T from 'three';
import {SPECIES} from './species.js';
import {loadCreature} from './creatures.js';
import {createPool} from './scene.js';
import './style.css';
import {creditsButton} from '../credits.js';
const params=new URLSearchParams(location.search),group=['A','B','C'].includes(params.get('group'))?params.get('group'):'A',auto=params.get('auto')==='1',fixed=params.has('time')?Number(params.get('time')):null;
if(params.get('embedded')==='1')document.body.classList.add('embedded');
const $=s=>document.querySelector(s),renderer=new T.WebGLRenderer({canvas:$('#view'),antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const pool=createPool(renderer),{scene,camera}=pool,clock=new T.Clock();
let time=window.__TIME__??fixed??0,muted=params.get('muted')==='1',audio,selected=null;
const found=new Set((params.get('found')||'').split(',').filter(id=>SPECIES.some(s=>s.id===id)));
const creatures=await Promise.all(SPECIES.map(async spec=>({...spec,...await loadCreature(spec,group),revealedAt:spec.hidden?null:0})));
for(const c of creatures){c.root.position.fromArray(c.position);c.root.visible=!c.hidden;scene.add(c.root);}
// Unobserved animals get a soft pulsing ring so they can be found (hidden ones only once revealed).
const ringGeo=new T.RingGeometry(.9,1,40);ringGeo.rotateX(-Math.PI/2);
for(const c of creatures){c.ring=new T.Mesh(ringGeo,new T.MeshBasicMaterial({color:'#fff3b8',transparent:true,depthWrite:false,toneMapped:false}));c.ring.renderOrder=3;c.ring.visible=false;scene.add(c.ring);}
const stonePositions=[[-.62,.36],[.42,-.34],[-.22,-.12],[-.82,-.64],[.72,.37],[-.18,-.65],[.38,.05],[-.28,.65]];
const stones=stonePositions.map(([x,z],i)=>{const mesh=new T.Mesh(pool.rockGeo,pool.rockMat.clone());mesh.material.color.set(i%2?'#797c67':'#686e5d');mesh.scale.set(i===1?.29:.16,i===1?.105:.07,i===1?.24:.13);mesh.position.set(x,mesh.scale.y*.72,z);mesh.rotation.y=i*1.8;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return {index:i,mesh,x,z,y:mesh.position.y,lifted:false,liftedAt:null,creature:['hermit_crab','octopus','nudibranch'][i]??null};});
// Two harmless finds beneath otherwise empty stones: a snail and a tiny shrimp.
const surprises=[];for(const i of [3,5]){const g=new T.Group(),mat=new T.MeshStandardMaterial({color:i===3?'#bd9e72':'#b39e86'});const body=new T.Mesh(new T.SphereGeometry(1,12,8),mat);body.scale.set(i===3?.025:.045,.018,.022);g.add(body);if(i===5){for(let j=0;j<5;j++){const leg=new T.Mesh(new T.CylinderGeometry(.001,.001,.045,4),mat);leg.position.x=-.025+j*.012;leg.rotation.x=.8;g.add(leg);}}g.position.set(stones[i].x,.022,stones[i].z);g.visible=false;scene.add(g);surprises.push({i,g});}
const raycaster=new T.Raycaster(),mouse=new T.Vector2(),point=new T.Vector3(),plane=new T.Plane(new T.Vector3(0,1,0),-.205);
const portraitCanvas=document.createElement('canvas'),portraitContext=portraitCanvas.getContext('2d');portraitCanvas.style.cssText='width:100%;height:100%;display:block';$('#portrait').append(portraitCanvas);
const previewScene=new T.Scene();previewScene.background=new T.Color('#eef1e7');previewScene.add(new T.HemisphereLight('#fff2d7','#516962',3));const key=new T.DirectionalLight('#fff0d0',3);key.position.set(-2,3,3);previewScene.add(key);const previewCamera=new T.PerspectiveCamera(35,1,.01,20);previewCamera.position.set(1.4,1.5,1.7);previewCamera.lookAt(0,.15,0);let preview;
function sound(observe=false){if(muted)return;audio??=new AudioContext();audio.resume();const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(observe?880:540,t);osc.frequency.exponentialRampToValueAtTime(observe?1320:170,t+.15);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.09,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+.45);osc.connect(gain).connect(audio.destination);osc.start(t);osc.stop(t+.5);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
function audioUI(){$('#sound').textContent=muted?'聲音 關':'聲音 開';$('#sound').setAttribute('aria-pressed',String(muted));}
$('#sound').onclick=()=>{muted=!muted;if(muted)audio?.suspend();else audio?.resume();audioUI();};audioUI();
// taste-skill-ignore: the requested checklist uses a check mark for observed species.
function updateUI(){
 $('#count').textContent=`${found.size} / ${SPECIES.length}`;
 $('#status').textContent=found.size===6?'觀察完成，讓潮池繼續熱鬧。':'找到牠們，讓牠們留在海裡。';
 $('#collection').replaceChildren(...SPECIES.map(c=>{const b=document.createElement('button');b.classList.toggle('found',found.has(c.id));b.disabled=!found.has(c.id);b.innerHTML=`<b>${found.has(c.id)?'&#10003;':'&#9675;'}</b>${c.name}`;b.setAttribute('aria-label',`${c.name}，${found.has(c.id)?'已觀察，點選近看':'尚未觀察'}`);b.onclick=()=>observe(c.id);return b;}));
}
function lift(i){const s=stones[i];if(!s||s.lifted)return false;s.lifted=true;s.liftedAt=time;const c=creatures.find(c=>c.id===s.creature);if(c)c.revealedAt=time;pool.ripple(s.x,s.z,time);sound();$('#instruction').textContent=c?'石頭下面有動靜！點一下生物，仔細看看。':'小石頭下也是小動物的家，再找找其他角落。';return true;}
function observe(id){const c=creatures.find(c=>c.id===id);if(!c||(c.revealedAt===null&&!found.has(id)))return false;
 // Match picking: a newly lifted stone must have cleared the animal first.
 if(c.hidden&&time-c.revealedAt<.45&&!found.has(id))return false;
 if(!found.has(id)){found.add(id);sound(true);}selected=id;updateUI();$('#observation').hidden=false;$('#observation h2').textContent=c.name;$('#fact').textContent=c.fact;
 if(preview)previewScene.remove(preview);preview=c.model.clone(true);preview.position.set(0,0,0);preview.rotation.set(0,-.25,0);preview.scale.setScalar(1);previewScene.add(preview);const b=new T.Box3().setFromObject(preview),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());preview.scale.setScalar(1/Math.max(size.x,size.y,size.z));preview.position.copy(center).multiplyScalar(-preview.scale.x);return true;
}
function closeCard(){selected=null;$('#observation').hidden=true;}$('#card-close').onclick=closeCard;$('#continue').onclick=closeCard;addEventListener('keydown',e=>{if(e.key==='Escape'&&window.parent===window)closeCard();});
function update(t){time=t;pool.update(t);for(const s of stones){const p=s.lifted?T.MathUtils.smootherstep(t-s.liftedAt,0,.8):0;{const l=Math.hypot(s.x,s.z)||1;s.mesh.position.set(s.x+p*s.x/l*.3,s.y+p*.16,s.z+p*s.z/l*.3);}s.mesh.rotation.z=p*1.15;}
 for(const c of creatures){c.root.visible=c.revealedAt!==null;if(!c.root.visible)continue;const age=Math.max(0,t-c.revealedAt);c.animate(t);c.root.position.fromArray(c.position);if(c.id==='hermit_crab'){c.root.position.x+=Math.sin(age*.6)*.10;c.root.position.z+=Math.sin(age*.35)*.04;c.root.rotation.y=Math.cos(age*.6)>0?0:Math.PI;}if(c.id==='nudibranch'){c.root.position.x+=Math.sin(age*.12)*.10;}if(c.id==='octopus'){const p=T.MathUtils.smootherstep(age,1,9);c.root.position.x+=p*.3;c.root.position.z+=p*.28;c.root.rotation.y=Math.sin(t*.7)*.08;}}
 surprises.forEach(({i,g})=>g.visible=stones[i].lifted);
 for(const c of creatures){const show=c.root.visible&&!found.has(c.id);c.ring.visible=show;if(!show)continue;const pulse=.5+.5*Math.sin(t*3+c.position[0]*4);c.ring.position.set(c.root.position.x,Math.max(c.root.position.y,.2)+.012,c.root.position.z);c.ring.scale.setScalar(Math.min(.2,(c.display??.2)*.5)*(.95+.12*pulse));c.ring.material.opacity=.25+.35*pulse;}
 for(const s of stones)s.mesh.material.emissive.setRGB(...(s===hovered&&!s.lifted?[.16,.14,.08]:[0,0,0]));
}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);const ratio=w/h,halfWidth=ratio<1?1.95:Math.max(2.2,2.2*ratio/1.78),halfHeight=halfWidth/ratio;camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight+(ratio>=1?-.1:0);camera.bottom=-halfHeight+(ratio>=1?-.1:0);camera.updateProjectionMatrix();pool.resize(Math.round(w*renderer.getPixelRatio()),Math.round(h*renderer.getPixelRatio()));}
function render(){renderer.setScissorTest(false);renderer.setViewport(0,0,innerWidth,innerHeight);pool.render();if(selected){const r=$('#portrait').getBoundingClientRect();renderer.setScissorTest(true);renderer.setScissor(r.left,innerHeight-r.bottom,r.width,r.height);renderer.setViewport(r.left,innerHeight-r.bottom,r.width,r.height);renderer.clearDepth();previewCamera.aspect=r.width/r.height;previewCamera.updateProjectionMatrix();renderer.render(previewScene,previewCamera);const dpr=renderer.getPixelRatio();portraitCanvas.width=Math.round(r.width*dpr);portraitCanvas.height=Math.round(r.height*dpr);portraitContext.drawImage(renderer.domElement,Math.round(r.left*dpr),Math.round(r.top*dpr),portraitCanvas.width,portraitCanvas.height,0,0,portraitCanvas.width,portraitCanvas.height);renderer.setScissorTest(false);}}
// The close-up shares this WebGL context. Its canvas area is exposed through the card.
$('#portrait').style.background='transparent';
let hovered=null;
$('#view').addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;mouse.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(stones.filter(s=>!s.lifted).map(s=>s.mesh),false)[0];hovered=hit?stones.find(s=>s.mesh===hit.object):null;$('#view').style.cursor=hovered?'pointer':'';});
$('#view').addEventListener('click',event=>{
 mouse.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(mouse,camera);if(raycaster.ray.intersectPlane(plane,point)){pool.ripple(point.x,point.z,time);sound();}
 const candidates=stones.filter(s=>!s.lifted).map(s=>s.mesh).concat(creatures.filter(c=>c.root.visible).map(c=>c.root));const hit=raycaster.intersectObjects(candidates,true)[0];
 if(hit){const s=stones.find(s=>s.mesh===hit.object);if(s){lift(s.index);return;}const c=creatures.find(c=>{let n=hit.object;while(n){if(n===c.root)return true;n=n.parent;}return false;});if(c){observe(c.id);return;}}
 // A 44px touch target for tiny animals, still gated by the covering stone.
 let closest=null,distance=24;for(const c of creatures){if(!c.root.visible||c.hidden&&time-c.revealedAt<.8)continue;const p=c.root.position.clone().project(camera),d=Math.hypot((p.x*.5+.5)*innerWidth-event.clientX,(-p.y*.5+.5)*innerHeight-event.clientY);if(d<distance){distance=d;closest=c;}}if(closest)observe(closest.id);
});
const fallback=creatures.filter(c=>c.fallback).map(c=>c.name);if(group==='C')$('#stats').after(creditsButton());$('#stats').textContent=`素材 ${group} · ${fallback.length?`A 備援：${fallback.join('、')}`:'6 種載入完成'}`;updateUI();resize();addEventListener('resize',resize);
window.__SCENE__={scene,camera,renderer,water:pool.water};
const api={get found(){return [...found];},get done(){return found.size===6;},species:creatures.map(({id,name,size,source,fallback})=>({id,name,size,source,fallback})),get stones(){return stones.map(({index,lifted,creature})=>({index,lifted,creature}));},group};
if(auto)Object.assign(api,{lift,observe,step(seconds){if(!Number.isFinite(seconds)||seconds<0)throw Error('step requires nonnegative seconds');window.__TIME__=time+seconds;update(window.__TIME__);render();},project(id){const c=creatures.find(c=>c.id===id),s=typeof id==='number'?stones[id]:null;const p=(c?.root.position??s?.mesh.position)?.clone().project(camera);return p?{x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight}:null;}});
window.__TIDEPOOL__=api;update(time);render();window.__READY__=true;
function frame(){requestAnimationFrame(frame);update(window.__TIME__??fixed??clock.getElapsedTime());render();}frame();
