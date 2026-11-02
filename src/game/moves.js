// The on-foot interactions as definitions for the runner in src/game/actions.js (since 2026-11-02; the code and
// numbers moved here unchanged from src/game/index.js). Each is a function of its age once it starts.
//  PICKUP  shells and coconuts: walk up, turn, squat and reach; the grab event takes it.
//  KICK    the ball: charge and aim, walk round to the spot, a stride and a swing from the hip (see below).
//  TOSS    the carried coconut: a tap sets it down, a hold charges an overhand throw along the camera.
//  SCOOP   a handful of sand on open beach (E with nothing near): a definition only, nothing new in the runner.
// ctx: {e, character, objects, coconuts, camera, groundHeight, kickBall(power,dir,t,contact), gotShell(item,t),
//       carry: {get(), set(v)}}
import * as T from 'three';
import {smooth as s,pulse,ramp,CHARGE} from './actions.js';

export function createMoves(ctx){
 const {e,objects,coconuts,camera,groundHeight}=ctx;
 // The character is swapped when the group changes: always read it through ctx.

 // Picking up a shell or a coconut: walk up to it, turn to face it, squat and reach; a shell counts the moment the
 // hand closes on it, rides in the hand while standing up, then sparkles away; a coconut stays in the hand.
 const reachPoint=new T.Vector3(),heldPoint=new T.Vector3(),chestPoint=new T.Vector3(),facing=new T.Vector3();
 const PICKUP={name:'pickup',
  setup(p,{item}){const dx=e.player.x-item.x,dz=e.player.z-item.z,d=Math.hypot(dx,dz)||1,stand=Math.min(d,.72);
   Object.assign(p,{item,spot:new T.Vector3(item.x+dx/d*stand,0,item.z+dz/d*stand),grabbed:false,hand:0});},
  // Approach at a stroll; then turn in place toward the item.
  approach:{within:.12,face:p=>Math.atan2(p.item.x-e.player.x,p.item.z-e.player.z),walkYaw:p=>Math.atan2(p.spot.x-e.avatar.position.x,p.spot.z-e.avatar.position.z)},
  begin(p){ctx.character.trigger('interact');
   // The hand on the item's side reaches; the item sits straight ahead, so default to the right hand.
   const item=p.item,right=Math.cos(e.avatar.rotation.y)*(item.x-e.player.x)-Math.sin(e.avatar.rotation.y)*(item.z-e.player.z);p.hand=ctx.character.side.findIndex(v=>Math.sign(v)===(Math.sign(right)||-1));if(p.hand<0)p.hand=0;},
  events:[[.42,(p,t)=>{p.grabbed=true;if(p.item.coconut){coconuts.hold(p.item);ctx.carry.set({item:p.item,hand:p.hand});e.sfx('pickup');}else{p.item.collected=true;ctx.gotShell(p.item,t);}}]],
  step(p){if(p.grabbed&&p.age<.85&&!p.item.coconut)p.item.held=ctx.character.palm(p.hand,heldPoint);},
  duration:()=>.85,
  end(p,t){const item=p.item;if(item.held){objects.burst(item.held.x,item.held.y,item.held.z,t);item.held=null;item.born=-100;}},
  // Squat (pelvis down, feet planted), bend over, reach and close the hand, look at the item.
  pose(p){if(p.age<0)return null;
   const a=Math.max(0,p.age),down=s(a,0,.3)*(1-s(a,.55,.9)),item=p.item,hands=[null,null],weight=[0,0],curl=[0,0];
   // Reach for the near rim of the (oversized, easy-to-spot) shell.
   const toward=Math.hypot(e.player.x-item.x,e.player.z-item.z)||1,rim=item.reach??.18;reachPoint.set(item.x+(e.player.x-item.x)/toward*rim,item.y+(item.coconut?.04:.1),item.z+(e.player.z-item.z)/toward*rim);
   // After the grab the hand lifts toward the chest.
   if(p.grabbed){const lift=s(a,.45,.8);reachPoint.lerp(chestPoint.set(e.player.x,e.player.y+1.05,e.player.z).addScaledVector(ctx.character.root.getWorldDirection(facing),.3),lift);}
   hands[p.hand]=reachPoint;weight[p.hand]=s(a,.02,.3)*(1-s(a,.7,.9));curl[p.hand]=s(a,.34,.44);
   return {hands,handWeight:weight,curl,pelvis:-.3*down,ground:groundHeight,spine:{lean:1.05*down},look:p.grabbed?null:new T.Vector3(item.x,item.y,item.z),lookWeight:down};}
 };

 // Kicking the ball like a shot (reworked 2026-11-01 after soccer-kick mocap, e.g. CMU subject 10): E walks the player
 // to 1.3 m behind the ball, the kicking foot's hip in line with it. Then, as a function of the time since that:
 // a last long stride lands the plant foot beside the ball (KICK_PLANT) while the kicking foot leaves the sand and
 // folds back; the leg swings from the hip on an arc (angle about the hip and hip-to-ankle distance, eased between
 // keys, so it whips through instead of sliding along straight lines), the knee straightening into the ball's lower
 // back at KICK_HIT, and follows through forward and up; the foot comes down a step ahead and the body walks on over
 // it. The torso leans away from the kicking leg and a little back at contact, the plant-side arm swings out for
 // balance. The hips travel forward the whole time (e.player moves), so the kick has momentum.
 // Charge and aim: E (or the touch button) held charges the kick (the runner's CHARGE, game time); it fires once the
 // player stands at the spot and the key is up, or by itself at full. A tap is a light touch (power 0), a full charge
 // a long lofted shot. The kick goes where the camera looks when the ball is within 75° of that, else straight from
 // the player through the ball; the spot follows the aim until the wind-up starts, the walk there going round the
 // ball. A press without a hold (the automation hook) is a full-power kick at once.
 const KICK_PLANT=.28,KICK_HIT=.42,KICK_END=1.05,KICK_BACK=1.3,KICK_CLEAR=1.12;
 // Where a foot stands at rest with the body at (x,z) and this heading, so a move can end with the feet already there
 // instead of sliding them across the sand when it hands back to the idle pose.
 function restFoot(i,x,z,yaw,out=new T.Vector3()){const [l,w]=ctx.character.idleFoot(i),px=x+Math.cos(yaw)*l+Math.sin(yaw)*w,pz=z-Math.sin(yaw)*l+Math.cos(yaw)*w;return out.set(px,groundHeight(px,pz)+ctx.character.ankleHeight,pz);}
 // A heel off the sand (the toes stay down) raises the ankle.
 const heelUp=(foot,pitch)=>{if(pitch>0)foot.y+=.15*Math.sin(pitch);};
 function kickAim(k){
  const b=objects.ball.position;let dx=b.x-e.player.x,dz=b.z-e.player.z,d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;
  const cx=-Math.sin(e.yaw),cz=-Math.cos(e.yaw);if(cx*dx+cz*dz>Math.cos(75*Math.PI/180)){dx=cx;dz=cz;}
  const sk=ctx.character.side[k.foot];k.f=[dx,dz];k.r=[sk*dz,-sk*dx];k.ball.copy(b);
  k.spot.set(b.x-dx*KICK_BACK-k.r[0]*k.hw,0,b.z-dz*KICK_BACK-k.r[1]*k.hw);
 }
 // How far behind the ball the body's centre is at age a: the long last stride, slower through the swing (the plant
 // leg braces), then on over the landed foot.
 function kickBack(a){return KICK_BACK-.42*s(a,0,KICK_PLANT)-.08*s(a,KICK_PLANT,.5)-.55*s(a,.55,KICK_END);}
 function kickRoot(k,a,out){const back=kickBack(a);out.set(k.ball.x-k.f[0]*back-k.r[0]*k.hw,0,k.ball.z-k.f[1]*back-k.r[1]*k.hw);out.y=groundHeight(out.x,out.z);return out;}
 // Arm directions (forward, outward on its own side, up) at the wind-up and the follow-through.
 const KICK_ARM={plantWind:new T.Vector3(.45,.85,-.15),plantThrough:new T.Vector3(-.4,.8,-.35),kickWind:new T.Vector3(-.55,.35,-.75),kickThrough:new T.Vector3(.6,-.25,-.6)},kickArm=[new T.Vector3(),new T.Vector3()];
 const kickFoot=new T.Vector3(),kickPlant=new T.Vector3(),kickHands=[new T.Vector3(),new T.Vector3()],kickHip=new T.Vector3(),kickTmp=new T.Vector3();
 // The kicking leg in its swing plane: angle forward of straight down (rad) and hip-to-ankle distance as a share of
 // the standing leg; contact is measured from the real hip and ankle targets.
 function kickSwing(k,a,hip){
  const L=ctx.character.hipHeight-ctx.character.ankleHeight,d=kickTmp.subVectors(k.contact,hip),fw=d.x*k.f[0]+d.z*k.f[1];
  const hit=[Math.atan2(fw,-d.y),Math.min(1,Math.hypot(fw,d.y)/L)];
  // Keys (age, angle, length): folded back (heel up behind), wound up, contact, follow-through high in front, easing.
  // A light touch barely draws back and stops short; a full shot folds right back and follows through high.
  const p=k.power??1,keys=[[.18,-.2-.15*p,.86-.04*p],[.33,-.3-.32*p,.72-.1*p],[KICK_HIT,...hit],[.56,.55+.5*p,.97],[.68,.45+.35*p,.95]];
  let i=0;while(i<keys.length-2&&a>keys[i+1][0])i++;
  const u=T.MathUtils.clamp((a-keys[i][0])/(keys[i+1][0]-keys[i][0]),0,1),w=i===1?u*u*(1.6-.6*u):T.MathUtils.smootherstep(u,0,1);
  return [T.MathUtils.lerp(keys[i][2],keys[i+1][2],w)*L,T.MathUtils.lerp(keys[i][1],keys[i+1][1],w)];
 }
 function kickIK(k){
  const a=k.age,H=ctx.character.hipHeight,A=ctx.character.ankleHeight,P=e.player;
  const pelvis=-.05*Math.exp(-(((a-KICK_PLANT)/.08)**2))-.04*Math.exp(-(((a-KICK_HIT)/.07)**2));
  kickHip.set(P.x+k.r[0]*k.hw,P.y+H+pelvis,P.z+k.r[1]*k.hw);
  // Plant foot: the heel leaves the sand first, a low arc (11 cm) landing heel first at KICK_PLANT, the sole rolls flat
  // and takes the weight through the kick. As the body passes over it the heel rises, then it steps up beside the other.
  const pu=s(a,.02,KICK_PLANT),back=s(a,.86,1.03);kickPlant.lerpVectors(k.start[1-k.foot],k.plant,pu);kickPlant.y+=Math.sin(Math.PI*pu)*.11;
  kickPlant.lerp(k.home,back);kickPlant.y+=Math.sin(Math.PI*back)*.08;
  const plantSole=.4*s(a,0,.1)*(1-s(a,.1,.2))-.38*s(a,.14,.24)*(1-s(a,.27,.36))+.55*s(a,.68,.86)*(1-s(a,.9,1.03));heelUp(kickPlant,plantSole);
  // Kicking foot: on the sand until the plant foot lands, peeling off (heel first) into the swing; after the
  // follow-through it comes down a step ahead (a low arc to the landing spot).
  if(a<.18){const u=s(a,.08,.18),[len,ang]=kickSwing(k,.18,kickHip);kickFoot.copy(k.start[k.foot]);
   kickTmp.set(kickHip.x+k.f[0]*Math.sin(ang)*len,kickHip.y-Math.cos(ang)*len,kickHip.z+k.f[1]*Math.sin(ang)*len);kickFoot.lerp(kickTmp,u);}
  else if(a<.68){const [len,ang]=kickSwing(k,a,kickHip),across=-.06*s(a,KICK_HIT,.6);
   kickFoot.set(kickHip.x+k.f[0]*Math.sin(ang)*len+k.r[0]*across,kickHip.y-Math.cos(ang)*len,kickHip.z+k.f[1]*Math.sin(ang)*len+k.r[1]*across);
   kickFoot.y=Math.max(kickFoot.y,groundHeight(kickFoot.x,kickFoot.z)+A);}
  else{const [len,ang]=kickSwing(k,.68,kickHip),u=s(a,.68,.86);
   kickTmp.set(kickHip.x+k.f[0]*Math.sin(ang)*len,kickHip.y-Math.cos(ang)*len,kickHip.z+k.f[1]*Math.sin(ang)*len);
   kickFoot.lerpVectors(kickTmp,k.land,u);}
  const feet=[null,null];feet[k.foot]=kickFoot;feet[1-k.foot]=kickPlant;
  // Out of the kick: hand the feet back to the idle pose over the last 0.15 s.
  const out=1-s(a,KICK_END-.04,KICK_END);
  // Kicking foot: toes pointed through the swing, down on the heel at the end.
  const soles=[0,0];soles[1-k.foot]=plantSole;soles[k.foot]=.75*s(a,.2,.36)*(1-s(a,.56,.72))-.25*s(a,.72,.8)*(1-s(a,.84,.92));
  // Torso: forward into the stride, away from the kicking leg (roll) and a little back at contact, upright by the end.
  const lean=.18*s(a,0,.2)*(1-s(a,.3,.45))-.12*s(a,.3,.45)*(1-s(a,.6,KICK_END)),roll=.14*s(a,.15,.36)*(1-s(a,.6,KICK_END))*ctx.character.side[k.foot];
  const twist=(-.25*s(a,.1,.33)+.4*s(a,.33,.55))*(1-s(a,.6,KICK_END))*ctx.character.side[k.foot];
  // Arms against the leg, from the shoulders an arm's length out (directions in forward / kicking-side / up): the
  // plant side's arm rises out and a little forward to shoulder height for balance in the wind-up and sweeps back as
  // the leg comes through; the kicking side's arm goes back in the wind-up and swings forward across the body.
  const wind=s(a,.05,.33),through=s(a,.36,.6),rest=s(a,.75,KICK_END),reach=.95*ctx.character.armLength;
  for(let j=0;j<2;j++){const kickSide=j===k.foot,o=kickSide?1:-1,d=kickArm[j];
   d.set(0,.2,-1).lerp(kickSide?KICK_ARM.kickWind:KICK_ARM.plantWind,wind).lerp(kickSide?KICK_ARM.kickThrough:KICK_ARM.plantThrough,through).lerp(kickTmp.set(0,.2,-1),rest).normalize();
   const sx=P.x+k.r[0]*o*.2,sz=P.z+k.r[1]*o*.2,sy=P.y+1.6*H+pelvis;
   kickHands[j].set(sx+(k.f[0]*d.x+k.r[0]*o*d.y)*reach,sy+d.z*reach,sz+(k.f[1]*d.x+k.r[1]*o*d.y)*reach);}
  const arm=s(a,.03,.2)*(1-rest);
  return {feet,sole:soles,kneeOut:.05,footWeight:[out,out],hands:kickHands,handWeight:[.9*arm,.9*arm],pelvis:pelvis*out,ground:groundHeight,spine:{lean,roll,twist},look:a<KICK_HIT+.05?k.ball:objects.ball.position,lookWeight:.7*(1-s(a,.55,.9))};
 }
 const KICK={name:'kick',charge:true,
  setup(k){Object.assign(k,{foot:Math.max(0,ctx.character.side.findIndex(v=>v<0)),hw:.11*ctx.character.hipHeight,f:[0,1],r:[1,0],spot:new T.Vector3(),ball:new T.Vector3(),keys:null});kickAim(k);},
  tick:kickAim,
  approach:{within:.1,face:k=>Math.atan2(k.f[0],k.f[1]),
   // Round the ball: if the straight line passes within KICK_CLEAR of it, walk round it on a circle of that radius
   // (tangent towards the spot's side, pushed back out if inside), so the body never shoves it.
   avoid(k,dir,toSpot){let [mx,mz]=dir;const ux=e.player.x-k.ball.x,uz=e.player.z-k.ball.z,du=Math.hypot(ux,uz)||1,ahead=-(ux*mx+uz*mz),off=Math.abs(ux*mz-uz*mx);
    if(ahead>0&&ahead<toSpot&&off<KICK_CLEAR){const sx=k.spot.x-k.ball.x,sz=k.spot.z-k.ball.z,sgn=ux*sz-uz*sx>=0?1:-1;
     let tx=-uz/du*sgn,tz=ux/du*sgn;tx+=ux/du*(KICK_CLEAR-du)*3;tz+=uz/du*(KICK_CLEAR-du)*3;const n=Math.hypot(tx,tz);dir[0]=tx/n;dir[1]=tz/n;}}},
  begin(k){e.avatar.rotation.y=Math.atan2(k.f[0],k.f[1]);
   const A=ctx.character.ankleHeight,H=ctx.character.hipHeight,b=k.ball,at=(fw,rt)=>{const x=b.x-k.f[0]*fw+k.r[0]*rt,z=b.z-k.f[1]*fw+k.r[1]*rt;return new T.Vector3(x,groundHeight(x,z)+A,z);};
   // Where each foot starts, where the plant foot lands (beside and a little behind the contact point; the ball is
   // oversized, 0.48 m), the contact (ankle behind the ball's lower back), and where the kicking foot comes down.
   k.start=[0,1].map(i=>ctx.character.footWorld(i,new T.Vector3()));
   k.plant=at(.56,-(.04+2*k.hw));k.contact=at(.48+.04*H,0);k.contact.y+=.1;
   // The feet finish at the idle stance under where the body ends up.
   const yaw=e.avatar.rotation.y,end=kickRoot(k,KICK_END,kickTmp),ex=end.x,ez=end.z;k.land=restFoot(k.foot,ex,ez,yaw);k.home=restFoot(1-k.foot,ex,ez,yaw);},
  events:[[KICK_HIT,(k,t)=>{k.hit=true;ctx.kickBall(k.power,k.f,t,k.contact);}]],
  step(k){kickRoot(k,Math.min(k.age,KICK_END),e.player);e.avatar.position.copy(e.player);},
  duration:()=>KICK_END,
  // Charging at the spot: settle into the knees and lean over the ball as the charge builds.
  pose(k){if(k.age>=0)return kickIK(k);if(k.atSpot)return {ground:groundHeight,spine:{lean:.14*k.charge},pelvis:-.06*k.charge,look:objects.ball.position,lookWeight:.6};return null;}
 };

 // Carrying a coconut: picked up like a shell (the grab makes it a kinematic body following the palm), carried in
 // that hand at the waist. E again: a tap sets it down in front; held, it charges (the kick's bar and timing) with
 // the arm drawn back over the shoulder, and on release the body turns to the camera's heading and throws it
 // overhand along the camera's aim (pitch included, raised a little), 4–15 m/s by charge. A press without a hold
 // (the hook) is a full throw. A function of the time since the release, like the kick.
 const tossDir=new T.Vector3(),tossHands=[new T.Vector3(),new T.Vector3()],tossTmp=new T.Vector3();
 const TOSS_REL=.14,TOSS_END=.78,PLACE_REL=.34,PLACE_END=.6,TOSS_LUNGE=.26,TOSS_BACK=.16;
 const tossFeet=[new T.Vector3(),new T.Vector3()];
 // The carrying hand at the waist, a little forward and out on its side.
 function carryHand(hand,out){const yaw=e.avatar.rotation.y,H=ctx.character.hipHeight,o=Math.sign(ctx.character.side[hand])||1,P=e.player;
  return out.set(P.x+Math.sin(yaw)*.24+Math.cos(yaw)*o*.2,P.y+.95*H,P.z+Math.cos(yaw)*.24-Math.sin(yaw)*o*.2);}
 // Throws turn to the camera's heading; a set-down stays as it is.
 function faceCamera(k,dt){if(k.place)return;const want=e.yaw+Math.PI,turn=Math.atan2(Math.sin(want-e.avatar.rotation.y),Math.cos(want-e.avatar.rotation.y));e.avatar.rotation.y+=turn*(1-Math.exp(-12*dt));}
 const TOSS={name:'toss',charge:true,
  setup(k){const c=ctx.carry.get();k.item=c.item;k.hand=c.hand;},
  tick:faceCamera,
  // A throw from the legs: drawing back, the foot on the other side from the arm steps forward and the near one back;
  // the release drives the body over the front foot, the back heel rises and that foot steps up to the front one.
  begin(k){k.place=k.charged&&k.hold<CHARGE.tap;if(k.place)return;const c=ctx.character,yaw=e.yaw+Math.PI,P=e.player,x=P.x+Math.sin(yaw)*TOSS_LUNGE,z=P.z+Math.cos(yaw)*TOSS_LUNGE;
   k.yaw=yaw;k.from=[P.x,P.z];k.to=[x,z];k.feet0=[0,1].map(i=>c.footWorld(i,new T.Vector3()));k.feetEnd=[0,1].map(i=>restFoot(i,x,z,yaw));},
  events:[[k=>k.place?PLACE_REL:TOSS_REL,k=>{k.released=true;const yaw=e.avatar.rotation.y,f=[Math.sin(yaw),Math.cos(yaw)];
   if(k.place)coconuts.release(k.item,{x:f[0]*.5,y:.2,z:f[1]*.5},{x:0,y:0,z:0});
   else{camera.getWorldDirection(tossDir);tossDir.y+=.28;tossDir.normalize();const v=4+11*k.power;
    // Spin about the axis across the throw, as off the fingertips.
    coconuts.release(k.item,{x:tossDir.x*v,y:tossDir.y*v,z:tossDir.z*v},{x:tossDir.z*9,y:1.5,z:-tossDir.x*9});e.sfx('kick');}
   ctx.carry.set(null);}]],
  step(k,dt){if(k.place)return;const u=s(k.age,.02,.36);e.player.x=k.from[0]+(k.to[0]-k.from[0])*u;e.player.z=k.from[1]+(k.to[1]-k.from[1])*u;e.player.y=groundHeight(e.player.x,e.player.z);e.avatar.position.copy(e.player);const turn=Math.atan2(Math.sin(k.yaw-e.avatar.rotation.y),Math.cos(k.yaw-e.avatar.rotation.y));e.avatar.rotation.y+=turn*(1-Math.exp(-12*dt));},
  duration:k=>k.place?PLACE_END:TOSS_END,
  pose(k){
   const H=ctx.character.hipHeight,P=e.player,yaw=e.avatar.rotation.y,f=[Math.sin(yaw),Math.cos(yaw)],o=Math.sign(ctx.character.side[k.hand])||1,sv=[Math.cos(yaw)*o,-Math.sin(yaw)*o];
   const at=(out,fw,side,up)=>out.set(P.x+f[0]*fw+sv[0]*side,P.y+up,P.z+f[1]*fw+sv[1]*side);
   const hands=[null,null],w=[0,0],curl=[0,0],a=Math.max(0,k.age),h=k.hand,other=1-h;
   const carryAt=carryHand(h,tossTmp);
   if(k.place||(k.age<0&&k.hold<CHARGE.tap&&k.charged)){
    // Set down: crouch and lower the hand to the sand in front, open the hand, stand back up.
    const down=k.age<0?0:s(a,0,.28)*(1-s(a,.38,PLACE_END));at(tossHands[h],.45,.12,.25+(1-down)*(.95*H-.25));tossHands[h].lerp(carryAt,1-s(a,0,.2));
    hands[h]=tossHands[h];w[h]=.85;curl[h]=k.released?0:1;
    return {hands,handWeight:w,curl,pelvis:-.28*down,ground:groundHeight,spine:{lean:.8*down}};}
   // Throw: the arm back over the shoulder while charging (or at once for a hook throw), whip to the release in
   // front at shoulder height, follow through across and down; the other arm points ahead while winding up.
   const wind=k.age<0?s(k.hold,0,.25):1,sh=1.6*H;
   at(tossHands[h],-.28,.18,sh+.28);tossHands[h].lerp(carryAt,1-wind);
   if(k.age>=0){const u=s(a,0,TOSS_REL);tossTmp.copy(tossHands[h]);at(tossHands[h],.55,.12,sh+.08);tossHands[h].lerp(tossTmp,1-u);
    if(a>TOSS_REL){tossTmp.copy(tossHands[h]);at(tossHands[h],.38,-.12,.95*H);tossHands[h].lerp(tossTmp,1-s(a,TOSS_REL,.34));}}
   hands[h]=tossHands[h];w[h]=.9*(1-s(a,.36,TOSS_END));curl[h]=k.released?0:1;
   const aim=wind*(1-s(a,0,TOSS_REL+.08));at(tossHands[other],.5,-.2,sh+.12);hands[other]=tossHands[other];w[other]=.7*aim;
   const swing=k.age<0?0:s(a,0,.2);
   // Feet. Charging: from rest to the staggered stance, one after the other, in the body's frame. After the release: fixed on the sand.
   const front=other,rear=h,soles=[0,0];let footW=1;
   if(k.age<0){const c=ctx.character,place=(i,fw,u)=>{const [l,w0]=c.idleFoot(i),F=w0+fw*u,x=P.x+Math.cos(yaw)*l+f[0]*F,z=P.z-Math.sin(yaw)*l+f[1]*F;tossFeet[i].set(x,groundHeight(x,z)+c.ankleHeight+Math.sin(Math.PI*u)*.07,z);};
    const uf=s(k.hold,.03,.25),ur=s(k.hold,.14,.36);place(front,TOSS_LUNGE,uf);place(rear,-TOSS_BACK,ur);soles[front]=-.3*Math.sin(Math.PI*uf);footW=s(k.hold,0,.08);}
   else{const uf=s(a,0,.1);tossFeet[front].lerpVectors(k.feet0[front],k.feetEnd[front],uf);tossFeet[front].y+=Math.sin(Math.PI*uf)*(k.feet0[front].distanceTo(k.feetEnd[front])>.15?.07:0);
    const ur=s(a,.26,.56);tossFeet[rear].lerpVectors(k.feet0[rear],k.feetEnd[rear],ur);tossFeet[rear].y+=Math.sin(Math.PI*ur)*.08;soles[rear]=.6*s(a,.03,.22)*(1-s(a,.4,.56));heelUp(tossFeet[rear],soles[rear]);footW=1-s(a,TOSS_END-.05,TOSS_END);}
   return {feet:tossFeet,footWeight:[footW,footW],sole:soles,kneeOut:.05,hands,handWeight:w,curl,ground:groundHeight,spine:{lean:-.12*wind*(1-swing)+.3*swing*(1-s(a,.3,TOSS_END)),twist:o*(.35*wind*(1-swing)-.3*swing*(1-s(a,.3,TOSS_END)))},pelvis:-.04*swing};}
 };
 // A handful of sand (E on open dry beach with nothing to interact with): crouch, scoop in front with the hand on
 // the kicking side, stand with it before the chest, open the hand and let it run out. Written only as a definition
 // (curves from actions.js helpers, existing puffs): the runner needed nothing new.
 const scoopHand=new T.Vector3(),scoopRest=new T.Vector3(),scoopHands=[null,null];
 const SCOOP_DOWN=pulse(0,.35,.75,1.1),SCOOP_LIFT=ramp(.55,.9),SCOOP_WEIGHT=pulse(.05,.3,1.3,1.6),SCOOP_GRIP=pulse(.38,.5,1.05,1.2);
 const SCOOP={name:'scoop',
  setup(k){const yaw=e.avatar.rotation.y,P=e.player;k.f=[Math.sin(yaw),Math.cos(yaw)];k.hand=Math.max(0,ctx.character.side.findIndex(v=>v<0));
   const o=Math.sign(ctx.character.side[k.hand])||1,x=P.x+k.f[0]*.3+Math.cos(yaw)*o*.16,z=P.z+k.f[1]*.3-Math.sin(yaw)*o*.16;k.at=new T.Vector3(x,groundHeight(x,z)+.1,z);},
  events:[[.45,(k,t)=>objects.puff(k.at.x,k.at.z,t,.35,k.f[0],k.f[1])],
   [1.15,(k,t)=>{const h=ctx.character.palm(k.hand,scoopHand);objects.puff(h.x,h.z,t,.3,0,0);}]],
  duration:()=>1.6,
  pose(k){const a=Math.max(0,k.age),P=e.player,down=SCOOP_DOWN(a);
   scoopRest.set(P.x+k.f[0]*.3,P.y+1.1,P.z+k.f[1]*.3);scoopHand.copy(k.at).lerp(scoopRest,SCOOP_LIFT(a));
   const hands=[null,null],w=[0,0],curl=[0,0];hands[k.hand]=scoopHand;w[k.hand]=.9*SCOOP_WEIGHT(a);curl[k.hand]=SCOOP_GRIP(a);
   return {hands,handWeight:w,curl,pelvis:-.38*down,ground:groundHeight,spine:{lean:1.05*down},look:a<.7?k.at:scoopHand,lookWeight:.8*SCOOP_WEIGHT(a)};}
 };
 // The carrying hand on top of the walk pose (index.js poseIK).
 function withCarry(ik){const carry=ctx.carry.get();if(!carry)return ik;ik={...(ik??{})};const hands=[null,null],w=[0,0],curl=[0,0];hands[carry.hand]=carryHand(carry.hand,tossHands[carry.hand]);w[carry.hand]=.85;curl[carry.hand]=1;return {...ik,hands,handWeight:w,curl};}

 return {PICKUP,KICK,TOSS,SCOOP,withCarry};
}
