import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
// All geometry and surface maps are built locally. Seeded randomness makes captures repeatable.
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function rng(seed){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}

const materials=new Map();
function surface(kind,color){
 const key=kind+color;if(materials.has(key))return materials.get(key);
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');const r=rng(491);
 ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
 for(let i=0;i<5200;i++){
  const x=r()*512,y=r()*512;
  ctx.strokeStyle=`rgba(${r()>.48?'235,219,183':'35,25,19'},${.025+r()*.15})`;
  ctx.lineWidth=.3+r()*1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+3,y+10,x-3,y+35,x+(r()-.5)*6,y+15+r()*100);ctx.stroke();
 }
 if(kind==='blue'||kind==='white'||kind==='red')for(let i=0;i<1500;i++){
  ctx.fillStyle=r()>.5?'#8e8269':'#b3a187';ctx.globalAlpha=.2+r()*.6;ctx.fillRect(r()*512,r()*512,1+r()*5,2+r()*40);
 }
 ctx.globalAlpha=1;
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;
 const m=new T.MeshStandardMaterial({map,roughness:.88,bumpMap:map,bumpScale:kind==='bark'?.06:.018});materials.set(key,m);return m;
}
const plainMaterials=new Map();
const mat=(color,roughness=.85)=>{const key=color+roughness;if(!plainMaterials.has(key))plainMaterials.set(key,new T.MeshStandardMaterial({color,roughness}));return plainMaterials.get(key);};
function mesh(g,geometry,material,p=V()){const m=new T.Mesh(geometry,material);m.position.copy(p);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function box(g,w,h,d,m,x=0,y=0,z=0){return mesh(g,new T.BoxGeometry(w,h,d),m,V(x,y,z));}
function beam(g,a,b,r,m,r2=r,sides=9){const d=b.clone().sub(a);const o=mesh(g,new T.CylinderGeometry(r2,r,d.length(),sides),m,a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
function ball(g,p,scale,m,detail=1){const o=mesh(g,new T.IcosahedronGeometry(1,detail),m,p);o.scale.set(...scale);return o;}
function ribbon(g,points,widths,m){
 const p=[],uv=[],idx=[];
 points.forEach((v,i)=>{const tangent=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]);const side=V(-tangent.z,0,tangent.x).normalize().multiplyScalar(widths[i]);
  for(const s of [-1,1]){p.push(v.x+side.x*s,v.y,v.z+side.z*s);uv.push((s+1)/2,i/(points.length-1));}
  if(i<points.length-1){let k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
 });const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return mesh(g,geo,m);
}
function curvedTube(g,points,r,m,segments=50,sides=10){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,sides,false),m);}
const wood=()=>surface('wood','#9c7951');
function palm(g,height,lean,seed){
 const r=rng(seed),bark=surface('bark','#85715a');
 const path=new T.CatmullRomCurve3([V(0,0,0),V(lean*.08,height*.28,.08),V(lean*.48,height*.64,.1),V(lean,height,0)]);
 const trunk=new T.TubeGeometry(path,64,.18,12,false),p=trunk.attributes.position;
 for(let i=0;i<p.count;i++){const t=Math.floor(i/13)/64,center=path.getPointAt(t);const taper=(1.4-.6*t)*(1+.045*Math.sin(t*height*44));p.setXYZ(i,center.x+(p.getX(i)-center.x)*taper,center.y+(p.getY(i)-center.y)*taper,center.z+(p.getZ(i)-center.z)*taper);}trunk.computeVertexNormals();mesh(g,trunk,bark);
 for(let i=0;i<height*12;i++){
  const t=i/(height*12),center=path.getPointAt(t);const ring=mesh(g,new T.TorusGeometry(.18*(1.4-.6*t),.009,3,12),surface('bark','#675844'),center);
  ring.quaternion.setFromUnitVectors(V(0,0,1),path.getTangentAt(t));
 }
 const top=path.getPoint(1),leafMats=['#425c21','#526e28','#64792d','#344f1d'].map(c=>{const m=surface('leaf',c);m.side=T.DoubleSide;return m;});
 for(let f=0;f<15;f++){
  const angle=f*2.399+.15*r(),len=2.4+r()*.9,up=f<4?1.15:.4+r()*.5;
  const dir=V(Math.cos(angle),0,Math.sin(angle));const side=V(-dir.z,0,dir.x);
  const points=[];for(let j=0;j<=28;j++){const t=j/28;points.push(top.clone().addScaledVector(dir,len*t).add(V(0,Math.sin(t*Math.PI)*up-t*t*(f<4?.25:1.1),0)));}
  curvedTube(g,points,.018,leafMats[f%4],28,5);
  for(let j=2;j<27;j++)for(const sign of [-1,1]){
   const t=j/28,base=points[j],w=Math.sin(t*Math.PI)**.65*(.65+r()*.16)*(1-t*.25),end=base.clone().addScaledVector(side,w*sign).addScaledVector(dir,.3+t*.1).add(V(0,-.15-w*.22,0));
   const mid=base.clone().lerp(end,.5).add(V(0,.07,0));ribbon(g,[base,mid,end],[.012,.067*(1-t*.45),.001],leafMats[(f+j)%4]);
  }
 }
 for(let j=0;j<7;j++){const a=j*2.4;ball(g,top.clone().add(V(Math.cos(a)*.25,-.25-r()*.22,Math.sin(a)*.25)),[.15,.2,.15],surface('coconut','#76643b'),2);}
 for(let j=0;j<9;j++){const a=j*2.4;beam(g,top.clone().add(V(0,-.55,0)),top.clone().add(V(Math.cos(a)*.28,-.05,Math.sin(a)*.28)),.06,bark,.025);}
}
export function palm_tall(g){palm(g,7.8,1.2,11);}
export function palm_pair(g){const a=new T.Group(),b=new T.Group();g.add(a,b);palm(a,6,1.45,17);palm(b,5.1,-1.7,23);b.position.z=.3;b.rotation.y=.25;}
export function rocks(g){
 const r=rng(613);const rock=new T.MeshStandardMaterial({color:0x555552,roughness:1,vertexColors:true});
 rock.onBeforeCompile=s=>{
 s.vertexShader='varying vec3 vRock;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRock=position;');
 s.fragmentShader='varying vec3 vRock;\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float pore=sin(vRock.x*143.)*sin(vRock.y*137.)*sin(vRock.z*151.);
 diffuseColor.rgb*=.88+.18*pore;
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 normal=normalize(normal+vec3(sin(vRock.z*131.),sin(vRock.x*137.),sin(vRock.y*143.))*.085);`);
 };
 const shell=mat('#a9a08a');
 for(let k=0;k<7;k++){
  const geo=mergeVertices(new T.IcosahedronGeometry(1,9).deleteAttribute('normal').deleteAttribute('uv')),p=geo.attributes.position,colors=[];const sx=k===0?1.25:.55+r()*.6,sy=k===0?1.15:.4+r()*.5,sz=.7+r()*.4;
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=1+.085*Math.sin(x*8+y*7)*Math.sin(z*9-x*4)+.012*Math.sin(x*31+y*23+z*13);p.setXYZ(i,x*n*sx,y*n*sy,z*n*sz);const c=.48+.15*Math.sin(x*21+z*16)*Math.sin(y*31)+.1*y;colors.push(c,c*.99,c*.94);}
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const a=k*2.399;const o=mesh(g,geo,rock,V(k?Math.cos(a)*(1.05+r()*.45):0,sy*.64,k?Math.sin(a)*.95:0));o.rotation.y=r()*4;o.updateMatrixWorld(true);o.position.y-=new T.Box3().setFromObject(o).min.y;o.updateMatrixWorld(true);
  const ray=new T.Raycaster();for(let j=0;j<145;j++){
   const dir=V(r()*2-1,r()*.9-.35,r()*2-1).normalize();ray.set(o.position.clone().addScaledVector(dir,4),dir.clone().negate());const hit=ray.intersectObject(o)[0];if(!hit||hit.point.y>.9||hit.point.y<.04)continue;
   const normal=hit.face.normal.clone().transformDirection(o.matrixWorld);const size=.025+r()*.035;const barn=mesh(g,new T.CylinderGeometry(size*.42,size,size*.9,7,1,true),shell,hit.point.clone().addScaledVector(normal,size*.4));barn.quaternion.setFromUnitVectors(V(0,1,0),normal);
   const hole=mesh(g,new T.CircleGeometry(size*.34,6),mat('#424039'),hit.point.clone().addScaledVector(normal,size*.86));hole.quaternion.setFromUnitVectors(V(0,0,1),normal);
  }
 }
}
export function boat(g){
 const blue=surface('blue','#407b91'),inside=surface('wood','#9e9277'),edge=surface('wood','#79634a');
 // Longitudinal strakes form a hollow, tapered clinker hull, with independent inner faces.
 function point(t,v,inner=false){const x=(t-.5)*4.6,w=Math.sin(Math.PI*t)**.62;return V(x,.12+.72*v*v+.26*(Math.abs(t-.5)*2)**5,(inner?.96:1)*w*(.19+.69*v));}
 for(const side of [-1,1])for(let band=0;band<7;band++){
  const p=[],uv=[],idx=[];
  for(let i=0;i<=48;i++)for(let j=0;j<2;j++){const v=(band+j)/7,q=point(i/48,v);p.push(q.x,q.y,q.z*side);uv.push(i/8,j);if(i<48&&j===0){let n=i*2;idx.push(n,n+2,n+1,n+1,n+2,n+3);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const m=blue.clone();m.side=T.DoubleSide;mesh(g,geo,m);
  const innerGeo=geo.clone(),ip=innerGeo.attributes.position;for(let i=0;i<ip.count;i++)ip.setZ(i,ip.getZ(i)*.965);innerGeo.computeVertexNormals();const im=inside.clone();im.side=T.DoubleSide;mesh(g,innerGeo,im);
  const seam=[];for(let i=0;i<=48;i++){const q=point(i/48,band/7);q.z*=side;seam.push(q);}curvedTube(g,seam,.012,edge,48,5);
 }
 for(const side of [-1,1]){const points=[];for(let i=0;i<=48;i++){const p=point(i/48,1);p.z*=side;points.push(p);}curvedTube(g,points,.045,edge,48,8);}
 for(let i=-3;i<=3;i++)box(g,3.05,.045,.15,inside,0,.23,i*.15);
 for(let x of [-1.05,.15,1.15]){const w=point(x/4.6+.5,1).z;box(g,.33,.065,w*1.86,inside,x,.67,0);for(const s of [-1,1])box(g,.09,.35,.09,edge,x,.46,s*w*.72);}
 for(let i=1;i<10;i++){const t=i/10,pts=[];for(let j=0;j<=16;j++){const v=Math.abs(j-8)/8,q=point(t,v,true);q.z*=j<8?-1:1;q.y+=.025;pts.push(q);}curvedTube(g,pts,.022,edge,16,5);}
 const metal=mat('#5c574a',.52);
 for(const side of [-1,1]){
  for(let i=1;i<12;i++)for(let j=1;j<7;j++){
   const q=point(i/12,j/7-.025);q.z=(q.z+.009)*side;ball(g,q,[.009,.009,.006],metal,0);
  }
  const q=point(.51,1);q.z*=side;q.y+=.055;
  const lock=mesh(g,new T.TorusGeometry(.055,.012,6,12,Math.PI*1.55),metal,q);lock.rotation.y=Math.PI/2;
 }
 // Two oars stowed across the thwarts.
 for(let k=0;k<2;k++){const o=new T.Group();g.add(o);o.position.set(-.15+k*.5,.79,k*.2-.1);o.rotation.y=.17+k*.13;beam(o,V(-1.65,0,0),V(1.3,0,0),.025,wood());const blade=box(o,.62,.045,.16,inside,1.48,0,0);blade.rotation.y=.05;}
 g.rotation.y=-.32;
}
function thatch(g,radius,y,rise,seed){
 const r=rng(seed);const straw=['#9b875a','#938053','#a18c5e','#8a764d'].map(c=>{const m=surface('straw',c);m.side=T.DoubleSide;return m;});
 const core=mesh(g,new T.ConeGeometry(radius,rise,48,1,true),straw[1],V(0,y+rise/2,0));core.material.side=T.DoubleSide;
 // Narrow tapered overlapping strips; uneven eaves and separate courses break the silhouette.
 for(let layer=0;layer<7;layer++){
  const t=(layer+.2)/7,rr=radius*(1-t),n=Math.floor(160+rr*130);
  for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2+r()*.025,startR=rr*.86,endR=Math.min(radius*1.045,rr+radius*(.17+r()*.12));
   const p0=V(Math.cos(a)*startR,y+rise*(1-startR/radius)+.075+(1-layer/7)*.025,Math.sin(a)*startR);
   const p1=V(Math.cos(a)*endR,y+rise*(1-endR/radius)-.025-r()*.14,Math.sin(a)*endR);
   ribbon(g,[p0,p0.clone().lerp(p1,.5).add(V(0,.045,0)),p1],[.009,.012+r()*.008,.002],straw[(i+layer)%4]);
  }
 }
 return core;
}
export function hut(g){
 const w=wood(),dark=surface('wood','#685336');
 for(const x of [-1.2,1.2])for(const z of [-1,1]){beam(g,V(x,0,z),V(x,2.5,z),.085,w);beam(g,V(x,.45,z),V(x*.3,1.1,z),.045,dark);}
 for(let i=0;i<18;i++)box(g,.14,.12,2.25,w,-1.28+i*.15,.62,0);
 for(let i=0;i<16;i++){box(g,.14,1.5,.07,w,-1.13+i*.15,1.48,-1);if(i<5||i>10)box(g,.14,1.5,.07,w,-1.13+i*.15,1.48,1);}
 for(const s of [-1,1])for(let i=0;i<14;i++){
  const z=-.98+i*.15;if(i>3&&i<10){box(g,.065,.6,.14,w,s*1.2,1.03,z);box(g,.065,.22,.14,w,s*1.2,2.12,z);}else box(g,.065,1.5,.14,w,s*1.2,1.48,z);
 }
 for(const s of [-1,1]){box(g,.13,.07,.99,dark,s*1.2,1.35,-.01);box(g,.08,.7,.05,dark,s*1.2,1.69,0);}
 for(const s of [-1,1]){box(g,.12,.12,2.2,dark,s*1.2,2.3,0);box(g,2.5,.12,.12,dark,0,2.3,s);}
 for(let i=0;i<3;i++)box(g,.82,.14,.3,w,0,.14+i*.16,1.8-i*.28);
 thatch(g,2,2.38,1.1,77);
}
function lounger(g,x,z,angle){
 const o=new T.Group();g.add(o);o.position.set(x,0,z);o.rotation.y=angle;const w=wood();
 for(const s of [-1,1]){box(o,.065,.08,1.35,w,s*.36,.38,.2);for(const a of [-.4,.7])beam(o,V(s*.32,0,a),V(s*.36,.39,a+.06),.035,w);}
 for(let i=0;i<11;i++)box(o,.77,.045,.105,w,0,.43,-.35+i*.12);
 for(const side of [-1,1])for(const z of [-.35,.7])ball(o,V(side*.397,.38,z),[.007,.012,.012],mat('#716a58',.5),1);
 const back=new T.Group();o.add(back);back.position.set(0,.44,-.43);back.rotation.x=.65;
 for(let i=0;i<8;i++)box(back,.77,.045,.095,w,0,0,-i*.11);
 for(const s of [-1,1]){box(back,.055,.065,.9,w,s*.33,-.035,-.38);beam(o,V(s*.32,.1,-.45),V(s*.32,.77,-.85),.025,w);box(o,.08,.05,.65,w,s*.45,.62,-.1);beam(o,V(s*.45,.4,.15),V(s*.45,.6,.15),.023,w);}
}
export function umbrella(g){beam(g,V(),V(0,2.5,0),.045,wood());thatch(g,1.55,2.05,.5,19);for(let i=0;i<10;i++){const a=i*Math.PI/5;beam(g,V(0,2.45,0),V(Math.cos(a)*1.48,2.05,Math.sin(a)*1.48),.016,wood());}lounger(g,-.68,.25,-.08);lounger(g,.7,.25,.08);}
function taperBranch(g,points,r,m){
 const path=new T.CatmullRomCurve3(points),geo=new T.TubeGeometry(path,20,r,8,false),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const t=Math.floor(i/9)/20,c=path.getPointAt(t),f=1-t*.77;p.setXYZ(i,c.x+(p.getX(i)-c.x)*f,c.y+(p.getY(i)-c.y)*f,c.z+(p.getZ(i)-c.z)*f);}geo.computeVertexNormals();mesh(g,geo,m);
}
export function driftwood(g){
 const random=rng(21781),m=surface('wood','#b4a68a');const path=new T.CatmullRomCurve3([V(-1.7,.22,-.12),V(-.8,.25,.04),V(.2,.24,-.03),V(1.55,.34,.23)]);
 const geo=new T.TubeGeometry(path,60,.18,16,false),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const t=Math.floor(i/17)/60,center=path.getPointAt(t),a=i%17/16*Math.PI*2;const f=(.48+.5*Math.sin(t*3.1))*(1+.17*Math.sin(a*7+t*11)+.09*Math.sin(a*13));p.setXYZ(i,center.x+(p.getX(i)-center.x)*f,center.y+(p.getY(i)-center.y)*f,center.z+(p.getZ(i)-center.z)*f);}geo.computeVertexNormals();mesh(g,geo,m);
 for(const t of [0,1]){
  const end=path.getPointAt(t),cap=mesh(g,new T.CircleGeometry(.085,16),surface('wood','#8e8068'),end);cap.quaternion.setFromUnitVectors(V(0,0,1),path.getTangentAt(t).multiplyScalar(t?1:-1));
  for(let j=0;j<12;j++){const a=j*2.4;beam(g,end.clone().add(V(0,Math.cos(a)*.075,Math.sin(a)*.075)),end.clone().add(V((t?1:-1)*(.04+random()*.13),Math.cos(a)*.085,Math.sin(a)*.085)),.018,m,.001,5);}
 }
 for(let i=0;i<5;i++){const a=i*2.4;const start=V(-1.05,.24,0),end=V(-1.7-random()*.4,.16+random()*.3,Math.cos(a)*.5);taperBranch(g,[start,V(-1.5,.3,Math.cos(a)*.2),end],.08,m);}
 taperBranch(g,[V(.1,.24,0),V(.4,.4,.25),V(.9,.5,.5)],.1,m);
 taperBranch(g,[V(-.55,.24,0),V(-.25,.38,-.28),V(.05,.45,-.35)],.08,m);
 for(let i=0;i<14;i++){const a=i*Math.PI*2/14,pts=[];for(let j=0;j<=30;j++){const t=j/30,c=path.getPointAt(t);pts.push(c.add(V(0,Math.cos(a+t*.3)*.18*(.48+.5*Math.sin(t*3.1)),Math.sin(a+t*.3)*.18*(.48+.5*Math.sin(t*3.1)))));}curvedTube(g,pts,.003,mat('#81745f'),30,3);}
 g.rotation.y=.35;
}
export function lifeguard(g){
 const white=surface('white','#d5d3c6'),red=surface('red','#b34334'),w=wood();
 for(const x of [-.8,.8])for(const z of [-.65,.65])beam(g,V(x*1.25,0,z*1.25),V(x,2.9,z),.065,white);
 for(const z of [-.67,.67]){beam(g,V(-.95,.25,z),V(.8,1.6,z),.045,white);beam(g,V(.95,.25,z),V(-.8,1.6,z),.045,white);}
 for(let i=0;i<14;i++)box(g,.14,.1,1.6,w,-.98+i*.15,1.65,0);
 for(const z of [-.72,.72]){box(g,1.8,.08,.07,white,0,2.3,z);for(let x=-.8;x<=.81;x+=.2)if(z<0||Math.abs(x)>.32)box(g,.04,.55,.04,white,x,1.99,z);}
 for(const x of [-.88,.88]){box(g,.07,.08,1.5,white,x,2.3,0);for(let z=-.6;z<=.61;z+=.2)box(g,.04,.55,.04,white,x,1.99,z);}
 for(const side of [-1,1])for(let j=0;j<14;j++){const roof=box(g,1.15,.065,.137,red,side*.54,3.02,-.91+j*.14);roof.rotation.z=-side*.26;}
 const ladder=new T.Group();g.add(ladder);ladder.position.set(0,0,1.43);ladder.rotation.x=-.33;
 for(const x of [-.3,.3])box(ladder,.065,1.85,.065,white,x,.9,0);for(let i=0;i<7;i++)box(ladder,.64,.055,.1,red,0,.15+i*.25,0);
 box(g,.8,.48,.05,white,0,2.15,.77);box(g,.11,.32,.025,red,0,2.15,.81);box(g,.32,.11,.025,red,0,2.15,.81);
 box(g,.65,.07,.5,red,0,2.05,-.2);box(g,.65,.45,.07,white,0,2.3,-.43);
 const buoy=mesh(g,new T.TorusGeometry(.24,.065,8,32),red,V(.91,2.02,.22));buoy.rotation.y=Math.PI/2;
}
