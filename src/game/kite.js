import * as T from 'three';
import {groundHeight} from '../terrain.js';
export const KITE=Object.freeze({x:-29,z:7}); // Open western sand, >13 m from the hut, no prop under its launch corridor.
const smooth=t=>T.MathUtils.smoothstep(t,0,1),duration=5;
export function createKite(scene,clock){
 const point=new T.Vector3(KITE.x,groundHeight(KITE.x,KITE.z),KITE.z),root=new T.Group();root.name='extra-kite';scene.add(root);
 const orange=new T.MeshStandardMaterial({color:0xe87853,side:T.DoubleSide,roughness:.82}),cream=new T.MeshStandardMaterial({color:0xf2e4c8,side:T.DoubleSide,roughness:.86}),wood=new T.MeshStandardMaterial({color:0x715d41});
 const tips=[[0,1.4,0],[.9,0,0],[0,-1.15,0],[-.9,0,0]];
 for(let i=0;i<4;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,.08,...tips[i],...tips[(i+1)%4]],3));g.computeVertexNormals();root.add(new T.Mesh(g,i%2?cream:orange));}
 const ribs=new T.LineSegments(new T.BufferGeometry().setFromPoints([new T.Vector3(...tips[0]),new T.Vector3(...tips[2]),new T.Vector3(...tips[1]),new T.Vector3(...tips[3])]),new T.LineBasicMaterial({color:0x705d45}));ribs.position.z=.025;root.add(ribs);
 const tailGeo=new T.PlaneGeometry(.13,3.5,1,32).translate(0,-2.9,0),tailMat=orange.clone();tailMat.onBeforeCompile=s=>{s.uniforms.kiteTime=clock;s.vertexShader='uniform float kiteTime;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float u=clamp((-position.y-1.15)/3.5,0.,1.);transformed.x+=u*.42*sin(kiteTime*2.4-u*8.);transformed.z+=u*.24*sin(kiteTime*2.-u*6.);`);};root.add(new T.Mesh(tailGeo,tailMat));
 const procedural=[...root.children];let custom=null;const holders=new Map();
 const lineGeo=new T.BufferGeometry();lineGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(65*3),3));const line=new T.Line(lineGeo,new T.LineBasicMaterial({color:0xf5edd6,transparent:true,opacity:.85}));line.frustumCulled=false;scene.add(line);
 const handle=new T.Mesh(new T.CylinderGeometry(.027,.027,.23,8),wood);handle.rotation.z=Math.PI/2;scene.add(handle);
 const shadowMat=new T.MeshBasicMaterial({color:0x514333,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide});const shadow=new T.Mesh(new T.CircleGeometry(1,4),shadowMat);shadow.rotation.x=-Math.PI/2;scene.add(shadow);
 const grip=point.clone().add(new T.Vector3(0,1.12,-.35)),tie=new T.Vector3(),end=new T.Vector3(),from=point.clone().add(new T.Vector3(.7,.16,-.6));let t0=null,backAt=null,backU=0,completed=false;
 function uAt(t){return t0===null?0:backAt===null?Math.min(1,Math.max(0,(t-t0)/duration)):Math.max(0,backU-Math.max(0,t-backAt-.6)/duration);}
 function update(t){const u=uAt(t),f=smooth(u),a=t0===null?0:Math.max(0,(backAt??t)-t0-duration),loop=smooth(a/2)*(backAt===null?1:smooth(u));
  end.set(point.x+Math.sin(a*.25)*5*loop,point.y+29+Math.sin(a*.5)*1.5*loop,point.z-36+Math.sin(a*.5)*3*loop);
  // A fixed quadratic launch curve; return retraces precisely the same curve (orbit fades out first).
  const orbit=end.clone().sub(new T.Vector3(point.x,point.y+29,point.z-36));end.set(point.x,point.y+29,point.z-36);
  const mid=point.clone().add(new T.Vector3(-3,12,-11));root.position.copy(from).multiplyScalar((1-f)**2).addScaledVector(mid,2*f*(1-f)).addScaledVector(end,f*f);root.position.addScaledVector(orbit,u===1?(backAt===null?1:1-smooth((t-backAt)/.6)):0);
  root.rotation.set(T.MathUtils.lerp(-Math.PI/2,.12*Math.sin(a*.5),smooth(u/.25)),-.18,.14*Math.sin(a*.25));if(u===0)root.rotation.x=-Math.PI/2;
  handle.visible=line.visible=t0!==null&&u>0;handle.position.copy(grip);root.updateMatrixWorld(true);tie.set(0,.05,.08).applyMatrix4(root.matrixWorld);
  const p=lineGeo.attributes.position;for(let i=0;i<p.count;i++){const v=i/(p.count-1);p.setXYZ(i,T.MathUtils.lerp(grip.x,tie.x,v),T.MathUtils.lerp(grip.y,tie.y,v)-4*v*(1-v)*(.25+1.3*f),T.MathUtils.lerp(grip.z,tie.z,v));}p.needsUpdate=true;
  shadow.visible=u>0;shadow.position.set(root.position.x+5,groundHeight(root.position.x+5,point.z-1)+.015,point.z-1);shadow.scale.set(1.2,.65,1);shadowMat.opacity=.13*(.6+.4*f);
  if(backAt!==null&&u===0){t0=null;backAt=null;}if(u===1)completed=true;
 }
 // B/C kite (nose +x, face +y, length 1 with its tail) turned to the procedural frame (nose +y, face +z), 5 m nose to tail end, nose at y 1.4.
 function setGroup(model){if(custom){root.remove(custom);custom=null;}for(const m of procedural)m.visible=!model;if(!model)return;
  if(!holders.has(model)){const g=model.clone(),holder=new T.Group();g.traverse(o=>{if(o.isMesh)o.castShadow=false;});const b=new T.Box3().setFromObject(g),s=5/(b.max.x-b.min.x);g.scale.setScalar(s);g.position.set(-b.max.x*s,-(b.min.y+b.max.y)*s/2,-(b.min.z+b.max.z)*s/2);holder.add(g);holder.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0,1,0),new T.Vector3(0,0,1),new T.Vector3(1,0,0)));holder.position.y=1.4;holders.set(model,holder);}
  custom=holders.get(model);root.add(custom);}
 return {point,grip,root,update,setGroup,get flying(){return t0!==null;},get complete(){return completed;},get info(){return {flying:t0!==null,t0,height:root.position.y-point.y,position:root.position.toArray(),grip:grip.toArray(),returning:backAt!==null};},start(t){t0=t;backAt=null;},recall(t){backU=uAt(t);backAt=t;},reset(){t0=backAt=null;completed=false;update(clock.value);}};
}
