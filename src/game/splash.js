import * as T from 'three';
import {surfaceHeight} from '../water.js';

// Water splashes for the rowboat: paddle blades entering and leaving the water, spray off the bow, drips off a raised blade.
// Each splash is an event (world time, place, size, optional push direction); drops, mist and a ring are a pure function
// of the time since it, so frame-by-frame recordings stay deterministic.
const G=9.8,MAX=60,DROPS=2000;
const hash=n=>{const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s);};
// Drops are camera-facing quads stretched along their velocity (a drop in flight reads as a short streak, not a
// bead), with a soft edge and a brighter core; mist puffs are the same quads, large, slow and faint.
function dropMaterial(){
 return new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
  vertexShader:`attribute vec3 iPos;attribute vec3 iVel;attribute vec2 iSize;varying vec2 vUv;varying float vAlpha;varying float vMist;
   void main(){vUv=position.xy;vAlpha=iSize.y;vMist=step(.1,iSize.x);
    vec4 c=viewMatrix*vec4(iPos,1.);vec2 v=(viewMatrix*vec4(iVel,0.)).xy;float s=length(v);
    vec2 dir=s>1e-4?v/s:vec2(0.,1.),side=vec2(dir.y,-dir.x);
    // Streak length: how far the drop moves in about 1/40 s, so it reads like a short exposure.
    float len=iSize.x+s*.025;
    c.xy+=dir*position.y*len+side*position.x*iSize.x;gl_Position=projectionMatrix*c;}`,
  fragmentShader:`varying vec2 vUv;varying float vAlpha;varying float vMist;
   void main(){float d=length(vUv);if(d>1.)discard;
    // Drops: a soft edge and a sunlit core, brighter than paper white before tone mapping. Mist (large quads): a
    // dim, very soft puff, so the bloom does not turn it into a glowing ball.
    float drop=smoothstep(1.,.35,d),mist=(1.-d)*(1.-d);
    vec3 col=mix(mix(vec3(1.,1.08,1.15),vec3(1.3),smoothstep(.7,.1,d)),vec3(.85,.92,.98),vMist);
    gl_FragColor=vec4(col,vAlpha*mix(drop,mist,vMist));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
}
export function createSplash(scene){
 const root=new T.Group();root.name='splash';scene.add(root);
 const geo=new T.InstancedBufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));geo.setIndex([0,1,2,0,2,3]);
 const iPos=new T.InstancedBufferAttribute(new Float32Array(DROPS*3),3),iVel=new T.InstancedBufferAttribute(new Float32Array(DROPS*3),3),iSize=new T.InstancedBufferAttribute(new Float32Array(DROPS*2),2);
 for(const a of [iPos,iVel,iSize])a.setUsage(T.DynamicDrawUsage);geo.setAttribute('iPos',iPos);geo.setAttribute('iVel',iVel);geo.setAttribute('iSize',iSize);geo.instanceCount=0;
 const drops=new T.Mesh(geo,dropMaterial());drops.frustumCulled=false;drops.renderOrder=4;root.add(drops);
 // Foam left on the water: a speckled ring, densest at its rim, that spreads and fades.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c2=canvas.getContext('2d');
 for(let i=0;i<900;i++){const a=hash(i)*Math.PI*2,r=64*Math.min(1,Math.abs(.72+.28*(hash(i+.5)*2-1)**3)),rr=1+2.5*hash(i+.25);c2.fillStyle=`rgba(255,255,255,${.35+.5*hash(i+.75)})`;c2.beginPath();c2.arc(64+Math.cos(a)*(r-rr),64+Math.sin(a)*(r-rr),rr,0,Math.PI*2);c2.fill();}
 const foam=new T.CanvasTexture(canvas);foam.colorSpace=T.SRGBColorSpace;
 const ringGeo=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2),rings=Array.from({length:MAX},()=>{const m=new T.Mesh(ringGeo,new T.MeshBasicMaterial({map:foam,transparent:true,depthWrite:false}));m.visible=false;root.add(m);return m;});
 const events=[];let next=0,d=0;
 const put=(x,y,z,vx,vy,vz,size,alpha)=>{if(d>=DROPS)return;iPos.setXYZ(d,x,y,z);iVel.setXYZ(d,vx,vy,vz);iSize.setXY(d,size,alpha);d++;};
 // size: about the spray's reach in metres; dir (x,z): drops lean that way (bow spray), else they fan out evenly;
 // life: seconds until the ring and drops are gone. kind 'drip': a few drops falling from a raised blade, whose
 // ring shows where they land. The oldest splash makes room for a new one.
 function emit(t,x,y,z,size,dx=0,dz=0,life=1.4,kind='splash'){const e={t,x,y,z,size,dx,dz,life,kind,seed:next++%997};if(events.length<MAX)events.push(e);else events[events.reduce((o,v,i)=>v.t<events[o].t?i:o,0)]=e;}
 function update(t){
  let r=0;d=0;
  for(const e of events){const age=t-e.t;if(age<0||age>=e.life)continue;const fade=1-age/e.life;
   const level=surfaceHeight(e.x,e.z,t);
   if(e.kind==='drip'){
    // Drops falling from the blade; a small ring where they hit the water.
    const fall=Math.sqrt(2*Math.max(0,e.y-level)/G);
    for(let i=0;i<3;i++){const h=hash(i+e.seed*3.3),a=i*2.4+e.seed,o=.05*h,tt=age-.05*i;if(tt<0)continue;const y=e.y-G*tt*tt/2;if(y<level)continue;
     put(e.x+Math.cos(a)*o,y,e.z+Math.sin(a)*o,0,-G*tt,0,.012+.008*h,.95);}
    if(age>fall&&r<rings.length){const k=age-fall,m=rings[r++];m.visible=true;m.position.set(e.x,level+.03,e.z);m.scale.setScalar(.05+.35*k);m.rotation.y=e.seed;m.material.opacity=.55*Math.max(0,1-k/.8);}
    continue;}
   if(r<rings.length){const m=rings[r++];m.visible=true;m.position.set(e.x,level+.03,e.z);m.scale.setScalar(e.size*(.45+1.3*age));m.rotation.y=e.seed;m.material.opacity=.8*fade*fade;}
   // Small swirls throw only a few drops; drops leave from across a blade's width, not one point.
   const n=e.size<.15?4:Math.round(12+80*e.size),spread0=Math.min(.15,e.size*.5);
   for(let i=0;i<n;i++){const h=hash(i+e.seed*7.1),a=i*2.39996+e.seed,sp=e.size*(.5+1.3*h),up=e.size*(2.2+2.6*hash(i*3.7+e.seed));
    const vx=Math.cos(a)*sp+e.dx*e.size*2.2,vz=Math.sin(a)*sp+e.dz*e.size*2.2,vy=up-G*age,y=e.y+up*age-G*age*age/2;
    if(y<level-.05)continue;
    put(e.x+Math.cos(a)*spread0*h+vx*age,y,e.z+Math.sin(a)*spread0*h+vz*age,vx,vy,vz,(.014+.022*hash(i*5.3))*(.7+e.size),.7*Math.sqrt(fade));}
   // A bigger splash throws a little mist that drifts up and thins out.
   if(e.size>.2)for(let i=0;i<3;i++){const h=hash(i*9.1+e.seed),a=i*2.1+e.seed,k=Math.min(1,age/.6);if(k>=1)break;
    put(e.x+Math.cos(a)*e.size*.6*k,e.y+.1+e.size*(.5+.4*h)*k,e.z+Math.sin(a)*e.size*.6*k,0,0,0,e.size*(.35+.7*k),.3*(1-k)*(1-k));}
  }
  geo.instanceCount=d;iPos.needsUpdate=iVel.needsUpdate=iSize.needsUpdate=true;
  for(let i=r;i<rings.length;i++)rings[i].visible=false;
 }
 function reset(){events.length=0;geo.instanceCount=0;for(const m of rings)m.visible=false;}
 return {root,emit,update,reset,get active(){return events.length;}};
}
