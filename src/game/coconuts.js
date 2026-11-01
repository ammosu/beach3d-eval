// Coconuts under the two palm slots: loose rigid bodies in the physics world (src/game/world.js) that can be picked
// up, carried, dropped and thrown (src/game/index.js). One procedural model and fixed seeded spots shared by every
// group (like the ball), settled on the sand at load. Each floats where the swash reaches (the water mesh runs on
// over the dry beach, so the swash test comes first) and rides the swell.
import * as T from 'three';
import {groundHeight,shore} from '../terrain.js';
import {sampleWater,swashReach} from '../water.js';

// Palm slots from assets/props.json (palm_tall, palm_pair): x, z, how many.
const SPOTS=[[-4,-2,3],[10,-5,3]];
const RX=.11,RY=.135,RZ=.11;

function coconutGeometry(){
 const g=new T.SphereGeometry(1,22,16),p=g.attributes.position,c=[],v=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);
  // Three soft ridges along the long axis and a blunt point at one end, then the husk's fibrous streaks.
  const a=Math.atan2(v.z,v.x),ridge=1+.07*Math.cos(3*a)*(1-Math.abs(v.y)),tip=v.y>0?1+.12*v.y*v.y:1;
  p.setXYZ(i,v.x*RX*ridge,v.y*RY*tip,v.z*RZ*ridge);
  const streak=.82+.18*Math.sin(a*23+Math.sin(v.y*9)*1.7)*Math.sin(a*7.3+v.y*3),eye=v.y<-.82?.45:1;
  c.push(.36*streak*eye,.24*streak*eye,.13*streak*eye);}
 g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();return g;
}

function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

export function createCoconuts(w,scene){
 const {R}=w,geometry=coconutGeometry(),material=new T.MeshStandardMaterial({vertexColors:true,roughness:.85});
 const hull=new Float32Array(geometry.attributes.position.array);
 const random=rng(11),items=[],wave={};
 for(const [cx,cz,n] of SPOTS)for(let k=0;k<n;k++){
  const a=random()*Math.PI*2,r=1+.7*random(),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,q=new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2,random()*6.28,random()*.6));
  const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.name='coconut';scene.add(mesh);
  const body=w.world.createRigidBody(R.RigidBodyDesc.dynamic().setLinearDamping(.05).setAngularDamping(.6).setCcdEnabled(true));
  // About 1.2 kg; a husk is grippy and does not roll far on sand.
  const collider=w.world.createCollider(R.ColliderDesc.convexHull(hull).setDensity(180).setFriction(.95).setRestitution(.25),body);
  const item={i:items.length,mesh,body,collider,home:{x,z,q},state:'free',target:new T.Vector3(),freeAt:0,x,y:0,z,coconut:true,reach:.08};
  items.push(item);
  w.add(body,(dt,t)=>{
   if(item.state==='held'){body.setNextKinematicTranslation(item.target);return;}
   if(item.state==='thrown'&&(item.freeAt-=dt)<=0){item.state='free';collider.setCollisionGroups(0xffffffff);}
   // Floating: lift by how much of it is under the drawn water, damped; only where the water reaches.
   const p=body.translation();if(p.z-shore(p.x)<swashReach(p.x,t)){sampleWater(p.x,p.z,t,wave);const under=T.MathUtils.clamp((wave.height-(p.y-RY))/(2*RY),0,1);
    if(under>0){const v=body.linvel(),k=Math.exp(-2.5*dt*under);body.setLinvel({x:v.x*k,y:(v.y+under*1.9*9.81*dt)*k,z:v.z*k},true);}}
  });
 }
 function place(item){const {x,z,q}=item.home;item.body.setBodyType(R.RigidBodyType.Dynamic,true);item.body.recomputeMassPropertiesFromColliders();item.body.setTranslation({x,y:groundHeight(x,z)+.3,z},true);item.body.setRotation(q,true);item.body.setLinvel({x:0,y:0,z:0},true);item.body.setAngvel({x:0,y:0,z:0},true);item.state='free';item.collider.setCollisionGroups(0xffffffff);}
 function reset(){for(const item of items)place(item);w.settle(90);sync();}
 function sync(){for(const item of items){const p=item.body.translation(),q=item.body.rotation();item.mesh.position.set(p.x,p.y,p.z);item.mesh.quaternion.set(q.x,q.y,q.z,q.w);item.x=p.x;item.y=p.y;item.z=p.z;}}
 // In the hand: kinematic, following the target set each frame (the palm).
 function hold(item){item.state='held';item.body.setBodyType(R.RigidBodyType.KinematicPositionBased,true);const p=item.body.translation();item.target.set(p.x,p.y,p.z);}
 // Out of the hand with a velocity; for 0.4 s it passes through the walker (bit 0 of the groups) so it is not
 // knocked about by the thrower's own body.
 function release(item,v,spin){item.body.setBodyType(R.RigidBodyType.Dynamic,true);item.body.recomputeMassPropertiesFromColliders();item.body.setLinvel(v,true);item.body.setAngvel(spin,true);item.state='thrown';item.freeAt=.4;item.collider.setCollisionGroups(0x0002fffe);}
 function nearest(player,max=1.4){let best=null,d=max;for(const item of items){if(item.state==='held')continue;const n=Math.hypot(item.x-player.x,item.z-player.z);if(n<d&&Math.abs(item.y-player.y)<1.2){d=n;best=item;}}return best;}
 reset();
 return {items,reset,sync,hold,release,nearest,radius:RY,info(){return items.map(i=>({state:i.state,pos:[+i.x.toFixed(2),+i.y.toFixed(2),+i.z.toFixed(2)]}));}};
}
