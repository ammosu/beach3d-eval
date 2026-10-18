import * as T from 'three';
import {loadProps,propRoot} from './props.js';
import './ui.css';
import './compare.css';

const labels={A:'A｜codex 程序化',B:'B｜Tripo AI',C:'C｜免費素材庫'};
export async function createComparison({camera,renderer,composer,results,initialGroup}){
 document.body.classList.add('compare-page');
 const cache=new Map([[initialGroup,{children:[...propRoot.children],results}]]);
 // The singleton loader runs serially. All panes reuse the same landscape and GPU resources.
 for(const group of ['A','B','C'])if(!cache.has(group)){
  const loaded=await loadProps(group);cache.set(group,{children:[...propRoot.children],results:loaded.results});
 }
 const requested=[...new Set((new URLSearchParams(location.search).get('groups')||'A,B').split(','))].filter(g=>labels[g]);
 let selected=requested.length>=2?requested:['A','B'],explore;
 const toolbar=document.createElement('nav');toolbar.className='viewer-toolbar';toolbar.setAttribute('aria-label','比較設定');
 toolbar.innerHTML='<a href="/">← 回入口</a><strong>並排比較</strong><label>比較組別 <select id="compare-groups"><option value="A,B">A + B</option><option value="A,C">A + C</option><option value="B,C">B + C</option><option value="A,B,C">A + B + C</option></select></label><span>同步視角・Esc 暫停後切換</span>';
 document.body.append(toolbar);
 const picker=toolbar.querySelector('select');
 const paneLabels=document.createElement('div');paneLabels.className='pane-labels';document.body.append(paneLabels);
 composer.renderToScreen=false;
 // OutputPass already applies the original tone mapping and output color transform.
 const copyScene=new T.Scene(),copyCamera=new T.Camera();
 const material=new T.ShaderMaterial({uniforms:{image:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D image;varying vec2 vUv;void main(){gl_FragColor=texture2D(image,vUv);}',depthTest:false,depthWrite:false,toneMapped:false});
 copyScene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
 const composite=new T.WebGLRenderTarget(1,1,{depthBuffer:false});
 let width,height;
 function resize(){
  width=innerWidth;height=innerHeight;renderer.setSize(width,height);
  camera.aspect=(width/selected.length)/height;camera.updateProjectionMatrix();
  composer.setSize(Math.ceil(width/selected.length),height);
  composite.setSize(Math.round(width*renderer.getPixelRatio()),Math.round(height*renderer.getPixelRatio()));
 }
 function select(){
  propRoot.clear();for(const g of selected)propRoot.add(...cache.get(g).children);
  picker.value=[...selected].sort().join(',');
  paneLabels.style.gridTemplateColumns=`repeat(${selected.length},1fr)`;
  paneLabels.replaceChildren(...selected.map(g=>{const el=document.createElement('div');const missing=cache.get(g).results.filter(r=>!['loaded','procedural'].includes(r.status)).length;el.textContent=labels[g];if(missing){const status=document.createElement('small');status.textContent=`${missing} 件生成中`;el.append(status);}return el;}));
  explore?.refresh();resize();
 }
 picker.onchange=()=>{selected=picker.value.split(',');const url=new URL(location.href);url.searchParams.set('groups',selected.join(','));history.replaceState(null,'',url);select();};
 select();
 const api={connect(controller){explore=controller;},resize,get groups(){return [...selected];},render(){
  for(let i=0;i<selected.length;i++){
   for(const g of selected)for(const child of cache.get(g).children)child.visible=g===selected[i];
   // Reflection and bloom passes must run without the screen scissor.
   renderer.setRenderTarget(null);renderer.setScissorTest(false);composer.render();
   material.uniforms.image.value=composer.readBuffer.texture;
   const left=Math.round(i*width/selected.length),right=Math.round((i+1)*width/selected.length);
   const ratio=renderer.getPixelRatio();
   composite.viewport.set(Math.round(left*ratio),0,Math.round(right*ratio)-Math.round(left*ratio),composite.height);
   composite.scissor.copy(composite.viewport);composite.scissorTest=true;
   renderer.setRenderTarget(composite);
   renderer.render(copyScene,copyCamera);
  }
  // Present the complete frame once, so resizing and screenshots cannot expose a partial pane.
  renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);
  material.uniforms.image.value=composite.texture;renderer.render(copyScene,copyCamera);
  for(const child of propRoot.children)child.visible=true;
 }};
 window.__COMPARE__=api;return api;
}
