import{M as pe,V,C as R,au as Ce,ah as J,c as Ne,h as Pe,i as ke,U as fe,aM as de,f as _e,G as De,a6 as X,e as ce,F as q,b as T,a4 as We,aj as ve,a1 as xe,a2 as Y,a7 as we,_ as ge,B as Ve,ad as Ae,I as Q,K as ee,t as Fe,aG as qe,a as Le}from"./url-CXY6qaJY.js";import{a as He,s as U,g as O}from"./props-AvDnjLea.js";class Re extends pe{constructor(e,t={}){super(e),this.isWater=!0;const a=this,i=t.textureWidth!==void 0?t.textureWidth:512,c=t.textureHeight!==void 0?t.textureHeight:512,l=t.clipBias!==void 0?t.clipBias:0,C=t.alpha!==void 0?t.alpha:1,p=t.time!==void 0?t.time:0,g=t.waterNormals!==void 0?t.waterNormals:null,k=t.sunDirection!==void 0?t.sunDirection:new V(.70707,.70707,0),P=new R(t.sunColor!==void 0?t.sunColor:16777215),y=new R(t.waterColor!==void 0?t.waterColor:8355711),r=t.eye!==void 0?t.eye:new V(0,0,0),v=t.distortionScale!==void 0?t.distortionScale:20,M=t.side!==void 0?t.side:Ce,d=t.fog!==void 0?t.fog:!1,N=new De,S=new V,w=new V,n=new V,h=new J,x=new V(0,0,-1),b=new X,m=new V,s=new V,f=new X,u=new J,z=new Ne,W=new Pe(i,c,{type:ke}),D={name:"MirrorShader",uniforms:fe.merge([de.fog,de.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new J},sunColor:{value:new R(8355711)},sunDirection:{value:new V(.70707,.70707,0)},eye:{value:new V},waterColor:{value:new R(5592405)}}]),vertexShader:`
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
				}`},_=new _e({name:D.name,uniforms:fe.clone(D.uniforms),vertexShader:D.vertexShader,fragmentShader:D.fragmentShader,lights:!0,side:M,fog:d});_.uniforms.mirrorSampler.value=W.texture,_.uniforms.textureMatrix.value=u,_.uniforms.alpha.value=C,_.uniforms.time.value=p,_.uniforms.normalSampler.value=g,_.uniforms.sunColor.value=P,_.uniforms.waterColor.value=y,_.uniforms.sunDirection.value=k,_.uniforms.distortionScale.value=v,_.uniforms.eye.value=r,a.material=_,a.onBeforeRender=function(A,H,B){if(w.setFromMatrixPosition(a.matrixWorld),n.setFromMatrixPosition(B.matrixWorld),h.extractRotation(a.matrixWorld),S.set(0,0,1),S.applyMatrix4(h),m.subVectors(w,n),m.dot(S)>0)return;m.reflect(S).negate(),m.add(w),h.extractRotation(B.matrixWorld),x.set(0,0,-1),x.applyMatrix4(h),x.add(n),s.subVectors(w,x),s.reflect(S).negate(),s.add(w),z.position.copy(m),z.up.set(0,1,0),z.up.applyMatrix4(h),z.up.reflect(S),z.lookAt(s),z.far=B.far,z.updateMatrixWorld(),z.projectionMatrix.copy(B.projectionMatrix),u.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),u.multiply(z.projectionMatrix),u.multiply(z.matrixWorldInverse),N.setFromNormalAndCoplanarPoint(S,w),N.applyMatrix4(z.matrixWorldInverse),b.set(N.normal.x,N.normal.y,N.normal.z,N.constant);const L=z.projectionMatrix;f.x=(Math.sign(b.x)+L.elements[8])/L.elements[0],f.y=(Math.sign(b.y)+L.elements[9])/L.elements[5],f.z=-1,f.w=(1+L.elements[10])/L.elements[14],b.multiplyScalar(2/b.dot(f)),L.elements[2]=b.x,L.elements[6]=b.y,L.elements[10]=b.z+1-l,L.elements[14]=b.w,r.setFromMatrixPosition(B.matrixWorld);const Me=A.getRenderTarget(),Se=A.xr.enabled,ze=A.shadowMap.autoUpdate;a.visible=!1,A.xr.enabled=!1,A.shadowMap.autoUpdate=!1,A.setRenderTarget(W),A.state.buffers.depth.setMask(!0),A.autoClear===!1&&A.clear(),A.render(H,z),a.visible=!0,A.xr.enabled=Se,A.shadowMap.autoUpdate=ze,A.setRenderTarget(Me);const me=B.viewport;me!==void 0&&A.state.viewport(me)}}}const ne=`${He}
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
`,Te=`
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
`,Ge=`
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
`,te=24,oe=10,E={xs:null,ds:null};function ye(){const o=[],e=[];for(let l=40;l>0;l--)o.push(-140-1860*(l/40)**2);for(let l=0;l<=350;l++)o.push(-140+l*.8);for(let l=1;l<=40;l++)o.push(140+1860*(l/40)**2);for(let l=0;l<=186;l++)e.push(-5+l*.35);for(let l=1;l<=70;l++)e.push(60.1+2140*(l/70)**2);E.xs=o,E.ds=e;const t=[],a=[];for(const l of e)for(const C of o)t.push(C,-(U(C)-l),0);const i=o.length;for(let l=0;l<e.length-1;l++)for(let C=0;C<i-1;C++){const p=l*i+C,g=p+1,k=p+i,P=k+1;a.push(p,g,P,p,P,k)}const c=new ce;return c.setAttribute("position",new q(t,3)),c.setIndex(a),c.computeVertexNormals(),c}function Qe(o){const e=new Re(ye(),{textureWidth:512,textureHeight:512,sunDirection:o,sunColor:16774362,waterColor:556956,distortionScale:.55,fog:!0});return e.rotation.x=-Math.PI/2,e.frustumCulled=!1,e.name="lagoon-water",e.material.uniforms.wakeRings={value:Array.from({length:te},()=>new X)},e.material.uniforms.wadeRings={value:Array.from({length:oe},()=>new X)},e.material.transparent=!0,e.material.premultipliedAlpha=!0,e.material.depthWrite=!0,e.material.vertexShader=`
 uniform mat4 textureMatrix;uniform float time;
 varying vec4 mirrorCoord;varying vec4 worldPosition;
 varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_vertex>
 #include <logdepthbuf_pars_vertex>
 ${ne}
 ${Te}
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
 uniform vec4 wakeRings[${te}];uniform vec4 wadeRings[${oe}];
 varying vec4 mirrorCoord;varying vec4 worldPosition;varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_fragment>
 #include <logdepthbuf_pars_fragment>
 ${ne}
 ${Ge}
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
  foam=max(foam,whitecap*.85);foam=max(foam,wadeFoam*.9);
  vec3 foamColor=vec3(.88,.96,.94)*(.80+.24*max(dot(N,sunDirection),0.));
  float fm=clamp(foam,0.,.94);color=mix(color,foamColor,fm);colorClear=mix(colorClear,foamColor,fm);
  float clear=1.-smoothstep(.3,1.6,depth),through=.85*clear*dot(transmission,vec3(.2,.4,.4))*(1.-Fc)*(1.-fm);
  gl_FragColor=vec4(mix(color,colorClear,.85*clear),1.-through);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
 }`,e}function et(o,e){o.onBeforeCompile=t=>{t.uniforms.time=e,t.vertexShader=`varying vec3 vWorld;
`+t.vertexShader,t.vertexShader=t.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
vWorld=(modelMatrix*vec4(position,1.)).xyz;`),t.fragmentShader=`uniform float time;varying vec3 vWorld;
`+ne+`
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
   #include <opaque_fragment>`)}}const Be=[[.22,1,.29,19,.5],[-.38,1,.16,11.3,2.4],[.72,.69,.085,6.7,4.1],[-.81,.59,.045,3.8,1.1]].map(([o,e,t,a,i])=>{const c=Math.hypot(o,e),l=6.283185/a;return[o/c,e/c,t,l,Math.sqrt(9.81*l),i]}),F=(o,e,t)=>{const a=Math.max(0,Math.min(1,(t-o)/(e-o)));return a*a*(3-2*a)},G=o=>o-Math.floor(o);function j(o,e){let t=G(o*.1031),a=G(e*.103),i=G(o*.0973);const c=t*(a+33.33)+a*(i+33.33)+i*(t+33.33);return t+=c,a+=c,i+=c,G((t+a)*i)}function Ue(o,e){const t=Math.floor(o),a=Math.floor(e),i=F(0,1,G(o)),c=F(0,1,G(e));return(j(t,a)*(1-i)+j(t+1,a)*i)*(1-c)+(j(t,a+1)*(1-i)+j(t+1,a+1)*i)*c}function Ee(o,e){const t=G((e*1.36+.42*Math.sin(o*.105)+.19*Math.sin(o*.29)-1.1)/6.283185);return-.35+(2.4+.45*Math.sin(o*.19)+.22*Math.sin(o*.57))*F(0,.28,t)*(1-F(.28,1,t))}function ie(o,e,t,a){const i=U(o)-e,c=F(0,16,i)*(.68+.32*F(15,90,i))*(1-F(100,550,i))*(1-F(140,500,Math.abs(o)));let l=0,C=0,p=.035;for(let r=0;r<4;r++){const v=Be[r],M=v[3]*(v[0]*o+v[1]*e)-v[4]*t+v[5],d=v[2]*c;l+=.62*d*v[0]*Math.cos(M),C+=.62*d*v[1]*Math.cos(M),p+=d*Math.sin(M)}const g=i*.68+t*1.36+.42*Math.sin(o*.105)+.19*Math.sin(o*.29),k=F(0,2.2,i)*(1-F(13,30,i));p+=(Math.sin(g)+.32*Math.sin(2*g))*.29*k;const P=Math.exp(-((Math.atan2(Math.sin(g-1.1),Math.cos(g-1.1))/.5)**2));p+=(Ue(o*2.3,e*2.3-t*.65)-.5)*.07*P*k,p=Math.max(p,-Math.max(i,0)*.12+.025);const y=-i;if(y>-.15){const r=.75*(1-Math.exp(-Math.max(y,0)/32))+.34*Math.exp(-(((y-5.2)/2.2)**2)),v=r+.012+.018*F(0,1,Ee(o,t)-y);p+=(v-p)*F(-.15,.12,y)}a.x=o+l,a.z=e+C,a.height=p}function ae(o,e,t,a){let i=o,c=e;for(let l=0;l<4;l++)ie(i,c,t,a),i+=o-a.x,c+=e-a.z;return ie(i,c,t,a),a.height}const $={},re=new Map;let ue=NaN;function Ie(o,e,t){t!==ue&&(re.clear(),ue=t);const a=o*4096+e;let i=re.get(a);if(!i){const c=E.xs[o];ie(c,U(c)-E.ds[e],t,$),i={x:$.x,z:$.z,height:$.height},re.set(a,i)}return i}function he(o,e){let t=0,a=o.length-2;for(;t<a;){const i=t+a+1>>1;o[i]<=e?t=i:a=i-1}return t}function tt(o,e,t){E.xs||ye();const{xs:a,ds:i}=E;let c=o,l=e,C=0;for(let p=0;p<5;p++){const g=he(a,c),k=he(i,U(c)-l),P=(w,n)=>[a[w],U(a[w])-i[n]],y=P(g,k),r=P(g+1,k),v=P(g,k+1),M=P(g+1,k+1);let d=null;for(const w of[[y,r,M,[g,k],[g+1,k],[g+1,k+1]],[y,M,v,[g,k],[g+1,k+1],[g,k+1]]]){const[n,h,x]=w,b=(h[0]-n[0])*(x[1]-n[1])-(x[0]-n[0])*(h[1]-n[1]),m=((c-n[0])*(x[1]-n[1])-(x[0]-n[0])*(l-n[1]))/b,s=((h[0]-n[0])*(l-n[1])-(c-n[0])*(h[1]-n[1]))/b,f=1-m-s,u=Math.min(f,m,s);(!d||u>d.worst)&&(d={worst:u,w:[f,m,s],ix:w.slice(3)})}let N=0,S=0;C=0;for(let w=0;w<3;w++){const n=Ie(...d.ix[w],t);N+=d.w[w]*n.x,S+=d.w[w]*n.z,C+=d.w[w]*n.height}c+=o-N,l+=e-S}return C}function ot(o,e,t,a){const i=ae(o,e,t,a),c=ae(o+.06,e,t,a),l=ae(o,e+.06,t,a),C=(i-c)/.06,p=(i-l)/.06,g=Math.hypot(C,1,p);return a.x=o,a.z=e,a.height=i,a.nx=C/g,a.ny=1/g,a.nz=p/g,a}const K=o=>()=>{o|=0,o=o+1831565813|0;let e=Math.imul(o^o>>>15,1|o);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296},I=(o,e)=>{const t=Math.sin(o.x*12.9898+o.y*78.233+o.z*37.719+e)*43758.5453;return t-Math.floor(t)};function se(o,e,t){const a=K(o),i=[];for(let v=0;v<t;v++){let M=new Y(1,e);M.deleteAttribute("uv"),M.deleteAttribute("normal"),M=we(M);const d=a()*Math.PI*2,N=v?.3+a()*.42:0,S=(v?.34+a()*.22:.55+a()*.1)*(t>5?.9:1.15),w=a()*100,n=.8+a()*.4,h=new V(Math.cos(d)*N,v?.22-N*.45+a()*.2:.22,Math.sin(d)*N),x=M.attributes.position,b=new V;for(let m=0;m<x.count;m++){b.fromBufferAttribute(x,m);const s=1+(I(b,w)-.5)*.5;b.multiplyScalar(S*s).add(h),x.setXYZ(m,b.x,b.y,b.z)}M.setAttribute("tint",new q(new Array(x.count).fill(n),1)),i.push(M)}const c=ge(i);c.computeVertexNormals();const l=c.attributes.position,C=c.attributes.normal,p=c.attributes.tint,g=new Ve().setFromBufferAttribute(l),k=new V(0,g.min.y*.4,0),P=[],y=new V,r=new V;for(let v=0;v<l.count;v++){y.fromBufferAttribute(l,v),r.fromBufferAttribute(C,v).lerp(y.clone().sub(k).normalize(),.55).normalize(),C.setXYZ(v,r.x,r.y,r.z);const M=(y.y-g.min.y)/(g.max.y-g.min.y),d=(.48+.64*M)*p.getX(v)*(.84+.28*I(y,o));P.push(d*.92,d,d*.85)}return c.setAttribute("color",new q(P,3)),c.deleteAttribute("tint"),c}function je(o){const e=K(o),t=[],a=[],i=[],c=.12+e()*.16,l=6,C=9,p=d=>new V(c*d*d,d,0),g=p(1);for(let d=0;d<=C;d++){const N=d/C,S=p(N),w=.028-.012*N,n=.78+.22*Math.abs(Math.sin(d*2.7));for(let h=0;h<l;h++){const x=h/l*Math.PI*2;t.push(S.x+Math.cos(x)*w,S.y,S.z+Math.sin(x)*w);const b=.38*n;a.push(b*1.02,b*.95,b*.82)}}for(let d=0;d<C;d++)for(let N=0;N<l;N++){const S=d*l+N,w=d*l+(N+1)%l;i.push(S,w,S+l,w,w+l,S+l)}let k=t.length/3;const P=9+Math.floor(e()*4),y=10;for(let d=0;d<P;d++){const N=d/P*Math.PI*2+e()*.4,S=.45-e()*.85,w=.3+e()*.1,n=S<-.3,h=new V(Math.cos(N),0,Math.sin(N)),x=new V(-h.z,0,h.x),b=n?[.42,.42,.18]:[.26+e()*.06,.46+e()*.08,.14+e()*.05],m=[];for(let s=0;s<=y;s++){const f=s/y;m.push(g.clone().addScaledVector(h,w*f).add(new V(0,w*(S*f-.75*f*f),0)))}for(let s=0;s<y;s++){const f=m[s],u=m[s+1],z=w*.24*Math.sin(Math.PI*(s+.8)/(y+.6));for(const W of[-1,1]){const D=u.clone().addScaledVector(x,W*z).add(new V(0,-z*.6,0)).addScaledVector(h,w*.06);t.push(f.x,f.y,f.z,u.x,u.y,u.z,D.x,D.y,D.z);const _=.85+e()*.3;for(let A=0;A<3;A++){const H=A===2?.8:1;a.push(b[0]*_*H,b[1]*_*H,b[2]*_*H)}i.push(k,k+1,k+2),k+=3}}}const r=new ce;r.setAttribute("position",new q(t,3)),r.setAttribute("color",new q(a,3)),r.setIndex(i);const v=[r.toNonIndexed()];for(let d=0;d<3;d++){const N=d*2.1+e(),S=new Y(.018,0).translate(g.x+Math.cos(N)*.022,g.y-.025,g.z+Math.sin(N)*.022);S.deleteAttribute("uv"),S.deleteAttribute("normal"),S.setAttribute("color",new q(Array.from({length:S.attributes.position.count},()=>[.35,.28,.12]).flat(),3)),v.push(S)}const M=ge(v);return M.computeVertexNormals(),M}function $e(o){let e=new Y(1,1);e.deleteAttribute("uv"),e.deleteAttribute("normal"),e=we(e);const t=e.attributes.position,a=new V,i=[];for(let c=0;c<t.count;c++){a.fromBufferAttribute(t,c),a.multiplyScalar(1+(I(a,o)-.5)*.45),a.y=Math.max(a.y*.7,-.25),t.setXYZ(c,a.x,a.y,a.z);const l=(.3+.16*(a.y+.25))*(.85+.3*I(a,o+1)),C=Q.smoothstep(.02,-.15,a.y),p=Q.smoothstep(.68,.85,I(a.clone().multiplyScalar(.6).floor(),o+2))*Q.smoothstep(.1,.5,a.y),g=new R(l*1.02,l,l*.92).lerp(new R(.1,.17,.07),C*.85).lerp(new R(.24,.34,.11),p*.7);i.push(g.r,g.g,g.b)}return e.setAttribute("color",new q(i,3)),e.computeVertexNormals(),e}function Xe(o,e){const t=K(o),a=[],i=[],c=5,l=e?16:11;for(let p=0;p<l;p++){const g=p/l*Math.PI*2+t()*.5,k=e?.55+t()*.4:.25+t()*.5,P=e?.75+t()*.35:.45+t()*.25,y=e?.06:.2+t()*.08,r=e?0:.25+t()*.25,v=new V(Math.cos(g),0,Math.sin(g)),M=new V(-v.z,0,v.x),d=new V(0,r*.6,0).addScaledVector(v,r*.4),N=n=>d.clone().addScaledVector(v,P*n).add(new V(0,P*(k*n-(e?.9:.7)*n*n),0)),S=[.16+t()*.08,.36+t()*.12,.09+t()*.05],w=.8+t()*.4;if(r){const n=new V(0,0,0);for(const h of[[n,d,d.clone().addScaledVector(M,.02)]]){for(const x of h)a.push(x.x,x.y,x.z);for(let x=0;x<3;x++)i.push(.2,.3,.12)}}for(let n=0;n<c;n++){const h=n/c,x=(n+1)/c,b=y*Math.sin(Math.PI*Math.min(1,h*1.1+.02))*(e?1-h*.6:1),m=y*Math.sin(Math.PI*Math.min(1,x*1.1))*(e?1-x*.6:1),s=N(h),f=N(x),u=new V(0,y*.25,0);for(const z of[-1,1]){const W=s.clone().addScaledVector(M,z*b).add(u),D=f.clone().addScaledVector(M,z*m).add(u);a.push(s.x,s.y,s.z,f.x,f.y,f.z,D.x,D.y,D.z,s.x,s.y,s.z,D.x,D.y,D.z,W.x,W.y,W.z);const _=1.15+.2*x,A=.85+.2*x;for(const H of[_,_,A,_,A,A])i.push(S[0]*w*H,S[1]*w*H,S[2]*w*H)}}}const C=new ce;return C.setAttribute("position",new q(a,3)),C.setAttribute("color",new q(i,3)),C.computeVertexNormals(),C}function Ze(){const o=new Ae(.6,1,1,6,1,!0).translate(0,.5,0);return o.deleteAttribute("uv"),o.setAttribute("color",new q(Array.from({length:o.attributes.position.count},()=>[.36,.32,.26]).flat(),3)),o}function Z(o){const e=o.onBeforeCompile;return o.onBeforeCompile=(t,a)=>{e&&e(t,a),t.fragmentShader=t.fragmentShader.replace("#include <fog_fragment>",`#ifdef USE_FOG
   gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,.62*(1.-exp(-max(0.,vFogDepth-80.)*.0022)));
   #endif
   #include <fog_fragment>`)},o}function Ye(){const o=new T({vertexColors:!0,roughness:.92});return o.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vLeaf;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vLeaf=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
   varying vec3 vLeaf;
   float leafHash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float leafNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(leafHash(i),leafHash(i+vec3(1,0,0)),f.x),mix(leafHash(i+vec3(0,1,0)),leafHash(i+vec3(1,1,0)),f.x),f.y),
     mix(mix(leafHash(i+vec3(0,0,1)),leafHash(i+vec3(1,0,1)),f.x),mix(leafHash(i+vec3(0,1,1)),leafHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`).replace("#include <color_fragment>",`#include <color_fragment>
   {float near=1.-smoothstep(25.,110.,length(vViewPosition));
    float n=leafNoise(vLeaf*2.2)*.65+leafNoise(vLeaf*5.3)*.35;
    diffuseColor.rgb*=mix(1.,.42+1.05*n,near);}`)},Z(o)}function Oe(o){const e={crownNear:[],crownFar:[],shrub:[],palm:[],trunk:[],boulder:[],plant:[]};function t({cx:i,cz:c,rx:l,rz:C,shape:p,rock:g,seed:k,detail:P,counts:y}){const r=K(k),v=new xe,M=new R,d=(n,h)=>Math.hypot(p(n+1,h)-p(n-1,h),p(n,h+1)-p(n,h-1))/2,N=(n,h)=>Math.atan2(p(n,h+1)-p(n,h-1),-(p(n+1,h)-p(n-1,h))),S=n=>{for(let h=0;h<60;h++){const x=(r()-.5)*l*1.9,b=(r()-.5)*C*1.9,m=p(x,b);if(n(x,b,m)&&m>O(i+x,c+b)-.2)return[x,b,m]}return null},w=(n,h)=>{h(v,M),v.updateMatrix(),n.push([v.matrix.clone(),M.clone()])};for(let n=0;n<y.canopy;n++){const h=S((z,W,D)=>D>1.4&&(!g(z,W,D)||r()<.1)&&d(z,W)<1.6);if(!h)continue;const[x,b,m]=h,s=r()<.05,f=s?3.4+r()*1.4:1.4+r()*1.5,u=1+f*.4+r()*2.5+(s?4:0);w(P==="near"?e.crownNear:e.crownFar,(z,W)=>{z.position.set(i+x,m+u,c+b),z.scale.set(f*(1+r()*.25),f*(.8+r()*.3),f*(1+r()*.25)),z.rotation.set(0,r()*6.3,0);{const D=r();W.setHSL(.17+r()*.12,.38+r()*.24,D<.25?.17+r()*.06:.25+r()*.14)}}),(s||r()<.4)&&w(e.trunk,(z,W)=>{const D=.1+f*.05;z.position.set(i+x,m-.3,c+b),z.scale.set(D,u+.3,D),z.rotation.set((r()-.5)*.12,r()*6.3,(r()-.5)*.12),W.setRGB(1,1,1)})}for(let n=0;n<y.shrub;n++){const h=S((s,f,u)=>u>.5&&u<5&&d(s,f)<1.8||g(s,f,u)&&u>.8);if(!h)continue;const[x,b,m]=h;w(e.shrub,(s,f)=>{const u=.6+r()*1.1;s.position.set(i+x,m+u*.15,c+b),s.scale.set(u*1.3,u*(.55+r()*.3),u*1.2),s.rotation.set(0,r()*6.3,0),f.setHSL(.17+r()*.12,.38+r()*.2,.22+r()*.1)})}for(let n=0;n<y.palm;n++){const h=S((f,u,z)=>{const W=(f/l)**2+(u/C)**2;return n%3===0?z>4&&d(f,u)<1.3:z>.6&&z<8&&W>.5&&d(f,u)<1.4});if(!h)continue;const[x,b,m]=h,s=n%3!==0;w(e.palm,(f,u)=>{const z=s?7+r()*5:12+r()*6;f.position.set(i+x,m-.3,c+b),f.scale.setScalar(z),f.rotation.set(0,0,0),f.rotateY(N(x,b)+(r()-.5)*.6),f.rotateZ(-(s?.08+r()*.22:r()*.08));const W=.95+r()*.3;u.setRGB(W,W,W*.92)})}for(let n=0;n<(y.boulder||0);n++){const h=S((s,f,u)=>u>-.6&&u<1.6&&(s/l)**2+(f/C)**2<.99);if(!h)continue;const[x,b,m]=h;w(e.boulder,(s,f)=>{const u=.5+r()**2*2.2,z=u*(1+r()*.5),W=u*(.6+r()*.5),D=u*(1+r()*.4);s.position.set(i+x,m-u*.15,c+b),s.scale.set(z,W,D),s.rotation.set((r()-.5)*.3,r()*6.3,(r()-.5)*.3);const _=.8+r()*.4;r()<.25?f.setRGB(_*.85,_*1.02,_*.75):f.setRGB(_,_,_)})}for(let n=0;n<(y.plant||0);n++){const h=S((s,f,u)=>n%4===0?u>2&&u<12&&d(s,f)<1.5:u>.15&&u<3.2&&d(s,f)<1.6);if(!h)continue;const[x,b,m]=h;w(e.plant,(s,f)=>{const u=1+r()*1.4;s.position.set(i+x,m-.05,c+b),s.scale.set(u*(1+r()*.3),u*(.8+r()*.4),u*(1+r()*.3)),s.rotation.set((r()-.5)*.15,r()*6.3,(r()-.5)*.15),f.setHSL(.2+r()*.1,.3+r()*.2,.62+r()*.18)})}}function a(){const i=Ye(),c=Z(new T({vertexColors:!0,roughness:.9})),l=Z(new T({vertexColors:!0,roughness:.85,side:We})),C=[[e.crownNear,[11,23,37].map(p=>se(p,1,5)),i],[e.crownFar,[11,23].map(p=>se(p,0,4)),i],[e.shrub,[51,63].map(p=>se(p,0,4)),i],[e.palm,[71,83].map(je),l],[e.trunk,[Ze()],c],[e.boulder,[5,9].map($e),c],[e.plant,[[91,!1],[97,!0],[103,!1]].map(([p,g])=>Xe(p,g)),l]];for(const[p,g,k]of C){const P=g.map(y=>{const r=new ve(y,k,Math.max(1,Math.ceil(p.length/g.length)));return r.count=0,r.castShadow=r.receiveShadow=!0,o.add(r),r});p.forEach(([y,r],v)=>{const M=P[v%P.length];M.setMatrixAt(M.count,y),M.setColorAt(M.count,r),M.count++});for(const y of P)y.instanceMatrix.needsUpdate=!0,y.instanceColor&&(y.instanceColor.needsUpdate=!0),y.computeBoundingSphere()}return Object.fromEntries(Object.entries(e).map(([p,g])=>[p,g.length]))}return{plant:t,finish:a}}const le=[],be=(o,e)=>{let t=-1/0;for(const a of le){const i=o-a.cx,c=e-a.cz;(i/a.rx)**2+(c/a.rz)**2<1&&(t=Math.max(t,a.shape(i,c)))}return t},at=(o,e)=>Math.max(O(o,e),be(o,e)),rt=(o,e)=>be(o,e)<=O(o,e)+.15;function st(o){le.length=0;let e=7921;const t=()=>(e=1664525*e+1013904223>>>0,e/4294967296),a=new ee;a.name="shared-coastal-landforms",o.add(a);function i(P,y,r,v,M){const d=(m,s)=>{const f=Math.max(0,1-(m/r)**2-(s/v)**2),u=m/r-.14,z=s/v+.1,W=Math.max(0,1-2.2*(u*u+z*z)),D=.1*Math.sin(m*.14+s*.06)+.07*Math.sin(m*.31-s*.22)+.05*Math.sin(m*.8+s*.5);return M*(.5*f**1.6+.5*W**1.7*f**.5)*(1+D)-.5},N=(m,s)=>Math.hypot(d(m+1,s)-d(m-1,s),d(m,s+1)-d(m,s-1))/2,S=(m,s,f)=>f>.35&&(f<1.3+1.6*(.5+.5*Math.sin(m*.37+s*.23)*Math.cos(s*.29-m*.11))||N(m,s)>1.25),w=new Le(r*2,v*2,140,90);w.rotateX(-Math.PI/2);const n=w.attributes.position,h=[];for(let m=0;m<n.count;m++){const s=n.getX(m),f=n.getZ(m),u=d(s,f);n.setY(m,u);const z=Math.sin(s*12.9898+f*78.233)*43758.5453,W=.8+.35*(z-Math.floor(z)),D=Math.sin(s*.9)*Math.sin(f*.7)*.5+.5,_=new R(u<.35?13482898:S(s,f,u)?u<1.2?4867646:6775386:D>.5?4148522:4937265);_.multiplyScalar(W),h.push(_.r,_.g,_.b)}w.setAttribute("color",new q(h,3)),w.computeVertexNormals();const x=new pe(w,Z(new T({vertexColors:!0,roughness:1})));x.position.set(P,0,y),x.receiveShadow=!0,x.castShadow=!0,a.add(x);const b=(m,s)=>{const f=Math.max(0,1-(m/r)**2-(s/v)**2);return Math.pow(f,.7)*(M*(.7+.18*Math.sin(m*.14+s*.06)+.12*Math.sin(m*.31-s*.22))+2*Math.sin(m*.8+s*.5))-.5};for(let m=0;m<7881;m++)t();for(let m=0;m<3200;m++){const s=(t()-.5)*r*1.65,f=(t()-.5)*v*1.65;if(b(s,f)<3){m--;continue}for(let u=0;u<5;u++)t()}return{shape:d,rock:S}}const c=[[90,-340,105,40,29,"far",{canopy:3400,shrub:700,palm:170,boulder:320,plant:900},211],[114,-58,64,78,29,"near",{canopy:3100,shrub:900,palm:220,boulder:380,plant:1300},307]],l=new ee;l.name="island-vegetation",a.add(l);const C=Oe(l);for(const[P,y,r,v,M,d,N,S]of c){const{shape:w,rock:n}=i(P,y,r,v,M);le.push({cx:P,cz:y,rx:r,rz:v,shape:w}),C.plant({cx:P,cz:y,rx:r,rz:v,shape:w,rock:n,seed:S,detail:d,counts:N})}C.finish();const p=new ee;p.name="shared-tide-debris",o.add(p);const g=[new Fe(1,7,4),new Y(1,0),new qe(1,.12,4,7,3.5)],k=[new T({color:15655368}),new T({color:7237991}),new T({color:4801331})];for(let P=0;P<3;P++){const y=new ve(g[P],k[P],240),r=new xe;for(let v=0;v<240;v++){const M=(t()-.5)*150,d=U(M)+3.8+t()*1.5+Math.sin(M*1.7)*.4,N=.045+t()*.1;r.position.set(M,O(M,d)+.025,d),r.scale.set(N*(P===2?2:1),N*.3,N*.7),r.rotation.set(0,t()*6,0),r.updateMatrix(),y.setMatrixAt(v,r.matrix)}y.castShadow=!0,p.add(y)}}export{oe as W,st as a,Ee as b,Qe as c,tt as d,rt as e,ot as f,te as g,be as i,at as l,et as s};
