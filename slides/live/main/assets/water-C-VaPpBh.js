import{M as re,V as P,C as R,ar as ae,ai as A,c as ie,g as ne,h as se,U as Z,aG as J,e as le,X as ce,a7 as K,d as me,F as de}from"./GLTFLoader-Dq4q0Con.js";import{a as fe,s as L}from"./props-BfMgVns_.js";class ue extends re{constructor(r,e={}){super(r),this.isWater=!0;const t=this,i=e.textureWidth!==void 0?e.textureWidth:512,n=e.textureHeight!==void 0?e.textureHeight:512,a=e.clipBias!==void 0?e.clipBias:0,d=e.alpha!==void 0?e.alpha:1,l=e.time!==void 0?e.time:0,s=e.waterNormals!==void 0?e.waterNormals:null,f=e.sunDirection!==void 0?e.sunDirection:new P(.70707,.70707,0),b=new R(e.sunColor!==void 0?e.sunColor:16777215),S=new R(e.waterColor!==void 0?e.waterColor:8355711),N=e.eye!==void 0?e.eye:new P(0,0,0),u=e.distortionScale!==void 0?e.distortionScale:20,D=e.side!==void 0?e.side:ae,v=e.fog!==void 0?e.fog:!1,_=new ce,C=new P,m=new P,c=new P,x=new A,g=new P(0,0,-1),w=new K,W=new P,V=new P,k=new K,F=new A,h=new ie,$=new ne(i,n,{type:se}),H={name:"MirrorShader",uniforms:Z.merge([J.fog,J.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new A},sunColor:{value:new R(8355711)},sunDirection:{value:new P(.70707,.70707,0)},eye:{value:new P},waterColor:{value:new R(5592405)}}]),vertexShader:`
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
				}`},M=new le({name:H.name,uniforms:Z.clone(H.uniforms),vertexShader:H.vertexShader,fragmentShader:H.fragmentShader,lights:!0,side:D,fog:v});M.uniforms.mirrorSampler.value=$.texture,M.uniforms.textureMatrix.value=F,M.uniforms.alpha.value=d,M.uniforms.time.value=l,M.uniforms.normalSampler.value=s,M.uniforms.sunColor.value=b,M.uniforms.waterColor.value=S,M.uniforms.sunDirection.value=f,M.uniforms.distortionScale.value=u,M.uniforms.eye.value=N,t.material=M,t.onBeforeRender=function(p,Y,T){if(m.setFromMatrixPosition(t.matrixWorld),c.setFromMatrixPosition(T.matrixWorld),x.extractRotation(t.matrixWorld),C.set(0,0,1),C.applyMatrix4(x),W.subVectors(m,c),W.dot(C)>0)return;W.reflect(C).negate(),W.add(m),x.extractRotation(T.matrixWorld),g.set(0,0,-1),g.applyMatrix4(x),g.add(c),V.subVectors(m,g),V.reflect(C).negate(),V.add(m),h.position.copy(W),h.up.set(0,1,0),h.up.applyMatrix4(x),h.up.reflect(C),h.lookAt(V),h.far=T.far,h.updateMatrixWorld(),h.projectionMatrix.copy(T.projectionMatrix),F.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),F.multiply(h.projectionMatrix),F.multiply(h.matrixWorldInverse),_.setFromNormalAndCoplanarPoint(C,m),_.applyMatrix4(h.matrixWorldInverse),w.set(_.normal.x,_.normal.y,_.normal.z,_.constant);const z=h.projectionMatrix;k.x=(Math.sign(w.x)+z.elements[8])/z.elements[0],k.y=(Math.sign(w.y)+z.elements[9])/z.elements[5],k.z=-1,k.w=(1+z.elements[10])/z.elements[14],w.multiplyScalar(2/w.dot(k)),z.elements[2]=w.x,z.elements[6]=w.y,z.elements[10]=w.z+1-a,z.elements[14]=w.w,N.setFromMatrixPosition(T.matrixWorld);const ee=p.getRenderTarget(),te=p.xr.enabled,oe=p.shadowMap.autoUpdate;t.visible=!1,p.xr.enabled=!1,p.shadowMap.autoUpdate=!1,p.setRenderTarget($),p.state.buffers.depth.setMask(!0),p.autoClear===!1&&p.clear(),p.render(Y,h),t.visible=!0,p.xr.enabled=te,p.shadowMap.autoUpdate=oe,p.setRenderTarget(ee);const X=T.viewport;X!==void 0&&p.state.viewport(X)}}}const G=`${fe}
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
`,pe=`
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
`,j={xs:null,ds:null};function Q(){const o=[],r=[];for(let a=40;a>0;a--)o.push(-140-1860*(a/40)**2);for(let a=0;a<=350;a++)o.push(-140+a*.8);for(let a=1;a<=40;a++)o.push(140+1860*(a/40)**2);for(let a=0;a<=186;a++)r.push(-5+a*.35);for(let a=1;a<=70;a++)r.push(60.1+2140*(a/70)**2);j.xs=o,j.ds=r;const e=[],t=[];for(const a of r)for(const d of o)e.push(d,-(L(d)-a),0);const i=o.length;for(let a=0;a<r.length-1;a++)for(let d=0;d<i-1;d++){const l=a*i+d,s=l+1,f=l+i,b=f+1;t.push(l,s,b,l,b,f)}const n=new me;return n.setAttribute("position",new de(e,3)),n.setIndex(t),n.computeVertexNormals(),n}function ye(o){const r=new ue(Q(),{textureWidth:512,textureHeight:512,sunDirection:o,sunColor:16774362,waterColor:556956,distortionScale:.55,fog:!0});return r.rotation.x=-Math.PI/2,r.frustumCulled=!1,r.name="lagoon-water",r.material.vertexShader=`
 uniform mat4 textureMatrix;uniform float time;
 varying vec4 mirrorCoord;varying vec4 worldPosition;
 varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_vertex>
 #include <logdepthbuf_pars_vertex>
 ${G}
 ${pe}
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
 }`,r.material.fragmentShader=`
 uniform mat4 textureMatrix;uniform sampler2D mirrorSampler;uniform float time;uniform vec3 eye;uniform vec3 sunDirection;uniform vec3 sunColor;
 varying vec4 mirrorCoord;varying vec4 worldPosition;varying vec3 vWaveNormal;varying vec2 vWaterRest;
 #include <common>
 #include <fog_pars_fragment>
 #include <logdepthbuf_pars_fragment>
 ${G}
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
  vec3 color=mix(sea,reflected,clamp(fresnel,0.,.97));
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
  vec3 foamColor=vec3(.88,.96,.94)*(.80+.24*max(dot(N,sunDirection),0.));
  color=mix(color,foamColor,clamp(foam,0.,.94));
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
 }`,r}function be(o,r){o.onBeforeCompile=e=>{e.uniforms.time=r,e.vertexShader=`varying vec3 vWorld;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
vWorld=(modelMatrix*vec4(position,1.)).xyz;`),e.fragmentShader=`uniform float time;varying vec3 vWorld;
`+G+`
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
   #include <opaque_fragment>`)}}const ve=[[.22,1,.29,19,.5],[-.38,1,.16,11.3,2.4],[.72,.69,.085,6.7,4.1],[-.81,.59,.045,3.8,1.1]].map(([o,r,e,t,i])=>{const n=Math.hypot(o,r),a=6.283185/t;return[o/n,r/n,e,a,Math.sqrt(9.81*a),i]}),y=(o,r,e)=>{const t=Math.max(0,Math.min(1,(e-o)/(r-o)));return t*t*(3-2*t)},q=o=>o-Math.floor(o);function U(o,r){let e=q(o*.1031),t=q(r*.103),i=q(o*.0973);const n=e*(t+33.33)+t*(i+33.33)+i*(e+33.33);return e+=n,t+=n,i+=n,q((e+t)*i)}function he(o,r){const e=Math.floor(o),t=Math.floor(r),i=y(0,1,q(o)),n=y(0,1,q(r));return(U(e,t)*(1-i)+U(e+1,t)*i)*(1-n)+(U(e,t+1)*(1-i)+U(e+1,t+1)*i)*n}function xe(o,r){const e=q((r*1.36+.42*Math.sin(o*.105)+.19*Math.sin(o*.29)-1.1)/6.283185);return-.35+(2.4+.45*Math.sin(o*.19)+.22*Math.sin(o*.57))*y(0,.28,e)*(1-y(.28,1,e))}function I(o,r,e,t){const i=L(o)-r,n=y(0,16,i)*(.68+.32*y(15,90,i))*(1-y(100,550,i))*(1-y(140,500,Math.abs(o)));let a=0,d=0,l=.035;for(let N=0;N<4;N++){const u=ve[N],D=u[3]*(u[0]*o+u[1]*r)-u[4]*e+u[5],v=u[2]*n;a+=.62*v*u[0]*Math.cos(D),d+=.62*v*u[1]*Math.cos(D),l+=v*Math.sin(D)}const s=i*.68+e*1.36+.42*Math.sin(o*.105)+.19*Math.sin(o*.29),f=y(0,2.2,i)*(1-y(13,30,i));l+=(Math.sin(s)+.32*Math.sin(2*s))*.29*f;const b=Math.exp(-((Math.atan2(Math.sin(s-1.1),Math.cos(s-1.1))/.5)**2));l+=(he(o*2.3,r*2.3-e*.65)-.5)*.07*b*f,l=Math.max(l,-Math.max(i,0)*.12+.025);const S=-i;if(S>-.15){const N=.75*(1-Math.exp(-Math.max(S,0)/32))+.34*Math.exp(-(((S-5.2)/2.2)**2)),u=N+.012+.018*y(0,1,xe(o,e)-S);l+=(u-l)*y(-.15,.12,S)}t.x=o+a,t.z=r+d,t.height=l}function B(o,r,e,t){let i=o,n=r;for(let a=0;a<4;a++)I(i,n,e,t),i+=o-t.x,n+=r-t.z;return I(i,n,e,t),t.height}const E={};function O(o,r){let e=0,t=o.length-2;for(;e<t;){const i=e+t+1>>1;o[i]<=r?e=i:t=i-1}return e}function Me(o,r,e){j.xs||Q();const{xs:t,ds:i}=j;let n=o,a=r,d=0;for(let l=0;l<5;l++){const s=O(t,n),f=O(i,L(n)-a),b=(m,c)=>[t[m],L(t[m])-i[c]],S=b(s,f),N=b(s+1,f),u=b(s,f+1),D=b(s+1,f+1);let v=null;for(const m of[[S,N,D,[s,f],[s+1,f],[s+1,f+1]],[S,D,u,[s,f],[s+1,f+1],[s,f+1]]]){const[c,x,g]=m,w=(x[0]-c[0])*(g[1]-c[1])-(g[0]-c[0])*(x[1]-c[1]),W=((n-c[0])*(g[1]-c[1])-(g[0]-c[0])*(a-c[1]))/w,V=((x[0]-c[0])*(a-c[1])-(n-c[0])*(x[1]-c[1]))/w,k=1-W-V,F=Math.min(k,W,V);(!v||F>v.worst)&&(v={worst:F,w:[k,W,V],ix:m.slice(3)})}let _=0,C=0;d=0;for(let m=0;m<3;m++){const[c,x]=v.ix[m],g=t[c];I(g,L(g)-i[x],e,E),_+=v.w[m]*E.x,C+=v.w[m]*E.z,d+=v.w[m]*E.height}n+=o-_,a+=r-C}return d}function Se(o,r,e,t){const i=B(o,r,e,t),n=B(o+.06,r,e,t),a=B(o,r+.06,e,t),d=(i-n)/.06,l=(i-a)/.06,s=Math.hypot(d,1,l);return t.x=o,t.z=r,t.height=i,t.nx=d/s,t.ny=1/s,t.nz=l/s,t}export{Se as a,xe as b,ye as c,Me as d,be as s};
