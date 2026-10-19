import * as THREE from 'three';
import { createWater, shadeSand } from './water.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { groundHeight } from './terrain.js';
import { addCoastDetails } from './coast.js';
import { propRoot, loadProps } from './props.js';
const params=new URLSearchParams(location.search);
const gaming=location.pathname.endsWith('/game.html');
if(gaming){params.set('explore','1');params.delete('cam');if(!params.has('group'))params.set('group','B');}
const comparing=location.pathname.endsWith('/compare.html');
if(comparing){params.set('explore','1');params.delete('cam');}
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
const water=createWater(sun);scene.add(water);
// Share the uniform object itself: captures, live mode and compare panes cannot drift.
shadeSand(sandMat,water.material.uniforms.time);
const sand=new THREE.Mesh(geo,sandMat);sand.receiveShadow=true;scene.add(sand);
addCoastDetails(scene);
scene.add(propRoot);
const {config,results}=await loadProps(params.get('group')||'A');
const view=config.cameras[params.get('cam')]||config.cameras.wide;camera.position.fromArray(view.pos);camera.lookAt(new THREE.Vector3().fromArray(view.target));
const exploreEnabled=params.get('explore')==='1'&&!params.has('cam');
let controls;if(!exploreEnabled&&!params.has('cam')){controls=new OrbitControls(camera,renderer.domElement);controls.target.fromArray(view.target);controls.maxPolarAngle=Math.PI*.48;controls.minDistance=2;controls.maxDistance=180;controls.enableDamping=true;}
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.035,.4,3.0));composer.addPass(new OutputPass());
const comparison=comparing?await (await import('./compare.js')).createComparison({scene,camera,renderer,composer,config,results,initialGroup:params.get('group')||'A'}):null;
const explore=exploreEnabled?(await import('./explore.js')).createExplore({scene,camera,renderer,config,results,group:params.get('group')||'A',auto:params.get('auto')==='1',comparison:comparing,gameMode:gaming}):null;
const game=gaming?await (await import('./game/index.js')).createGame({scene,camera,renderer,water,config,explore,auto:params.get('auto')==='1'}):null;
let lastFrame=performance.now(),lastWaterTime=water.material.uniforms.time.value;
comparison?.connect(explore);
const clock=new THREE.Clock();const fixed=params.has('time')?Number(params.get('time')):null;
function frame(){requestAnimationFrame(frame);water.material.uniforms.time.value=window.__TIME__??fixed??clock.getElapsedTime();controls?.update();const now=performance.now();const gameDt=Math.max(0,Math.min(.1,water.material.uniforms.time.value-lastWaterTime));explore?.update(gaming?gameDt:(now-lastFrame)/1000);game?.update(gameDt,water.material.uniforms.time.value);lastWaterTime=water.material.uniforms.time.value;lastFrame=now;if(comparison)comparison.render();else composer.render();}frame();
window.__SCENE__={scene,camera,water,propRoot,results,renderer};window.__READY__=true;
addEventListener('resize',()=>{if(comparison){comparison.resize();return;}camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
