import * as T from 'three';
import {groundHeight} from '../terrain.js';
import {surfaceHeight} from '../water.js';

// Foam the rowboat leaves on the water: a wake behind the stern that widens, breaks up and fades, and a foam line
// round the hull at the water line. The wake is built from stern samples taken while under way (world time, place,
// heading, speed); its width and fade are a function of the time since each sample, so frame-by-frame recordings
// stay deterministic. The foam texture is fixed to the water (v runs along the distance travelled, the hull ring
// samples it in world space), so it does not slide along with the boat.
const LIFE=5.5,EVERY=.15,MAX=Math.ceil(LIFE/EVERY)+4,COLS=5,RING=32;
const hash=n=>{const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s);};
// Speckled foam, blurred so it dissolves into patches as its threshold rises. profile(u) sets the density across.
function foamTexture(w,h,profile,seed){
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,w,h);g.globalCompositeOperation='lighter';
 for(let i=0,n=0;n<w*h/22&&i<w*h;i++){const u=hash(i*1.3+seed),v=hash(i*2.7+seed+.5);if(hash(i*3.1+seed+.25)>profile(u))continue;n++;
  const r=1.2+4.5*hash(i*5.9+seed)**2,a=.25+.55*hash(i*7.3+seed);
  for(const dx of [-w,0,w])for(const dy of [-h,0,h]){const x=u*w+dx,y=v*h+dy;if(x<-r||x>w+r||y<-r||y>h+r)continue;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(255,255,255,${a})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r);}}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.NoColorSpace;return t;
}
const bump=(u,c,s)=>Math.exp(-(((u-c)/s)**2));
// Two foam lines where the hull's bow waves spread, a churned middle from the strokes, a little foam in between.
const WAKE=u=>.06+.9*bump(u,.06,.045)+.9*bump(u,.94,.045)+.35*bump(u,.5,.12);
function foamMaterial(map,world){
 return new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
  uniforms:{map:{value:map}},
  vertexShader:`attribute float fade;varying vec2 vUv;varying vec2 vWorld;varying float vFade;
   void main(){vUv=uv;vFade=fade;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform sampler2D map;varying vec2 vUv;varying vec2 vWorld;varying float vFade;
   void main(){
    float f=${world?'texture2D(map,vWorld/3.).r*(1.25-vUv.x)':'texture2D(map,vUv).r'};
    // Fading raises the threshold: the foam breaks up into patches before it is gone.
    float a=smoothstep(1.-vFade,1.3-vFade,f+.15)*min(1.,vFade*2.5)*.7;
    if(a<.01)discard;
    gl_FragColor=vec4(vec3(.95,.98,1.),a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
}
function strip(n,material){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(n*3),3).setUsage(T.DynamicDrawUsage));
 g.setAttribute('uv',new T.BufferAttribute(new Float32Array(n*2),2).setUsage(T.DynamicDrawUsage));g.setAttribute('fade',new T.BufferAttribute(new Float32Array(n),1).setUsage(T.DynamicDrawUsage));
 const m=new T.Mesh(g,material);m.frustumCulled=false;m.renderOrder=3;return m;
}
export function createWake(scene){
 const root=new T.Group();root.name='wake';scene.add(root);
 const trail=strip(MAX*COLS,foamMaterial(foamTexture(256,512,WAKE,1),false));trail.name='wake-trail';root.add(trail);
 const ring=strip(RING*2,foamMaterial(foamTexture(256,256,()=>.55,7),true));ring.name='hull-foam';ring.visible=false;root.add(ring);
 {const idx=[];for(let i=0;i<RING;i++){const j=(i+1)%RING;idx.push(i,j,RING+i,j,RING+j,RING+i);}ring.geometry.setIndex(idx);}
 const samples=[],head={t:-1e9,x:0,z:0,yaw:0,speed:0,half:.5,d:0},v=new T.Vector3(),n=new T.Vector3();let loop=[];
 // Each boat frame: the stern's place (the middle of its transom at the water), heading, speed and half beam.
 function record(t,x,z,yaw,speed,half){
  const last=samples[samples.length-1],d=last&&t-last.t<.4?last.d+Math.hypot(x-last.x,z-last.z):0;
  Object.assign(head,{t,x,z,yaw,speed,half,d});
  if(speed>.3&&(!last||t-last.t>=EVERY-1e-6)){samples.push({...head});if(samples.length>MAX-1)samples.shift();}
 }
 function update(t){
  while(samples.length&&t-samples[0].t>LIFE)samples.shift();
  const list=samples.filter(s=>s.t<=t+1e-6),last=list[list.length-1];
  if(last&&head.t>last.t&&head.t<=t+1e-6&&head.t-last.t<.4&&head.speed>.3)list.push(head);
  const p=trail.geometry.attributes.position.array,uv=trail.geometry.attributes.uv.array,f=trail.geometry.attributes.fade.array,idx=[];
  list.forEach((s,i)=>{const age=t-s.t,cx=Math.cos(s.yaw),sx=-Math.sin(s.yaw),strength=T.MathUtils.clamp((s.speed-.3)/2.5,0,1);
   // Wider as it ages (the bow waves spread out), sooner at speed; the fade starts once it has left the stern.
   // The bow waves leave at about the Kelvin angle (19.5°: half width ≈ .35 × distance behind), capped for a fast boat.
   const half=s.half*.8+age*Math.min(1.2,.35*s.speed),fade=strength*.85*(1-age/LIFE)**2*Math.min(1,.35+age*4);
   for(let k=0;k<COLS;k++){const u=k/(COLS-1),o=(u*2-1)*half,x=s.x+cx*o,z=s.z+sx*o,a=(i*COLS+k);
    p[a*3]=x;p[a*3+1]=surfaceHeight(x,z,t)+.025;p[a*3+2]=z;uv[a*2]=u;uv[a*2+1]=s.d/7;
    // Not over the sand where the wake reaches the beach.
    f[a]=groundHeight(x,z)<p[a*3+1]-.08?fade:0;}
   if(i&&s.t-list[i-1].t<.4)for(let k=0;k<COLS-1;k++){const a=(i-1)*COLS+k,b=i*COLS+k;idx.push(a,a+1,b,a+1,b+1,b);}});
  trail.geometry.setIndex(idx);for(const k of ['position','uv','fade'])trail.geometry.attributes[k].needsUpdate=true;
 }
 // The hull's outline at the water line in vessel space ({x,z,nx,nz} round the hull, n pointing out).
 function setHull(points){loop=points;}
 // Each boat frame, after the vessel is placed: the foam line hugs the hull, wider at the bow when under way.
 function hull(t,matrix,speed){
  if(loop.length!==RING){ring.visible=false;return;}ring.visible=true;
  const p=ring.geometry.attributes.position.array,uv=ring.geometry.attributes.uv.array,f=ring.geometry.attributes.fade.array,s=Math.abs(speed);
  loop.forEach((q,i)=>{v.set(q.x,0,q.z).applyMatrix4(matrix);n.set(q.nx,0,q.nz).transformDirection(matrix);n.y=0;n.normalize();
   const bow=Math.max(0,-q.nz),w=.14+.04*s+.22*bow*Math.min(s,4),y=surfaceHeight(v.x,v.z,t)+.02,fade=.42+.1*Math.min(1,s/3)+.12*bow*Math.min(1,s/3);
   const wet=groundHeight(v.x,v.z)<y-.1;
   p[i*3]=v.x-n.x*.03;p[i*3+1]=y;p[i*3+2]=v.z-n.z*.03;uv[i*2]=0;uv[i*2+1]=0;f[i]=wet?fade:0;
   const ox=v.x+n.x*w,oz=v.z+n.z*w,j=RING+i;p[j*3]=ox;p[j*3+1]=surfaceHeight(ox,oz,t)+.02;p[j*3+2]=oz;uv[j*2]=1;uv[j*2+1]=0;f[j]=wet?fade*.6:0;});
  for(const k of ['position','uv','fade'])ring.geometry.attributes[k].needsUpdate=true;
 }
 function reset(){samples.length=0;head.t=-1e9;ring.visible=false;trail.geometry.setIndex([]);}
 return {root,trail,ring,record,update,setHull,hull,reset,RING,get samples(){return samples.length;}};
}
