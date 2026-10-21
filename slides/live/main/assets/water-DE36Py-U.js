import{M as se,V as C,C as U,ar as ne,ai as j,c as le,g as ce,h as me,U as O,aJ as Q,e as fe,X as de,a7 as $,d as ue,F as pe}from"./GLTFLoader-e7d2jBf9.js";import{a as he,s as R}from"./props-Ba5MSs7X.js";class ve extends se{constructor(a,e={}){super(a),this.isWater=!0;const o=this,r=e.textureWidth!==void 0?e.textureWidth:512,s=e.textureHeight!==void 0?e.textureHeight:512,i=e.clipBias!==void 0?e.clipBias:0,f=e.alpha!==void 0?e.alpha:1,c=e.time!==void 0?e.time:0,n=e.waterNormals!==void 0?e.waterNormals:null,d=e.sunDirection!==void 0?e.sunDirection:new C(.70707,.70707,0),w=new U(e.sunColor!==void 0?e.sunColor:16777215),b=new U(e.waterColor!==void 0?e.waterColor:8355711),z=e.eye!==void 0?e.eye:new C(0,0,0),u=e.distortionScale!==void 0?e.distortionScale:20,k=e.side!==void 0?e.side:ne,h=e.fog!==void 0?e.fog:!1,P=new de,S=new C,m=new C,l=new C,M=new j,_=new C(0,0,-1),x=new $,D=new C,W=new C,q=new $,V=new j,v=new le,J=new ce(r,s,{type:me}),H={name:"MirrorShader",uniforms:O.merge([Q.fog,Q.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new j},sunColor:{value:new U(8355711)},sunDirection:{value:new C(.70707,.70707,0)},eye:{value:new C},waterColor:{value:new U(5592405)}}]),vertexShader:`
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
				}`},y=new fe({name:H.name,uniforms:O.clone(H.uniforms),vertexShader:H.vertexShader,fragmentShader:H.fragmentShader,lights:!0,side:k,fog:h});y.uniforms.mirrorSampler.value=J.texture,y.uniforms.textureMatrix.value=V,y.uniforms.alpha.value=f,y.uniforms.time.value=c,y.uniforms.normalSampler.value=n,y.uniforms.sunColor.value=w,y.uniforms.waterColor.value=b,y.uniforms.sunDirection.value=d,y.uniforms.distortionScale.value=u,y.uniforms.eye.value=z,o.material=y,o.onBeforeRender=function(p,oe,F){if(m.setFromMatrixPosition(o.matrixWorld),l.setFromMatrixPosition(F.matrixWorld),M.extractRotation(o.matrixWorld),S.set(0,0,1),S.applyMatrix4(M),D.subVectors(m,l),D.dot(S)>0)return;D.reflect(S).negate(),D.add(m),M.extractRotation(F.matrixWorld),_.set(0,0,-1),_.applyMatrix4(M),_.add(l),W.subVectors(m,_),W.reflect(S).negate(),W.add(m),v.position.copy(D),v.up.set(0,1,0),v.up.applyMatrix4(M),v.up.reflect(S),v.lookAt(W),v.far=F.far,v.updateMatrixWorld(),v.projectionMatrix.copy(F.projectionMatrix),V.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),V.multiply(v.projectionMatrix),V.multiply(v.matrixWorldInverse),P.setFromNormalAndCoplanarPoint(S,m),P.applyMatrix4(v.matrixWorldInverse),x.set(P.normal.x,P.normal.y,P.normal.z,P.constant);const N=v.projectionMatrix;q.x=(Math.sign(x.x)+N.elements[8])/N.elements[0],q.y=(Math.sign(x.y)+N.elements[9])/N.elements[5],q.z=-1,q.w=(1+N.elements[10])/N.elements[14],x.multiplyScalar(2/x.dot(q)),N.elements[2]=x.x,N.elements[6]=x.y,N.elements[10]=x.z+1-i,N.elements[14]=x.w,z.setFromMatrixPosition(F.matrixWorld);const ae=p.getRenderTarget(),re=p.xr.enabled,ie=p.shadowMap.autoUpdate;o.visible=!1,p.xr.enabled=!1,p.shadowMap.autoUpdate=!1,p.setRenderTarget(J),p.state.buffers.depth.setMask(!0),p.autoClear===!1&&p.clear(),p.render(oe,v),o.visible=!0,p.xr.enabled=re,p.shadowMap.autoUpdate=ie,p.setRenderTarget(ae);const Z=F.viewport;Z!==void 0&&p.state.viewport(Z)}}}const X=`${he}
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
`,xe=`
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
`,ge=`
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
`,B=24,T={xs:null,ds:null};function te(){const t=[],a=[];for(let i=40;i>0;i--)t.push(-140-1860*(i/40)**2);for(let i=0;i<=350;i++)t.push(-140+i*.8);for(let i=1;i<=40;i++)t.push(140+1860*(i/40)**2);for(let i=0;i<=186;i++)a.push(-5+i*.35);for(let i=1;i<=70;i++)a.push(60.1+2140*(i/70)**2);T.xs=t,T.ds=a;const e=[],o=[];for(const i of a)for(const f of t)e.push(f,-(R(f)-i),0);const r=t.length;for(let i=0;i<a.length-1;i++)for(let f=0;f<r-1;f++){const c=i*r+f,n=c+1,d=c+r,w=d+1;o.push(c,n,w,c,w,d)}const s=new ue;return s.setAttribute("position",new pe(e,3)),s.setIndex(o),s.computeVertexNormals(),s}function Ne(t){const a=new ve(te(),{textureWidth:512,textureHeight:512,sunDirection:t,sunColor:16774362,waterColor:556956,distortionScale:.55,fog:!0});return a.rotation.x=-Math.PI/2,a.frustumCulled=!1,a.name="lagoon-water",a.material.uniforms.wakeRings={value:Array.from({length:B},()=>new $)},a.material.vertexShader=`
 uniform mat4 textureMatrix;uniform float time;
 varying vec4 mirrorCoord;varying vec4 worldPosition;
 varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_vertex>
 #include <logdepthbuf_pars_vertex>
 ${X}
 ${xe}
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
 }`,a.material.fragmentShader=`
 uniform mat4 textureMatrix;uniform sampler2D mirrorSampler;uniform float time;uniform vec3 eye;uniform vec3 sunDirection;uniform vec3 sunColor;
 uniform vec4 wakeRings[${B}];
 varying vec4 mirrorCoord;varying vec4 worldPosition;varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_fragment>
 #include <logdepthbuf_pars_fragment>
 ${X}
 ${ge}
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
  for(int i=0;i<${B};i++){vec4 r=wakeRings[i];if(r.w<=.3)continue;vec2 q=worldPosition.xz-r.xy;float dist=length(q),age=time-r.z;
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
 }`,a}function Ce(t,a){t.onBeforeCompile=e=>{e.uniforms.time=a,e.vertexShader=`varying vec3 vWorld;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
vWorld=(modelMatrix*vec4(position,1.)).xyz;`),e.fragmentShader=`uniform float time;varying vec3 vWorld;
`+X+`
`+e.fragmentShader,e.fragmentShader=e.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
   float wet=wetSand(vWorld.xz,time);
   float grain=waterHash(vWorld.xz*173.);
   float ripple=sin(vWorld.x*2.2+sin(vWorld.z*.7)*2.+sin(vWorld.x*.3))*sin(vWorld.z*8.);
   diffuseColor.rgb*=mix(vec3(1.),vec3(.62,.57,.49),wet)*(.95+grain*.10+ripple*.025);
  `),e.fragmentShader=e.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
   float fresh=1.-smoothstep(swashFront(vWorld.x,time)-.1,swashFront(vWorld.x,time)+.6,vWorld.z-shore(vWorld.x));
   roughnessFactor=mix(.92,.33,wet);roughnessFactor=mix(roughnessFactor,.16,fresh);
  `),e.fragmentShader=e.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
   float phase=vWorld.z*15.+sin(vWorld.x*.8)*1.8+sin(vWorld.z*1.4);
   vec3 rippleNormal=vec3(cos(phase)*.012,0.,cos(phase)*.035);
   normal=normalize(normal+mat3(viewMatrix)*rippleNormal*(1.-wet*.8)*(.55+.45*sin(vWorld.x*.34)*sin(vWorld.z*.56))/(1.+length(vViewPosition)*.012));
  `),e.fragmentShader=e.fragmentShader.replace("#include <opaque_fragment>",`
   float wetFresnel=.02+.98*pow(1.-abs(dot(normal,normalize(vViewPosition))),5.);
   outgoingLight=mix(outgoingLight,vec3(.24,.44,.61),wet*wetFresnel*.35);
   #include <opaque_fragment>`)}}const we=[[.22,1,.29,19,.5],[-.38,1,.16,11.3,2.4],[.72,.69,.085,6.7,4.1],[-.81,.59,.045,3.8,1.1]].map(([t,a,e,o,r])=>{const s=Math.hypot(t,a),i=6.283185/o;return[t/s,a/s,e,i,Math.sqrt(9.81*i),r]}),g=(t,a,e)=>{const o=Math.max(0,Math.min(1,(e-t)/(a-t)));return o*o*(3-2*o)},L=t=>t-Math.floor(t);function E(t,a){let e=L(t*.1031),o=L(a*.103),r=L(t*.0973);const s=e*(o+33.33)+o*(r+33.33)+r*(e+33.33);return e+=s,o+=s,r+=s,L((e+o)*r)}function ye(t,a){const e=Math.floor(t),o=Math.floor(a),r=g(0,1,L(t)),s=g(0,1,L(a));return(E(e,o)*(1-r)+E(e+1,o)*r)*(1-s)+(E(e,o+1)*(1-r)+E(e+1,o+1)*r)*s}function be(t,a){const e=L((a*1.36+.42*Math.sin(t*.105)+.19*Math.sin(t*.29)-1.1)/6.283185);return-.35+(2.4+.45*Math.sin(t*.19)+.22*Math.sin(t*.57))*g(0,.28,e)*(1-g(.28,1,e))}function K(t,a,e,o){const r=R(t)-a,s=g(0,16,r)*(.68+.32*g(15,90,r))*(1-g(100,550,r))*(1-g(140,500,Math.abs(t)));let i=0,f=0,c=.035;for(let z=0;z<4;z++){const u=we[z],k=u[3]*(u[0]*t+u[1]*a)-u[4]*e+u[5],h=u[2]*s;i+=.62*h*u[0]*Math.cos(k),f+=.62*h*u[1]*Math.cos(k),c+=h*Math.sin(k)}const n=r*.68+e*1.36+.42*Math.sin(t*.105)+.19*Math.sin(t*.29),d=g(0,2.2,r)*(1-g(13,30,r));c+=(Math.sin(n)+.32*Math.sin(2*n))*.29*d;const w=Math.exp(-((Math.atan2(Math.sin(n-1.1),Math.cos(n-1.1))/.5)**2));c+=(ye(t*2.3,a*2.3-e*.65)-.5)*.07*w*d,c=Math.max(c,-Math.max(r,0)*.12+.025);const b=-r;if(b>-.15){const z=.75*(1-Math.exp(-Math.max(b,0)/32))+.34*Math.exp(-(((b-5.2)/2.2)**2)),u=z+.012+.018*g(0,1,be(t,e)-b);c+=(u-c)*g(-.15,.12,b)}o.x=t+i,o.z=a+f,o.height=c}function G(t,a,e,o){let r=t,s=a;for(let i=0;i<4;i++)K(r,s,e,o),r+=t-o.x,s+=a-o.z;return K(r,s,e,o),o.height}const A={},I=new Map;let Y=NaN;function ze(t,a,e){e!==Y&&(I.clear(),Y=e);const o=t*4096+a;let r=I.get(o);if(!r){const s=T.xs[t];K(s,R(s)-T.ds[a],e,A),r={x:A.x,z:A.z,height:A.height},I.set(o,r)}return r}function ee(t,a){let e=0,o=t.length-2;for(;e<o;){const r=e+o+1>>1;t[r]<=a?e=r:o=r-1}return e}function Pe(t,a,e){T.xs||te();const{xs:o,ds:r}=T;let s=t,i=a,f=0;for(let c=0;c<5;c++){const n=ee(o,s),d=ee(r,R(s)-i),w=(m,l)=>[o[m],R(o[m])-r[l]],b=w(n,d),z=w(n+1,d),u=w(n,d+1),k=w(n+1,d+1);let h=null;for(const m of[[b,z,k,[n,d],[n+1,d],[n+1,d+1]],[b,k,u,[n,d],[n+1,d+1],[n,d+1]]]){const[l,M,_]=m,x=(M[0]-l[0])*(_[1]-l[1])-(_[0]-l[0])*(M[1]-l[1]),D=((s-l[0])*(_[1]-l[1])-(_[0]-l[0])*(i-l[1]))/x,W=((M[0]-l[0])*(i-l[1])-(s-l[0])*(M[1]-l[1]))/x,q=1-D-W,V=Math.min(q,D,W);(!h||V>h.worst)&&(h={worst:V,w:[q,D,W],ix:m.slice(3)})}let P=0,S=0;f=0;for(let m=0;m<3;m++){const l=ze(...h.ix[m],e);P+=h.w[m]*l.x,S+=h.w[m]*l.z,f+=h.w[m]*l.height}s+=t-P,i+=a-S}return f}function _e(t,a,e,o){const r=G(t,a,e,o),s=G(t+.06,a,e,o),i=G(t,a+.06,e,o),f=(r-s)/.06,c=(r-i)/.06,n=Math.hypot(f,1,c);return o.x=t,o.z=a,o.height=r,o.nx=f/n,o.ny=1/n,o.nz=c/n,o}export{B as W,_e as a,be as b,Ne as c,Pe as d,Ce as s};
