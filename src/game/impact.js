// Impact feedback for a hit (the kick so far): a hit-stop slows play for a moment and the camera shakes. Both are pure
// functions of the time since the hit on the water clock, so offline recordings stay deterministic. The hit-stop scales
// only the on-foot game time (body, ball); the water, the sea and the camera carry on. The shake only rotates the camera,
// after its position is settled and before the render; the camera re-aims every frame, so nothing accumulates and it can
// not push the camera into a prop. Off with ?impact=0 (for comparison); prefers-reduced-motion drops the shake only.
import * as T from 'three';
const FROZEN=.03,EASE=.05,SHAKE=.38,PITCH=.016,YAW=.01,ROLL=.012;
export function createImpact(){
 const on=new URLSearchParams(location.search).get('impact')!=='0',calm=matchMedia('(prefers-reduced-motion: reduce)');
 let at=-100,hold=0,trauma=0;
 const euler=new T.Euler(0,0,0,'YXZ'),turn=new T.Quaternion();
 return {
  // power 0 (a tap) to 1 (a full shot): stop 20 to 120 ms; trauma squared, so a tap barely moves the camera.
  hit(t,power){if(!on)return;at=t;hold=.02+.1*power;trauma=.3+.7*power;},
  rate(t){const age=t-at;return age<0||age>=hold+EASE?1:age<hold?FROZEN:FROZEN+(1-FROZEN)*T.MathUtils.smoothstep(age,hold,hold+EASE);},
  // The physics world takes no time at all while held: at a tiny rate its accumulator could still tip over one step (23 cm of a full shot).
  holding(t){const age=t-at;return age>=0&&age<hold;},
  shake(camera,t){const age=t-at;if(age<0||age>=SHAKE||calm.matches)return;const k=(trauma*(1-age/SHAKE))**2;
   euler.set(PITCH*k*Math.sin(age*43),YAW*k*Math.sin(age*31+1.7),ROLL*k*Math.sin(age*23+.6));camera.quaternion.multiply(turn.setFromEuler(euler));},
  get info(){return {at,hold,trauma};}
 };
}
