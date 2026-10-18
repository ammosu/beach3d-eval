// Isolated inspection scene: shared beach scene and all comparison cameras stay untouched.
import * as T from 'three';
import {loadProps,propRoot} from './props.js';
const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#999999');scene.add(new T.HemisphereLight(0xffffff,0x777777,2));
const key=new T.DirectionalLight(0xfff7eb,3);key.position.set(-3,6,5);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3});key.shadow.bias=-.001;
const {results}=await loadProps('A');const id=new URLSearchParams(location.search).get('solo')||'boat';const marker=propRoot.getObjectByName(id);if(!marker)throw Error(`Unknown slot ${id}`);
const model=marker.children[0];model.removeFromParent();model.position.set(0,0,0);model.updateMatrixWorld(true);
let bounds=new T.Box3().setFromObject(model);const size=bounds.getSize(new T.Vector3());model.scale.multiplyScalar(3/Math.max(size.x,size.y,size.z));model.updateMatrixWorld(true);bounds.setFromObject(model);const center=bounds.getCenter(new T.Vector3());model.position.set(-center.x,-bounds.min.y,-center.z);scene.add(model);
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x999999,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
const camera=new T.PerspectiveCamera(38,innerWidth/innerHeight,.01,200);camera.position.set(4.6,3.3,5.8);camera.lookAt(0,1.25,0);
renderer.render(scene,camera);window.__READY__=true;window.__PROP__={id,results};
