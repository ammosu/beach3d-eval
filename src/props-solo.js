// Isolated inspection scene: shared beach scene and all comparison cameras stay untouched.
import * as T from 'three';
import {loadProps,propRoot} from './props.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import './ui.css';
const params=new URLSearchParams(location.search),capture=params.get('capture')==='1';
const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#999999');scene.add(new T.HemisphereLight(0xffffff,0x777777,2));
const key=new T.DirectionalLight(0xfff7eb,3);key.position.set(-3,6,5);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3});key.shadow.bias=-.001;
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x999999,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
const camera=new T.PerspectiveCamera(38,innerWidth/innerHeight,.01,200);camera.position.set(4.6,3.3,5.8);camera.lookAt(0,1.25,0);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.25,0);controls.enableDamping=true;controls.minDistance=2;controls.maxDistance=30;controls.update();
const config=await (await fetch('/assets/props.json')).json();
let group=['A','B','C'].includes(params.get('group'))?params.get('group'):'A';
let id=config.slots.some(s=>s.id===params.get('solo'))?params.get('solo'):'boat';
let activeModel,busy=false,results=[],models=new Map();
const toolbar=document.createElement('nav');toolbar.className='viewer-toolbar';toolbar.innerHTML=`<a href="/">← 回入口</a><strong>單件模型</strong><label>組別 <select id="solo-group"><option value="A">A｜codex 程序化</option><option value="B">B｜Tripo AI</option><option value="C">C｜免費素材庫</option></select></label><label>道具 <select id="solo-prop">${config.slots.map(s=>`<option value="${s.id}">${s.id}</option>`).join('')}</select></label><span id="triangles" aria-live="polite"></span>`;
const status=document.createElement('div');status.className='viewer-status';status.setAttribute('role','status');
if(!capture)document.body.append(toolbar,status);
const groupPicker=toolbar.querySelector('#solo-group'),propPicker=toolbar.querySelector('#solo-prop');
function show(){
 activeModel?.removeFromParent();activeModel=models.get(id);
 let triangles=0;
 if(activeModel){scene.add(activeModel);activeModel.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});}
 toolbar.querySelector('#triangles').textContent=activeModel?`${triangles.toLocaleString()} 三角面`:'生成中';
 status.textContent=activeModel?'拖曳旋轉・滾輪縮放':`${group}｜${id} 生成中`;
 camera.position.set(4.6,3.3,5.8);controls.target.set(0,1.25,0);camera.lookAt(controls.target);controls.update();
 groupPicker.value=group;propPicker.value=id;
 const url=new URL(location.href);url.searchParams.set('group',group);url.searchParams.set('solo',id);history.replaceState(null,'',url);
 renderer.render(scene,camera);window.__PROP__={id,group,results,triangles};window.__READY__=true;
}
async function load(){
 if(busy)return;busy=true;window.__READY__=false;groupPicker.disabled=propPicker.disabled=true;status.textContent='載入中…';
 activeModel?.removeFromParent();activeModel=null;
 const geometries=new Set(),materials=new Set(),textures=new Set();
 for(const model of models.values())model.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material]){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}});
 for(const resource of [...geometries,...materials,...textures])resource.dispose();models.clear();
 try{
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
groupPicker.onchange=()=>{group=groupPicker.value;load();};propPicker.onchange=()=>{id=propPicker.value;show();};
await load();
if(!capture){renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});}
