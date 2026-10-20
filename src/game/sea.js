import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sampleWater} from '../water.js';
import {buildSeaCreature} from './sea-a.js';

// Open-sea animals that live in the beach scene around the island buoy. The water is opaque, so they show what a rower
// would see: dorsal fins, backs rolling out to breathe, spouts, leaps. Everything is a function of the water clock.
// length: display length in metres, shared by A/B/C (models are normalised to length 1, head +x, back +y).
// rest: body-axis height between events, as a fraction of length (fin cruisers keep the dorsal fin out).
// bend: 1 tail side to side, 2 flukes up and down, 3 wing flap, 4 flipper strokes.
// events per cycle: ['surf', start, hold, level, spout] rises to level and rolls back; ['leap', start, apex, roll, flat].
export const SEA=[
 {id:'shark',name:'大白鯊',length:4.2,speed:2.4,radius:8,bend:1,amp:.05,beat:1.3,rest:-.1,cycle:24,events:[['leap',16,1.4]]},
 {id:'hammerhead',name:'槌頭鯊',length:4,speed:2.1,radius:10,bend:1,amp:.05,beat:1.4,rest:-.1,cycle:22,events:[]},
 {id:'humpback',name:'座頭鯨',length:11,speed:2.2,radius:13,bend:2,amp:.035,beat:.3,rest:-.3,cycle:24,events:[['surf',2,4,-.05,1],['surf',9,3,-.05,1],['leap',16,3.2,1.4]]},
 {id:'orca',name:'虎鯨',length:6.5,speed:3.2,radius:10,bend:2,amp:.04,beat:.6,rest:-.28,cycle:14,events:[['surf',1.5,2.5,-.04,1],['surf',6,2,-.04,1],['leap',10,2.2]]},
 {id:'dolphin',name:'海豚',length:2.6,speed:4.2,radius:7,bend:2,amp:.05,beat:1.5,rest:-.5,cycle:7,events:[['leap',1.5,1.3],['leap',3.5,.9],['leap',5.3,1.1]]},
 {id:'turtle',name:'海龜',length:1.4,speed:.9,radius:5,bend:4,amp:.3,beat:.55,rest:-.8,cycle:12,events:[['surf',1,7,-.03,0]]},
 {id:'manta',name:'蝠鱝',length:3.6,speed:1.6,radius:8,bend:3,amp:.12,beat:.35,rest:-.12,cycle:12,events:[['leap',6,1.6,0,1]]},
];
const G=9.8;
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const hash=n=>{const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s);};

// Swim bend in model space (x from tail -.5 to head .5).
const BEND=`
float swimTail=clamp((.25-transformed.x)/.75,0.,1.);swimTail*=swimTail;
float swimWave=sin(uSwim.x-transformed.x*6.)*uSwim.y;
if(uSwim.z<1.5)transformed.z+=swimWave*swimTail;
else if(uSwim.z<2.5)transformed.y+=swimWave*swimTail;
else if(uSwim.z<3.5)transformed.y+=uSwim.y*sin(uSwim.x-transformed.x*3.)*pow(abs(transformed.z)*2.,2.);
else transformed.y+=uSwim.y*sin(uSwim.x+sign(transformed.x)*1.6)*max(abs(transformed.z)-.18,0.);`;
function swimmable(material,uniform){
 const m=material.clone();m.onBeforeCompile=shader=>{shader.uniforms.uSwim=uniform;shader.vertexShader='uniform vec4 uSwim;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+BEND);};
 m.customProgramCacheKey=()=>'sea-swim';return m;
}
// GLB (B/C) → one group in the shared frame; transforms baked so the bend sees model-space x.
async function loadGlb(url){
 const gltf=await new GLTFLoader().loadAsync(url),root=new T.Group();gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{if(o.isMesh){const m=new T.Mesh(o.geometry.clone().applyMatrix4(o.matrixWorld),o.material);root.add(m);}});
 const box=new T.Box3().setFromObject(root);if(box.isEmpty())throw Error('Empty model');
 const size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
 for(const m of root.children){m.geometry.translate(-c.x,-c.y,-c.z).scale(1/size.x,1/size.x,1/size.x);}
 return root;
}

export function createSea(scene,{center,onRelease,boat}){
 const root=new T.Group();root.name='open-sea';scene.add(root);
 const wave={},cache=new Map(),dummy=new T.Object3D();
 const creatures=SEA.map((spec,i)=>{const holder=new T.Group();holder.visible=false;root.add(holder);return {spec,i,holder,uniform:{value:new T.Vector4(0,spec.amp,spec.bend,0)},release:null,counted:false};});
 // Splash droplets, spout mist and foam rings: rebuilt every frame from the event times.
 const drops=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:0xffffff,roughness:.25,transparent:true,opacity:.9}),600);drops.frustumCulled=false;root.add(drops);
 const ringGeo=new T.RingGeometry(.86,1,48).rotateX(-Math.PI/2),rings=Array.from({length:24},()=>{const m=new T.Mesh(ringGeo,new T.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}));m.visible=false;root.add(m);return m;});
 let group=null,loading=null;

 async function build(g){
  if(!cache.has(g))cache.set(g,Promise.all(SEA.map(async spec=>{let model,source=g;
   if(g!=='A')try{model=await loadGlb(`/assets/sea/${g}/${spec.id}.glb`);}catch{source='A';}
   return {model:model??buildSeaCreature(spec.id),source};})));
  return cache.get(g);
 }
 async function setGroup(g){
  if(g===group)return loading;group=g;
  loading=build(g).then(models=>{if(group!==g)return;creatures.forEach((c,i)=>{c.holder.clear();const m=models[i].model.clone();
   m.traverse(o=>{if(o.isMesh)o.material=swimmable(o.material,c.uniform);});m.scale.setScalar(c.spec.length);c.holder.add(m);c.source=models[i].source;});});
  return loading;
 }

 // Path: a loop around the buoy, eased out from where the animal landed.
 function loop(c,tau,out){
  const r=c.release,R=c.spec.radius+(r.r0-c.spec.radius)*Math.exp(-tau/6),a=r.a0+r.dir*c.spec.speed*tau/c.spec.radius;
  const w=R*(1+.1*Math.sin(2*a+c.i));out.set(center.x+Math.cos(a)*w,0,center.z+Math.sin(a)*w);return out;
 }
 // Leap kinematics: from depth D to apex h and back, axis height relative to the water.
 const leap=(D,h)=>{const vy=Math.sqrt(2*G*(h+D));return {vy,D,dur:2*vy/G,y:u=>-D+vy*u-G*u*u/2,dy:u=>vy-G*u,cross:[(vy-Math.sqrt(vy*vy-2*G*D))/G,(vy+Math.sqrt(vy*vy-2*G*D))/G]};};
 function throwArc(c){const s=c.spec;return leap(-s.rest*s.length,Math.min(2.5,Math.max(.8,.25*s.length)));}
 // Axis height (relative to water), its rate, roll and pitch scale at swim time tau.
 function vertical(c,tau){
  const s=c.spec,L=s.length,rest=s.rest*L,k=((tau%s.cycle)+s.cycle)%s.cycle;
  for(const ev of s.events){
   if(ev[0]==='leap'){const j=leap(-rest,ev[2]),u=k-ev[1];if(u>=0&&u<=j.dur)return {y:j.y(u),dy:j.dy(u),roll:(ev[3]||0)*smooth(.3,.8,u/j.dur),flat:ev[4]?.3:1};}
   else{const rise=Math.max(1.2,.25*L),u=k-ev[1],level=ev[3]*L;if(u>=0&&u<=2*rise+ev[2]){const b=u=>smooth(0,rise,u)*(1-smooth(rise+ev[2],2*rise+ev[2],u));return {y:rest+(level-rest)*b(u),dy:(level-rest)*(b(u+.02)-b(u-.02))/.04,roll:0,flat:1};}}
  }
  return {y:rest,dy:0,roll:0,flat:1};
 }
 const p1=new T.Vector3();
 // Swim around the rowboat instead of through it.
 function clear(c,p){const b=boat?.();if(!b)return p;const dx=p.x-b.x,dz=p.z-b.z,d=Math.hypot(dx,dz),r=.5*c.spec.length+1.8;if(d<r&&d>1e-3){p.x=b.x+dx/d*r;p.z=b.z+dz/d*r;}return p;}
 // World pose at time t; null before release.
 function pose(c,t,out={pos:new T.Vector3(),heading:new T.Vector3(),pitch:0,roll:0}){
  const r=c.release;if(!r||t<r.t)return null;const arc=r.arc,u=t-r.t,s=c.spec;
  let y,dy,speed;
  if(u<arc.dur){out.pos.copy(r.from).addScaledVector(r.n,r.vh*u);out.heading.copy(r.n);y=arc.y(u);dy=arc.dy(u);speed=r.vh;out.roll=0;out.flat=1;}
  else{const tau=u-arc.dur;clear(c,loop(c,tau,out.pos));clear(c,loop(c,tau+.05,p1));out.heading.subVectors(p1,out.pos).normalize();const v=vertical(c,tau);y=v.y;dy=v.dy;speed=s.speed;out.roll=v.roll;out.flat=v.flat;}
  sampleWater(out.pos.x,out.pos.z,t,wave);out.pos.y=wave.height+y;out.pitch=Math.max(-1.45,Math.min(1.45,Math.atan2(dy,speed)))*(out.flat??1);out.depth=y;return out;
 }
 // Surface events (splash rings and drops, spouts) with their world time, for the effects pass.
 function events(c,t){
  const r=c.release,list=[];if(!r)return list;const s=c.spec,L=s.length,size=.45*Math.sqrt(L);
  for(const k of r.arc.cross)list.push([r.t+k,'splash',size*1.3]);
  const start=r.t+r.arc.dur,tau=t-start,k0=Math.floor(tau/s.cycle);
  for(let k=k0-1;k<=k0;k++)for(const ev of s.events){const base=start+k*s.cycle+ev[1];if(base<start)continue;
   if(ev[0]==='leap'){const j=leap(-s.rest*L,ev[2]);for(const x of j.cross)list.push([base+x,'splash',size*(ev[4]?1.4:1)]);}
   else if(ev[4])list.push([base+Math.max(1.2,.25*L)*.9,'spout',L]);}
  return list.filter(e=>t-e[0]>=0&&t-e[0]<1.8);
 }
 const out={pos:new T.Vector3(),heading:new T.Vector3()},fx={pos:new T.Vector3(),heading:new T.Vector3()};
 function update(t){
  let d=0,ring=0;
  for(const c of creatures){
   const p=pose(c,t,out);c.holder.visible=!!p;if(!p)continue;
   if(!c.counted&&t>=c.release.t+c.release.arc.cross[1]){c.counted=true;onRelease?.(c.i);}
   c.holder.position.copy(p.pos);c.holder.rotation.set(p.roll,Math.atan2(-p.heading.z,p.heading.x),p.pitch,'YZX');
   c.uniform.value.x=t*c.spec.beat*Math.PI*2*(p.depth>0?.4:1);
   for(const [at,kind,size] of events(c,t)){const age=t-at,e=pose(c,at,fx);if(!e)continue;sampleWater(e.pos.x,e.pos.z,t,wave);const base=wave.height;
    if(kind==='splash'&&ring<rings.length){const m=rings[ring++];m.visible=true;m.position.set(e.pos.x,base+.04,e.pos.z);m.scale.setScalar(size*(.6+2.6*age));m.material.opacity=.5*(1-age/1.8);}
    const n=kind==='spout'?40:28;
    for(let i=0;i<n&&d<drops.count;i++){const a=i*2.39996+at,h=hash(i+at*13.7);
     let x,y,z,sc;
     if(kind==='spout'){const sp=.35+.5*h,up=Math.sqrt(size)*(2.6+1.2*hash(i*3.1));x=Math.cos(a)*sp*age;z=Math.sin(a)*sp*age;y=.4*size*.1+up*age-2.2*age*age;sc=(.08+.1*h)*Math.sqrt(size)*.5*(1+age)*(1-age/1.8);}
     else{const sp=size*(.8+1.4*h),up=size*(2.2+2.5*hash(i*7.3));x=Math.cos(a)*sp*age;z=Math.sin(a)*sp*age;y=up*age-G*age*age/2;sc=(.05+.07*h)*size*(1-age/1.8);}
     if(y<-.1||sc<=0)continue;dummy.position.set(e.pos.x+x,base+y,e.pos.z+z);dummy.scale.setScalar(sc);dummy.updateMatrix();drops.setMatrixAt(d++,dummy.matrix);}
   }
  }
  drops.count=Math.max(d,0);drops.instanceMatrix.needsUpdate=true;if(d===0)drops.count=0;
  for(let i=ring;i<rings.length;i++)rings[i].visible=false;
 }
 // Release the next animal: it surfaces in a leap beside the boat, out to the side ahead of the rower.
 function release(t,boat,yaw){
  const c=creatures.find(c=>!c.release);if(!c)return null;const s=c.spec,arc=throwArc(c),side=c.i%2?1:-1;
  const fwd=new T.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),n=fwd.clone().multiplyScalar(.55).addScaledVector(right,.85*side).normalize();
  const from=new T.Vector3(boat.x,0,boat.z).addScaledVector(n,.5*s.length+2),vh=Math.max(3,s.speed*1.4),land=from.clone().addScaledVector(n,vh*arc.dur);
  c.release={t,from,n,vh,arc,r0:Math.hypot(land.x-center.x,land.z-center.z),a0:Math.atan2(land.z-center.z,land.x-center.x),dir:side};c.counted=false;
  return s;
 }
 function reset(){for(const c of creatures){c.release=null;c.counted=false;c.holder.visible=false;}}
 return {root,setGroup,update,release,reset,pose:(i,t)=>pose(creatures[i],t),get creatures(){return creatures;},get released(){return creatures.filter(c=>c.counted).map(c=>c.i);},get thrown(){return creatures.filter(c=>c.release).length;},get ready(){return loading;}};
}
