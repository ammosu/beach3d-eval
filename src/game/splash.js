import * as T from 'three';
import {surfaceHeight} from '../water.js';

// Water splashes for the rowboat: paddle blades entering and leaving the water, spray off the bow.
// Each splash is an event (world time, place, size, optional push direction); drops and a ring are a pure function of
// the time since it, so frame-by-frame recordings stay deterministic.
const G=9.8,MAX=40;
const hash=n=>{const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s);};
export function createSplash(scene){
 const root=new T.Group();root.name='splash';scene.add(root);
 const drops=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshBasicMaterial({color:0xf4fbff,transparent:true,opacity:.8}),1600);drops.frustumCulled=false;drops.count=0;root.add(drops);
 // Foam left on the water: a speckled ring, densest at its rim, that spreads and fades.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c2=canvas.getContext('2d');
 for(let i=0;i<900;i++){const a=hash(i)*Math.PI*2,r=64*Math.min(1,Math.abs(.72+.28*(hash(i+.5)*2-1)**3)),rr=1+2.5*hash(i+.25);c2.fillStyle=`rgba(255,255,255,${.35+.5*hash(i+.75)})`;c2.beginPath();c2.arc(64+Math.cos(a)*(r-rr),64+Math.sin(a)*(r-rr),rr,0,Math.PI*2);c2.fill();}
 const foam=new T.CanvasTexture(canvas);foam.colorSpace=T.SRGBColorSpace;
 const ringGeo=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2),rings=Array.from({length:MAX},()=>{const m=new T.Mesh(ringGeo,new T.MeshBasicMaterial({map:foam,transparent:true,depthWrite:false}));m.visible=false;root.add(m);return m;});
 const events=[],dummy=new T.Object3D();let next=0;
 // size: about the spray's reach in metres; dir (x,z): drops lean that way (bow spray), else they fan out evenly;
 // life: seconds until the ring and drops are gone. The oldest splash makes room for a new one.
 function emit(t,x,y,z,size,dx=0,dz=0,life=1.4){const e={t,x,y,z,size,dx,dz,life,seed:next++%997};if(events.length<MAX)events.push(e);else events[events.reduce((o,v,i)=>v.t<events[o].t?i:o,0)]=e;}
 function update(t){
  let d=0,r=0;
  for(const e of events){const age=t-e.t;if(age<0||age>=e.life)continue;const fade=1-age/e.life;
   const level=surfaceHeight(e.x,e.z,t);
   if(r<rings.length){const m=rings[r++];m.visible=true;m.position.set(e.x,level+.03,e.z);m.scale.setScalar(e.size*(.45+1.3*age));m.rotation.y=e.seed;m.material.opacity=.8*fade*fade;}
   const n=Math.round(16+110*e.size);
   for(let i=0;i<n&&d<drops.instanceMatrix.count;i++){const h=hash(i+e.seed*7.1),a=i*2.39996+e.seed,sp=e.size*(.5+1.3*h),up=e.size*(2.2+2.6*hash(i*3.7+e.seed));
    const vx=Math.cos(a)*sp+e.dx*e.size*2.2,vz=Math.sin(a)*sp+e.dz*e.size*2.2,y=e.y+up*age-G*age*age/2;
    if(y<level-.05)continue;
    dummy.position.set(e.x+vx*age,y,e.z+vz*age);dummy.scale.setScalar((.016+.03*hash(i*5.3))*(.7+e.size)*Math.sqrt(fade));dummy.updateMatrix();drops.setMatrixAt(d++,dummy.matrix);}
  }
  drops.count=d;drops.instanceMatrix.needsUpdate=true;
  for(let i=r;i<rings.length;i++)rings[i].visible=false;
 }
 function reset(){events.length=0;drops.count=0;for(const m of rings)m.visible=false;}
 return {root,emit,update,reset,get active(){return events.length;}};
}
