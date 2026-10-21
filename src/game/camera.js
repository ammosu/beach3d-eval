import * as T from 'three';
import {MeshBVH,acceleratedRaycast} from 'three-mesh-bvh';
import {landHeight} from '../coast.js';
export const MIN_BOOM=1.6;
// A five-ray swept near-plane, against only source prop meshes. Broad-phase
// boxes reject distant props but never decide a collision on their own.
export function createGameCamera(camera,propRoot){
 const ray=new T.Raycaster(),direction=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3(),origin=new T.Vector3(),hitPoint=new T.Vector3(),goal=new T.Vector3(),head=new T.Vector3(),delta=new T.Vector3();
 const geometryCache=new WeakMap();ray.firstHitOnly=true;
 const collisionMaterial=new T.MeshBasicMaterial({side:T.DoubleSide});
 let entries=[],boom=6.2,minObserved=Infinity,lastDistance=6.2;const lead=new T.Vector3(),leadGoal=new T.Vector3(),last=new T.Vector3(NaN,0,0);
 function refresh(){propRoot.updateMatrixWorld(true);entries=propRoot.children.filter(o=>o.children.length).map(source=>{const root=new T.Group();source.traverse(o=>{if(o.isMesh){let geometry=geometryCache.get(o.geometry);if(!geometry){geometry=o.geometry.clone();geometry.clearGroups();geometry.boundsTree=new MeshBVH(geometry);geometryCache.set(o.geometry,geometry);}const mesh=new T.Mesh(geometry,collisionMaterial);mesh.raycast=acceleratedRaycast;mesh.matrixAutoUpdate=false;mesh.matrix.copy(o.matrixWorld);root.add(mesh);}});root.updateMatrixWorld(true);return {source,root,box:new T.Box3().setFromObject(source)};});}
 function clearance(start,dir,length){let distance=length;right.crossVectors(dir,new T.Vector3(0,1,0)).normalize();up.crossVectors(right,dir).normalize();
  for(const [x,y] of [[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]]){origin.copy(start).addScaledVector(right,x).addScaledVector(up,y);ray.set(origin,dir);ray.far=distance+.2;
   for(const e of entries){if(!e.source.visible||!ray.ray.intersectBox(e.box,hitPoint)||origin.distanceTo(hitPoint)>distance+.2)continue;const hits=ray.intersectObject(e.root,true);if(hits.length)distance=Math.min(distance,Math.max(0,hits[0].distance-.22));}
  }
  for(let d=.3;d<distance;d+=.3){hitPoint.copy(start).addScaledVector(dir,d);if(hitPoint.y<landHeight(hitPoint.x,hitPoint.z)+.35){distance=d;break;}}
  return distance;
 }
 function update(dt,player,yaw,pitch){
  // Look-ahead: the orbit centre leads the walker in the direction of travel (about 0.35 m walking, 0.9 m running),
  // eased over about 0.3 s so it does not whip. A jump of over 3 m in one frame (a teleport, a cut between modes) is
  // a hard cut: no lead, and the camera goes straight to its spot instead of sliding across the beach.
  const cut=last.x===last.x&&player.distanceTo(last)>3;
  if(dt>0){if(cut||last.x!==last.x)leadGoal.set(0,0,0);else{leadGoal.set(player.x-last.x,0,player.z-last.z).divideScalar(dt);const speed=leadGoal.length();if(speed>.2)leadGoal.multiplyScalar(Math.min(.9,speed*.2)/speed);else leadGoal.set(0,0,0);}
   if(cut)lead.set(0,0,0);else lead.lerp(leadGoal,1-Math.exp(-dt/.3));last.copy(player);}
  head.copy(player).add(lead).y+=1.6;direction.set(Math.sin(yaw)*Math.cos(pitch),.073+Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).normalize();let desired=clearance(head,direction,6.2);
  if(desired<MIN_BOOM){
   // Lift the boom over the head rather than collapsing into it. Probe several
   // elevations so a chair back/rail does not trap the camera inside the body.
   for(const elevation of [.6,.9,1.2,1.48]){direction.set(Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation));desired=clearance(head,direction,6.2);if(desired>=MIN_BOOM+.15)break;}
  }
  desired=Math.max(MIN_BOOM,desired);boom=T.MathUtils.damp(boom,desired,desired<boom?24:3.2,dt);boom=Math.max(MIN_BOOM,Math.min(boom,desired));goal.copy(head).addScaledVector(direction,boom);
  if(cut){boom=desired;goal.copy(head).addScaledVector(direction,boom);camera.position.copy(goal);}else camera.position.lerp(goal,1-Math.exp(-12*dt));
  // Recheck the interpolated orbit: a smoothed endpoint can otherwise cut
  // through a wall while turning, even when the new boom itself is clear.
  delta.subVectors(camera.position,head);const length=delta.length();delta.normalize();const safe=clearance(head,delta,length);
  if(safe<length-.01){if(safe>=MIN_BOOM)camera.position.copy(head).addScaledVector(delta,safe);else camera.position.copy(goal);}
  enforce(head);camera.lookAt(head);return lastDistance;
 }
 function enforce(point){delta.subVectors(camera.position,point);if(delta.length()<MIN_BOOM){if(delta.length()<.01)delta.set(0,1,.15);delta.setLength(MIN_BOOM);camera.position.copy(point).add(delta);}camera.position.y=Math.max(camera.position.y,landHeight(camera.position.x,camera.position.z)+.3);lastDistance=camera.position.distanceTo(point);minObserved=Math.min(minObserved,lastDistance);return lastDistance;}
 refresh();return {refresh,update,enforce,get distance(){return lastDistance;},get minObserved(){return minObserved;},resetAudit(){minObserved=Infinity;},get boom(){return boom;}};
}
