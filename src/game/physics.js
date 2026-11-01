import {groundHeight,shore} from '../terrain.js';
import {sampleWater} from '../water.js';

// The beach ball as a Rapier rigid body (src/game/world.js): it rolls and bounces on the sand heightfield and off the
// props' real triangles, is pushed by the walker's capsule, and floats like before (a spring to 65% of its radius
// above the wave, damped, no gravity) where the sand is under 0.32 m of water. Same interface as the old
// hand-written ball: update / kick / reset / place / velocity.
const SAND=.7,REST=.25;
export function createBall(w,mesh,onSea,onSplash){
 const {R}=w,radius=.48,wave={};let wasWet=false;
 const body=w.world.createRigidBody(R.RigidBodyDesc.dynamic().setLinearDamping(.12).setAngularDamping(.6).setCcdEnabled(true).setCanSleep(true));
 // A beach ball: light (about 0.6 kg) and springy.
 const collider=w.world.createCollider(R.ColliderDesc.ball(radius).setDensity(1.3).setRestitution(.55).setFriction(.8),body);
 // In real contact with the sand or a prop (not the walker).
 function touching(){let hit=false;w.world.contactPairsWith(collider,o=>{if(hit||o.handle===w.walkerCollider.handle)return;w.world.contactPair(collider,o,m=>{if(m.numContacts()>0)hit=true;});});return hit;}
 const velocity={x:0,y:0,z:0};
 w.add(body,(dt,t)=>{
  const p=body.translation(),v=body.linvel();const wet=groundHeight(p.x,p.z)<-.32;
  if(wet){sampleWater(p.x,p.z,t,wave);const target=wave.height+radius*.65;let vy=v.y+(target-p.y)*18*dt;vy*=Math.exp(-5*dt);const drag=Math.exp(-1.1*dt);
   body.setGravityScale(0,false);body.setLinvel({x:v.x*drag,y:vy,z:v.z*drag},true);if(!wasWet)onSplash();if(groundHeight(p.x,p.z)<-.65)onSea();}
  else{
   // Sand: a rolling ball slows at a steady rate (Rapier has no rolling resistance), and a slow ball touching
   // anything comes to rest and stays (static friction of a ball pressed into sand; gravity off while it rests),
   // or it would creep down the steeper dunes. A push or a kick (over REST m/s) sets it going again.
   const s=Math.hypot(v.x,v.z),onSomething=touching();
   if(onSomething&&s<REST&&Math.abs(v.y)<.5){body.setGravityScale(0,false);body.setLinvel({x:0,y:0,z:0},true);body.setAngvel({x:0,y:0,z:0},true);}
   else{body.setGravityScale(1,false);
    if(onSomething){const dec=SAND*dt,k=Math.max(0,s-dec)/s,a=body.angvel();body.setLinvel({x:v.x*k,y:v.y,z:v.z*k},true);body.setAngvel({x:a.x*k,y:a.y*k,z:a.z*k},true);}}}
  wasWet=wet;
  // Keep it on this stretch of beach and sea.
  const x=Math.max(-40,Math.min(40,p.x)),z=Math.min(26,Math.max(shore(p.x)-35,p.z));if(x!==p.x||z!==p.z)body.setTranslation({x,y:p.y,z},true);
 });
 function sync(){const p=body.translation(),q=body.rotation(),v=body.linvel();mesh.position.set(p.x,p.y,p.z);mesh.quaternion.set(q.x,q.y,q.z,q.w);velocity.x=v.x;velocity.y=v.y;velocity.z=v.z;}
 function place(x,z){body.setTranslation({x,y:groundHeight(x,z)+radius,z},true);body.setLinvel({x:0,y:0,z:0},true);body.setAngvel({x:0,y:0,z:0},true);body.setRotation({x:0,y:0,z:0,w:1},true);body.setGravityScale(1,true);wasWet=false;sync();}
 function reset(){place(-4,-8);}
 // power 0 is a light touch along the sand (3.5 m/s), 1 a long lofted shot (14 m/s, 4.2 up); the old fixed kick was 11 / 3.1.
 function kick(player,dir,power=1){const p=body.translation();let x=dir?dir[0]:p.x-player.x,z=dir?dir[1]:p.z-player.z,n=Math.hypot(x,z);if(n<.1){x=0;z=-1;n=1;}const s=3.5+10.5*power;
  body.setLinvel({x:x/n*s,y:1+3.2*power*power,z:z/n*s},true);
  // Topspin-free: a little backspin from the foot under the ball's middle.
  body.setAngvel({x:-z/n*s/radius*.3,y:0,z:x/n*s/radius*.3},true);}
 // The world steps in index.js; the ball only copies its pose out.
 function update(){sync();}
 reset();return {update,kick,reset,place,velocity,body};
}
