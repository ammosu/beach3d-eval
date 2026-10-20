import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { groundHeight } from './terrain.js';
import * as procedural from './props-a.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const propRoot = new THREE.Group();
propRoot.name='prop-slots';
export const slotStubs = Object.fromEntries(Object.entries(procedural));
// Bake prop-local transforms and batch by material; keep slot transforms independent.
function batchProp(model){
 model.updateMatrixWorld(true);const batches=new Map();
 model.traverse(o=>{if(!o.isMesh)return;const key=o.material.uuid;let batch=batches.get(key);if(!batch){batch={material:o.material,geometries:[]};batches.set(key,batch);}let geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geo.index)geo=geo.toNonIndexed();batch.geometries.push(geo);});
 model.traverse(o=>{if(o.isMesh)o.geometry.dispose();});model.clear();model.position.set(0,0,0);model.quaternion.identity();model.scale.setScalar(1);for(const batch of batches.values()){const geo=mergeGeometries(batch.geometries);const mesh=new THREE.Mesh(geo,batch.material);mesh.castShadow=mesh.receiveShadow=true;model.add(mesh);batch.geometries.forEach(g=>g.dispose());}
}
// Fit inside the slot: height cap plus optional footprint cap (maxLen), same rule for every group.
function fitScale(slot,size){let s=slot.height/size.y;if(slot.maxLen)s=Math.min(s,slot.maxLen/Math.max(size.x,size.z));return s;}
export async function loadProps(group='A') {
 if (!['A','B','C'].includes(group)) throw new Error(`Unknown group: ${group}`);
 const response=await fetch('/assets/props.json');
 if(!response.ok) throw new Error('Unable to read assets/props.json');
 const config=await response.json();
 propRoot.clear();
 const loader=new GLTFLoader();
 const results=await Promise.all(config.slots.map(async slot=>{
  const marker=new THREE.Group(); marker.name=slot.id; marker.position.fromArray(slot.pos); propRoot.add(marker);
  marker.userData.slot=slot;
  if(group==='A'){
   const model=new THREE.Group();slotStubs[slot.id](model);batchProp(model);
   const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
   model.scale.multiplyScalar(fitScale(slot,size));model.updateMatrixWorld(true);box.setFromObject(model);
   const center=box.getCenter(new THREE.Vector3());model.position.x-=center.x;model.position.z-=center.z;
   model.position.y+=groundHeight(slot.pos[0],slot.pos[2])-slot.pos[1]-box.min.y;
   marker.add(model);let triangles=0;model.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
   marker.userData.triangles=triangles;return {id:slot.id,status:'procedural',triangles};
  }
  // Trial variants without touching props.json: ?swapB=<slot>:<glb path> replaces one B prop (same fit rule).
  const swap=group==='B'?new URLSearchParams(location.search).getAll('swapB').map(v=>v.split(':')).find(([id])=>id===slot.id):null;
  const path=swap?.[1]??slot.paths?.[group];
  if(!path) return {id:slot.id,status:'missing-path'};
  try {
   const {scene:model}=await loader.loadAsync(path);
   const box=new THREE.Box3().setFromObject(model); const size=box.getSize(new THREE.Vector3());
   if(!Number.isFinite(size.y)||size.y<=0) throw new Error('Model has no measurable height');
   model.scale.multiplyScalar(fitScale(slot,size)); model.updateMatrixWorld(true);
   box.setFromObject(model); const center=box.getCenter(new THREE.Vector3());
   model.position.x-=center.x; model.position.z-=center.z;
   model.position.y+=groundHeight(slot.pos[0],slot.pos[2])-slot.pos[1]-box.min.y;
   model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   marker.add(model); return {id:slot.id,status:'loaded'};
  }catch(error){console.warn(`Prop ${slot.id}: ${error.message}`);return {id:slot.id,status:'unavailable',path};}
 }));
 return {config,results};
}
