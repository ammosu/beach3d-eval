// Rigid-body world for loose things on the beach (the ball now; coconuts and carried items later), shared by every
// group. Rapier's deterministic build stepped at a fixed 1/60 s from the game's simDt (the water clock), so a frozen
// clock freezes it and __GAME__.step() advances it the same way every run.
//  - Sand and islands: one heightfield sampled from landHeight() every CELL m.
//  - Props: their real triangles baked to world space (rebuilt when the group changes; a hidden prop, such as the
//    beached boat once launched, is switched off).
//  - Tide-pool rocks: the same, once.
//  - The walker: a kinematic capsule that follows the player on foot, so walking into things pushes them.
import * as T from 'three';
import {landHeight} from '../coast.js';

let R=null;
export async function loadRapier(){
 if(!R){R=(await import('@dimforge/rapier3d-deterministic-compat')).default;await R.init();}
 return R;
}

export const STEP=1/60;
const X0=-46,X1=106,Z0=-66,Z1=30,CELL=.25;

export function createWorld(R,{propRoot,pool}){
 const world=new R.World({x:0,y:-9.81,z:0});world.timestep=STEP;
 // Heightfield: columns along x, rows along z, heights column-major, centred on the collider.
 const nc=Math.round((X1-X0)/CELL),nr=Math.round((Z1-Z0)/CELL),heights=new Float32Array((nr+1)*(nc+1));
 for(let c=0;c<=nc;c++)for(let r=0;r<=nr;r++)heights[c*(nr+1)+r]=landHeight(X0+c*CELL,Z0+r*CELL);
 const ground=world.createCollider(R.ColliderDesc.heightfield(nr,nc,heights,{x:X1-X0,y:1,z:Z1-Z0},R.HeightFieldFlags.FIX_INTERNAL_EDGES).setTranslation((X0+X1)/2,0,(Z0+Z1)/2).setFriction(.9).setRestitution(.3));

 const v=new T.Vector3(),m=new T.Matrix4();
 // World-space triangles of everything visible under root (instanced meshes per instance).
 function bake(root,skip){
  root.updateMatrixWorld(true);const pos=[],idx=[];
  root.traverse(o=>{if(!o.isMesh||skip?.(o))return;const g=o.geometry,p=g.attributes.position;if(!p)return;
   const count=o.isInstancedMesh?o.count:1;
   for(let k=0;k<count;k++){if(o.isInstancedMesh){o.getMatrixAt(k,m);m.premultiply(o.matrixWorld);}else m.copy(o.matrixWorld);
    const base=pos.length/3;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);}
    if(g.index)for(let i=0;i<g.index.count;i++)idx.push(base+g.index.getX(i));else for(let i=0;i<p.count;i++)idx.push(base+i);}});
  return idx.length>=3?{pos:new Float32Array(pos),idx:new Uint32Array(idx)}:null;
 }
 function staticMesh(data){return data&&world.createCollider(R.ColliderDesc.trimesh(data.pos,data.idx,R.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(.6).setRestitution(.35));}

 let props=[];
 function rebuildProps(){
  for(const p of props)world.removeCollider(p.collider,false);props=[];
  for(const marker of propRoot.children){const collider=staticMesh(bake(marker));if(collider)props.push({marker,collider});}
 }
 // The pool's level water sheet is not solid; its rocks are.
 if(pool?.root)staticMesh(bake(pool.root,o=>o.material?.transparent||/water/i.test(o.name)));
 rebuildProps();

 const walker=world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0,-50,0));
 const walkerCollider=world.createCollider(R.ColliderDesc.capsule(.55,.3).setFriction(.4),walker);

 const bodies=[];let acc=0;
 // Each dynamic thing registers a callback run before every fixed step (buoyancy, clamps).
 function add(body,before){const item={body,before};bodies.push(item);return item;}
 function remove(item){const i=bodies.indexOf(item);if(i>=0)bodies.splice(i,1);world.removeRigidBody(item.body);}
 // player: feet position or null (off foot: boat, dive, tower). Returns the number of fixed steps taken.
 function update(dt,t,player){
  acc+=dt;let n=0;
  while(acc>=STEP-1e-9){acc-=STEP;n++;
   for(const p of props){const on=visible(p.marker);if(p.collider.isEnabled()!==on)p.collider.setEnabled(on);}
   if(player){walkerCollider.setEnabled(true);walker.setNextKinematicTranslation({x:player.x,y:player.y+.85,z:player.z});}
   else walkerCollider.setEnabled(false);
   const tt=t-acc;for(const b of bodies)b.before?.(STEP,tt);
   world.step();}
  return n;
 }
 function visible(o){for(;o;o=o.parent)if(!o.visible)return false;return true;}
 // Settle the walker at once (a teleport) so the next step does not sweep it through everything in between.
 function placeWalker(player){walker.setTranslation({x:player.x,y:player.y+.85,z:player.z},true);}
 function reset(){acc=0;}
 return {R,world,ground,add,remove,update,rebuildProps,placeWalker,reset,walkerCollider,get props(){return props.length;}};
}
