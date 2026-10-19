import {groundHeight,shore} from '../terrain.js';
import {sampleWater} from '../water.js';

export function createBall(mesh,colliders,onSea,onSplash){
 const velocity={x:0,y:0,z:0},wave={},radius=.48;let wasWet=false;
 function reset(){mesh.position.set(-4,groundHeight(-4,-8)+radius,-8);velocity.x=velocity.y=velocity.z=0;wasWet=false;mesh.rotation.set(0,0,0);}
 function kick(player){let x=mesh.position.x-player.x,z=mesh.position.z-player.z,n=Math.hypot(x,z);if(n<.1){x=0;z=-1;n=1;}velocity.x=x/n*11;velocity.z=z/n*11;velocity.y=3.1;}
 function step(dt,t,player,moving){
  const p=mesh.position;sampleWater(p.x,p.z,t,wave);const wet=groundHeight(p.x,p.z)<-.32;
  if(wet){const target=wave.height+radius*.65;velocity.y+=(target-p.y)*18*dt;velocity.y*=Math.exp(-5*dt);velocity.x*=Math.exp(-1.1*dt);velocity.z*=Math.exp(-1.1*dt);if(!wasWet)onSplash();if(groundHeight(p.x,p.z)<-.65)onSea();}else velocity.y-=9.8*dt;
  wasWet=wet;p.x+=velocity.x*dt;p.z+=velocity.z*dt;p.y+=velocity.y*dt;
  const floor=groundHeight(p.x,p.z)+radius;if(p.y<floor){p.y=floor;velocity.y=Math.abs(velocity.y)>.4?-velocity.y*.48:0;const drag=Math.exp(-1.25*dt);velocity.x*=drag;velocity.z*=drag;}
  for(const c of colliders()){const b=c.box;if(p.y-radius>b.max.y||p.y+radius<b.min.y)continue;const x=Math.max(b.min.x,Math.min(b.max.x,p.x)),z=Math.max(b.min.z,Math.min(b.max.z,p.z));let dx=p.x-x,dz=p.z-z,d=Math.hypot(dx,dz);if(d<radius){if(d<.001){dx=0;dz=1;d=1;p.z=b.max.z+radius;}else{p.x+=dx/d*(radius-d);p.z+=dz/d*(radius-d);}const dot=velocity.x*dx/d+velocity.z*dz/d;if(dot<0){velocity.x-=1.6*dot*dx/d;velocity.z-=1.6*dot*dz/d;}}}
  const dx=p.x-player.x,dz=p.z-player.z,d=Math.hypot(dx,dz);if(d<.82&&d>.01&&Math.abs(p.y-player.y)<1.5){p.x+=dx/d*(.82-d);p.z+=dz/d*(.82-d);const impact=velocity.x*dx/d+velocity.z*dz/d;if(impact<0){velocity.x-=1.5*impact*dx/d;velocity.z-=1.5*impact*dz/d;}if(moving){velocity.x+=dx/d*16*dt;velocity.z+=dz/d*16*dt;}}
  p.x=Math.max(-40,Math.min(40,p.x));p.z=Math.min(26,Math.max(shore(p.x)-35,p.z));mesh.rotation.x+=velocity.z*dt/radius;mesh.rotation.z-=velocity.x*dt/radius;
 }
 function update(dt,t,player,moving){const steps=Math.max(1,Math.ceil(dt/(1/60))),h=dt/steps;for(let i=0;i<steps;i++)step(h,t-dt+h*(i+1),player,moving);}
 reset();return {update,kick,reset,velocity};
}
