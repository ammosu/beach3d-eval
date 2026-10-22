import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {groundHeight,shore} from '../terrain.js';
// Deliberately off the collectible/boat corridors. Seeded phases and periods never depend on frame count.
const sites=[[-30,3.1],[-19,3.5],[-10,3.1],[14,3.3],[30,3.6],[39,3.2]];
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function createCrabs(scene){
 const rng=random(2841),root=new T.Group();root.name='extra-crabs';scene.add(root);
 const shell=new T.MeshStandardMaterial({color:0xb87942,roughness:.9}),legMat=new T.MeshStandardMaterial({color:0xc58a50,roughness:.9}),dark=new T.MeshBasicMaterial({color:0x3c3024}),sand=new T.MeshStandardMaterial({color:0xc5ad83,roughness:1});
 const batchedMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.9});
 function batch(meshes,parent){parent.updateMatrixWorld(true);const inv=new T.Matrix4().copy(parent.matrixWorld).invert(),parts=meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,m.matrixWorld));for(const name of Object.keys(g.attributes))if(!['position','normal'].includes(name))g.deleteAttribute(name);const c=m.material.color,a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);g.setAttribute('color',new T.Float32BufferAttribute(a,3));m.removeFromParent();return g;});const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());parent.add(new T.Mesh(merged,batchedMat));}
 const sphere=new T.SphereGeometry(1,8,5),limb=new T.CylinderGeometry(.012,.009,.15,5),crabs=[];
 const part=(g,mat,pos,scale,parent)=>{const m=new T.Mesh(g,mat);m.position.set(...pos);if(scale)m.scale.set(...scale);parent.add(m);return m;};
 for(const [x,d] of sites){const z=shore(x)+d,h=groundHeight(x,z),body=new T.Group();root.add(body);
  const hole=part(new T.CircleGeometry(.055,16),dark,[x,h+.008,z],null,root);hole.rotation.x=-Math.PI/2;
  for(let j=0;j<12;j++){const a=j*Math.PI/6,r=.07+rng()*.035;part(sphere,sand,[x+Math.cos(a)*r,h+.008,z+Math.sin(a)*r],[.013,.008,.01],root);}
  part(sphere,shell,[0,.065,0],[.12,.06,.085],body);const legs=[];
  for(const s of [-1,1]){for(let j=0;j<4;j++){const pivot=new T.Group();pivot.position.set(s*.08,.05,(j-1.5)*.04);body.add(pivot);const l=part(limb,legMat,[s*.065,-.02,0],null,pivot);l.rotation.z=s*1.2;l.userData.leg=true;legs.push({pivot,mesh:l,s,j});}
   const claw=new T.Group();claw.position.set(s*.14,.08,.1);body.add(claw);part(sphere,legMat,[0,0,0],[.05,.025,.06],claw);for(const k of [-1,1]){const p=part(limb,shell,[k*.018,0,.05],[.8,.55,.8],claw);p.rotation.x=Math.PI/2;p.rotation.z=k*.25;}
   part(sphere,dark,[s*.055,.13,.06],[.013,.018,.012],body);}
  body.updateMatrixWorld(true);const statics=[];body.traverse(o=>{if(o.isMesh&&!o.userData.leg)statics.push(o);});batch(statics,body);
  crabs.push({x,z,h,body,legs,period:13+rng()*7,phase:rng()*18,range:.6+rng()*.5,sign:rng()<.5?-1:1,scaredAt:null,returnFrom:0,state:'hidden',offset:0});
 }
 batch(root.children.filter(o=>o.isMesh),root);
 let custom=null;
 const legInstances=new T.InstancedMesh(limb,legMat,48);legInstances.frustumCulled=false;root.add(legInstances);for(const c of crabs)for(const l of c.legs)l.mesh.visible=false;const matrix=new T.Matrix4(),zero=new T.Matrix4().makeScale(0,0,0);
 function update(t,player,canScare=true){for(const c of crabs){const phase=((t+c.phase)%c.period+c.period)%c.period,u=phase/c.period;
  let offset=u<.12?0:u<.4?T.MathUtils.smoothstep(u,.12,.4):u<.58?1:1-T.MathUtils.smoothstep(u,.58,.8),exposure=T.MathUtils.smoothstep(u,0,.12)*(1-T.MathUtils.smoothstep(u,.8,.9));
  const near=Math.hypot(player.x-c.x,player.z-c.z)<2.5;
  if(canScare&&near&&exposure>.05&&(c.scaredAt===null||t>c.scaredAt+5.45)){c.scaredAt=t;c.returnFrom=offset;}
  if(c.scaredAt!==null&&t>=c.scaredAt&&t<c.scaredAt+5.45){const age=t-c.scaredAt;offset=c.returnFrom*(1-T.MathUtils.smoothstep(age,0,.38));exposure=1-T.MathUtils.smoothstep(age,.27,.45);c.state=age<.45?'fleeing':'hidden';}
  else c.state=exposure<.05?'hidden':u<.12?'peeking':u<.58?'walking':'returning';
  if(c.model){c.model.position.y=c.model.userData.y+(offset>.01&&offset<.99?.006*Math.abs(Math.sin(t*(c.state==='fleeing'?30:12))):0);c.model.rotation.z=.04*Math.sin(t*12+c.phase)*(offset>.01?1:0);}
  c.offset=offset;c.body.visible=exposure>.02;c.body.position.set(c.x+c.sign*c.range*offset,c.h-.11*(1-exposure),c.z);c.body.position.y=groundHeight(c.body.position.x,c.z)-.11*(1-exposure);
  for(const l of c.legs){l.pivot.rotation.x=Math.sin(t*(c.state==='fleeing'?30:12)+l.j*1.7+l.s)*.35*(offset>.01?1:.15);l.pivot.rotation.z=l.s*.15*Math.sin(t*12+l.j);}
 }
 root.updateMatrixWorld(true);let n=0;for(const c of crabs)for(const l of c.legs)legInstances.setMatrixAt(n++,c.body.visible&&!custom?matrix.copy(l.mesh.matrixWorld):zero);legInstances.instanceMatrix.needsUpdate=true;
 }
 // B/C crab (head +x, back up, length 1): head turned to +z like the procedural crab, which walks sideways along x; fit .4 m across, .15 m high.
 function setGroup(model){custom=model;for(const c of crabs){if(c.model){c.body.remove(c.model);c.model=null;}for(const o of c.body.children)o.visible=!model;if(!model)continue;
  const g=model.clone(),b=new T.Box3().setFromObject(g),size=b.getSize(new T.Vector3()),s=Math.min(.15/size.y,.4/Math.max(size.x,size.z));g.scale.setScalar(s);g.rotation.y=-Math.PI/2;g.position.y=-b.min.y*s;g.userData.y=g.position.y;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});c.body.add(g);c.model=g;}}
 return {update,setGroup,get info(){return crabs.map(c=>({x:c.body.position.x,z:c.z,hole:[c.x,c.z],state:c.state,scaredAt:c.scaredAt}));},reset(){for(const c of crabs)c.scaredAt=null;}};
}
