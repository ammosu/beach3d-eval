import * as THREE from 'three';
import { shore, groundHeight } from './terrain.js';
import { createVegetation } from './vegetation.js';
// Shared landscape details, deliberately outside the experimental prop root.
export function addCoastDetails(scene) {
 let seed=7921;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const land=new THREE.Group();land.name='shared-coastal-landforms';scene.add(land);
 function hill(cx,cz,rx,rz,height){
  const rock=(x,z,y)=>!(y>height*.20&&Math.sin(x*.32+z*.44)+Math.cos(z*.24)<1.1);
  const shape=(x,z)=>{const e=Math.max(0,1-(x/rx)**2-(z/rz)**2);return Math.pow(e,.7)*(height*(.70+.18*Math.sin(x*.14+z*.06)+.12*Math.sin(x*.31-z*.22))+2*Math.sin(x*.8+z*.5))-.5;};
  const g=new THREE.PlaneGeometry(rx*2,rz*2,110,70);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=shape(x,z);p.setY(i,y);const vegetation=y>height*.20&&Math.sin(x*.32+z*.44)+Math.cos(z*.24)<1.1,f=.8+rand()*.35;
   // Forest floor (lighter and browner than before, so gaps between crowns are not black), bare rock on the
   // outcrops and steep faces, and a sand and wet-rock fringe at the water.
   const steep=Math.hypot(shape(x+1,z)-shape(x-1,z),shape(x,z+1)-shape(x,z-1))/2,blend=Math.sin(x*.9)*Math.sin(z*.7)*.5+.5;
   const c=new THREE.Color(y<.9?0xb9a77f:y<1.8?0x5f5a4c:vegetation&&steep<1.5?(blend>.5?0x3b5530:0x4a5a33):0x86837a);c.multiplyScalar(f);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));mesh.position.set(cx,0,cz);mesh.receiveShadow=true;mesh.castShadow=true;land.add(mesh);
  // The old blob trees drew from the shared seed; draw the same numbers so the tide debris below stays where it was.
  for(let i=0;i<3200;i++){const x=(rand()-.5)*rx*1.65,z=(rand()-.5)*rz*1.65;if(shape(x,z)<3){i--;continue;}for(let k=0;k<5;k++)rand();}
  return {shape,rock};
 }
 const islands=[[90,-340,105,40,29,'far',{canopy:760,shrub:420,palm:110},211],[114,-58,64,78,29,'near',{canopy:920,shrub:620,palm:150},307]];
 const plants=new THREE.Group();plants.name='island-vegetation';land.add(plants);
 const vegetation=createVegetation(plants);
 for(const [cx,cz,rx,rz,h,detail,counts,seed] of islands){const {shape,rock}=hill(cx,cz,rx,rz,h);vegetation.plant({cx,cz,rx,rz,shape,rock,seed,detail,counts});}
 vegetation.finish();
 const debris=new THREE.Group();debris.name='shared-tide-debris';scene.add(debris);
 const geometries=[new THREE.SphereGeometry(1,7,4),new THREE.IcosahedronGeometry(1,0),new THREE.TorusGeometry(1,.12,4,7,3.5)];
 const materials=[new THREE.MeshStandardMaterial({color:0xeee1c8}),new THREE.MeshStandardMaterial({color:0x6e7167}),new THREE.MeshStandardMaterial({color:0x494333})];
 for(let type=0;type<3;type++){
  const m=new THREE.InstancedMesh(geometries[type],materials[type],240);const o=new THREE.Object3D();
  for(let i=0;i<240;i++){const x=(rand()-.5)*150,z=shore(x)+3.8+rand()*1.5+Math.sin(x*1.7)*.4,r=.045+rand()*.10;o.position.set(x,groundHeight(x,z)+.025,z);o.scale.set(r*(type===2?2:1),r*.3,r*.7);o.rotation.set(0,rand()*6,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.castShadow=true;debris.add(m);
 }
}
