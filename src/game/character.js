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
 // The Tripo climb clip carries root motion (the hips rise about a metre per loop). The game moves the body itself,
 // so take out the hips' linear drift and keep only the in-place bob.
 for(const clip of clips)if(clip.name==='climb')for(const track of clip.tracks){if(!rig.hip||track.name!==`${rig.hip.name}.position`)continue;const v=track.values,t=track.times,n=t.length,d=t[n-1]-t[0]||1;
  for(let k=0;k<n;k++)for(let c=0;c<3;c++)v[k*3+c]-=(v[(n-1)*3+c]-v[c])*(t[k]-t[0])/d;}
 // Rigs without finger bones (the Tripo skin) get one knuckle bone per hand: the front of the palm is re-skinned to
 // it in bind space, so the hand can close around a grip like a mitten. The rest of the skin is untouched.
 const grip=[null,null];
 // Re-skin a fraction f(p) of a hand's own weight onto a new child bone of the hand.
 function addBone(mesh,hand,name,position,list,share){const sk=mesh.skeleton,hi=sk.bones.indexOf(hand),si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;
  const bone=new T.Bone();bone.name=name;bone.position.copy(position);hand.add(bone);allBones.push(bone);
  const fi=sk.bones.length,inverse=new T.Matrix4().makeTranslation(-position.x,-position.y,-position.z).multiply(sk.boneInverses[hi]);
  for(const [k,p] of list){const f=share(p)*T.MathUtils.smoothstep(p.w,.85,.98);if(!f)continue;let wh=0,free=0,low=Infinity;
   for(let c=0;c<4;c++){const w=sw.getComponent(k,c),j=si.getComponent(k,c);if(j===hi)wh+=w;else if(w<low){low=w;free=c;}}
   for(let c=0;c<4;c++)if(si.getComponent(k,c)===hi)sw.setComponent(k,c,sw.getComponent(k,c)*(1-f));
   si.setComponent(k,free,fi);sw.setComponent(k,free,wh*f);}
  si.needsUpdate=sw.needsUpdate=true;mesh.bind(new T.Skeleton([...sk.bones,bone],[...sk.boneInverses,inverse]),mesh.bindMatrix);return bone;}
 const skinned=meshes.find(m=>m.isSkinnedMesh&&rig.hand.every(h=>m.skeleton.bones.includes(h)));
 if(skinned&&rig.hand.every(h=>h&&!h.children.some(c=>c.isBone))){
  const hands=[0,1].map(i=>{const hand=rig.hand[i],sk=skinned.skeleton,hi=sk.bones.indexOf(hand),pos=skinned.geometry.attributes.position,si=skinned.geometry.attributes.skinIndex,sw=skinned.geometry.attributes.skinWeight,toHand=new T.Matrix4().multiplyMatrices(sk.boneInverses[hi],skinned.bindMatrix),list=[];
   for(let k=0;k<pos.count;k++){let w=0;for(let c=0;c<4;c++)if(si.getComponent(k,c)===hi)w+=sw.getComponent(k,c);if(w>.5){const p=V().fromBufferAttribute(pos,k).applyMatrix4(toHand);p.w=w;list.push([k,p]);}}
   if(list.length<20)return null;
   const dir=list.reduce((sum,[,p])=>sum.add(p),V()).normalize(),length=Math.max(...list.map(([,p])=>p.dot(dir)));
   // The bind (T) pose holds the palms down.
   const normal=V(0,-1,0).transformDirection(sk.boneInverses[hi]);normal.addScaledVector(dir,-normal.dot(dir)).normalize();const across=V().crossVectors(dir,normal);
   const band=list.filter(([,p])=>p.dot(dir)>length*.3&&p.dot(dir)<length*.8).map(([,p])=>p.dot(across));
   return {hand,list,dir,normal,across,length,asym:-Math.min(...band)-Math.max(...band)};}).filter(Boolean);
  if(hands.length===2){
   // The thumb sticks out further than the little finger; the hands mirror each other, so read the clearer one.
   const clear=Math.abs(hands[0].asym)>Math.abs(hands[1].asym)?0:1,sigma=[0,0];sigma[clear]=hands[clear].asym>0?-1:1;sigma[1-clear]=-sigma[clear];
   hands.forEach((h,i)=>{const {hand,list,dir,normal,across,length}=h,knuckle=length*.5,thumbSide=sigma[i];
    const reach=Math.max(...list.map(([,p])=>p.dot(across)*thumbSide));
    const isThumb=p=>p.dot(dir)>length*.15&&p.dot(dir)<length*.85?T.MathUtils.smoothstep(p.dot(across)*thumbSide,reach*.45,reach*.7):0;
    const thumbBase=V().copy(dir).multiplyScalar(length*.2).addScaledVector(across,thumbSide*reach*.35);
    const thumb=addBone(skinned,hand,`${hand.name}_thumb`,thumbBase,list,isThumb);
    const finger=addBone(skinned,hand,`${hand.name}_grip`,V().copy(dir).multiplyScalar(knuckle),list,p=>isThumb(p)>.5?0:T.MathUtils.smoothstep(p.dot(dir),knuckle*.8,knuckle*1.15));
    // Curling turns the fingertips toward the palm; the thumb folds under the palm about the hand's long axis.
    grip[i]={bone:finger,thumb,dir,normal,axis:V().crossVectors(dir,normal).normalize(),thumbAxis:V().copy(dir).multiplyScalar(-thumbSide)};});
  }
 }
 const rest=new Map(allBones.map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone(),s:b.scale.clone()}]));
 // Each clip's own ground speed (in place): sample the feet over one cycle; stride ≈ peak foot separation,
 // two steps per cycle. Playback is later scaled to the avatar's real speed so the feet don't slide.
 // The same sweep finds each foot's plant: the phase where it is lowest and furthest forward (heel strike).
 const nativeSpeed={},contact={};
 for(const name of ['walk','run']){const action=actions.get(name),feet=rig.foot;if(!action||!feet?.[0]||!feet?.[1])continue;
  const duration=action.getClip().duration,a=V(),b=V(),samples=[[],[]];let sep=0;idle?.stop();action.reset().play();
  for(let k=0;k<48;k++){action.time=duration*k/48;mixer.update(0);root.updateMatrixWorld(true);feet[0].getWorldPosition(a);feet[1].getWorldPosition(b);sep=Math.max(sep,Math.hypot(a.x-b.x,a.z-b.z));samples[0].push([a.y,a.z]);samples[1].push([b.y,b.z]);}
  action.stop();nativeSpeed[name]=2*sep/duration;
  contact[name]=samples.map(list=>{const low=Math.min(...list.map(v=>v[0])),high=Math.max(...list.map(v=>v[0]));let best=0,score=-Infinity;list.forEach(([y,z],k)=>{const s=z-(y-low)/(high-low||1)*sep*2;if(y-low<(high-low)*.35&&s>score){score=s;best=k;}});return best/48;});}
 idle?.reset().play();mixer.update(0);for(const [bone,r] of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p);bone.scale.copy(r.s);}root.updateMatrixWorld(true);
 // Directions expressed in each bone's local frame make procedural poses portable
 // across the three rigs' different bone rolls and coordinate systems.
 const axes=new Map(),q=new T.Quaternion(),parentQ=new T.Quaternion(),turn=new T.Quaternion(),dir=V(),from=V(),to=V();
 function axis(b,end){if(!b)return;const a=end?end.getWorldPosition(V()).sub(b.getWorldPosition(V())):V(0,1,0);axes.set(b,a.normalize().applyQuaternion(b.getWorldQuaternion(new T.Quaternion()).invert()));}
 for(let i=0;i<2;i++){axis(rig.thigh[i],rig.calf[i]);axis(rig.calf[i],source==='C'?rig.calf[i]?.children[0]:rig.foot[i]);axis(rig.arm[i],rig.fore[i]);axis(rig.fore[i],rig.hand[i]);}axis(rig.spine,rig.head);
 const hipY=rig.hip?.getWorldPosition(V()).y??.91,legLength=rig.thigh?.[0]&&rig.foot?.[0]?rig.thigh[0].getWorldPosition(V()).distanceTo(rig.foot[0].getWorldPosition(V())):hipY*.9;
 let posed=false,active='idle',age=0,actionAge=0,oneShot='',oneAge=0,opacity=1,lastPhase=null,stride=0;const steps=[];
 const previousPose=new Map(allBones.map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone()}]));
 const poseRotation=new T.Quaternion(),posePosition=V(),bodyRotation=new T.Quaternion(),bodyPosition=V(),headWorld=V();
 function aim(b,x,y,z,weight=1){if(!b||!axes.has(b))return;b.updateWorldMatrix(true,false);b.getWorldQuaternion(q);from.copy(axes.get(b)).applyQuaternion(q);dir.set(x,y,z).normalize().applyQuaternion(root.getWorldQuaternion(parentQ));turn.setFromUnitVectors(from,dir);q.premultiply(turn);b.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);b.quaternion.slerp(q,weight);b.updateWorldMatrix(false,true);}
 function play(name){if(name===active)return;const previous=actions.get(active),next=actions.get(name);if(next){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(previous)next.crossFadeFrom(previous,.25,false);else next.fadeIn(.25);}else previous?.fadeOut(.25);active=name;actionAge=0;}
 function trigger(name){oneShot=name;oneAge=0;}
 function restore(){for(const [b,r] of rest){b.quaternion.copy(r.q);b.position.copy(r.p);b.scale.copy(r.s);}}
 // IK layer, shared by all three rigs and applied after the clip/procedural pose. Targets are world points; each
 // limb has its own weight so callers can ease contacts in and out.
 const endOf=(i,leg)=>leg?(source==='C'?rig.calf[i]?.children[0]:rig.foot[i]):rig.hand[i];
 // Rig sides differ (A's index 0 sits at -x, the GLB rigs may not): side[i] is the avatar-local x sign of limb i.
 const side=[0,1].map(i=>Math.sign(root.worldToLocal(rig.arm[i]?.getWorldPosition(V())??V(i?1:-1)).x)||(i?1:-1));
 // Ankle height above the sole in the rest pose, for feet planted on a floor.
 const ankle=[0,1].map(i=>{const e=endOf(i,true);return e?root.worldToLocal(e.getWorldPosition(V())).y:.08;});
 const headForward=rig.head?V(0,0,1).applyQuaternion(rig.head.getWorldQuaternion(new T.Quaternion()).invert().multiply(root.getWorldQuaternion(new T.Quaternion()))):null;
 const mw=new T.Matrix4(),ml=new T.Matrix4(),cross=V(),A1=V(),B1=V(),C1=V(),goal=V(),knee=V(),bendDir=V(),worldUp=V(0,1,0),local=V(),rootQ=new T.Quaternion();
 const armLength=rig.arm[0]&&rig.fore[0]&&rig.hand[0]?rig.arm[0].getWorldPosition(V()).distanceTo(rig.fore[0].getWorldPosition(B1))+B1.distanceTo(rig.hand[0].getWorldPosition(C1)):.55;
 // Rotate bone b about its origin so the direction toward `tip` points at `point`.
 function swing(b,tip,point,weight=1){b.getWorldPosition(A1);from.copy(tip.getWorldPosition(B1)).sub(A1);dir.copy(point).sub(A1);if(from.lengthSq()<1e-10||dir.lengthSq()<1e-10)return;turn.setFromUnitVectors(from.normalize(),dir.normalize());b.getWorldQuaternion(q);q.premultiply(turn);b.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);b.quaternion.slerp(q,weight);b.updateWorldMatrix(false,true);}
 // Rotate bone b about a world axis.
 function twist(b,axis,angle){if(!b||!angle)return;turn.setFromAxisAngle(axis,angle);b.getWorldQuaternion(q);q.premultiply(turn);b.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);b.quaternion.copy(q);b.updateWorldMatrix(false,true);}
 // Analytic two-bone IK; the middle joint bends toward the world point `pole`.
 function reach(upper,lower,end,target,pole,weight=1){
  if(!upper||!lower||!end||!target||weight<=0)return null;upper.updateWorldMatrix(true,true);
  const a=upper.getWorldPosition(V()),l1=a.distanceTo(lower.getWorldPosition(B1)),l2=B1.distanceTo(end.getWorldPosition(C1));
  goal.copy(target).sub(a);const d=T.MathUtils.clamp(goal.length(),Math.abs(l1-l2)+1e-3,(l1+l2)*.999);goal.normalize();
  bendDir.copy(pole).sub(a);bendDir.addScaledVector(goal,-bendDir.dot(goal));if(bendDir.lengthSq()<1e-8)bendDir.copy(B1).sub(a).addScaledVector(goal,-B1.clone().sub(a).dot(goal));bendDir.normalize();
  const cos=T.MathUtils.clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1);knee.copy(a).addScaledVector(goal,l1*cos).addScaledVector(bendDir,l1*Math.sqrt(1-cos*cos));
  swing(upper,lower,knee,weight);swing(lower,end,goal.multiplyScalar(d).add(a),weight);return end.getWorldPosition(V()).distanceTo(target);
 }
 const toWorld=(x,y,z)=>local.set(x,y,z).applyMatrix4(root.matrixWorld);
 const toWorldDir=(x,y,z)=>V(x,y,z).applyQuaternion(root.getWorldQuaternion(rootQ));
 const error={hands:[null,null],feet:[null,null]};
 function solve({hands,feet,handWeight=1,footWeight=1,pelvis=0,ground,floor,spine,look,lookWeight=1,handAim,curl}){
  root.updateWorldMatrix(true,true);
  // Terrain-following feet: each foot keeps the clip's lift above its own patch of ground; the pelvis drops to the
  // lower foot so the legs only ever shorten.
  let feetTargets=feet;
  if(!feet&&ground){const rootY=root.getWorldPosition(A1).y,out=[];let drop=0;
   for(let i=0;i<2;i++){const e=endOf(i,true);if(!e){out.push(null);continue;}const p=e.getWorldPosition(V()),g=ground(p.x,p.z)-rootY;out.push(p.setY(p.y+g));drop=Math.min(drop,g);}
   pelvis+=drop;feetTargets=out;}
  // Seated feet rest on a floor (boat hull) instead; the body stays on its seat.
  if(!feet&&floor)feetTargets=[0,1].map(i=>{const e=endOf(i,true);if(!e)return null;const p=e.getWorldPosition(V()),y=floor(p.x,p.z);return y==null?null:p.setY(y+ankle[i]);});
  // Crouch: lower the body, then let foot IK bend the knees back down to the planted feet.
  if(pelvis){if(!feetTargets)feetTargets=[0,1].map(i=>endOf(i,true)?.getWorldPosition(V())??null);pivot.position.y+=pelvis;root.updateMatrixWorld(true);}
  if(spine&&rig.spine){const fwd=toWorldDir(0,0,1),right=toWorldDir(1,0,0);
   if(spine.lean)twist(rig.spine,right,spine.lean);if(spine.roll)twist(rig.spine,fwd,spine.roll);if(spine.twist)twist(rig.spine,toWorldDir(0,1,0),spine.twist);}
  const fwd=toWorldDir(0,0,1),up=toWorldDir(0,1,0);
  for(let i=0;i<2;i++){
   const s=side[i],target=hands?.[i];
   if(target){const elbow=rig.fore[i]?.getWorldPosition(V())??toWorld(s*.3,1.1,0);const pole=elbow.add(toWorldDir(s*.6,-.5,-.35));const w=Array.isArray(handWeight)?handWeight[i]:handWeight;error.hands[i]=reach(rig.arm[i],rig.fore[i],endOf(i,false),target,pole,w);}else error.hands[i]=null;
   const foot=feetTargets?.[i];
   if(foot){const kneeAt=rig.calf[i]?.getWorldPosition(V())??toWorld(s*.1,.5,0);const pole=kneeAt.addScaledVector(fwd,1).addScaledVector(up,.1);const w=Array.isArray(footWeight)?footWeight[i]:footWeight;error.feet[i]=reach(rig.thigh[i],rig.calf[i],endOf(i,true),foot,pole,w);
    if(source==='C'&&rig.foot[i]){endOf(i,true).getWorldPosition(to);rig.foot[i].parent.worldToLocal(to);rig.foot[i].position.copy(to);}}else error.feet[i]=null;
  }
  // Wrists: point the fingers along `dir` with the palm facing `palm` (world), then close the knuckle bones.
  for(let i=0;i<2;i++){const aimAt=handAim?.[i],g=grip[i],hand=rig.hand[i];
   if(aimAt&&g&&hand){const w=Array.isArray(handWeight)?handWeight[i]:handWeight;mw.makeBasis(aimAt.dir,aimAt.palm,cross.crossVectors(aimAt.dir,aimAt.palm));ml.makeBasis(g.dir,g.normal,cross.crossVectors(g.dir,g.normal)).transpose();const want=new T.Quaternion().setFromRotationMatrix(mw.multiply(ml));
    // Pronation belongs to the forearm (a wrist that rolls far tears the skin), so roll the forearm about its own axis
    // by the twist part of the change, then bend the wrist the rest of the way, within a natural range.
    const fore=rig.fore[i],axisW=hand.getWorldPosition(A1).sub(fore.getWorldPosition(B1)).normalize();
    const delta=want.clone().multiply(hand.getWorldQuaternion(q).invert()),proj=axisW.dot(V(delta.x,delta.y,delta.z));
    const roll=new T.Quaternion(axisW.x*proj,axisW.y*proj,axisW.z*proj,delta.w).normalize();turn.identity().slerp(roll,w);
    fore.getWorldQuaternion(q).premultiply(turn);fore.parent.getWorldQuaternion(parentQ).invert();fore.quaternion.copy(q.premultiply(parentQ));fore.updateWorldMatrix(false,true);
    const bend=want.clone().multiply(hand.getWorldQuaternion(q).invert()),angle=2*Math.acos(Math.min(1,Math.abs(bend.w)));turn.identity().slerp(bend,w*Math.min(1,1.1/Math.max(angle,1e-6)));
    hand.getWorldQuaternion(q).premultiply(turn);hand.parent.getWorldQuaternion(parentQ).invert();hand.quaternion.copy(q.premultiply(parentQ));hand.updateWorldMatrix(false,true);}
   if(g){g.bone.quaternion.setFromAxisAngle(g.axis,(curl?.[i]??0)*1.7);g.thumb.quaternion.setFromAxisAngle(g.thumbAxis,(curl?.[i]??0)*(window.__THUMB__??1.1));}}
  // Head turns toward a point of interest, within a comfortable neck range.
  if(look&&rig.head&&headForward){const h=rig.head.getWorldPosition(A1);rig.head.getWorldQuaternion(q);from.copy(headForward).applyQuaternion(q);dir.copy(look).sub(h).normalize();const angle=from.angleTo(dir);if(angle>1e-4){const limit=Math.min(angle,1.05)/angle;turn.setFromUnitVectors(from,dir);const partial=new T.Quaternion().slerp(turn,limit*lookWeight);q.premultiply(partial);rig.head.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);rig.head.quaternion.copy(q);rig.head.updateWorldMatrix(false,true);}}
 }
 function update(dt,{speed=0,airborne=false,pose='stand',first=false,fade=1,animation=null,ik=null}={}){
  // A dt=0 call (a render between offline steps) keeps the current pose. Re-running restore() there would leave
  // the rest pose on screen: three.js PropertyMixer skips writing values that did not change since its last apply.
  if(!dt&&posed&&!animation)return;posed=true;
  age+=dt;actionAge+=dt;oneAge+=dt;if(oneAge>.85)oneShot='';
  // While moving, locomotion wins: a pickup only layers its arm reach on top, a kick is skipped.
  const gait=speed>3.4?'run':speed>.12?'walk':'idle',layered=gait!=='idle'&&oneShot==='interact'&&!animation;
  const selected=animation??(pose==='climb'?'climb':pose==='paddle'?'paddle':pose==='lie'?'lie':pose==='sit'||pose==='sand'?'sit':airborne?'jump':gait!=='idle'?gait:oneShot||gait);
  play(selected);
  if(nativeSpeed[selected]&&!animation)actions.get(selected).setEffectiveTimeScale(T.MathUtils.clamp(speed/nativeSpeed[selected],.5,5));
  restore();mixer.update(dt);
  // Foot plants: report each foot whose contact phase the clip passed this frame.
  steps.length=0;const clipAction=actions.get(selected);
  if(contact[selected]&&clipAction&&dt){const phase=(clipAction.time/clipAction.getClip().duration)%1;if(lastPhase!==null&&lastPhase[0]===selected){const from=lastPhase[1];contact[selected].forEach((c,i)=>{if(phase>=from?c>from&&c<=phase:c>from||c<=phase)steps.push(i);});}lastPhase=[selected,phase];}else lastPhase=null;
  if(layered){const w=Math.sin(Math.PI*Math.min(oneAge/.85,1));for(let i=0;i<2;i++){const sign=i?1:-1;aim(rig.arm[i],sign*.2,-.6,.9,w);aim(rig.fore[i],0,-.3,1,w);}}
  const proceduralPose=!actions.has(selected),seated=selected==='sit'||selected==='paddle',lying=selected==='lie';
  // Reset the outer transform before posing. All anatomical directions are avatar-local.
  pivot.position.set(0,0,0);pivot.quaternion.identity();root.updateMatrixWorld(true);
  if(proceduralPose){
   // Procedural gait (no clip): fixed cadence; the stance leg stays straight and its amplitude is matched to speed so
   // the foot sweeps back at ground speed as it passes under the hip (leg·amplitude·ω = speed). That moment is the plant.
   const rate=selected==='run'?10:selected==='walk'?7:0,gait=rate?T.MathUtils.clamp(speed/(legLength*rate),.15,1.1):0;
   if(rate&&dt){const before=stride;stride+=rate*dt;if(Math.floor(stride/Math.PI)!==Math.floor(before/Math.PI))steps.push(Math.floor(stride/Math.PI)%2?1:0);}
   const cycle=rate?stride:age*8,swing=Math.sin(cycle)*gait;
   for(let i=0;i<2;i++){const sign=i?1:-1,s=i?swing:-swing,stance=rate&&(i?Math.cos(cycle):-Math.cos(cycle))<0;let thigh=[0,-Math.cos(s),Math.sin(s)],calf=stance?thigh:[0,-1,Math.max(0,-s)*.7],arm=[sign*.15,-1,-s*.7],fore=[0,-1,.12];
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
  if(ik)solve(ik);else{error.hands.fill(null);error.feet.fill(null);}
  // Hide the head through its bone (also covers a unified Tripo skin).
  if(rig.head&&first)rig.head.scale.multiplyScalar(.001);
  opacity=T.MathUtils.damp(opacity,fade,12,dt);for(const m of materials){m.mat.opacity=m.opacity*opacity;m.mat.transparent=m.transparent||opacity<.995;m.mat.depthWrite=m.depthWrite&&opacity>.5;}
  root.updateMatrixWorld(true);
 }
 function info(){return {group,source:CHARACTER_SOURCES[source],fallback,triangles,clips:clips.map(c=>c.name),animation:active,actionTime:actionAge,skinnedMeshes:meshes.filter(m=>m.isSkinnedMesh).length,bones:allBones.length,height:1.75,headHidden:rig.head?.scale.x<.01,poseSample:rig.thigh.map(b=>b?.quaternion.toArray()),clipTime:actions.get(active)?.time??null,footSep:rig.foot?.[0]&&rig.foot?.[1]?rig.foot[0].getWorldPosition(V()).distanceTo(rig.foot[1].getWorldPosition(V())):null,calfSep:rig.calf?.[0]&&rig.calf?.[1]?rig.calf[0].getWorldPosition(V()).distanceTo(rig.calf[1].getWorldPosition(V())):null,nativeSpeed,ik:{hands:[...error.hands],feet:[...error.feet]},side,timeScale:actions.get(active)?.getEffectiveTimeScale()??null};}
 function footWorld(i,out=V()){return rig.foot?.[i]?rig.foot[i].getWorldPosition(out):null;}
 function palm(i,out=V()){const h=rig.hand[i];if(!h)return head(out);h.getWorldPosition(out);return grip[i]?out.lerp(grip[i].bone.getWorldPosition(A1),.8):out;}
 function head(out=headWorld){return rig.head?rig.head.getWorldPosition(out):out.copy(root.position).add(V(0,1.6,0));}
 update(0);
 return {root,update,trigger,info,head,palm,footWorld,steps,side,armLength,get gripReach(){return grip[0]?grip[0].bone.getWorldPosition(V()).distanceTo(rig.hand[0].getWorldPosition(V())):0;},hasGrip:!!grip[0],grip,get plants(){return !!contact[active]||!actions.has(active)&&(active==='walk'||active==='run');},mixer,rig,meshes,dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);disposeModel(model);root.removeFromParent();},animations:[...new Set(['idle','walk','run','jump','climb','sit','lie','paddle','kick','interact',...actions.keys()])]};
}
