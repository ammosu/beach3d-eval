import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sampleWater} from '../water.js';
import {buildSeaCreature} from './sea-a.js';
import {asset} from '../url.js';

// Open-sea animals that live in the beach scene around the island buoy, there from the start for the rower to watch. Out
// of the water they show what a rower would see: dorsal fins, backs rolling out to breathe, spouts, leaps. Under it the
// water lets them through by its thickness in front of them (a depth pass of the animals alone feeds the water shader).
// Everything is a function of the water clock.
// length: display length in metres, shared by A/B/C (models are normalised to length 1, head +x, back +y).
// rest: body-axis height between events, as a fraction of length (fin cruisers keep the dorsal fin out).
// bend: 1 tail side to side, 2 flukes up and down, 3 wing flap, 4 flipper strokes.
// note: the line shown when the player observes it.
// events per cycle: ['surf', start, hold, level, spout] rises to level and rolls back; ['leap', start, apex, roll, flat].
// Events must not overlap and must end within the cycle (surf: 2·max(1.2, .25·length) + hold; leap: see leap()).
export const SEA=[
 {id:'shark',name:'大白鯊',length:4.2,speed:2.4,radius:8,bend:1,amp:.05,beat:1.3,rest:-.1,cycle:24,note:'背鰭劃開水面',events:[['leap',16,1.4]]},
 {id:'hammerhead',name:'槌頭鯊',length:4,speed:2.1,radius:10,bend:1,amp:.05,beat:1.4,rest:-.1,cycle:22,note:'背鰭貼著水面巡游',events:[]},
 {id:'humpback',name:'座頭鯨',length:11,speed:2.2,radius:13,bend:2,amp:.035,beat:.3,rest:-.3,cycle:24,note:'浮上來換氣，噴出一道水霧',events:[['surf',2,3,-.05,1],['surf',11,2,-.05,1],['leap',19.5,3.2,1.4]]},
 {id:'orca',name:'虎鯨',length:6.5,speed:3.2,radius:10,bend:2,amp:.04,beat:.6,rest:-.28,cycle:15,note:'黑白的背脊翻出水面',events:[['surf',1,1.5,-.04,1],['surf',6,1.5,-.04,1],['leap',11,2.2]]},
 {id:'dolphin',name:'海豚',length:2.6,speed:4.2,radius:7,bend:2,amp:.05,beat:1.5,rest:-.5,cycle:7,note:'一路跳出水面',events:[['leap',.5,1.3],['leap',2.3,.9],['leap',4.1,1.1]]},
 {id:'turtle',name:'海龜',length:1.4,speed:.9,radius:5,bend:4,amp:.3,beat:.55,rest:-.8,cycle:12,note:'探出頭來換氣',events:[['surf',1,7,.14,0]]},
 {id:'manta',name:'蝠鱝',length:3.6,speed:1.6,radius:8,bend:3,amp:.12,beat:.35,rest:-.12,cycle:12,note:'翼尖劃過水面',events:[['leap',6,1.6,0,1]]},
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
function swimmable(material,uniform,key='sea-swim'){
 const m=material.clone();m.onBeforeCompile=shader=>{shader.uniforms.uSwim=uniform;shader.vertexShader='uniform vec4 uSwim;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+BEND);};
 m.customProgramCacheKey=()=>key;return m;
}
// GLB (B/C) → one group in the shared frame; transforms baked so the bend sees model-space x.
async function loadGlb(url){
 const gltf=await new GLTFLoader().loadAsync(asset(url)),root=new T.Group();gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{if(o.isMesh){const m=new T.Mesh(o.geometry.clone().applyMatrix4(o.matrixWorld),o.material);root.add(m);}});
 const box=new T.Box3().setFromObject(root);if(box.isEmpty())throw Error('Empty model');
 const size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
 for(const m of root.children){m.geometry.translate(-c.x,-c.y,-c.z).scale(1/size.x,1/size.x,1/size.x);}
 return root;
}

export function createSea(scene,{center,boat,water}){
 const root=new T.Group();root.name='open-sea';scene.add(root);
 const wave={},cache=new Map(),dummy=new T.Object3D();
 const creatures=SEA.map((spec,i)=>{const holder=new T.Group();root.add(holder);
  // Spread round the loop, alternate directions, stagger the surfacing.
  return {spec,i,holder,uniform:{value:new T.Vector4(0,spec.amp,spec.bend,0)},a0:i*2*Math.PI/SEA.length,dir:i%2?1:-1,offset:i*3.7,top:.1*spec.length,seen:false};});
 // Splash droplets, spout mist and foam rings: rebuilt every frame from the event times.
 const drops=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:0xffffff,roughness:.25,transparent:true,opacity:.9}),600);drops.frustumCulled=false;root.add(drops);
 const ringGeo=new T.RingGeometry(.86,1,48).rotateX(-Math.PI/2),rings=Array.from({length:24},()=>{const m=new T.Mesh(ringGeo,new T.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}));m.visible=false;root.add(m);return m;});
 let group=null,loading=null;

 async function build(g){
  if(!cache.has(g))cache.set(g,Promise.all(SEA.map(async spec=>{let model,source=g;
   if(g!=='A')try{model=await loadGlb(`assets/sea/${g}/${spec.id}.glb`);}catch{source='A';}
   return {model:model??buildSeaCreature(spec.id),source};})));
  return cache.get(g);
 }
 async function setGroup(g){
  if(g===group)return loading;group=g;
  loading=build(g).then(models=>{if(group!==g)return;creatures.forEach((c,i)=>{c.holder.clear();const m=models[i].model.clone();
   m.traverse(o=>{if(o.isMesh){o.userData.depthMaterial=swimmable(new T.MeshDepthMaterial({side:o.material.side}),c.uniform,'sea-swim-depth');o.material=swimmable(o.material,c.uniform);}});m.scale.setScalar(c.spec.length);c.top=new T.Box3().setFromObject(m).max.y;c.holder.add(m);c.source=models[i].source;});});
  return loading;
 }

 // Path: a loop around the buoy.
 function loop(c,t,out){
  const R=c.spec.radius,a=c.a0+c.dir*c.spec.speed*t/R;
  const w=R*(1+.1*Math.sin(2*a+c.i));out.set(center.x+Math.cos(a)*w,0,center.z+Math.sin(a)*w);return out;
 }
 // Leap kinematics: a ballistic arc from below the body's half length (so the steep start and end stay deep under the
 // water) to apex h; the first and last half second ease height to rest and pitch to level. Axis height is relative to the water.
 function leap(c,h){
  const L=c.spec.length,rest=c.spec.rest*L,D=Math.max(-rest,.5*L+.3),vy=Math.sqrt(2*G*(h+D)),dur=2*vy/G,q=Math.sqrt(vy*vy-2*G*D);
  const ease=u=>Math.max(0,1-u/.5)**2+Math.max(0,1-(dur-u)/.5)**2,y=u=>-D+vy*u-G*u*u/2+(D+rest)*ease(u);
  const level=u=>Math.max(0,Math.min(1,u/.5,(dur-u)/.5));
  // Pitch turns over at a steady rate (a low, slow body would otherwise flip nose-down at the apex in one frame).
  return {dur,y,pitch:(u,speed)=>Math.min(1.2,Math.atan2(vy,speed))*(1-2*u/dur)*level(u),cross:[(vy-q)/G,(vy+q)/G]};
 }
 // Axis height (relative to water), its rate, roll and pitch scale at swim time tau.
 function vertical(c,tau){
  const s=c.spec,L=s.length,rest=s.rest*L,k=((tau%s.cycle)+s.cycle)%s.cycle;
  for(const ev of s.events){
   if(ev[0]==='leap'){const j=leap(c,ev[2]),u=k-ev[1];if(u>=0&&u<=j.dur)return {y:j.y(u),pitch:j.pitch(u,s.speed)*(ev[4]?.3:1),roll:(ev[3]||0)*smooth(.3,.8,u/j.dur)};}
   else{const rise=Math.max(1.2,.25*L),u=k-ev[1],level=ev[3]*L;if(u>=0&&u<=2*rise+ev[2]){const b=u=>smooth(0,rise,u)*(1-smooth(rise+ev[2],2*rise+ev[2],u));return {y:rest+(level-rest)*b(u),dy:(level-rest)*(b(u+.02)-b(u-.02))/.04,roll:0};}}
  }
  return {y:rest,dy:0,roll:0};
 }
 const p1=new T.Vector3();
 // Swim around the rowboat instead of through it.
 function clear(c,p){const b=boat?.();if(!b)return p;const dx=p.x-b.x,dz=p.z-b.z,d=Math.hypot(dx,dz),r=.5*c.spec.length+1.8;if(d<r&&d>1e-3){p.x=b.x+dx/d*r;p.z=b.z+dz/d*r;}return p;}
 // World pose at time t. depth: axis height above the water; showing: the top of the model (top, per group) is at least
 // 15 cm out of the water, so fin cruisers always, the rest while surfacing or leaping.
 function pose(c,t,out={pos:new T.Vector3(),heading:new T.Vector3(),pitch:0,roll:0}){
  const s=c.spec;clear(c,loop(c,t,out.pos));clear(c,loop(c,t+.05,p1));out.heading.subVectors(p1,out.pos).normalize();
  const v=vertical(c,t+c.offset);out.pitch=v.pitch??Math.atan2(v.dy,s.speed);out.roll=v.roll;
  sampleWater(out.pos.x,out.pos.z,t,wave);out.pos.y=wave.height+v.y;out.depth=v.y;out.showing=v.y+c.top>.15;return out;
 }
 // Surface events (splash rings and drops, spouts) with their world time, for the effects pass.
 function events(c,t){
  const list=[],s=c.spec,L=s.length,size=.45*Math.sqrt(L),start=-c.offset,k0=Math.floor((t-start)/s.cycle);
  for(let k=k0-1;k<=k0;k++)for(const ev of s.events){const base=start+k*s.cycle+ev[1];
   if(ev[0]==='leap'){const j=leap(c,ev[2]);for(const x of j.cross)list.push([base+x,'splash',size*(ev[4]?1.4:1)]);}
   else if(ev[4])list.push([base+Math.max(1.2,.25*L)*.9,'spout',L]);}
  return list.filter(e=>t-e[0]>=0&&t-e[0]<1.8);
 }
 const out={pos:new T.Vector3(),heading:new T.Vector3()},fx={pos:new T.Vector3(),heading:new T.Vector3()};
 function update(t){
  let d=0,ring=0;
  for(const c of creatures){
   const p=pose(c,t,out);
   c.holder.position.copy(p.pos);c.holder.rotation.set(p.roll,Math.atan2(-p.heading.z,p.heading.x),p.pitch,'YZX');
   c.uniform.value.x=t*c.spec.beat*Math.PI*2;
   for(const [at,kind,size] of events(c,t)){const age=t-at,e=pose(c,at,fx);sampleWater(e.pos.x,e.pos.z,t,wave);const base=wave.height;
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
 // Before the water draws: the animals alone into a depth texture from the same camera (wrapping Water.js's own
 // callback, which renders the reflection), so the water shader can tell how much water lies in front of each one.
 if(water){
  const target=new T.WebGLRenderTarget(1,1,{depthTexture:new T.DepthTexture(1,1)}),u=water.material.uniforms,size=new T.Vector2(),meshes=[];
  u.seeDepth.value=target.depthTexture;
  const mirror=water.onBeforeRender;
  water.onBeforeRender=function(renderer,scene,camera,...rest){
   mirror.call(this,renderer,scene,camera,...rest);
   const current=renderer.getRenderTarget();
   if(current)size.set(current.width,current.height);else renderer.getDrawingBufferSize(size);
   if(target.width!==size.x||target.height!==size.y)target.setSize(size.x,size.y);
   meshes.length=0;root.traverseVisible(o=>{if(o.isMesh&&o.userData.depthMaterial)meshes.push(o);});
   u.seeOn.value=meshes.length?1:0;if(!meshes.length)return;
   const swap=meshes.map(o=>o.material);meshes.forEach(o=>o.material=o.userData.depthMaterial);
   const effects=[drops.visible,rings.map(r=>r.visible)];drops.visible=false;rings.forEach(r=>r.visible=false);
   const shadows=renderer.shadowMap.autoUpdate,clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();renderer.shadowMap.autoUpdate=false;
   renderer.setRenderTarget(target);renderer.clear(true,true,true);renderer.render(root,camera);renderer.setRenderTarget(current);
   renderer.shadowMap.autoUpdate=shadows;renderer.setClearColor(clear,alpha);
   meshes.forEach((o,i)=>o.material=swap[i]);drops.visible=effects[0];rings.forEach((r,i)=>r.visible=effects[1][i]);
   u.seeInv.value.set(1/size.x,1/size.y);u.seeNear.value=camera.near;u.seeFar.value=camera.far;
  };
 }
 function observe(i){const c=creatures[i];if(c.seen)return false;c.seen=true;return true;}
 function reset(){for(const c of creatures)c.seen=false;}
 return {root,setGroup,update,observe,reset,pose:(i,t)=>pose(creatures[i],t),get creatures(){return creatures;},get seen(){return creatures.filter(c=>c.seen).map(c=>c.i);},get ready(){return loading;}};
}
