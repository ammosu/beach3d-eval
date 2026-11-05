import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshBVH} from 'three-mesh-bvh';
import {groundHeight} from '../terrain.js';
import {surfaceHeight} from '../water.js';
import {asset} from '../url.js';

// Scene dressing shared by all groups (game only, not part of the A/B/C comparison, like the gulls): a wreck site on
// the seabed for divers, and a fishing boat at anchor out at sea. Models: Scenario 3D Collection (AI-generated, CC BY
// 4.0, assets/wreck/CREDITS.md), prepared by tools/fetch_scenario.sh: base at y 0, centred, largest extent 1. The site
// lies on the way from the dock to the buoy, between the last two reef patches. Neither has a say in the quests.
export const WRECK_SITE={x:37,z:-194};
// Offsets from the site (m), largest extent (m), turn, pitch and roll (rad), how far the base sinks into the sand (m).
const ITEMS=[
 {id:'plane',x:0,z:0,size:9,yaw:.7,pitch:.1,roll:.2,sink:.95},
 {id:'cannon',x:-7.5,z:3.5,size:2.2,yaw:1.3,pitch:.06,roll:-.1,sink:.14},
 {id:'chest',x:6,z:5,size:1,yaw:-.5,pitch:.05,roll:.08,sink:.1},
 {id:'helmet',x:7,z:6.1,size:.5,yaw:2.2,pitch:.25,roll:-.2,sink:.05},
 {id:'jar',x:4.6,z:5.8,size:.62,yaw:.4,pitch:.03,roll:.04,sink:.05},
 {id:'jar',x:5.1,z:6.9,size:.5,yaw:1.9,pitch:0,roll:-.06,sink:.03},
 {id:'jar',x:4,z:7,size:.58,yaw:3.2,pitch:1.45,roll:.1,sink:-.22},
];
// Albedo scale per model, to sit together in the underwater light: the jars' texture has big near-white patches, the
// cannon is nearly black and would read as a silhouette.
const TONE={jar:.8,cannon:1.5};
// The fishing boat: where it lies at anchor, its length, which way it heads, how deep the keel sits under the water line.
const TRAWLER={x:-30,z:-128,size:14,yaw:.55,draft:1,halfLength:7.6,halfBeam:3.2};

// Long on the seabed: silt on what faces up, weed-brown over the rest, little metal shine left, and the seabed's glow
// (a quarter of the albedo), so the colours read in the blue-green light as the reef's do.
function sunken(material,tone=1){
 const m=material.clone();
 // Some generators (the jar's) bake all light into an emissive map over a black base: unlit, it glows through the fog
 // and ignores the sun. Use the map as albedo instead.
 if(m.emissiveMap&&!m.map&&m.color.r+m.color.g+m.color.b===0){m.map=m.emissiveMap;m.emissiveMap=null;m.emissive.set(0);m.color.set(1,1,1);}
 m.color.multiplyScalar(tone);m.metalness*=.3;m.roughness=Math.max(m.roughness,.7);
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vWreckPos;\nvarying float vWreckUp;\n'+s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
  vWreckPos=(modelMatrix*vec4(transformed,1.)).xyz;vWreckUp=normalize(mat3(modelMatrix)*objectNormal).y;`);
  s.fragmentShader='varying vec3 vWreckPos;\nvarying float vWreckUp;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float patchy=.5+.3*sin(vWreckPos.x*2.3+sin(vWreckPos.z*3.1)*1.5)*sin(vWreckPos.z*2.7+vWreckPos.y*3.3)+.2*sin(vWreckPos.x*9.+vWreckPos.y*11.+vWreckPos.z*7.);
  float silt=.22*patchy+.5*smoothstep(.15,.85,vWreckUp)*smoothstep(.15,.7,patchy);
  diffuseColor.rgb=mix(diffuseColor.rgb*vec3(.72,.76,.66),vec3(.46,.44,.34),silt);`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=diffuseColor.rgb*.25;');};
 m.customProgramCacheKey=()=>'wreck-sunken';return m;
}

// A model's triangles in its own space (the root's scale and place left out), for collision against every copy of it.
function modelBVH(model){
 const pos=[],v=new T.Vector3();model.updateMatrixWorld(true);
 model.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,ix=o.geometry.index,n=ix?ix.count:p.count;
  for(let i=0;i<n;i++){v.fromBufferAttribute(p,ix?ix.getX(i):i).applyMatrix4(o.matrixWorld);pos.push(v.x,v.y,v.z);}});
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));return new MeshBVH(g);
}

export function createWreck({scene,seabedRoot}){
 const site=new T.Group();site.name='wreck';seabedRoot.add(site);
 const trawler=new T.Group();trawler.name='trawler';trawler.rotation.order='YXZ';trawler.rotation.y=TRAWLER.yaw;trawler.position.set(TRAWLER.x,0,TRAWLER.z);scene.add(trawler);
 const load=id=>new GLTFLoader().loadAsync(asset(`assets/wreck/${id}.glb`)).then(g=>g.scene);
 const placed=[],bodies=[];
 // A solid: its object (matrixWorld current each frame), BVH in model space, a world radius round its middle for a quick reject.
 const addBody=(object,bvh,size,kind)=>{const box=bvh.geometry.boundingBox??(bvh.geometry.computeBoundingBox(),bvh.geometry.boundingBox);const mid=box.getCenter(new T.Vector3()),reach=box.getSize(new T.Vector3()).length()/2*size;bodies.push({object,bvh,size,kind,mid,reach,inv:new T.Matrix4()});};
 const ready=Promise.all([
  ...[...new Set(ITEMS.map(i=>i.id))].map(async id=>{const model=await load(id);
   model.traverse(o=>{if(o.isMesh)o.material=sunken(o.material,TONE[id]);});const bvh=modelBVH(model);
   for(const it of ITEMS.filter(i=>i.id===id)){const obj=model.clone(true),x=WRECK_SITE.x+it.x,z=WRECK_SITE.z+it.z,y=groundHeight(x,z)-it.sink;
    obj.position.set(x,y,z);obj.rotation.set(it.pitch,it.yaw,it.roll,'YXZ');obj.scale.setScalar(it.size);site.add(obj);obj.updateMatrixWorld(true);addBody(obj,bvh,it.size,id);placed.push({id,x,y,z});}}),
  load('trawler').then(model=>{const bvh=modelBVH(model);model.scale.setScalar(TRAWLER.size);trawler.add(model);addBody(model,bvh,TRAWLER.size,'trawler');}),
 ]).catch(err=>{console.warn('Wreck models failed to load',err);});
 const ca=Math.cos(TRAWLER.yaw),sa=Math.sin(TRAWLER.yaw);
 // Local axes: x along the keel (the bow towards -x), z across.
 const at=(lx,lz,t)=>surfaceHeight(TRAWLER.x+lx*ca+lz*sa,TRAWLER.z-lx*sa+lz*ca,t);
 function update(t){
  const bow=at(-6,0,t),stern=at(6,0,t),port=at(0,-2.5,t),star=at(0,2.5,t);
  trawler.position.y=(bow+stern+port+star)/4-TRAWLER.draft;
  // The hull is long and heavy: it takes a fraction of the slope.
  trawler.rotation.z=T.MathUtils.clamp(Math.atan2(stern-bow,12)*.7,-.08,.08);
  trawler.rotation.x=T.MathUtils.clamp(Math.atan2(star-port,5)*.5+.012*Math.sin(t*.7),-.08,.08);
  trawler.updateMatrixWorld(true);
 }
 // Real-shape contact for the diver. The body is three spheres along its length (the middle one at `pos`), `axis` a unit
 // vector head-wards. Each overlap pushes the whole body out along the line to the nearest surface and takes the part of
 // the velocity going into it, so a swimmer stops and slides along instead of passing through.
 const local=new T.Vector3(),world=new T.Vector3(),near=new T.Vector3(),away=new T.Vector3(),hit={point:new T.Vector3(),distance:0,faceIndex:0},mid=new T.Vector3();
 function nearest(body,p,max){
  mid.copy(body.mid).applyMatrix4(body.object.matrixWorld);if(mid.distanceTo(p)>body.reach+max)return null;
  body.inv.copy(body.object.matrixWorld).invert();local.copy(p).applyMatrix4(body.inv);
  return body.bvh.closestPointToPoint(local,hit,0,max/body.size)?near.copy(hit.point).applyMatrix4(body.object.matrixWorld):null;
 }
 const SPHERES=[[.55,.28],[-.55,.28],[0,.38]];// The middle last: it has the final say when the ends push it about.
 function collideDiver(pos,axis,vel){
  for(const body of bodies)for(const [along,r] of SPHERES){world.copy(pos).addScaledVector(axis,along);
   if(!nearest(body,world,r))continue;away.subVectors(world,near);const d=away.length();if(d<1e-4)continue;away.divideScalar(d);
   pos.addScaledVector(away,r-d);const into=vel.dot(away);if(into<0)vel.addScaledVector(away,-into);}
 }
 // Moves `cam` towards `from` until the line between them is clear of every model, so the view never sits inside one.
 const ray=new T.Ray(),rayEnd=new T.Vector3();
 function clearCamera(from,cam,margin=.35){
  const full=from.distanceTo(cam);if(full<1e-3)return;let best=full;
  for(const body of bodies){mid.copy(body.mid).applyMatrix4(body.object.matrixWorld);if(mid.distanceTo(from)>body.reach+full+margin)continue;
   body.inv.copy(body.object.matrixWorld).invert();ray.origin.copy(from).applyMatrix4(body.inv);rayEnd.copy(cam).applyMatrix4(body.inv);ray.direction.subVectors(rayEnd,ray.origin).normalize();
   const h=body.bvh.raycastFirst(ray,T.DoubleSide,0,(full+margin)/body.size);if(h)best=Math.min(best,h.distance*body.size-margin);}
  if(best<full)cam.lerpVectors(from,cam,Math.max(.2,best)/full);
 }
 // Metres from a point to the nearest model (automation).
 function gap(x,y,z){const p=new T.Vector3(x,y,z);let best=Infinity,kind=null;for(const body of bodies){if(nearest(body,p,50)){const d=near.distanceTo(p);if(d<best){best=d;kind=body.kind;}}}return {gap:best,kind};}
 // The rowboat cannot pass through the anchored hull (a box along it).
 function blocksBoat(x,z){const dx=x-TRAWLER.x,dz=z-TRAWLER.z,lx=dx*ca-dz*sa,lz=dx*sa+dz*ca;return Math.abs(lx)<TRAWLER.halfLength+1&&Math.abs(lz)<TRAWLER.halfBeam+1;}
 return {update,blocksBoat,collideDiver,clearCamera,ready,get info(){return {gap,bodies:bodies.length,site:WRECK_SITE,placed,trawler:{...TRAWLER,y:trawler.position.y,loaded:trawler.children.length>0}};}};
}
