import * as THREE from 'three';
import { shore, groundHeight } from './terrain.js';
import { createVegetation, haze } from './vegetation.js';
// Shared landscape details, deliberately outside the experimental prop root.
// The islands' heights (local shape per island) and their palm trunks and boulders, filled by addCoastDetails(), so
// walkers can reach the headland's forest edge along the sand without walking into the hill.
const islands=[],obstacles=[];
export const islandHeight=(x,z)=>{let y=-Infinity;for(const i of islands){const lx=x-i.cx,lz=z-i.cz;if((lx/i.rx)**2+(lz/i.rz)**2<1)y=Math.max(y,i.shape(lx,lz));}return y;};
// The ground a walker or camera stands on: the beach or, where it rises out of the sand, an island.
export const landHeight=(x,z)=>Math.max(groundHeight(x,z),islandHeight(x,z));
// Can a walker stand here? Not where the island rises more than 15 cm out of the sand (the forest edge) or on a palm
// trunk or boulder (radius: the walker's).
export function shoreClear(x,z,radius){
 if(islandHeight(x,z)>groundHeight(x,z)+.15)return false;
 for(const [ox,oz,r] of obstacles)if((x-ox)**2+(z-oz)**2<(r+radius)**2)return false;
 return true;
}
export function addCoastDetails(scene) {
 islands.length=obstacles.length=0;
 let seed=7921;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const land=new THREE.Group();land.name='shared-coastal-landforms';scene.add(land);
 function hill(cx,cz,rx,rz,height){
  // A rounded hill: gentle at the water, rising to an off-centre summit (no cliff skirt). Bare rock is a broken band
  // just above the water line and the steepest faces; the rest is forest floor.
  const shape=(x,z)=>{const e=Math.max(0,1-(x/rx)**2-(z/rz)**2),px=x/rx-.14,pz=z/rz+.1,peak=Math.max(0,1-2.2*(px*px+pz*pz));
   const n=.1*Math.sin(x*.14+z*.06)+.07*Math.sin(x*.31-z*.22)+.05*Math.sin(x*.8+z*.5);
   return height*(.5*e**1.6+.5*peak**1.7*e**.5)*(1+n)-.5;};
  const steepness=(x,z)=>Math.hypot(shape(x+1,z)-shape(x-1,z),shape(x,z+1)-shape(x,z-1))/2;
  const rock=(x,z,y)=>y>.35&&(y<1.3+1.6*(.5+.5*Math.sin(x*.37+z*.23)*Math.cos(z*.29-x*.11))||steepness(x,z)>1.25);
  const g=new THREE.PlaneGeometry(rx*2,rz*2,140,90);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=shape(x,z);p.setY(i,y);const h=Math.sin(x*12.9898+z*78.233)*43758.5453,f=.8+.35*(h-Math.floor(h)),blend=Math.sin(x*.9)*Math.sin(z*.7)*.5+.5;
   // Sand at the water, a dark wet-rock band above it, then shaded forest floor (green-brown, so gaps between
   // crowns read as shade rather than black or grey).
   const c=new THREE.Color(y<.35?0xcdbb92:rock(x,z,y)?(y<1.2?0x4a463e:0x67625a):blend>.5?0x3f4d2a:0x4b5631);c.multiplyScalar(f);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,haze(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));mesh.position.set(cx,0,cz);mesh.receiveShadow=true;mesh.castShadow=true;land.add(mesh);
  // The old terrain (a 110 × 70 grid) drew one number per vertex and the old blob trees drew from the shared seed over
  // the old island shape; draw the same numbers so
  // the tide debris below stays where it was.
  const old=(x,z)=>{const e=Math.max(0,1-(x/rx)**2-(z/rz)**2);return Math.pow(e,.7)*(height*(.70+.18*Math.sin(x*.14+z*.06)+.12*Math.sin(x*.31-z*.22))+2*Math.sin(x*.8+z*.5))-.5;};
  for(let i=0;i<111*71;i++)rand();
  for(let i=0;i<3200;i++){const x=(rand()-.5)*rx*1.65,z=(rand()-.5)*rz*1.65;if(old(x,z)<3){i--;continue;}for(let k=0;k<5;k++)rand();}
  return {shape,rock};
 }
 const list=[[90,-340,105,40,29,'far',{canopy:3400,shrub:700,palm:170,boulder:320,plant:900},211],[114,-58,64,78,29,'near',{canopy:3100,shrub:900,palm:220,boulder:380,plant:1300},307]];
 const plants=new THREE.Group();plants.name='island-vegetation';land.add(plants);
 const vegetation=createVegetation(plants);
 for(const [cx,cz,rx,rz,h,detail,counts,seed] of list){const {shape,rock}=hill(cx,cz,rx,rz,h);islands.push({cx,cz,rx,rz,shape});vegetation.plant({cx,cz,rx,rz,shape,rock,seed,detail,counts});}
 vegetation.finish();
 // Only the trunks and boulders a walker on the sand can reach.
 obstacles.push(...vegetation.obstacles.filter(([x,z,r])=>z>-60&&islandHeight(x,z)<groundHeight(x,z)+.15+r));
 const debris=new THREE.Group();debris.name='shared-tide-debris';scene.add(debris);
 const geometries=[new THREE.SphereGeometry(1,7,4),new THREE.IcosahedronGeometry(1,0),new THREE.TorusGeometry(1,.12,4,7,3.5)];
 const materials=[new THREE.MeshStandardMaterial({color:0xeee1c8}),new THREE.MeshStandardMaterial({color:0x6e7167}),new THREE.MeshStandardMaterial({color:0x494333})];
 for(let type=0;type<3;type++){
  const m=new THREE.InstancedMesh(geometries[type],materials[type],240);const o=new THREE.Object3D();
  for(let i=0;i<240;i++){const x=(rand()-.5)*150,z=shore(x)+3.8+rand()*1.5+Math.sin(x*1.7)*.4,r=.045+rand()*.10;o.position.set(x,groundHeight(x,z)+.025,z);o.scale.set(r*(type===2?2:1),r*.3,r*.7);o.rotation.set(0,rand()*6,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.castShadow=true;debris.add(m);
 }
}
