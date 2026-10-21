import * as T from 'three';
import {groundHeight,shore} from '../terrain.js';
import {sampleWater} from '../water.js';
import {propRoot} from '../props.js';
import {createObjects,fallbackBoat} from './objects.js';
import {createBall} from './physics.js';
import {createCharacter} from './character.js';
import {findSurface,surfacesAt} from './surfaces.js';
import {createGameCamera,MIN_BOOM} from './camera.js';
import {MeshBVH,acceleratedRaycast} from 'three-mesh-bvh';
import {createTidePool,createLagoon} from './lagoon.js';
import {createSea,SEA} from './sea.js';
import '../game.css';

export async function createGame({scene,camera,renderer,water,config,explore:e,auto}) {
 document.body.classList.add('game-mode');document.querySelector('#loading')?.remove();
 const $=s=>document.querySelector(s),time=()=>water.material.uniforms.time.value;
 const welcome=$('.welcome');welcome.innerHTML=`<span class="postmark" aria-hidden="true">☀</span><p class="invitation">給自己一小段海邊時光</p><h1>海灘小任務</h1><p>收集潮間帶的小驚喜，踢球、歇腳、登高，<br>翻石尋找潮池的小住客。<br>再划向外海看鯨豚，帶著海風回來。</p><div class="trip-details"><span>7 個小任務</span><span>約 8–12 分鐘</span></div><button id="begin">開始玩</button><p class="start-controls">WASD 移動 · 滑鼠環顧 · E 互動<br>觸控：左側搖桿移動，右側拖曳環顧</p><a href="/">回海邊場景實驗室</a>`;
 // Reuse the original start handler, including gesture-gated ambience/pointer lock.
 // The old node was replaced, so transfer its behavior through an explicit adapter.
 const ui=document.createElement('div');ui.id='game';ui.innerHTML=`<section class="quest-book" aria-label="任務清單"><header><h2>海灘小任務</h2><span id="game-clock">0:00</span></header><p class="quest-intro">慢慢走，海風會等你。</p><ul><li data-quest="shells"><i></i><span>撿貝殼 <b id="shell-count">0 / 8</b></span></li><li data-quest="ball"><i></i><span>把沙灘球踢進海裡</span></li><li data-quest="lounger"><i></i><span>在躺椅上休息</span></li><li data-quest="tower"><i></i><span>登上救生塔看海</span></li><li data-quest="tidepool"><i></i><span>潮池觀察 <b id="tidepool-hud">0 / 6</b></span></li><li data-quest="opensea"><i></i><span>在外海觀察大型海洋生物 <b id="lagoon-hud">0 / 7</b></span></li><li data-quest="boat"><i></i><span>划到小島，再回岸邊</span></li></ul><p id="footnote">額外的小紀念：在沙上留下腳印</p></section><div id="navigation"><span id="nav-arrow">↑</span><span id="nav-text"></span></div><div id="game-toast" role="status" aria-live="polite"></div><div id="target-prompt"><kbd>E</kbd><span></span></div><button id="interact" disabled>互動 <kbd>E</kbd></button><div class="game-controls">WASD 移動　滑鼠／←→ 轉視角　E 互動　Shift 跑步<br>1 / 2 / 3 素材　M 靜音　Esc 暫停</div><button id="game-audio" aria-label="切換聲音">聲音 開</button><div id="game-fade"></div><section id="complete" hidden role="dialog" aria-modal="true" aria-labelledby="complete-title"><div><span class="postmark" aria-hidden="true">☀</span><p>海風、浪花，和你的小小足跡</p><h1 id="complete-title">今天的海灘，收集完成。</h1><p>8 枚貝殼 · 6 種潮池生物 · 7 種海洋生物</p><strong id="finish-time"></strong><p id="finish-bonus"></p><button id="replay">再玩一次</button><a href="/">回到首頁</a></div></section>`;document.body.append(ui);
 const objects=createObjects(scene,water.material.uniforms.time,config);
 const state={shells:0,ball:false,lounger:false,tower:false,tidepool:false,observed:0,opensea:false,spotted:0,boat:false,island:false,footprints:0};
 const pool=createTidePool(scene);
 const lagoon=createLagoon({onObserve(id,count){state.observed=count;state.tidepool=count===6;renderHud();},onClose(){e.clearInput();leave();if(running&&!completed&&!auto)e.start();}});
 let running=false,completed=false,elapsed=0,mode='walk',modeAge=0,toastUntil=-1,fadeAt=-100,lastHud='',near=null,currentGroup=e.group,paddleClock=0,boatSpeed=0,boatYaw=0,footDistance=0;
 const lastPlayer=e.player.clone(),returnPoint=e.player.clone(),target=new T.Vector3(),camGoal=new T.Vector3(),camLook=new T.Vector3(),screen=new T.Vector3(),input={},wave={};
 const anchors={};for(const id of ['umbrella','lifeguard','boat']){const slot=config.slots.find(s=>s.id===id);anchors[id]={id,x:slot.pos[0],z:slot.pos[2],y:groundHeight(slot.pos[0],slot.pos[2]),box:null,point:new T.Vector3()};}
 const anchorList=Object.values(anchors),interaction={kind:'',label:'',position:null,item:null};
 const dock={x:4,z:shore(4)-9},island={x:60,z:-286};
 // Open sea: the animals live around the buoy (north of it, clear of the island mesh); E observes one that is out of the water in view.
 const sea=createSea(scene,{center:new T.Vector3(island.x,0,island.z+6),boat:()=>vessel.visible?vessel.position:null});sea.setGroup(e.group);
 const seaPose={pos:new T.Vector3(),heading:new T.Vector3()},seaView=new T.Vector3(),seaTarget=new T.Vector3();
 // Nearest unobserved animal within 30 m of the boat with part of it above the water on screen.
 function sighting(){let best=null,d=30;for(const c of sea.creatures){if(c.seen)continue;const p=sea.pose(c.i,time());if(!p.showing)continue;const n=p.pos.distanceTo(vessel.position);if(n>=d)continue;seaView.copy(p.pos).project(camera);if(seaView.z>1||Math.abs(seaView.x)>.92||Math.abs(seaView.y)>.92)continue;d=n;best=c;seaTarget.copy(p.pos).setY(Math.max(p.pos.y,0)+.25*c.spec.length);}return best;}
 const vessel=new T.Group();vessel.name='game-rowboat';scene.add(vessel);vessel.visible=false;
 // Double-bladed paddle along its local x. One stroke phase drives it, both hands, the torso and the boat's thrust.
 const oar=new T.Group(),oarMat=new T.MeshStandardMaterial({color:0xc7a075});const shaft=new T.Mesh(new T.CylinderGeometry(.03,.03,2.6,6),oarMat);shaft.rotation.z=Math.PI/2;oar.add(shaft);for(const x of [-1.22,1.22]){const blade=new T.Mesh(new T.BoxGeometry(.42,.19,.025),oarMat);blade.position.x=x;oar.add(blade);}oar.rotation.order='YZX';vessel.add(oar);
 const row={phase:0,amount:0,dip:.6,hands:[new T.Vector3(),new T.Vector3()],feet:[new T.Vector3(),new T.Vector3()],aim:[0,1].map(()=>({dir:new T.Vector3(),palm:new T.Vector3()})),axis:new T.Vector3(),p:new T.Vector3(),dir:new T.Vector3(),palm:new T.Vector3(),twist:0,lean:0,floorY:0};
 let boatModel=null,hiddenBoat=null,fallbackModel=null;
 const followCamera=createGameCamera(camera,propRoot);e.setCameraController(followCamera);
 for(const child of e.avatar.children)child.visible=false;
 const characterCache=new Map();let character=await createCharacter(e.group);characterCache.set(e.group,character);e.avatar.add(character.root);
 let boatSeat=null;const boat={draft:0,mask:null};const climbStart=new T.Vector3();
 async function switchCharacter(group){sea.setGroup(group);character.root.removeFromParent();if(!characterCache.has(group))characterCache.set(group,await createCharacter(group));character=characterCache.get(group);e.avatar.add(character.root);syncAnchors();followCamera.refresh();if(mode==='rest'){e.player.copy(anchors.umbrella.surface.point);e.avatar.rotation.set(0,anchors.umbrella.surface.yaw,0);}if(mode==='tower')e.player.copy(anchors.lifeguard.surface.point);updateCharacter(0);}
 e.onGroupChange(switchCharacter);
 // World-space contacts for the character's IK layer in the current mode.
 function poseIK(){
  if(mode==='walk'&&pickup&&pickup.age>=0)return pickupIK();
  if(mode==='walk')return e.airborne?null:{ground:groundHeight};
  if(mode==='tower'&&anchors.lifeguard.ladder?.kind==='stairs')return {ground:towerSurface};
  if(mode==='tower'&&anchors.lifeguard.ladder&&towerT>0&&towerT<towerTotal())return {hands:climb.hands,handWeight:climb.handWeight,feet:climb.feet,footWeight:climb.footWeight,handAim:climb.aim,curl:climb.curl,pelvis:-.3*climb.duck,spine:{lean:climb.lean+.4*climb.duck}};
  if(mode==='boat'&&boatSeat)return {hands:row.hands,feet:row.feet,handAim:row.aim,curl:[1,1],spine:{twist:row.twist,lean:row.lean}};
  return null;
 }
 function updateCharacter(dt){const pose=mode==='rest'?(anchors.umbrella.surface.kind==='lounger'?'lie':'sand'):mode==='boat'?'paddle':mode==='tower'&&(anchors.lifeguard.ladder?climb.onLadder&&towerT>0:modeAge<1.1)?'climb':'stand';character.update(dt,{speed:mode==='walk'?(pickup?pickupSpeed:e.speed):mode==='tower'?climb.speed:0,airborne:e.airborne,pose,recline:mode==='rest'?anchors.umbrella.surface.lie?.recline??0:0,first:e.first,fade:followCamera.distance<2.2?.4:1,ik:poseIK()});const info=character.info();let node=$('#character-stats');if(!node){node=document.createElement('span');node.id='character-stats';$('#stats').after(node);}node.textContent=`角色 ${info.source}${info.fallback?'（備援）':''} · ${info.triangles.toLocaleString()} triangles`;}
 const ringMat=new T.MeshBasicMaterial({color:0xffe18a,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false});const destination=new T.Mesh(new T.TorusGeometry(8,.2,8,64),ringMat);destination.rotation.x=-Math.PI/2;destination.position.set(island.x,.6,island.z);scene.add(destination);
 const buoy=new T.Mesh(new T.CylinderGeometry(.2,.4,4,8),new T.MeshStandardMaterial({color:0xffb64f}));buoy.position.set(island.x,2,island.z);scene.add(buoy);
 // Lifeguard tower ladder: the widest opening in the deck railing, at the deck edge (the beach side wins ties). A
 // tower without its own ladder or stairs there gets a plain one drawn by the game; the prop itself is never edited.
 const ladderMesh=new T.Group(),ladderMat=new T.MeshStandardMaterial({color:0xd9d0bd,roughness:.85}),ray=new T.Raycaster();ladderMesh.name='game-ladder';scene.add(ladderMesh);
 // Ladder probes cast thousands of rays: run them on a BVH copy of the tower (as the camera does).
 const probeMaterial=new T.MeshBasicMaterial({side:T.DoubleSide});
 function probeCopy(source){source.updateMatrixWorld(true);const root=new T.Group();source.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone();geometry.clearGroups();geometry.boundsTree=new MeshBVH(geometry);const mesh=new T.Mesh(geometry,probeMaterial);mesh.raycast=acceleratedRaycast;mesh.matrixAutoUpdate=false;mesh.matrix.copy(o.matrixWorld);root.add(mesh);});root.updateMatrixWorld(true);return root;}
 function findLadder(source,surface){
  const root=probeCopy(source);try{return ladderOn(root,surface);}finally{root.traverse(o=>{if(o.isMesh){o.geometry.boundsTree=null;o.geometry.dispose();}});}
 }
 function ladderOn(root,surface){
  const box=new T.Box3().setFromObject(root),deckY=surface.point.y,deck=(x,z)=>surfacesAt(root,x,z,box).some(h=>Math.abs(h.point.y-deckY)<.12);
  // Railing just inside a deck edge: its top height and how far in it stands (null: no railing).
  // Railing just inside a deck edge, found with vertical probes (thin horizontal bars slip between horizontal ones):
  // its top height and how far in it stands (null: no railing).
  const railAt=(normal,edge,u)=>{const nx=normal.x,nz=normal.z;let top=null,depth=0;for(let d=0;d<.36;d+=.03){const w=edge-d;ray.set(new T.Vector3(nx?w*nx:u,deckY+1.4,nz?w*nz:u),new T.Vector3(0,-1,0));ray.far=1.25;const hit=ray.intersectObject(root,true)[0];if(hit&&(top==null||hit.point.y>top)){top=hit.point.y;depth=d;}}return top==null?null:{top,depth};};
  const stairs=findStairs(root,box,deckY);if(stairs)return stairs;
  const existing=ownLadder(root,box,deckY,railAt);if(existing)return existing;
  let best=null;
  for(const [nx,nz] of [[0,1],[0,-1],[1,0],[-1,0]]){
   const normal=new T.Vector3(nx,0,nz),right=new T.Vector3(nz,0,-nx),outer=nx>0?box.max.x:nx<0?-box.min.x:nz>0?box.max.z:-box.min.z;
   const lo=nx?box.min.z:box.min.x,hi=nx?box.max.z:box.max.x,cells=[];
   for(let u=lo+.05;u<hi;u+=.1){
    let edge=null;for(let w=outer;w>outer-2.5;w-=.05){const x=nx?w*nx:u,z=nz?w*nz:u;if(deck(x,z)){edge=w;break;}}
    // Room to stand just inside the edge (and any railing): deck underfoot, nothing at body height (a hut wall).
    let room=false,rail=null;if(edge!=null){rail=railAt(normal,edge,u);const w=edge-Math.max(.3,(rail?.depth??0)+.28),x=nx?w*nx:u,z=nz?w*nz:u;ray.set(new T.Vector3(x,deckY+.1,z),new T.Vector3(0,1,0));ray.far=1.1;room=surfacesAt(root,x,z,box).some(h=>Math.abs(h.point.y-deckY)<.12)&&!ray.intersectObject(root,true).length;}
    cells.push({u,edge,room,rail});
   }
   // Runs of neighbouring cells with room, a steady edge and the same railing state. Prefer an opening in the
   // railing; otherwise a stretch where the climber steps over it. The beach side wins ties.
   for(let i=0;i<cells.length;){const c=cells[i];if(!c.room){i++;continue;}let j=i+1;while(j<cells.length&&cells[j].room&&!cells[j].rail===!c.rail&&Math.abs(cells[j].edge-cells[j-1].edge)<.12)j++;
    const run=cells.slice(i,j),width=run.length*.1,open=!c.rail,score=width+(open?10:0)+(nz>0?.3:0);
    if(width>=.45&&(!best||score>best.score)){const mid=run[Math.floor(run.length/2)];best={score,normal,right,rail:open?null:mid.rail,top:new T.Vector3(nx?mid.edge*nx:mid.u,deckY,nz?mid.edge*nz:mid.u)};}
    i=j;}
  }
  if(!best){const n=new T.Vector3(0,0,1);best={normal:n,right:new T.Vector3(1,0,0),rail:null,top:new T.Vector3(surface.point.x,deckY,box.max.z-.1)};}
  // The ladder leans on the deck edge, or on the outside of the top rail where a railing runs (never through it).
  const {normal,right,top,rail}=best,railTop=rail?rail.top:deckY,contact=top.clone().addScaledVector(normal,rail?.07:.02);contact.y=railTop;
  const bottom=contact.clone().addScaledVector(normal,(railTop-box.min.y)*.2);bottom.y=groundHeight(bottom.x,bottom.z);
  const stand=top.clone().addScaledVector(normal,-Math.max(.32,(rail?.depth??0)+.3));const hit=surfacesAt(root,stand.x,stand.z,box).find(h=>Math.abs(h.point.y-deckY)<.12);stand.y=(hit?.point.y??deckY)+.015;
  // Does the tower already have a ladder or stairs here? Rungs or treads catch a good share of these probes.
  let hits=0,tries=0;for(let h=bottom.y+.6;h<deckY-.2;h+=.1)for(const side of [-.15,.15]){const o=top.clone().addScaledVector(normal,1.2).addScaledVector(right,side);o.y=h;ray.set(o,normal.clone().negate());ray.far=.9;tries++;if(ray.intersectObject(root,true).length)hits++;}
  const own=tries>0&&hits/tries>.3;
  // A railing in the way: the ladder leans on it and the rungs go on up to its top rail.
  const axis=contact.clone().sub(bottom).normalize(),rungs=[];for(let h=.28;h<railTop-bottom.y-.08;h+=.28)rungs.push(h);
  return {normal,right,top:contact,edge:top.clone(),bottom,axis,stand,rungs,spacing:.28,height:deckY-bottom.y,over:railTop-bottom.y,railDepth:rail?.depth??0,roof:roofOver(root,stand),own};
 }
 // A ladder the tower already has: looking at a side, a column between its rails shows thin, evenly spaced hits (the
 // rungs) that line up, straight or leaning. Its rung heights and lean are measured so hands and feet meet real rungs.
 // Stairs: tread tops outside the deck footprint whose height rises steadily along one direction (rise/run between
 // 0.5 and 1.25). The climber walks their centre line; foot IK puts the feet on the treads.
 function findStairs(root,box,deckY){
  const ground=box.min.y,samples=[],pad=1.6;
  for(let x=box.min.x-pad;x<=box.max.x+pad;x+=.1)for(let z=box.min.z-pad;z<=box.max.z+pad;z+=.1){
   // Every upward face in the column: treads hide under a sloping handrail.
   const column=surfacesAt(root,x,z,box);if(column.some(h=>Math.abs(h.point.y-deckY)<.12))continue;
   for(const h of column)if(h.point.y>ground+.08&&h.point.y<deckY-.04)samples.push(new T.Vector3(x,h.point.y,z));
  }
  if(samples.length<20)return null;
  let best=null;
  for(let k=0;k<72;k++){const a=k*Math.PI/36,dx=Math.sin(a),dz=Math.cos(a);
   for(let slope=.5;slope<=1.25;slope+=.05){
    // Offset by the most common residual (robust to a planter box or a brace top), then count the treads near it.
    const bins=new Map();for(const p of samples){const r=Math.round((p.y-slope*(p.x*dx+p.z*dz))/.05);bins.set(r,(bins.get(r)??0)+1);}
    let mode=0,top=-1;for(const [r,n] of bins){const c=n+(bins.get(r-1)??0)+(bins.get(r+1)??0);if(c>top){top=c;mode=r;}}
    const c=mode*.05,inliers=samples.filter(p=>Math.abs(p.y-slope*(p.x*dx+p.z*dz)-c)<.1);
    if(inliers.length<15)continue;
    const heights=inliers.map(p=>p.y),span=Math.max(...heights)-Math.min(...heights),q=inliers.map(p=>p.x*dz-p.z*dx),mean=q.reduce((p,v)=>p+v,0)/q.length,spread=Math.sqrt(q.reduce((p,v)=>p+(v-mean)**2,0)/q.length);
    if(span<(deckY-ground)*.6||spread>.6)continue;
    if(!best||inliers.length>best.count)best={count:inliers.length,dir:new T.Vector3(dx,0,dz),slope,c,lateral:mean};
   }
  }
  if(!best)return null;
  const {dir,slope,c,lateral}=best,side=new T.Vector3(dir.z,0,-dir.x),point=t=>new T.Vector3(dir.x*t+side.x*lateral,0,dir.z*t+side.z*lateral);
  const tBottom=(ground-c)/slope,tTop=(deckY-c)/slope,bottom=point(tBottom-.35),top=point(tTop);bottom.y=groundHeight(bottom.x,bottom.z);top.y=deckY;
  // Walk on past the top tread until there is deck underfoot, then a step further in.
  let stand=null;for(let t=tTop;t<tTop+1.5;t+=.05){const p=point(t);if(surfacesAt(root,p.x,p.z,box).some(h=>Math.abs(h.point.y-deckY)<.12)){stand=point(t+.35);break;}}
  if(!stand)return null;stand.y=(surfacesAt(root,stand.x,stand.z,box).find(h=>Math.abs(h.point.y-deckY)<.12)?.point.y??deckY)+.015;
  const normal=dir.clone().negate();
  return {kind:'stairs',dir,normal,right:side,bottom,top,stand,slope,c,height:deckY-bottom.y,over:deckY-bottom.y,rungs:[],spacing:.28,axis:dir,own:true};
 }
 // What a climber grabs above the top rung: on each side (sign of right) the nearest upright beside the ladder's
 // centre line, i.e. the ladder's own rails or the posts of a railing opening, found with sideways probes from the rung
 // line (and a little either side of it). Each side lists {h (height above the ladder foot via y), point (inner face)}.
 function handrails(root,at,right,normal,from,to){
  return [-1,1].map(sign=>{const dir=right.clone().multiplyScalar(sign),out=[];
   for(let y=from;y<to;y+=.05){let best=null;for(const d of [0,-.05,.05,-.1,.1]){const o=at(y).addScaledVector(normal,d);ray.set(o,dir);ray.far=.7;const hit=ray.intersectObject(root,true).find(h=>h.distance>.12);if(hit&&(!best||hit.distance<best.distance))best=hit;}
    if(best)out.push({y,point:best.point.clone()});}
   return out;});
 }
 // Headroom above a deck point: the underside of whatever roof is overhead (null: open sky).
 function roofOver(root,point){ray.set(new T.Vector3(point.x,point.y+.1,point.z),new T.Vector3(0,1,0));ray.far=3;const hit=ray.intersectObject(root,true)[0];return hit?hit.point.y:null;}
 function ownLadder(root,box,deckY,railAt){
  const ground=box.min.y,found=[];
  for(const [nx,nz] of [[0,1],[0,-1],[1,0],[-1,0]]){
   const normal=new T.Vector3(nx,0,nz),right=new T.Vector3(nz,0,-nx),outer=nx>0?box.max.x:nx<0?-box.min.x:nz>0?box.max.z:-box.min.z,lo=nx?box.min.z:box.min.x,hi=nx?box.max.z:box.max.x,columns=[];
   for(let u=lo+.05;u<hi;u+=.1){
    const hits=[];for(let y=ground+.15;y<deckY+.15;y+=.04){ray.set(new T.Vector3(nx?(outer+2)*nx:u,y,nz?(outer+2)*nz:u),normal.clone().negate());ray.far=4;const h=ray.intersectObject(root,true)[0];hits.push(h?h.distance-2:null);}
    // Thin clusters of hits (a rung is a few centimetres tall).
    const rungs=[];for(let i=0;i<hits.length;){if(hits[i]==null){i++;continue;}let j=i;while(j<hits.length&&hits[j]!=null)j++;if(j-i<=3){const k=(i+j-1)/2;rungs.push({y:ground+.15+k*.04,d:hits.slice(i,j).reduce((a,b)=>a+b)/(j-i)});}i=j;}
    if(rungs.length<4){columns.push(null);continue;}
    // Line depth = a + b·y through the rungs (median slope resists a brace seen through a gap).
    const slopes=[];for(let i=1;i<rungs.length;i++)slopes.push((rungs[i].d-rungs[i-1].d)/(rungs[i].y-rungs[i-1].y));slopes.sort((p,q)=>p-q);const b=slopes[Math.floor(slopes.length/2)];
    const as=rungs.map(r=>r.d-b*r.y).sort((p,q)=>p-q),a=as[Math.floor(as.length/2)],line=rungs.filter(r=>Math.abs(r.d-a-b*r.y)<.07);
    // Even spacing, allowing for a rung or two the probes slipped past (gaps of two or three steps).
    const gaps=line.slice(1).map((r,i)=>r.y-line[i].y),step=Math.min(...gaps.filter(g=>g>.15));
    const even=gaps.length>=2&&step<.45&&gaps.every(g=>{const k=Math.round(g/step);return k>=1&&k<=3&&Math.abs(g-k*step)<.07;}),lean=Math.abs(b)<.7,span=line.length?line.at(-1).y-line[0].y:0;
    columns.push(even&&lean&&span>(deckY-ground)*.5?{u,a,b,rungs:line.map(r=>r.y),gap:step}:null);
   }
   for(let i=0;i<columns.length;){if(!columns[i]){i++;continue;}let j=i;while(j<columns.length&&columns[j])j++;const run=columns.slice(i,j);if(run.length>=2)found.push({normal,right,outer,run});i=j;}
  }
  if(!found.length)return null;
  const {normal,right,outer,run}=found.sort((p,q)=>q.run.length-p.run.length)[0],mid=run[Math.floor(run.length/2)],u=(run[0].u+run.at(-1).u)/2;
  const a=run.reduce((p,c)=>p+c.a,0)/run.length,b=run.reduce((p,c)=>p+c.b,0)/run.length;
  // A point on the ladder's rung line at height y.
  const at=y=>{const w=outer-(a+b*y);return new T.Vector3(normal.x?w*normal.x:u,y,normal.z?w*normal.z:u);};
  const bottom=at(groundHeight(...(p=>[p.x,p.z])(at(ground))));bottom.y=groundHeight(bottom.x,bottom.z);const top=at(deckY),axis=top.clone().sub(bottom).normalize();
  // Rungs seen by any column, merged, with the ones every column missed filled in at the spacing.
  const gap=Math.min(...run.map(c=>c.gap)),seen=run.flatMap(c=>c.rungs).sort((p,q)=>p-q),merged=[];for(const y of seen){if(merged.length&&y-merged.at(-1).y<.06){const m=merged.at(-1);m.y=(m.y*m.n+y)/(m.n+1);m.n++;}else merged.push({y,n:1});}
  const heights=[];merged.forEach((m,i)=>{if(i){const prev=merged[i-1].y,k=Math.round((m.y-prev)/gap);for(let j=1;j<k;j++)heights.push(prev+(m.y-prev)*j/k);}heights.push(m.y);});
  // Below the lowest seen rung, keep stepping down to the sand.
  while(heights[0]-gap>bottom.y+.12)heights.unshift(heights[0]-gap);
  const rungs=heights.map(y=>y-bottom.y).filter(h=>h>.05);
  // Step off at the top onto the deck, over a railing if one is there.
  let edge=null;for(let w=outer-(a+b*deckY)+.1;w>outer-3;w-=.05){const x=normal.x?w*normal.x:u,z=normal.z?w*normal.z:u;if(surfacesAt(root,x,z,box).some(h=>Math.abs(h.point.y-deckY)<.12)){edge=w;break;}}
  const rail=edge==null?null:railAt(normal,edge,u),stand=(edge==null?top.clone():new T.Vector3(normal.x?edge*normal.x:u,deckY,normal.z?edge*normal.z:u)).addScaledVector(normal,-Math.max(.32,(rail?.depth??0)+.3));
  const hit=surfacesAt(root,stand.x,stand.z,box).find(h=>Math.abs(h.point.y-deckY)<.12);stand.y=(hit?.point.y??deckY)+.015;
  const over=Math.max(rail?rail.top:deckY,bottom.y+(rungs.at(-1)??0))-bottom.y;
  const edgePoint=edge==null?top.clone():new T.Vector3(normal.x?edge*normal.x:u,deckY,normal.z?edge*normal.z:u);
  return {normal,right,top,edge:edgePoint,bottom,axis,stand,rungs,spacing:gap,height:deckY-bottom.y,over,railDepth:rail?.depth??0,roof:roofOver(root,stand),own:true,handrails:handrails(root,at,right,normal,bottom.y+(rungs.at(-1)??0)+.1,deckY+1.2)};
 }
 function buildLadder(l){
  ladderMesh.clear();if(!l||l.own)return;
  const length=(l.over+.32)/l.axis.y,mid=l.bottom.clone().addScaledVector(l.axis,length/2),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),l.axis);
  for(const side of [-.26,.26]){const rail=new T.Mesh(new T.CylinderGeometry(.03,.03,length,8),ladderMat);rail.position.copy(mid).addScaledVector(l.right,side);rail.quaternion.copy(q);rail.castShadow=true;ladderMesh.add(rail);}
  for(const h of l.rungs){const rung=new T.Mesh(new T.CylinderGeometry(.022,.022,.52,8),ladderMat);rung.position.copy(l.bottom).addScaledVector(l.axis,h/l.axis.y);rung.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),l.right);rung.castShadow=true;ladderMesh.add(rung);}
 }
 // Climbing is a function of time t, so climbing down is the same motion played backward. Each limb holds a rung and
 // moves to the next in the last half of its cycle; hands and feet move in diagonal pairs.
 let towerT=0,towerDir=1;
 const climb={hands:[new T.Vector3(),new T.Vector3()],feet:[new T.Vector3(),new T.Vector3()],aim:[0,1].map(()=>({dir:new T.Vector3(),palm:new T.Vector3()})),handWeight:[1,1],footWeight:[1,1],curl:[1,1],root:new T.Vector3(),yaw:0,onLadder:true,camera:0,duck:0,lean:.12,speed:0};
 // Feet stop a step below the top; with a railing, about half a metre under its top rail, where a leg swings over.
 function towerTimes(l){const climbH=Math.max(0,l.over-(l.over-l.height>.2?.55:.32));return {climbH,up:climbH/.8,mantle:1,turn:.6};}
 function stairLength(l){return l.bottom.distanceTo(l.top)+Math.hypot(l.stand.x-l.top.x,l.stand.z-l.top.z);}
 function towerTotal(){const l=anchors.lifeguard.ladder;if(!l)return 1.1;if(l.kind==='stairs')return stairLength(l)/.9+.6;const k=towerTimes(l);return k.up+k.mantle+k.turn;}
 // Stairs: walk the centre line at an easy pace (facing down the stairs on the way down), then turn to the sea.
 function stairPose(t){
  const l=anchors.lifeguard.ladder,a=Math.hypot(l.top.x-l.bottom.x,l.top.z-l.bottom.z),b=Math.hypot(l.stand.x-l.top.x,l.stand.z-l.top.z),walk=(a+b)/.9,d=T.MathUtils.clamp(t,0,walk)*.9;
  if(d<=a)climb.root.lerpVectors(l.bottom,l.top,d/a);else climb.root.lerpVectors(l.top,l.stand,(d-a)/b);
  // Body height follows the stair line; feet find the treads.
  const along=(climb.root.x-l.bottom.x)*l.dir.x+(climb.root.z-l.bottom.z)*l.dir.z;climb.root.y=d<=a?Math.max(l.bottom.y,Math.min(l.top.y,l.bottom.y+(l.top.y-l.bottom.y)*along/a)):climb.root.y;
  const up=Math.atan2(l.dir.x,l.dir.z),turn=T.MathUtils.smoothstep(t-walk,0,.6),facing=towerDir>0?up:up+Math.PI;let toSea=Math.PI-facing;toSea=Math.atan2(Math.sin(toSea),Math.cos(toSea));
  climb.yaw=facing+toSea*turn;climb.speed=t>0&&t<walk?.9:0;climb.onLadder=false;climb.camera=T.MathUtils.smoothstep(d,a*.6,a+b);climb.duck=0;
  return climb;
 }
 // Under a foot on the stairs: the highest face below knee height (not the handrail).
 const towerSurface=(x,z)=>{const source=propRoot.children.find(c=>c.name==='lifeguard'),l=anchors.lifeguard.ladder;if(source){const hit=surfacesAt(source,x,z).find(h=>h.point.y<Math.min(l.top.y+.1,climb.root.y+.3));if(hit)return Math.max(hit.point.y,groundHeight(x,z));}return groundHeight(x,z);};
 function climbPose(t){
  const l=anchors.lifeguard.ladder,k=towerTimes(l),sp=l.spacing,n=l.normal,r=l.right,top=l.rungs.length;
  const along=(h,out)=>out.copy(l.bottom).addScaledVector(l.axis,h/l.axis.y);
  const level=x=>Math.floor(x)+T.MathUtils.smoothstep(x-Math.floor(x),.5,1),swing=x=>{const f=x-Math.floor(x);return f>.5?Math.sin(Math.PI*(f-.5)*2):0;};
  // Height of rung k (k = 0 is the sand); fractional k moves between rungs; beyond the top, keep the spacing.
  const rungAt=k=>{const at=j=>j<=0?0:j<=top?l.rungs[j-1]:(l.rungs[top-1]??0)+(j-top)*sp,f=Math.floor(k);return at(f)+(at(f+1)-at(f))*(k-f);},handRungs=Math.round(1.2/sp);
  const u=T.MathUtils.clamp(t/k.up,0,1)*k.climbH,m=T.MathUtils.clamp((t-k.up)/k.mantle,0,1),turn=T.MathUtils.smoothstep(t-k.up-k.mantle,0,k.turn);
  const reach=character.gripReach||0,down=new T.Vector3(0,-1,0),fingers=n.clone().negate().multiplyScalar(.9).addScaledVector(down,.44).normalize(),palm=new T.Vector3().crossVectors(r,fingers);if(palm.y>0)palm.negate();
  const ladderYaw=Math.atan2(-n.x,-n.z),u0=Math.min(t,k.up)/k.up*k.climbH;
  // Which way along the rungs is each limb's side? The climber faces the ladder, so its own +x runs along -right;
  // read it from the facing rather than assume, or hands and feet cross over.
  const avatarX=Math.cos(ladderYaw)*r.x-Math.sin(ladderYaw)*r.z;
  // The handrail on a side nearest a point (within 35 cm), or at world height y: the hand against its inner face (a
  // hand centred in the post would put the fingers through it). Null when there is none.
  const rail=(sideSign,want)=>{const list=l.handrails?.[sideSign<0?0:1];if(!list?.length)return null;let best=null,d=typeof want==='number'?.08:.35;
   for(const p of list){const e=typeof want==='number'?Math.abs(p.y-want):p.point.distanceTo(want);if(e<d){d=e;best=p;}}return best?best.point.clone().addScaledVector(r,-sideSign*.04):null;};
  for(let i=0;i<2;i++){const sideSign=Math.sign(character.side[i])*Math.sign(avatarX||1);
   // Feet: rung k sits at k·spacing; level 0 is the sand. The sole rests on top of the rung (rung heights are centres).
   const fx=u0/sp+(i?.5:0),fl=Math.min(level(fx),top);along(rungAt(fl),climb.feet[i]).addScaledVector(r,sideSign*.12).addScaledVector(n,.03+.12*swing(fx)).y+=.03+(character.ankleHeight??.08);
   // Hands: about five rungs above the feet, then up the rails above the deck.
   // Above the top rung the hands take the handrails (the ladder's rails or the posts beside the opening) if any.
   const hx=u0/sp+(i?0:.5),hl=level(hx)+handRungs,h=Math.min(rungAt(hl),l.over+.22),held=hl>top?rail(sideSign,along(h,new T.Vector3()).addScaledVector(r,sideSign*.2)):null;
   if(held)climb.hands[i].copy(held).addScaledVector(n,.1*swing(hx));else along(h,climb.hands[i]).addScaledVector(r,sideSign*(hl>top?.26:.17)).addScaledVector(n,.1*swing(hx));
   if(reach)climb.hands[i].addScaledVector(fingers,-reach*.85).addScaledVector(palm,-.04);else climb.hands[i].addScaledVector(n,.06);
   climb.aim[i].dir.copy(fingers);climb.aim[i].palm.copy(palm);
   climb.footWeight[i]=1-T.MathUtils.smoothstep(m,.9,1);climb.handWeight[i]=1-T.MathUtils.smoothstep(m,.7,.92);climb.curl[i]=climb.handWeight[i];
  }
  // Over the top like a person: hands on the top rail (or deck edge), hips just high enough to clear it, the lead foot
  // arcs over and down onto the deck and the other follows, leaning in under a low roof. Then turn to face the sea.
  // The body hangs 25 cm below the rung line, so both knees bend (the lower leg a little, the upper one more; any
  // higher and the lower leg locks straight), hips about 42 cm off the ladder plane (measured square to it, 0.9 m
  // above the feet). On a leaning ladder that puts the hips nearly over the feet, as on steep stairs; a fixed level
  // offset would leave the hips far out and the torso folded forward to reach the rungs.
  const tilt=Math.acos(T.MathUtils.clamp(l.axis.y,-1,1)),out=(.42-.9*Math.sin(tilt))/Math.cos(tilt);
  const body=(h,o)=>along(h,o).addScaledVector(n,out).setY(o.y-.25);
  const start=body(k.climbH,new T.Vector3()),end=l.stand,deckY=l.stand.y-.015,railY=l.bottom.y+l.over;
  // The torso leans in a little with the ladder, so the hands reach the rungs ahead.
  body(u0,climb.root);climb.duck=0;climb.lean=.12+.4*tilt;
  if(m>0){
   const across=T.MathUtils.smoothstep(m,.15,.85),drop=T.MathUtils.smoothstep(m,.35,.95);
   climb.root.set(start.x+(end.x-start.x)*across,start.y+(end.y-start.y)*drop,start.z+(end.z-start.z)*across);
   const railLine=l.edge.clone().addScaledVector(n,-l.railDepth);
   for(let i=0;i<2;i++){const sideSign=Math.sign(character.side[i])*Math.sign(avatarX||1);
    // Hands on the posts beside the opening at about waist height on the deck, else on the top rail or deck edge.
    let grip=null;for(const y of [deckY+.7,deckY+.6,deckY+.8,deckY+.5,deckY+.9])if(!grip)grip=rail(sideSign,y);
    if(!grip){grip=railLine.clone().addScaledVector(r,sideSign*.24);grip.y=railY;}
    if(reach)grip.addScaledVector(fingers,-reach*.85).addScaledVector(palm,-.04);else grip.addScaledVector(n,.06);
    climb.hands[i].lerp(grip,T.MathUtils.smoothstep(m,0,.15));
    const s0=i?.45:.1,f=T.MathUtils.smoothstep(m,s0,s0+.4),from=climb.feet[i].clone(),to=end.clone().addScaledVector(r,sideSign*.12),mid=railLine.clone().addScaledVector(r,sideSign*.14);to.y=deckY+.08;mid.y=railY+.16;
    climb.feet[i].set(0,0,0).addScaledVector(from,(1-f)**2).addScaledVector(mid,2*f*(1-f)).addScaledVector(to,f*f);
   }
   climb.lean=.12+.4*tilt*(1-across)+.45*Math.sin(Math.PI*across);
   if(l.roof!=null)climb.duck=T.MathUtils.clamp((climb.root.y+1.75-l.roof)/.5,0,1)*T.MathUtils.smoothstep(m,.3,.6);
  }
  let toSea=Math.PI-ladderYaw;toSea=Math.atan2(Math.sin(toSea),Math.cos(toSea));climb.yaw=ladderYaw+toSea*turn;
  climb.onLadder=m<.9;climb.camera=T.MathUtils.smoothstep(m,.4,1);
  return climb;
 }
 function syncAnchors(){
  for(const a of anchorList){const c=e.colliders.find(c=>c.id===a.id);a.box=c?.box??null;const slot=config.slots.find(s=>s.id===a.id);const half=(slot.maxLen??3)*.5;const edge=a.box?a.box.max.z:a.z+half;a.point.set(a.x,groundHeight(a.x,edge+1.05),edge+1.05);}
  for(const a of anchorList){const source=propRoot.children.find(c=>c.name===a.id);a.surface=findSurface(source,a.id,e.group,a);}
  const a=anchors.umbrella,seat=a.surface.point;a.point.set(seat.x,groundHeight(seat.x,(a.box?.max.z??seat.z)+.8),(a.box?.max.z??seat.z)+.8);
  const tower=anchors.lifeguard,towerSource=propRoot.children.find(c=>c.name==='lifeguard');tower.ladder=towerSource?.children.length&&tower.surface.real?findLadder(towerSource,tower.surface):null;buildLadder(tower.ladder);
  tower.climb=tower.ladder?tower.ladder.bottom.clone().addScaledVector(tower.ladder.normal,.3):new T.Vector3(tower.surface.point.x,groundHeight(tower.surface.point.x,(tower.box?.max.z??tower.z)+.25),(tower.box?.max.z??tower.z)+.25);
  // The interaction point sits at the foot of the ladder.
  if(tower.ladder){tower.point.copy(tower.ladder.bottom).addScaledVector(tower.ladder.normal,.9);tower.point.y=groundHeight(tower.point.x,tower.point.z);}
  // Current group geometry is shared by a detached clone; source transforms stay intact.
  if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;
  if(boatModel)vessel.remove(boatModel);
  const source=propRoot.children.find(c=>c.name==='boat');
  if(source?.children.length){boatModel=source.clone(true);boatModel.position.set(0,-groundHeight(4,8),0);// Turn the hull so its long axis runs along the direction of travel (local z); the slot may hold it at any yaw.
   // The long axis comes from the spread of the vertices, not the box: thin parts that stick out (C's oars) have few
   // vertices but would widen the box and skew it.
   const box=new T.Box3(),base=boatModel.rotation.y,pts=[],vtx=new T.Vector3();boatModel.updateMatrixWorld(true);boatModel.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,step=Math.max(1,Math.floor(p.count/4000));for(let i=0;i<p.count;i+=step){vtx.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);pts.push(vtx.x,vtx.z);}});
   let best=base,narrow=Infinity;for(let k=0;k<72;k++){const a=k*Math.PI/72,c=Math.cos(a),sn=Math.sin(a);let m=0,m2=0,n=0;for(let i=0;i<pts.length;i+=2){const x=c*pts[i]+sn*pts[i+1];m+=x;m2+=x*x;n++;}const spread=m2/n-(m/n)**2;if(spread<narrow){narrow=spread;best=base+a;}}boatModel.rotation.y=best;
   // Single-skin hulls (C) are culled from inside; draw both faces so the inside of the hull shows, not the sea.
   boatModel.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.side=T.DoubleSide;}});
   // Float with a draft: the keel a quarter of the hull height under the water line (local y 0), not on top of it.
   boatModel.updateMatrixWorld(true);box.setFromObject(boatModel,true);boat.draft=T.MathUtils.clamp(.25*(box.max.y-box.min.y),.12,.25);boatModel.position.y-=box.min.y+boat.draft;}
  else boatModel=fallbackModel??=fallbackBoat();vessel.add(boatModel);
  vessel.updateMatrixWorld(true);const oldPosition=vessel.position.clone(),oldRotation=vessel.quaternion.clone();vessel.position.set(0,0,0);vessel.quaternion.identity();vessel.updateMatrixWorld(true);boatSeat=findSurface(boatModel,'boat',e.group,{x:0,z:0});{const hull=new T.Box3().setFromObject(boatModel,true);
   // The hull proper, without oars or other parts that stick out (C's model carries its oars, which widen and shift
   // the box): the longest run of columns whose lowest upward face is near the bottom, across midships and then along
   // the centre line. Only a run whose centre is off the box's moves it, so a clean hull keeps its box.
   {const low=hull.min.y+(hull.max.y-hull.min.y)*.35,deep=(x,z)=>surfacesAt(boatModel,x,z,hull).some(h2=>h2.point.y<low);
    const longest=(lo,hi,test)=>{let best=null,run=null,gap=0;for(let u=lo;u<=hi;u+=.03){if(test(u)){if(run&&gap<=2)run[1]=u;else{run=[u,u];}gap=0;if(!best||run[1]-run[0]>best[1]-best[0])best=run.slice();}else gap++;}return best;};
    const cz=(hull.min.z+hull.max.z)/2,xs=longest(hull.min.x,hull.max.x,x=>deep(x,cz));
    if(xs&&Math.abs((xs[0]+xs[1])/2-(hull.min.x+hull.max.x)/2)>.08){hull.min.x=xs[0];hull.max.x=xs[1];}
    const cx=(hull.min.x+hull.max.x)/2,zs=longest(hull.min.z,hull.max.z,z=>deep(cx,z));
    if(zs&&zs[1]-zs[0]>.5&&Math.abs((zs[0]+zs[1])/2-cz)>.08){hull.min.z=zs[0];hull.max.z=zs[1];}}
   const mid=(hull.min.z+hull.max.z)/2;
   boat.hull={x:(hull.min.x+hull.max.x)/2,z:mid,len:hull.max.z-hull.min.z,beam:hull.max.x-hull.min.x};
   // Sit on a thwart near midships, a little aft, so the legs have room toward the bow (-z): scan the centreline for
   // horizontal patches between floor and gunwale and take the run closest to that spot.
   if(boatSeat.real){const h=hull.max.y-hull.min.y,len=hull.max.z-hull.min.z,x=(hull.min.x+hull.max.x)/2,runs=[];let run=null;
    for(let z=hull.min.z+.1;z<hull.max.z-.1;z+=.04){const hit=surfacesAt(boatModel,x,z,hull).find(h2=>h2.point.y>hull.min.y+h*.3&&h2.point.y<hull.min.y+h*.85);
     if(hit&&run&&Math.abs(hit.point.y-run.y)<.05){run.z1=z;}else{run=hit?{z0:z,z1:z,y:hit.point.y}:null;if(run)runs.push(run);}}
    const aim=mid+len*.08,thwart=runs.filter(r=>r.z1-r.z0>.12&&r.z1-r.z0<.7).sort((a,b)=>Math.abs((a.z0+a.z1)/2-aim)-Math.abs((b.z0+b.z1)/2-aim))[0];
    if(thwart)boatSeat.point.set(x,thwart.y+.035,(thwart.z0+thwart.z1)/2);}
   row.bow=hull.min.z;row.floorY=Math.max(hull.min.y+.16,boatSeat.point.y-.5);
   // The floor where the feet go: the highest upward face under the seat at the foot spots (the inner floor, not the
   // keel), plus the ankle's height above the sole; the guess above stays when nothing is found.
   {const fz=Math.max(boatSeat.point.z-.55,hull.min.z+.45),floors=[-1,1].map(k=>surfacesAt(boatModel,boatSeat.point.x+k*.13,fz,hull).filter(h2=>h2.point.y<boatSeat.point.y-.12).reduce((m,h2)=>Math.max(m,h2.point.y),-Infinity)).filter(Number.isFinite);
    if(floors.length)row.floorY=Math.max(...floors)+(character.ankleHeight??.08);}
   // The water is one opaque plane, so a hull sitting in it would show water inside. A depth-only cap over the hull's
   // inside, 20 cm above the water line (the water at the hull's ends and sides still reaches ~10 cm over it with the
   // hull riding the waves), drawn after the boat and before the water, keeps the water out of view there.
   // Its outline: the inner faces of the hull walls at that height, probed sideways from the centre line.
   {if(boat.mask){vessel.remove(boat.mask);boat.mask.geometry.dispose();boat.mask=null;}
    const y=Math.min(.2,hull.max.y*.4),cx=(hull.min.x+hull.max.x)/2,left=[],right=[],probe=new T.Raycaster();
    for(let z=hull.min.z+.02;z<hull.max.z;z+=.05){const o=new T.Vector3(cx,y,z);const side=d=>{probe.set(o,new T.Vector3(d,0,0));probe.far=hull.max.x-hull.min.x;return probe.intersectObject(boatModel,true)[0]?.distance;};
     const l=side(-1),r=side(1);if(l==null||r==null||l>(hull.max.x-hull.min.x)*.7||r>(hull.max.x-hull.min.x)*.7)continue;left.push([cx-l,z]);right.push([cx+r,z]);}
    if(left.length>2){const shape=new T.Shape([...left,...right.reverse()].map(([x,z])=>new T.Vector2(x,-z)));const g=new T.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,y,0);
     boat.mask=new T.Mesh(g,new T.MeshBasicMaterial({colorWrite:false,side:T.DoubleSide}));boat.mask.renderOrder=1;boat.mask.name='hull-water-mask';vessel.add(boat.mask);water.renderOrder=2;}}row.dip=Math.asin(T.MathUtils.clamp((boatSeat.point.y+.48+.1)/1.22,.3,.55));}vessel.position.copy(oldPosition);vessel.quaternion.copy(oldRotation);vessel.updateMatrixWorld(true);
  if(mode==='boat'&&source){source.visible=false;hiddenBoat=source;}
 }
 syncAnchors();
 const ball=createBall(objects.ball,()=>e.colliders,()=>{if(!state.ball){state.ball=true;toast('球進海裡了！讓它跟著浪花漂吧。');}},()=>e.sfx('splash'));
 function toast(message){$('#game-toast').textContent=message;toastUntil=time()+3.5;}
 function renderHud(){const signature=`${state.shells},${state.ball},${state.lounger},${state.tower},${state.observed},${state.spotted},${state.boat},${state.footprints>0},${Math.floor(elapsed)}`;if(signature===lastHud)return;lastHud=signature;$('#shell-count').textContent=`${state.shells} / 8`;$('#tidepool-hud').textContent=`${state.observed} / 6`;$('#lagoon-hud').textContent=`${state.spotted} / 7`;for(const key of ['shells','ball','lounger','tower','tidepool','opensea','boat']){const done=key==='shells'?state.shells===8:state[key],li=$(`[data-quest=${key}]`);li.classList.toggle('done',done);li.querySelector('i').textContent=done?'✓':'';li.setAttribute('aria-label',`${li.textContent}，${done?'已完成':'未完成'}`);}$('#game-clock').textContent=formatTime(elapsed);if(state.footprints)$('#footnote').textContent='✓ 留下腳印，讓浪花慢慢帶走';}
 function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
 function begin(){running=true;document.body.classList.add('game-playing');$('#start').hidden=true;$('#begin').textContent='繼續玩';welcome.querySelector('h1').textContent='海灘小任務';renderHud();}
 // `start` is exported by Explore so the same gesture enables sound and controls.
 $('#begin').onclick=()=>{e.start();begin();};
 function fade(){fadeAt=time();}
 function seated(){/* Poses are blended on the active skeleton in updateCharacter. */}
 // Where the body rests under the umbrella: on a lounger, the lying point found from its profile.
 const restPoint=()=>anchors.umbrella.surface.lie?.point??anchors.umbrella.surface.point;
 function enter(next){e.setFirstPerson(false);returnPoint.copy(e.player);mode=next;modeAge=0;e.setDriven(true);e.clearInput();fade();if(next==='rest'){e.player.copy(restPoint());e.avatar.rotation.set(0,anchors.umbrella.surface.yaw,0);toast('聽一會兒海浪。按 E 或「互動」起身。');}if(next==='tower'){climbStart.copy(anchors.lifeguard.climb);e.player.copy(climbStart);towerT=0;towerDir=1;e.avatar.rotation.set(0,anchors.lifeguard.ladder?Math.atan2(-anchors.lifeguard.ladder.normal.x,-anchors.lifeguard.ladder.normal.z):Math.PI,0);toast('從高處看看整座海灣。按 E 下塔。');}if(next==='tidepool'){camGoal.copy(pool.center).add(new T.Vector3(0,9,7));camLook.copy(pool.center);document.exitPointerLock?.();lagoon.open(e.group,{muted:e.muted,auto});}if(next==='boat'){vessel.visible=true;vessel.position.set(dock.x,0,dock.z);boatSpeed=0;boatYaw=0;seated(true);syncAnchors();$('.game-controls').innerHTML='W / S 划行　A / D 轉向　E 靠岸下船<br>在浮標附近等牠們浮出水面，按 E 觀察，再划回岸邊';toast('W / S 划行，A / D 轉向。向金色浮標出發！');}}
 function leave(done=false){if(mode==='tidepool'&&lagoon.isOpen){lagoon.close();return;}
  // Off the tower by the ladder: play the climb backward, then step off at its foot.
  if(mode==='tower'&&anchors.lifeguard.ladder&&!done){towerDir=-1;return;}if(mode==='boat'){if(Math.hypot(vessel.position.x-dock.x,vessel.position.z-dock.z)>11){toast('先回到岸邊的金色圓環，才能下船。');return;}if(state.island){state.boat=true;toast('小島往返完成，歡迎回岸！');}vessel.visible=false;if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;}mode='walk';$('.game-controls').innerHTML='WASD 移動　滑鼠／←→ 轉視角　E 互動　Shift 跑步<br>1 / 2 / 3 素材　M 靜音　Esc 暫停';e.player.copy(returnPoint);e.avatar.rotation.set(0,Math.PI,0);if(done&&anchors.lifeguard.ladder){const l=anchors.lifeguard.ladder;e.player.copy(l.bottom).addScaledVector(l.normal,.55);e.player.y=groundHeight(e.player.x,e.player.z);e.avatar.rotation.set(0,Math.atan2(l.normal.x,l.normal.z),0);}seated(false);e.setDriven(false);e.setView(0);e.clearInput();lastPlayer.copy(e.player);fade();}
 function setNear(kind,label,position,item=null){interaction.kind=kind;interaction.label=label;interaction.position=position;interaction.item=item;return interaction;}
 function nearTarget(){if(lagoon.isOpen)return null;const seen=mode==='boat'&&!state.opensea?sighting():null;if(seen)return setNear('opensea',`觀察${seen.spec.name}`,seaTarget,seen);if(mode==='boat'&&Math.hypot(vessel.position.x-dock.x,vessel.position.z-dock.z)>11)return null;if(mode!=='walk')return setNear('leave',mode==='rest'?'起身，繼續散步':mode==='tower'?'走下救生塔':mode==='tidepool'?'回到沙灘':'靠岸下船',e.player);let best=2.4,result=null;for(const item of objects.items){if(item.collected)continue;const d=Math.hypot(item.x-e.player.x,item.z-e.player.z);if(d<best){best=d;result=item;}}
  if(result)return setNear('shell','撿起貝殼',result,result);
  if(e.player.distanceTo(objects.ball.position)<2.3)return setNear('ball','踢球，朝海邊！',objects.ball.position);
  if(e.player.distanceTo(pool.point)<2.6)return setNear('tidepool','蹲下看看潮池',pool.point);
  for(const a of anchorList){if(e.player.distanceTo(a.point)<2.4)return setNear(a.id,a.id==='boat'?'推船下水，划向小島':a.id==='umbrella'?'坐下，聽海':'爬上救生塔',a.point);}return null;
 }
 // Picking up a shell: walk up to it, turn to face it, squat and reach; it counts the moment the hand closes on it,
 // rides in the hand while standing up, then sparkles away.
 let pickup=null,pickupSpeed=0;const reachPoint=new T.Vector3(),heldPoint=new T.Vector3(),chestPoint=new T.Vector3(),facing=new T.Vector3();
 function startPickup(item){
  const dx=e.player.x-item.x,dz=e.player.z-item.z,d=Math.hypot(dx,dz)||1,stand=Math.min(d,.72);
  pickup={item,age:-1,spot:new T.Vector3(item.x+dx/d*stand,0,item.z+dz/d*stand),grabbed:false,hand:0};e.setHold(true);
 }
 function runPickup(dt,t){
  const p=pickup,item=p.item,toSpot=Math.hypot(p.spot.x-e.player.x,p.spot.z-e.player.z);
  let speed=0;
  if(p.age<0){
   // Approach at a stroll; then turn in place toward the shell.
   const step=Math.min(toSpot,1.4*dt);if(toSpot>.01){e.player.x+=(p.spot.x-e.player.x)/toSpot*step;e.player.z+=(p.spot.z-e.player.z)/toSpot*step;e.player.y=groundHeight(e.player.x,e.player.z);speed=step/Math.max(dt,1e-6);e.avatar.rotation.y=Math.atan2(p.spot.x-e.avatar.position.x,p.spot.z-e.avatar.position.z);}
   const want=Math.atan2(item.x-e.player.x,item.z-e.player.z),turn=Math.atan2(Math.sin(want-e.avatar.rotation.y),Math.cos(want-e.avatar.rotation.y));
   if(toSpot<=.01){e.avatar.rotation.y+=turn*(1-Math.exp(-14*dt));if(Math.abs(turn)<.12){p.age=0;character.trigger('interact');
    // The hand on the shell's side reaches; the shell sits straight ahead, so default to the right hand.
    const right=Math.cos(e.avatar.rotation.y)*(item.x-e.player.x)-Math.sin(e.avatar.rotation.y)*(item.z-e.player.z);p.hand=character.side.findIndex(s=>Math.sign(s)===(Math.sign(right)||-1));if(p.hand<0)p.hand=0;}}
   e.avatar.position.copy(e.player);return speed;
  }
  p.age+=dt;const a=p.age;
  if(!p.grabbed&&a>=.42){p.grabbed=true;item.collected=true;state.shells++;e.sfx('pickup');toast(state.shells===8?'8 枚貝殼收齊了。謝謝海灘的小禮物！':`找到第 ${state.shells} 枚貝殼`);renderHud();}
  if(p.grabbed&&a<.85)item.held=character.palm(p.hand,heldPoint);
  if(a>=.85){if(item.held){objects.burst(item.held.x,item.held.y,item.held.z,t);item.held=null;item.born=-100;}pickup=null;e.setHold(false);}
  return 0;
 }
 // Pose for the pickup: squat (pelvis down, feet planted), bend over, reach and close the hand, look at the shell.
 function pickupIK(){
  const p=pickup,a=Math.max(0,p.age),down=T.MathUtils.smoothstep(a,0,.3)*(1-T.MathUtils.smoothstep(a,.55,.9));
  const item=p.item,hands=[null,null],weight=[0,0],curl=[0,0];
  // Reach for the near rim of the (oversized, easy-to-spot) shell.
  const toward=Math.hypot(e.player.x-item.x,e.player.z-item.z)||1;reachPoint.set(item.x+(e.player.x-item.x)/toward*.18,item.y+.1,item.z+(e.player.z-item.z)/toward*.18);
  // After the grab the hand lifts toward the chest.
  if(p.grabbed){const lift=T.MathUtils.smoothstep(a,.45,.8);reachPoint.lerp(chestPoint.set(e.player.x,e.player.y+1.05,e.player.z).addScaledVector(character.root.getWorldDirection(facing),.3),lift);}
  hands[p.hand]=reachPoint;weight[p.hand]=T.MathUtils.smoothstep(a,.02,.3)*(1-T.MathUtils.smoothstep(a,.7,.9));curl[p.hand]=T.MathUtils.smoothstep(a,.34,.44);
  return {hands,handWeight:weight,curl,pelvis:-.3*down,ground:groundHeight,spine:{lean:1.05*down},look:p.grabbed?null:new T.Vector3(item.x,item.y,item.z),lookWeight:down};
 }
 function interact(){if(!running||completed||!e.active||e.busy||lagoon.isOpen||pickup)return;near=nearTarget();if(!near){if(mode==='boat')toast('划回岸邊的金色圓環，就能下船。');return;}
  if(near.kind==='leave'){leave();return;}
  if(near.kind==='opensea'){const c=near.item;if(sea.observe(c.i)){const count=sea.seen.length;state.spotted=count;e.sfx('pickup');toast(count===7?'7 種海洋生物都觀察到了！划回岸邊吧。':`觀察到${c.spec.name}：${c.spec.note}（${count} / 7）`);if(count===7)state.opensea=true;renderHud();}return;}
  if(near.kind==='shell'&&!near.item.collected)startPickup(near.item);
  if(near.kind==='ball'){ball.kick(e.player);character.trigger('kick');e.sfx('kick');}
  if(near.kind==='umbrella')enter('rest');if(near.kind==='lifeguard')enter('tower');if(near.kind==='boat')enter('boat');if(near.kind==='tidepool')enter('tidepool');renderHud();
 }
 addEventListener('keydown',event=>{if(event.code==='KeyE'&&!event.repeat){event.preventDefault();interact();}});$('#interact').onclick=interact;$('#game-audio').onclick=()=>e.mute();
 function complete(){camera.position.fromArray(config.cameras.wide.pos);target.fromArray(config.cameras.wide.target);camera.lookAt(target);completed=true;running=false;e.setDriven(true);e.clearInput();document.exitPointerLock?.();$('#start').hidden=true;$('#complete').hidden=false;document.body.classList.add('game-complete');$('#finish-time').textContent=`這次的海邊時光　${formatTime(elapsed)}`;$('#finish-bonus').textContent=state.footprints?'還留下了一串會消失的腳印。':'下次來，試著在沙灘上留一串腳印。';$('#replay').focus();}
 function reset(){if(pickup){pickup=null;e.setHold(false);}if(hiddenBoat)hiddenBoat.visible=true;hiddenBoat=null;vessel.visible=false;mode='walk';completed=false;running=false;elapsed=0;boatSpeed=0;footDistance=0;for(const key of Object.keys(state))state[key]=['shells','footprints','spotted','observed'].includes(key)?0:false;lagoon.reset();sea.reset();objects.reset();ball.reset();e.player.set(-7,groundHeight(-7,12),12);lastPlayer.copy(e.player);e.avatar.rotation.set(0,0,0);seated(false);e.setDriven(false);e.setView(.15);e.clearInput();$('#complete').hidden=true;document.body.classList.remove('game-complete');lastHud='';$('#footnote').textContent='額外的小紀念：在沙上留下腳印';e.start();begin();fade();}
 $('#replay').onclick=reset;
 document.addEventListener('pointerlockchange',()=>{if(completed||mode==='tidepool'||lagoon.isOpen)$('#start').hidden=true;});
 // Kayak stroke: over one cycle each blade enters forward of the hip, pulls back and lifts out (phase 0..π: +x blade).
 function rowPaddle(dt,t,f){
  const before=row.phase;row.phase+=dt*Math.PI/.7*Math.sign(f)*Math.min(1,Math.abs(f));
  row.amount=T.MathUtils.damp(row.amount,f?1:0,4,dt);
  const a=row.amount,seat=boatSeat.point,roll=Math.sin(row.phase)*row.dip*a,yaw=Math.cos(row.phase)*.5*a;
  // Shaft centre: in the lap at rest, at chest height and forward while stroking.
  const arm=character.armLength;oar.position.set(seat.x,seat.y+.3+.16*a,seat.z-.1-arm*(.45+.15*a));oar.rotation.set(0,yaw,-roll);oar.updateMatrix();
  // Hands grip the shaft at shoulder width; the wrists sit a little behind it.
  // The avatar faces the bow, half a turn from the vessel axes, so its +x is the vessel's -x. Overhand grip: the
  // fingers reach forward over the shaft and close under it; the palm rests on top.
  const shaftAxis=row.axis.set(1,0,0).applyMatrix4(oar.matrix).sub(row.p.set(0,0,0).applyMatrix4(oar.matrix)).transformDirection(vessel.matrixWorld);
  const ahead=row.dir.set(0,0,-1).transformDirection(vessel.matrixWorld),down=row.palm.set(0,-1,0);
  ahead.addScaledVector(shaftAxis,-ahead.dot(shaftAxis)).normalize();down.addScaledVector(shaftAxis,-down.dot(shaftAxis)).addScaledVector(ahead,-down.dot(ahead)).normalize();
  const fingers=ahead.multiplyScalar(.9).addScaledVector(down,.44).normalize(),palm=down.crossVectors(shaftAxis,fingers);if(palm.y>0)palm.negate();
  const reach=character.gripReach||0;
  for(let i=0;i<2;i++){const g=row.hands[i].set(-character.side[i]*.3,0,0).applyMatrix4(oar.matrix).applyMatrix4(vessel.matrixWorld);
   // The wrist sits behind and above the shaft by the knuckle reach; rigs without knuckle bones keep a small offset.
   if(reach)g.addScaledVector(fingers,-reach*.85).addScaledVector(palm,-.045);else g.addScaledVector(fingers,-.06);
   row.aim[i].dir.copy(fingers);row.aim[i].palm.copy(palm);
   // Feet braced on the hull floor ahead of the seat, knees up.
   row.feet[i].set(seat.x-character.side[i]*.13,row.floorY,Math.max(seat.z-.55,row.bow+.45)).applyMatrix4(vessel.matrixWorld);}
  row.twist=yaw*.75;row.lean=.12*a+.06*a*Math.cos(2*row.phase);
  if(Math.floor(row.phase/Math.PI)!==Math.floor(before/Math.PI)&&a>.5)e.sfx('paddle');
 }
 function boatUpdate(dt,t){
  e.input(input);const driving=running&&e.active&&!e.busy;const f=driving?input.forward:0,s=driving?input.side:0;
  boatYaw-=s*dt*1.15;boatSpeed+=(f*9*(.45+.85*Math.abs(Math.sin(row.phase)))-boatSpeed)*(1-Math.exp(-2*dt));
  const x=vessel.position.x-Math.sin(boatYaw)*boatSpeed*dt,z=vessel.position.z-Math.cos(boatYaw)*boatSpeed*dt;
  let allowed=groundHeight(x,z)<-.7&&x>-48&&x<145&&z>-304;
  for(const c of e.colliders){const b=c.box;if(x>b.min.x-1&&x<b.max.x+1&&z>b.min.z-1.8&&z<b.max.z+1.8)allowed=false;}
  // Keep out of both existing island meshes (which are separate from terrain.js).
  if(((x-114)/66)**2+((z+58)/80)**2<1||((x-90)/108)**2+((z+340)/43)**2<1)allowed=false;
  if(allowed){vessel.position.x=x;vessel.position.z=z;}else boatSpeed=0;
  // Ride the water over the whole hull, not the slope at one point: near the shore the waves are short, and a hull
  // levelled at its centre had the water up to 15 cm over its inside at bow or stern. Height and tilt come from the
  // water at bow, stern and both sides.
  const c=Math.cos(boatYaw),sine=Math.sin(boatYaw),hh=boat.hull??{x:0,z:0,len:3,beam:1.2},at=(lx,lz)=>{lx+=hh.x;lz+=hh.z;return sampleWater(vessel.position.x+c*lx+sine*lz,vessel.position.z-sine*lx+c*lz,t,wave).height;};
  const bow=at(0,-hh.len/2),stern=at(0,hh.len/2),port=at(-hh.beam/2,0),starboard=at(hh.beam/2,0),tilt=.3;
  vessel.position.y=(bow+stern+port+starboard)/4;vessel.rotation.set(T.MathUtils.clamp(Math.atan2(bow-stern,hh.len),-tilt,tilt),boatYaw,T.MathUtils.clamp(Math.atan2(starboard-port,hh.beam),-tilt,tilt),'YXZ');
  vessel.updateMatrixWorld(true);e.player.copy(boatSeat.point).applyMatrix4(vessel.matrixWorld);e.avatar.position.copy(e.player);e.avatar.rotation.set(vessel.rotation.x,boatYaw+Math.PI,vessel.rotation.z,'YXZ');
  rowPaddle(dt,t,f);
  const dist=Math.hypot(vessel.position.x-island.x,vessel.position.z-island.z);if(!state.island&&dist<11){state.island=true;objects.burst(vessel.position.x,vessel.position.y+1,vessel.position.z,t);e.sfx('pickup');toast('抵達浮標！等海洋生物浮出水面，按 E 觀察。');}
  camGoal.set(vessel.position.x+Math.sin(boatYaw)*9,vessel.position.y+4.8,vessel.position.z+Math.cos(boatYaw)*9);camLook.set(vessel.position.x-Math.sin(boatYaw)*7,1,vessel.position.z-Math.cos(boatYaw)*7);
 }
 function update(dt,t){
  if(lagoon.isOpen){document.body.classList.remove('game-paused');return;}
  sea.update(t);
  if(e.group!==currentGroup&&!e.busy){currentGroup=e.group;if(mode==='rest')e.player.copy(restPoint());else if(mode==='tower')e.player.copy(anchors.lifeguard.surface.point);}
  document.body.classList.toggle('game-paused',running&&!e.active&&!completed&&mode!=='tidepool');
  const active=running&&e.active&&!e.busy&&!completed,simDt=active?dt:0;
  if(active)elapsed+=dt;
  const moved=Math.hypot(e.player.x-lastPlayer.x,e.player.z-lastPlayer.z);
  if(running&&!completed)ball.update(simDt,t,e.player,moved>.001&&mode==='walk');
  if(mode!=='walk'){
   modeAge+=simDt;
   if(mode==='boat')boatUpdate(simDt,t);
   else if(mode==='tidepool'){/* 潮池觀察在 iframe 裡進行 */}
   else{if(mode==='tower'){if(anchors.lifeguard.ladder){towerT=T.MathUtils.clamp(towerT+simDt*towerDir,0,towerTotal());if(anchors.lifeguard.ladder.kind==='stairs'){stairPose(towerT);const dy=Math.atan2(Math.sin(climb.yaw-e.avatar.rotation.y),Math.cos(climb.yaw-e.avatar.rotation.y));e.avatar.rotation.set(0,e.avatar.rotation.y+dy*(simDt?1-Math.exp(-10*simDt):1),0);}else{climbPose(towerT);e.avatar.rotation.set(0,climb.yaw,0);}e.player.copy(climb.root);}else{const progress=T.MathUtils.smoothstep(modeAge,0,1.1);e.player.lerpVectors(climbStart,anchors.lifeguard.surface.point,progress);}}e.avatar.position.copy(e.player);if(mode==='rest'){const p=e.player;camGoal.set(p.x-3.3,p.y+2.6,p.z+4);camLook.set(p.x,p.y+.4,p.z);if(modeAge>1.2&&!state.lounger){state.lounger=true;e.sfx('pickup');}}else{camGoal.set(e.player.x-4,e.player.y+2.8,e.player.z+6);camLook.set(e.player.x,e.player.y+.8,e.player.z);const l=anchors.lifeguard.ladder;
    // On the ladder the camera watches from behind the climber's shoulder, then swings to the usual deck view.
    if(l){const ladderCam=new T.Vector3().copy(e.player).addScaledVector(l.normal,4.2).addScaledVector(l.right,1.9);ladderCam.y+=1.4;camGoal.lerp(ladderCam,1-climb.camera);camLook.y+=.4*(1-climb.camera);}
    const top=l?towerT>=towerTotal()-.01:modeAge>1.2;if(top&&!state.tower){state.tower=true;e.sfx('pickup');}
    if(l&&towerDir<0&&towerT<=0)leave(true);}}

   camera.position.lerp(camGoal,1-Math.exp(-3*dt));target.lerp(camLook,1-Math.exp(-3*dt));camera.lookAt(target);
  }else{camera.getWorldDirection(target);target.multiplyScalar(10).add(camera.position);}
  if(pickup&&mode==='walk')pickupSpeed=runPickup(simDt,t);
  updateCharacter(simDt);
  // Footprints at the real foot plants of the walk/run clip; distance-based for poses without a clip.
  if(active&&mode==='walk'&&simDt){const yaw=e.avatar.rotation.y;
   if(character.plants){for(const i of character.steps){const f=character.footWorld(i,screen);if(!f)continue;f.x+=Math.sin(yaw)*.06;f.z+=Math.cos(yaw)*.06;if(groundHeight(f.x,f.z)>.015){objects.footprint(f.x,f.z,yaw,t,true);state.footprints++;}}footDistance=0;}
   else{footDistance+=moved<1?moved:0;if(footDistance>.55&&groundHeight(e.player.x,e.player.z)>.015){objects.footprint(e.player.x,e.player.z,yaw,t);state.footprints++;footDistance=0;}}}if(e.first&&mode==='walk'){camera.getWorldDirection(screen);camera.position.copy(character.head());camera.lookAt(screen.add(camera.position));}if(!completed&&!e.first)followCamera.enforce(character.head());
  lastPlayer.copy(e.player);objects.update(t);
  destination.visible=mode==='boat';buoy.visible=mode==='boat';const dest=state.island&&state.opensea?dock:island;destination.position.set(dest.x,.6,dest.z);sampleWater(dest.x,dest.z,t,wave);destination.position.y=wave.height+.14;buoy.position.set(dest.x,wave.height+1.4,dest.z);
  near=active?nearTarget():null;const prompt=$('#target-prompt'),button=$('#interact');button.disabled=!near;button.firstChild.textContent=mode==='boat'?(near?.kind==='opensea'?'觀察 ':near?'下船 ':'划行中 '):mode==='tower'?'下塔 ':mode==='rest'?'起身 ':'互動 ';objects.halo.visible=!!near&&mode==='walk';prompt.hidden=!near;
  if(near){const p=near.position;screen.set(p.x,p.y??p.height??groundHeight(p.x,p.z),p.z);if(near.kind==='shell')screen.y=near.item.y;if(near.kind==='shell'&&screen.y<.04){sampleWater(screen.x,screen.z,t,wave);screen.y=Math.max(screen.y,wave.height);}objects.halo.position.set(screen.x,screen.y+.025,screen.z);screen.y+=1.2;screen.project(camera);const onScreen=screen.z<1&&screen.z>-1&&Math.abs(screen.x)<.95&&Math.abs(screen.y)<.95;prompt.hidden=!onScreen;prompt.style.left=`${(screen.x*.5+.5)*innerWidth}px`;prompt.style.top=`${(-screen.y*.5+.5)*innerHeight}px`;prompt.querySelector('span').textContent=near.label;}
  let goal=null,label='';if(mode==='boat'){goal=dest;label=state.island&&state.opensea?'岸邊圓環 · E 下船':'外海浮標 · 浮出水面時按 E 觀察';}else if(state.shells<8){let d=Infinity;for(const item of objects.items){const n=Math.hypot(item.x-e.player.x,item.z-e.player.z);if(!item.collected&&n<d){d=n;goal=item;}}label='下一枚貝殼';}else if(!state.ball){goal=objects.ball.position;label='沙灘球';}else if(!state.lounger){goal=anchors.umbrella.point;label='躺椅';}else if(!state.tower){goal=anchors.lifeguard.point;label='救生塔';}else if(!state.tidepool){goal=pool.point;label='潮池';}else if((!state.opensea||!state.boat)){goal=anchors.boat.point;label='岸上的小船';}
  if(goal){const dx=goal.x-e.player.x,dz=goal.z-e.player.z;$('#nav-text').textContent=`${label}　${Math.round(Math.hypot(dx,dz))} m`;e.input(input);$('#nav-arrow').style.transform=`rotate(${Math.atan2(dx,-dz)+(mode==='boat'?boatYaw:input.yaw)}rad)`;}$('#navigation').hidden=!goal||!active||mode==='rest'||mode==='tower'||mode==='tidepool';
  $('#game-audio').textContent=e.muted?'聲音 關':'聲音 開';$('#game-audio').setAttribute('aria-pressed',String(e.muted));$('#game-toast').classList.toggle('visible',active&&t<toastUntil);$('#game-fade').style.opacity=String(Math.max(0,1-(t-fadeAt)/.65)*.65);renderHud();
  if(active&&mode==='walk'&&state.shells===8&&state.ball&&state.lounger&&state.tower&&state.tidepool&&state.opensea&&state.boat)complete();
 }
 // Test actions use the real input/interaction/physics path; no quest-state setter.
 function contact(){
  const id=mode==='rest'?'umbrella':mode==='tower'?'lifeguard':mode==='boat'?'boat':null;if(!id)return null;
  const source=mode==='boat'?boatModel:propRoot.children.find(c=>c.name===id),surface=anchors[id].surface;
  const box=source?.children.length||source?.isMesh?new T.Box3().setFromObject(source):null;
  // Three rays a centimetre apart: a single one down a symmetric model's centre line can slip through the seam between
  // two triangles when the hull tilts.
  const hits=box?[-.01,0,.01].flatMap(d=>surfacesAt(source,e.player.x+d,e.player.z,box)):[];
  const nearest=hits.sort((a,b)=>Math.abs(a.point.y-e.player.y)-Math.abs(b.point.y-e.player.y))[0];
  const contactY=surface.kind==='sand'&&mode!=='boat'?groundHeight(e.player.x,e.player.z):nearest?.point.y;
  return {id,mode,real:mode==='boat'?!!nearest:surface.real,kind:surface.kind,player:e.player.toArray(),contactY,gap:contactY==null?null:e.player.y-contactY,inside:!box||(e.player.x>=box.min.x&&e.player.x<=box.max.x&&e.player.z>=box.min.z&&e.player.z<=box.max.z),feet:character.rig.foot.map(b=>b?.getWorldPosition(new T.Vector3()).toArray()),head:character.head().toArray(),box};
 }
 const api={update,interact,reset,contact,get character(){return character.info();},get cameraAudit(){return {minimum:MIN_BOOM,distance:followCamera.distance,minObserved:followCamera.minObserved};},surfaces(){return Object.fromEntries(anchorList.map(a=>[a.id,{kind:a.surface.kind,real:a.surface.real,yaw:a.surface.yaw,profile:a.surface.profile,lie:a.surface.lie,point:a.surface.point.toArray(),box:a.surface.box?.clone(),player:e.player.toArray()}]));},get state(){return {...state};},lagoon,overlay:lagoon,tidepool:{get found(){return lagoon.observed;}},opensea:{get spotted(){return sea.seen;}},sea,get suspended(){return lagoon.isOpen;},get mode(){return mode;},get completed(){return completed;},get elapsed(){return elapsed;}};
 // Clipping audit (auto only): skinned avatar vertices inside a nearby prop (closest point on the prop's BVH copy with
 // its face normal pointing away, and solid behind), and below the sand. Per target: vertex count, deepest point and the bone it follows.
 const auditCopies=new Map(),auditRay=new T.Raycaster();
 function penetration({every=3,near=4,slack=.01}={}){
  const targets=[...propRoot.children.filter(c=>c.children.length&&new T.Box3().setFromObject(c).distanceToPoint(e.player)<near).map(c=>({id:c.name,source:c})),...(vessel.visible&&boatModel?[{id:'game-boat',source:boatModel}]:[])];
  for(const t of targets){const key=t.source.uuid;let copy=auditCopies.get(key);if(!copy||t.id==='game-boat'){copy?.traverse(o=>{if(o.isMesh)o.geometry.dispose();});copy=probeCopy(t.source);auditCopies.set(key,copy);}t.copy=copy;t.box=new T.Box3().setFromObject(copy).expandByScalar(.05);t.n=0;t.max=0;t.worst=null;}
  const sand={id:'sand',n:0,max:0,worst:null},v=new T.Vector3(),hit={},tri=new T.Triangle(),nrm=new T.Vector3(),inv=new T.Matrix4(),local=new T.Vector3();
  character.root.updateMatrixWorld(true);oar.updateMatrixWorld(true);
  // The body, and the paddle while rowing (reported as bone 'paddle').
  for(const part of vessel.visible?[character.root,oar]:[character.root])part.traverse(m=>{if(!m.isMesh||!m.visible)return;const pos=m.geometry.attributes.position,skin=m.geometry.attributes.skinIndex,weight=m.geometry.attributes.skinWeight;
   for(let i=0;i<pos.count;i+=every){if(m.isSkinnedMesh)m.getVertexPosition(i,v);else v.fromBufferAttribute(pos,i);v.applyMatrix4(m.matrixWorld);
    const bone=()=>{if(part===oar)return 'paddle';if(!m.isSkinnedMesh)return m.name;let b=0;for(let k=1;k<4;k++)if(weight.getComponent(i,k)>weight.getComponent(i,b))b=k;return m.skeleton.bones[skin.getComponent(i,b)]?.name;};
    const g=groundHeight(v.x,v.z),ds=g-v.y;if(mode!=='boat'&&ds>.02){sand.n++;if(ds>sand.max){sand.max=ds;sand.worst={bone:bone(),at:v.toArray()};}}
    for(const t of targets){if(!t.box.containsPoint(v))continue;
     // The nearest face over all of the prop's meshes (a plank's underside in one mesh can be nearer than nothing,
     // while its top in another is nearer still).
     let near=null;for(const mesh of t.copy.children){inv.copy(mesh.matrixWorld).invert();local.copy(v).applyMatrix4(inv);if(!mesh.geometry.boundsTree.closestPointToPoint(local,hit,0,.25))continue;
      const world=hit.point.clone().applyMatrix4(mesh.matrixWorld),dist=world.distanceTo(v);if(!near||dist<near.dist)near={mesh,dist,world,face:hit.faceIndex};}
     if(!near)continue;{const mesh=near.mesh,idx=mesh.geometry.index,f=near.face*3,at=k=>idx?idx.getX(f+k):f+k,P=mesh.geometry.attributes.position;
      tri.set(new T.Vector3().fromBufferAttribute(P,at(0)),new T.Vector3().fromBufferAttribute(P,at(1)),new T.Vector3().fromBufferAttribute(P,at(2)));tri.getNormal(nrm);
      // Behind the nearest face, and the far side of a solid within 30 cm behind it, facing the other way (inside a
      // seat, a frame, a plank). A body inside an open shell (a single-skin hull) is behind its outer faces too, but
      // what lies behind is the opposite wall, facing out to its own side.
      const wn=nrm.clone().transformDirection(mesh.matrixWorld),d=-v.clone().sub(near.world).dot(wn);if(d<=slack)continue;
      auditRay.set(v,wn.clone().negate());auditRay.far=.3;const back=auditRay.intersectObject(t.copy,true)[0];if(!back?.face||back.face.normal.clone().transformDirection(back.object.matrixWorld).dot(wn)>-.3)continue;
      t.n++;if(d>t.max){t.max=d;t.worst={bone:bone(),at:v.toArray(),surface:near.world.toArray().map(x=>+x.toFixed(3)),normal:wn.toArray().map(x=>+x.toFixed(2))};}}}
   }});
  return [...targets,sand].map(t=>({id:t.id,n:t.n,max:+t.max.toFixed(3),worst:t.worst}));
 }
 if(auto){Object.assign(api,{penetration,boatInfo(){const b=new T.Box3().setFromObject(boatModel,true);return {draft:boat.draft,mask:boat.mask?boat.mask.geometry.attributes.position.count:0,keelBelowWater:+(vessel.position.y-b.min.y).toFixed(3),gunwaleAboveWater:+(b.max.y-vessel.position.y).toFixed(3)};},ladder(){return anchors.lifeguard.ladder;},climbState(){return {towerT,towerDir,root:climb.root.toArray(),hands:climb.hands.map(h=>h.toArray()),player:e.player.toArray(),total:towerTotal()};},handWorld(i){return character.rig.hand[i].getWorldPosition(new T.Vector3());},teleport(x,z){if(mode!=='walk')throw Error('Teleport is only available on foot');e.player.set(x,groundHeight(x,z),z);lastPlayer.copy(e.player);},targets(){return {shells:objects.items.map(s=>({x:s.x,y:s.y,z:s.z,collected:s.collected})),ball:objects.ball.position.toArray(),umbrella:anchors.umbrella.point.toArray(),tidepool:pool.point.toArray(),lagoon:pool.point.toArray(),lifeguard:anchors.lifeguard.point.toArray(),boat:anchors.boat.point.toArray(),dock,island};},step(seconds){let remaining=seconds;while(remaining>1e-6){const dt=Math.min(1/60,remaining);window.__TIME__=time()+dt;water.material.uniforms.time.value=window.__TIME__;e.update(dt);update(dt,window.__TIME__);remaining-=dt;}},steer(angle){if(mode!=='boat')throw Error('Not in boat');boatYaw=angle;},view(yaw){e.setView(yaw);},wave(x,z,t){return {...sampleWater(x,z,t,{})};}});Object.defineProperty(api,'vessel',{get(){return {x:vessel.position.x,y:vessel.position.y,z:vessel.position.z,yaw:boatYaw,speed:boatSpeed};}});window.__GAME__=api;}
 update(0,time());return api;
}
