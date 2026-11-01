import{M as ve,V as F,C as E,ao as Ce,a5 as Q,c as De,h as Pe,i as We,U as he,aO as de,f as _e,G as Fe,a4 as U,g as qe,ab as we,e as me,F as V,b as R,aa as xe,a7 as ge,ad as K,aN as ye,_ as be,B as Ae,I as X,a0 as Te,K as ee,t as Ve,aD as He,a as Le}from"./url-CQusUXBs.js";import{a as Ee,s as B,g as Y}from"./props-it-m92ZV.js";class Re extends ve{constructor(e,o={}){super(e),this.isWater=!0;const t=this,n=o.textureWidth!==void 0?o.textureWidth:512,c=o.textureHeight!==void 0?o.textureHeight:512,l=o.clipBias!==void 0?o.clipBias:0,k=o.alpha!==void 0?o.alpha:1,u=o.time!==void 0?o.time:0,x=o.waterNormals!==void 0?o.waterNormals:null,C=o.sunDirection!==void 0?o.sunDirection:new F(.70707,.70707,0),N=new E(o.sunColor!==void 0?o.sunColor:16777215),y=new E(o.waterColor!==void 0?o.waterColor:8355711),r=o.eye!==void 0?o.eye:new F(0,0,0),v=o.distortionScale!==void 0?o.distortionScale:20,z=o.side!==void 0?o.side:Ce,S=o.fog!==void 0?o.fog:!1,P=new Fe,w=new F,p=new F,s=new F,h=new Q,g=new F(0,0,-1),M=new U,m=new F,i=new F,d=new U,f=new Q,b=new De,D=new Pe(n,c,{type:We}),_={name:"MirrorShader",uniforms:he.merge([de.fog,de.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new Q},sunColor:{value:new E(8355711)},sunDirection:{value:new F(.70707,.70707,0)},eye:{value:new F},waterColor:{value:new E(5592405)}}]),vertexShader:`
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
				}`},W=new _e({name:_.name,uniforms:he.clone(_.uniforms),vertexShader:_.vertexShader,fragmentShader:_.fragmentShader,lights:!0,side:z,fog:S});W.uniforms.mirrorSampler.value=D.texture,W.uniforms.textureMatrix.value=f,W.uniforms.alpha.value=k,W.uniforms.time.value=u,W.uniforms.normalSampler.value=x,W.uniforms.sunColor.value=N,W.uniforms.waterColor.value=y,W.uniforms.sunDirection.value=C,W.uniforms.distortionScale.value=v,W.uniforms.eye.value=r,t.material=W,t.onBeforeRender=function(q,L,H){if(p.setFromMatrixPosition(t.matrixWorld),s.setFromMatrixPosition(H.matrixWorld),h.extractRotation(t.matrixWorld),w.set(0,0,1),w.applyMatrix4(h),m.subVectors(p,s),m.dot(w)>0)return;m.reflect(w).negate(),m.add(p),h.extractRotation(H.matrixWorld),g.set(0,0,-1),g.applyMatrix4(h),g.add(s),i.subVectors(p,g),i.reflect(w).negate(),i.add(p),b.position.copy(m),b.up.set(0,1,0),b.up.applyMatrix4(h),b.up.reflect(w),b.lookAt(i),b.far=H.far,b.updateMatrixWorld(),b.projectionMatrix.copy(H.projectionMatrix),f.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),f.multiply(b.projectionMatrix),f.multiply(b.matrixWorldInverse),P.setFromNormalAndCoplanarPoint(w,p),P.applyMatrix4(b.matrixWorldInverse),M.set(P.normal.x,P.normal.y,P.normal.z,P.constant);const A=b.projectionMatrix;d.x=(Math.sign(M.x)+A.elements[8])/A.elements[0],d.y=(Math.sign(M.y)+A.elements[9])/A.elements[5],d.z=-1,d.w=(1+A.elements[10])/A.elements[14],M.multiplyScalar(2/M.dot(d)),A.elements[2]=M.x,A.elements[6]=M.y,A.elements[10]=M.z+1-l,A.elements[14]=M.w,r.setFromMatrixPosition(H.matrixWorld);const ke=q.getRenderTarget(),ze=q.xr.enabled,Ne=q.shadowMap.autoUpdate;t.visible=!1,q.xr.enabled=!1,q.shadowMap.autoUpdate=!1,q.setRenderTarget(D),q.state.buffers.depth.setMask(!0),q.autoClear===!1&&q.clear(),q.render(L,b),t.visible=!0,q.xr.enabled=ze,q.shadowMap.autoUpdate=Ne,q.setRenderTarget(ke);const fe=H.viewport;fe!==void 0&&q.state.viewport(fe)}}}const ie=`${Ee}
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
// Caustics as an area ratio: sunlight refracted through the ripple slopes onto a bottom at this depth lands spread
// out or squeezed together; the ratio of a patch of surface to its patch on the bottom is the light there (mean 1).
// The slopes are the ripples that matter at wading depth (crests 20-40 cm apart, drifting with the water); the light
// folds into bright lines where the ratio passes through zero. Drawn on the sand itself (shadeSand), so the shallows
// show them through the water and a diver sees them on the seabed.
vec2 causticSlope(vec2 p,float t){
 mat2 r=mat2(.80,-.60,.60,.80),r2=mat2(.36,.933,-.933,.36);
 vec2 q=p+vec2(waterNoise(p*.31+t*.05),waterNoise(p*.27-t*.04))*1.4;
 return waterNoiseD(q*2.7+vec2(-.25,.31)*t).yz*.30+(r*waterNoiseD(r*q*4.1+vec2(.29,-.2)*t).yz)*.19+(r2*waterNoiseD(r2*q*6.3-vec2(.21,.34)*t).yz)*.11;
}
float causticAt(vec2 b,float depth,float t){
 float e=.025;vec2 s0=causticSlope(b,t),sx=causticSlope(b+vec2(e,0.),t),sz=causticSlope(b+vec2(0.,e),t);
 mat2 J=mat2(1.)-min(depth,1.6)*mat2((sx-s0)/e,(sz-s0)/e);
 return min(1./max(abs(determinant(J)),.22),4.);
}
// The caustic light on the bottom at p (still-water depth from the beach's slope), relative to the mean: up-sun of
// p is where its light came through; fades out with depth and distance from the eye.
float bottomCaustic(vec2 p,float t,vec3 sunDirection,float distanceToEye){
 float still=(shore(p.x)-p.y)*.12+.035;if(still<.02||distanceToEye>70.)return 0.;
 vec3 sunIn=refract(-sunDirection,vec3(0.,1.,0.),.75);
 float c=causticAt(p-sunIn.xz/max(-sunIn.y,.2)*min(still,6.),still,t)-1.;
 return c*.3*smoothstep(.02,.3,still)*(.25+.75*exp(-still*.45))*(1.-smoothstep(35.,70.,distanceToEye));
}
float coastSlope(float x){return (abs(x)<80.?-.018*x:0.)+.1125*cos(x*.075);}
float beachHeight(float d){return .75*(1.-exp(-max(d,0.)/32.))+.34*exp(-pow((d-5.2)/2.2,2.));}
// Shore waves travel at the shallow-water speed over the beach's analytic slope (depth = .12 × distance offshore),
// scaled by .65 so the crest spacing in mid-surf (about 8 m out) stays as it was. The phase is ω times the travel
// time from the waterline (an eikonal solved in closed form): crests slow down, bunch up and steepen towards the
// sand. surfTravel: that phase offshore of the line; surfK: its rate (the local wavenumber); surfAmp: Green's law
// (height ∝ depth^-1/4, 1 at 8 m out) capped by breaking (about .45 × depth).
float surfTravel(float coast){return coast<2.5?1.2197*coast:3.0493+3.857*(sqrt(coast)-1.58114);}
float surfK(float coast){return coast<2.5?1.2197:1.9285/sqrt(coast);}
float surfAmp(float coast){float h=max(.12*coast,.3);return min(pow(h/.96,-.25),(.45*h+.06)/.29);}
float surfPhase(vec2 p,float t){return surfTravel(shore(p.x)-p.y)+t*1.36+.42*sin(p.x*.105)+.19*sin(p.x*.29);}
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
`,Ie=`
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
 float amp=.29*surfAmp(coast),kk=surfK(coast);
 float h=(s+.32*sin(2.*ph))*amp*envelope;
 float dh=(c+.64*cos(2.*ph))*amp*envelope;
 vec2 gradient=vec2(coastSlope(p.x)*kk+.0441*cos(p.x*.105)+.0551*cos(p.x*.29),-kk);
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
`,te=24,oe=10,ae=10,G={xs:null,ds:null};function Me(){const a=[],e=[];for(let l=40;l>0;l--)a.push(-140-1860*(l/40)**2);for(let l=0;l<=350;l++)a.push(-140+l*.8);for(let l=1;l<=40;l++)a.push(140+1860*(l/40)**2);for(let l=0;l<=186;l++)e.push(-5+l*.35);for(let l=1;l<=70;l++)e.push(60.1+2140*(l/70)**2);G.xs=a,G.ds=e;const o=[],t=[];for(const l of e)for(const k of a)o.push(k,-(B(k)-l),0);const n=a.length;for(let l=0;l<e.length-1;l++)for(let k=0;k<n-1;k++){const u=l*n+k,x=u+1,C=u+n,N=C+1;t.push(u,x,N,u,N,C)}const c=new me;return c.setAttribute("position",new V(o,3)),c.setIndex(t),c.computeVertexNormals(),c}function at(a){const e=new Re(Me(),{textureWidth:512,textureHeight:512,sunDirection:a,sunColor:16774362,waterColor:556956,distortionScale:.55,fog:!0});return e.rotation.x=-Math.PI/2,e.frustumCulled=!1,e.name="lagoon-water",e.material.uniforms.wakeRings={value:Array.from({length:te},()=>new U)},e.material.uniforms.wadeRings={value:Array.from({length:oe},()=>new U)},e.material.uniforms.seaRings={value:Array.from({length:ae},()=>new U)},e.material.uniforms.seeDepth={value:null},e.material.uniforms.seeOn={value:0},e.material.uniforms.seeInv={value:new qe(1,1)},e.material.uniforms.seeNear={value:.1},e.material.uniforms.seeFar={value:1e3},e.material.transparent=!0,e.material.premultipliedAlpha=!0,e.material.depthWrite=!0,e.material.side=we,e.material.vertexShader=`
 uniform mat4 textureMatrix;uniform float time;
 varying vec4 mirrorCoord;varying vec4 worldPosition;
 varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_vertex>
 #include <logdepthbuf_pars_vertex>
 ${ie}
 ${Ie}
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
 // Beckmann lobe, scaled so the old fixed highlight (Blinn exponent 420, alpha² ≈ .0047) keeps its peak; a wider
 // lobe has a lower, broader peak with about the same energy.
 float sunLobe(float NoH,float a2){float c2=NoH*NoH;return exp((c2-1.)/(a2*c2))*.0047/(a2*c2*c2);}
 // Slope variance of the ripple octaves fineSlope() fades out with distance (LEAN-style: detail too small to draw
 // becomes roughness instead of vanishing), so distant water gets a wider, dimmer sun path rather than a mirror.
 float lostSlope(float distanceToEye){
  vec4 a=vec4(.13,.072,.046,.022),k=vec4(.006,.012,.035,.09);
  vec4 lost=a*(1.-1./(1.+distanceToEye*k));return .12*dot(lost,lost);
 }
 // Caustics as an area ratio: sunlight refracted through the ripple slopes onto a bottom at this depth lands spread
 // out or squeezed together; the ratio of a patch of surface to its patch on the bottom is the light there (mean 1).
 // Foam body: billows (value) with their slope (yz) for shading the creases; two octaves.
 vec3 foamBillow(vec2 p){return waterNoiseD(p*2.1)*.65+waterNoiseD(p*5.3+7.)*vec3(.35,.35*2.52,.35*2.52);}
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
   // Dispersive, as rings from a drop are (Cauchy-Poisson): the long waves lead and ever shorter ones trail behind
   // the front, so the packet runs out long and shallow ahead of a tail of fine ripples.
   float behindR=max(-x,0.)/lambda,fade=exp(-age/life*2.5),env=min(r.w,2.5)*fade*exp(-x*x/(lambda*lambda*(x>0.?1.:4.)))*sqrt(1.+.45*behindR)/(1.+.12*dist);
   if(x<2.5*lambda&&x>-4.*lambda)rip+=q/dist*sin((x/lambda-.225*behindR*behindR)*6.2832)*.5*env;
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
  // The drawn bottom (where the water is too deep to see the real sand) carries the same caustics as the sand.
  bottom*=1.+(depth<2.2?bottomCaustic(bottomP,time,sunDirection,distanceToEye):0.);
  vec3 transmission=exp(-vec3(.85,.24,.16)*path);
  vec3 waterTint=mix(vec3(.008,.44,.50),vec3(.006,.075,.14),1.-exp(-depth*.055));
  vec3 sea=bottom*transmission+waterTint*(1.-transmission),sea0=sea;
  // The same water over the real bottom: its own light only (the caustics added on), the bottom left to the blend.
  vec3 seaClear=waterTint*(1.-transmission);
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
  // The sun on the water: a lobe widened by the ripples too small to draw here and by how fast the normal changes
  // across the pixel (specular anti-aliasing), plus glints: part of the light comes as separate tiny facets, each
  // a cell about a pixel or two across that mirrors the sun for a moment. Which cells shine is a hash of the cell
  // and a 0.16 s window, crossfaded into the next window, so they twinkle and any time can be rendered on its own.
  vec3 dNx=dFdx(N),dNy=dFdy(N);
  float a2=.0047+lostSlope(distanceToEye)+min(.5*(dot(dNx,dNx)+dot(dNy,dNy)),.12);
  float NoH=max(dot(N,H),0.),aw=a2*1.8;
  // Each lit cell is a small round spot at a random place in it, blurred to the pixel, so close up they read as
  // points of light rather than squares.
  float cell=max(.014,distanceToEye*.0024),tw=time/.16,win=floor(tw);
  vec2 gq=worldPosition.xz/cell,gc=floor(gq),gf=gq-gc;float gpx=max(length(fwidth(gq)),.02);
  vec2 k0=gc+vec2(win*7.31,win*3.17),k1=gc+vec2((win+1.)*7.31,(win+1.)*3.17);
  // Spots differ in brightness (most faint, a few bright: the cube of a hash, mean 1/4), so they read as sparkle
  // on the ripples rather than an even sprinkle of equal dots.
  float on0=step(waterHash(k0),.06)*pow(waterHash(k0+7.7),3.)*smoothstep(.3+gpx,.3-gpx,length(gf-.2-.6*vec2(waterHash(k0+19.7),waterHash(k0+41.3))));
  float on1=step(waterHash(k1),.06)*pow(waterHash(k1+7.7),3.)*smoothstep(.3+gpx,.3-gpx,length(gf-.2-.6*vec2(waterHash(k1+19.7),waterHash(k1+41.3))));
  float tf=smoothstep(0.,1.,tw-win),twinkle=(on0*(1.-tf)+on1*tf)/(.06*.283*.25),glints=.3*(1.-smoothstep(40.,160.,distanceToEye));
  float glitter=sunLobe(NoH,a2)*(1.-glints)+sunLobe(NoH,aw)*twinkle*glints;
  lit+=sunColor*glitter*.85*smoothstep(0.,.05,sunDirection.y);color+=lit;colorClear+=lit;
  // A broken leading crest and a lace-like aerated wake, only in shallow water.
  float phase=surfPhase(p,time);
  float behind=mod(phase-1.10+6.283185,6.283185);
  float signedCrest=atan(sin(phase-1.10),cos(phase-1.10));
  float crest=exp(-pow((signedCrest+(waterNoise(p*1.3)-.5)*.12)/.27,2.));
  float wake=exp(-behind*.95)*smoothstep(0.,.12,behind);
  vec2 foamP=vec2(p.x,p.y-time*.40);
  float foamPatch=waterNoise(vec2(p.x*1.12,p.y*.86)+vec2(0.,time*.12));
  float lace=foamLace(foamP);
  // Peeling: each crest breaks at its own distance out, changing along the beach and from one wave to the next, so
  // a breaker opens in some stretches while it still stands unbroken in others.
  float waveNo=floor((phase-1.10)/6.283185+.5),breakAt=6.5+6.*waterNoise(vec2(p.x*.07+waveNo*3.71,waveNo*1.37));
  float breaking=smoothstep(.2,1.4,coast)*(1.-smoothstep(breakAt-1.5,breakAt+1.5,coast));
  // Whitewater on the crest rides with the bore (about 2 m/s shoreward): two copies of the billows carried at that
  // speed, each restarted every 1.6 s at a new offset while the other is at full strength (a flow map in time).
  float ft=time/1.6,f0=fract(ft),f1=fract(ft+.5),w0=1.-abs(2.*f0-1.);
  vec3 bil=foamBillow(p+vec2(waterHash(vec2(floor(ft),3.))*40.,-f0*3.2))*w0+foamBillow(p+vec2(waterHash(vec2(floor(ft+.5),9.))*40.,-f1*3.2))*(1.-w0);
  bil.x=(bil.x-.5)/(.5+.5*abs(2.*w0-1.))+.5;
  // It wears away with age (the time since the crest passed): solid white, then holes opening up, then lace that
  // drifts on slowly.
  float age=behind/1.36,thr=mix(.18,.8,smoothstep(0.,2.4,age)),body=smoothstep(thr,thr+.13,bil.x);
  float foam=breaking*(crest*(.32+.62*body)*(.55+.45*foamPatch)+wake*max(body*.95,lace*.8*smoothstep(.5,2.,age))*smoothstep(.25,.65,foamPatch));
  float billowy=breaking*crest;
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
  // Foam shading: the billows' slopes catch the sun and their creases sit darker; thin foam shows the water under
  // it and glows a little when the sun is behind it.
  vec3 Nf=normalize(N+vec3(-bil.y,0.,-bil.z)*.18*billowy);
  float fm=clamp(foam,0.,.94);
  vec3 foamColor=vec3(.88,.96,.94)*(.78+.26*max(dot(Nf,sunDirection),0.))*(1.-.16*billowy*(1.-bil.x));
  foamColor=foamColor*mix(vec3(.62,.9,.88),vec3(1.),smoothstep(.15,.75,fm))+vec3(.05,.13,.1)*backlit*(1.-smoothstep(.2,.8,fm));color=mix(color,foamColor,fm);colorClear=mix(colorClear,foamColor,fm);
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
  // Seen from under the water (a diver): Snell's window. Within about 48.6° of straight up the sky comes through,
  // squeezed into the circle, with the sun in it; outside it the surface mirrors the water below (total internal
  // reflection). The edge of the window blurs with the ripples; foam reads as dark patches against the light.
  if(eye.y<worldPosition.y){
   vec3 Nu=-normalize(vWaveNormal+vec3(-small.x,0.,-small.y)*.5),I=-V;
   vec3 Tr=refract(I,Nu,1.333);
   float cosI=max(dot(-I,Nu),0.),window=smoothstep(.56,.74,cosI);
   vec3 deep=vec3(.02,.2,.26);
   vec3 sky=mix(vec3(.38,.68,.86),vec3(.1,.33,.62),pow(max(Tr.y,0.),.35))*1.15;
   float sunUp=pow(max(dot(normalize(Tr+vec3(0.,1e-4,0.)),sunDirection),0.),500.);
   vec3 skyIn=sky+sunColor*sunUp*1.8;
   float edge=1.-smoothstep(.65,.95,cosI);
   vec3 under=mix(deep*(.7+.3*Nu.y),skyIn*(1.-.3*edge),window);
   under=mix(under,vec3(.35,.5,.52)*mix(.45,1.,window),fm*.8);
   gl_FragColor=vec4(under,1.);
  }else
  gl_FragColor=vec4(max(outColor,0.),1.-through);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
 }`,e}function rt(a,e,o){a.onBeforeCompile=t=>{t.uniforms.time=e,t.uniforms.sunDir=o,t.vertexShader=`varying vec3 vWorld;
`+t.vertexShader,t.vertexShader=t.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
vWorld=(modelMatrix*vec4(position,1.)).xyz;`),t.fragmentShader=`uniform float time;uniform vec3 sunDir;varying vec3 vWorld;
`+ie+`
`+t.fragmentShader,t.fragmentShader=t.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
   float wet=wetSand(vWorld.xz,time);
   float grain=waterHash(vWorld.xz*173.);
   float ripple=sin(vWorld.x*2.2+sin(vWorld.z*.7)*2.+sin(vWorld.x*.3))*sin(vWorld.z*8.);
   diffuseColor.rgb*=mix(vec3(1.),vec3(.62,.57,.49),wet)*(.95+grain*.10+ripple*.025);
   // Under the water: the sunlight focused by the ripples (caustics), seen through the shallows and by a diver.
   if(vWorld.z<shore(vWorld.x))diffuseColor.rgb*=1.+bottomCaustic(vWorld.xz,time,sunDir,length(vViewPosition));
  `),t.fragmentShader=t.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
   float fresh=1.-smoothstep(swashFront(vWorld.x,time)-.1,swashFront(vWorld.x,time)+.6,vWorld.z-shore(vWorld.x));
   roughnessFactor=mix(.92,.33,wet);roughnessFactor=mix(roughnessFactor,.16,fresh);
   // Under standing water the sand is not glossy (the water above it gives the shine), so a diver sees no sun
   // highlight on the seabed.
   roughnessFactor=mix(roughnessFactor,.9,smoothstep(.3,1.5,shore(vWorld.x)-vWorld.z));
  `),t.fragmentShader=t.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
   float phase=vWorld.z*15.+sin(vWorld.x*.8)*1.8+sin(vWorld.z*1.4);
   vec3 rippleNormal=vec3(cos(phase)*.012,0.,cos(phase)*.035);
   normal=normalize(normal+mat3(viewMatrix)*rippleNormal*(1.-wet*.8)*(.55+.45*sin(vWorld.x*.34)*sin(vWorld.z*.56))/(1.+length(vViewPosition)*.012));
  `),t.fragmentShader=t.fragmentShader.replace("#include <opaque_fragment>",`
   float wetFresnel=.02+.98*pow(1.-abs(dot(normal,normalize(vViewPosition))),5.);
   outgoingLight=mix(outgoingLight,vec3(.24,.44,.61),wet*wetFresnel*.35);
   #include <opaque_fragment>`)}}const Ge=[[.22,1,.29,19,.5],[-.38,1,.16,11.3,2.4],[.72,.69,.085,6.7,4.1],[-.81,.59,.045,3.8,1.1]].map(([a,e,o,t,n])=>{const c=Math.hypot(a,e),l=6.283185/t;return[a/c,e/c,o,l,Math.sqrt(9.81*l),n]}),T=(a,e,o)=>{const t=Math.max(0,Math.min(1,(o-a)/(e-a)));return t*t*(3-2*t)},I=a=>a-Math.floor(a),Ue=a=>a<2.5?1.2197*a:3.0493+3.857*(Math.sqrt(a)-1.58114),je=a=>{const e=Math.max(.12*a,.3);return Math.min((e/.96)**-.25,(.45*e+.06)/.29)};function Z(a,e){let o=I(a*.1031),t=I(e*.103),n=I(a*.0973);const c=o*(t+33.33)+t*(n+33.33)+n*(o+33.33);return o+=c,t+=c,n+=c,I((o+t)*n)}function Ze(a,e){const o=Math.floor(a),t=Math.floor(e),n=T(0,1,I(a)),c=T(0,1,I(e));return(Z(o,t)*(1-n)+Z(o+1,t)*n)*(1-c)+(Z(o,t+1)*(1-n)+Z(o+1,t+1)*n)*c}function $e(a,e){const o=I((e*1.36+.42*Math.sin(a*.105)+.19*Math.sin(a*.29)-1.1)/6.283185);return-.35+(2.4+.45*Math.sin(a*.19)+.22*Math.sin(a*.57))*T(0,.28,o)*(1-T(.28,1,o))}function le(a,e,o,t){const n=B(a)-e,c=T(0,16,n)*(.68+.32*T(15,90,n))*(1-T(100,550,n))*(1-T(140,500,Math.abs(a)));let l=0,k=0,u=.035;for(let r=0;r<4;r++){const v=Ge[r],z=v[3]*(v[0]*a+v[1]*e)-v[4]*o+v[5],S=v[2]*c;l+=.62*S*v[0]*Math.cos(z),k+=.62*S*v[1]*Math.cos(z),u+=S*Math.sin(z)}const x=Ue(n)+o*1.36+.42*Math.sin(a*.105)+.19*Math.sin(a*.29),C=T(0,2.2,n)*(1-T(13,30,n));u+=(Math.sin(x)+.32*Math.sin(2*x))*.29*je(n)*C;const N=Math.exp(-((Math.atan2(Math.sin(x-1.1),Math.cos(x-1.1))/.5)**2));u+=(Ze(a*2.3,e*2.3-o*.65)-.5)*.07*N*C,u=Math.max(u,-Math.max(n,0)*.12+.025);const y=-n;if(y>-.15){const r=.75*(1-Math.exp(-Math.max(y,0)/32))+.34*Math.exp(-(((y-5.2)/2.2)**2)),v=r+.012+.018*T(0,1,$e(a,o)-y);u+=(v-u)*T(-.15,.12,y)}t.x=a+l,t.z=e+k,t.height=u}function re(a,e,o,t){let n=a,c=e;for(let l=0;l<4;l++)le(n,c,o,t),n+=a-t.x,c+=e-t.z;return le(n,c,o,t),t.height}const $={},se=new Map;let ue=NaN;function Xe(a,e,o){o!==ue&&(se.clear(),ue=o);const t=a*4096+e;let n=se.get(t);if(!n){const c=G.xs[a];le(c,B(c)-G.ds[e],o,$),n={x:$.x,z:$.z,height:$.height},se.set(t,n)}return n}function pe(a,e){let o=0,t=a.length-2;for(;o<t;){const n=o+t+1>>1;a[n]<=e?o=n:t=n-1}return o}function st(a,e,o){G.xs||Me();const{xs:t,ds:n}=G;let c=a,l=e,k=0;for(let u=0;u<5;u++){const x=pe(t,c),C=pe(n,B(c)-l),N=(p,s)=>[t[p],B(t[p])-n[s]],y=N(x,C),r=N(x+1,C),v=N(x,C+1),z=N(x+1,C+1);let S=null;for(const p of[[y,r,z,[x,C],[x+1,C],[x+1,C+1]],[y,z,v,[x,C],[x+1,C+1],[x,C+1]]]){const[s,h,g]=p,M=(h[0]-s[0])*(g[1]-s[1])-(g[0]-s[0])*(h[1]-s[1]),m=((c-s[0])*(g[1]-s[1])-(g[0]-s[0])*(l-s[1]))/M,i=((h[0]-s[0])*(l-s[1])-(c-s[0])*(h[1]-s[1]))/M,d=1-m-i,f=Math.min(d,m,i);(!S||f>S.worst)&&(S={worst:f,w:[d,m,i],ix:p.slice(3)})}let P=0,w=0;k=0;for(let p=0;p<3;p++){const s=Xe(...S.ix[p],o);P+=S.w[p]*s.x,w+=S.w[p]*s.z,k+=S.w[p]*s.height}c+=a-P,l+=e-w}return k}function nt(a,e,o,t){const n=re(a,e,o,t),c=re(a+.06,e,o,t),l=re(a,e+.06,o,t),k=(n-c)/.06,u=(n-l)/.06,x=Math.hypot(k,1,u);return t.x=a,t.z=e,t.height=n,t.nx=k/x,t.ny=1/x,t.nz=u/x,t}const J=a=>()=>{a|=0,a=a+1831565813|0;let e=Math.imul(a^a>>>15,1|a);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296},j=(a,e)=>{const o=Math.sin(a.x*12.9898+a.y*78.233+a.z*37.719+e)*43758.5453;return o-Math.floor(o)};function ne(a,e,o){const t=J(a),n=[];for(let v=0;v<o;v++){let z=new K(1,e);z.deleteAttribute("uv"),z.deleteAttribute("normal"),z=ye(z);const S=t()*Math.PI*2,P=v?.3+t()*.42:0,w=(v?.34+t()*.22:.55+t()*.1)*(o>5?.9:1.15),p=t()*100,s=.8+t()*.4,h=new F(Math.cos(S)*P,v?.22-P*.45+t()*.2:.22,Math.sin(S)*P),g=z.attributes.position,M=new F;for(let m=0;m<g.count;m++){M.fromBufferAttribute(g,m);const i=1+(j(M,p)-.5)*.5;M.multiplyScalar(w*i).add(h),g.setXYZ(m,M.x,M.y,M.z)}z.setAttribute("tint",new V(new Array(g.count).fill(s),1)),n.push(z)}const c=be(n);c.computeVertexNormals();const l=c.attributes.position,k=c.attributes.normal,u=c.attributes.tint,x=new Ae().setFromBufferAttribute(l),C=new F(0,x.min.y*.4,0),N=[],y=new F,r=new F;for(let v=0;v<l.count;v++){y.fromBufferAttribute(l,v),r.fromBufferAttribute(k,v).lerp(y.clone().sub(C).normalize(),.55).normalize(),k.setXYZ(v,r.x,r.y,r.z);const z=(y.y-x.min.y)/(x.max.y-x.min.y),S=(.48+.64*z)*u.getX(v)*(.84+.28*j(y,a));N.push(S*.92,S,S*.85)}return c.setAttribute("color",new V(N,3)),c.deleteAttribute("tint"),c}function Oe(a){const e=J(a),o=[],t=[],n=[],c=.12+e()*.16,l=6,k=9,u=w=>new F(c*w*w,w,0),x=u(1);for(let w=0;w<=k;w++){const p=w/k,s=u(p),h=.028-.012*p,g=.78+.22*Math.abs(Math.sin(w*2.7));for(let M=0;M<l;M++){const m=M/l*Math.PI*2;o.push(s.x+Math.cos(m)*h,s.y,s.z+Math.sin(m)*h);const i=.38*g;t.push(i*1.02,i*.95,i*.82)}}for(let w=0;w<k;w++)for(let p=0;p<l;p++){const s=w*l+p,h=w*l+(p+1)%l;n.push(s,h,s+l,h,h+l,s+l)}let C=o.length/3;const N=9+Math.floor(e()*4),y=10;for(let w=0;w<N;w++){const p=w/N*Math.PI*2+e()*.4,s=.45-e()*.85,h=.3+e()*.1,g=s<-.3,M=new F(Math.cos(p),0,Math.sin(p)),m=new F(-M.z,0,M.x),i=g?[.42,.42,.18]:[.26+e()*.06,.46+e()*.08,.14+e()*.05],d=[];for(let f=0;f<=y;f++){const b=f/y;d.push(x.clone().addScaledVector(M,h*b).add(new F(0,h*(s*b-.75*b*b),0)))}for(let f=0;f<y;f++){const b=d[f],D=d[f+1],_=h*.24*Math.sin(Math.PI*(f+.8)/(y+.6));for(const W of[-1,1]){const q=D.clone().addScaledVector(m,W*_).add(new F(0,-_*.6,0)).addScaledVector(M,h*.06);o.push(b.x,b.y,b.z,D.x,D.y,D.z,q.x,q.y,q.z);const L=.85+e()*.3;for(let H=0;H<3;H++){const A=H===2?.8:1;t.push(i[0]*L*A,i[1]*L*A,i[2]*L*A)}n.push(C,C+1,C+2),C+=3}}}const r=new me;r.setAttribute("position",new V(o,3)),r.setAttribute("color",new V(t,3)),r.setIndex(n);const v=[r.toNonIndexed()];for(let w=0;w<3;w++){const p=w*2.1+e(),s=new K(.018,0).translate(x.x+Math.cos(p)*.022,x.y-.025,x.z+Math.sin(p)*.022);s.deleteAttribute("uv"),s.deleteAttribute("normal"),s.setAttribute("color",new V(Array.from({length:s.attributes.position.count},()=>[.35,.28,.12]).flat(),3)),v.push(s)}const z=be(v);z.computeVertexNormals();const S=z.attributes.position,P=[];for(let w=0;w<S.count;w++){const p=S.getY(w),s=Math.hypot(S.getX(w)-x.x,S.getZ(w));P.push(p>.55?X.smoothstep(s,.035,.35):0)}return z.setAttribute("palmWind",new V(P,1)),z}function Ke(a){let e=new K(1,1);e.deleteAttribute("uv"),e.deleteAttribute("normal"),e=ye(e);const o=e.attributes.position,t=new F,n=[];for(let c=0;c<o.count;c++){t.fromBufferAttribute(o,c),t.multiplyScalar(1+(j(t,a)-.5)*.45),t.y=Math.max(t.y*.7,-.25),o.setXYZ(c,t.x,t.y,t.z);const l=(.3+.16*(t.y+.25))*(.85+.3*j(t,a+1)),k=X.smoothstep(.02,-.15,t.y),u=X.smoothstep(.68,.85,j(t.clone().multiplyScalar(.6).floor(),a+2))*X.smoothstep(.1,.5,t.y),x=new E(l*1.02,l,l*.92).lerp(new E(.1,.17,.07),k*.85).lerp(new E(.24,.34,.11),u*.7);n.push(x.r,x.g,x.b)}return e.setAttribute("color",new V(n,3)),e.computeVertexNormals(),e}function Ye(a,e){const o=J(a),t=[],n=[],c=5,l=e?16:11;for(let u=0;u<l;u++){const x=u/l*Math.PI*2+o()*.5,C=e?.55+o()*.4:.25+o()*.5,N=e?.75+o()*.35:.45+o()*.25,y=e?.06:.2+o()*.08,r=e?0:.25+o()*.25,v=new F(Math.cos(x),0,Math.sin(x)),z=new F(-v.z,0,v.x),S=new F(0,r*.6,0).addScaledVector(v,r*.4),P=s=>S.clone().addScaledVector(v,N*s).add(new F(0,N*(C*s-(e?.9:.7)*s*s),0)),w=[.16+o()*.08,.36+o()*.12,.09+o()*.05],p=.8+o()*.4;if(r){const s=new F(0,0,0);for(const h of[[s,S,S.clone().addScaledVector(z,.02)]]){for(const g of h)t.push(g.x,g.y,g.z);for(let g=0;g<3;g++)n.push(.2,.3,.12)}}for(let s=0;s<c;s++){const h=s/c,g=(s+1)/c,M=y*Math.sin(Math.PI*Math.min(1,h*1.1+.02))*(e?1-h*.6:1),m=y*Math.sin(Math.PI*Math.min(1,g*1.1))*(e?1-g*.6:1),i=P(h),d=P(g),f=new F(0,y*.25,0);for(const b of[-1,1]){const D=i.clone().addScaledVector(z,b*M).add(f),_=d.clone().addScaledVector(z,b*m).add(f);t.push(i.x,i.y,i.z,d.x,d.y,d.z,_.x,_.y,_.z,i.x,i.y,i.z,_.x,_.y,_.z,D.x,D.y,D.z);const W=1.15+.2*g,q=.85+.2*g;for(const L of[W,W,q,W,q,q])n.push(w[0]*p*L,w[1]*p*L,w[2]*p*L)}}}const k=new me;return k.setAttribute("position",new V(t,3)),k.setAttribute("color",new V(n,3)),k.computeVertexNormals(),k}function Je(){const a=new Te(.6,1,1,6,1,!0).translate(0,.5,0);return a.deleteAttribute("uv"),a.setAttribute("color",new V(Array.from({length:a.attributes.position.count},()=>[.36,.32,.26]).flat(),3)),a}function O(a){const e=a.onBeforeCompile;return a.onBeforeCompile=(o,t)=>{e&&e(o,t),o.fragmentShader=o.fragmentShader.replace("#include <fog_fragment>",`#ifdef USE_FOG
   gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,.62*(1.-exp(-max(0.,vFogDepth-80.)*.0022)));
   #endif
   #include <fog_fragment>`)},a}function Qe(){const a=new R({vertexColors:!0,roughness:.92});return a.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vLeaf;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vLeaf=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
   varying vec3 vLeaf;
   float leafHash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   float leafNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(leafHash(i),leafHash(i+vec3(1,0,0)),f.x),mix(leafHash(i+vec3(0,1,0)),leafHash(i+vec3(1,1,0)),f.x),f.y),
     mix(mix(leafHash(i+vec3(0,0,1)),leafHash(i+vec3(1,0,1)),f.x),mix(leafHash(i+vec3(0,1,1)),leafHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`).replace("#include <color_fragment>",`#include <color_fragment>
   {float near=1.-smoothstep(25.,110.,length(vViewPosition));
    float n=leafNoise(vLeaf*2.2)*.65+leafNoise(vLeaf*5.3)*.35;
    diffuseColor.rgb*=mix(1.,.42+1.05*n,near);}`)},O(a)}function et(a){const e={crownNear:[],crownFar:[],shrub:[],palm:[],trunk:[],boulder:[],plant:[]};function o({cx:n,cz:c,rx:l,rz:k,shape:u,rock:x,seed:C,detail:N,counts:y}){const r=J(C),v=new ge,z=new E,S=(s,h)=>Math.hypot(u(s+1,h)-u(s-1,h),u(s,h+1)-u(s,h-1))/2,P=(s,h)=>Math.atan2(u(s,h+1)-u(s,h-1),-(u(s+1,h)-u(s-1,h))),w=s=>{for(let h=0;h<60;h++){const g=(r()-.5)*l*1.9,M=(r()-.5)*k*1.9,m=u(g,M);if(s(g,M,m)&&m>Y(n+g,c+M)-.2)return[g,M,m]}return null},p=(s,h)=>{h(v,z),v.updateMatrix(),s.push([v.matrix.clone(),z.clone()])};for(let s=0;s<y.canopy;s++){const h=w((b,D,_)=>_>1.4&&(!x(b,D,_)||r()<.1)&&S(b,D)<1.6);if(!h)continue;const[g,M,m]=h,i=r()<.05,d=i?3.4+r()*1.4:1.4+r()*1.5,f=1+d*.4+r()*2.5+(i?4:0);p(N==="near"?e.crownNear:e.crownFar,(b,D)=>{b.position.set(n+g,m+f,c+M),b.scale.set(d*(1+r()*.25),d*(.8+r()*.3),d*(1+r()*.25)),b.rotation.set(0,r()*6.3,0);{const _=r();D.setHSL(.17+r()*.12,.38+r()*.24,_<.25?.17+r()*.06:.25+r()*.14)}}),(i||r()<.4)&&p(e.trunk,(b,D)=>{const _=.1+d*.05;b.position.set(n+g,m-.3,c+M),b.scale.set(_,f+.3,_),b.rotation.set((r()-.5)*.12,r()*6.3,(r()-.5)*.12),D.setRGB(1,1,1)})}for(let s=0;s<y.shrub;s++){const h=w((i,d,f)=>f>.5&&f<5&&S(i,d)<1.8||x(i,d,f)&&f>.8);if(!h)continue;const[g,M,m]=h;p(e.shrub,(i,d)=>{const f=.6+r()*1.1;i.position.set(n+g,m+f*.15,c+M),i.scale.set(f*1.3,f*(.55+r()*.3),f*1.2),i.rotation.set(0,r()*6.3,0),d.setHSL(.17+r()*.12,.38+r()*.2,.22+r()*.1)})}for(let s=0;s<y.palm;s++){const h=w((d,f,b)=>{const D=(d/l)**2+(f/k)**2;return s%3===0?b>4&&S(d,f)<1.3:b>.6&&b<8&&D>.5&&S(d,f)<1.4});if(!h)continue;const[g,M,m]=h,i=s%3!==0;p(e.palm,(d,f)=>{const b=i?7+r()*5:12+r()*6;d.position.set(n+g,m-.3,c+M),d.scale.setScalar(b),d.rotation.set(0,0,0),d.rotateY(P(g,M)+(r()-.5)*.6),d.rotateZ(-(i?.08+r()*.22:r()*.08));const D=.95+r()*.3;f.setRGB(D,D,D*.92)})}for(let s=0;s<(y.boulder||0);s++){const h=w((i,d,f)=>f>-.6&&f<1.6&&(i/l)**2+(d/k)**2<.99);if(!h)continue;const[g,M,m]=h;p(e.boulder,(i,d)=>{const f=.5+r()**2*2.2,b=f*(1+r()*.5),D=f*(.6+r()*.5),_=f*(1+r()*.4);i.position.set(n+g,m-f*.15,c+M),i.scale.set(b,D,_),i.rotation.set((r()-.5)*.3,r()*6.3,(r()-.5)*.3);const W=.8+r()*.4;r()<.25?d.setRGB(W*.85,W*1.02,W*.75):d.setRGB(W,W,W)})}for(let s=0;s<(y.plant||0);s++){const h=w((i,d,f)=>s%4===0?f>2&&f<12&&S(i,d)<1.5:f>.15&&f<3.2&&S(i,d)<1.6);if(!h)continue;const[g,M,m]=h;p(e.plant,(i,d)=>{const f=1+r()*1.4;i.position.set(n+g,m-.05,c+M),i.scale.set(f*(1+r()*.3),f*(.8+r()*.4),f*(1+r()*.3)),i.rotation.set((r()-.5)*.15,r()*6.3,(r()-.5)*.15),d.setHSL(.2+r()*.1,.3+r()*.2,.62+r()*.18)})}}function t(){const n=Qe(),c=O(new R({vertexColors:!0,roughness:.9})),l=O(new R({vertexColors:!0,roughness:.85,side:we})),k=[[e.crownNear,[11,23,37].map(u=>ne(u,1,5)),n],[e.crownFar,[11,23].map(u=>ne(u,0,4)),n],[e.shrub,[51,63].map(u=>ne(u,0,4)),n],[e.palm,[71,83].map(Oe),l],[e.trunk,[Je()],c],[e.boulder,[5,9].map(Ke),c],[e.plant,[[91,!1],[97,!0],[103,!1]].map(([u,x])=>Ye(u,x)),l]];for(const[u,x,C]of k){const N=x.map(y=>{const r=new xe(y,C,Math.max(1,Math.ceil(u.length/x.length)));return r.userData.palmWind=!!y.attributes.palmWind,r.count=0,r.castShadow=r.receiveShadow=!0,a.add(r),r});u.forEach(([y,r],v)=>{const z=N[v%N.length];z.setMatrixAt(z.count,y),z.setColorAt(z.count,r),z.count++});for(const y of N)y.instanceMatrix.needsUpdate=!0,y.instanceColor&&(y.instanceColor.needsUpdate=!0),y.computeBoundingSphere()}return Object.fromEntries(Object.entries(e).map(([u,x])=>[u,x.length]))}return{plant:o,finish:t}}function it(a,e,o=!0){a?.traverse(t=>{if(!t.userData.palmWind)return;const n=t.material.clone(),c=t.material.onBeforeCompile,l={value:Number(o)};n.userData.palmWindEnabled=l,n.onBeforeCompile=(k,u)=>{c.call(n,k,u),k.uniforms.palmClock=e,k.uniforms.palmWindEnabled=l,k.vertexShader=`uniform float palmClock;uniform float palmWindEnabled;attribute float palmWind;
`+k.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
    float phase=palmClock*1.1+instanceMatrix[3].x*.07+instanceMatrix[3].z*.05;
    transformed.x+=palmWind*palmWindEnabled*.006*sin(phase+position.x*6.);transformed.z+=palmWind*palmWindEnabled*.004*sin(phase*.83+position.z*7.);`)},n.customProgramCacheKey=()=>"island-palm-wind",t.material=n})}const ce=[],Se=(a,e)=>{let o=-1/0;for(const t of ce){const n=a-t.cx,c=e-t.cz;(n/t.rx)**2+(c/t.rz)**2<1&&(o=Math.max(o,t.shape(n,c)))}return o},lt=(a,e)=>Math.max(Y(a,e),Se(a,e)),ct=(a,e)=>Se(a,e)<=Y(a,e)+.15;function mt(a){ce.length=0;let e=7921;const o=()=>(e=1664525*e+1013904223>>>0,e/4294967296),t=new ee;t.name="shared-coastal-landforms",a.add(t);function n(N,y,r,v,z){const S=(m,i)=>{const d=Math.max(0,1-(m/r)**2-(i/v)**2),f=m/r-.14,b=i/v+.1,D=Math.max(0,1-2.2*(f*f+b*b)),_=.1*Math.sin(m*.14+i*.06)+.07*Math.sin(m*.31-i*.22)+.05*Math.sin(m*.8+i*.5);return z*(.5*d**1.6+.5*D**1.7*d**.5)*(1+_)-.5},P=(m,i)=>Math.hypot(S(m+1,i)-S(m-1,i),S(m,i+1)-S(m,i-1))/2,w=(m,i,d)=>d>.35&&(d<1.3+1.6*(.5+.5*Math.sin(m*.37+i*.23)*Math.cos(i*.29-m*.11))||P(m,i)>1.25),p=new Le(r*2,v*2,140,90);p.rotateX(-Math.PI/2);const s=p.attributes.position,h=[];for(let m=0;m<s.count;m++){const i=s.getX(m),d=s.getZ(m),f=S(i,d);s.setY(m,f);const b=Math.sin(i*12.9898+d*78.233)*43758.5453,D=.8+.35*(b-Math.floor(b)),_=Math.sin(i*.9)*Math.sin(d*.7)*.5+.5,W=new E(f<.35?13482898:w(i,d,f)?f<1.2?4867646:6775386:_>.5?4148522:4937265);W.multiplyScalar(D),h.push(W.r,W.g,W.b)}p.setAttribute("color",new V(h,3)),p.computeVertexNormals();const g=new ve(p,O(new R({vertexColors:!0,roughness:1})));g.position.set(N,0,y),g.receiveShadow=!0,g.castShadow=!0,t.add(g);const M=(m,i)=>{const d=Math.max(0,1-(m/r)**2-(i/v)**2);return Math.pow(d,.7)*(z*(.7+.18*Math.sin(m*.14+i*.06)+.12*Math.sin(m*.31-i*.22))+2*Math.sin(m*.8+i*.5))-.5};for(let m=0;m<7881;m++)o();for(let m=0;m<3200;m++){const i=(o()-.5)*r*1.65,d=(o()-.5)*v*1.65;if(M(i,d)<3){m--;continue}for(let f=0;f<5;f++)o()}return{shape:S,rock:w}}const c=[[90,-340,105,40,29,"far",{canopy:3400,shrub:700,palm:170,boulder:320,plant:900},211],[114,-58,64,78,29,"near",{canopy:3100,shrub:900,palm:220,boulder:380,plant:1300},307]],l=new ee;l.name="island-vegetation",t.add(l);const k=et(l);for(const[N,y,r,v,z,S,P,w]of c){const{shape:p,rock:s}=n(N,y,r,v,z);ce.push({cx:N,cz:y,rx:r,rz:v,shape:p}),k.plant({cx:N,cz:y,rx:r,rz:v,shape:p,rock:s,seed:w,detail:S,counts:P})}k.finish();const u=new ee;u.name="shared-tide-debris",a.add(u);const x=[new Ve(1,7,4),new K(1,0),new He(1,.12,4,7,3.5)],C=[new R({color:15655368}),new R({color:7237991}),new R({color:4801331})];for(let N=0;N<3;N++){const y=new xe(x[N],C[N],240),r=new ge;for(let v=0;v<240;v++){const z=(o()-.5)*150,S=B(z)+3.8+o()*1.5+Math.sin(z*1.7)*.4,P=.045+o()*.1;r.position.set(z,Y(z,S)+.025,S),r.scale.set(P*(N===2?2:1),P*.3,P*.7),r.rotation.set(0,o()*6,0),r.updateMatrix(),y.setMatrixAt(v,r.matrix)}y.castShadow=!0,u.add(y)}}export{ae as S,oe as W,mt as a,$e as b,at as c,st as d,ct as e,nt as f,te as g,it as h,Se as i,lt as l,rt as s};
