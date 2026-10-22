import{V as b,aI as re,aA as se,aJ as ne,aK as ie,ad as J,aL as le,S as ce,C as de,O as pe,H as fe,D as he,a8 as me,M as v,au as H,a as ue,K as I,a7 as ge,X as K,ah as ve,Y as N,Z,b as w,ab as $,t as we,h as xe,i as be,aw as Me,a4 as ye,f as ze,g as Se,_ as Ce}from"./url-ddkRYY_O.js";const Ie=[{id:"hermit_crab",name:"寄居蟹",size:.06,display:.24,hidden:!0,position:[-.62,0,.36],fact:"潮間帶的寄居蟹借住空螺殼，柔軟的腹部就藏在殼裡。"},{id:"starfish",name:"海星",size:.15,display:.34,position:[.16,.012,.48],fact:"海星靠腹面的許多小管足移動，也能用管足牢牢附著在岩面。"},{id:"anemone",name:"海葵",size:.08,display:.26,position:[-.91,.13,-.29],fact:"海葵是動物；觸手上的刺細胞能捕捉食物，觀察時不要觸摸。"},{id:"urchin",name:"海膽",size:.08,display:.24,position:[.96,.14,-.16],fact:"海膽除了有棘刺，也有能伸縮的管足，幫助牠在礁石間移動。"},{id:"octopus",name:"小章魚",size:.25,display:.55,hidden:!0,position:[.42,0,-.34],fact:"小章魚會改變體色躲進石縫；在臺灣岩岸觀察時，請把牠留在原處。"},{id:"nudibranch",name:"海蛞蝓",size:.05,display:.2,hidden:!0,position:[-.22,0,-.12],fact:"海蛞蝓是沒有外殼的腹足類，頭上的嗅角能感知水中的化學訊息。"}],Te=1.65,U=.205;function De(){const h=new J(1,3),d=h.attributes.position;for(let n=0;n<d.count;n++){const c=d.getX(n),l=d.getY(n),f=d.getZ(n),u=1+.1*Math.sin(c*9+l*6)*Math.cos(f*8-c*4)+.045*Math.sin(f*17+l*11);d.setXYZ(n,c*u,l*u,f*u)}h.deleteAttribute("normal"),h.deleteAttribute("uv");const r=le(h);return r.computeVertexNormals(),h.dispose(),r}function Pe(){const d=new Uint8Array(65536);for(let n=0;n<128;n++)for(let c=0;c<128;c++){const l=c/128*Math.PI*2,f=n/128*Math.PI*2,u=.38*Math.cos(l*3+f*2)+.21*Math.cos(l*7-f*4)+.15*Math.sin(l*11+f*7),M=.3*Math.cos(l*3+f*2)-.24*Math.cos(l*7-f*4)+.13*Math.sin(l*11+f*7),m=new b(u,M,1).normalize(),g=(n*128+c)*4;d[g]=(m.x*.5+.5)*255,d[g+1]=(m.y*.5+.5)*255,d[g+2]=m.z*255,d[g+3]=255}const r=new re(d,128,128);return r.wrapS=r.wrapT=se,r.magFilter=ne,r.minFilter=ie,r.generateMipmaps=!0,r.needsUpdate=!0,r}const We=`
 float hash31(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;function Ge(h){let d=904;const r=()=>(d=d*1664525+1013904223>>>0,d/4294967296),n=new ce;n.background=new de("#a99e8e");const c=new pe(-2,2,1.5,-1.5,.01,30);c.position.set(0,4.6,5.5),c.lookAt(0,0,0),n.add(new fe("#d5edf7","#8d7760",1.75));const l=new he("#ffe1b6",3.15);l.position.set(-3.5,3.3,-2.6),n.add(l),l.castShadow=!0,l.shadow.mapSize.set(2048,2048),Object.assign(l.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:16}),l.shadow.bias=-3e-4,l.shadow.normalBias=.009,l.shadow.radius=3;const f={value:0},u=e=>1+.055*Math.sin(e*5)+.035*Math.cos(e*9),M=new me;for(let e=0;e<=160;e++){const a=e/160*Math.PI*2,t=u(a),o=Math.cos(a)*1.52*t,s=Math.sin(a)*1.02*t;e?M.lineTo(o,s):M.moveTo(o,s)}function m(e,a="rock"){const t=new w({color:e,roughness:a==="sand"?.94:.76,metalness:0});return t.onBeforeCompile=o=>{o.uniforms.poolTime=f,o.vertexShader=`varying vec3 poolWorld;
`+o.vertexShader,o.vertexShader=o.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
poolWorld=(modelMatrix*vec4(position,1.)).xyz;`),o.fragmentShader=`uniform float poolTime;varying vec3 poolWorld;
`+We+o.fragmentShader,o.fragmentShader=o.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
    float broad=noise3(poolWorld*8.);float fine=noise3(poolWorld*160.);
    float basin=1.-smoothstep(.92,1.16,length(poolWorld.xz/vec2(1.56,1.06)));
    float wet=(1.-smoothstep(.19,.24,poolWorld.y))*basin;
    diffuseColor.rgb*=.70+broad*.38+fine*.20;
    ${a==="sand"?`
      float bands=sin(poolWorld.x*30.+sin(poolWorld.z*13.)*1.3)*.025;
      diffuseColor.rgb+=bands;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.73,.82,.76),wet*.55);
    `:`
      float strata=pow(.5+.5*sin(poolWorld.y*67.+broad*5.+poolWorld.x*3.),12.);
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.35,strata*.24);
      diffuseColor.rgb*=mix(1.,.53,wet);
      float algae=wet*smoothstep(.45,.73,noise3(poolWorld*22.))*.38;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.075,.115,.045),algae);
      float meniscus=exp(-pow((poolWorld.y-${U})/.005,2.))*basin;
      diffuseColor.rgb+=vec3(.35,.55,.48)*meniscus*.65;
    `}
    vec2 q=poolWorld.xz*21.;q+=vec2(sin(q.y*.57+poolTime*.72),cos(q.x*.49-poolTime*.58));
    float caustic=pow(1.-abs(sin(q.x+sin(q.y))),18.)+pow(1.-abs(sin(q.y+sin(q.x))),20.);
    diffuseColor.rgb+=vec3(.30,.40,.22)*caustic*wet*.35;
   `),o.fragmentShader=o.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor=mix(roughnessFactor,.29,wet);`),a!=="sand"&&(o.fragmentShader=o.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
    float pores=noise3(poolWorld*95.)*.0025+noise3(poolWorld*22.)*.005;
    vec3 surfX=dFdx(vViewPosition),surfY=dFdy(vViewPosition);
    vec3 r1=cross(surfY,normal),r2=cross(normal,surfX);
    normal=normalize(normal-sign(dot(surfX,r1))*(dFdx(pores)*r1+dFdy(pores)*r2)/max(abs(dot(surfX,r1)),.00001));
   `))},t.customProgramCacheKey=()=>`pool-${a}`,t}const g=new v(new H(M,48),m("#bcb199","sand"));g.rotation.x=-Math.PI/2,g.receiveShadow=!0,n.add(g);const D=new v(new ue(200,200),m("#b3a392","sand"));D.rotation.x=-Math.PI/2,D.position.y=-.065,D.receiveShadow=!0,n.add(D);const T=De(),Q=m("#777472"),ee=m("#b2a798"),G=["#777472","#82766b","#686b6b","#9a8773","#74716e"].map(e=>m(e)),P=new I;n.add(P);const F=[],k=[],L=[],R=[],q=[],A=[],z=new ge,V=new J(1,1),E=new K(1,1,7,1,!0),X=new ve(1,7);X.rotateX(-Math.PI/2);function S(e,a,t,o,s,p,i,ae,te=0){z.position.set(t,o,s),z.rotation.set(0,te,0),z.scale.set(p,i,ae),z.updateMatrix(),e.push(a.clone().applyMatrix4(z.matrix))}function W(e,a,t,o,s,p=-.025){const i=new v(T,G[Math.floor(r()*G.length)]);return i.position.set(e,p,a),i.scale.set(t,o,s),i.rotation.set(r()*.25,r()*6,r()*.22),i.castShadow=!0,i.receiveShadow=!0,P.add(i),i}function j(e,a){for(let t=0;t<a;t++){const o=(r()-.5)*e.scale.x,s=(r()-.5)*e.scale.z,p=e.position.y+e.scale.y*Math.sqrt(Math.max(.1,1-(o/e.scale.x)**2-(s/e.scale.z)**2)),i=.01+r()*.008;S(F,E,e.position.x+o,p,e.position.z+s,i,i*1.1,i),S(k,X,e.position.x+o,p+i*.56,e.position.z+s,i*.35,1,i*.35)}}for(let e=0;e<43;e++){const a=e/43*Math.PI*2,t=u(a),o=Math.cos(a)*1.56*t,s=Math.sin(a)*1.06*t,p=W(o,s,.14+r()*.15,.14+r()*.1,.13+r()*.12,.09);j(p,7);for(let i=0;i<3;i++)S(R,V,o+(r()-.5)*.23,.15,s+(r()-.5)*.23,.02+r()*.04,.012,.025,r()*6)}for(let e=0;e<105;e++){const a=(r()-.5)*10,t=(r()-.5)*13;if((a/1.95)**2+(t/1.45)**2<1)continue;const o=.1+Math.pow(r(),2)*.44,s=W(a,t,o*(1+r()),o*(.35+r()*.5),o*(.7+r()));e%3===0&&j(s,8),e%4===0&&S(q,E,a+.025,s.position.y+s.scale.y+.012,t,.035,.035,.025,r()*6)}for(let e=0;e<1700;e++){const a=(r()-.5)*11,t=(r()-.5)*14,o=(a/1.45)**2+(t/.94)**2<1,s=o?.004+r()*.014:.012+r()*.043;S(L,V,a,o?.008:-.035,t,s,s*.45,s*.75,r()*6)}for(let e=0;e<45;e++){const a=r()*Math.PI*2,t=1.35+r()*1.7,o=Math.cos(a)*1.5*t,s=Math.sin(a)*1.05*t;for(let p=0;p<4;p++){const i=new N([new b(o,-.04,s),new b(o+.07,-.028,s+.08*p),new b(o+.13+r()*.12,-.03,s+.1*p+.06)]);A.push(new Z(i,8,.005+r()*.004,4,!1))}}function y(e,a){if(!e.length)return;const t=new v(Ce(e),a);t.castShadow=!0,t.receiveShadow=!0,P.add(t),e.forEach(o=>o.dispose())}y(F,new w({color:"#c4bfb1",roughness:.85,side:$})),y(k,new w({color:"#4d4540",roughness:1})),y(q,new w({color:"#9d8065",roughness:.65,side:$})),y(L,m("#8a8277")),y(R,new w({color:"#526342",roughness:.6})),y(A,new w({color:"#57432d",roughness:.9}));const O=[];for(let e=0;e<15;e++){const a=r()*Math.PI*2,t=.82+r()*.07,o=new I;o.position.set(Math.cos(a)*1.4*t,.005,Math.sin(a)*.9*t),n.add(o),O.push(o);for(let s=0;s<4;s++){const p=new N([new b(0,0,0),new b(.012*s,.08,0),new b(.02*s,.12+r()*.07,.025)]);o.add(new v(new Z(p,6,.006,4,!1),new w({color:s%2?"#7c8152":"#436c55"})))}}for(const[e,a]of[[-.91,-.29],[.96,-.16]])W(e,a,.2,.1,.16,.025);const B=[];for(let e=0;e<6;e++){const a=new I,t=new w({color:e%2?"#aab9b0":"#526b69",metalness:0,roughness:.3}),o=new v(new we(1,10,6),t);o.scale.set(.035,.009,.012),a.add(o);const s=new v(new K(.012,.025,3),t);s.rotation.z=Math.PI/2,s.position.x=-.04,a.add(s),n.add(a),B.push(a)}const C=new xe(1,1,{type:be,depthBuffer:!0});C.depthTexture=new Me(1,1);const _=Array.from({length:8},()=>new ye(0,0,-100,0));let oe=0;const Y=new ze({uniforms:{image:{value:C.texture},sceneDepth:{value:C.depthTexture},normalMap:{value:Pe()},time:f,resolution:{value:new Se},ripples:{value:_},depthRange:{value:c.far-c.near},sunDirection:{value:l.position.clone().normalize()}},vertexShader:"varying vec3 world;void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}",fragmentShader:`
   uniform sampler2D image,sceneDepth,normalMap;uniform float time,depthRange;uniform vec2 resolution;uniform vec4 ripples[8];uniform vec3 sunDirection;varying vec3 world;
   void main(){
    vec2 p=world.xz,uv=gl_FragCoord.xy/resolution;
    vec2 wave=(texture2D(normalMap,p*.65+vec2(time*.012,-time*.009)).xy*2.-1.);
    wave+=(texture2D(normalMap,p*1.17+vec2(-time*.014,time*.008)).xy*2.-1.)*.5;
    float ring=0.;
    for(int i=0;i<8;i++){
     float age=time-ripples[i].z,d=length(p-ripples[i].xy);
     float envelope=exp(-pow((d-age*.28)*24.,2.))*exp(-max(age,0.)*.65)*step(0.,age);
     float w=sin(d*95.-age*27.)*envelope;
     wave+=normalize(p-ripples[i].xy+vec2(.0001))*w*.7;ring+=w;
    }
    vec3 normal=normalize(vec3(wave.x*.25,1.,wave.y*.25));
    vec3 viewDir=normalize(cameraPosition-world);
    float depth=max(0.,(texture2D(sceneDepth,uv).r-gl_FragCoord.z)*depthRange);
    vec2 offset=wave*.004*smoothstep(0.,.12,depth);
    // Keep foreground rock silhouettes out of the refracted underwater image.
    vec2 refracted=clamp(uv+offset,vec2(.001),vec2(.999));
    if(texture2D(sceneDepth,refracted).r<gl_FragCoord.z)refracted=uv;
    vec3 under=texture2D(image,refracted).rgb;
    vec3 transmission=exp(-vec3(1.5,.48,.34)*depth);
    vec3 col=under*transmission+vec3(.035,.27,.255)*(1.-transmission);
    float fresnel=.055+.945*pow(1.-max(dot(viewDir,normal),0.),5.);
    vec3 reflected=reflect(-viewDir,normal);
    float skyBand=.5+.5*sin(reflected.x*17.+reflected.z*9.);
    vec3 sky=mix(vec3(.26,.48,.59),vec3(.72,.88,.91),smoothstep(.0,.9,skyBand));
    col=mix(col,sky,fresnel*.85+.02);
    vec3 halfDir=normalize(sunDirection+viewDir);
    float glint=pow(max(dot(normal,halfDir),0.),120.);
    col+=vec3(1.,.87,.64)*glint*1.1;
    col+=vec3(.28,.50,.51)*max(ring,0.)*.16;
    gl_FragColor=vec4(col,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`,depthWrite:!1,transparent:!0}),x=new v(new H(M,48),Y);return x.rotation.x=-Math.PI/2,x.position.y=U,x.renderOrder=2,n.add(x),{scene:n,camera:c,water:x,rockGeo:T,rockMat:Q,cobbleMat:ee,ripples:_,resize(e,a){C.setSize(e,a),Y.uniforms.resolution.value.set(e,a)},ripple(e,a,t){_[oe++%8].set(e,a,t,1)},update(e){f.value=e,O.forEach((a,t)=>{a.rotation.z=Math.sin(e*.8+t)*.08,a.rotation.x=Math.cos(e*.6+t)*.07}),B.forEach((a,t)=>{const o=e*(.16+t*.012)+t*1.9,s=Math.sin(e*.7+t)*.1;a.position.set(Math.sin(o)*(.5+t*.06)+s,.13,Math.cos(o*1.3)*.62),a.rotation.y=Math.atan2(-Math.sin(o*1.3)*.8,Math.cos(o)*(.5+t*.06))})},render(){x.visible=!1,h.setRenderTarget(C),h.render(n,c),x.visible=!0,h.setRenderTarget(null),h.render(n,c)}}}export{Te as M,Ie as S,De as a,Ge as c,We as g,Pe as r};
