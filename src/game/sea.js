import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sampleWater,SEA_RINGS} from '../water.js';
import {buildSeaCreature} from './sea-a.js';
import {dropMaterial} from './splash.js';
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
const G=9.8,DROPS=1600;
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
 const wave={},cache=new Map();
 const creatures=SEA.map((spec,i)=>{const holder=new T.Group();root.add(holder);
  // Spread round the loop, alternate directions, stagger the surfacing.
  return {spec,i,holder,uniform:{value:new T.Vector4(0,spec.amp,spec.bend,0)},a0:i*2*Math.PI/SEA.length,dir:i%2?1:-1,offset:i*3.7,top:.1*spec.length,seen:false,startledAt:-100};});
 // Splash droplets, spout mist and foam rings: rebuilt every frame from the event times.
 // Drops and mist share the rowboat splashes' look (src/game/splash.js): camera-facing quads stretched along their
 // velocity, so a drop in flight reads as a short streak, and quads 0.1 m or wider drawn as a dim soft puff of mist.
 const geo=new T.InstancedBufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));geo.setIndex([0,1,2,0,2,3]);
 const iPos=new T.InstancedBufferAttribute(new Float32Array(DROPS*3),3),iVel=new T.InstancedBufferAttribute(new Float32Array(DROPS*3),3),iSize=new T.InstancedBufferAttribute(new Float32Array(DROPS*2),2);
 for(const a of [iPos,iVel,iSize])a.setUsage(T.DynamicDrawUsage);geo.setAttribute('iPos',iPos);geo.setAttribute('iVel',iVel);geo.setAttribute('iSize',iSize);geo.instanceCount=0;
 const drops=new T.Mesh(geo,dropMaterial());drops.frustumCulled=false;drops.renderOrder=4;root.add(drops);
 let d=0;const put=(x,y,z,vx,vy,vz,size,alpha)=>{if(d>=DROPS||alpha<=0)return;iPos.setXYZ(d,x,y,z);iVel.setXYZ(d,vx,vy,vz);iSize.setXY(d,size,alpha);d++;};
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
  const v=vertical(c,t+c.offset),dive=diveDepth(c,t);v.y-=dive;out.pitch=(v.pitch??Math.atan2(v.dy,s.speed))-dive*.5*Math.max(0,1-(t-c.startledAt)/1.2);out.roll=v.roll;
  sampleWater(out.pos.x,out.pos.z,t,wave);out.pos.y=wave.height+v.y;out.depth=v.y;out.showing=v.y+c.top>.15;return out;
 }
 // How big an animal's splash is: about a quarter of its length (a humpback 2.75, a dolphin 0.65), the same for A/B/C.
 const heft=c=>c.spec.length/4;
 // Startled (rowed at too fast): it slaps the water and dives about a body length deeper, back up after 6 s.
 function diveDepth(c,t){const age=t-c.startledAt;return age<0||age>7?0:(.8+.15*c.spec.length)*smooth(.15,1,age)*(1-smooth(4.5,7,age));}
 // Surface events with their world time: splashes (leaping out and back in, a tail slap), a back breaking the surface
 // as it comes up to breathe, spouts. size scales everything (drops, rings, foam, how far the spray carries).
 function events(c,t,window=null){
  const list=[],s=c.spec,L=s.length,size=heft(c),start=-c.offset,k0=Math.floor((t-start)/s.cycle);
  for(let k=k0-1;k<=k0;k++)for(const ev of s.events){const base=start+k*s.cycle+ev[1];
   if(ev[0]==='leap'){const j=leap(c,ev[2]);j.cross.forEach((x,n)=>list.push([base+x,'splash',size*(ev[4]?1.2:1)*(n?1:.6),c]));}
   else{const rise=Math.max(1.2,.25*L);list.push([base+rise*.7,'wash',size*.45,c]);if(ev[4])list.push([base+rise*.9,'spout',L,c]);}}
  if(c.startledAt>-100)list.push([c.startledAt+.15,'slap',size*.8,c]);
  const life=e=>e[1]==='spout'?1.8:3+3*e[2];
  return list.filter(e=>t-e[0]>=0&&t-e[0]<(window??life(e)));
 }
 // Rings spreading on the water from each splash or wash (x, z, time, size), for the water shader and the boat: the
 // biggest and newest first. Cached per time.
 let ringTime=null;const ringList=[];
 function rings(t){if(t===ringTime)return ringList;ringTime=t;ringList.length=0;
  for(const c of creatures)for(const e of events(c,t))if(e[1]!=='spout'){const p=pose(c,e[0],fx);ringList.push([p.pos.x,p.pos.z,e[0],e[2]]);}
  ringList.sort((a,b)=>b[3]/(1+t-b[2])-a[3]/(1+t-a[2]));ringList.length=Math.min(ringList.length,SEA_RINGS);return ringList;}
 // The same rings as a small lift of the water (metres) for the boat to ride: a packet of a few crests behind a front
 // that runs out faster and longer the bigger the splash. Shading only on the water itself (its mesh is too coarse).
 function swell(x,z,t){let h=0;for(const [rx,rz,at,size] of rings(t)){const age=t-at,dist=Math.hypot(x-rx,z-rz),lambda=.8+.6*size,front=(1.2+Math.sqrt(size))*age,q=dist-front;
  if(Math.abs(q)>2.5*lambda)continue;h+=.035*Math.min(size,2.5)*Math.exp(-age/(3+3*size))/(1+.12*dist)*Math.cos(q/lambda*6.2832)*Math.exp(-q*q/(lambda*lambda*1.5));}
  return h;}
 const out={pos:new T.Vector3(),heading:new T.Vector3()},fx={pos:new T.Vector3(),heading:new T.Vector3()};
 function update(t){
  d=0;
  for(const c of creatures){
   const p=pose(c,t,out);
   c.holder.position.copy(p.pos);c.holder.rotation.set(p.roll,Math.atan2(-p.heading.z,p.heading.x),p.pitch,'YZX');
   c.uniform.value.x=t*c.spec.beat*Math.PI*2;
   for(const [at,kind,size] of events(c,t,1.8+.6*heft(c))){if(kind==='wash')continue;const age=t-at,e=pose(c,at,fx);sampleWater(e.pos.x,e.pos.z,t,wave);const base=wave.height;
    if(kind==='spout'){
     // A blow: a column of mist rising fast and slowing, spreading and drifting as it thins, with fine drops falling out.
     // From the blowhole, about a third of the body ahead of the middle; about 3 m tall for a humpback.
     const life=2.6,u=age/life,lift=Math.sqrt(size)*.9,bx=e.pos.x+e.heading.x*.33*size,bz=e.pos.z+e.heading.z*.33*size;if(u>1)continue;
     for(let i=0;i<22;i++){const h=hash(i+at*7.1),k=i/22,y=lift*(1-Math.exp(-age*(2.2+1.4*k)))*(.08+1.02*k),spread=(.15+.5*age)*Math.sqrt(size)*.35;
      put(bx+Math.cos(i*2.4)*spread*h+.3*age,base+.2+y,bz+Math.sin(i*2.4)*spread*h,0,0,0,(.3+.6*age)*Math.sqrt(size)*.42*(.7+.6*h),.75*Math.min(1,age/.12)*(1-u)**1.6);}
     for(let i=0;i<30;i++){const h=hash(i+at*3.3),a=i*2.39996,up=lift*(1.6+1.2*h),sp=.4+.6*hash(i*5.1),vy=up-G*.45*age,y=up*age-G*.45*age*age/2;if(y<0)continue;
      put(bx+Math.cos(a)*sp*age,base+.2+y,bz+Math.sin(a)*sp*age,Math.cos(a)*sp,vy,Math.sin(a)*sp,.012+.012*h,.55*(1-u));}
     continue;}
    const life=1.8+.6*size,u=age/life;if(u>1)continue;
    // Spray: more and higher the bigger the splash; a breach throws a tall column as well as the spray round it.
    const n=Math.round(40+90*Math.min(size,3)),root=Math.sqrt(size);
    for(let i=0;i<n;i++){const a=i*2.39996+at,h=hash(i+at*13.7),column=i%3===0;
     const sp=(column?.25:.8+1.4*h)*root,up=(column?4.5+2*h:2.2+2.5*hash(i*7.3))*root*(kind==='slap'?.6:1),y=up*age-G*age*age/2;if(y<-.05)continue;
     put(e.pos.x+Math.cos(a)*sp*age,base+y,e.pos.z+Math.sin(a)*sp*age,Math.cos(a)*sp,up-G*age,Math.sin(a)*sp,(.025+.035*h)*(1-.5*u),.8*(1-u*u));}
    // Mist over a big splash: soft puffs that rise a little, swell and fade.
    if(size>.8)for(let i=0;i<7;i++){const h=hash(i+at*2.7),a=i*2.39996+at,r=root*(.3+.6*h)*(1+u);
     put(e.pos.x+Math.cos(a)*r,base+root*(.4+.5*h)+root*1.2*u,e.pos.z+Math.sin(a)*r,0,0,0,root*(.8+1.6*u)*(.7+.5*h),.22*Math.min(1,age/.15)*(1-u)**1.5);}
   }
  }
  // How many to draw this frame (the cap is DROPS; the old InstancedMesh used its count as the cap too, so after a
  // frame without drops no splash showed drops again).
  geo.instanceCount=d;for(const a of [iPos,iVel,iSize])a.needsUpdate=true;
  if(water){const u=water.material.uniforms.seaRings.value,list=rings(t);u.forEach((v,i)=>{const r=list[i];if(r)v.set(r[0],r[1],r[2],r[3]);else v.w=0;});}
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
   const effects=drops.visible;drops.visible=false;
   const shadows=renderer.shadowMap.autoUpdate,clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();renderer.shadowMap.autoUpdate=false;
   renderer.setRenderTarget(target);renderer.clear(true,true,true);renderer.render(root,camera);renderer.setRenderTarget(current);
   renderer.shadowMap.autoUpdate=shadows;renderer.setClearColor(clear,alpha);
   meshes.forEach((o,i)=>o.material=swap[i]);drops.visible=effects;
   u.seeInv.value.set(1/size.x,1/size.y);u.seeNear.value=camera.near;u.seeFar.value=camera.far;
  };
 }
 function observe(i){const c=creatures[i];if(c.seen)return false;c.seen=true;return true;}
 function reset(){for(const c of creatures){c.seen=false;c.startledAt=-100;}ringTime=null;}
 function startle(i,t){const c=creatures[i];if(t-c.startledAt<10)return false;c.startledAt=t;ringTime=null;return true;}
 return {root,setGroup,update,observe,reset,startle,swell,heft,events:(i,t,w)=>events(creatures[i],t,w).map(e=>e.slice(0,3)),pose:(i,t)=>pose(creatures[i],t),get creatures(){return creatures;},get seen(){return creatures.filter(c=>c.seen).map(c=>c.i);},get ready(){return loading;}};
}
