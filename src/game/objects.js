import * as T from 'three';
import {groundHeight, shore} from '../terrain.js';
import {swashReach,sampleWater} from '../water.js';

export function createObjects(scene, timeUniform, config) {
 const root=new T.Group();root.name='game-objects';scene.add(root);
 const dummy=new T.Object3D(),wave={};
 const shellGeo=new T.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2);
 const p=shellGeo.attributes.position;
 for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),r=1+.09*Math.cos(a*12);p.setXYZ(i,p.getX(i)*r*.38,p.getY(i)*.16,p.getZ(i)*r*.32);}shellGeo.computeVertexNormals();
 const star=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.16:.41;const x=Math.sin(a)*r,y=Math.cos(a)*r;if(i===0)star.moveTo(x,y);else star.lineTo(x,y);}star.closePath();
 const starGeo=new T.ExtrudeGeometry(star,{depth:.07,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1});starGeo.rotateX(-Math.PI/2);
 const shellMat=new T.MeshStandardMaterial({color:0xffead0,roughness:.6,emissive:0x8c5320,emissiveIntensity:.12});
 const shells=new T.InstancedMesh(shellGeo,shellMat,4),stars=new T.InstancedMesh(starGeo,new T.MeshStandardMaterial({color:0xffae63,roughness:.7}),4);
 shells.castShadow=stars.castShadow=true;shells.frustumCulled=stars.frustumCulled=false;root.add(shells,stars);
 const glow=new T.InstancedMesh(new T.RingGeometry(.48,.54,32),new T.MeshBasicMaterial({color:0xffe8a0,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}),8);glow.frustumCulled=false;root.add(glow);
 const candidates=[[-8,8],[-11,2],[-7,-6],[0,-8],[5,-13],[13,-14],[18,-16],[25,-20]];
 const items=candidates.map(([x,z],i)=>{
  // Stable slot envelopes, independent of which source is loaded.
  while(config.slots.some(s=>Math.hypot(x-s.pos[0],z-s.pos[2])<(s.maxLen??6)*.72+1.5))x-=1;
  z=Math.max(z,shore(x)-3.7);
  return {id:i,x,z,y:groundHeight(x,z)+.04,collected:false,born:-100};
 });
 const sparkle=new T.InstancedMesh(new T.OctahedronGeometry(.065),new T.MeshBasicMaterial({color:0xfff0b2}),48);sparkle.frustumCulled=false;root.add(sparkle);
 const bursts=Array.from({length:4},()=>({x:0,y:0,z:0,born:-100}));let burstIndex=0;
 // Sand kicked up by a landing or a kick: grains thrown out low that fall back, and a faint dust puff that spreads
 // and thins. A pure function of the time since each puff (4 at once, 14 grains each).
 const grains=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:0xcdb48a,roughness:1}),56);grains.frustumCulled=false;root.add(grains);
 const dustCanvas=document.createElement('canvas');dustCanvas.width=dustCanvas.height=64;{const g=dustCanvas.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.5,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);}
 const dustMap=new T.CanvasTexture(dustCanvas);
 const dust=Array.from({length:4},()=>{const m=new T.Sprite(new T.SpriteMaterial({map:dustMap,color:0xe9dcbc,transparent:true,depthWrite:false,opacity:0}));m.visible=false;root.add(m);return m;});
 const puffs=Array.from({length:4},()=>({x:0,y:0,z:0,born:-100,size:1,dx:0,dz:0}));let puffIndex=0;
 const footprintGeo=new T.CircleGeometry(1,10);footprintGeo.rotateX(-Math.PI/2);
 const footprintMat=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,uniforms:{time:timeUniform},vertexShader:`attribute float born;attribute float life;uniform float time;varying float alpha;void main(){float age=time-born;alpha=age<0.?0.:max(0.,1.-age/life)*.3;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,fragmentShader:`varying float alpha;void main(){gl_FragColor=vec4(.25,.18,.10,alpha);}`});
 const footprints=new T.InstancedMesh(footprintGeo,footprintMat,128);footprints.frustumCulled=false;root.add(footprints);
 const born=new Float32Array(128).fill(-100),life=new Float32Array(128).fill(20);footprintGeo.setAttribute('born',new T.InstancedBufferAttribute(born,1));footprintGeo.setAttribute('life',new T.InstancedBufferAttribute(life,1));
 const feet=Array.from({length:128},()=>({x:0,z:0}));let footIndex=0;
 const halo=new T.Mesh(new T.RingGeometry(.7,.79,40),new T.MeshBasicMaterial({color:0xffde76,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.visible=false;root.add(halo);
 const ball=new T.Mesh(new T.SphereGeometry(.48,24,12),Array.from({length:6},(_,i)=>new T.MeshStandardMaterial({color:[0xffe4a0,0xe8654a,0xf6f6ef,0x56bad0,0xf6f6ef,0x56bad0][i],roughness:.45})));
 // Beach-ball panels use longitude bands, without a texture download.
 ball.geometry.clearGroups();const index=ball.geometry.index;for(let i=0;i<index.count;i+=3){const vi=index.getX(i),x=ball.geometry.attributes.position.getX(vi),z=ball.geometry.attributes.position.getZ(vi),band=Math.floor((Math.atan2(z,x)+Math.PI)/Math.PI*3)%6;ball.geometry.addGroup(i,3,band);} // merged below to keep draw count bounded
 const panelIndices=Array.from({length:6},()=>[]);for(const g of ball.geometry.groups)for(let j=0;j<3;j++)panelIndices[g.materialIndex].push(index.getX(g.start+j));ball.geometry.clearGroups();const all=[];for(let i=0;i<6;i++){ball.geometry.addGroup(all.length,panelIndices[i].length,i);all.push(...panelIndices[i]);}ball.geometry.setIndex(all);
 ball.castShadow=true;root.add(ball);
 function burst(x,y,z,t){const b=bursts[burstIndex++%4];b.x=x;b.y=y;b.z=z;b.born=t;}
 // size: about 1 for a landing; (dx, dz): grains lean that way (a kick), else they fan out evenly.
 function puff(x,z,t,size=1,dx=0,dz=0){const p=puffs[puffIndex++%4];Object.assign(p,{x,y:groundHeight(x,z),z,born:t,size,dx,dz});}
 function footprint(x,z,yaw,t,exact=false){const i=footIndex++%128,side=exact?0:footIndex%2?-.13:.13;feet[i].x=x+Math.cos(yaw)*side;feet[i].z=z-Math.sin(yaw)*side;dummy.position.set(feet[i].x,groundHeight(feet[i].x,feet[i].z)+.026,feet[i].z);dummy.rotation.set(0,yaw,0);dummy.scale.set(.105,1,.22);dummy.updateMatrix();footprints.setMatrixAt(i,dummy.matrix);born[i]=t;life[i]=20;footprintGeo.attributes.born.needsUpdate=true;footprintGeo.attributes.life.needsUpdate=true;footprints.instanceMatrix.needsUpdate=true;}
 function update(t){
  for(let i=0;i<8;i++){const item=items[i],age=t-item.born,picking=item.collected&&age>=0&&age<.65;dummy.position.set(item.x,item.y+(picking?Math.sin(age/.65*Math.PI)*.8:0),item.z);dummy.rotation.set(0,i*1.7,0);dummy.scale.setScalar(item.collected?(picking?1-age/.65:0):1);
   // A shell in the hand follows it (set by the game's pickup).
   if(item.held){dummy.position.copy(item.held);dummy.position.y-=.03;dummy.scale.setScalar(.32);}
   dummy.updateMatrix();(i%2?stars:shells).setMatrixAt(Math.floor(i/2),dummy.matrix);dummy.position.y=item.y+.025;if(item.y<.04){sampleWater(item.x,item.z,t,wave);dummy.position.y=Math.max(dummy.position.y,wave.height+.04);}dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(item.collected?0:1);dummy.updateMatrix();glow.setMatrixAt(i,dummy.matrix);}
  shells.instanceMatrix.needsUpdate=stars.instanceMatrix.needsUpdate=glow.instanceMatrix.needsUpdate=true;
  for(let i=0;i<48;i++){const b=bursts[Math.floor(i/12)],age=t-b.born,a=i*2.399;dummy.position.set(b.x+Math.cos(a)*age,b.y+age*2.3-age*age,b.z+Math.sin(a)*age);dummy.rotation.set(age,age,age);dummy.scale.setScalar(age>=0&&age<.9?1-age/.9:0);dummy.updateMatrix();sparkle.setMatrixAt(i,dummy.matrix);}sparkle.instanceMatrix.needsUpdate=true;
  for(let k=0;k<4;k++){const p=puffs[k],age=t-p.born,live=age>=0&&age<.9;
   for(let i=0;i<14;i++){const a=i*2.399+k,h=((i*.618+k*.37)%1),sp=p.size*(.9+1.4*h),up=p.size*(1.1+1.3*((i*.41+k*.13)%1)),tt=Math.min(age,.9);
    const y=Math.max(p.y+.02,p.y+.02+up*tt-4.9*tt*tt);dummy.position.set(p.x+(Math.cos(a)*sp+p.dx*2.2*p.size)*tt,y,p.z+(Math.sin(a)*sp+p.dz*2.2*p.size)*tt);dummy.rotation.set(a,a*2,0);
    dummy.scale.setScalar(live?(.014+.016*h)*Math.sqrt(p.size)*(1-age/.9):0);dummy.updateMatrix();grains.setMatrixAt(k*14+i,dummy.matrix);}
   const d=dust[k],k2=Math.min(1,Math.max(0,age)/.7);d.visible=age>=0&&age<.7;const w=p.size*(.35+.9*k2);d.position.set(p.x+p.dx*.4*k2,p.y+w*.3,p.z+p.dz*.4*k2);d.scale.set(w,w*.6,1);d.material.opacity=.42*(1-k2)*(1-k2);}
  grains.instanceMatrix.needsUpdate=true;
  let washed=false;for(let i=0;i<128;i++){if(t-born[i]<life[i]&&feet[i].z-shore(feet[i].x)<swashReach(feet[i].x,t)){life[i]=Math.min(life[i],Math.max(.15,t-born[i])+.55);washed=true;}}if(washed)footprintGeo.attributes.life.needsUpdate=true;
 }
 function reset(){for(const item of items){item.collected=false;item.born=-100;item.held=null;}for(const b of bursts)b.born=-100;for(const p of puffs)p.born=-100;born.fill(-100);life.fill(20);footprintGeo.attributes.born.needsUpdate=footprintGeo.attributes.life.needsUpdate=true;footIndex=0;}
 return {root,items,ball,halo,burst,puff,footprint,update,reset};
}

export function fallbackBoat(){
 const boat=new T.Group(),wood=new T.MeshStandardMaterial({color:0x398494,roughness:.65}),seat=new T.MeshStandardMaterial({color:0xc8a477});
 const hull=new T.Mesh(new T.SphereGeometry(1,16,8,0,Math.PI*2,Math.PI/2,Math.PI/2),wood);hull.scale.set(.8,.5,1.8);hull.position.y=.25;wood.side=T.DoubleSide;boat.add(hull);
 for(const z of [-.6,.6]){const m=new T.Mesh(new T.BoxGeometry(1.4,.12,.32),seat);m.position.set(0,.15,z);boat.add(m);}return boat;
}
