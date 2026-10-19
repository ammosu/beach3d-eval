// Isolated inspection scene: shared beach scene and all comparison cameras stay untouched.
import * as T from 'three';
import {loadProps,propRoot} from './props.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import './ui.css';
import {createCharacter} from './game/character.js';
const params=new URLSearchParams(location.search),capture=params.get('capture')==='1',compareCharacters=params.get('compare')==='1'&&params.get('solo')==='character';
const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#999999');scene.add(new T.HemisphereLight(0xffffff,0x777777,2));
const key=new T.DirectionalLight(0xfff7eb,3);key.position.set(-3,6,5);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3});key.shadow.bias=-.001;
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x999999,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
const camera=new T.PerspectiveCamera(38,innerWidth/innerHeight,.01,200);camera.position.set(4.6,3.3,5.8);camera.lookAt(0,1.25,0);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.25,0);controls.enableDamping=true;controls.minDistance=2;controls.maxDistance=30;controls.update();
const config=await (await fetch('/assets/props.json')).json();
let group=['A','B','C'].includes(params.get('group'))?params.get('group'):'A';
let id=params.get('solo')==='character'?'character':config.slots.some(s=>s.id===params.get('solo'))?params.get('solo'):'boat';
let activeModel,busy=false,results=[],models=new Map(),character=null,animation=params.get('animation')||'idle',trio=[];
const toolbar=document.createElement('nav');toolbar.className='viewer-toolbar';toolbar.innerHTML=`<a href="/">← 回入口</a><strong>單件模型</strong><label>組別 <select id="solo-group"><option value="A">A｜codex 程序化</option><option value="B">B｜Tripo AI</option><option value="C">C｜免費素材庫</option></select></label><label>道具 <select id="solo-prop"><option value="character">角色</option>${config.slots.map(s=>`<option value="${s.id}">${s.id}</option>`).join('')}</select></label><label id="animation-label" hidden>動畫 <select id="animation"></select></label><a id="character-compare" href="/props.html?solo=character&compare=1">三組並排</a><span id="triangles" aria-live="polite"></span>`;
const status=document.createElement('div');status.className='viewer-status';status.setAttribute('role','status');
if(!capture)document.body.append(toolbar,status);
const groupPicker=toolbar.querySelector('#solo-group'),propPicker=toolbar.querySelector('#solo-prop');
function show(){
 activeModel?.removeFromParent();activeModel=id==='character'?character?.root:models.get(id);
 let triangles=0;
 if(activeModel){scene.add(activeModel);activeModel.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});}
 toolbar.querySelector('#animation-label').hidden=id!=='character';toolbar.querySelector('#character-compare').hidden=id!=='character';
 toolbar.querySelector('#triangles').textContent=activeModel?`${triangles.toLocaleString()} 三角面`:'生成中';
 status.textContent=activeModel?'拖曳旋轉・滾輪縮放':`${group}｜${id} 生成中`;
 camera.position.set(4.6,3.3,5.8);controls.target.set(0,1.25,0);camera.lookAt(controls.target);controls.update();
 if(id==='character'){camera.position.set(2.8,1.9,4.2);controls.target.set(0,.9,0);controls.update();}
 if(compareCharacters){for(let i=0;i<3;i++){scene.add(trio[i].root);trio[i].root.position.x=(i-1)*2;}camera.position.set(0,2.4,9.2);controls.target.set(0,.9,0);controls.update();status.textContent='左 A｜codex 程序化　中 B｜Tripo AI　右 C｜Quaternius CC0';toolbar.querySelector('#triangles').textContent=trio.map((c,i)=>`${'ABC'[i]} ${c.info().triangles.toLocaleString()}`).join(' · ');toolbar.querySelector('#character-compare').textContent='單一角色';toolbar.querySelector('#character-compare').href='/props.html?solo=character';}
 groupPicker.value=group;propPicker.value=id;
 const url=new URL(location.href);url.searchParams.set('group',group);url.searchParams.set('solo',id);history.replaceState(null,'',url);
 renderer.render(scene,camera);window.__PROP__={id,group,results,triangles,character:character?.info()};window.__CHARACTER__={info:()=>character.info(),comparison:()=>trio.map(c=>c.info()),animations:character?.animations,pose(name,seconds=.65){animation=name;for(let t=0;t<seconds;t+=1/60)for(const c of compareCharacters?trio:[character])c.update(1/60,{animation:name});renderer.render(scene,camera);return character.info();}};window.__READY__=true;
}
async function load(){
 if(busy)return;busy=true;window.__READY__=false;groupPicker.disabled=propPicker.disabled=true;status.textContent='載入中…';
 activeModel?.removeFromParent();activeModel=null;
 const geometries=new Set(),materials=new Set(),textures=new Set();
 character?.dispose();for(const c of trio)if(c!==character)c.dispose();trio=[];character=null;
 for(const model of models.values())model.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material]){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}});
 for(const resource of [...geometries,...materials,...textures])resource.dispose();models.clear();
 try{
  if(compareCharacters){trio=await Promise.all(['A','B','C'].map(createCharacter));character=trio['ABC'.indexOf(group)];}else character=await createCharacter(group);const picker=toolbar.querySelector('#animation');picker.innerHTML=character.animations.map(n=>`<option>${n}</option>`).join('');picker.value=animation;character.update(0,{animation});
  ({results}=await loadProps(group));
  for(const marker of [...propRoot.children]){
   const model=marker.children[0];if(!model)continue;
   model.removeFromParent();model.position.set(0,0,0);model.updateMatrixWorld(true);
   const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
   model.scale.multiplyScalar(3/Math.max(size.x,size.y,size.z));model.updateMatrixWorld(true);bounds.setFromObject(model);
   const center=bounds.getCenter(new T.Vector3());model.position.set(-center.x,-bounds.min.y,-center.z);models.set(marker.name,model);
  }
  show();
 }catch(error){status.textContent=`載入失敗：${error.message}`;}finally{busy=false;groupPicker.disabled=propPicker.disabled=false;}
}
groupPicker.onchange=()=>{group=groupPicker.value;if(compareCharacters)location.href=`/props.html?solo=character&group=${group}`;else load();};propPicker.onchange=()=>{id=propPicker.value;if(compareCharacters)location.href=`/props.html?solo=${id}&group=${group}`;else show();};
toolbar.querySelector('#animation').onchange=event=>{animation=event.target.value;};
await load();
let last=performance.now();
if(!capture){renderer.setAnimationLoop(()=>{const now=performance.now();if(id==='character')for(const c of compareCharacters?trio:[character])c?.update(Math.min(.05,(now-last)/1000),{animation});last=now;controls.update();renderer.render(scene,camera);});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});}
