import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { shore, shoreGLSL } from './terrain.js';

// Stateless world-space fields: seeking time backwards produces the same water,
// foam and wetness as visiting that frame for the first time.
export const coastalGLSL = `${shoreGLSL}
float waterHash(vec2 p) {
 vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
 q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);
}
// Value noise and its analytical gradient; there is no tiled normal texture.
vec3 waterNoiseD(vec2 p) {
 vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f),du=6.*f*(1.-f);
 float a=waterHash(i),b=waterHash(i+vec2(1,0)),c=waterHash(i+vec2(0,1)),d=waterHash(i+1.);
 return vec3(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),
 du*vec2(mix(b-a,d-c,u.y),mix(c-a,d-b,u.x)));
}
float waterNoise(vec2 p){return waterNoiseD(p).x;}
float coastSlope(float x){return (abs(x)<80.?-.018*x:0.)+.1125*cos(x*.075);}
float beachHeight(float d){return .75*(1.-exp(-max(d,0.)/32.))+.34*exp(-pow((d-5.2)/2.2,2.));}
float surfPhase(vec2 p,float t){return (shore(p.x)-p.y)*.68+t*1.36+.42*sin(p.x*.105)+.19*sin(p.x*.29);}
// The bore reaches d=0 at the same phase as the last breaking crest.
float swashCycle(float x,float t){return fract((t*1.36+.42*sin(x*.105)+.19*sin(x*.29)-1.10)/6.283185);}
float swashFront(float x,float t){
 float u=swashCycle(x,t);
 float run=smoothstep(0.,.28,u)*(1.-smoothstep(.28,1.,u));
 return -.35+(2.4+.45*sin(x*.19)+.22*sin(x*.57))*run;
}
float wetSand(vec2 p,float t){
 float d=p.y-shore(p.x),front=swashFront(p.x,t),u=swashCycle(p.x,t);
 float maximum=2.05+.45*sin(p.x*.19)+.22*sin(p.x*.57);
 float mottling=(waterNoise(p*.8)-.5)*.28;
 float reach=clamp((d+.35)/max(maximum+.35,.1),0.,1.);
 // Invert the recession smoothstep exactly, so drying starts at contact
 // instead of introducing a visible second darkening after the water leaves.
 float inverseRecession=.5-sin(asin(2.*reach-1.)/3.);
 float retreatPhase=.28+.72*inverseRecession;
 float elapsed=fract(u-retreatPhase)*4.62;
 float residual=(1.-smoothstep(maximum-.45,maximum+.55,d+mottling))*(.55+.35*exp(-elapsed/4.));
 return max(residual,1.-smoothstep(front-.1,front+.5,d));
}
`;

const waveGLSL = `
void gerstner(vec2 p,vec2 dir,float amplitude,float wavelength,float phase,float t,
 inout vec3 displacement,inout vec3 tx,inout vec3 tz){
 float k=6.283185/wavelength,w=sqrt(9.81*k),f=k*dot(dir,p)-w*t+phase;
 float s=sin(f),c=cos(f),q=.62;
 displacement+=vec3(q*amplitude*dir.x*c,amplitude*s,q*amplitude*dir.y*c);
 tx+=vec3(-q*amplitude*k*dir.x*dir.x*s,amplitude*k*dir.x*c,-q*amplitude*k*dir.x*dir.y*s);
 tz+=vec3(-q*amplitude*k*dir.x*dir.y*s,amplitude*k*dir.y*c,-q*amplitude*k*dir.y*dir.y*s);
}
void waterSurface(vec2 p,float t,out vec3 displaced,out vec3 waveNormal){
 float coast=shore(p.x)-p.y;
 float fade=smoothstep(0.,16.,coast);
 float shelter=(.68+.32*smoothstep(15.,90.,coast))*(1.-smoothstep(100.,550.,coast))*(1.-smoothstep(140.,500.,abs(p.x)));
 vec3 offset=vec3(0.),tx=vec3(1,0,0),tz=vec3(0,0,1);
 gerstner(p,normalize(vec2(.22,1.)),.29,19.,.5,t,offset,tx,tz);
 gerstner(p,normalize(vec2(-.38,1.)),.16,11.3,2.4,t,offset,tx,tz);
 gerstner(p,normalize(vec2(.72,.69)),.085,6.7,4.1,t,offset,tx,tz);
 gerstner(p,normalize(vec2(-.81,.59)),.045,3.8,1.1,t,offset,tx,tz);
 offset*=fade*shelter;
 tx=mix(vec3(1,0,0),tx,fade*shelter);tz=mix(vec3(0,0,1),tz,fade*shelter);
 // Shoaling bore: sharpened, asymmetric crest with shallow-water attenuation.
 float ph=surfPhase(p,t),s=sin(ph),c=cos(ph);
 float envelope=smoothstep(0.,2.2,coast)*(1.-smoothstep(13.,30.,coast));
 float h=(s+.32*sin(2.*ph))*.29*envelope;
 float dh=(c+.64*cos(2.*ph))*.29*envelope;
 vec2 gradient=vec2(coastSlope(p.x)*.68+.0441*cos(p.x*.105)+.0551*cos(p.x*.29),-.68);
 float crestRough=exp(-pow(atan(sin(ph-1.10),cos(ph-1.10))/.50,2.));
 h+=(waterNoise(p*2.3+vec2(0.,-t*.65))-.5)*.07*crestRough*envelope;
 offset.y+=h;tx.y+=dh*gradient.x;tz.y+=dh*gradient.y;
 displaced=vec3(p.x,0.035,p.y)+offset;
 waveNormal=normalize(cross(tz,tx));
 // Troughs cannot cut through the unchanged seabed in ankle-deep water.
 float floorHeight=-max(coast,0.)*.12+.025;
 float contact=(1.-smoothstep(floorHeight-.025,floorHeight+.025,displaced.y));
 displaced.y=max(displaced.y,floorHeight);
 waveNormal=normalize(mix(waveNormal,vec3(.12*coastSlope(p.x),1.,-.12),contact));
}
`;

// Per-pixel wave state for shading: the offshore mesh rows are 10-16 m apart, so crests, whitecaps and the light
// through them are evaluated from the same four Gerstner waves here, not interpolated from the vertices.
// x: height of the swell (open water only), y: the Jacobian of the horizontal displacement (below 1 where the
// surface is squeezed together at a crest; whitecaps form where it is lowest).
const crestGLSL = `
vec2 swellState(vec2 p,float t){
 float coast=shore(p.x)-p.y;
 float s=smoothstep(0.,16.,coast)*(.68+.32*smoothstep(15.,90.,coast))*(1.-smoothstep(100.,550.,coast))*(1.-smoothstep(140.,500.,abs(p.x)));
 vec2 D[4];D[0]=normalize(vec2(.22,1.));D[1]=normalize(vec2(-.38,1.));D[2]=normalize(vec2(.72,.69));D[3]=normalize(vec2(-.81,.59));
 vec4 A=vec4(.29,.16,.085,.045),L=vec4(19.,11.3,6.7,3.8),P=vec4(.5,2.4,4.1,1.1);
 float h=0.,xx=0.,zz=0.,xz=0.;
 for(int i=0;i<4;i++){float k=6.283185/L[i],f=k*dot(D[i],p)-sqrt(9.81*k)*t+P[i],sn=sin(f),qa=.62*A[i]*k*sn;
  h+=A[i]*sn;xx-=qa*D[i].x*D[i].x;zz-=qa*D[i].y*D[i].y;xz-=qa*D[i].x*D[i].y;}
 return vec2(h*s,mix(1.,(1.+xx)*(1.+zz)-xz*xz,s));
}
`;

export const WAKE_RINGS=24;
const grid={xs:null,ds:null};
function waterGeometry() {
 // Preserve the terrain entirely. Only the water mesh follows the coast, with
 // ~35 cm rows across the surf, smoothly coarsening into the distant ocean.
 const xs=[],ds=[];
 for(let i=40;i>0;i--)xs.push(-140-1860*(i/40)**2);
 for(let i=0;i<=350;i++)xs.push(-140+i*.8);
 for(let i=1;i<=40;i++)xs.push(140+1860*(i/40)**2);
 for(let i=0;i<=186;i++)ds.push(-5+i*.35);
 for(let i=1;i<=70;i++)ds.push(60.1+2140*(i/70)**2);
 grid.xs=xs;grid.ds=ds;
 const positions=[],indices=[];
 for(const d of ds)for(const x of xs)positions.push(x,-(shore(x)-d),0);
 const width=xs.length;
 for(let j=0;j<ds.length-1;j++)for(let i=0;i<width-1;i++){
  const a=j*width+i,b=a+1,c=a+width,d=c+1;
  indices.push(a,b,d,a,d,c);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
 return g;
}

export function createWater(sun) {
 const water=new Water(waterGeometry(),{textureWidth:512,textureHeight:512,sunDirection:sun,sunColor:0xfff4da,waterColor:0x087f9c,distortionScale:.55,fog:true});
 water.rotation.x=-Math.PI/2;water.frustumCulled=false;
 water.name='lagoon-water';
 // Ripples behind the game's rowboat (set by src/game/wake.js): each entry is a point the stern passed (x, z, time,
 // boat speed; 0 switches it off). A ring of small waves spreads from each; together they draw the V behind the boat (a kinematic wake:
 // circles emitted along the path). Shading only: the surface itself does not move.
 water.material.uniforms.wakeRings={value:Array.from({length:WAKE_RINGS},()=>new THREE.Vector4())};
 water.material.vertexShader=`
 uniform mat4 textureMatrix;uniform float time;
 varying vec4 mirrorCoord;varying vec4 worldPosition;
 varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_vertex>
 #include <logdepthbuf_pars_vertex>
 ${coastalGLSL}
 ${waveGLSL}
 void main(){
  vec2 p=(modelMatrix*vec4(position,1.)).xz;vWaterRest=p;
  vec3 displaced;waterSurface(p,time,displaced,vWaveNormal);
  float d=p.y-shore(p.x),front=swashFront(p.x,time);
  // A thin sheet conforms to the unchanged beach rather than hovering above it.
  if(d>-.15){
   float sheet=beachHeight(d)+.012+.018*smoothstep(0.,1.,front-d);
   displaced.y=mix(displaced.y,sheet,smoothstep(-.15,.12,d));
  }
  worldPosition=vec4(displaced,1.);
  mirrorCoord=textureMatrix*worldPosition;
  vec4 mvPosition=viewMatrix*worldPosition;
  gl_Position=projectionMatrix*mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
 }`;
 water.material.fragmentShader=`
 uniform mat4 textureMatrix;uniform sampler2D mirrorSampler;uniform float time;uniform vec3 eye;uniform vec3 sunDirection;uniform vec3 sunColor;
 uniform vec4 wakeRings[${WAKE_RINGS}];
 varying vec4 mirrorCoord;varying vec4 worldPosition;varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_fragment>
 #include <logdepthbuf_pars_fragment>
 ${coastalGLSL}
 ${crestGLSL}
 vec2 fineSlope(vec2 p,float distanceToEye){
  mat2 r=mat2(.80,-.60,.60,.80),r2=mat2(.36,.933,-.933,.36);
  vec2 warp=vec2(waterNoise(p*.071+time*.025),waterNoise(p*.093-time*.019));
  vec2 q=p+warp*1.8;
  vec2 a=waterNoiseD(q*.74+vec2(-.16,.12)*time).yz*.13;
  vec2 b=waterNoiseD(r*q*1.91+vec2(.13,-.21)*time).yz*r*.072;
  vec2 c=waterNoiseD(r2*q*4.73+vec2(-.19,-.14)*time).yz*r2*.046;
  vec2 d=waterNoiseD(q*11.3+vec2(.31,.24)*time).yz*.022;
  return a/(1.+distanceToEye*.006)+b/(1.+distanceToEye*.012)+c/(1.+distanceToEye*.035)+d/(1.+distanceToEye*.09);
 }
 float foamLace(vec2 p){
  vec2 warp=vec2(waterNoise(p*1.7),waterNoise(p*1.7+17.))*1.3;
  float n=waterNoise(p*4.2+warp);
  float cells=1.-smoothstep(.035,.115,abs(n-.52));
  float bubbles=waterNoise(p*19.3);
  return clamp(cells*.7+smoothstep(.50,.75,bubbles)*.36,0.,1.);
 }
 void main(){
  #include <logdepthbuf_fragment>
  vec2 p=vWaterRest;
  float coast=shore(p.x)-p.y,d=-coast;
  float front=swashFront(p.x,time);
  float irregular=(waterNoise(vec2(p.x*3.,time*.21))-.5)*.26;
  if(d>front+irregular)discard;
  vec3 toEye=eye-worldPosition.xyz;float distanceToEye=length(toEye);vec3 V=toEye/distanceToEye;
  vec2 small=fineSlope(worldPosition.xz,distanceToEye)*mix(.25,1.,smoothstep(-1.,6.,coast));
  // Wake ripples: crests about 0.9 m apart; each ring runs out at a third of the boat's speed, so the rings
  // together keep the Kelvin wake's ~19.5° V at any speed. Weaker as they spread and age.
  vec2 rip=vec2(0.);
  for(int i=0;i<${WAKE_RINGS};i++){vec4 r=wakeRings[i];if(r.w<=.3)continue;vec2 q=worldPosition.xz-r.xy;float dist=length(q),age=time-r.z;
   float x=dist-min(.34*r.w,3.)*age;if(age<0.||abs(x)>2.||dist<.01)continue;
   float env=clamp((r.w-.3)/2.5,0.,1.)*exp(-x*x*1.4)*exp(-age*.35)/(1.+.12*dist);rip+=q/dist*cos(x*7.)*.55*env;}
  small+=rip;
  vec3 N=normalize(vWaveNormal+vec3(-small.x,0.,-small.y));
  N=mix(N,normalize(vec3(-small.x,1.,-small.y)),smoothstep(-.1,1.,d));
  float NoV=max(dot(N,V),.001),fresnel=.0204+.9796*pow(1.-NoV,5.);
  // Project a point along the actual reflected ray. A short UV offset leaves
  // whole clouds glued to a flat mirror even when the water is displaced.
  vec3 reflectedRay=reflect(-V,N);
  vec4 rayCoord=textureMatrix*vec4(worldPosition.xyz+reflectedRay*40.,1.);
  vec2 flatUV=mirrorCoord.xy/mirrorCoord.w;
  vec2 rayUV=rayCoord.xy/max(rayCoord.w,.1);
  vec2 mirrorUV=flatUV+clamp(rayUV-flatUV,vec2(-.12),vec2(.12))*.35;
  vec2 blur=vec2(.004,.004)*(1.+min(distanceToEye*.02,2.));
  vec3 reflected=texture2D(mirrorSampler,mirrorUV).rgb*.4;
  reflected+=(texture2D(mirrorSampler,mirrorUV+blur).rgb+texture2D(mirrorSampler,mirrorUV-blur).rgb)*.3;
  vec3 reflectedSky=mix(vec3(.24,.53,.79),vec3(.012,.15,.48),pow(max(reflectedRay.y,0.),.28));
  vec2 valid=smoothstep(vec2(0.),vec2(.04),mirrorUV)*(1.-smoothstep(vec2(.96),vec2(1.),mirrorUV));
  reflected=mix(reflectedSky,reflected,valid.x*valid.y);
  reflected=mix(reflectedSky,reflected,.85);
  reflected=reflected/(1.+reflected*.35);
  float depth=max(.012,coast*.12+worldPosition.y);
  float path=depth/max(.35,sqrt(1.-(1.-NoV*NoV)/1.777));
  vec2 bottomP=worldPosition.xz+refract(-V,N,.75).xz*depth;
  float sandNoise=waterNoise(bottomP*.64)*.6+waterNoise(bottomP*2.7)*.4;
  float ripple=sin(bottomP.y*15.+waterNoise(bottomP*.6)*5.);
  vec3 bottom=vec3(.62,.53,.39)*(.91+.16*sandNoise+ripple*.018);
  vec2 causticP=bottomP*1.8+N.xz*.5;
  float ca=waterNoise(causticP+vec2(time*.21,-time*.13));
  float cb=waterNoise(mat2(.8,-.6,.6,.8)*causticP*1.47+vec2(-time*.17,time*.11));
  float caustic=pow(1.-abs(ca-.5)*2.,18.)+pow(1.-abs(cb-.5)*2.,22.);
  bottom*=1.+caustic*.14*exp(-depth*.55);
  vec3 transmission=exp(-vec3(.85,.24,.16)*path);
  vec3 waterTint=mix(vec3(.008,.44,.50),vec3(.006,.075,.14),1.-exp(-depth*.055));
  vec3 sea=bottom*transmission+waterTint*(1.-transmission);
  float crestTint=smoothstep(.03,.32,worldPosition.y)*(1.-smoothstep(10.,35.,coast));
  sea+=vec3(.005,.038,.027)*crestTint*max(dot(V,-sunDirection),0.);
  // Light through the swell: a wave's upper part is thin enough for sunlight to come through it green-blue, most
  // when looking towards the sun (backlit crests), a little from any side.
  vec2 swell=swellState(p,time);
  float thin=smoothstep(-.12,.35,swell.x)*smoothstep(0.,6.,coast);
  float backlit=pow(max(dot(normalize(vec3(-V.x,0.,-V.z)),normalize(vec3(sunDirection.x,0.,sunDirection.z))),0.),3.);
  sea+=vec3(.03,.3,.23)*thin*thin*(.3+.7*backlit)*(1.-fresnel);
  vec3 color=mix(sea,reflected,clamp(fresnel,0.,.97));
  // Seen from above the water shows mostly its own colour, so a ripple's slope would hardly show: the faces
  // tilted towards the eye catch more sky and read lighter, the others darker.
  color+=vec3(.05,.09,.1)*clamp(dot(rip,normalize(-V.xz+1e-4))*2.5,-1.,1.);
  vec3 H=normalize(V+sunDirection);
  float glitter=pow(max(dot(N,H),0.),420.);
  color+=sunColor*glitter*.85;
  // A broken leading crest and a lace-like aerated wake, only in shallow water.
  float phase=surfPhase(p,time);
  float behind=mod(phase-1.10+6.283185,6.283185);
  float signedCrest=atan(sin(phase-1.10),cos(phase-1.10));
  float crest=exp(-pow((signedCrest+(waterNoise(p*1.3)-.5)*.12)/.27,2.));
  float wake=exp(-behind*.95)*smoothstep(0.,.12,behind);
  vec2 foamP=vec2(p.x,p.y-time*.40);
  float foamPatch=waterNoise(vec2(p.x*1.12,p.y*.86)+vec2(0.,time*.12));
  float lace=foamLace(foamP);
  float breaking=smoothstep(.2,1.4,coast)*(1.-smoothstep(8.,15.,coast));
  float foam=breaking*(crest*(.30+.60*lace)*(.55+.45*foamPatch)+wake*lace*.85*smoothstep(.25,.65,foamPatch));
  float edgeDistance=front+irregular-d;
  float leading=exp(-pow(edgeDistance/(.08+.10*waterNoise(p*5.)),2.));
  float sheet=(1.-smoothstep(.1,1.9,edgeDistance))*smoothstep(-1.3,.2,d);
  foam=max(foam,leading*(.18+.68*lace)+sheet*lace*.42);
  // Whitecaps: where the swell's crest is squeezed tightest, in patches (not every crest breaks), with foam left
  // behind to thin out for a moment (the same squeeze a little earlier, weaker).
  // Patches are stretched along the crests (the main swell runs towards +z), so a breaking crest reads as a streak.
  float squeeze=smoothstep(.9,.82,swell.y),earlier=smoothstep(.89,.82,swellState(p,time-.7).y);
  float patches=smoothstep(.38,.65,waterNoise(vec2(p.x*.05,p.y*.16)+vec2(time*.04,-time*.03)));
  float capLace=foamLace(p*.8+vec2(0.,time*.15)),far=smoothstep(60.,220.,distanceToEye);
  float detail=mix(capLace,.5,far);
  float whitecap=patches*(smoothstep(.15,.5,squeeze*detail)+earlier*smoothstep(.35,.75,detail)*.4)*smoothstep(6.,20.,coast);
  foam=max(foam,whitecap*.85);
  vec3 foamColor=vec3(.88,.96,.94)*(.80+.24*max(dot(N,sunDirection),0.));
  color=mix(color,foamColor,clamp(foam,0.,.94));
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
 }`;
 return water;
}

export function shadeSand(material,timeUniform) {
 material.onBeforeCompile=s=>{
  s.uniforms.time=timeUniform;
  s.vertexShader='varying vec3 vWorld;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWorld=(modelMatrix*vec4(position,1.)).xyz;');
  s.fragmentShader='uniform float time;varying vec3 vWorld;\n'+coastalGLSL+'\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float wet=wetSand(vWorld.xz,time);
   float grain=waterHash(vWorld.xz*173.);
   float ripple=sin(vWorld.x*2.2+sin(vWorld.z*.7)*2.+sin(vWorld.x*.3))*sin(vWorld.z*8.);
   diffuseColor.rgb*=mix(vec3(1.),vec3(.62,.57,.49),wet)*(.95+grain*.10+ripple*.025);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float fresh=1.-smoothstep(swashFront(vWorld.x,time)-.1,swashFront(vWorld.x,time)+.6,vWorld.z-shore(vWorld.x));
   roughnessFactor=mix(.92,.33,wet);roughnessFactor=mix(roughnessFactor,.16,fresh);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float phase=vWorld.z*15.+sin(vWorld.x*.8)*1.8+sin(vWorld.z*1.4);
   vec3 rippleNormal=vec3(cos(phase)*.012,0.,cos(phase)*.035);
   normal=normalize(normal+mat3(viewMatrix)*rippleNormal*(1.-wet*.8)*(.55+.45*sin(vWorld.x*.34)*sin(vWorld.z*.56))/(1.+length(vViewPosition)*.012));
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
   float wetFresnel=.02+.98*pow(1.-abs(dot(normal,normalize(vViewPosition))),5.);
   outgoingLight=mix(outgoingLight,vec3(.24,.44,.61),wet*wetFresnel*.35);
   #include <opaque_fragment>`);
 };
}

// CPU mirror of the existing vertex field. No shader or rendering changes.
// Caller owns `out`; hot-path queries allocate nothing. Horizontal Gerstner
// displacement is inverted so a hull at world X/Z meets the rendered surface.
const waveComponents = [[.22,1,.29,19,.5],[-.38,1,.16,11.3,2.4],[.72,.69,.085,6.7,4.1],[-.81,.59,.045,3.8,1.1]].map(([x,z,a,l,p])=>{const n=Math.hypot(x,z),k=6.283185/l;return [x/n,z/n,a,k,Math.sqrt(9.81*k),p];});
const smooth=(a,b,v)=>{const u=Math.max(0,Math.min(1,(v-a)/(b-a)));return u*u*(3-2*u);};
const fract=v=>v-Math.floor(v);
function hashWater(x,z){let a=fract(x*.1031),b=fract(z*.1030),c=fract(x*.0973);const d=a*(b+33.33)+b*(c+33.33)+c*(a+33.33);a+=d;b+=d;c+=d;return fract((a+b)*c);}
function noiseWater(x,z){const i=Math.floor(x),j=Math.floor(z),u=smooth(0,1,fract(x)),v=smooth(0,1,fract(z));return (hashWater(i,j)*(1-u)+hashWater(i+1,j)*u)*(1-v)+(hashWater(i,j+1)*(1-u)+hashWater(i+1,j+1)*u)*v;}
export function swashReach(x,t){const u=fract((t*1.36+.42*Math.sin(x*.105)+.19*Math.sin(x*.29)-1.10)/6.283185);return -.35+(2.4+.45*Math.sin(x*.19)+.22*Math.sin(x*.57))*smooth(0,.28,u)*(1-smooth(.28,1,u));}
function waterField(x,z,t,out){
 const coast=shore(x)-z,scale=smooth(0,16,coast)*(.68+.32*smooth(15,90,coast))*(1-smooth(100,550,coast))*(1-smooth(140,500,Math.abs(x)));
 let ox=0,oz=0,y=.035;
 for(let i=0;i<4;i++){const w=waveComponents[i],f=w[3]*(w[0]*x+w[1]*z)-w[4]*t+w[5],a=w[2]*scale;ox+=.62*a*w[0]*Math.cos(f);oz+=.62*a*w[1]*Math.cos(f);y+=a*Math.sin(f);}
 const ph=coast*.68+t*1.36+.42*Math.sin(x*.105)+.19*Math.sin(x*.29),envelope=smooth(0,2.2,coast)*(1-smooth(13,30,coast));
 y+=(Math.sin(ph)+.32*Math.sin(2*ph))*.29*envelope;
 const crest=Math.exp(-((Math.atan2(Math.sin(ph-1.10),Math.cos(ph-1.10))/.50)**2));
 y+=(noiseWater(x*2.3,z*2.3-t*.65)-.5)*.07*crest*envelope;
 y=Math.max(y,-Math.max(coast,0)*.12+.025);
 const d=-coast;if(d>-.15){const beach=.75*(1-Math.exp(-Math.max(d,0)/32))+.34*Math.exp(-(((d-5.2)/2.2)**2)),sheet=beach+.012+.018*smooth(0,1,swashReach(x,t)-d);y+=(sheet-y)*smooth(-.15,.12,d);}
 out.x=x+ox;out.z=z+oz;out.height=y;
}
function waterHeightAt(x,z,t,out){let u=x,v=z;for(let i=0;i<4;i++){waterField(u,v,t,out);u+=x-out.x;v+=z-out.z;}waterField(u,v,t,out);return out.height;}
// The water as drawn: the mesh's vertices move with the wave field and the surface between them is flat. Offshore the
// rows are 10-16 m apart, so the drawn surface can sit 20-30 cm off the exact field (sampleWater) between them; things
// that must not cut through it (the rowboat's hull) follow this one.
const corner={},corners=new Map();let cornerT=NaN;
// The displaced grid corners for one time, shared by every surfaceHeight() call at that time (the boat, its wake
// and splashes ask for hundreds of nearby points per frame, most of them in the same few cells).
function gridCorner(a,b,t){
 if(t!==cornerT){corners.clear();cornerT=t;}
 const key=a*4096+b;let c=corners.get(key);
 if(!c){const cx=grid.xs[a];waterField(cx,shore(cx)-grid.ds[b],t,corner);c={x:corner.x,z:corner.z,height:corner.height};corners.set(key,c);}
 return c;
}
function lowerIndex(a,v){let lo=0,hi=a.length-2;while(lo<hi){const m=(lo+hi+1)>>1;if(a[m]<=v)lo=m;else hi=m-1;}return lo;}
export function surfaceHeight(x,z,t){
 if(!grid.xs)waterGeometry();
 const {xs,ds}=grid;let u=x,v=z,h=0;
 for(let it=0;it<5;it++){
  const i=lowerIndex(xs,u),j=lowerIndex(ds,shore(u)-v);
  const rest=(a,b)=>[xs[a],shore(xs[a])-ds[b]];
  const A=rest(i,j),B=rest(i+1,j),C=rest(i,j+1),D=rest(i+1,j+1);
  let pick=null;
  for(const T3 of [[A,B,D,[i,j],[i+1,j],[i+1,j+1]],[A,D,C,[i,j],[i+1,j+1],[i,j+1]]]){
   const [p,q,r]=T3,det=(q[0]-p[0])*(r[1]-p[1])-(r[0]-p[0])*(q[1]-p[1]);
   const w1=((u-p[0])*(r[1]-p[1])-(r[0]-p[0])*(v-p[1]))/det,w2=((q[0]-p[0])*(v-p[1])-(u-p[0])*(q[1]-p[1]))/det,w0=1-w1-w2;
   const worst=Math.min(w0,w1,w2);if(!pick||worst>pick.worst)pick={worst,w:[w0,w1,w2],ix:T3.slice(3)};
  }
  let X=0,Z=0;h=0;
  for(let k=0;k<3;k++){const c=gridCorner(...pick.ix[k],t);X+=pick.w[k]*c.x;Z+=pick.w[k]*c.z;h+=pick.w[k]*c.height;}
  u+=x-X;v+=z-Z;
 }
 return h;
}
export function sampleWater(x,z,t,out){
 const h=waterHeightAt(x,z,t,out),hx=waterHeightAt(x+.06,z,t,out),hz=waterHeightAt(x,z+.06,t,out),nx=(h-hx)/.06,nz=(h-hz)/.06,n=Math.hypot(nx,1,nz);
 out.x=x;out.z=z;out.height=h;out.nx=nx/n;out.ny=1/n;out.nz=nz/n;return out;
}
