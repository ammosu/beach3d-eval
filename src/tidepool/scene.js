import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const WATER_LEVEL=.205;
export function rockGeometry(){
 const g=new T.IcosahedronGeometry(1,3),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.10*Math.sin(x*9+y*6)*Math.cos(z*8-x*4)+.045*Math.sin(z*17+y*11);
  p.setXYZ(i,x*r,y*r,z*r);
 }
 g.deleteAttribute('normal');g.deleteAttribute('uv');const smooth=mergeVertices(g);smooth.computeVertexNormals();g.dispose();return smooth;
}

// A periodic normal texture, sampled twice at independent scales and velocities.
export function rippleNormals(){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size*Math.PI*2,v=y/size*Math.PI*2;
  const dx=.38*Math.cos(u*3+v*2)+.21*Math.cos(u*7-v*4)+.15*Math.sin(u*11+v*7);
  const dz=.30*Math.cos(u*3+v*2)-.24*Math.cos(u*7-v*4)+.13*Math.sin(u*11+v*7);
  const n=new T.Vector3(dx,dz,1).normalize(),i=(y*size+x)*4;
  data[i]=(n.x*.5+.5)*255;data[i+1]=(n.y*.5+.5)*255;data[i+2]=n.z*255;data[i+3]=255;
 }
 const map=new T.DataTexture(data,size,size);map.wrapS=map.wrapT=T.RepeatWrapping;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;
}

export const grainGLSL=`
 float hash31(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;

export function createPool(renderer){
 let seed=904;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const scene=new T.Scene();scene.background=new T.Color('#a99e8e');
 const camera=new T.OrthographicCamera(-2,2,1.5,-1.5,.01,30);camera.position.set(0,4.6,5.5);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight('#d5edf7','#8d7760',1.75));
 const sun=new T.DirectionalLight('#ffe1b6',3.15);sun.position.set(-3.5,3.3,-2.6);scene.add(sun);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:16});sun.shadow.bias=-.0003;sun.shadow.normalBias=.009;sun.shadow.radius=3;
 const uniform={value:0},rimShape=a=>1+.055*Math.sin(a*5)+.035*Math.cos(a*9);
 const outline=new T.Shape();
 for(let i=0;i<=160;i++){const a=i/160*Math.PI*2,r=rimShape(a),x=Math.cos(a)*1.52*r,z=Math.sin(a)*1.02*r;if(!i)outline.moveTo(x,z);else outline.lineTo(x,z);}

 function surfaceMaterial(color,kind='rock'){
  const mat=new T.MeshStandardMaterial({color,roughness:kind==='sand'?.94:.76,metalness:0});
  mat.onBeforeCompile=s=>{
   s.uniforms.poolTime=uniform;
   s.vertexShader='varying vec3 poolWorld;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npoolWorld=(modelMatrix*vec4(position,1.)).xyz;');
   s.fragmentShader='uniform float poolTime;varying vec3 poolWorld;\n'+grainGLSL+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float broad=noise3(poolWorld*8.);float fine=noise3(poolWorld*160.);
    float basin=1.-smoothstep(.92,1.16,length(poolWorld.xz/vec2(1.56,1.06)));
    float wet=(1.-smoothstep(.19,.24,poolWorld.y))*basin;
    diffuseColor.rgb*=.70+broad*.38+fine*.20;
    ${kind==='sand'?`
      float bands=sin(poolWorld.x*30.+sin(poolWorld.z*13.)*1.3)*.025;
      diffuseColor.rgb+=bands;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.73,.82,.76),wet*.55);
    `:`
      float strata=pow(.5+.5*sin(poolWorld.y*67.+broad*5.+poolWorld.x*3.),12.);
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.35,strata*.24);
      diffuseColor.rgb*=mix(1.,.53,wet);
      float algae=wet*smoothstep(.45,.73,noise3(poolWorld*22.))*.38;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.075,.115,.045),algae);
      float meniscus=exp(-pow((poolWorld.y-${WATER_LEVEL})/.005,2.))*basin;
      diffuseColor.rgb+=vec3(.35,.55,.48)*meniscus*.65;
    `}
    vec2 q=poolWorld.xz*21.;q+=vec2(sin(q.y*.57+poolTime*.72),cos(q.x*.49-poolTime*.58));
    float caustic=pow(1.-abs(sin(q.x+sin(q.y))),18.)+pow(1.-abs(sin(q.y+sin(q.x))),20.);
    diffuseColor.rgb+=vec3(.30,.40,.22)*caustic*wet*.35;
   `);
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.29,wet);');
   if(kind!=='sand')s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    float pores=noise3(poolWorld*95.)*.0025+noise3(poolWorld*22.)*.005;
    vec3 surfX=dFdx(vViewPosition),surfY=dFdy(vViewPosition);
    vec3 r1=cross(surfY,normal),r2=cross(normal,surfX);
    normal=normalize(normal-sign(dot(surfX,r1))*(dFdx(pores)*r1+dFdy(pores)*r2)/max(abs(dot(surfX,r1)),.00001));
   `);
  };
  mat.customProgramCacheKey=()=>`pool-${kind}`;return mat;
 }
 const bottom=new T.Mesh(new T.ShapeGeometry(outline,48),surfaceMaterial('#bcb199','sand'));bottom.rotation.x=-Math.PI/2;bottom.receiveShadow=true;scene.add(bottom);
 const bed=new T.Mesh(new T.PlaneGeometry(200,200),surfaceMaterial('#b3a392','sand'));bed.rotation.x=-Math.PI/2;bed.position.y=-.065;bed.receiveShadow=true;scene.add(bed);
 const rockGeo=rockGeometry(),rockMat=surfaceMaterial('#777472');
 const cobbleMat=surfaceMaterial('#b2a798');
 const rockPalette=['#777472','#82766b','#686b6b','#9a8773','#74716e'].map(c=>surfaceMaterial(c));
 const decoration=new T.Group();scene.add(decoration);
 const barnacles=[],barnacleHoles=[],pebbles=[],algae=[],limpets=[],wrack=[];
 const temp=new T.Object3D(),smallGeo=new T.IcosahedronGeometry(1,1),barnGeo=new T.ConeGeometry(1,1,7,1,true),holeGeo=new T.CircleGeometry(1,7);holeGeo.rotateX(-Math.PI/2);
 function stamp(list,geo,x,y,z,sx,sy,sz,angle=0){temp.position.set(x,y,z);temp.rotation.set(0,angle,0);temp.scale.set(sx,sy,sz);temp.updateMatrix();list.push(geo.clone().applyMatrix4(temp.matrix));}
 function addRock(x,z,sx,sy,sz,y=-.025){
  const m=new T.Mesh(rockGeo,rockPalette[Math.floor(rand()*rockPalette.length)]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rand()*.25,rand()*6,rand()*.22);m.castShadow=true;m.receiveShadow=true;decoration.add(m);return m;
 }
 function shells(m,count){
  for(let j=0;j<count;j++){
   const dx=(rand()-.5)*m.scale.x,dz=(rand()-.5)*m.scale.z;
   const y=m.position.y+m.scale.y*Math.sqrt(Math.max(.1,1-(dx/m.scale.x)**2-(dz/m.scale.z)**2));
   const r=.010+rand()*.008;
   stamp(barnacles,barnGeo,m.position.x+dx,y,m.position.z+dz,r,r*1.1,r);
   stamp(barnacleHoles,holeGeo,m.position.x+dx,y+r*.56,m.position.z+dz,r*.35,1,r*.35);
  }
 }
 for(let i=0;i<43;i++){
  const a=i/43*Math.PI*2,r=rimShape(a),x=Math.cos(a)*1.56*r,z=Math.sin(a)*1.06*r;
  const m=addRock(x,z,.14+rand()*.15,.14+rand()*.10,.13+rand()*.12,.09);shells(m,7);
  for(let j=0;j<3;j++)stamp(algae,smallGeo,x+(rand()-.5)*.23,.15,z+(rand()-.5)*.23,.02+rand()*.04,.012,.025,rand()*6);
 }
 // A continuous intertidal shore: large fractured outcrops, shingle, shells and wrack.
 for(let i=0;i<105;i++){
  const x=(rand()-.5)*10,z=(rand()-.5)*13;
  if((x/1.95)**2+(z/1.45)**2<1)continue;
  const s=.10+Math.pow(rand(),2)*.44,m=addRock(x,z,s*(1+rand()),s*(.35+rand()*.5),s*(.7+rand()));
  if(i%3===0)shells(m,8);
  if(i%4===0)stamp(limpets,barnGeo,x+.025,m.position.y+m.scale.y+.012,z,.035,.035,.025,rand()*6);
 }
 for(let i=0;i<1700;i++){
  const x=(rand()-.5)*11,z=(rand()-.5)*14,inside=(x/1.45)**2+(z/.94)**2<1;
  const size=inside?.004+rand()*.014:.012+rand()*.043;
  stamp(pebbles,smallGeo,x,inside?.008:-.035,z,size,size*.45,size*.75,rand()*6);
 }
 for(let i=0;i<45;i++){
  const a=rand()*Math.PI*2,r=1.35+rand()*1.7,x=Math.cos(a)*1.5*r,z=Math.sin(a)*1.05*r;
  for(let j=0;j<4;j++){
   const curve=new T.CatmullRomCurve3([new T.Vector3(x,-.04,z),new T.Vector3(x+.07,-.028,z+.08*j),new T.Vector3(x+.13+rand()*.12,-.03,z+.1*j+.06)]);
   wrack.push(new T.TubeGeometry(curve,8,.005+rand()*.004,4,false));
  }
 }
 function batch(list,mat){if(!list.length)return;const m=new T.Mesh(mergeGeometries(list),mat);m.castShadow=true;m.receiveShadow=true;decoration.add(m);list.forEach(g=>g.dispose());}
 batch(barnacles,new T.MeshStandardMaterial({color:'#c4bfb1',roughness:.85,side:T.DoubleSide}));
 batch(barnacleHoles,new T.MeshStandardMaterial({color:'#4d4540',roughness:1}));
 batch(limpets,new T.MeshStandardMaterial({color:'#9d8065',roughness:.65,side:T.DoubleSide}));
 batch(pebbles,surfaceMaterial('#8a8277'));batch(algae,new T.MeshStandardMaterial({color:'#526342',roughness:.6}));
 batch(wrack,new T.MeshStandardMaterial({color:'#57432d',roughness:.9}));
 const weeds=[];
 for(let i=0;i<15;i++){
  const a=rand()*Math.PI*2,r=.82+rand()*.07,group=new T.Group();group.position.set(Math.cos(a)*1.4*r,.005,Math.sin(a)*.9*r);scene.add(group);weeds.push(group);
  for(let j=0;j<4;j++){
   const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.012*j,.08,0),new T.Vector3(.02*j,.12+rand()*.07,.025)]);
   group.add(new T.Mesh(new T.TubeGeometry(curve,6,.006,4,false),new T.MeshStandardMaterial({color:j%2?'#7c8152':'#436c55'})));
  }
 }
 for(const [x,z] of [[-.91,-.29],[.96,-.16]])addRock(x,z,.20,.10,.16,.025);
 const fishes=[];
 for(let i=0;i<6;i++){
  const fish=new T.Group(),mat=new T.MeshStandardMaterial({color:i%2?'#aab9b0':'#526b69',metalness:0,roughness:.3});
  const body=new T.Mesh(new T.SphereGeometry(1,10,6),mat);body.scale.set(.035,.009,.012);fish.add(body);
  const tail=new T.Mesh(new T.ConeGeometry(.012,.025,3),mat);tail.rotation.z=Math.PI/2;tail.position.x=-.04;fish.add(tail);scene.add(fish);fishes.push(fish);
 }

 // Read linear HDR scene colour and real scene depth before drawing the surface.
 // Tone mapping happens only once, after absorption, refraction and reflection.
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true});target.depthTexture=new T.DepthTexture(1,1);
 const ripples=Array.from({length:8},()=>new T.Vector4(0,0,-100,0));let rippleIndex=0;
 const waterMat=new T.ShaderMaterial({
  uniforms:{image:{value:target.texture},sceneDepth:{value:target.depthTexture},normalMap:{value:rippleNormals()},time:uniform,resolution:{value:new T.Vector2()},ripples:{value:ripples},depthRange:{value:camera.far-camera.near},sunDirection:{value:sun.position.clone().normalize()}},
  vertexShader:`varying vec3 world;void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
  fragmentShader:`
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
   }`,depthWrite:false,transparent:true
 });
 const water=new T.Mesh(new T.ShapeGeometry(outline,48),waterMat);water.rotation.x=-Math.PI/2;water.position.y=WATER_LEVEL;water.renderOrder=2;scene.add(water);
 return {
  scene,camera,water,rockGeo,rockMat,cobbleMat,ripples,
  resize(w,h){target.setSize(w,h);waterMat.uniforms.resolution.value.set(w,h);},
  ripple(x,z,t){ripples[rippleIndex++%8].set(x,z,t,1);},
  update(t){
   uniform.value=t;
   weeds.forEach((w,i)=>{w.rotation.z=Math.sin(t*.8+i)*.08;w.rotation.x=Math.cos(t*.6+i)*.07;});
   fishes.forEach((f,i)=>{const a=t*(.16+i*.012)+i*1.9,dart=Math.sin(t*.7+i)*.1;f.position.set(Math.sin(a)*(.5+i*.06)+dart,.13,Math.cos(a*1.3)*.62);f.rotation.y=Math.atan2(-Math.sin(a*1.3)*.8,Math.cos(a)*(.5+i*.06));});
  },
  render(){water.visible=false;renderer.setRenderTarget(target);renderer.render(scene,camera);water.visible=true;renderer.setRenderTarget(null);renderer.render(scene,camera);}
 };
}
