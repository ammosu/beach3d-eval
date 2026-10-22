import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {asset} from '../url.js';
import {groundHeight} from '../terrain.js';
import {createCastle} from './castle.js';
import {createKite} from './kite.js';
import {createCrabs} from './crabs.js';
import {createBirds} from './birds.js';
import {enablePalmWind} from '../vegetation.js';
import './extras.css';

// B/C models: assets/extras/<group>/<id>.glb, normalised like the sea animals (length 1 along +x = head/nose, bbox centred).
// A missing file falls back to the procedural model (A), per id.
const glbs=new Map();
function loadExtra(group,id){const key=`${group}/${id}`;if(!glbs.has(key))glbs.set(key,(async()=>{try{const url=asset(`assets/extras/${key}.glb`),r=await fetch(url,{method:'HEAD'});if(!r.ok||r.headers.get('content-type')?.includes('text/html'))return null;return (await new GLTFLoader().loadAsync(url)).scene;}catch{return null;}})());return glbs.get(key);}
// Free experiences are separate from the seven quest flags. Input events store only time and approach endpoints.
export function createExtras({scene,camera,clock,explore:e,objects,toast}){
 const castle=createCastle(scene,clock,objects),kite=createKite(scene,clock),crabs=createCrabs(scene),birds=createBirds(scene,clock);
 enablePalmWind(scene.getObjectByName('island-vegetation'),clock);
 let groupToken=0,action=null,castleDone=false,kiteDone=false;const hands=[new T.Vector3(),new T.Vector3()],aim=[0,1].map(()=>({dir:new T.Vector3(),palm:new T.Vector3()}));
 function begin(kind,spot){e.setFirstPerson(false);e.clearInput();e.setHold(true);const from=e.player.clone(),duration=from.distanceTo(spot)/1.4;action={kind,at:clock.value,from,spot,duration};return clock.value+duration;}
 function interact(){if(action?.kind==='kite'){if(!kite.info.returning){kite.recall(clock.value);toast('慢慢收線，讓風箏回到腳邊。');}return;}
  if(action)return;const p=e.player;
  if(p.distanceTo(castle.point)<2.5){if(castle.stage()==='washing')return;if(castle.stage()==='built'){castle.wash(clock.value);toast('讓浪花帶走，等一下還能再堆。');}else{castle.start(begin('castle',castle.stand)+.35);toast('蹲下來，慢慢把濕沙拍實。');}return;}
  if(p.distanceTo(kite.point)<2.5){const at=begin('kite',kite.point);kite.start(at);e.setView(0,-.3);toast('風箏交給海風。滑鼠環顧，按 E 收回。');}}
 function near(){if(action)return action.kind==='kite'?{kind:'extra',label:kite.info.returning?'正在慢慢收線':'收回風箏',position:kite.grip}:null;
  if(e.player.distanceTo(castle.point)<2.5)return castle.stage()==='washing'?null:{kind:'extra',label:castle.stage()==='built'?'讓浪帶走':'堆一座沙堡',position:castle.point};
  if(e.player.distanceTo(kite.point)<2.5)return {kind:'extra',label:'放風箏，交給海風',position:kite.point};return null;}
 function release(){if(action?.kind==='kite'){const input=e.input({});e.setView(input.yaw,.08);}action=null;e.setHold(false);e.clearInput();}
 function update(t,active){castle.update(t);kite.update(t);crabs.update(t,e.player,active);birds.update(t);
  if(!action)return;const a=action,u=T.MathUtils.clamp((t-a.at)/Math.max(.001,a.duration),0,1);e.player.lerpVectors(a.from,a.spot,u);e.player.y=groundHeight(e.player.x,e.player.z);e.avatar.position.copy(e.player);e.setFirstPerson(false);e.avatar.rotation.set(0,Math.PI,0);
  if(a.kind==='castle'&&t>=castle.info.startedAt+6){castleDone=true;if(t>=castle.info.startedAt+6.55)release();}
  if(a.kind==='kite'){if(kite.complete)kiteDone=true;if(!kite.flying)release();}
 }
 function ik(character,t){if(!action||t<action.at+action.duration)return null;const a=action;
  if(a.kind==='castle'){const age=t-castle.info.startedAt,down=T.MathUtils.smoothstep(age,-.35,0)*(1-T.MathUtils.smoothstep(age,6.15,6.55));
   for(let i=0;i<2;i++){const side=character.side[i];hands[i].copy(castle.surface(t,-side));const lift=age>=6?0:.09*Math.max(0,Math.sin(age*Math.PI*3+i*Math.PI));hands[i].y+=.02+lift;hands[i].z+=(character.gripReach||.05)*.8;aim[i].dir.set(0,0,-1);aim[i].palm.set(0,-1,0);}
   return {hands,handWeight:[down,down],handAim:aim,curl:[.1,.1],pelvis:-(.42+.14*(1-castle.height(t)))*down,ground:groundHeight,spine:{lean:1.05*down},look:castle.point,lookWeight:down};}
  const grip=kite.grip;
  for(let i=0;i<2;i++){hands[i].copy(grip);hands[i].x-=character.side[i]*.065;hands[i].z+=(character.gripReach||.06)*.8;hands[i].y+=.02;aim[i].dir.set(0,.3,-1).normalize();aim[i].palm.set(0,-1,-.3).normalize();}
  return {hands,handWeight:[1,1],handAim:aim,curl:[1,1],ground:groundHeight,spine:{lean:-.035},look:kite.root.position,lookWeight:.75};
 }
 // Orbit remains driven by the player's mouse. Lifting its look target frames both the hands and the airborne kite.
 function cameraFocus(){return action?.kind==='kite'?Math.min(2.8,kite.info.height*.1):0;}
 return {update,interact,near,ik,cameraFocus,setGroup:async g=>{const token=++groupToken,ids=['castle','kite','crab','bird'],models=g==='A'?ids.map(()=>null):await Promise.all(ids.map(id=>loadExtra(g,id)));if(token!==groupToken)return;castle.setGroup(models[0]);kite.setGroup(models[1]);crabs.setGroup(models[2]);birds.setGroup(models[3]);},get busy(){return !!action;},get speed(){return action&&clock.value<action.at+action.duration?1.4:0;},get bonus(){return `額外的小樂趣：${castleDone?'✓ ':''}堆一座沙堡、${kiteDone?'✓ ':''}放一只風箏`;},get info(){return {castle:castle.info,kite:kite.info,crabs:crabs.info,birds:birds.count};},targets(){return {castle:castle.point.toArray(),kite:kite.point.toArray()};},reset(){release();castle.reset();kite.reset();crabs.reset();castleDone=kiteDone=false;}};
}
