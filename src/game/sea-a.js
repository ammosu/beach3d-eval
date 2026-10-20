import * as T from 'three';

// A's open-sea animals: the lofted bodies and fin sheets of reef/opus (procedural), coloured per vertex instead of by the reef shaders.
const PI=Math.PI,TAU=PI*2,lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function catmull(pts,u){
 const n=pts.length-1,f=clamp(u,0,1)*n;let i=Math.floor(f);if(i>=n)i=n-1;const t=f-i;
 const p0=pts[Math.max(i-1,0)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(i+2,n)],t2=t*t,t3=t2*t;
 return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);
}
function addPart(G,pos,info,idx){const base=G.pos.length/3;G.pos.push(...pos);G.info.push(...info);for(const i of idx)G.idx.push(i+base);}
function loft(G,s){
 const nu=s.nu||46,nv=s.nv||22,part=s.part||0,flat=s.flat??.85,pos=[],info=[],idx=[];
 const at=(u,th)=>{
  const w=Math.max(catmull(s.W,u),.0004),h=Math.max(catmull(s.H,u),.0004),c=s.C?catmull(s.C,u):(s.y0||0),al=lerp(s.a0,s.a1,u),cs=Math.cos(th),sn=Math.sin(th);
  let yy=sn<0?sn*flat:sn;if(s.edgeThin)yy*=1-s.edgeThin*cs*cs;
  let x,y=c+h*yy,z;
  if(s.axis==='z'){z=al;x=s.xc(al)+w*cs;}else{x=al;z=w*cs;if(s.sweep)x-=s.sweep*Math.pow(Math.abs(z),s.sweepP||2);}
  return [x,y,z];
 };
 for(let i=0;i<=nu;i++){const u=lerp(.012,.988,i/nu);for(let j=0;j<nv;j++){const th=j/nv*TAU;pos.push(...at(u,th));info.push(part,u,Math.sin(th),Math.cos(th));}}
 const capA=pos.length/3,cA=s.C?catmull(s.C,0):(s.y0||0),cB=s.C?catmull(s.C,1):(s.y0||0);
 if(s.axis==='z')pos.push(s.xc(s.a0),cA,s.a0,s.xc(s.a1),cB,s.a1);else pos.push(s.a0,cA,0,s.a1,cB,0);
 info.push(part,0,0,1,part,1,0,-1);
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*nv+j,b=i*nv+(j+1)%nv,c=(i+1)*nv+j,d=(i+1)*nv+(j+1)%nv;idx.push(a,b,c,b,d,c);}
 for(let j=0;j<nv;j++){idx.push(capA,(j+1)%nv,j);idx.push(capA+1,nu*nv+j,nu*nv+(j+1)%nv);}
 addPart(G,pos,info,idx);
}
const V3=T.Vector3;
function fin(G,o){
 const ns=o.ns||5,nt=o.nt||8,part=o.part,side=o.side||0;
 const rL=new V3().fromArray(o.rL),rT=new V3().fromArray(o.rT),tL=new V3().fromArray(o.tL),tT=new V3().fromArray(o.tT);
 let N=new V3().crossVectors(new V3().subVectors(tL,rL),new V3().subVectors(rT,rL));
 if(N.lengthSq()<1e-10)N=new V3().crossVectors(new V3().subVectors(tT,rT),new V3().subVectors(rL,rT));
 N.normalize();
 const mR=new V3().addVectors(rL,rT).multiplyScalar(.5),mT=new V3().addVectors(tL,tT).multiplyScalar(.5),Sd=new V3().subVectors(mT,mR).normalize(),Cd=new V3().crossVectors(N,Sd).normalize();
 if(Cd.dot(new V3().subVectors(rL,rT))<0)Cd.negate();
 const pos=[],info=[],idx=[],A=new V3(),B=new V3(),P=new V3();
 for(let j=0;j<=nt;j++){const t=j/nt;for(let i=0;i<=ns;i++){
  const s=i/ns;A.lerpVectors(rL,rT,s);B.lerpVectors(tL,tT,s);P.lerpVectors(A,B,t);
  let off=Math.sin(PI*t)*((1-s)*(o.bowL||0)+s*-(o.bowT||0));
  if(o.scallop)off+=Math.pow(1-s,3)*o.scallop*Math.sin(t*PI*(o.scN||8))*t;
  if(o.serr)off-=Math.pow(s,3)*o.serr*Math.abs(Math.sin(t*PI*(o.serN||7)));
  P.addScaledVector(Cd,off);
  if(o.camber)P.addScaledVector(N,o.camber*Math.sin(PI*s)*(1-.6*t));
  if(o.curl)P.addScaledVector(N,o.curl*t*t);
  pos.push(P.x,P.y,P.z);info.push(part,s,t,side);
 }}
 for(let j=0;j<nt;j++)for(let i=0;i<ns;i++){const a=j*(ns+1)+i,b=a+1,c=a+ns+1,d=c+1;idx.push(a,c,b,b,c,d);}
 addPart(G,pos,info,idx);
}
const both=f=>{f(1);f(-1);};
// Eye on the body surface at x,y (z from the loft cross-section).
function eyeOn(s,x,y,r){
 const u=clamp((s.a0-x)/(s.a0-s.a1),0,1),w=catmull(s.W,u),h=catmull(s.H,u),c=s.C?catmull(s.C,u):0;
 const sn=clamp((y-c)/(h*(y<c?(s.flat??.85):1)),-.95,.95),z=w*Math.sqrt(1-sn*sn)*.98;
 return [s.sweep?x-s.sweep*Math.pow(z,s.sweepP||2):x,y,z,r];
}

function shape(key){
 const G={pos:[],info:[],idx:[]};let eye=null;
 if(key==='shark'){
  const b={a0:.5,a1:-.5,W:[.012,.055,.085,.098,.1,.09,.07,.048,.03,.018,.012],H:[.012,.05,.085,.105,.108,.095,.072,.05,.032,.022,.018],C:[.004,.006,.004,0,-.002,0,.004,.008,.012,.016,.02],flat:.8};
  loft(G,b);eye=eyeOn(b,.385,.03,.0095);
  fin(G,{part:1,rL:[.10,.085,0],rT:[-.075,.075,0],tL:[-.055,.26,0],tT:[-.08,.255,0],bowL:.03,bowT:-.025});
  both(s=>fin(G,{part:2,side:s,rL:[.18,-.045,.07*s],rT:[.07,-.06,.07*s],tL:[-.04,-.105,.33*s],tT:[-.085,-.10,.315*s],bowL:.025,bowT:-.015}));
  fin(G,{part:3,rL:[-.43,.03,0],rT:[-.515,.012,0],tL:[-.615,.25,0],tT:[-.64,.245,0],bowL:.035,bowT:-.04,nt:10});
  fin(G,{part:3,rL:[-.45,-.012,0],rT:[-.515,.004,0],tL:[-.565,-.175,0],tT:[-.585,-.165,0],bowL:.025,bowT:-.025});
  fin(G,{part:4,rL:[-.29,.038,0],rT:[-.335,.03,0],tL:[-.335,.075,0],tT:[-.345,.072,0],nt:3,ns:3});
  fin(G,{part:4,rL:[-.29,-.03,0],rT:[-.335,-.025,0],tL:[-.34,-.07,0],tT:[-.35,-.067,0],nt:3,ns:3});
  both(s=>fin(G,{part:4,side:s,rL:[-.15,-.065,.035*s],rT:[-.21,-.06,.035*s],tL:[-.22,-.095,.10*s],tT:[-.245,-.09,.095*s],nt:3,ns:3}));
 }else if(key==='hammerhead'){
  const b={a0:.47,a1:-.5,W:[.02,.05,.072,.085,.085,.075,.058,.04,.026,.016,.011],H:[.02,.05,.08,.095,.095,.085,.065,.045,.03,.02,.016],C:[0,.004,.004,0,-.002,0,.004,.008,.012,.015,.018],flat:.8};
  loft(G,b);
  loft(G,{axis:'z',a0:-.17,a1:.17,part:6,nu:30,nv:14,flat:.9,y0:.006,W:[.024,.034,.04,.042,.045,.042,.04,.034,.024],H:[.010,.016,.019,.021,.023,.021,.019,.016,.010],xc:z=>.445-.045*Math.pow(z/.17,2)});
  eye=[.40,.006,.164,.013];
  fin(G,{part:1,rL:[.08,.08,0],rT:[-.07,.07,0],tL:[-.075,.31,0],tT:[-.10,.30,0],bowL:.05,bowT:-.06,nt:10});
  both(s=>fin(G,{part:2,side:s,rL:[.16,-.045,.06*s],rT:[.07,-.055,.06*s],tL:[-.02,-.09,.24*s],tT:[-.05,-.088,.23*s],bowL:.02,bowT:-.03}));
  fin(G,{part:3,rL:[-.42,.025,0],rT:[-.51,.01,0],tL:[-.66,.22,0],tT:[-.68,.21,0],bowL:.03,bowT:-.05,nt:10});
  fin(G,{part:3,rL:[-.45,-.01,0],rT:[-.51,0,0],tL:[-.55,-.12,0],tT:[-.57,-.115,0],bowL:.02,bowT:-.02});
  fin(G,{part:4,rL:[-.28,.035,0],rT:[-.33,.028,0],tL:[-.335,.085,0],tT:[-.345,.08,0],nt:3,ns:3});
  fin(G,{part:4,rL:[-.28,-.03,0],rT:[-.33,-.024,0],tL:[-.34,-.075,0],tT:[-.35,-.07,0],nt:3,ns:3});
  both(s=>fin(G,{part:4,side:s,rL:[-.14,-.06,.03*s],rT:[-.2,-.055,.03*s],tL:[-.21,-.09,.09*s],tT:[-.235,-.085,.085*s],nt:3,ns:3}));
 }else if(key==='humpback'){
  const b={a0:.5,a1:-.5,W:[.035,.075,.098,.11,.112,.105,.09,.07,.05,.032,.02,.013,.01],H:[.02,.052,.075,.092,.1,.098,.088,.072,.055,.04,.028,.02,.015],C:[-.012,-.008,-.006,-.004,-.002,0,.003,.006,.008,.01,.011,.012,.012],flat:.95,nu:54,nv:26};
  loft(G,b);eye=eyeOn(b,.335,-.03,.009);
  both(s=>fin(G,{part:2,side:s,rL:[.24,-.05,.085*s],rT:[.16,-.06,.09*s],tL:[0,-.13,.44*s],tT:[-.03,-.13,.43*s],bowL:.02,bowT:0,scallop:.012,scN:9,nt:16,ns:5}));
  fin(G,{part:1,rL:[-.12,.072,0],rT:[-.21,.055,0],tL:[-.19,.115,0],tT:[-.215,.105,0],nt:3,ns:4,bowL:.02});
  both(s=>fin(G,{part:3,side:s,rL:[-.465,.012,.004*s],rT:[-.525,.012,.004*s],tL:[-.56,.012,.20*s],tT:[-.60,.012,.19*s],bowL:.035,bowT:.01,serr:.012,serN:7,nt:12,ns:4,camber:.004}));
 }else if(key==='orca'){
  const b={a0:.5,a1:-.5,W:[.03,.068,.092,.106,.112,.108,.094,.074,.052,.032,.018,.012,.01],H:[.03,.07,.092,.106,.114,.11,.098,.08,.058,.038,.024,.017,.014],C:[-.012,-.006,-.003,0,0,0,.002,.004,.006,.008,.01,.01,.01],flat:.9,nu:50,nv:24};
  loft(G,b);eye=eyeOn(b,.375,-.005,.009);
  fin(G,{part:1,rL:[.06,.10,0],rT:[-.09,.095,0],tL:[-.025,.34,0],tT:[-.04,.335,0],bowL:.012,bowT:0,nt:10});
  both(s=>fin(G,{part:2,side:s,rL:[.25,-.07,.075*s],rT:[.17,-.08,.08*s],tL:[.13,-.14,.25*s],tT:[.04,-.14,.235*s],bowL:.045,bowT:.05,nt:8,ns:6}));
  both(s=>fin(G,{part:3,side:s,rL:[-.465,.01,.004*s],rT:[-.525,.01,.004*s],tL:[-.545,.01,.16*s],tT:[-.575,.01,.15*s],bowL:.03,bowT:-.01,nt:10,ns:4}));
 }else if(key==='dolphin'){
  const b={a0:.5,a1:-.5,W:[.01,.018,.05,.075,.088,.09,.082,.065,.045,.028,.016,.011,.009],H:[.008,.016,.062,.085,.095,.096,.088,.07,.048,.03,.02,.016,.014],C:[-.035,-.03,-.006,.004,.002,0,0,.002,.006,.01,.012,.012,.012],flat:.85,nu:54};
  loft(G,b);eye=eyeOn(b,.345,-.008,.008);
  fin(G,{part:1,rL:[.04,.085,0],rT:[-.10,.075,0],tL:[-.115,.20,0],tT:[-.135,.195,0],bowL:.035,bowT:-.035,nt:9});
  both(s=>fin(G,{part:2,side:s,rL:[.25,-.05,.055*s],rT:[.19,-.06,.06*s],tL:[.11,-.11,.17*s],tT:[.085,-.105,.165*s],bowL:.015,bowT:-.01}));
  both(s=>fin(G,{part:3,side:s,rL:[-.47,.012,.003*s],rT:[-.52,.012,.003*s],tL:[-.555,.012,.13*s],tT:[-.58,.012,.12*s],bowL:.025,bowT:-.02,nt:9,ns:4}));
 }else if(key==='turtle'){
  loft(G,{part:8,a0:.33,a1:-.37,W:[.16,.29,.345,.36,.345,.30,.21,.09],H:[.05,.125,.16,.17,.16,.125,.075,.03],C:[-.015,-.01,0,0,0,-.005,-.012,-.02],flat:.3,nu:40,nv:30});
  const hb={part:9,a0:.53,a1:.26,W:[.035,.075,.08,.068,.058,.056],H:[.028,.058,.062,.052,.046,.046],C:[-.01,0,0,-.005,-.01,-.012],flat:.8,nu:18,nv:16};
  loft(G,hb);eye=eyeOn(hb,.47,.018,.016);
  loft(G,{part:9,a0:-.32,a1:-.47,W:[.04,.03,.012],H:[.025,.018,.008],C:[-.02,-.025,-.03],nu:8,nv:10});
  both(s=>fin(G,{part:2,side:s,rL:[.21,-.02,.24*s],rT:[.11,-.03,.26*s],tL:[-.03,-.04,.60*s],tT:[-.08,-.04,.58*s],bowL:.05,bowT:-.025,nt:10,ns:5,camber:.01}));
  both(s=>fin(G,{part:5,side:s,rL:[-.22,-.035,.17*s],rT:[-.30,-.035,.15*s],tL:[-.37,-.04,.30*s],tT:[-.43,-.04,.25*s],bowL:.02,bowT:.02,nt:5,ns:4}));
 }else if(key==='manta'){
  const b={a0:.5,a1:-.5,W:[.17,.36,.66,.93,1,.82,.48,.22,.12,.075,.05],H:[.035,.06,.075,.08,.075,.065,.055,.045,.035,.025,.016],flat:.65,sweep:.36,sweepP:2,edgeThin:.6,nu:50,nv:40};
  loft(G,b);eye=eyeOn(b,.44,.02,.018);
  both(s=>fin(G,{part:7,side:s,rL:[.485,0,.10*s],rT:[.47,0,.17*s],tL:[.62,-.03,.10*s],tT:[.60,-.03,.15*s],curl:.05*s,nt:6,ns:4}));
  loft(G,{part:10,a0:-.42,a1:-1.05,W:[.03,.012,.008,.005,.003],H:[.02,.01,.007,.004,.002],y0:0,nu:16,nv:8});
  fin(G,{part:4,rL:[-.38,.04,0],rT:[-.45,.03,0],tL:[-.45,.07,0],tT:[-.47,.06,0],nt:3,ns:3});
 }
 return {G,eye};
}

// Simplified reef/opus albedo: countershading, orca patches, manta chevrons, turtle scutes.
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),mul=(a,k)=>a.map(v=>v*k);
function albedo(key,part,x,y,z,info,ny){
 const top=info[2],is=k=>Math.abs(part-k)<.5;
 if(key==='shark'){const slate=[.34,.39,.44],white=[.93,.93,.91];
  if(is(0)){const line=-.12+.05*Math.sin(x*95+1.3)-.1*smooth(.15,.45,x);return mul(mix(white,slate,smooth(line-.03,line+.03,top)),lerp(1,.82,smooth(.1,.9,top)));}
  if(is(2))return ny<0?mix(white,[.1,.11,.12],smooth(.7,.86,info[2])):mul(slate,.88);return mul(slate,.84);}
 if(key==='hammerhead'){const bronze=[.52,.48,.40],pale=[.90,.88,.82];
  if(is(0)){const line=-.25+.06*Math.sin(x*40);return mix(pale,bronze,smooth(line-.08,line+.08,top));}
  if(is(6))return mix(pale,bronze,smooth(-.2,.15,top));if(is(2))return ny>0?mul(bronze,.95):pale;return mul(bronze,.86);}
 if(key==='humpback'){const dark=[.07,.08,.10],white=[.90,.90,.88],mott=.5+.5*Math.sin(x*41+z*67)*Math.sin(z*23-x*13);
  if(is(0))return mix(dark,mix(white,mul(dark,1.6),mott*.6),smooth(-.12,-.42,top)*smooth(-.45,-.2,x));
  if(is(2))return ny>0?mix(white,mul(dark,1.5),mott*.65*smooth(.65,0,info[2])):white;
  if(is(3))return ny>0?dark:mix(mix(white,dark,mott*.7),dark,smooth(.8,.95,info[1]));return dark;}
 if(key==='orca'){const blk=[.035,.037,.045],wht=[.95,.95,.93];
  if(is(0)){const side=Math.abs(info[3]);let w=smooth(-.30,-.52,top)*smooth(-.12,.04,x);w=Math.max(w,smooth(-.02,-.30,top)*smooth(.40,.45,x));w=Math.max(w,smooth(-.62,-.82,top)*smooth(-.36,-.18,x));
   w=Math.max(w,1-smooth(.82,1,Math.hypot((x+.13)/.13,(top+.22-(-x-.13)*1.4)/.30)));w=Math.max(w,(1-smooth(.8,1,Math.hypot((x-.315)/.065,(top-.40)/.15)))*(side>.2?1:0));
   return mix(mix(blk,wht,w),[.56,.58,.61],smooth(.55,.85,top)*smooth(-.24,-.15,x)*smooth(.03,-.03,x)*.85);}
  if(is(3)&&ny<0)return mix(wht,blk,smooth(.35,.8,info[1]+info[2]*.35));return blk;}
 if(key==='dolphin'){const cape=[.25,.29,.34],flank=[.52,.56,.60],belly=[.91,.91,.90];
  if(is(0)){const capeLine=.45-.28*Math.exp(-(((x+.05)/.12)**2))+.1*smooth(.30,.42,x);return mix(belly,mix(flank,cape,smooth(capeLine-.08,capeLine+.08,top)),smooth(-.55,-.22,top+.08*Math.sin(x*20)));}
  if(is(2)||is(3))return ny>0?cape:mul(flank,.95);return cape;}
 if(key==='turtle'){
  if(is(8)){if(top<-.12)return [.90,.82,.60];const st=.5+.5*Math.sin(x*22+Math.sin(z*9)*2)*Math.sin(z*19);
   return mix(mix([.30,.20,.10],[.78,.52,.20],st*.7),[.80,.70,.50],smooth(0,-.12,top)*.6);}
  const under=is(9)?smooth(0,-.6,top):smooth(0,-.5,ny);return mix([.45,.35,.19],[.86,.80,.62],under*.8);}
 if(key==='manta'){const blk=[.05,.055,.065],az=Math.abs(z);
  if(is(0)){if(top>=0){const band=x-(.24-.32*az),chev=(1-smooth(.04,.10,Math.abs(band)))*smooth(.12,.22,az)*(1-smooth(.50,.72,az));return mix(blk,[.84,.85,.84],chev*.85);}
   return mix(mix([.93,.93,.92],[.22,.23,.25],smooth(.62,.98,az)*.85),[.3,.3,.3],smooth(-.25,-.45,x)*.5);}
  if(is(7))return ny>0?blk:[.34,.34,.36];return blk;}
 return [.5,.5,.5];
}

// One mesh per species in the shared sea frame: head +x, back +y, length (x) 1, centred on its bounds.
export function buildSeaCreature(key){
 const {G,eye}=shape(key),g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(G.pos,3));g.setIndex(G.idx);g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal,colors=new Float32Array(p.count*3),col=new T.Color();
 for(let i=0;i<p.count;i++){const c=albedo(key,G.info[i*4],p.getX(i),p.getY(i),p.getZ(i),G.info.slice(i*4,i*4+4),n.getY(i));colors.set(col.setRGB(...c,T.SRGBColorSpace).toArray(),i*3);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const root=new T.Group(),body=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:0,side:T.DoubleSide}));root.add(body);
 if(eye){const ball=new T.SphereGeometry(eye[3],10,8),dark=new T.MeshStandardMaterial({color:0x060606,roughness:.15});for(const s of [1,-1]){const m=new T.Mesh(ball,dark);m.position.set(eye[0],eye[1],eye[2]*s);root.add(m);}}
 const box=new T.Box3().setFromObject(root),size=box.getSize(new V3()),c=box.getCenter(new V3()),k=1/size.x;
 root.children.forEach(m=>{m.position.sub(c).multiplyScalar(k);m.scale.multiplyScalar(k);});
 return root;
}
