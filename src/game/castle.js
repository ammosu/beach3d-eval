import * as T from 'three';
import {groundHeight,shore} from '../terrain.js';
import {swashReach} from '../water.js';

// 1.1 m above the shore: normally exposed wet sand, within the maximum swash (swashReach(-20,t) reaches >2 m each cycle).
// West of the hut, clear of the ball's x=-4 route, boat's x=2 corridor, pool and tower.
export const CASTLE=Object.freeze({x:-20,z:shore(-20)+1.1});
const clamp=T.MathUtils.clamp,smooth=(a,b,t)=>T.MathUtils.smoothstep(t,a,b);
export function createCastle(scene,clock,objects){
 const root=new T.Group();root.name='extra-castle';root.position.set(CASTLE.x,groundHeight(CASTLE.x,CASTLE.z),CASTLE.z);scene.add(root);
 const washed={value:0},mat=new T.MeshStandardMaterial({color:0xbba279,roughness:.94,transparent:true});
 const washVertex=s=>{s.uniforms.washed=washed;s.vertexShader='uniform float washed;attribute vec3 rounded;varying vec3 sandAt;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 sandAt=position;transformed=mix(transformed,rounded,washed);transformed.y*=1.-.48*washed;transformed.xz*=1.+.18*washed;`);};
 mat.onBeforeCompile=s=>{washVertex(s);
 s.fragmentShader='varying vec3 sandAt;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=fract(sin(dot(floor(sandAt*480.),vec3(12.9,78.2,35.7)))*43758.5);
 float pats=.5+.5*sin(sandAt.y*93.+sin(sandAt.x*18.)*2.+sandAt.z*9.);
 diffuseColor.rgb*=.84+.25*grain+.055*pats;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.14,smoothstep(.15,.6,sandAt.y));`);};
 const pieces=new T.Group();root.add(pieces);
 function round(g){g.computeBoundingBox();const p=g.attributes.position,b=g.boundingBox,size=b.getSize(new T.Vector3()).multiplyScalar(.5),v=new T.Vector3(),a=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const r=Math.hypot(v.x/Math.max(.001,size.x),v.y/Math.max(.001,size.y),v.z/Math.max(.001,size.z));a.push(v.x/Math.max(1,r),v.y/Math.max(1,r),v.z/Math.max(1,r));}g.setAttribute('rounded',new T.Float32BufferAttribute(a,3));return g;}
 function add(g,y){round(g);const m=new T.Mesh(g,mat);m.userData.baseY=y;m.position.y=y;m.receiveShadow=true;pieces.add(m);return m;}
 // Low sand foundation, a continuous low wall, and a single gently tapered tower.
 add(new T.CylinderGeometry(.73,.88,.12,40),.06,.12);
 add(new T.CylinderGeometry(.3,.38,.58,32,5),.35,.58);
 const wall=new T.Mesh(new T.TorusGeometry(.66,.11,10,48),mat);wall.rotation.x=Math.PI/2;wall.scale.z=1.25;wall.userData.baseY=.16;wall.position.y=.16;wall.geometry.setAttribute('rounded',wall.geometry.attributes.position.clone());pieces.add(wall);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,m=add(new T.BoxGeometry(.13,.09,.12),.67,.09);m.position.x=Math.sin(a)*.235;m.position.z=Math.cos(a)*.235;}
 const mound=new T.Mesh(new T.SphereGeometry(.37,20,10),new T.MeshStandardMaterial({color:0xbba279,roughness:.95}));mound.scale.set(1,.15,1);mound.position.y=.025;root.add(mound);
 // Whitewater lives on a separate, sand-following patch; it does not change the water shader.
 const foamMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{age:{value:-1}},vertexShader:'varying vec2 q;void main(){q=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 q;uniform float age;void main(){float r=length(q),n=fract(sin(dot(floor(q*55.),vec2(12.98,78.23)))*43758.5);float a=(1.-smoothstep(.7,1.,r))*(.2+.8*n)*sin(clamp(age/4.,0.,1.)*3.14159)*.52;gl_FragColor=vec4(.94,.97,.93,a);}`});
 const foam=new T.Mesh(new T.PlaneGeometry(2.7,2.7,8,8),foamMat);foam.rotation.x=-Math.PI/2;foam.position.y=.025;root.add(foam);const fp=foam.geometry.attributes.position;for(let i=0;i<fp.count;i++)fp.setZ(i,-(groundHeight(CASTLE.x+fp.getX(i),CASTLE.z-fp.getY(i))-root.position.y));
 let startedAt=null,washedAt=null,lastPuff=-1,custom=null,customMats=[],front=null;const holders=new Map();
 const point=root.position.clone(),stand=point.clone().add(new T.Vector3(0,0,.99));stand.y=groundHeight(stand.x,stand.z);
 const height=t=>{const a=clamp(t-startedAt,0,6),n=Math.min(2,Math.floor(a/2));return .22+.26*(n+smooth(0,1.6,a-n*2));};
 function stage(t=clock.value){return washedAt!==null&&t>=washedAt?(t-washedAt<4?'washing':'idle'):startedAt===null?'idle':t<startedAt+6?'building':'built';}
 // B/C castle: the model keeps its own materials, patched with the same wash; scaled by the shared fit rule (height .72, footprint 1.7).
 // Where the hands go is measured on the model: rays from the front at x = ±.17, at the procedural wall's height and lower; the frontmost hit wins (a ray through a gate would reach the keep).
 // The squat spot keeps the procedural castle's distance (.33 m) in front of the measured wall.
 function place(){stand.z=point.z+(front?(front[0].z+front[1].z)/2:.66)+.33;stand.y=groundHeight(stand.x,stand.z);}
 function setGroup(model){if(custom){root.remove(custom);custom=null;customMats=[];front=null;}if(!model){place();return update(clock.value);}
  if(!holders.has(model)){const g=model.clone(),b=new T.Box3().setFromObject(g),s=Math.min(.72/(b.max.y-b.min.y),1.7/Math.max(b.max.x-b.min.x,b.max.z-b.min.z));g.scale.setScalar(s);g.position.set(-(b.min.x+b.max.x)*s/2,-b.min.y*s,-(b.min.z+b.max.z)*s/2);const holder=new T.Group(),mats=[];holder.add(g);
   g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.geometry=round(o.geometry.clone());o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const c=m.clone();c.transparent=true;c.onBeforeCompile=washVertex;c.customProgramCacheKey=()=>'castle-wash';mats.push(c);return c;});if(o.material.length===1)o.material=o.material[0];}});
   holder.updateMatrixWorld(true);const ray=new T.Raycaster(),top=new T.Box3().setFromObject(holder).max.y,hits=[-1,1].map(side=>{let best=null;for(const k of [1,.75,.5,.3]){const y=k*Math.min(.297,.85*top);ray.set(new T.Vector3(side*.17,y,3),new T.Vector3(0,0,-1));const h=ray.intersectObject(holder,true)[0];if(h&&(!best||h.point.z>best.z+.03))best={y,z:h.point.z};}return best||{y:.297,z:.66};});
   holders.set(model,{holder,mats,front:hits});}
  const h=holders.get(model);custom=h.holder;customMats=h.mats;front=h.front;root.add(custom);place();update(clock.value);}
 function update(t){const s=stage(t),age=washedAt===null?-1:t-washedAt,w=age<0?0:smooth(0,4,age);washed.value=w;mat.opacity=1-smooth(.5,1,w);for(const m of customMats)m.opacity=mat.opacity;mound.visible=s==='idle';pieces.visible=s!=='idle'&&!custom;
  const growth=startedAt===null?0:height(t);pieces.scale.set(1,growth,1);pieces.position.y=-.48*w;for(const m of pieces.children)m.position.y=m.userData.baseY*(1-.48*w);
  if(custom){custom.visible=s!=='idle';custom.scale.set(1,growth,1);custom.position.y=-.48*w;}
  foam.visible=age>=0&&age<4;foamMat.uniforms.age.value=age;foam.position.z=age<0?0:(swashReach(CASTLE.x,t)-1.1)*.22;
  const p=startedAt===null?-1:Math.min(2,Math.floor((t-startedAt)/2));if(s==='building'&&p>=0&&p!==lastPuff){lastPuff=p;objects.puff(point.x,point.z,startedAt+p*2,.35);}}
 return {point,stand,setGroup,update,stage,height,get info(){return {stage:stage(),startedAt,washedAt,visible:stage()!=='idle',swash:swashReach(CASTLE.x,clock.value)};},start(t){startedAt=t;washedAt=null;lastPuff=-1;},wash(t){washedAt=t;},reset(){startedAt=washedAt=null;lastPuff=-1;update(clock.value);},surface(t,side){const f=front?.[side<0?0:1];return new T.Vector3(point.x+side*.17,point.y+(f?f.y:.297)*height(t),point.z+(f?f.z:.66));}};
}
