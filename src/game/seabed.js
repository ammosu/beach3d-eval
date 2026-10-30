import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {groundHeight,shore} from '../terrain.js';
import {asset} from '../url.js';

// What a diver finds on the seabed (game only): patches of reef along the way out and round the buoy, each with rocks,
// corals (branching, brain, fan), seaweed swaying in the swell, and tropical reef fish: schools of yellow tangs and
// blue tangs circling it, clownfish, butterflyfish and angelfish each pottering round its own coral head; all of them
// dart away from a diver swimming through. Models follow the group like the sea animals: A procedural (below), B
// assets/seabed/B/<id>.glb, C assets/seabed/C/<id>.glb; a missing GLB falls back to A per id. GLBs are normalised
// at load by the A models' rule (base at y 0, largest extent 1; fish: length 1, head +x, back +y). Placement, sizes
// and the motion are the same for every group: seeded, and a function of the water clock (the fish's scatter is
// the only state, eased from where the diver is). Drawn only while the camera is under the water.
// Fish species: length range (m), how they move (school: a group circling the patch; reef: one fish looping round a
// coral), how many per patch (scaled by the patch radius / 10).
export const FISH={
 fish_yellow:{name:'黃高鰭刺尾鯛',len:[.22,.3],kind:'school',count:16},
 fish_bluetang:{name:'藍倒吊',len:[.26,.36],kind:'school',count:11},
 fish_clown:{name:'小丑魚',len:[.13,.17],kind:'reef',count:7},
 fish_butterfly:{name:'蝴蝶魚',len:[.16,.22],kind:'reef',count:6},
 fish_angel:{name:'神仙魚',len:[.28,.38],kind:'reef',count:3},
};
export const SEABED_IDS=['rock','coral_branch','coral_brain','coral_fan','seaweed',...Object.keys(FISH)];
// [x, z, radius]: one patch every so often on the way from the dock to the buoy, and a big one round the buoy.
const PATCHES=[[10,-52,9],[-4,-92,10],[24,-140,11],[34,-200,12],[60,-286,22]];
// Per patch: how many of each (scaled by the patch radius) and their size range in metres (height; fish: length).
// Corals vary in colour per instance (multiplying the model's own colours): warm, pink, purple, yellow, blue-green.
const CORAL_TINTS=[[1,1,1],[1,.75,.6],[1,.6,.85],[.8,.6,1],[1,.95,.55],[.6,.95,1]];
const KINDS={rock:[.9,.7,2.2],coral_branch:[2.6,.4,1.2],coral_brain:[1.4,.35,.9],coral_fan:[1.1,.5,1.3],seaweed:[1.4,.8,2.4]};

const rnd=seed=>()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
function painted(g,colour){const c=new T.Color(),n=g.attributes.position.count,a=new Float32Array(n*3),p=g.attributes.position;for(let i=0;i<n;i++){colour(c,p.getX(i),p.getY(i),p.getZ(i));a.set([c.r,c.g,c.b],i*3);}g.setAttribute('color',new T.BufferAttribute(a,3));return g;}
function noise3(x,y,z){return Math.sin(x*3.1+y*1.7)*Math.cos(z*2.3-x*1.3)*.5+Math.sin(y*5.3+z*4.1)*.25;}
function strip(g){g.deleteAttribute('uv');g.deleteAttribute('normal');return g.index?g.toNonIndexed():g;}

// A: procedural models, each as one geometry with vertex colours, normalised like the GLBs.
function buildA(id){
 const r=rnd(id.length*7919+11),mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.75});
 let g;
 if(id==='rock'){
  g=new T.IcosahedronGeometry(.5,3);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),k=1+.28*noise3(v.x*2,v.y*2,v.z*2)+.1*noise3(v.x*7,v.y*7,v.z*7);v.multiplyScalar(k);v.y=v.y>0?v.y*.75:v.y*.3;p.setXYZ(i,v.x*(1+.2*Math.sign(v.x)),v.y,v.z);}
  g=painted(g,(c,x,y,z)=>c.setRGB(.36,.34,.3).lerp(new T.Color(.2,.32,.16),T.MathUtils.smoothstep(y,.05,.3)*(.6+.4*noise3(x*9,y*9,z*9))));
 }else if(id==='coral_branch'){
  const parts=[];const branch=(base,dir,len,rad,depth)=>{const c=new T.CylinderGeometry(rad*.6,rad,len,6,1);c.translate(0,len/2,0);c.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir)));c.translate(base.x,base.y,base.z);parts.push(strip(c));
   const tip=base.clone().addScaledVector(dir,len);if(depth<3)for(let k=0;k<3;k++){const d=dir.clone().add(new T.Vector3(r()-.5,.3,r()-.5).multiplyScalar(1.1)).normalize();branch(tip,d,len*(.6+.2*r()),rad*.65,depth+1);}else{const s=new T.SphereGeometry(rad*.9,6,4);s.translate(tip.x,tip.y,tip.z);parts.push(strip(s));}};
  for(let k=0;k<3;k++)branch(new T.Vector3((r()-.5)*.2,0,(r()-.5)*.2),new T.Vector3(r()-.5,1.4,r()-.5).normalize(),.32,.06,0);
  g=painted(mergeGeometries(parts),(c,x,y)=>c.setRGB(.95,.45,.4).lerp(new T.Color(1,.75,.6),y));
 }else if(id==='coral_brain'){
  g=new T.SphereGeometry(.5,40,20,0,Math.PI*2,0,Math.PI*.55);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),gro=Math.sin(v.x*38+Math.sin(v.z*20)*2.5)*Math.sin(v.z*31+v.y*12);v.multiplyScalar(1+.035*gro);v.y*=.8;p.setXYZ(i,v.x,v.y,v.z);}
  g=painted(g,(c,x,y,z)=>{const gro=Math.sin(x*38+Math.sin(z*20)*2.5)*Math.sin(z*31+y*12);c.setRGB(.72,.68,.32).multiplyScalar(.8+.25*gro);});
 }else if(id==='coral_fan'){
  g=new T.CircleGeometry(.5,24,0,Math.PI);g=g.toNonIndexed();const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setXYZ(i,x,y,.06*Math.sin(x*9)+.04*Math.cos(y*11));}
  const stem=strip(new T.CylinderGeometry(.015,.025,.1,5));stem.translate(0,-.05,0);g=mergeGeometries([strip(g),stem]);g.translate(0,.05,0);
  g=painted(g,(c,x,y)=>c.setRGB(.55,.2,.6).lerp(new T.Color(.85,.4,.75),y));mat.side=T.DoubleSide;
 }else if(id==='seaweed'){
  const blades=[];for(let k=0;k<5;k++){const b=new T.PlaneGeometry(.07+.04*r(),1,1,12);b.translate(0,.5,0);const p=b.attributes.position;const tw=r()*3,lean=(r()-.5)*.3;
   for(let i=0;i<p.count;i++){const y=p.getY(i),w=p.getX(i)*(1-.6*y)*(1+.4*Math.sin(y*9+k)),a=tw*y;p.setXYZ(i,w*Math.cos(a)+lean*y*y,y*(.75+.25*r()),w*Math.sin(a));}
   b.rotateY(k*1.3);b.translate((r()-.5)*.12,0,(r()-.5)*.12);blades.push(strip(b));}
  g=painted(mergeGeometries(blades),(c,x,y)=>c.setRGB(.18,.36,.12).lerp(new T.Color(.45,.55,.18),y));mat.side=T.DoubleSide;
 }else g=fishGeometry(id);
 g.computeVertexNormals();
 if(!FISH[id]){g.computeBoundingBox();const b=g.boundingBox;g.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);g.computeBoundingBox();const s=g.boundingBox,ext=Math.max(s.max.x-s.min.x,s.max.z-s.min.z,s.max.y-s.min.y);g.scale(1/ext,1/ext,1/ext);}
 return [{geometry:g,material:mat,matrix:new T.Matrix4()}];
}

// A fish body, length 1 along x with the head at +x: elliptical sections (height and width profiles), a tail fan and
// dorsal / anal fins as flat double-sided shapes, coloured by position. Per species: body depth, fins, colours.
function fishGeometry(id){
 const S={
  fish_yellow:{h:.36,w:.08,dorsal:[-.25,.25,.16],anal:[-.22,.15,.12],tail:.2,colour:(c,x,y)=>{c.setRGB(1,.86,.08);if(x>-.36&&x<-.3&&Math.abs(y)<.06)c.setRGB(1,1,.95);}},
  fish_bluetang:{h:.3,w:.08,dorsal:[-.28,.22,.08],anal:[-.22,.12,.06],tail:.2,colour:(c,x,y)=>{c.setRGB(.1,.3,.9);if(y>.02&&y<.11&&x>-.25&&x<.25&&Math.abs(y-.06-.1*Math.sin(x*6))<.04)c.setRGB(.02,.04,.12);if(x<-.33)c.setRGB(1,.85,.1);if(y>.17)c.setRGB(.02,.05,.15);}},
  fish_clown:{h:.27,w:.12,dorsal:[-.2,.2,.08],anal:[-.18,.05,.07],tail:.16,colour:(c,x)=>{c.setRGB(1,.42,.05);for(const b of [.3,0,-.3]){const d=Math.abs(x-b);if(d<.06)c.setRGB(.98,.98,.95);else if(d<.08)c.setRGB(.05,.05,.05);}}},
  fish_butterfly:{h:.4,w:.06,dorsal:[-.25,.18,.06],anal:[-.22,.12,.05],tail:.14,colour:(c,x,y)=>{c.setRGB(.98,.96,.88).lerp(new T.Color(1,.82,.1),T.MathUtils.smoothstep(-x,0,.35));if(Math.abs(x-.3)<.04&&y>-.15)c.setRGB(.05,.05,.05);if(Math.abs(y+.04+.6*(x-.05))<.02&&x<.15)c.setRGB(.2,.2,.25);}},
  fish_angel:{h:.42,w:.06,dorsal:[-.3,.1,.45],anal:[-.28,.08,.42],tail:.18,colour:(c,x,y)=>{c.setRGB(.15,.25,.75);if(Math.sin((x*.9+y*.4)*34)>.2)c.setRGB(1,.85,.15);if(x>.3)c.setRGB(.1,.15,.5);}},
 }[id];
 const N=14,M=18,pos=[],idx=[],x0=-.33,x1=.5;
 for(let i=0;i<=M;i++){const t=i/M,x=x0+(x1-x0)*t,k=Math.pow(Math.sin(Math.PI*Math.min(1,t*.92+.04)),.75),hh=S.h/2*k*(1-.25*t*t),ww=S.w/2*Math.pow(k,.9);
  for(let j=0;j<N;j++){const a=j/N*Math.PI*2;pos.push(x,Math.sin(a)*hh,Math.cos(a)*ww);}}
 for(let i=0;i<M;i++)for(let j=0;j<N;j++){const a=i*N+j,b=i*N+(j+1)%N,c=a+N,d=b+N;idx.push(a,c,b,b,c,d);}
 const body=new T.BufferGeometry();body.setAttribute('position',new T.Float32BufferAttribute(pos,3));body.setIndex(idx);
 const flat=pts=>{const g=new T.BufferGeometry(),p=[];for(let i=1;i<pts.length-1;i++)p.push(...pts[0],0,...pts[i],0,...pts[i+1],0);g.setAttribute('position',new T.Float32BufferAttribute(p,3));return g;};
 const top=x=>S.h/2*Math.pow(Math.sin(Math.PI*Math.min(1,((x-x0)/(x1-x0))*.92+.04)),.75)*.92;
 const [d0,d1,dh]=S.dorsal,[a0,a1,ah]=S.anal;
 const parts=[body.toNonIndexed(),flat([[-.31,0],[-.5,S.tail],[-.45,0],[-.5,-S.tail]]),
  flat([[d0,top(d0)],[d1,top(d1)],[d0+(d1-d0)*.35,top(d0)+dh],[d0-.04,top(d0)+dh*.7]]),
  flat([[a0,-top(a0)],[a1,-top(a1)],[a0+(a1-a0)*.35,-top(a0)-ah],[a0-.04,-top(a0)-ah*.7]])];
 const g=mergeGeometries(parts);g.translate(-.0,0,0);
 // Eyes: a dark spot near the head on both sides.
 return painted(g,(c,x,y,z)=>{S.colour(c,x,y,z);if(Math.hypot(x-.38,y-.03)<.035&&Math.abs(z)>.005)c.setRGB(.02,.02,.02);});
}

// Seabed materials (every group alike): the swell moves seaweed and fish (instance-varied phase from where each
// stands; the water clock drives it), and everything glows a little in its own colour (a quarter of its albedo), so
// the reef keeps its colours under the blue-green filtered light instead of sinking into the water's haze.
function prepare(material,kind){
 const m=material.clone();
 m.onBeforeCompile=s=>{s.uniforms.time=clockUniform;s.vertexShader='uniform float time;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  float seabedPhase=instanceMatrix[3].x*.9+instanceMatrix[3].z*.6;
  #else
  float seabedPhase=0.;
  #endif
  ${kind==='seaweed'?`float sway=transformed.y*transformed.y;
  transformed.x+=(sin(time*.9+seabedPhase)*.16+sin(time*2.3+seabedPhase*1.7+transformed.y*3.)*.04)*sway;
  transformed.z+=cos(time*.7+seabedPhase*1.3)*.1*sway;`:kind==='fish'?`float tail=clamp((.2-transformed.x)/.7,0.,1.);
  transformed.z+=sin(time*9.+seabedPhase*5.-transformed.x*6.)*.09*tail*tail;`:''}`);
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=diffuseColor.rgb*.25;');};
 m.customProgramCacheKey=()=>'seabed-'+kind;return m;
}
let clockUniform=null;

// A GLB as instancing parts, normalised by the same rule as the A models (whatever the file's own scale): fish
// centred with length (x) 1; everything else base at y 0, centred, largest extent 1.
async function loadGlb(url,fish){
 const gltf=await new GLTFLoader().loadAsync(asset(url));const root=gltf.scene;root.updateMatrixWorld(true);const parts=[];
 root.traverse(o=>{if(o.isMesh)parts.push({geometry:o.geometry,material:o.material,matrix:o.matrixWorld.clone()});});
 if(!parts.length)throw Error('empty');
 const box=new T.Box3().setFromObject(root,true),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
 const k=1/(fish?size.x:Math.max(size.x,size.y,size.z)),fit=new T.Matrix4().makeScale(k,k,k).multiply(new T.Matrix4().makeTranslation(-c.x,fish?-c.y:-box.min.y,-c.z));
 for(const p of parts)p.matrix.premultiply(fit);
 return parts;
}

export function createSeabed({scene,clock}){
 clockUniform=clock;
 const root=new T.Group();root.name='seabed';root.visible=false;scene.add(root);
 // Placements (shared by all groups): position on the seabed, yaw, size, a tilt following nothing (the seabed here is
 // a gentle slope).
 const place={};for(const id of Object.keys(KINDS))place[id]=[];
 PATCHES.forEach(([cx,cz,radius],pi)=>{const r=rnd(1000+pi*37);
  for(const [id,[per,lo,hi]] of Object.entries(KINDS)){const n=Math.round(per*radius);
   for(let i=0;i<n;i++){const a=r()*Math.PI*2,d=radius*Math.sqrt(r())*(id==='rock'?.8:1),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;
    if(z-shore(x)>-12)continue;place[id].push({x,y:groundHeight(x,z)-(id==='rock'?.12:.03),z,yaw:r()*Math.PI*2,size:lo+(hi-lo)*r()**1.5,tint:.8+.4*r(),hue:Math.floor(r()*12)});}}});
 // Fish (shared by all groups): schools circle their patch, each fish holding its place in a loose ellipsoid round the
 // school's centre; reef fish loop round a coral head (a Lissajous figure, 0.5-1.4 m across). Each species' list
 // drives its own instanced mesh.
 const fish={};
 PATCHES.forEach(([cx,cz,radius],pi)=>{const r=rnd(5000+pi*101),scale=radius/10,corals=[...place.coral_branch,...place.coral_brain,...place.coral_fan].filter(p=>Math.hypot(p.x-cx,p.z-cz)<radius);
  for(const [id,sp] of Object.entries(FISH)){const list=fish[id]??=[],n=Math.max(sp.kind==='school'?6:1,Math.round(sp.count*scale));
   const school={cx,cz,radius:Math.min(6,radius*.4)*(.8+.4*r()),y:groundHeight(cx,cz)+1.2+1.2*r(),speed:.45+.25*r(),dir:r()<.5?1:-1,phase:r()*6.28};
   for(let k=0;k<n;k++){const len=sp.len[0]+(sp.len[1]-sp.len[0])*r(),flee=new T.Vector3();
    if(sp.kind==='school'){const u=(k+.5)/n,a=k*2.39996,rr=Math.sqrt(u);list.push({school,ox:Math.cos(a)*rr*1.6,oy:(r()-.5)*1.1,oz:Math.sin(a)*rr*1.6,lag:r()*.4,len,flee});}
    else{const c=corals.length?corals[Math.floor(r()*corals.length)]:{x:cx,y:groundHeight(cx,cz),z:cz,size:.6};list.push({anchor:{x:c.x,y:c.y+c.size*.7+.25,z:c.z},rx:.25+.45*r(),rz:.25+.45*r(),w:.25+.25*r(),p:r()*6.28,q:r()*6.28,len,flee});}}}});
 let meshes=[],fishMeshes={},group=null,loading=null;
 const m4=new T.Matrix4(),w4=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),sc=new T.Vector3(),push=new T.Vector3(),col=new T.Color();
 function build(id,parts){
  const list=FISH[id]?fish[id]:place[id];
  return parts.map(part=>{const material=prepare(part.material,id==='seaweed'?id:FISH[id]?'fish':'still');
   const mesh=new T.InstancedMesh(part.geometry,material,list.length);mesh.frustumCulled=false;mesh.userData.part=part.matrix;mesh.userData.id=id;
   if(!FISH[id])list.forEach((p,i)=>{m4.compose(v.set(p.x,p.y,p.z),q.setFromEuler(e.set(0,p.yaw,0)),sc.setScalar(p.size)).multiply(part.matrix);mesh.setMatrixAt(i,m4);mesh.setColorAt?.(i,id.startsWith('coral')?col.setRGB(...CORAL_TINTS[p.hue%CORAL_TINTS.length]).multiplyScalar(p.tint):col.setScalar(p.tint));});
   root.add(mesh);return mesh;});
 }
 async function setGroup(g){
  if(g===group)return loading;group=g;
  loading=(async()=>{const built=[];
   for(const id of SEABED_IDS){let parts;if(g!=='A'){try{parts=await loadGlb(`assets/seabed/${g}/${id}.glb`,!!FISH[id]);}catch{parts=null;}}
    built.push([id,parts||buildA(id),!parts]);}
   if(g!==group)return;
   for(const m of meshes)root.remove(m);meshes=[];fishMeshes={};
   for(const [id,parts,fallback] of built){const ms=build(id,parts);ms.forEach(m=>m.userData.fallback=fallback);meshes.push(...ms);if(FISH[id])fishMeshes[id]=ms;}
  })();
  return loading;
 }
 // Where a fish is at time t (before any scatter).
 function at(f,t,out){
  if(f.school){const s=f.school,a=s.phase+(t-f.lag)*s.speed/s.radius*s.dir,ca=Math.cos(a),sa=Math.sin(a);
   // The offset turns with the school (x along its way round, z outwards).
   const tx=-sa*s.dir,tz=ca*s.dir;return out.set(s.cx+ca*(s.radius+f.oz)+tx*f.ox,s.y+f.oy+.2*Math.sin(t*.6+f.lag*7),s.cz+sa*(s.radius+f.oz)+tz*f.ox);}
  const a=f.anchor,u=t*f.w;return out.set(a.x+f.rx*Math.sin(u+f.p),a.y+.12*Math.sin(u*1.7+f.q),a.z+f.rz*Math.sin(2*u+f.q));
 }
 // A diver within 2.5 m pushes a fish away fast (a quarter of a second); it drifts back over about two seconds.
 let lastT=null;const ahead=new T.Vector3();
 function update(t,under,diver){
  root.visible=under;if(!under){lastT=t;return;}
  const dt=lastT==null?0:Math.min(.1,Math.max(0,t-lastT));lastT=t;
  for(const [id,list] of Object.entries(fish)){const ms=fishMeshes[id];if(!ms)continue;
   list.forEach((f,i)=>{at(f,t,v);at(f,t+.08,ahead);
    if(diver){const dx=v.x-diver.x,dy=v.y-diver.y,dz=v.z-diver.z,d=Math.hypot(dx,dy,dz);push.set(dx,dy*.4,dz).normalize().multiplyScalar(d<2.5?(2.5-d)*1.4:0);}else push.set(0,0,0);
    f.flee.lerp(push,1-Math.exp(-dt/(push.lengthSq()>f.flee.lengthSq()?.25:2)));v.add(f.flee);ahead.add(f.flee);
    const hx=ahead.x-v.x,hy=ahead.y-v.y,hz=ahead.z-v.z;
    m4.compose(v,q.setFromEuler(e.set(0,Math.atan2(-hz,hx),T.MathUtils.clamp(Math.atan2(hy,Math.hypot(hx,hz)),-.5,.5),'YZX')),sc.setScalar(f.len));
    for(const m of ms)m.setMatrixAt(i,w4.multiplyMatrices(m4,m.userData.part));});
   for(const m of ms)m.instanceMatrix.needsUpdate=true;}
 }
 return {root,setGroup,update,get ready(){return loading;},get info(){return {group,patches:PATCHES,counts:Object.fromEntries(Object.entries(place).map(([k,v])=>[k,v.length])),fish:Object.fromEntries(Object.entries(fish).map(([k,v])=>[k,v.length])),fallback:Object.fromEntries(meshes.map(m=>[m.userData.id,m.userData.fallback]))};}};
}
