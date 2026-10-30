import * as T from 'three';
import { surfaceHeight } from '../water.js';
import { landHeight } from '../coast.js';

// What a diver sees around them (the surface from below is the water shader's Snell's window): the water's own haze
// (the scene's fog turned blue-green, thicker and darker with depth), shafts of sunlight slanting down from
// the surface along the refracted sun, and specks drifting in the water (marine snow). Everything is placed from the
// camera and the water clock alone, so any frame renders the same on its own. Off whenever the camera is above water.
export function createUnderwater({scene,camera,sun}){
 const shallow=new T.Color(0x1a8c94),deep=new T.Color(0x06323f),saved={color:new T.Color(),density:0,lights:[],background:null};let under=false;
 // Sunlight and skylight under the water are filtered (red first) and dimmer with depth; the sky dome is hidden (it
 // has no fog, and would show through where the far surface meets the far seabed).
 const lights=[];scene.traverse(o=>{if(o.isDirectionalLight||o.isHemisphereLight)lights.push(o);});
 const sky=scene.children.find(o=>o.isMesh&&o.geometry?.type==='SphereGeometry'&&o.material?.side===T.BackSide);
 const filter=new T.Color(),tint=new T.Color(.55,.95,.9);
 // The direction sunlight travels under the water (refracted at a flat surface).
 const down=new T.Vector3().copy(sun).negate();{const n=new T.Vector3(0,1,0),eta=1/1.333,c=-n.dot(down),k=1-eta*eta*(1-c*c);down.multiplyScalar(eta).addScaledVector(n,eta*c-Math.sqrt(k)).normalize();}

 // Shafts: one quad per cell of a 3 m grid round the camera (about half the cells), each turned about its own axis
 // to face the camera, brightest just under the surface and fading down over about 12 m; each swells and fades on
 // its own slow beat; a shaft passing close by the eye fades out (it would fill the screen).
 const CELLS=7,SHAFTS=CELLS*CELLS;
 const shaftGeo=new T.BufferGeometry(),pos=new Float32Array(SHAFTS*4*3),uv=new Float32Array(SHAFTS*4*2),glow=new Float32Array(SHAFTS*4),index=[];
 for(let i=0;i<SHAFTS;i++){uv.set([0,0,1,0,0,1,1,1],i*8);index.push(i*4,i*4+1,i*4+2,i*4+2,i*4+1,i*4+3);}
 shaftGeo.setAttribute('position',new T.BufferAttribute(pos,3));shaftGeo.setAttribute('uv',new T.BufferAttribute(uv,2));shaftGeo.setAttribute('glow',new T.BufferAttribute(glow,1));shaftGeo.setIndex(index);
 const shaftMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,fog:false,
  vertexShader:'attribute float glow;varying vec2 vUv;varying float vGlow;void main(){vUv=uv;vGlow=glow;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 vUv;varying float vGlow;void main(){float across=sin(vUv.x*3.14159);across*=across;float along=exp(-vUv.y*2.6)*smoothstep(0.,.04,vUv.y);gl_FragColor=vec4(vec3(.55,.85,.8)*across*along*vGlow,1.);}'});
 const shafts=new T.Mesh(shaftGeo,shaftMat);shafts.frustumCulled=false;shafts.visible=false;shafts.renderOrder=3;scene.add(shafts);
 const hash=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);};
 const top=new T.Vector3(),side=new T.Vector3(),view=new T.Vector3(),corner=new T.Vector3();
 function placeShafts(t){
  const cx=Math.floor(camera.position.x/3),cz=Math.floor(camera.position.z/3),length=14;let n=0;
  for(let i=0;i<CELLS;i++)for(let j=0;j<CELLS;j++){const gx=cx+i-3,gz=cz+j-3,h=hash(gx,gz),k=n++;
   let g=0;if(h<.55){top.set((gx+hash(gz,gx+7))*3,0,(gz+hash(gx+3,gz))*3);top.addScaledVector(down,.25);
    const beat=.5+.5*Math.sin(t*(.35+.3*hash(gx+1,gz))+h*40),dist=Math.hypot(top.x-camera.position.x,top.z-camera.position.z);
    view.subVectors(camera.position,top);const off=side.crossVectors(view,down).length();
    g=.11*beat*beat*Math.max(0,1-dist/11)*T.MathUtils.smoothstep(off,1.2,3.5)*(top.y>landHeight(top.x,top.z)?1:0);}
   view.subVectors(camera.position,top);side.crossVectors(down,view).normalize().multiplyScalar(.35+.6*hash(gz+5,gx));
   const w=k*12;
   corner.copy(top).sub(side);pos.set([corner.x,corner.y,corner.z],w);corner.copy(top).add(side);pos.set([corner.x,corner.y,corner.z],w+3);
   corner.copy(top).addScaledVector(down,length).sub(side);pos.set([corner.x,corner.y,corner.z],w+6);corner.copy(top).addScaledVector(down,length).add(side);pos.set([corner.x,corner.y,corner.z],w+9);
   glow.fill(g,k*4,k*4+4);}
  shaftGeo.attributes.position.needsUpdate=true;shaftGeo.attributes.glow.needsUpdate=true;
 }

 // Marine snow: specks in a 14 m box that moves with the camera (each wraps round it), sinking and drifting slowly.
 const SNOW=700,seed=new Float32Array(SNOW*3);for(let i=0;i<SNOW*3;i++)seed[i]=hash(i*1.7,i*.37+1);
 const snowGeo=new T.BufferGeometry();snowGeo.setAttribute('position',new T.BufferAttribute(seed,3));
 const snowMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,uniforms:{eye:{value:camera.position},time:{value:0},scale:{value:400}},
  vertexShader:`uniform vec3 eye;uniform float time;uniform float scale;varying float vFade;
   void main(){vec3 drift=vec3(.03,-.05,.02)*time+vec3(sin(time*.3+position.x*20.),0.,cos(time*.25+position.z*20.))*.04;
    vec3 p=eye+(fract(position+drift/14.-eye/14.)-.5)*14.;vec4 mv=viewMatrix*vec4(p,1.);
    float d=length(mv.xyz);vFade=smoothstep(7.,3.,d)*smoothstep(.2,.6,d);gl_PointSize=clamp(scale*.012/d,1.,4.);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:'varying float vFade;void main(){vec2 c=gl_PointCoord-.5;gl_FragColor=vec4(vec3(.5,.62,.6)*vFade*smoothstep(.25,.1,length(c)),1.);}'});
 const snow=new T.Points(snowGeo,snowMat);snow.frustumCulled=false;snow.visible=false;snow.renderOrder=3;scene.add(snow);

 function update(t,height){
  const level=surfaceHeight(camera.position.x,camera.position.z,t);
  const now=camera.position.y<level-.02;
  const fog=scene.fog;
  if(now!==under){under=now;
   if(under){saved.color.copy(fog.color);saved.density=fog.density;saved.lights=lights.map(l=>({color:l.color.clone(),intensity:l.intensity,ground:l.groundColor?.clone()}));saved.background=scene.background;}
   else{fog.color.copy(saved.color);fog.density=saved.density;lights.forEach((l,i)=>{const v=saved.lights[i];l.color.copy(v.color);l.intensity=v.intensity;if(v.ground)l.groundColor.copy(v.ground);});scene.background=saved.background;}
   shafts.visible=snow.visible=under;if(sky)sky.visible=!under;}
  if(!under)return false;
  // Darker and greener the deeper the eye; the haze thickens a little with depth too.
  const depth=Math.max(0,level-camera.position.y);fog.color.copy(shallow).lerp(deep,Math.min(1,depth/16));fog.density=.085+.004*depth;
  if(!(scene.background instanceof T.Color)||scene.background===saved.background)scene.background=new T.Color();scene.background.copy(fog.color);
  filter.copy(tint).lerp(new T.Color(.25,.7,.75),Math.min(1,depth/18));
  lights.forEach((l,i)=>{const v=saved.lights[i];l.color.copy(v.color).multiply(filter);l.intensity=v.intensity*(l.isDirectionalLight?Math.exp(-depth*.07)*.85:.8);if(v.ground)l.groundColor.copy(v.ground).multiply(filter).multiplyScalar(.6);});
  placeShafts(t);snowMat.uniforms.time.value=t;snowMat.uniforms.scale.value=height;
  return true;
 }
 return {update,get under(){return under;},shafts,snow};
}
