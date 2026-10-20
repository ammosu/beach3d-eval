import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MAGNIFICATION} from './species.js';
const sphere=new T.SphereGeometry(1,16,10);
const material=(color,roughness=.55)=>new T.MeshStandardMaterial({color,roughness});
function ellipsoid(parent,mat,x,y,z,sx,sy,sz){const m=new T.Mesh(sphere,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
function tube(parent,mat,points,r=.02){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,12,r,6,false),mat);parent.add(m);return m;}
function combine(root){root.updateMatrixWorld(true);const batches=new Map();root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry.clone().applyMatrix4(m.matrixWorld);if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(g);});root.clear();for(const [mat,geos] of batches){root.add(new T.Mesh(mergeGeometries(geos),mat));geos.forEach(g=>g.dispose());}}
export function procedural(id){
 const root=new T.Group(),parts=[],orange=material('#c66536'),cream=material('#f7d6a1'),black=material('#172526'),pink=material('#dc978f');
 if(id==='starfish'){
  const skin=material('#d7733f',.78);ellipsoid(root,skin,0,.065,0,.19,.07,.19);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const arm=new T.Group();root.add(arm);arm.rotation.y=a; const ray=tube(arm,skin,[[.07,.055,0],[.23,.06,0],[.39,.038,.035],[.49,.015,.07]],.065);const positions=ray.geometry.attributes.position;for(let k=0;k<positions.count;k++){const u=Math.floor(k/7)/12,center=ray.geometry.parameters.path.getPointAt(u),v=new T.Vector3().fromBufferAttribute(positions,k).sub(center).multiplyScalar(1-u*.93).add(center);positions.setXYZ(k,v.x,v.y,v.z);}ray.geometry.computeVertexNormals();for(let j=0;j<8;j++){const x=.11+j*.043;ellipsoid(arm,cream,x,.12-j*.009,.01,.012,.008,.012);}}
 }
 if(id==='hermit_crab'){
  const shell=material('#9f7251',.65);ellipsoid(root,shell,-.13,.23,0,.3,.25,.27);
  const spiral=[];for(let j=0;j<65;j++){const a=j*.23,r=.225*(1-j/80);spiral.push([-.13+Math.cos(a)*r,.24+Math.sin(a)*r,.23+j*.001]);}tube(root,cream,spiral,.018);
  ellipsoid(root,orange,.17,.11,0,.18,.09,.18);
  for(const side of [-1,1]){for(let i=0;i<3;i++)tube(root,orange,[[.05-i*.08,.13,side*.13],[.18-i*.11,.12,side*.3],[.24-i*.13,.015,side*.39]],.018);ellipsoid(root,orange,.34,.08,side*.23,.12,.06,.08);tube(root,orange,[[.22,.13,side*.09],[.29,.26,side*.11]],.015);ellipsoid(root,black,.29,.27,side*.11,.025,.025,.025);}
 }
 if(id==='anemone'){
  const foot=material('#988343'),tip=material('#c7dc9a',.4);ellipsoid(root,foot,0,.1,0,.26,.11,.26);ellipsoid(root,pink,0,.2,0,.22,.035,.22);
  for(let i=0;i<12;i++){const cluster=new T.Group();root.add(cluster);const a=i*Math.PI/6;cluster.rotation.y=a;for(let j=0;j<3;j++){const r=.15+j*.06;tube(cluster,tip,[[r,.17,0],[r+.06,.29,.02],[r+.04,.42+j*.025,.05],[r+.11,.46+j*.02,.03]],.018);ellipsoid(cluster,pink,r+.11,.46+j*.02,.03,.026,.029,.026);}parts.push(cluster);}
  ellipsoid(root,orange,0,.242,0,.05,.012,.04);
 }
 if(id==='urchin'){
  const skin=material('#49374b'),spine=material('#292d35');ellipsoid(root,skin,0,.2,0,.26,.21,.26);
  const spikes=new T.Group();root.add(spikes);for(let i=0;i<120;i++){const a=i*2.39996,h=.08+.91*(i/120),r=Math.sqrt(1-h*h),v=new T.Vector3(Math.cos(a)*r,h,Math.sin(a)*r);const m=new T.Mesh(new T.ConeGeometry(.012,.24+(i%4)*.026,5),spine);m.position.copy(v).multiplyScalar(.34);m.position.y+=.13;m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v);spikes.add(m);}combine(spikes);parts.push(spikes);
 }
 if(id==='octopus'){
  const skin=material('#b97855',.45);root.userData.skin=skin;ellipsoid(root,skin,-.08,.14,0,.21,.16,.17);ellipsoid(root,skin,.14,.09,0,.12,.085,.14);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,arm=new T.Group();root.add(arm);arm.rotation.y=a;const p=[[.09,.055,0],[.22,.035,.015],[.34,.022,.09],[.44,.018,.13],[.47,.02,.08]];tube(arm,skin,p,.026);for(let j=0;j<5;j++)ellipsoid(arm,cream,.19+j*.042,.048,.015+j*.018,.011,.006,.011);parts.push(arm);}
  for(const z of [-.13,.13]){ellipsoid(root,cream,.12,.17,z,.045,.04,.03);ellipsoid(root,black,.143,.18,z,.018,.022,.021);}
 }
 if(id==='nudibranch'){
  const body=material('#f0e7cc'),trim=material('#ca8836'),gill=material('#9f626e');ellipsoid(root,trim,0,.075,0,.49,.065,.19);ellipsoid(root,body,0,.12,0,.46,.085,.16);
  for(let i=0;i<12;i++)ellipsoid(root,gill,-.35+i*.06,.2,Math.sin(i*2)*.07,.023,.008,.023);
  for(const z of [-.09,.09]){tube(root,trim,[[.29,.15,z],[.34,.31,z],[.32,.34,z]],.022);}
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;tube(root,gill,[[-.26,.15,0],[-.26+Math.cos(a)*.07,.29,Math.sin(a)*.07],[-.3+Math.cos(a)*.11,.33,Math.sin(a)*.1]],.016);}
 }
 // Keep articulated parts separate; batch static animals to reduce draw calls.
 if(!parts.length)combine(root);
 const bounds=new T.Box3().setFromObject(root),s=bounds.getSize(new T.Vector3()),c=bounds.getCenter(new T.Vector3()),fit=1/Math.max(s.x,s.z);
 const wrapper=new T.Group();root.position.set(-c.x*fit,-bounds.min.y*fit,-c.z*fit);root.scale.setScalar(fit);wrapper.add(root);
 wrapper.userData.animate=t=>{parts.forEach((p,i)=>{if(id==='anemone')p.rotation.z=Math.sin(t*1.3+i)*.09;else if(id==='octopus')p.rotation.z=Math.sin(t*2+i)*.045;else p.rotation.y=Math.sin(t*.7)*.025;});if(root.userData.skin)root.userData.skin.color.setHSL(.04+.03*Math.sin(t*.7),.62,.36);};
 return wrapper;
}
export async function loadCreature(spec,group){
 let model,source=group,fallback=false;
 if(group!=='A')try{model=(await new GLTFLoader().loadAsync(`/assets/tidepool/${group}/${spec.id}.glb`)).scene;const b=new T.Box3().setFromObject(model);if(b.isEmpty())throw Error('Empty model');}catch{fallback=true;source='A';}
 model??=procedural(spec.id);const root=new T.Group();root.add(model);root.scale.setScalar(spec.display??spec.size*MAGNIFICATION);root.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
 return {root,model,source,fallback,animate(t){model.userData.animate?.(t);model.rotation.y=Math.sin(t*.7)*.04;model.scale.y=1+Math.sin(t*1.8)*.025;}};
}
