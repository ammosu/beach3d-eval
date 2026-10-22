import{M as ve,V as F,C as T,an as Ne,a5 as Q,c as ke,h as Pe,i as _e,U as de,aN as ue,f as De,G as We,a4 as U,g as Fe,e as me,F as L,b as E,ab as Ve,aa as xe,a7 as we,ad as Y,aM as ge,_ as ye,B as Ae,I as X,a0 as qe,K as ee,t as Le,aC as He,a as Re}from"./url-D9h6cwyH.js";import{a as Te,s as B,g as K}from"./props-DUNbACCA.js";class Ee extends ve{constructor(e,t={}){super(e),this.isWater=!0;const o=this,s=t.textureWidth!==void 0?t.textureWidth:512,c=t.textureHeight!==void 0?t.textureHeight:512,l=t.clipBias!==void 0?t.clipBias:0,z=t.alpha!==void 0?t.alpha:1,p=t.time!==void 0?t.time:0,w=t.waterNormals!==void 0?t.waterNormals:null,k=t.sunDirection!==void 0?t.sunDirection:new F(.70707,.70707,0),N=new T(t.sunColor!==void 0?t.sunColor:16777215),y=new T(t.waterColor!==void 0?t.waterColor:8355711),r=t.eye!==void 0?t.eye:new F(0,0,0),v=t.distortionScale!==void 0?t.distortionScale:20,C=t.side!==void 0?t.side:Ne,S=t.fog!==void 0?t.fog:!1,_=new We,x=new F,h=new F,n=new F,d=new Q,g=new F(0,0,-1),M=new U,m=new F,i=new F,u=new U,f=new Q,b=new ke,P=new Pe(s,c,{type:_e}),W={name:"MirrorShader",uniforms:de.merge([ue.fog,ue.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new Q},sunColor:{value:new T(8355711)},sunDirection:{value:new F(.70707,.70707,0)},eye:{value:new F},waterColor:{value:new T(5592405)}}]),vertexShader:`
				uniform mat4 textureMatrix;
				uniform float time;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,fragmentShader:`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				void main() {

					#include <logdepthbuf_fragment>
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = 0.02;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), reflectionSample + specularLight, reflectance );
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},D=new De({name:W.name,uniforms:de.clone(W.uniforms),vertexShader:W.vertexShader,fragmentShader:W.fragmentShader,lights:!0,side:C,fog:S});D.uniforms.mirrorSampler.value=P.texture,D.uniforms.textureMatrix.value=f,D.uniforms.alpha.value=z,D.uniforms.time.value=p,D.uniforms.normalSampler.value=w,D.uniforms.sunColor.value=N,D.uniforms.waterColor.value=y,D.uniforms.sunDirection.value=k,D.uniforms.distortionScale.value=v,D.uniforms.eye.value=r,o.material=D,o.onBeforeRender=function(V,R,H){if(h.setFromMatrixPosition(o.matrixWorld),n.setFromMatrixPosition(H.matrixWorld),d.extractRotation(o.matrixWorld),x.set(0,0,1),x.applyMatrix4(d),m.subVectors(h,n),m.dot(x)>0)return;m.reflect(x).negate(),m.add(h),d.extractRotation(H.matrixWorld),g.set(0,0,-1),g.applyMatrix4(d),g.add(n),i.subVectors(h,g),i.reflect(x).negate(),i.add(h),b.position.copy(m),b.up.set(0,1,0),b.up.applyMatrix4(d),b.up.reflect(x),b.lookAt(i),b.far=H.far,b.updateMatrixWorld(),b.projectionMatrix.copy(H.projectionMatrix),f.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),f.multiply(b.projectionMatrix),f.multiply(b.matrixWorldInverse),_.setFromNormalAndCoplanarPoint(x,h),_.applyMatrix4(b.matrixWorldInverse),M.set(_.normal.x,_.normal.y,_.normal.z,_.constant);const A=b.projectionMatrix;u.x=(Math.sign(M.x)+A.elements[8])/A.elements[0],u.y=(Math.sign(M.y)+A.elements[9])/A.elements[5],u.z=-1,u.w=(1+A.elements[10])/A.elements[14],M.multiplyScalar(2/M.dot(u)),A.elements[2]=M.x,A.elements[6]=M.y,A.elements[10]=M.z+1-l,A.elements[14]=M.w,r.setFromMatrixPosition(H.matrixWorld);const Se=V.getRenderTarget(),ze=V.xr.enabled,Ce=V.shadowMap.autoUpdate;o.visible=!1,V.xr.enabled=!1,V.shadowMap.autoUpdate=!1,V.setRenderTarget(P),V.state.buffers.depth.setMask(!0),V.autoClear===!1&&V.clear(),V.render(R,b),o.visible=!0,V.xr.enabled=ze,V.shadowMap.autoUpdate=Ce,V.setRenderTarget(Se);const fe=H.viewport;fe!==void 0&&V.state.viewport(fe)}}}const ie=`${Te}
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
`,Ge=`
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
`,Be=`
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
`,te=24,oe=10,ae=10,I={xs:null,ds:null};function be(){const a=[],e=[];for(let l=40;l>0;l--)a.push(-140-1860*(l/40)**2);for(let l=0;l<=350;l++)a.push(-140+l*.8);for(let l=1;l<=40;l++)a.push(140+1860*(l/40)**2);for(let l=0;l<=186;l++)e.push(-5+l*.35);for(let l=1;l<=70;l++)e.push(60.1+2140*(l/70)**2);I.xs=a,I.ds=e;const t=[],o=[];for(const l of e)for(const z of a)t.push(z,-(B(z)-l),0);const s=a.length;for(let l=0;l<e.length-1;l++)for(let z=0;z<s-1;z++){const p=l*s+z,w=p+1,k=p+s,N=k+1;o.push(p,w,N,p,N,k)}const c=new me;return c.setAttribute("position",new L(t,3)),c.setIndex(o),c.computeVertexNormals(),c}function tt(a){const e=new Ee(be(),{textureWidth:512,textureHeight:512,sunDirection:a,sunColor:16774362,waterColor:556956,distortionScale:.55,fog:!0});return e.rotation.x=-Math.PI/2,e.frustumCulled=!1,e.name="lagoon-water",e.material.uniforms.wakeRings={value:Array.from({length:te},()=>new U)},e.material.uniforms.wadeRings={value:Array.from({length:oe},()=>new U)},e.material.uniforms.seaRings={value:Array.from({length:ae},()=>new U)},e.material.uniforms.seeDepth={value:null},e.material.uniforms.seeOn={value:0},e.material.uniforms.seeInv={value:new Fe(1,1)},e.material.uniforms.seeNear={value:.1},e.material.uniforms.seeFar={value:1e3},e.material.transparent=!0,e.material.premultipliedAlpha=!0,e.material.depthWrite=!0,e.material.vertexShader=`
 uniform mat4 textureMatrix;uniform float time;
 varying vec4 mirrorCoord;varying vec4 worldPosition;
 varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_vertex>
 #include <logdepthbuf_pars_vertex>
 ${ie}
 ${Ge}
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
 }`,e.material.fragmentShader=`
 uniform mat4 textureMatrix;uniform sampler2D mirrorSampler;uniform float time;uniform vec3 eye;uniform vec3 sunDirection;uniform vec3 sunColor;
 uniform vec4 wakeRings[${te}];uniform vec4 wadeRings[${oe}];uniform vec4 seaRings[${ae}];
 uniform sampler2D seeDepth;uniform float seeOn;uniform vec2 seeInv;uniform float seeNear;uniform float seeFar;
 varying vec4 mirrorCoord;varying vec4 worldPosition;varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <packing>
 #include <fog_pars_fragment>
 #include <logdepthbuf_pars_fragment>
 ${ie}
 ${Be}
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
  vec2 rip=vec2(0.);float wadeFoam=0.;
  for(int i=0;i<${te};i++){vec4 r=wakeRings[i];if(r.w<=.3)continue;vec2 q=worldPosition.xz-r.xy;float dist=length(q),age=time-r.z;
   float x=dist-min(.34*r.w,3.)*age;if(age<0.||abs(x)>2.||dist<.01)continue;
   float env=clamp((r.w-.3)/2.5,0.,1.)*exp(-x*x*1.4)*exp(-age*.35)/(1.+.12*dist);rip+=q/dist*cos(x*7.)*.55*env;}
  for(int i=0;i<${oe};i++){vec4 r=wadeRings[i];if(r.w<=0.)continue;vec2 q=worldPosition.xz-r.xy;float dist=length(q),age=time-r.z;
   float x=dist-.12-.42*age;if(age<0.||age>2.4||abs(x)>.5||dist<.01)continue;
   float env=r.w*exp(-x*x*16.)*exp(-age*1.1)/(1.+1.5*dist);rip+=q/dist*sin(x*18.)*.6*env;
   // A broken ring of foam pushed out by the leg, gone within a second.
   wadeFoam=max(wadeFoam,r.w*exp(-x*x*110.)*exp(-age*2.6)*smoothstep(.25,.55,waterNoise(worldPosition.xz*9.+r.z*7.)));}
  float seaFoam=0.;
  for(int i=0;i<${ae};i++){vec4 r=seaRings[i];if(r.w<=0.)continue;vec2 q=worldPosition.xz-r.xy;float dist=length(q),age=time-r.z;
   float lambda=.8+.6*r.w,life=3.+3.*r.w,x=dist-(1.2+sqrt(r.w))*age;if(age<0.||age>life||dist<.01)continue;
   float fade=exp(-age/life*2.5),env=min(r.w,2.5)*fade*exp(-x*x/(lambda*lambda*1.5))/(1.+.12*dist);
   if(abs(x)<2.5*lambda)rip+=q/dist*sin(x/lambda*6.2832)*.5*env;
   // White water: a ring of foam on the leading crest early on, and a patch where it went in that breaks up and thins.
   float lace=smoothstep(.3,.7,waterNoise(worldPosition.xz*2.3+r.z*3.1));
   seaFoam=max(seaFoam,exp(-x*x/(.08*lambda*lambda))*exp(-age*1.2)*min(1.,r.w*1.5)*lace);
   float entry=1.-smoothstep(.15*r.w+.25,.6*r.w+.6,dist);
   seaFoam=max(seaFoam,entry*smoothstep(life,.15*life,age)*min(1.,.4+r.w*.6)*smoothstep(.25+.5*age/life,.75,waterNoise(worldPosition.xz*1.7+r.z)));}
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
  vec3 sea=bottom*transmission+waterTint*(1.-transmission),sea0=sea;
  // The same water over the real bottom: its own light only (the caustics added on), the bottom left to the blend.
  vec3 seaClear=waterTint*(1.-transmission)+vec3(.62,.53,.39)*caustic*.14*exp(-depth*.55)*transmission;
  float crestTint=smoothstep(.03,.32,worldPosition.y)*(1.-smoothstep(10.,35.,coast));
  sea+=vec3(.005,.038,.027)*crestTint*max(dot(V,-sunDirection),0.);
  // Light through the swell: a wave's upper part is thin enough for sunlight to come through it green-blue, most
  // when looking towards the sun (backlit crests), a little from any side.
  vec2 swell=swellState(p,time);
  float thin=smoothstep(-.12,.35,swell.x)*smoothstep(0.,6.,coast);
  float backlit=pow(max(dot(normalize(vec3(-V.x,0.,-V.z)),normalize(vec3(sunDirection.x,0.,sunDirection.z))),0.),3.);
  sea+=vec3(.03,.3,.23)*thin*thin*(.3+.7*backlit)*(1.-fresnel);
  seaClear+=sea-sea0;float Fc=clamp(fresnel,0.,.97);
  vec3 color=mix(sea,reflected,Fc),colorClear=mix(seaClear,reflected,Fc);
  // Seen from above the water shows mostly its own colour, so a ripple's slope would hardly show: the faces
  // tilted towards the eye catch more sky and read lighter, the others darker.
  vec3 lit=vec3(.05,.09,.1)*clamp(dot(rip,normalize(-V.xz+1e-4))*2.5,-1.,1.);
  vec3 H=normalize(V+sunDirection);
  float glitter=pow(max(dot(N,H),0.),420.);
  lit+=sunColor*glitter*.85;color+=lit;colorClear+=lit;
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
  foam=max(foam,whitecap*.85);foam=max(foam,wadeFoam*.9);foam=max(foam,seaFoam*.9);
  vec3 foamColor=vec3(.88,.96,.94)*(.80+.24*max(dot(N,sunDirection),0.));
  float fm=clamp(foam,0.,.94);color=mix(color,foamColor,fm);colorClear=mix(colorClear,foamColor,fm);
  float clear=1.-smoothstep(.3,1.6,depth),through=.85*clear*dot(transmission,vec3(.2,.4,.4))*(1.-Fc)*(1.-fm);
  vec3 outColor=mix(color,colorClear,.85*clear);
  if(seeOn>.5){
   float animal=texture2D(seeDepth,gl_FragCoord.xy*seeInv).x;
   float waterZ=perspectiveDepthToViewZ(gl_FragCoord.z,seeNear,seeFar),animalZ=perspectiveDepthToViewZ(animal,seeNear,seeFar);
   float thick=(waterZ-animalZ)*distanceToEye/max(-waterZ,.001);
   if(animal<1.&&thick>0.&&thick<path){
    vec3 tc=exp(-vec3(.85,.24,.16)*thick);
    float w=.9*exp(-thick/2.6),see=w*dot(tc,vec3(.2,.4,.4))*(1.-.65*Fc)*(1.-fm);
    if(see>through){
     vec3 seeClear=colorClear+(1.-.65*Fc)*(1.-fm)*(waterTint*(1.-tc)-waterTint*(1.-transmission));
     outColor=mix(color,seeClear,w);through=see;
    }
   }
  }
  gl_FragColor=vec4(outColor,1.-through);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
 }`,e}function ot(a,e){a.onBeforeCompile=t=>{t.uniforms.time=e,t.vertexShader=`varying vec3 vWorld;
`+t.vertexShader,t.vertexShader=t.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
vWorld=(modelMatrix*vec4(position,1.)).xyz;`),t.fragmentShader=`uniform float time;varying vec3 vWorld;
`+ie+`
`+t.fragmentShader,t.fragmentShader=t.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
   float wet=wetSand(vWorld.xz,time);
   float grain=waterHash(vWorld.xz*173.);
   float ripple=sin(vWorld.x*2.2+sin(vWorld.z*.7)*2.+sin(vWorld.x*.3))*sin(vWorld.z*8.);
   diffuseColor.rgb*=mix(vec3(1.),vec3(.62,.57,.49),wet)*(.95+grain*.10+ripple*.025);
  `),t.fragmentShader=t.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
   float fresh=1.-smoothstep(swashFront(vWorld.x,time)-.1,swashFront(vWorld.x,time)+.6,vWorld.z-shore(vWorld.x));
   roughnessFactor=mix(.92,.33,wet);roughnessFactor=mix(roughnessFactor,.16,fresh);
  `),t.fragmentShader=t.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
   float phase=vWorld.z*15.+sin(vWorld.x*.8)*1.8+sin(vWorld.z*1.4);
   vec3 rippleNormal=vec3(cos(phase)*.012,0.,cos(phase)*.035);
   normal=normalize(normal+mat3(viewMatrix)*rippleNormal*(1.-wet*.8)*(.55+.45*sin(vWorld.x*.34)*sin(vWorld.z*.56))/(1.+length(vViewPosition)*.012));
  `),t.fragmentShader=t.fragmentShader.replace("#include <opaque_fragment>",`
   float wetFresnel=.02+.98*pow(1.-abs(dot(normal,normalize(vViewPosition))),5.);
   outgoingLight=mix(outgoingLight,vec3(.24,.44,.61),wet*wetFresnel*.35);
   #include <opaque_fragment>`)}}const Ie=[[.22,1,.29,19,.5],[-.38,1,.16,11.3,2.4],[.72,.69,.085,6.7,4.1],[-.81,.59,.045,3.8,1.1]].map(([a,e,t,o,s])=>{const c=Math.hypot(a,e),l=6.283185/o;return[a/c,e/c,t,l,Math.sqrt(9.81*l),s]}),q=(a,e,t)=>{const o=Math.max(0,Math.min(1,(t-a)/(e-a)));return o*o*(3-2*o)},G=a=>a-Math.floor(a);function Z(a,e){let t=G(a*.1031),o=G(e*.103),s=G(a*.0973);const c=t*(o+33.33)+o*(s+33.33)+s*(t+33.33);return t+=c,o+=c,s+=c,G((t+o)*s)}function Ue(a,e){const t=Math.floor(a),o=Math.floor(e),s=q(0,1,G(a)),c=q(0,1,G(e));return(Z(t,o)*(1-s)+Z(t+1,o)*s)*(1-c)+(Z(t,o+1)*(1-s)+Z(t+1,o+1)*s)*c}function je(a,e){const t=G((e*1.36+.42*Math.sin(a*.105)+.19*Math.sin(a*.29)-1.1)/6.283185);return-.35+(2.4+.45*Math.sin(a*.19)+.22*Math.sin(a*.57))*q(0,.28,t)*(1-q(.28,1,t))}function le(a,e,t,o){const s=B(a)-e,c=q(0,16,s)*(.68+.32*q(15,90,s))*(1-q(100,550,s))*(1-q(140,500,Math.abs(a)));let l=0,z=0,p=.035;for(let r=0;r<4;r++){const v=Ie[r],C=v[3]*(v[0]*a+v[1]*e)-v[4]*t+v[5],S=v[2]*c;l+=.62*S*v[0]*Math.cos(C),z+=.62*S*v[1]*Math.cos(C),p+=S*Math.sin(C)}const w=s*.68+t*1.36+.42*Math.sin(a*.105)+.19*Math.sin(a*.29),k=q(0,2.2,s)*(1-q(13,30,s));p+=(Math.sin(w)+.32*Math.sin(2*w))*.29*k;const N=Math.exp(-((Math.atan2(Math.sin(w-1.1),Math.cos(w-1.1))/.5)**2));p+=(Ue(a*2.3,e*2.3-t*.65)-.5)*.07*N*k,p=Math.max(p,-Math.max(s,0)*.12+.025);const y=-s;if(y>-.15){const r=.75*(1-Math.exp(-Math.max(y,0)/32))+.34*Math.exp(-(((y-5.2)/2.2)**2)),v=r+.012+.018*q(0,1,je(a,t)-y);p+=(v-p)*q(-.15,.12,y)}o.x=a+l,o.z=e+z,o.height=p}function re(a,e,t,o){let s=a,c=e;for(let l=0;l<4;l++)le(s,c,t,o),s+=a-o.x,c+=e-o.z;return le(s,c,t,o),o.height}const $={},ne=new Map;let pe=NaN;function Ze(a,e,t){t!==pe&&(ne.clear(),pe=t);const o=a*4096+e;let s=ne.get(o);if(!s){const c=I.xs[a];le(c,B(c)-I.ds[e],t,$),s={x:$.x,z:$.z,height:$.height},ne.set(o,s)}return s}function he(a,e){let t=0,o=a.length-2;for(;t<o;){const s=t+o+1>>1;a[s]<=e?t=s:o=s-1}return t}function at(a,e,t){I.xs||be();const{xs:o,ds:s}=I;let c=a,l=e,z=0;for(let p=0;p<5;p++){const w=he(o,c),k=he(s,B(c)-l),N=(h,n)=>[o[h],B(o[h])-s[n]],y=N(w,k),r=N(w+1,k),v=N(w,k+1),C=N(w+1,k+1);let S=null;for(const h of[[y,r,C,[w,k],[w+1,k],[w+1,k+1]],[y,C,v,[w,k],[w+1,k+1],[w,k+1]]]){const[n,d,g]=h,M=(d[0]-n[0])*(g[1]-n[1])-(g[0]-n[0])*(d[1]-n[1]),m=((c-n[0])*(g[1]-n[1])-(g[0]-n[0])*(l-n[1]))/M,i=((d[0]-n[0])*(l-n[1])-(c-n[0])*(d[1]-n[1]))/M,u=1-m-i,f=Math.min(u,m,i);(!S||f>S.worst)&&(S={worst:f,w:[u,m,i],ix:h.slice(3)})}let _=0,x=0;z=0;for(let h=0;h<3;h++){const n=Ze(...S.ix[h],t);_+=S.w[h]*n.x,x+=S.w[h]*n.z,z+=S.w[h]*n.height}c+=a-_,l+=e-x}return z}function rt(a,e,t,o){const s=re(a,e,t,o),c=re(a+.06,e,t,o),l=re(a,e+.06,t,o),z=(s-c)/.06,p=(s-l)/.06,w=Math.hypot(z,1,p);return o.x=a,o.z=e,o.height=s,o.nx=z/w,o.ny=1/w,o.nz=p/w,o}const J=a=>()=>{a|=0,a=a+1831565813|0;let e=Math.imul(a^a>>>15,1|a);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296},j=(a,e)=>{const t=Math.sin(a.x*12.9898+a.y*78.233+a.z*37.719+e)*43758.5453;return t-Math.floor(t)};function se(a,e,t){const o=J(a),s=[];for(let v=0;v<t;v++){let C=new Y(1,e);C.deleteAttribute("uv"),C.deleteAttribute("normal"),C=ge(C);const S=o()*Math.PI*2,_=v?.3+o()*.42:0,x=(v?.34+o()*.22:.55+o()*.1)*(t>5?.9:1.15),h=o()*100,n=.8+o()*.4,d=new F(Math.cos(S)*_,v?.22-_*.45+o()*.2:.22,Math.sin(S)*_),g=C.attributes.position,M=new F;for(let m=0;m<g.count;m++){M.fromBufferAttribute(g,m);const i=1+(j(M,h)-.5)*.5;M.multiplyScalar(x*i).add(d),g.setXYZ(m,M.x,M.y,M.z)}C.setAttribute("tint",new L(new Array(g.count).fill(n),1)),s.push(C)}const c=ye(s);c.computeVertexNormals();const l=c.attributes.position,z=c.attributes.normal,p=c.attributes.tint,w=new Ae().setFromBufferAttribute(l),k=new F(0,w.min.y*.4,0),N=[],y=new F,r=new F;for(let v=0;v<l.count;v++){y.fromBufferAttribute(l,v),r.fromBufferAttribute(z,v).lerp(y.clone().sub(k).normalize(),.55).normalize(),z.setXYZ(v,r.x,r.y,r.z);const C=(y.y-w.min.y)/(w.max.y-w.min.y),S=(.48+.64*C)*p.getX(v)*(.84+.28*j(y,a));N.push(S*.92,S,S*.85)}return c.setAttribute("color",new L(N,3)),c.deleteAttribute("tint"),c}function $e(a){const e=J(a),t=[],o=[],s=[],c=.12+e()*.16,l=6,z=9,p=x=>new F(c*x*x,x,0),w=p(1);for(let x=0;x<=z;x++){const h=x/z,n=p(h),d=.028-.012*h,g=.78+.22*Math.abs(Math.sin(x*2.7));for(let M=0;M<l;M++){const m=M/l*Math.PI*2;t.push(n.x+Math.cos(m)*d,n.y,n.z+Math.sin(m)*d);const i=.38*g;o.push(i*1.02,i*.95,i*.82)}}for(let x=0;x<z;x++)for(let h=0;h<l;h++){const n=x*l+h,d=x*l+(h+1)%l;s.push(n,d,n+l,d,d+l,n+l)}let k=t.length/3;const N=9+Math.floor(e()*4),y=10;for(let x=0;x<N;x++){const h=x/N*Math.PI*2+e()*.4,n=.45-e()*.85,d=.3+e()*.1,g=n<-.3,M=new F(Math.cos(h),0,Math.sin(h)),m=new F(-M.z,0,M.x),i=g?[.42,.42,.18]:[.26+e()*.06,.46+e()*.08,.14+e()*.05],u=[];for(let f=0;f<=y;f++){const b=f/y;u.push(w.clone().addScaledVector(M,d*b).add(new F(0,d*(n*b-.75*b*b),0)))}for(let f=0;f<y;f++){const b=u[f],P=u[f+1],W=d*.24*Math.sin(Math.PI*(f+.8)/(y+.6));for(const D of[-1,1]){const V=P.clone().addScaledVector(m,D*W).add(new F(0,-W*.6,0)).addScaledVector(M,d*.06);t.push(b.x,b.y,b.z,P.x,P.y,P.z,V.x,V.y,V.z);const R=.85+e()*.3;for(let H=0;H<3;H++){const A=H===2?.8:1;o.push(i[0]*R*A,i[1]*R*A,i[2]*R*A)}s.push(k,k+1,k+2),k+=3}}}const r=new me;r.setAttribute("position",new L(t,3)),r.setAttribute("color",new L(o,3)),r.setIndex(s);const v=[r.toNonIndexed()];for(let x=0;x<3;x++){const h=x*2.1+e(),n=new Y(.018,0).translate(w.x+Math.cos(h)*.022,w.y-.025,w.z+Math.sin(h)*.022);n.deleteAttribute("uv"),n.deleteAttribute("normal"),n.setAttribute("color",new L(Array.from({length:n.attributes.position.count},()=>[.35,.28,.12]).flat(),3)),v.push(n)}const C=ye(v);C.computeVertexNormals();const S=C.attributes.position,_=[];for(let x=0;x<S.count;x++){const h=S.getY(x),n=Math.hypot(S.getX(x)-w.x,S.getZ(x));_.push(h>.55?X.smoothstep(n,.035,.35):0)}return C.setAttribute("palmWind",new L(_,1)),C}function Xe(a){let e=new Y(1,1);e.deleteAttribute("uv"),e.deleteAttribute("normal"),e=ge(e);const t=e.attributes.position,o=new F,s=[];for(let c=0;c<t.count;c++){o.fromBufferAttribute(t,c),o.multiplyScalar(1+(j(o,a)-.5)*.45),o.y=Math.max(o.y*.7,-.25),t.setXYZ(c,o.x,o.y,o.z);const l=(.3+.16*(o.y+.25))*(.85+.3*j(o,a+1)),z=X.smoothstep(.02,-.15,o.y),p=X.smoothstep(.68,.85,j(o.clone().multiplyScalar(.6).floor(),a+2))*X.smoothstep(.1,.5,o.y),w=new T(l*1.02,l,l*.92).lerp(new T(.1,.17,.07),z*.85).lerp(new T(.24,.34,.11),p*.7);s.push(w.r,w.g,w.b)}return e.setAttribute("color",new L(s,3)),e.computeVertexNormals(),e}function Oe(a,e){const t=J(a),o=[],s=[],c=5,l=e?16:11;for(let p=0;p<l;p++){const w=p/l*Math.PI*2+t()*.5,k=e?.55+t()*.4:.25+t()*.5,N=e?.75+t()*.35:.45+t()*.25,y=e?.06:.2+t()*.08,r=e?0:.25+t()*.25,v=new F(Math.cos(w),0,Math.sin(w)),C=new F(-v.z,0,v.x),S=new F(0,r*.6,0).addScaledVector(v,r*.4),_=n=>S.clone().addScaledVector(v,N*n).add(new F(0,N*(k*n-(e?.9:.7)*n*n),0)),x=[.16+t()*.08,.36+t()*.12,.09+t()*.05],h=.8+t()*.4;if(r){const n=new F(0,0,0);for(const d of[[n,S,S.clone().addScaledVector(C,.02)]]){for(const g of d)o.push(g.x,g.y,g.z);for(let g=0;g<3;g++)s.push(.2,.3,.12)}}for(let n=0;n<c;n++){const d=n/c,g=(n+1)/c,M=y*Math.sin(Math.PI*Math.min(1,d*1.1+.02))*(e?1-d*.6:1),m=y*Math.sin(Math.PI*Math.min(1,g*1.1))*(e?1-g*.6:1),i=_(d),u=_(g),f=new F(0,y*.25,0);for(const b of[-1,1]){const P=i.clone().addScaledVector(C,b*M).add(f),W=u.clone().addScaledVector(C,b*m).add(f);o.push(i.x,i.y,i.z,u.x,u.y,u.z,W.x,W.y,W.z,i.x,i.y,i.z,W.x,W.y,W.z,P.x,P.y,P.z);const D=1.15+.2*g,V=.85+.2*g;for(const R of[D,D,V,D,V,V])s.push(x[0]*h*R,x[1]*h*R,x[2]*h*R)}}}const z=new me;return z.setAttribute("position",new L(o,3)),z.setAttribute("color",new L(s,3)),z.computeVertexNormals(),z}function Ye(){const a=new qe(.6,1,1,6,1,!0).translate(0,.5,0);return a.deleteAttribute("uv"),a.setAttribute("color",new L(Array.from({length:a.attributes.position.count},()=>[.36,.32,.26]).flat(),3)),a}function O(a){const e=a.onBeforeCompile;return a.onBeforeCompile=(t,o)=>{e&&e(t,o),t.fragmentShader=t.fragmentShader.replace("#include <fog_fragment>",`#ifdef USE_FOG
   gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,.62*(1.-exp(-max(0.,vFogDepth-80.)*.0022)));
   #endif
   #include <fog_fragment>`)},a}function Ke(){const a=new E({vertexColors:!0,roughness:.92});return a.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vLeaf;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vLeaf=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
   varying vec3 vLeaf;
   float leafHash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float leafNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(leafHash(i),leafHash(i+vec3(1,0,0)),f.x),mix(leafHash(i+vec3(0,1,0)),leafHash(i+vec3(1,1,0)),f.x),f.y),
     mix(mix(leafHash(i+vec3(0,0,1)),leafHash(i+vec3(1,0,1)),f.x),mix(leafHash(i+vec3(0,1,1)),leafHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`).replace("#include <color_fragment>",`#include <color_fragment>
   {float near=1.-smoothstep(25.,110.,length(vViewPosition));
    float n=leafNoise(vLeaf*2.2)*.65+leafNoise(vLeaf*5.3)*.35;
    diffuseColor.rgb*=mix(1.,.42+1.05*n,near);}`)},O(a)}function Je(a){const e={crownNear:[],crownFar:[],shrub:[],palm:[],trunk:[],boulder:[],plant:[]};function t({cx:s,cz:c,rx:l,rz:z,shape:p,rock:w,seed:k,detail:N,counts:y}){const r=J(k),v=new we,C=new T,S=(n,d)=>Math.hypot(p(n+1,d)-p(n-1,d),p(n,d+1)-p(n,d-1))/2,_=(n,d)=>Math.atan2(p(n,d+1)-p(n,d-1),-(p(n+1,d)-p(n-1,d))),x=n=>{for(let d=0;d<60;d++){const g=(r()-.5)*l*1.9,M=(r()-.5)*z*1.9,m=p(g,M);if(n(g,M,m)&&m>K(s+g,c+M)-.2)return[g,M,m]}return null},h=(n,d)=>{d(v,C),v.updateMatrix(),n.push([v.matrix.clone(),C.clone()])};for(let n=0;n<y.canopy;n++){const d=x((b,P,W)=>W>1.4&&(!w(b,P,W)||r()<.1)&&S(b,P)<1.6);if(!d)continue;const[g,M,m]=d,i=r()<.05,u=i?3.4+r()*1.4:1.4+r()*1.5,f=1+u*.4+r()*2.5+(i?4:0);h(N==="near"?e.crownNear:e.crownFar,(b,P)=>{b.position.set(s+g,m+f,c+M),b.scale.set(u*(1+r()*.25),u*(.8+r()*.3),u*(1+r()*.25)),b.rotation.set(0,r()*6.3,0);{const W=r();P.setHSL(.17+r()*.12,.38+r()*.24,W<.25?.17+r()*.06:.25+r()*.14)}}),(i||r()<.4)&&h(e.trunk,(b,P)=>{const W=.1+u*.05;b.position.set(s+g,m-.3,c+M),b.scale.set(W,f+.3,W),b.rotation.set((r()-.5)*.12,r()*6.3,(r()-.5)*.12),P.setRGB(1,1,1)})}for(let n=0;n<y.shrub;n++){const d=x((i,u,f)=>f>.5&&f<5&&S(i,u)<1.8||w(i,u,f)&&f>.8);if(!d)continue;const[g,M,m]=d;h(e.shrub,(i,u)=>{const f=.6+r()*1.1;i.position.set(s+g,m+f*.15,c+M),i.scale.set(f*1.3,f*(.55+r()*.3),f*1.2),i.rotation.set(0,r()*6.3,0),u.setHSL(.17+r()*.12,.38+r()*.2,.22+r()*.1)})}for(let n=0;n<y.palm;n++){const d=x((u,f,b)=>{const P=(u/l)**2+(f/z)**2;return n%3===0?b>4&&S(u,f)<1.3:b>.6&&b<8&&P>.5&&S(u,f)<1.4});if(!d)continue;const[g,M,m]=d,i=n%3!==0;h(e.palm,(u,f)=>{const b=i?7+r()*5:12+r()*6;u.position.set(s+g,m-.3,c+M),u.scale.setScalar(b),u.rotation.set(0,0,0),u.rotateY(_(g,M)+(r()-.5)*.6),u.rotateZ(-(i?.08+r()*.22:r()*.08));const P=.95+r()*.3;f.setRGB(P,P,P*.92)})}for(let n=0;n<(y.boulder||0);n++){const d=x((i,u,f)=>f>-.6&&f<1.6&&(i/l)**2+(u/z)**2<.99);if(!d)continue;const[g,M,m]=d;h(e.boulder,(i,u)=>{const f=.5+r()**2*2.2,b=f*(1+r()*.5),P=f*(.6+r()*.5),W=f*(1+r()*.4);i.position.set(s+g,m-f*.15,c+M),i.scale.set(b,P,W),i.rotation.set((r()-.5)*.3,r()*6.3,(r()-.5)*.3);const D=.8+r()*.4;r()<.25?u.setRGB(D*.85,D*1.02,D*.75):u.setRGB(D,D,D)})}for(let n=0;n<(y.plant||0);n++){const d=x((i,u,f)=>n%4===0?f>2&&f<12&&S(i,u)<1.5:f>.15&&f<3.2&&S(i,u)<1.6);if(!d)continue;const[g,M,m]=d;h(e.plant,(i,u)=>{const f=1+r()*1.4;i.position.set(s+g,m-.05,c+M),i.scale.set(f*(1+r()*.3),f*(.8+r()*.4),f*(1+r()*.3)),i.rotation.set((r()-.5)*.15,r()*6.3,(r()-.5)*.15),u.setHSL(.2+r()*.1,.3+r()*.2,.62+r()*.18)})}}function o(){const s=Ke(),c=O(new E({vertexColors:!0,roughness:.9})),l=O(new E({vertexColors:!0,roughness:.85,side:Ve})),z=[[e.crownNear,[11,23,37].map(p=>se(p,1,5)),s],[e.crownFar,[11,23].map(p=>se(p,0,4)),s],[e.shrub,[51,63].map(p=>se(p,0,4)),s],[e.palm,[71,83].map($e),l],[e.trunk,[Ye()],c],[e.boulder,[5,9].map(Xe),c],[e.plant,[[91,!1],[97,!0],[103,!1]].map(([p,w])=>Oe(p,w)),l]];for(const[p,w,k]of z){const N=w.map(y=>{const r=new xe(y,k,Math.max(1,Math.ceil(p.length/w.length)));return r.userData.palmWind=!!y.attributes.palmWind,r.count=0,r.castShadow=r.receiveShadow=!0,a.add(r),r});p.forEach(([y,r],v)=>{const C=N[v%N.length];C.setMatrixAt(C.count,y),C.setColorAt(C.count,r),C.count++});for(const y of N)y.instanceMatrix.needsUpdate=!0,y.instanceColor&&(y.instanceColor.needsUpdate=!0),y.computeBoundingSphere()}return Object.fromEntries(Object.entries(e).map(([p,w])=>[p,w.length]))}return{plant:t,finish:o}}function nt(a,e,t=!0){a?.traverse(o=>{if(!o.userData.palmWind)return;const s=o.material.clone(),c=o.material.onBeforeCompile,l={value:Number(t)};s.userData.palmWindEnabled=l,s.onBeforeCompile=(z,p)=>{c.call(s,z,p),z.uniforms.palmClock=e,z.uniforms.palmWindEnabled=l,z.vertexShader=`uniform float palmClock;uniform float palmWindEnabled;attribute float palmWind;
`+z.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
    float phase=palmClock*1.1+instanceMatrix[3].x*.07+instanceMatrix[3].z*.05;
    transformed.x+=palmWind*palmWindEnabled*.006*sin(phase+position.x*6.);transformed.z+=palmWind*palmWindEnabled*.004*sin(phase*.83+position.z*7.);`)},s.customProgramCacheKey=()=>"island-palm-wind",o.material=s})}const ce=[],Me=(a,e)=>{let t=-1/0;for(const o of ce){const s=a-o.cx,c=e-o.cz;(s/o.rx)**2+(c/o.rz)**2<1&&(t=Math.max(t,o.shape(s,c)))}return t},st=(a,e)=>Math.max(K(a,e),Me(a,e)),it=(a,e)=>Me(a,e)<=K(a,e)+.15;function lt(a){ce.length=0;let e=7921;const t=()=>(e=1664525*e+1013904223>>>0,e/4294967296),o=new ee;o.name="shared-coastal-landforms",a.add(o);function s(N,y,r,v,C){const S=(m,i)=>{const u=Math.max(0,1-(m/r)**2-(i/v)**2),f=m/r-.14,b=i/v+.1,P=Math.max(0,1-2.2*(f*f+b*b)),W=.1*Math.sin(m*.14+i*.06)+.07*Math.sin(m*.31-i*.22)+.05*Math.sin(m*.8+i*.5);return C*(.5*u**1.6+.5*P**1.7*u**.5)*(1+W)-.5},_=(m,i)=>Math.hypot(S(m+1,i)-S(m-1,i),S(m,i+1)-S(m,i-1))/2,x=(m,i,u)=>u>.35&&(u<1.3+1.6*(.5+.5*Math.sin(m*.37+i*.23)*Math.cos(i*.29-m*.11))||_(m,i)>1.25),h=new Re(r*2,v*2,140,90);h.rotateX(-Math.PI/2);const n=h.attributes.position,d=[];for(let m=0;m<n.count;m++){const i=n.getX(m),u=n.getZ(m),f=S(i,u);n.setY(m,f);const b=Math.sin(i*12.9898+u*78.233)*43758.5453,P=.8+.35*(b-Math.floor(b)),W=Math.sin(i*.9)*Math.sin(u*.7)*.5+.5,D=new T(f<.35?13482898:x(i,u,f)?f<1.2?4867646:6775386:W>.5?4148522:4937265);D.multiplyScalar(P),d.push(D.r,D.g,D.b)}h.setAttribute("color",new L(d,3)),h.computeVertexNormals();const g=new ve(h,O(new E({vertexColors:!0,roughness:1})));g.position.set(N,0,y),g.receiveShadow=!0,g.castShadow=!0,o.add(g);const M=(m,i)=>{const u=Math.max(0,1-(m/r)**2-(i/v)**2);return Math.pow(u,.7)*(C*(.7+.18*Math.sin(m*.14+i*.06)+.12*Math.sin(m*.31-i*.22))+2*Math.sin(m*.8+i*.5))-.5};for(let m=0;m<7881;m++)t();for(let m=0;m<3200;m++){const i=(t()-.5)*r*1.65,u=(t()-.5)*v*1.65;if(M(i,u)<3){m--;continue}for(let f=0;f<5;f++)t()}return{shape:S,rock:x}}const c=[[90,-340,105,40,29,"far",{canopy:3400,shrub:700,palm:170,boulder:320,plant:900},211],[114,-58,64,78,29,"near",{canopy:3100,shrub:900,palm:220,boulder:380,plant:1300},307]],l=new ee;l.name="island-vegetation",o.add(l);const z=Je(l);for(const[N,y,r,v,C,S,_,x]of c){const{shape:h,rock:n}=s(N,y,r,v,C);ce.push({cx:N,cz:y,rx:r,rz:v,shape:h}),z.plant({cx:N,cz:y,rx:r,rz:v,shape:h,rock:n,seed:x,detail:S,counts:_})}z.finish();const p=new ee;p.name="shared-tide-debris",a.add(p);const w=[new Le(1,7,4),new Y(1,0),new He(1,.12,4,7,3.5)],k=[new E({color:15655368}),new E({color:7237991}),new E({color:4801331})];for(let N=0;N<3;N++){const y=new xe(w[N],k[N],240),r=new we;for(let v=0;v<240;v++){const C=(t()-.5)*150,S=B(C)+3.8+t()*1.5+Math.sin(C*1.7)*.4,_=.045+t()*.1;r.position.set(C,K(C,S)+.025,S),r.scale.set(_*(N===2?2:1),_*.3,_*.7),r.rotation.set(0,t()*6,0),r.updateMatrix(),y.setMatrixAt(v,r.matrix)}y.castShadow=!0,p.add(y)}}export{ae as S,oe as W,lt as a,je as b,tt as c,at as d,it as e,rt as f,te as g,nt as h,Me as i,st as l,ot as s};
