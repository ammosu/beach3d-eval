// Group C uses third-party models (mostly CC BY): a small "素材出處" button next to the group label shows title, author, source and licence on hover / focus / tap.
// Same data as assets/{library,character_C,sea/C,tidepool/C,extras/C}/CREDITS.md; keep both in step.
const sketchfab=id=>`https://sketchfab.com/3d-models/${id}`,haven=id=>`https://polyhaven.com/a/${id}`,pizza=id=>`https://poly.pizza/m/${id}`;
const BY4=['CC BY 4.0','https://creativecommons.org/licenses/by/4.0/'],BY3=['CC BY 3.0','https://creativecommons.org/licenses/by/3.0/'],CC0=['CC0','https://creativecommons.org/publicdomain/zero/1.0/'];
export const CREDITS=[
 ['海灘道具',[
  ['高椰子樹','Palm Tree PNG Realistic','00amza',sketchfab('f7127a9fc22547b2880de52de2da7ca2'),BY4],
  ['雙株椰子樹','Low poly Coconut Palm Tree 3D Model Free','iGauravRajput',sketchfab('ee101e6d2f154002aa72d9ae5cf75054'),BY4],
  ['岩石','Boulder 01','Rico Cilliers',haven('boulder_01'),CC0],
  ['小船','Wooden Boat','donnichols',sketchfab('627ba38e06aa4536b90706a8626c74d4'),BY4],
  ['小屋','Large Beach Hut 1','rhcreations',sketchfab('fde51449d03840528d31d060597c53e5'),BY4],
  ['陽傘','Beach Umbrella','stealth86',sketchfab('1014ad7c8a4c4aa8ba5e88fc6151aa4f'),BY4],
  ['漂流木','Dead Tree Trunk 02','Jenelle van Heerden, Rico Cilliers',haven('dead_tree_trunk_02'),CC0],
  ['救生員塔','Lifeguard tower','Chenchanchong',sketchfab('81c4b045b52045dcae34dfa89d5b1e94'),BY4]]],
 ['角色',[['角色','Beach Character','Quaternius',pizza('DojKLcO34E'),CC0]]],
 ['外海動物',[
  ['大白鯊','Great White Shark','Mehrus',sketchfab('e4f107a6d87b424fb165aba9a53d0665'),BY4],
  ['槌頭鯊','Hammerhead Shark','kenchoo',sketchfab('1bb18da3050843f687de6753fb31b7c5'),BY4],
  ['座頭鯨','Game-ready Humpback Whale','Allie2k',sketchfab('da07e3ff73914ff28d2b8cf9da794036'),BY4],
  ['虎鯨','Orca Killer Whale','LostPlaces',sketchfab('7c01c438ff03401d8e77127154c041c7'),BY4],
  ['海豚','Bottlenose Dolphin','popcornbag',sketchfab('4bb04fa58d6846938e07bb38507e3f3a'),BY4],
  ['海龜','Sea turtle low poly','C.J..Goldman',sketchfab('c92be549c8194136914883309a13a6b5'),BY4],
  ['蝠鱝','Manta Ray','s4306270',sketchfab('a5a49438893e4bd1b82cad7b69a95edf'),BY4]]],
 ['潮池生物',[
  ['寄居蟹','Little Hermit Crab','allegory.fake',sketchfab('3fc91d811ae54de5b5fc5bb0e3db538a'),BY4],
  ['海蛞蝓','Felimida Britoi','israelfernandez',sketchfab('c5b4b517ef5643d5915289e49aeb4daa'),BY4],
  ['海星','Starfish','Poly by Google',pizza('6H-0K9IEr56'),BY3],
  ['海葵','Sea anemone','Poly by Google',pizza('5mWGVL6VgMd'),BY3],
  ['海膽','Sea Urchin','Poly by Google',pizza('f4iwEhEP3-d'),BY3],
  ['章魚','Octopus','Poly by Google',pizza('9F8QJKUT77V'),BY3]]],
 ['沙灘小樂趣',[
  ['沙堡','Sand castle - Day 19','patrakeevasveta',sketchfab('0379b3c84e7944dab7537a0799375ee4'),BY4],
  ['風箏','Kite','phac',sketchfab('881a6736d0eb4f53b38d75c5b03dc7fe'),BY4],
  ['沙蟹','CC0 ツノメガニ Horn-eyed Ghost Crab','ffishAsia-and-floraZia',sketchfab('bf68a281970e461584f1352d67316197'),CC0],
  ['海鷗','seagull v1','FreddyFoxFreddy',sketchfab('f3fa166ff6bd4ffe8133f6f6eed74d64'),BY4]]]];

const CSS=`.credits-btn{font:inherit;font-size:12px;line-height:1;margin-left:.5em;padding:3px 7px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;opacity:.8;cursor:help;vertical-align:middle;pointer-events:auto}
.credits-btn:hover,.credits-btn:focus-visible,.credits-btn[aria-expanded=true]{opacity:1}
.credits-pop{position:fixed;z-index:1000;width:min(380px,calc(100vw - 16px));max-height:min(70vh,520px);overflow:auto;padding:12px 14px;border-radius:10px;background:rgba(18,28,34,.96);color:#eef3f1;font:12px/1.45 system-ui,"Noto Sans TC",sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35);text-align:left;pointer-events:auto}
.credits-pop h3{margin:8px 0 3px;font-size:12px;color:#9fd6c8}.credits-pop h3:first-child{margin-top:0}
.credits-pop ul{margin:0;padding:0;list-style:none}.credits-pop li{margin:2px 0}.credits-pop a{color:#ffe2a8}.credits-pop small{display:block;margin-top:8px;opacity:.7}`;
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let pop=null,owner=null,hideTimer=0;
function popup(){
 if(pop)return pop;
 const style=document.createElement('style');style.textContent=CSS;document.head.append(style);
 pop=document.createElement('div');pop.className='credits-pop';pop.id='credits-pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','C 組素材出處');pop.hidden=true;
 pop.innerHTML=CREDITS.map(([section,items])=>`<h3>${section}</h3><ul>${items.map(([what,title,author,url,[lic,licUrl]])=>`<li>${what}：<a href="${url}" target="_blank" rel="noopener">${esc(title)}</a> · ${esc(author)} · <a href="${licUrl}" target="_blank" rel="noopener">${lic}</a></li>`).join('')}</ul>`).join('')+'<small>C 組使用免費素材庫的模型，依各自授權標示；部分模型經減面、轉向與縮放。</small>';
 pop.addEventListener('pointerenter',()=>clearTimeout(hideTimer));pop.addEventListener('pointerleave',()=>hideSoon());
 addEventListener('keydown',e=>{if(e.key==='Escape')hide();},true);
 addEventListener('pointerdown',e=>{if(!pop.hidden&&!pop.contains(e.target)&&e.target!==owner)hide();},true);
 // Keys pressed inside the popup must not drive the game.
 for(const type of ['keydown','keyup'])pop.addEventListener(type,e=>e.stopPropagation());
 document.body.append(pop);return pop;
}
function show(button){
 const p=popup();clearTimeout(hideTimer);owner?.setAttribute('aria-expanded','false');owner=button;button.setAttribute('aria-expanded','true');p.hidden=false;
 const r=button.getBoundingClientRect(),w=p.offsetWidth,h=p.offsetHeight;
 // Below, else above, else beside the button (never over it, or leaving the button would close the list).
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));let left,top;
 if(r.bottom+6+h<=innerHeight-8||r.top-6-h>=8){left=clamp(r.left+r.width/2-w/2,8,innerWidth-w-8);top=r.bottom+6+h<=innerHeight-8?r.bottom+6:r.top-6-h;}
 else{left=innerWidth-r.right-8>=w+6?r.right+6:r.left-w-6>=8?r.left-w-6:clamp(r.left+r.width/2-w/2,8,innerWidth-w-8);top=clamp(r.top+r.height/2-h/2,8,innerHeight-h-8);}
 p.style.left=left+'px';p.style.top=top+'px';
}
function hide(){if(!pop)return;pop.hidden=true;owner?.setAttribute('aria-expanded','false');owner=null;}
function hideSoon(){clearTimeout(hideTimer);hideTimer=setTimeout(hide,250);}
// A button for the C group's label; hover or focus shows the list, a tap toggles it (touch screens).
export function creditsButton(){
 const b=document.createElement('button');b.type='button';b.className='credits-btn';b.textContent='素材出處 ⓘ';b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','credits-pop');
 b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')show(b);});b.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hideSoon();});
 b.addEventListener('focus',()=>show(b));b.addEventListener('blur',()=>hideSoon());
 // A mouse click must not leave focus on the button, or the game's keys (Space, Enter) would press it.
 b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')e.preventDefault();});
 b.addEventListener('click',e=>{e.stopPropagation();if(owner===b&&!pop.hidden&&e.pointerType!=='mouse')hide();else show(b);});
 return b;
}
