import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { groundHeight } from './terrain.js';
export const propRoot = new THREE.Group();
propRoot.name='prop-slots';
export const slotStubs = {
 palm_tall(slot) {}, palm_pair(slot) {}, rocks(slot) {}, boat(slot) {},
 hut(slot) {}, umbrella(slot) {}, driftwood(slot) {}, lifeguard(slot) {},
};
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
  if(group==='A'){slotStubs[slot.id]?.(marker); return {id:slot.id,status:'stub'};}
  const path=slot.paths?.[group];
  if(!path) return {id:slot.id,status:'missing-path'};
  try {
   const {scene:model}=await loader.loadAsync(path);
   const box=new THREE.Box3().setFromObject(model); const size=box.getSize(new THREE.Vector3());
   if(!Number.isFinite(size.y)||size.y<=0) throw new Error('Model has no measurable height');
   model.scale.multiplyScalar(slot.height/size.y); model.updateMatrixWorld(true);
   box.setFromObject(model); const center=box.getCenter(new THREE.Vector3());
   model.position.x-=center.x; model.position.z-=center.z;
   model.position.y+=groundHeight(slot.pos[0],slot.pos[2])-slot.pos[1]-box.min.y;
   model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   marker.add(model); return {id:slot.id,status:'loaded'};
  }catch(error){console.warn(`Prop ${slot.id}: ${error.message}`);return {id:slot.id,status:'unavailable',path};}
 }));
 return {config,results};
}
