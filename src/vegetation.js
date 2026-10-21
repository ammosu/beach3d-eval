import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Tropical island vegetation for the shared landforms (src/coast.js): broadleaf trees, coconut palms and shrubs.
// Every shape and placement comes from fixed seeds, so the scene is the same on every load and in every group.
// Crowns are lumpy clumps of a few displaced blobs, darker underneath and inside, with a leaf-cluster pattern in
// the shader near the camera; the hue comes from the instance colour. Palms are a curved, tapering trunk with
// drooping feather fronds. Everything is instanced and shared by both islands: a handful of draw calls in all.
const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const hash3=(v,salt)=>{const h=Math.sin(v.x*12.9898+v.y*78.233+v.z*37.719+salt)*43758.5453;return h-Math.floor(h);};

// A crown: k blobs spread over a dome, each displaced as a function of direction (so shared corners stay shared),
// smooth-shaded, with normals bent away from the crown's centre (soft, like a mass of leaves).
function crownGeometry(seed,detail,k){
 const r=rng(seed),parts=[];
 for(let i=0;i<k;i++){
  let g=new THREE.IcosahedronGeometry(1,detail);g.deleteAttribute('uv');g.deleteAttribute('normal');g=mergeVertices(g);
  const a=r()*Math.PI*2,d=i?.3+r()*.42:0,s=(i?.34+r()*.22:.55+r()*.1)*(k>5?.9:1.15),salt=r()*100,tint=.8+r()*.4;
  const c=new THREE.Vector3(Math.cos(a)*d,i?.22-d*.45+r()*.2:.22,Math.sin(a)*d),p=g.attributes.position,v=new THREE.Vector3();
  for(let j=0;j<p.count;j++){v.fromBufferAttribute(p,j);const bump=1+(hash3(v,salt)-.5)*.5;v.multiplyScalar(s*bump).add(c);p.setXYZ(j,v.x,v.y,v.z);}
  g.setAttribute('tint',new THREE.Float32BufferAttribute(new Array(p.count).fill(tint),1));parts.push(g);
 }
 const g=mergeGeometries(parts);g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal,tint=g.attributes.tint,box=new THREE.Box3().setFromBufferAttribute(p),center=new THREE.Vector3(0,box.min.y*.4,0),colors=[],v=new THREE.Vector3(),nn=new THREE.Vector3();
 for(let j=0;j<p.count;j++){
  v.fromBufferAttribute(p,j);nn.fromBufferAttribute(n,j).lerp(v.clone().sub(center).normalize(),.55).normalize();n.setXYZ(j,nn.x,nn.y,nn.z);
  // Darker underneath and inside (self-shadowed leaves), lighter where the top catches the sky, and speckled.
  const h=(v.y-box.min.y)/(box.max.y-box.min.y),shade=(.48+.64*h)*tint.getX(j)*(.84+.28*hash3(v,seed));
  colors.push(shade*.92,shade,shade*.85);
 }
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.deleteAttribute('tint');
 return g;
}

// A coconut palm, height 1 (scaled per instance): the trunk curves towards +x, fronds arch and droop.
function palmGeometry(seed){
 const r=rng(seed),pos=[],col=[],idx=[];
 const bend=.12+r()*.16,sides=6,rings=9,trunkAt=t=>new THREE.Vector3(bend*t*t,t,0),top=trunkAt(1);
 for(let i=0;i<=rings;i++){const t=i/rings,c=trunkAt(t),rad=.028-.012*t,ring=.78+.22*Math.abs(Math.sin(i*2.7));
  for(let s=0;s<sides;s++){const a=s/sides*Math.PI*2;pos.push(c.x+Math.cos(a)*rad,c.y,c.z+Math.sin(a)*rad);const k=.38*ring;col.push(k*1.02,k*.95,k*.82);}}
 for(let i=0;i<rings;i++)for(let s=0;s<sides;s++){const a=i*sides+s,b=i*sides+(s+1)%sides;idx.push(a,b,a+sides,b,b+sides,a+sides);}
 let base=pos.length/3;const fronds=9+Math.floor(r()*4),segs=10;
 for(let f=0;f<fronds;f++){
  const yaw=f/fronds*Math.PI*2+r()*.4,lift=.45-r()*.85,len=.3+r()*.1,old=lift<-.3,dir=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw)),side=new THREE.Vector3(-dir.z,0,dir.x);
  // Live fronds green; the lowest, drooping ones dull olive (drying).
  const green=old?[.42,.42,.18]:[.26+r()*.06,.46+r()*.08,.14+r()*.05];
  const spine=[];for(let i=0;i<=segs;i++){const t=i/segs;spine.push(top.clone().addScaledVector(dir,len*t).add(new THREE.Vector3(0,len*(lift*t-.75*t*t),0)));}
  for(let i=0;i<segs;i++){const a=spine[i],b=spine[i+1],w=len*.24*Math.sin(Math.PI*(i+.8)/(segs+.6));
   // Leaflets: narrow blades angled forward and down from the spine, both sides.
   for(const k of [-1,1]){const tip=b.clone().addScaledVector(side,k*w).add(new THREE.Vector3(0,-w*.6,0)).addScaledVector(dir,len*.06);
    pos.push(a.x,a.y,a.z,b.x,b.y,b.z,tip.x,tip.y,tip.z);const shade=.85+r()*.3;
    for(let q=0;q<3;q++){const e=q===2?.8:1;col.push(green[0]*shade*e,green[1]*shade*e,green[2]*shade*e);}idx.push(base,base+1,base+2);base+=3;}}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);
 const parts=[g.toNonIndexed()];
 // A few coconuts under the crown.
 for(let i=0;i<3;i++){const a=i*2.1+r(),c=new THREE.IcosahedronGeometry(.018,0).translate(top.x+Math.cos(a)*.022,top.y-.025,top.z+Math.sin(a)*.022);c.deleteAttribute('uv');c.deleteAttribute('normal');
  c.setAttribute('color',new THREE.Float32BufferAttribute(Array.from({length:c.attributes.position.count},()=>[.35,.28,.12]).flat(),3));parts.push(c);}
 const merged=mergeGeometries(parts);merged.computeVertexNormals();return merged;
}

// A shore boulder: a lumpy, flattened rock, height and radius about 1, grey-brown, darker underneath.
function boulderGeometry(seed){
 let g=new THREE.IcosahedronGeometry(1,1);g.deleteAttribute('uv');g.deleteAttribute('normal');g=mergeVertices(g);const p=g.attributes.position,v=new THREE.Vector3(),col=[];
 for(let j=0;j<p.count;j++){v.fromBufferAttribute(p,j);v.multiplyScalar(1+(hash3(v,seed)-.5)*.45);v.y=Math.max(v.y*.7,-.25);p.setXYZ(j,v.x,v.y,v.z);const k=(.3+.16*(v.y+.25))*(.85+.3*hash3(v,seed+1));col.push(k*1.02,k,k*.92);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();return g;
}

// A broadleaf trunk: a tapering 6-sided post, height and radius 1, scaled per tree.
function trunkGeometry(){const g=new THREE.CylinderGeometry(.6,1,1,6,1,true).translate(0,.5,0);g.deleteAttribute('uv');
 g.setAttribute('color',new THREE.Float32BufferAttribute(Array.from({length:g.attributes.position.count},()=>[.36,.32,.26]).flat(),3));return g;}

// Aerial perspective for the islands: past ~80 m they fade towards the fog colour (light blue-grey), much more than the
// scene's thin fog, so the far island reads as far. Chains onto any onBeforeCompile the material already has.
export function haze(m){
 const prev=m.onBeforeCompile;
 m.onBeforeCompile=(s,r)=>{if(prev)prev(s,r);
  s.fragmentShader=s.fragmentShader.replace('#include <fog_fragment>',`#ifdef USE_FOG
   gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,.62*(1.-exp(-max(0.,vFogDepth-80.)*.0022)));
   #endif
   #include <fog_fragment>`);};
 return m;
}

// Leaf clusters: near the camera the crowns get a pattern of lighter and darker clumps (world-space noise, faded
// out with distance so far islands do not shimmer).
function foliageMaterial(){
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92});
 m.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLeaf;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvLeaf=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vLeaf;
   float leafHash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float leafNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(leafHash(i),leafHash(i+vec3(1,0,0)),f.x),mix(leafHash(i+vec3(0,1,0)),leafHash(i+vec3(1,1,0)),f.x),f.y),
     mix(mix(leafHash(i+vec3(0,0,1)),leafHash(i+vec3(1,0,1)),f.x),mix(leafHash(i+vec3(0,1,1)),leafHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`)
   .replace('#include <color_fragment>',`#include <color_fragment>
   {float near=1.-smoothstep(25.,110.,length(vViewPosition));
    float n=leafNoise(vLeaf*2.2)*.65+leafNoise(vLeaf*5.3)*.35;
    diffuseColor.rgb*=mix(1.,.42+1.05*n,near);}`);
 };
 return haze(m);
}

// Plant islands into shared instanced meshes: plant() once per island, then finish().
export function createVegetation(group){
 const lists={crownNear:[],crownFar:[],shrub:[],palm:[],trunk:[],boulder:[]};
 // shape(x,z): the island's height at local (x, z); rock(x,z,y): bare rock there; detail 'near' or 'far'.
 function plant({cx,cz,rx,rz,shape,rock,seed,detail,counts}){
  const r=rng(seed),o=new THREE.Object3D(),color=new THREE.Color();
  const slope=(x,z)=>Math.hypot(shape(x+1,z)-shape(x-1,z),shape(x,z+1)-shape(x,z-1))/2;
  // The yaw that turns local +x downhill (rotateY(a) sends +x to (cos a, 0, -sin a)).
  const downhill=(x,z)=>Math.atan2(shape(x,z+1)-shape(x,z-1),-(shape(x+1,z)-shape(x-1,z)));
  const pick=test=>{for(let i=0;i<60;i++){const x=(r()-.5)*rx*1.9,z=(r()-.5)*rz*1.9,y=shape(x,z);if(test(x,z,y))return [x,z,y];}return null;};
  const put=(list,place)=>{place(o,color);o.updateMatrix();list.push([o.matrix.clone(),color.clone()]);};
  // Broadleaf trees: many small crowns packed into a canopy from just above the rock band to the summit (from afar a
  // fine texture, not separate blobs); a few emergent trees break the skyline. Sunlit yellow-green to olive.
  for(let i=0;i<counts.canopy;i++){const p=pick((x,z,y)=>y>1.4&&(!rock(x,z,y)||r()<.1)&&slope(x,z)<1.6);if(!p)continue;const [x,z,y]=p,big=r()<.05;
   const s=big?3.4+r()*1.4:1.4+r()*1.5,lift=1+s*.4+r()*2.5+(big?4:0);
   put(detail==='near'?lists.crownNear:lists.crownFar,(o,c)=>{o.position.set(cx+x,y+lift,cz+z);o.scale.set(s*(1+r()*.25),s*(.8+r()*.3),s*(1+r()*.25));o.rotation.set(0,r()*6.3,0);{const k=r();c.setHSL(.17+r()*.12,.38+r()*.24,k<.25?.17+r()*.06:.25+r()*.14);}});
   if(big||r()<.4)put(lists.trunk,(o,c)=>{const w=.1+s*.05;o.position.set(cx+x,y-.3,cz+z);o.scale.set(w,lift+.3,w);o.rotation.set((r()-.5)*.12,r()*6.3,(r()-.5)*.12);c.setRGB(1,1,1);});}
  // Shrubs: the forest edge, low ground and rocky slopes.
  for(let i=0;i<counts.shrub;i++){const p=pick((x,z,y)=>y>.5&&y<5&&slope(x,z)<1.8||rock(x,z,y)&&y>.8);if(!p)continue;const [x,z,y]=p;
   put(lists.shrub,(o,c)=>{const s=.6+r()*1.1;o.position.set(cx+x,y+s*.15,cz+z);o.scale.set(s*1.3,s*(.55+r()*.3),s*1.2);o.rotation.set(0,r()*6.3,0);c.setHSL(.17+r()*.12,.38+r()*.2,.22+r()*.1);});}
  // Coconut palms: many along the shore, leaning downhill towards the water, and scattered up the slopes standing
  // out of the canopy.
  for(let i=0;i<counts.palm;i++){const p=pick((x,z,y)=>{const e=(x/rx)**2+(z/rz)**2;return i%3===0?y>4&&slope(x,z)<1.3:y>.6&&y<8&&e>.5&&slope(x,z)<1.4;});if(!p)continue;const [x,z,y]=p,shore=i%3!==0;
   put(lists.palm,(o,c)=>{const h=shore?7+r()*5:12+r()*6;o.position.set(cx+x,y-.3,cz+z);o.scale.setScalar(h);
    // The trunk bends towards local +x: turn that downhill, then lean a little more that way (more on the shore).
    o.rotation.set(0,0,0);o.rotateY(downhill(x,z)+(r()-.5)*.6);o.rotateZ(-(shore?.08+r()*.22:r()*.08));const k=.95+r()*.3;c.setRGB(k,k,k*.92);});}
  // Boulders scattered along the water line, some half in the water.
  for(let i=0;i<(counts.boulder||0);i++){const p=pick((x,z,y)=>y>-.6&&y<1.6);if(!p)continue;const [x,z,y]=p;
   put(lists.boulder,(o,c)=>{const s=.5+r()**2*2.2;o.position.set(cx+x,y-s*.15,cz+z);o.scale.set(s*(1+r()*.5),s*(.6+r()*.5),s*(1+r()*.4));o.rotation.set((r()-.5)*.3,r()*6.3,(r()-.5)*.3);const k=.8+r()*.4;c.setRGB(k,k,k);});}
 }
 function finish(){
  const foliage=foliageMaterial(),plain=haze(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9})),fronds=haze(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,side:THREE.DoubleSide}));
  const sets=[[lists.crownNear,[11,23,37].map(s=>crownGeometry(s,1,5)),foliage],[lists.crownFar,[11,23].map(s=>crownGeometry(s,0,4)),foliage],
   [lists.shrub,[51,63].map(s=>crownGeometry(s,0,4)),foliage],[lists.palm,[71,83].map(palmGeometry),fronds],[lists.trunk,[trunkGeometry()],plain],[lists.boulder,[5,9].map(boulderGeometry),plain]];
  for(const [list,geos,material] of sets){const meshes=geos.map(g=>{const m=new THREE.InstancedMesh(g,material,Math.max(1,Math.ceil(list.length/geos.length)));m.count=0;m.castShadow=m.receiveShadow=true;group.add(m);return m;});
   list.forEach(([matrix,color],i)=>{const m=meshes[i%meshes.length];m.setMatrixAt(m.count,matrix);m.setColorAt(m.count,color);m.count++;});
   for(const m of meshes){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();}}
  return Object.fromEntries(Object.entries(lists).map(([k,v])=>[k,v.length]));
 }
 return {plant,finish};
}
