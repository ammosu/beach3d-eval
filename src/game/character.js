import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const CHARACTER_SOURCES={A:'A｜codex 程序化',B:'B｜Tripo AI',C:'C｜Quaternius CC0'};
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);

// One weighted skin, including the outfit and facial detail, bound to a 17-bone rig.
function procedural(){
 const bones=[],joints={},pieces=[];
 function bone(name,parent,x,y,z){const b=new T.Bone();b.name=name;b.position.set(x,y,z);(parent?joints[parent]:null)?.add(b);joints[name]=b;bones.push(b);return b;}
 bone('hips',null,0,.91,0);bone('spine','hips',0,.17,0);bone('chest','spine',0,.23,0);bone('neck','chest',0,.13,0);bone('head','neck',0,.10,0);
 for(const [side,s] of [['L',-1],['R',1]]){bone(`arm${side}`,'chest',s*.235,-.01,0);bone(`fore${side}`,`arm${side}`,s*.07,-.265,0);bone(`hand${side}`,`fore${side}`,0,-.245,0);bone(`thigh${side}`,'hips',s*.115,-.015,0);bone(`calf${side}`,`thigh${side}`,0,-.405,0);bone(`foot${side}`,`calf${side}`,0,-.405,.015);}
 joints.hips.updateMatrixWorld(true);
 const palette={skin:0xc68d65,shirt:0x398d94,trim:0xd7e6d8,shorts:0xd9b98a,hair:0x33261f,sole:0x343b37,white:0xf9f5e8,eye:0x29251e};
 function add(geo,color,weights){if(geo.index)geo=geo.toNonIndexed();const pos=geo.attributes.position,si=[],sw=[],colors=[],c=new T.Color(palette[color]??color);for(let i=0;i<pos.count;i++){const w=weights(V().fromBufferAttribute(pos,i));si.push(w[0],w[1]??w[0],0,0);sw.push(w[2]??1,1-(w[2]??1),0,0);colors.push(c.r,c.g,c.b);}geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));pieces.push(geo);}
 const idx=n=>bones.indexOf(joints[n]),rigid=n=>()=>[idx(n)];
 function ellipsoid(center,radii,color,joint,segments=20){const g=new T.SphereGeometry(1,segments,12);g.scale(...radii);g.translate(...center);add(g,color,rigid(joint));}
 // Profile rings provide a continuous, tapered torso, avoiding a capsule silhouette.
 function profile(rings,color,weight,segments=24){const p=[],uv=[],index=[];for(let r=0;r<rings.length;r++){const [x,y,z,rx,rz]=rings[r];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;p.push(x+Math.cos(a)*rx,y,z+Math.sin(a)*rz);uv.push(i/segments,r/(rings.length-1));if(r&&i){const k=r*(segments+1)+i;index.push(k,k-segments-2,k-1,k,k-segments-1,k-segments-2);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();add(g,color,weight);}
 profile([[0,.89,0,.16,.103],[0,.94,0,.18,.115],[0,1.10,0,.165,.109],[0,1.27,0,.225,.12],[0,1.34,0,.215,.10],[0,1.40,0,.082,.071]],'shirt',p=>{const f=T.MathUtils.clamp((p.y-1.08)/.23,0,1);return [idx('chest'),idx('spine'),f];});
 profile([[0,.88,0,.165,.104],[0,.92,0,.18,.118],[0,.95,0,.18,.118]],'trim',rigid('hips'));
 ellipsoid([0,1.435,0],[.068,.11,.065],'skin','neck');ellipsoid([0,1.59,.005],[.132,.163,.121],'skin','head',28);
 // Hair cap has an asymmetric swept fringe; eyes and ears are also skinned.
 const hair=new T.SphereGeometry(1,28,12,0,Math.PI*2,0,Math.PI*.53);hair.scale(.137,.169,.125);hair.translate(0,1.594,-.008);add(hair,'hair',rigid('head'));
 ellipsoid([-.043,1.70,.064],[.10,.045,.064],'hair','head');
 for(const s of [-1,1]){ellipsoid([s*.129,1.575,.003],[.027,.045,.026],'skin','head');ellipsoid([s*.048,1.60,.112],[.024,.014,.01],'white','head',12);ellipsoid([s*.048,1.60,.121],[.010,.011,.004],'eye','head',12);ellipsoid([s*.048,1.624,.113],[.029,.006,.007],'hair','head',12);}
 ellipsoid([0,1.572,.124],[.022,.030,.027],'skin','head');ellipsoid([0,1.529,.112],[.034,.005,.005],0x885b49,'head',12);
 for(const [side,s] of [['L',-1],['R',1]]){
  const x=s*.115;
  profile([[x,.57,0,.098,.097],[x,.63,0,.105,.105],[x,.82,0,.115,.12],[x,.91,0,.104,.10]],'shorts',rigid(`thigh${side}`));
  profile([[x,.085,.015,.045,.048],[x,.16,0,.051,.055],[x,.31,0,.073,.067],[x,.48,0,.071,.07],[x,.58,0,.084,.083],[x,.64,0,.087,.09]],'skin',p=>[idx(`thigh${side}`),idx(`calf${side}`),T.MathUtils.smoothstep(p.y,.42,.56)]);
  ellipsoid([x,.064,.065],[.065,.05,.135],'skin',`foot${side}`);ellipsoid([x,.026,.069],[.075,.025,.145],'sole',`foot${side}`);ellipsoid([x,.10,.09],[.071,.017,.044],'shirt',`foot${side}`);
  profile([[s*.31,.785,0,.044,.046],[s*.31,.90,0,.055,.051],[s*.305,1.035,0,.060,.058],[s*.27,1.21,0,.073,.072],[s*.235,1.31,0,.075,.075]],'skin',p=>[idx(`arm${side}`),idx(`fore${side}`),T.MathUtils.smoothstep(p.y,1.00,1.10)]);
  profile([[s*.28,1.17,0,.074,.077],[s*.265,1.25,0,.083,.083],[s*.235,1.32,0,.075,.074],[s*.225,1.355,0,0,0]],'shirt',p=>[idx(`arm${side}`),idx('chest'),1-T.MathUtils.smoothstep(p.y,1.28,1.355)]);
  ellipsoid([s*.31,.738,.008],[.047,.068,.029],'skin',`hand${side}`);ellipsoid([s*.275,.75,.02],[.020,.043,.022],'skin',`hand${side}`);
 }
 const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.82});
 const mesh=new T.SkinnedMesh(geometry,material);mesh.add(joints.hips);mesh.bind(new T.Skeleton(bones));mesh.name='Codex beach humanoid';const model=new T.Group();model.add(mesh);return {model,clips:[]};
}

function disposeModel(model){model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const t of Object.values(m))if(t?.isTexture)t.dispose();m.dispose();}}});}

export async function createCharacter(group='A'){
 let model,clips=[],source=group,fallback=false;
 try{
  if(group==='A')({model,clips}=procedural());
  else {const loader=new GLTFLoader(),base=await loader.loadAsync(group==='B'?'/assets/character/idle.glb':'/assets/character_C/character.glb');model=base.scene;clips=base.animations;
   if(group==='B'){const loaded=await Promise.allSettled(['walk','run','jump','climb'].map(async name=>{const gltf=await loader.loadAsync(`/assets/character/${name}.glb`);const clip=gltf.animations[0]?.clone();if(clip)clip.name=name;disposeModel(gltf.scene);return clip;}));clips=[...clips,...loaded.flatMap(r=>r.status==='fulfilled'&&r.value?[r.value]:[])];if(clips.length<5)throw Error('Incomplete Tripo animation set');}
   // The CC0 download includes a separate display prop. Compare only the rigged person.
   if(group==='C'){const extra=[];model.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)extra.push(o);});extra.forEach(o=>o.removeFromParent());}
  }
 }catch(error){if(model)disposeModel(model);({model,clips}=procedural());source='A';fallback=true;console.warn(`Character ${group}: using procedural fallback (${error.message})`);}
 if(source==='B')model.rotation.y-=Math.PI/2;
 const root=new T.Group(),pivot=new T.Group();root.name=`character-${group}`;root.add(pivot);pivot.add(model);
 const mixer=new T.AnimationMixer(model),actions=new Map();
 for(const clip of clips){actions.set(clip.name.split('|').at(-1).toLowerCase(),mixer.clipAction(clip));}
 if(actions.has('kick_right'))actions.set('kick',actions.get('kick_right'));
 const idle=actions.get('idle');idle?.play();mixer.update(0);root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(model,true),height=bounds.max.y-bounds.min.y;model.scale.multiplyScalar(1.75/height);root.updateMatrixWorld(true);bounds.setFromObject(model,true);model.position.y-=bounds.min.y;model.position.x-=(bounds.max.x+bounds.min.x)/2;model.position.z-=(bounds.max.z+bounds.min.z)/2;root.updateMatrixWorld(true);
 const allBones=[],meshes=[],materials=[];let triangles=0;
 model.traverse(o=>{if(o.isBone)allBones.push(o);if(o.isMesh){meshes.push(o);o.castShadow=o.receiveShadow=true;o.frustumCulled=false;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.push({mat:m,opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite});}});
 const names=source==='A'?{hip:'hips',spine:'spine',head:'head',thigh:['thighL','thighR'],calf:['calfL','calfR'],foot:['footL','footR'],arm:['armL','armR'],fore:['foreL','foreR'],hand:['handL','handR']}:source==='B'?{hip:'Hip',spine:'Waist',head:'Head',thigh:['L_Thigh','R_Thigh'],calf:['L_Calf','R_Calf'],foot:['L_Foot','R_Foot'],arm:['L_Upperarm','R_Upperarm'],fore:['L_Forearm','R_Forearm'],hand:['L_Hand','R_Hand']}:{hip:'Body',spine:'Hips',head:'Head',thigh:['UpperLeg.L','UpperLeg.R'],calf:['LowerLeg.L','LowerLeg.R'],foot:['Foot.L','Foot.R'],arm:['UpperArm.L','UpperArm.R'],fore:['LowerArm.L','LowerArm.R'],hand:['Wrist.L','Wrist.R']};
 const get=n=>allBones.find(b=>b.name===n||b.name===n.replaceAll('.','')),rig={};for(const [k,n] of Object.entries(names))rig[k]=Array.isArray(n)?n.map(get):get(n);
 const rest=new Map(allBones.map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone(),s:b.scale.clone()}]));
 // Each clip's own ground speed (in place): sample the feet over one cycle; stride ≈ peak foot separation,
 // two steps per cycle. Playback is later scaled to the avatar's real speed so the feet don't slide.
 const nativeSpeed={};
 for(const name of ['walk','run']){const action=actions.get(name),feet=rig.foot;if(!action||!feet?.[0]||!feet?.[1])continue;
  const duration=action.getClip().duration,a=V(),b=V();let sep=0;idle?.stop();action.reset().play();
  for(let k=0;k<=24;k++){action.time=duration*k/24;mixer.update(0);root.updateMatrixWorld(true);feet[0].getWorldPosition(a);feet[1].getWorldPosition(b);sep=Math.max(sep,Math.hypot(a.x-b.x,a.z-b.z));}
  action.stop();nativeSpeed[name]=2*sep/duration;}
 idle?.reset().play();mixer.update(0);for(const [bone,r] of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p);bone.scale.copy(r.s);}root.updateMatrixWorld(true);
 // Directions expressed in each bone's local frame make procedural poses portable
 // across the three rigs' different bone rolls and coordinate systems.
 const axes=new Map(),q=new T.Quaternion(),parentQ=new T.Quaternion(),turn=new T.Quaternion(),dir=V(),from=V(),to=V();
 function axis(b,end){if(!b)return;const a=end?end.getWorldPosition(V()).sub(b.getWorldPosition(V())):V(0,1,0);axes.set(b,a.normalize().applyQuaternion(b.getWorldQuaternion(new T.Quaternion()).invert()));}
 for(let i=0;i<2;i++){axis(rig.thigh[i],rig.calf[i]);axis(rig.calf[i],source==='C'?rig.calf[i]?.children[0]:rig.foot[i]);axis(rig.arm[i],rig.fore[i]);axis(rig.fore[i],rig.hand[i]);}axis(rig.spine,rig.head);
 const hipY=rig.hip?.getWorldPosition(V()).y??.91;
 let posed=false,active='idle',age=0,actionAge=0,oneShot='',oneAge=0,opacity=1;
 const previousPose=new Map(allBones.map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone()}]));
 const poseRotation=new T.Quaternion(),posePosition=V(),bodyRotation=new T.Quaternion(),bodyPosition=V(),headWorld=V();
 function aim(b,x,y,z,weight=1){if(!b||!axes.has(b))return;b.updateWorldMatrix(true,false);b.getWorldQuaternion(q);from.copy(axes.get(b)).applyQuaternion(q);dir.set(x,y,z).normalize().applyQuaternion(root.getWorldQuaternion(parentQ));turn.setFromUnitVectors(from,dir);q.premultiply(turn);b.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);b.quaternion.slerp(q,weight);b.updateWorldMatrix(false,true);}
 function play(name){if(name===active)return;const previous=actions.get(active),next=actions.get(name);if(next){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(previous)next.crossFadeFrom(previous,.25,false);else next.fadeIn(.25);}else previous?.fadeOut(.25);active=name;actionAge=0;}
 function trigger(name){oneShot=name;oneAge=0;}
 function restore(){for(const [b,r] of rest){b.quaternion.copy(r.q);b.position.copy(r.p);b.scale.copy(r.s);}}
 function update(dt,{speed=0,airborne=false,pose='stand',first=false,fade=1,animation=null}={}){
  // A dt=0 call (a render between offline steps) keeps the current pose. Re-running restore() there would leave
  // the rest pose on screen: three.js PropertyMixer skips writing values that did not change since its last apply.
  if(!dt&&posed&&!animation)return;posed=true;
  age+=dt;actionAge+=dt;oneAge+=dt;if(oneAge>.85)oneShot='';
  const selected=animation??(pose==='climb'?'climb':pose==='paddle'?'paddle':pose==='lie'?'lie':pose==='sit'||pose==='sand'?'sit':airborne?'jump':oneShot||(speed>3.4?'run':speed>.12?'walk':'idle'));
  play(selected);
  if(nativeSpeed[selected]&&!animation)actions.get(selected).setEffectiveTimeScale(T.MathUtils.clamp(speed/nativeSpeed[selected],.5,3.5));
  restore();mixer.update(dt);
  const proceduralPose=!actions.has(selected),seated=selected==='sit'||selected==='paddle',lying=selected==='lie';
  // Reset the outer transform before posing. All anatomical directions are avatar-local.
  pivot.position.set(0,0,0);pivot.quaternion.identity();root.updateMatrixWorld(true);
  if(proceduralPose){
   const gait=selected==='run'?1:selected==='walk'?.62:0,cycle=age*(selected==='run'?12:8),swing=Math.sin(cycle)*gait;
   for(let i=0;i<2;i++){const sign=i?1:-1,s=i?swing:-swing;let thigh=[0,-Math.cos(s),Math.sin(s)],calf=[0,-1,Math.max(0,-s)*.7],arm=[sign*.15,-1,-s*.7],fore=[0,-1,.12];
    if(seated){thigh=[0,-.12,1];calf=pose==='sand'?[0,-.05,1]:[0,-1,.08];arm=[sign*.3,-1,.45];fore=[0,-.15,1];if(selected==='paddle'){arm=[sign*.4,-.4,.8+Math.sin(age*6+i)*.5];fore=[sign*.25,-.2,.9];}}
    if(lying){thigh=[0,-1,0];calf=[0,-1,.05];arm=[sign*.14,-1,0];fore=[0,-1,.08];}
    if(selected==='jump'){thigh=[0,-1,.45];calf=[0,-.8,-.5];arm=[sign*.3,.2,.9];fore=[0,.8,.3];}
    if(selected==='climb'){const c=Math.sin(age*5+i*Math.PI);thigh=[0,-.7,.5+c*.3];calf=[0,-1,-.2];arm=[sign*.3,.6+c*.3,.5];fore=[0,.5,.7];}
    if(selected==='kick'&&i===1){const k=Math.sin(Math.min((animation?age%1:oneAge)/.75,1)*Math.PI);thigh=[0,-Math.cos(k*1.4),Math.sin(k*1.4)];calf=[0,-Math.cos(k*1.7),Math.sin(k*1.7)];}
    if(selected==='interact'){arm=[sign*.2,-.6,.9];fore=[0,-.3,1];}
    aim(rig.thigh[i],...thigh);aim(rig.calf[i],...calf);aim(rig.arm[i],...arm);aim(rig.fore[i],...fore);
    // Quaternius feet use sibling IK bones, so keep them at the posed ankle.
    if(source==='C'&&rig.foot[i]){const end=rig.calf[i].children[0];end.getWorldPosition(to);rig.foot[i].parent.worldToLocal(to);rig.foot[i].position.copy(to);}
   }
   aim(rig.spine,0,1,lying?.45:selected==='interact'?.35:seated?.08:Math.sin(age*1.7)*.018);
  }
  // Smooth bones only right after a clip/pose switch; smoothing every frame flattens the gait cycle itself.
  const blend=1-Math.exp(-12*dt),boneBlend=actionAge<.3?blend:1;
  for(const [b,previous] of previousPose){q.copy(b.quaternion);b.quaternion.copy(previous.q).slerp(q,dt?boneBlend:1);b.position.lerpVectors(previous.p,b.position,dt?boneBlend:1);previous.q.copy(b.quaternion);previous.p.copy(b.position);}
  posePosition.set(0,0,0);poseRotation.identity();
  if(lying){posePosition.set(0,.115,hipY);poseRotation.setFromAxisAngle(V(1,0,0),-Math.PI/2);}
  else if(seated)posePosition.set(0,-hipY+.10,0);
  bodyRotation.slerp(poseRotation,dt?blend:1);bodyPosition.lerp(posePosition,dt?blend:1);
  pivot.quaternion.copy(bodyRotation);pivot.position.copy(bodyPosition);
  // Hide the head through its bone (also covers a unified Tripo skin).
  if(rig.head&&first)rig.head.scale.multiplyScalar(.001);
  opacity=T.MathUtils.damp(opacity,fade,12,dt);for(const m of materials){m.mat.opacity=m.opacity*opacity;m.mat.transparent=m.transparent||opacity<.995;m.mat.depthWrite=m.depthWrite&&opacity>.5;}
  root.updateMatrixWorld(true);
 }
 function info(){return {group,source:CHARACTER_SOURCES[source],fallback,triangles,clips:clips.map(c=>c.name),animation:active,actionTime:actionAge,skinnedMeshes:meshes.filter(m=>m.isSkinnedMesh).length,bones:allBones.length,height:1.75,headHidden:rig.head?.scale.x<.01,poseSample:rig.thigh.map(b=>b?.quaternion.toArray()),clipTime:actions.get(active)?.time??null,footSep:rig.foot?.[0]&&rig.foot?.[1]?rig.foot[0].getWorldPosition(V()).distanceTo(rig.foot[1].getWorldPosition(V())):null,calfSep:rig.calf?.[0]&&rig.calf?.[1]?rig.calf[0].getWorldPosition(V()).distanceTo(rig.calf[1].getWorldPosition(V())):null,nativeSpeed,timeScale:actions.get(active)?.getEffectiveTimeScale()??null};}
 function head(out=headWorld){return rig.head?rig.head.getWorldPosition(out):out.copy(root.position).add(V(0,1.6,0));}
 update(0);
 return {root,update,trigger,info,head,mixer,rig,meshes,dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);disposeModel(model);root.removeFromParent();},animations:[...new Set(['idle','walk','run','jump','climb','sit','lie','paddle','kick','interact',...actions.keys()])]};
}
