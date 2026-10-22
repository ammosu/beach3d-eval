import './ui.css';
import {creditsButton} from './credits.js';
const params=new URLSearchParams(location.search);
if(['group','cam','explore'].some(key=>params.has(key)))location.replace(`scene.html${location.search}${location.hash}`);
const labels={A:'codex 程序化',B:'Tripo AI',C:'免費素材庫'};
const descriptions={A:'由程式描繪形狀與細節',B:'以生成模型建立海邊道具',C:'選用現成的開放素材'};
let groups={};try{const response=await fetch('report/stats.json');if(!response.ok)throw Error();groups=(await response.json()).groups||{};}catch{}
for(const g of ['A','B','C']){
 const card=document.createElement('article');card.className='card';
 card.innerHTML=`<div class="preview"><img src="shots/${g}/beach.png" alt="${g} 組海灣場景"><span class="pending" hidden>生成中</span></div><div class="card-content"><h2>${g}｜${labels[g]}</h2><p>${descriptions[g]}</p><dl><div><dt>製作時間</dt><dd data-stat="minutes"></dd></div><div><dt>成本</dt><dd data-stat="cost"></dd></div><div><dt>總三角面</dt><dd data-stat="triangles"></dd></div></dl><p class="notes"></p><div class="actions"><a class="primary" href="scene.html?explore=1&group=${g}">進入遊覽</a><a href="props.html?group=${g}">單件模型</a></div></div>`;
 if(g==='C')card.querySelector('h2').append(creditsButton());
 const img=card.querySelector('img');img.onerror=()=>{img.hidden=true;card.querySelector('.pending').hidden=false;};
 for(const key of ['minutes','cost','triangles']){const v=groups[g]?.[key];card.querySelector(`[data-stat="${key}"]`).textContent=v==null?'待填寫':`${typeof v==='number'?v.toLocaleString():v}${key==='minutes'?' 分鐘':''}`;}
 card.querySelector('.notes').textContent=groups[g]?.notes||'';document.querySelector('#groups').append(card);
}
