import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { groundHeight, shoreGLSL } from './terrain.js';
import { propRoot, loadProps } from './props.js';
const params=new URLSearchParams(location.search);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.65;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x9fc4d4,.0007);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,4000);
const sky=new Sky();sky.scale.setScalar(4500);sky.material.fragmentShader=sky.material.fragmentShader.replace("vec4( texColor, 1.0 )","vec4( texColor * 0.48, 1.0 )");scene.add(sky);
Object.assign(sky.material.uniforms.turbidity,{value:1.7});sky.material.uniforms.rayleigh.value=2.5;
sky.material.uniforms.mieCoefficient.value=.003;sky.material.uniforms.mieDirectionalG.value=.82;
const sun=new THREE.Vector3(-.45,.65,-.62).normalize();sky.material.uniforms.sunPosition.value.copy(sun);
scene.add(new THREE.HemisphereLight(0xd8edff,0xc9a777,.85));
const light=new THREE.DirectionalLight(0xfff1da,2.3);light.position.copy(sun).multiplyScalar(100);scene.add(light);
light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-65,right:65,top:65,bottom:-65});light.shadow.bias=-.0004;
const geo=new THREE.PlaneGeometry(2,2,500,500);geo.rotateX(-Math.PI/2);
const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=Math.sign(pos.getX(i))*pos.getX(i)**2*2200,z=Math.sign(pos.getZ(i))*pos.getZ(i)**2*2200;pos.setXYZ(i,x,groundHeight(x,z),z);}geo.computeVertexNormals();
const sandMat=new THREE.MeshStandardMaterial({color:0xf4d7ab,roughness:.92});
sandMat.onBeforeCompile=s=>{
 s.vertexShader='varying vec3 vWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWorld=(modelMatrix*vec4(position,1.)).xyz;');
 s.fragmentShader='varying vec3 vWorld;\n'+shoreGLSL+'\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float d=vWorld.z-shore(vWorld.x);
 float grain=fract(sin(dot(vWorld.xz,vec2(123.23,47.77)))*43567.2);
 float ripple=sin(vWorld.x*2.2+sin(vWorld.z*.7)*2.0+sin(vWorld.x*.3))*sin(vWorld.z*8.0);
 diffuseColor.rgb*=mix(.58,1.0,smoothstep(0.,4.,d))*(.95+grain*.10+ripple*.025);
 `);
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
water.material.uniforms.size.value=9;
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
 float crest=sin(coast*2.5-time*1.5+sin(worldPosition.x*.5)*.45);
 float foam=pow(max(0.,crest),14.)*(1.-smoothstep(.3,4.5,coast));
 float breakup=.5+.5*sin(p.x*13.+sin(p.y*21.));
 foam*=.5+.5*breakup;
 float edge=(1.-smoothstep(.02,.35+breakup*.2,coast))*.6;
 vec3 outgoingLight=mix(sea,min(reflectionSample,vec3(.22,.42,.6)),min(.22,reflectance*.22)) + specularLight*.24;
 outgoingLight=mix(outgoingLight,vec3(.88,.95,.89),clamp(foam+edge,0.,.85));
`);
// A continuous distant island landform, outside the prop experiment.
const islandGeo=new THREE.PlaneGeometry(210,80,120,40);islandGeo.rotateX(-Math.PI/2);
const ip=islandGeo.attributes.position;
for(let i=0;i<ip.count;i++){const x=ip.getX(i),z=ip.getZ(i);const envelope=Math.max(0,1-(x/105)**2)*Math.max(0,1-(z/40)**2);ip.setY(i,Math.pow(envelope,2)*(12+9*Math.sin(x*.045)+3*Math.sin(x*.13))-.8);}islandGeo.computeVertexNormals();
const island=new THREE.Mesh(islandGeo,new THREE.MeshStandardMaterial({color:0x315f60,roughness:1}));island.position.set(90,0,-340);scene.add(island);
scene.add(propRoot);
const {config,results}=await loadProps(params.get('group')||'A');
const view=config.cameras[params.get('cam')]||config.cameras.wide;camera.position.fromArray(view.pos);camera.lookAt(new THREE.Vector3().fromArray(view.target));
let controls;if(!params.has('cam')){controls=new OrbitControls(camera,renderer.domElement);controls.target.fromArray(view.target);controls.maxPolarAngle=Math.PI*.48;controls.minDistance=2;controls.maxDistance=180;controls.enableDamping=true;}
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.035,.4,3.0));composer.addPass(new OutputPass());
const clock=new THREE.Clock();const fixed=params.has('time')?Number(params.get('time')):null;
function frame(){requestAnimationFrame(frame);water.material.uniforms.time.value=fixed??clock.getElapsedTime();controls?.update();composer.render();}frame();
window.__SCENE__={scene,camera,water,propRoot,results,renderer};window.__READY__=true;
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
