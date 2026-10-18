import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import assert from 'node:assert/strict';
// Deliberately offset geometry catches centering and minimum-Y mistakes.
const vertices=new Float32Array([1,2,3, 3,2,3, 1,6,3, 1,2,5, 3,2,5, 1,6,5]);
const bytes=Buffer.from(vertices.buffer);
const fixture={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],buffers:[{uri:`data:application/octet-stream;base64,${bytes.toString('base64')}`,byteLength:bytes.length}],bufferViews:[{buffer:0,byteLength:bytes.length}],accessors:[{bufferView:0,componentType:5126,count:6,type:'VEC3',min:[1,2,3],max:[3,6,5]}]};
const browser=await chromium.launch({executablePath:`${homedir()}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.route('**/assets/**/*.glb',route=>route.fulfill({contentType:'model/gltf+json',body:JSON.stringify(fixture)}));
 for(const group of ['A','B','C']){
  await page.goto(`http://localhost:5191/scene.html?group=${group}&cam=wide&time=4`);await page.waitForFunction(()=>window.__READY__);
  const checks=await page.evaluate(async()=>{
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {groundHeight}=await import('/src/terrain.js');
   const {propRoot,results}=window.__SCENE__;propRoot.updateMatrixWorld(true);
   return {results,slots:propRoot.children.map(marker=>{const b=new THREE.Box3().setFromObject(marker);return {id:marker.name,height:b.max.y-b.min.y,target:marker.userData.slot.height,maxLen:marker.userData.slot.maxLen,span:Math.max(b.max.x-b.min.x,b.max.z-b.min.z),groundError:b.min.y-groundHeight(marker.position.x,marker.position.z),centerError:Math.hypot((b.min.x+b.max.x)/2-marker.position.x,(b.min.z+b.max.z)/2-marker.position.z)};})};
  });
  assert.equal(checks.results.filter(r=>r.status===(group==='A'?'procedural':'loaded')).length,8);
  for(const s of checks.slots){assert.ok(s.height>0&&s.height<=s.target+1e-5);if(s.maxLen)assert.ok(s.span<=s.maxLen+1e-5);assert.ok(Math.abs(s.height-s.target)<1e-5||(s.maxLen&&Math.abs(s.span-s.maxLen)<1e-5));assert.ok(Math.abs(s.groundError)<1e-5);assert.ok(s.centerError<1e-5);}
  console.log(`${group}: eight models normalized, centered and grounded`);
 }
 await page.goto('http://localhost:5191/scene.html?group=A');await page.waitForFunction(()=>window.__READY__);
 const start=await page.evaluate(()=>window.__SCENE__.water.material.uniforms.time.value);
 await page.waitForTimeout(250);
 assert.ok(await page.evaluate(()=>window.__SCENE__.water.material.uniforms.time.value)>start);
 const before=await page.evaluate(()=>window.__SCENE__.camera.position.toArray());
 await page.mouse.move(500,350);await page.mouse.down();await page.mouse.move(700,400,{steps:10});await page.mouse.up();
 assert.notDeepEqual(await page.evaluate(()=>window.__SCENE__.camera.position.toArray()),before);
 assert.equal(await page.evaluate(()=>window.__SCENE__.propRoot.children.filter(s=>s.children.length>0).length),8);
 console.log('A: populated slots; live waves and OrbitControls verified');
}finally{await browser.close();}
