import * as T from 'three';
import {groundHeight} from '../terrain.js';
// Follow each trunk upward from its collision cells. Distance from that axis, rather than height alone,
// anchors the stems of paired/leaning palms as well as their crowns. Only game calls this helper.
export function palmWeights(marker,trunk){
 const clusters=[],points=new Map(),meshes=[],v=new T.Vector3();
 for(const k of trunk.keys()){const i=Math.floor(k/65536),j=k-i*65536;let c=clusters.find(c=>Math.hypot(c.x-i*.2,c.z-j*.2)<.6);if(!c)clusters.push(c={x:i*.2,z:j*.2,n:0});c.x=(c.x*c.n+i*.2)/(c.n+1);c.z=(c.z*c.n+j*.2)/(++c.n);}
 marker.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;meshes.push(o);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const h=v.y-groundHeight(v.x,v.z),b=Math.floor(h/.2);if(b<8)continue;if(!points.has(b))points.set(b,[]);points.get(b).push([v.x,v.z]);}});
 const axes=new Map(),tracked=clusters.map(c=>({x:c.x,z:c.z})),max=Math.max(8,...points.keys());
 for(let b=8;b<=max;b++){const ps=points.get(b)||[];for(const c of tracked){const near=ps.filter(p=>Math.hypot(p[0]-c.x,p[1]-c.z)<.48);if(near.length){const xs=near.map(p=>p[0]).sort((a,b)=>a-b),zs=near.map(p=>p[1]).sort((a,b)=>a-b);c.x=xs[Math.floor(xs.length/2)];c.z=zs[Math.floor(zs.length/2)];}}axes.set(b,tracked.map(c=>({...c})));}
 const result=new WeakMap();for(const o of meshes){const p=o.geometry.attributes.position,w=new Float32Array(p.count);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const h=v.y-groundHeight(v.x,v.z),cs=axes.get(Math.floor(h/.2));if(!cs?.length)continue;const d=Math.min(...cs.map(c=>Math.hypot(v.x-c.x,v.z-c.z)));w[i]=T.MathUtils.smoothstep(h,2,3)*T.MathUtils.smoothstep(d,.3,1.9);}result.set(o,w);}return result;
}
export function palmWindShader(shader,clock){shader.uniforms.palmClock=clock;shader.vertexShader='uniform float palmClock;attribute float palmWind;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec4 windWorld=modelMatrix*vec4(transformed,1.);windWorld.x+=palmWind*.10*sin(palmClock*1.1+windWorld.x*.4);windWorld.z+=palmWind*.07*sin(palmClock*.91+windWorld.z*.4);transformed=(inverse(modelMatrix)*windWorld).xyz;`);}
