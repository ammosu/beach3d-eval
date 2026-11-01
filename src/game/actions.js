// One runner for the game's on-foot interactions (since 2026-11-02): an action is a definition object, the runner
// does what every one of them used to repeat (walk to a spot and turn, hold to charge with auto-fire at full, events
// fired once at their age, the per-frame step, the end and handing movement back). Definitions live in
// src/game/moves.js; a new interaction is a new definition, not new runner code.
//
// A definition: {
//   setup(act,args)          fill the action's own fields (spot, target, …) when it starts
//   approach?: {face(act), within, avoid?(act,dir,toSpot), walkYaw?(act,dir)}
//                            walk to act.spot at WALK m/s, then turn to face(act) until within rad
//   charge?: true            E held charges over CHARGE.time s (water clock); fires at the spot once released, or
//                            by itself CHARGE.full s after full; act.power = act.charge at the start
//   tick?(act,dt)            each frame before it starts (aim, facing)
//   begin?(act,t)            the moment it starts (age 0)
//   events?: [[age|fn(act), fn(act,t)], …]   fired once when age reaches it
//   step?(act,dt,t)          each frame after it started (after the events)
//   duration(act)            age at which it ends; end?(act,t) then
//   pose(act)                IK for character.update (null: the walk pose)
// }
// act.age is -1 while approaching or charging, then the time since the start; everything after that is a function
// of the age, so recordings stay deterministic.
import * as T from 'three';

export const smooth=T.MathUtils.smoothstep;
export const ramp=(t0,t1)=>a=>smooth(a,t0,t1);
export const pulse=(t0,t1,t2,t3)=>a=>smooth(a,t0,t1)*(1-smooth(a,t2,t3));
export const bump=(t,w)=>a=>Math.exp(-(((a-t)/w)**2));
export const CHARGE={time:1,full:.4,tap:.18};
export const WALK=1.4;

export function createActions({e,groundHeight,onChange}){
 let act=null;
 function start(def,args={},hold=false){
  act={def,age:-1,held:hold,charged:hold,charge:hold?0:1,heldFull:0,hold:0,atSpot:false,fired:0};
  def.setup?.(act,args);e.setHold(true);onChange(act);return act;
 }
 function release(){if(act&&act.age<0)act.held=false;}
 function cancel(){if(!act)return;act=null;e.setHold(false);onChange(null);}
 const at=(ev,a)=>typeof ev[0]==='function'?ev[0](a):ev[0];
 function run(dt,t){
  const a=act,d=a.def;
  if(a.age<0){
   if(d.charge){a.hold+=dt;if(a.held){a.charge=Math.min(1,a.charge+dt/CHARGE.time);if(a.charge>=1&&(a.heldFull+=dt)>=CHARGE.full)a.held=false;}}
   d.tick?.(a,dt);
   let speed=0,ready=!d.approach;
   if(d.approach){const ap=d.approach,spot=a.spot,toSpot=Math.hypot(spot.x-e.player.x,spot.z-e.player.z),step=Math.min(toSpot,WALK*dt);a.atSpot=toSpot<=.01;
    if(toSpot>.01){const dir=[(spot.x-e.player.x)/toSpot,(spot.z-e.player.z)/toSpot];ap.avoid?.(a,dir,toSpot);const yaw=ap.walkYaw?ap.walkYaw(a,dir):Math.atan2(dir[0],dir[1]);
     e.player.x+=dir[0]*step;e.player.z+=dir[1]*step;e.player.y=groundHeight(e.player.x,e.player.z);speed=step/Math.max(dt,1e-6);e.avatar.rotation.y=yaw;}
    else{const want=ap.face(a),turn=Math.atan2(Math.sin(want-e.avatar.rotation.y),Math.cos(want-e.avatar.rotation.y));e.avatar.rotation.y+=turn*(1-Math.exp(-14*dt));ready=Math.abs(turn)<ap.within;}
    e.avatar.position.copy(e.player);}
   if(ready&&!(d.charge&&a.held)){a.age=0;a.atSpot=false;if(d.charge)a.power=a.charge;d.begin?.(a,t);}
   return speed;
  }
  a.age+=dt;
  const events=d.events??[];while(a.fired<events.length&&a.age>=at(events[a.fired],a)){events[a.fired][1](a,t);a.fired++;}
  d.step?.(a,dt,t);
  if(a.age>=d.duration(a)){d.end?.(a,t);if(act===a){act=null;e.setHold(false);onChange(null);}}
  return 0;
 }
 return {start,release,cancel,run,get current(){return act;}};
}
