import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { groundHeight, shoreGLSL } from './terrain.js';
import { addCoastDetails } from './coast.js';
import { propRoot, loadProps } from './props.js';
const params=new URLSearchParams(location.search);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.65;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x9fc4d4,.0007);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,4000);
const sky=new THREE.Mesh(new THREE.SphereGeometry(1800,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{},vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 varying vec3 direction;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 col=mix(vec3(.24,.53,.79),vec3(.012,.15,.48),pow(h,.28));
 vec2 uv=vec2(atan(d.x,-d.z),asin(d.y));
 float cloud=0.;float shade=0.;
 for(int i=0;i<4;i++){vec2 center=vec2(-.65+float(i)*.76,.19+.09*sin(float(i)*2.));
 vec2 q=(uv-center)/vec2(.115,.045);
 float billow=min(length(q-vec2(-.65,.02)),min(length((q-vec2(.0,.36))*vec2(.85,.8)),length(q-vec2(.75,-.04))));
 float n=noise(uv*85.)*.10+noise(uv*173.)*.04;
 cloud=max(cloud,1.-smoothstep(.72,1.12,billow+n));shade=max(shade,clamp(q.y*.30+.55,0.,1.)*cloud);}
 col=mix(col,mix(vec3(.47,.59,.72),vec3(1.5,1.42,1.28),shade),cloud*.95);
 float sun=pow(max(0.,dot(d,normalize(vec3(.45,.38,-.8)))),850.);col+=vec3(5.,3.8,2.3)*sun;
 gl_FragColor=vec4(col,1.);}` }));scene.add(sky);
const sun=new THREE.Vector3(.45,.38,-.8).normalize();
scene.add(new THREE.HemisphereLight(0xb8dfff,0xc9a777,1.25));
const light=new THREE.DirectionalLight(0xffd7a0,3.4);light.position.copy(sun).multiplyScalar(100);scene.add(light);
light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-65,right:65,top:65,bottom:-65});light.shadow.bias=-.0004;
const geo=new THREE.PlaneGeometry(2,2,500,500);geo.rotateX(-Math.PI/2);
const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=Math.sign(pos.getX(i))*pos.getX(i)**2*2200,z=Math.sign(pos.getZ(i))*pos.getZ(i)**2*2200;pos.setXYZ(i,x,groundHeight(x,z),z);}geo.computeVertexNormals();
const sandMat=new THREE.MeshStandardMaterial({color:0xf4d7ab,roughness:.92});
sandMat.onBeforeCompile=s=>{
 s.vertexShader='varying vec3 vWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWorld=(modelMatrix*vec4(position,1.)).xyz;');
 s.fragmentShader='varying vec3 vWorld;\n'+shoreGLSL+'\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float d=vWorld.z-shore(vWorld.x)+.22*sin(vWorld.x*1.7)+.12*sin(vWorld.x*4.1);
 float grain=fract(sin(dot(vWorld.xz,vec2(123.23,47.77)))*43567.2);
 float ripple=sin(vWorld.x*2.2+sin(vWorld.z*.7)*2.0+sin(vWorld.x*.3))*sin(vWorld.z*8.0);
 diffuseColor.rgb*=mix(.42,1.0,smoothstep(1.9,3.8,d))*(.95+grain*.10+ripple*.035);
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=mix(.12,.92,smoothstep(2.5,3.6,vWorld.z-shore(vWorld.x)));`);
 s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 float dry=smoothstep(3.,5.,vWorld.z-shore(vWorld.x));
 float phase=vWorld.z*15.+sin(vWorld.x*.8)*1.8+sin(vWorld.z*1.4);
 vec3 rippleNormal=vec3(cos(phase)*.012,0.,cos(phase)*.035);
 normal=normalize(normal+mat3(viewMatrix)*rippleNormal*dry*(.55+.45*sin(vWorld.x*.34)*sin(vWorld.z*.56))/(1.+length(vViewPosition)*.012));`);
 s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
 float wet=1.-smoothstep(2.5,3.6,vWorld.z-shore(vWorld.x));
 float fresnel=pow(1.-abs(dot(normal,normalize(vViewPosition))),3.);
 outgoingLight=mix(outgoingLight,vec3(.20,.39,.55)*(1.+.08*sin(vWorld.x*2.+vWorld.z*8.)),wet*(.07+.55*fresnel));
 #include <opaque_fragment>`);
};
const sand=new THREE.Mesh(geo,sandMat);sand.receiveShadow=true;scene.add(sand);
// Periodic normal map, generated locally; no remote texture dependency.
const n=256,data=new Uint8Array(n*n*4);
for(let y=0;y<n;y++)for(let x=0;x<n;x++){
 let u=x/n*Math.PI*2,v=y/n*Math.PI*2;let dx=0,dy=0;
 for(let k=1;k<=7;k++){dx+=Math.cos(u*k+Math.sin(v*2))* .12;dy+=Math.sin(v*k+Math.cos(u*3))*.12;}
 const normal=new THREE.Vector3(dx,dy,1).normalize();let i=(y*n+x)*4;
 data[i]=(normal.x*.5+.5)*255;data[i+1]=(normal.y*.5+.5)*255;data[i+2]=(normal.z*.5+.5)*255;data[i+3]=255;
}
const normals=new THREE.DataTexture(data,n,n);normals.wrapS=normals.wrapT=THREE.RepeatWrapping;normals.generateMipmaps=true;normals.minFilter=THREE.LinearMipmapLinearFilter;normals.magFilter=THREE.LinearFilter;normals.needsUpdate=true;
const water=new Water(new THREE.PlaneGeometry(4000,4000,320,320),{textureWidth:512,textureHeight:512,waterNormals:normals,sunDirection:sun,sunColor:0xfff4da,waterColor:0x087f9c,distortionScale:1.6,fog:true});
water.rotation.x=-Math.PI/2;water.position.y=.035;scene.add(water);
water.material.uniforms.size.value=18;
water.material.vertexShader=water.material.vertexShader.replace('void main() {',shoreGLSL+'\nvoid main() {').replace('worldPosition = mirrorCoord.xyzw;',`worldPosition = mirrorCoord.xyzw;
 float coast=shore(worldPosition.x)-worldPosition.z;
 float swell=(sin(worldPosition.z*.65+time*1.3+worldPosition.x*.12)*.055+sin(worldPosition.x*.9+worldPosition.z*.7-time)*.025)*smoothstep(0.,10.,coast);
 worldPosition.y+=swell;`).replace('vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );','vec4 mvPosition = viewMatrix * worldPosition;');
water.material.fragmentShader=water.material.fragmentShader.replace('void main() {',shoreGLSL+`\nvoid main() {`);
water.material.fragmentShader=water.material.fragmentShader.replace('vec3 outgoingLight = albedo;',`
 float coast=shore(worldPosition.x)-worldPosition.z;
 if(coast<0.) discard;
 float depth=max(0.,coast*.12);
 vec2 p=worldPosition.xz+surfaceNormal.xz*.25;
 float ripple=sin(p.x*3.2+sin(p.y*.8)*2.)*sin(p.y*9.);
 float c1=sin(p.x*2.3+sin(p.y*1.7+time)*1.6+time*.5);
 float c2=sin(p.y*2.8+sin(p.x*1.4-time*.7)*1.4);
 float caustic=pow(1.-abs(c1*c2),12.);
 vec3 bottom=vec3(.65,.57,.36)*(1.+ripple*.07)+vec3(.23,.28,.15)*caustic;
 vec3 shallow=mix(bottom,vec3(.015,.55,.48),1.-exp(-depth*1.4));
 vec3 sea=mix(shallow,vec3(.008,.105,.23),1.-exp(-depth*.13));
 float crest=sin(coast*1.05-time*1.5+sin(worldPosition.x*.23)*.55);
 float foam=pow(max(0.,crest),12.)*(1.-smoothstep(3.,24.,coast));
 float breakup=.5+.5*sin(p.x*13.+sin(p.y*21.));
 foam*=smoothstep(-.6,.5,sin(p.x*.63+sin(p.y*.4))+sin(p.x*1.4)*.5)*(.5+.5*breakup);
 float edge=(1.-smoothstep(.02,.35+breakup*.2,coast))*.6;
 vec3 outgoingLight=mix(sea,min(reflectionSample,vec3(.22,.42,.6)),min(.22,reflectance*.22)) + min(specularLight*.22,vec3(.8));
 outgoingLight=mix(outgoingLight,vec3(.88,.95,.89),clamp(foam+edge,0.,.85));
`);
addCoastDetails(scene);
scene.add(propRoot);
const {config,results}=await loadProps(params.get('group')||'A');
const view=config.cameras[params.get('cam')]||config.cameras.wide;camera.position.fromArray(view.pos);camera.lookAt(new THREE.Vector3().fromArray(view.target));
const exploreEnabled=params.get('explore')==='1'&&!params.has('cam');
let controls;if(!exploreEnabled&&!params.has('cam')){controls=new OrbitControls(camera,renderer.domElement);controls.target.fromArray(view.target);controls.maxPolarAngle=Math.PI*.48;controls.minDistance=2;controls.maxDistance=180;controls.enableDamping=true;}
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.035,.4,3.0));composer.addPass(new OutputPass());
const explore=exploreEnabled?(await import('./explore.js')).createExplore({scene,camera,renderer,config,results,group:params.get('group')||'A',auto:params.get('auto')==='1'}):null;
let lastFrame=performance.now();
const clock=new THREE.Clock();const fixed=params.has('time')?Number(params.get('time')):null;
function frame(){requestAnimationFrame(frame);water.material.uniforms.time.value=fixed??clock.getElapsedTime();controls?.update();const now=performance.now();explore?.update((now-lastFrame)/1000);lastFrame=now;composer.render();}frame();
window.__SCENE__={scene,camera,water,propRoot,results,renderer};window.__READY__=true;
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
