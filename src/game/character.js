import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {asset} from '../url.js';

export const CHARACTER_SOURCES={A:'A｜codex 程序化',B:'B｜Tripo AI',C:'C｜Quaternius CC0'};
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);

// One weighted skin, including the outfit and facial detail, bound to a 17-bone rig.
function procedural(){
 const bones=[],joints={},pieces=[];
 function bone(name,parent,x,y,z){const b=new T.Bone();b.name=name;b.position.set(x,y,z);(parent?joints[parent]:null)?.add(b);joints[name]=b;bones.push(b);return b;}
 bone('hips',null,0,.91,0);bone('spine','hips',0,.17,0);bone('chest','spine',0,.23,0);bone('neck','chest',0,.13,0);bone('head','neck',0,.10,0);
 for(const [side,s] of [['L',-1],['R',1]]){bone(`arm${side}`,'chest',s*.235,-.01,0);bone(`fore${side}`,`arm${side}`,s*.07,-.265,0);bone(`hand${side}`,`fore${side}`,0,-.245,0);bone(`thigh${side}`,'hips',s*.115,-.015,0);bone(`calf${side}`,`thigh${side}`,0,-.405,0);bone(`foot${side}`,`calf${side}`,0,-.405,.015);}
 joints.hips.updateMatrixWorld(true);
 const palette={skin:0xc79270,shirt:0x437c80,shorts:0xb4a17e,hair:0x342b25,sole:0x36352f,strap:0x654b35,white:0xd3c9b8,eye:0x423c30,nail:0xb8957d};
 const idx=n=>bones.indexOf(joints[n]),rigid=n=>()=>[idx(n)],smooth=T.MathUtils.smoothstep,clamp=T.MathUtils.clamp;
 const bell=(v,c,w)=>Math.exp(-(((v-c)/w)**2)),mix=T.MathUtils.lerp;
 // Colour is sampled in bind space; all detail is geometry/vertex colour, with no runtime work or assets.
 function add(geo,color,weights,tint){if(geo.index)geo=geo.toNonIndexed();const pos=geo.attributes.position,si=[],sw=[],colors=[],base=new T.Color(palette[color]??color);
  for(let i=0;i<pos.count;i++){const p=V().fromBufferAttribute(pos,i),w=weights(p,i),c=base.clone();si.push(w[0],w[1]??w[0],0,0);sw.push(w[2]??1,1-(w[2]??1),0,0);
   const grain=Math.sin(p.x*431+p.y*193+p.z*317)*Math.sin(p.y*271-p.z*419)*.013;
   c.multiplyScalar(1+grain);if(tint)tint(c,p);colors.push(c.r,c.g,c.b);}
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));pieces.push(geo);}
 function surface(rows,n,point,color,weight,tint){rows=Math.max(3,Math.round(rows*.72));n=Math.max(8,Math.round(n*.72/4)*4);const p=[],uv=[],ix=[];for(let j=0;j<=rows;j++)for(let i=0;i<n;i++){p.push(...point(j/rows,i/n*Math.PI*2,j,i));uv.push(i/n,j/rows);if(j){const a=(j-1)*n+i,b=(j-1)*n+(i+1)%n,c=j*n+i,d=j*n+(i+1)%n;ix.push(a,c,b,b,c,d);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();add(g,color,weight,tint);}
 // Cubic longitudinal interpolation and shared circular indices give rounded joints without normal seams.
 function cubic(t,a,b,c,d){const v=(c-a)*.5,w=(d-b)*.5;return (2*b-2*c+v+w)*t*t*t+(-3*b+3*c-2*v-w)*t*t+v*t+b;}
 function sample(rings,t){const u=t*(rings.length-1),k=Math.min(rings.length-2,Math.floor(u)),f=u-k;return rings[k].map((_,i)=>clamp(cubic(f,rings[Math.max(0,k-1)][i],rings[k][i],rings[k+1][i],rings[Math.min(rings.length-1,k+2)][i]),Math.min(rings[k][i],rings[k+1][i]),Math.max(rings[k][i],rings[k+1][i])));}
 function loft(rings,color,weight,{n=24,rows=(rings.length-1)*2,shape,tint}={}){surface(rows,n,(t,a)=>{const [x,y,z,rx,rz]=sample(rings,t),p=[x+Math.cos(a)*rx,y,z+Math.sin(a)*rz];return shape?shape(p,a,t):p;},color,weight,tint);}
 function ellipsoid(center,radii,color,joint,n=16,rows=10,tint){surface(rows,n,(t,a)=>{const h=Math.PI*t,r=Math.sin(h);return [center[0]+r*Math.cos(a)*radii[0],center[1]-Math.cos(h)*radii[1],center[2]+r*Math.sin(a)*radii[2]];},color,rigid(joint),tint);}
 function cord(points,radius,color,joint,n=7,tint){const curve=new T.CatmullRomCurve3(points.map(p=>V(...p))),g=new T.TubeGeometry(curve,Math.max(6,points.length*2),radius,n,false);add(g,color,rigid(joint),tint);}
 const skinTint=(c,p)=>{const warm=bell(p.y,.49,.06)*.13+bell(p.y,1.025,.045)*.08+bell(p.y,.70,.035)*.07;c.r*=1+warm*.35;c.g*=1-warm*.22;c.b*=1-warm*.2;};
 const clothTint=(c,p)=>{const weave=.018*Math.sin(p.y*850)*Math.sin(p.x*850),hem=bell(p.y,.912,.003)*.08;c.multiplyScalar(1+weave+.035*Math.sin(p.y*76+p.x*24)-hem);};
 const torsoWeight=p=>p.y<1.12?[idx('spine'),idx('hips'),smooth(p.y,.94,1.10)]:[idx('chest'),idx('spine'),smooth(p.y,1.06,1.29)];
 // A single branched shirt: the armholes and sleeves share vertices, normals and weights.
 const shirtRings=[[0,.904,0,.184,.119],[0,.918,0,.184,.119],[0,.955,0,.173,.109],[0,1.01,0,.163,.104],[0,1.075,0,.158,.107],[0,1.135,0,.176,.116],[0,1.19,0,.197,.119],[0,1.235,0,.213,.12],[0,1.28,0,.222,.114],[0,1.325,0,.224,.099],[0,1.386,-.002,.198,.081],[0,1.459,-.002,.088,.068]];
 const sp=[],su=[],six=[],sweights=[],sn=40,at=(r,i)=>r*sn+(i+sn)%sn;
 for(let r=0;r<shirtRings.length;r++){const [x,y,z,rx,rz]=shirtRings[r];for(let i=0;i<sn;i++){const a=i/sn*Math.PI*2,front=Math.max(0,Math.sin(a)),back=Math.max(0,-Math.sin(a)),fold=(.004*Math.sin(a*7+y*67)+.002*Math.sin(a*13-y*40))*bell(y,.972,.095)*smooth(y,.915,.95)+.003*Math.sin(y*85+a*3)*bell(y,1.20,.045)*bell(Math.abs(Math.cos(a)),.8,.20);
  sp.push(x+Math.cos(a)*(rx+fold),y,z+Math.sin(a)*(rz+fold)+front*.012*bell(Math.abs(Math.cos(a)),.5,.25)*bell(y,1.25,.07)-back*.005*bell(Math.abs(Math.cos(a)),.55,.3)*bell(y,1.29,.07));su.push(i/sn,r/11);sweights.push(smooth(Math.abs(sp.at(-3)),.155,.266)*smooth(y,1.08,1.14)*(1-smooth(y,1.32,1.40)));
  if(r){const inHole=r>=7&&r<=10&&(i<5||i>=35||(i>=15&&i<25));if(!inHole)six.push(at(r-1,i),at(r,i),at(r-1,i+1),at(r-1,i+1),at(r,i),at(r,i+1));}}}
 for(const [side,s,centre] of [['L',-1,20],['R',1,0]]){
  const loop=[];for(let i=-5;i<5;i++)loop.push(at(6,centre+i));for(let r=6;r<10;r++)loop.push(at(r,centre+5));for(let i=5;i>-5;i--)loop.push(at(10,centre+i));for(let r=10;r>6;r--)loop.push(at(r,centre-5));
  let prev=loop;
  for(let r=1;r<=7;r++){const t=Math.min(r,5)/5,next=[];for(let k=0;k<loop.length;k++){const p=V().fromArray(sp,loop[k]*3),a=Math.atan2((p.y-1.28)*1.12,(p.z)*s),target=V(s*(.282+Math.sin(a)*(.060-(r>5?.003:0))),1.151-Math.sin(a)*.009+(r===7?.008:0),Math.cos(a)*s*(.063-(r>5?.003:0))),q=p.clone().lerp(target,t);if(r<5)q.x+=s*.003*Math.sin(Math.PI*t);next.push(sp.length/3);sp.push(q.x,q.y,q.z);su.push(k/loop.length,t);sweights.push(mix(sweights[loop[k]],1,smooth(t,0,.75)));}
   for(let k=0;k<loop.length;k++){const l=(k+1)%loop.length;six.push(prev[k],next[k],prev[l],prev[l],next[k],next[l]);}prev=next;}
 }
 {const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(sp,3));g.setAttribute('uv',new T.Float32BufferAttribute(su,2));g.setAttribute('sleeveWeight',new T.Float32BufferAttribute(sweights,1));g.setIndex(six);g.computeVertexNormals();
  const skin=g.toNonIndexed(),weight=skin.attributes.sleeveWeight;skin.deleteAttribute('sleeveWeight');g.dispose();
  add(skin,'shirt',(p,i)=>{const f=weight.getX(i),side=p.x<0?'L':'R';return f>0?[idx(`arm${side}`),idx('chest'),f]:torsoWeight(p);},clothTint);}

 // Broad neck base, sternocleidomastoid ridges and a thin bound crew neckline.
 loft([[0,1.365,0,.105,.067],[0,1.422,-.003,.090,.065],[0,1.455,-.006,.075,.063],[0,1.492,-.009,.073,.065],[0,1.532,-.010,.060,.055],[0,1.561,-.012,.049,.047]],'skin',p=>p.y<1.455?[idx('chest'),idx('neck'),1-smooth(p.y,1.38,1.455)]:[idx('neck'),idx('head'),1-smooth(p.y,1.48,1.55)],{n:32,shape:(p,a)=>{p[2]+=.004*Math.max(0,Math.sin(a))*Math.cos(a*4);return p;},tint:skinTint});
 loft([[0,1.452,-.002,.090,.070],[0,1.460,-.002,.090,.070],[0,1.465,-.002,.086,.067],[0,1.462,-.002,.080,.063],[0,1.453,-.002,.080,.063]],0x426f72,rigid('chest'),{n:56,rows:6});
 // Adult skull: narrow temples, cheek planes, mandibular angle, chin and recessed eye sockets.
 const faceRings=[[0,1.515,.005,.029,.031],[0,1.532,.008,.052,.059],[0,1.55,0,.070,.074],[0,1.574,-.008,.084,.083],[0,1.598,-.011,.092,.087],[0,1.622,-.013,.094,.088],[0,1.646,-.017,.092,.089],[0,1.672,-.018,.093,.088],[0,1.699,-.021,.091,.084],[0,1.723,-.023,.078,.071],[0,1.744,-.025,.048,.044],[0,1.752,-.026,0,0]];
 function faceShape(p){const [x,y,z]=p;if(z<-.012)return p;const front=smooth(z,-.012,.045),ax=Math.abs(x);
  p[2]+=front*(.011*bell(ax,.060,.025)*bell(y,1.604,.021)-.008*bell(ax,.043,.022)*bell(y,1.641,.014)+.010*bell(ax,.042,.030)*bell(y,1.658,.009)+.012*bell(x,0,.014)*bell(y,1.632,.030)+.024*bell(x,0,.017)*bell(y,1.606,.017)+.006*bell(ax,.018,.010)*bell(y,1.602,.011)+.009*bell(x,0,.031)*bell(y,1.571,.010)+.008*bell(x,0,.029)*bell(y,1.539,.012));return p;}
 const faceTint=(c,p)=>{skinTint(c,p);const front=smooth(p.z,.01,.065),cheek=bell(Math.abs(p.x),.060,.026)*bell(p.y,1.607,.023)*front,beard=(1-smooth(p.y,1.56,1.60))*front*.035;c.lerp(new T.Color(0xb47560),cheek*.14);c.lerp(new T.Color(0x786455),beard);c.lerp(new T.Color(0xd5a987),bell(p.x,0,.018)*bell(p.y,1.593,.010)*front*.30);};
 const facePiece=pieces.length;
 loft(faceRings,'skin',rigid('head'),{n:72,rows:46,shape:faceShape,tint:faceTint});
 for(const s of [-1,1]){
  // Almond eye aperture, with separate upper/lower lid rolls instead of exposed eyeballs.
  const cx=s*.042,cy=1.642,cz=.071;
  surface(6,24,(t,a)=>{const r=t,x=Math.cos(a)*.020*r,y=Math.sin(a)*.0062*r;return [cx+x,cy+y,cz+.0055*(1-r*r)];},'white',rigid('head'));
  ellipsoid([cx,cy,cz+.0035],[.0055,.0063,.0025],'eye','head',12,8);
  ellipsoid([cx,cy,cz+.0055],[.0025,.0033,.0012],0x191b18,'head',12,6);
  for(const upper of [true,false]){const pts=[];for(let i=0;i<=8;i++){const t=i/8,x=(t*2-1)*.020;pts.push([cx+x,cy+(upper?1:-1)*Math.sin(t*Math.PI)*(upper?.0070:.0058),cz+.001]);}cord(pts,upper?.0018:.0017,upper?0x936c55:0xc49173,'head',6);}
  cord([[cx-.020,1.653,.069],[cx-.010,1.657,.075],[cx+.009,1.656,.074],[cx+.020,1.650,.067]],.0013,0xb18063,'head',6);
  cord([[cx-.022,1.663,.068],[cx-.011,1.667,.075],[cx+.007,1.667,.074],[cx+.022,1.661,.064]],.0020,0x69513e,'head',6);
  // Auricle, inset concha and continuous outer helix; ear size is adult, not a round button.
  ellipsoid([s*.095,1.620,-.017],[.014,.028,.017],'skin','head',16,10,faceTint);
  ellipsoid([s*.105,1.620,-.004],[.006,.017,.010],0xa87359,'head',12,8);
  cord([[s*.103,1.598,-.007],[s*.111,1.610,-.008],[s*.112,1.635,-.014],[s*.102,1.644,-.017],[s*.096,1.634,-.002]],.0038,'skin','head',6);
  ellipsoid([s*.010,1.598,.096],[.003,.0014,.0015],0xb98b6b,'head',10,4);
 }
 // Vermilion is a thin, shaped lip edge; the philtrum and lip volume live on the face loft.
 cord([[-.027,1.572,.073],[-.014,1.574,.079],[0,1.572,.083],[.014,1.574,.079],[.027,1.572,.073]],.0032,0xa66e61,'head',6);
 cord([[-.025,1.570,.074],[0,1.567,.082],[.025,1.570,.074]],.0038,0xbe8875,'head',6);
 // Scalp hugs the temples and tapers down at the nape. Wavy ridges form a swept crop, not separate blobs.
 const hairPiece=pieces.length;
 surface(18,64,(t,a)=>{const front=Math.max(0,Math.sin(a)),back=Math.max(0,-Math.sin(a)),edge=1.627+front*.057-back*.034+.010*front*bell(Math.abs(Math.cos(a)),.78,.22)+.004*Math.sin(a*13)+.002*Math.sin(a*23),h=t*Math.PI/2,y=mix(edge,1.763,Math.sin(h))+.013*Math.sin(Math.PI*t)**2*Math.cos(a+.5),r=Math.pow(Math.cos(h),.68)*(1-(.09+back*.13)*(1-smooth(t,0,.20))),wave=.0018*Math.sin(a*19+t*9)*Math.sin(Math.PI*t);
  const q=[Math.cos(a)*(.101*r+wave)+.014*Math.sin(Math.PI*t),y,Math.sin(a)*(front?.102:.107)*r-.0258762173652649+wave];
  // Keep the scalp just outside the underlying skull, dipping into it only at the tapered hairline.
  const k=faceRings.findIndex(v=>v[1]>=y);if(k>0){const a0=faceRings[k-1],a1=faceRings[k],f=(y-a0[1])/(a1[1]-a0[1]),cx=mix(a0[0],a1[0],f),cz=mix(a0[2],a1[2],f),rx=mix(a0[3],a1[3],f)+.002,rz=mix(a0[4],a1[4],f)+.002,d=Math.hypot((q[0]-cx)/rx,(q[2]-cz)/rz),limit=t===0?.99:1.025;if(d<limit){q[0]=cx+(q[0]-cx)*limit/d;q[2]=cz+(q[2]-cz)*limit/d;}}
  return q;},'hair',rigid('head'),(c,p)=>{const front=smooth(p.z,.005,.055),fade=smooth(p.y,1.602+front*.063,1.659+front*.025);c.lerp(new T.Color(palette.skin),.65*(1-fade));c.multiplyScalar(1+.085*Math.sin(p.x*255+p.y*130+p.z*90));});
 {const p=pieces[hairPiece].attributes.position;let back=0;for(let i=0;i<p.count;i++)back=Math.min(back,p.getZ(i));const scale=-.1328762173652649/back;for(let i=0;i<p.count;i++)if(p.getZ(i)<0)p.setZ(i,p.getZ(i)*scale);}
 // Shorts are connected at the seat/crotch; the upper panels blend onto the hips.
 loft([[0,.901,0,.175,.109],[0,.908,0,.175,.109],[0,.927,0,.172,.107],[0,.932,0,.168,.103]],0xa18d6c,rigid('hips'),{n:40,rows:3});
 cord([[.008,.913,.109],[.008,.87,.111],[.007,.827,.115],[0,.810,.114]],.0013,0x9f8c6d,'hips',5);
 for(const [side,s] of [['L',-1],['R',1]]){
  const x=s*.115,thigh=idx(`thigh${side}`),calf=idx(`calf${side}`),arm=idx(`arm${side}`),fore=idx(`fore${side}`);
  const shortWeight=p=>[thigh,idx('hips'),1-smooth(p.y,.79,.93)];
  const shortShape=(p,a)=>{const u=smooth(p[1],.72,.81),width=mix(.207,.170,smooth(p[1],.82,.90));p[0]=mix(p[0],s*width*Math.max(0,s*Math.cos(a)),u);p[2]=mix(p[2],Math.sin(a)*mix(.112,.102,smooth(p[1],.82,.90)),u);p[2]=mix(p[2],Math.sign(Math.sin(a)||1)*mix(.112,.102,smooth(p[1],.82,.90))*Math.sqrt(Math.max(0,1-(p[0]/width)**2)),u);const fold=.0025*Math.sin(a*7+p[1]*37)+.002*Math.sin(a*13-p[1]*28);const seam=1-u*(1-smooth(s*Math.cos(a),0,.4));p[0]+=Math.cos(a)*fold*seam;p[2]+=Math.sin(a)*fold*seam;return p;};
  loft([[x,.574,0,.091,.088],[x,.59,0,.095,.094],[x,.65,-.002,.097,.097],[x,.72,-.002,.105,.106],[x,.80,-.002,.108,.111],[x*.87,.865,0,.109,.108],[x*.80,.935,0,.10,.101]],'shorts',shortWeight,{n:28,rows:20,shape:shortShape,tint:clothTint});
  // Match the two front panels' normals at the fly; the hidden inner seam must not shade as a cone.
  {const g=pieces.at(-1),p=g.attributes.position,n=g.attributes.normal;for(let k=0;k<p.count;k++){const y=p.getY(k),u=smooth(y,.75,.82);if(u){const a=V(p.getX(k)/(.18*.18),.55,p.getZ(k)/(.106*.106)).normalize(),b=V().fromBufferAttribute(n,k).lerp(a,u).normalize();n.setXYZ(k,b.x,b.y,b.z);}}}
  loft([[x,.575,0,.093,.090],[x,.583,0,.096,.094],[x,.594,0,.096,.095]],0xac9876,shortWeight,{n:28,rows:3,shape:shortShape,tint:clothTint});
  const legWeight=p=>[thigh,calf,smooth(p.y,.43,.55)];
  loft([[x,.083,.015,.038,.041],[x,.12,.005,.038,.043],[x,.17,-.002,.040,.044],[x+s*.005,.235,-.008,.052,.057],[x+s*.006,.30,-.009,.067,.064],[x+s*.003,.36,-.005,.065,.062],[x,.425,0,.052,.052],[x,.474,.006,.061,.060],[x,.515,.005,.064,.061],[x,.56,0,.076,.077],[x,.64,0,.084,.084]],'skin',legWeight,{n:28,rows:26,shape:(p,a)=>{const f=Math.max(0,Math.sin(a));p[2]+=.007*f*bell(p[1],.49,.025)+.003*f*bell(p[1],.28,.1)*bell(Math.cos(a),0,.25);return p;},tint:skinTint});
  // Sole retains the original vertical envelope and toe reach used by the fit/contact rules.
  loft([[x,.000999999581836164,.069,0,0],[x,.006,.069,.045,.087],[x,.015,.069,.067,.130],[x,.026,.069,.071,.145],[x,.038,.069,.063,.124],[x,.045,.069,.048,.089],[x,.051,.069,0,0]],'sole',rigid(`foot${side}`),{n:28,rows:17});
  loft([[x,.039,.060,.047,.118],[x,.053,.054,.055,.115],[x,.069,.041,.052,.101],[x,.091,.021,.044,.071],[x,.111,.009,.037,.047],[x,.131,.004,.034,.041]],'skin',p=>[idx(`foot${side}`),calf,1-smooth(p.y,.085,.14)],{n:28,rows:15,tint:skinTint});
  for(let i=0;i<5;i++){const tx=x+s*(-.036+i*.018),tz=.163-i*.005;ellipsoid([tx,.054,tz],[i?.0095:.013,.013,.024-i*.002],'skin',`foot${side}`,12,6,skinTint);ellipsoid([tx,.064,tz+.009],[i?.006:.008,.0017,.008], 'nail',`foot${side}`,10,4);}
  cord([[x-s*.056,.038,.069],[x-s*.040,.089,.095],[x-s*.017,.086,.140],[x+s*.028,.088,.098],[x+s*.062,.037,.060]],.009,'strap',`foot${side}`,8);
  cord([[x-s*.017,.084,.14],[x-s*.017,.042,.149]],.006,'strap',`foot${side}`,7);
  const armWeight=p=>p.y<.84?[fore,idx(`hand${side}`),smooth(p.y,.782,.835)]:[arm,fore,smooth(p.y,.985,1.085)];
  loft([[s*.305,.781,.001,.032,.030],[s*.305,.82,0,.036,.034],[s*.307,.875,0,.044,.039],[s*.308,.94,-.002,.055,.047],[s*.306,.99,-.001,.053,.048],[s*.304,1.035,-.002,.046,.044],[s*.294,1.08,0,.051,.047],[s*.279,1.14,0,.050,.047],[s*.276,1.17,0,.048,.046]],'skin',armWeight,{n:28,rows:22,shape:(p,a)=>{p[2]-=.004*Math.max(0,-Math.sin(a))*bell(p[1],1.035,.024);return p;},tint:skinTint});
  // Every hand vertex starts wholly on hand, including finger/nail detail, so addBone can re-skin the grip.
  const hand=`hand${side}`,hx=s*.305;
  loft([[hx,.708,.010,.025,.014],[hx,.725,.009,.030,.013],[hx,.753,.006,.031,.015],[hx,.779,.003,.028,.020],[hx,.792,.002,.032,.030]],'skin',rigid(hand),{n:24,rows:12,tint:skinTint});
  for(let i=0;i<4;i++){const xx=hx+s*(-.025+i*.017),tip=[.659,.651,.659,.674][i],r=[.009,.0095,.009,.0075][i];loft([[xx,tip,.014,0,0],[xx,tip+.007,.014,r*.85,r*.8],[xx,tip+.026,.012,r,r*.86],[xx,tip+.043,.010,r*.94,r*.84],[xx,.732,.009,r*1.05,r*.92]],'skin',rigid(hand),{n:12,rows:10,tint:skinTint});ellipsoid([xx,tip+.013,.023],[r*.65,.008,.0015],'nail',hand,10,6);}
  loft([[hx-s*.045,.701,.022,0,0],[hx-s*.047,.708,.024,.010,.010],[hx-s*.047,.728,.027,.012,.012],[hx-s*.037,.752,.018,.013,.012],[hx-s*.025,.770,.009,.014,.014]],'skin',rigid(hand),{n:14,rows:12,tint:skinTint});
 }
 // Head features move together, wholly on head; crown and fit envelope stay fixed.
 for(const g of pieces){const p=g.attributes.position,no=g.attributes.normal,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;for(let i=0;i<p.count;i++)if(si.getX(i)===idx('head')&&sw.getX(i)===1){p.setY(i,1.763+(p.getY(i)-1.763)*.98);p.setX(i,p.getX(i)*1.12);const n=V().fromBufferAttribute(no,i);n.y/=.98;n.x/=1.12;n.normalize();
   // Keep the high crown inside the old cap's envelope: the tower roof passes close overhead.
   const y=p.getY(i);if(y>1.70){const rim=Math.sqrt(Math.max(0,1-((y-1.594)/.169)**2)),d=Math.hypot(p.getX(i)/.137,(p.getZ(i)+.008)/.125);if(d>rim){const f=rim/d;p.setX(i,p.getX(i)*f);p.setZ(i,-.008+(p.getZ(i)+.008)*f);n.set(p.getX(i)/(.137*.137),(y-1.594)/(.169*.169),(p.getZ(i)+.008)/(.125*.125)).normalize();}}
   // The hidden skull stays beneath the cropped hair, including after the crown limit above.
   if(g===pieces[facePiece]&&y>1.70){const inset=.04*smooth(y,1.70,1.72);p.setX(i,p.getX(i)*(1-inset));p.setZ(i,-.008+(p.getZ(i)+.008)*(1-inset));p.setY(i,y-inset*.025);}
   no.setXYZ(i,n.x,n.y,n.z);}}
 const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.86});
 const mesh=new T.SkinnedMesh(geometry,material);mesh.add(joints.hips);mesh.bind(new T.Skeleton(bones));mesh.name='Codex beach humanoid';const model=new T.Group();model.add(mesh);return {model,clips:[]};
}

function disposeModel(model){model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const t of Object.values(m))if(t?.isTexture)t.dispose();m.dispose();}}});}

export async function createCharacter(group='A'){
 let model,clips=[],source=group,fallback=false;
 try{
  if(group==='A')({model,clips}=procedural());
  else {const loader=new GLTFLoader(),base=await loader.loadAsync(group==='B'?asset('assets/character/idle.glb'):asset('assets/character_C/character.glb'));model=base.scene;clips=base.animations;
   if(group==='B'){const loaded=await Promise.allSettled(['walk','run','jump','climb'].map(async name=>{const gltf=await loader.loadAsync(asset(`assets/character/${name}.glb`));const clip=gltf.animations[0]?.clone();if(clip)clip.name=name;disposeModel(gltf.scene);return clip;}));clips=[...clips,...loaded.flatMap(r=>r.status==='fulfilled'&&r.value?[r.value]:[])];if(clips.length<5)throw Error('Incomplete Tripo animation set');}
   // The CC0 download includes a separate display prop. Compare only the rigged person.
   if(group==='C'){const extra=[];model.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)extra.push(o);});extra.forEach(o=>o.removeFromParent());}
  }
 }catch(error){if(model)disposeModel(model);({model,clips}=procedural());source='A';fallback=true;console.warn(`Character ${group}: using procedural fallback (${error.message})`);}
 if(source==='B')model.rotation.y-=Math.PI/2;
 const root=new T.Group(),pivot=new T.Group();root.name=`character-${group}`;root.add(pivot);pivot.add(model);
 const mixer=new T.AnimationMixer(model),actions=new Map();
 for(const clip of clips){actions.set(clip.name.split('|').at(-1).toLowerCase(),mixer.clipAction(clip));}
 if(actions.has('kick_right'))actions.set('kick',actions.get('kick_right'));
 const idle=actions.get('idle');idle?.play();mixer.update(0);root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(model,true),height=bounds.max.y-bounds.min.y;model.scale.multiplyScalar(1.75/height);root.updateMatrixWorld(true);bounds.setFromObject(model,true);model.position.y-=bounds.min.y;model.position.x-=(bounds.max.x+bounds.min.x)/2;model.position.z-=(bounds.max.z+bounds.min.z)/2;root.updateMatrixWorld(true);
 const allBones=[],meshes=[],materials=[];let triangles=0;
 model.traverse(o=>{if(o.isBone)allBones.push(o);if(o.isMesh){meshes.push(o);o.castShadow=o.receiveShadow=true;o.frustumCulled=false;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.push({mat:m,opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite});}});
 const names=source==='A'?{hip:'hips',spine:'spine',head:'head',thigh:['thighL','thighR'],calf:['calfL','calfR'],foot:['footL','footR'],arm:['armL','armR'],fore:['foreL','foreR'],hand:['handL','handR']}:source==='B'?{hip:'Hips',spine:'Spine',head:'Head',thigh:['Left_UpperLeg','Right_UpperLeg'],calf:['Left_LowerLeg','Right_LowerLeg'],foot:['Left_Foot','Right_Foot'],arm:['Left_UpperArm','Right_UpperArm'],fore:['Left_LowerArm','Right_LowerArm'],hand:['Left_Hand','Right_Hand']}:{hip:'Body',spine:'Hips',head:'Head',thigh:['UpperLeg.L','UpperLeg.R'],calf:['LowerLeg.L','LowerLeg.R'],foot:['Foot.L','Foot.R'],arm:['UpperArm.L','UpperArm.R'],fore:['LowerArm.L','LowerArm.R'],hand:['Wrist.L','Wrist.R']};
 const get=n=>allBones.find(b=>b.name===n||b.name===n.replaceAll('.','')),rig={};for(const [k,n] of Object.entries(names))rig[k]=Array.isArray(n)?n.map(get):get(n);
 // Each Tripo clip keeps the hips somewhere else on the ground plane (walk 18 cm to the side of idle, run 16 cm to the
 // side and 91 cm ahead), so the body sat off the player's centre line and jumped when the clip changed. Keep each
 // clip's own movement round the idle clip's spot.
 {const hipTrack=c=>c.tracks.find(t=>t.name===`${rig.hip?.name}.position`),mean=(t,k)=>{let m=0;for(let i=k;i<t.values.length;i+=3)m+=t.values[i];return m/(t.values.length/3);},home=clips.find(c=>c.name==='idle'),ht=home&&hipTrack(home);
  if(ht)for(const clip of clips){if(clip===home||clip.name==='climb')continue;const t=hipTrack(clip);if(!t)continue;for(const k of [0,2]){const d=mean(ht,k)-mean(t,k);for(let i=k;i<t.values.length;i+=3)t.values[i]+=d;}}}
 // The Tripo climb clip carries root motion (the hips rise about a metre per loop, in steps). The game moves the body
 // itself, and with only the linear drift taken out the steps left the hips bobbing 0.2–0.6 m above the feet: a crouch
 // with the head in the rungs. Pin the hips at their bind (standing) position; leg IK puts the feet on the rungs.
 for(const clip of clips)if(clip.name==='climb')for(const track of clip.tracks){if(!rig.hip||track.name!==`${rig.hip.name}.position`)continue;const v=track.values,p=rig.hip.position;
  for(let k=0;k<v.length;k+=3){v[k]=p.x;v[k+1]=p.y;v[k+2]=p.z;}}
 // The clip is a wall climb, chest to the wall: its hips-to-head chain curls forward, which on a leaning ladder pushed
 // the head into the rungs. Keep that chain upright (bind pose); the game sets the torso lean itself (solve's spine.lean).
 // (The actions already exist, so overwrite the values in place.)
 if(rig.hip&&rig.head){const chain=new Map();for(let b=rig.head;b&&b!==rig.hip.parent;b=b.parent)chain.set(`${b.name}.quaternion`,b.quaternion);
  for(const clip of clips)if(clip.name==='climb')for(const track of clip.tracks){const q=chain.get(track.name);if(!q)continue;const v=track.values;
   for(let k=0;k<v.length;k+=4){v[k]=q.x;v[k+1]=q.y;v[k+2]=q.z;v[k+3]=q.w;}}}
 // Rigs without finger bones (the Tripo skin) get one knuckle bone per hand: the front of the palm is re-skinned to
 // it in bind space, so the hand can close around a grip like a mitten. The rest of the skin is untouched.
 const grip=[null,null];
 // Re-skin a fraction f(p) of a hand's own weight onto a new child bone of the hand.
 function addBone(mesh,hand,name,position,list,share){const sk=mesh.skeleton,hi=sk.bones.indexOf(hand),si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;
  const bone=new T.Bone();bone.name=name;bone.position.copy(position);hand.add(bone);allBones.push(bone);
  const fi=sk.bones.length,inverse=new T.Matrix4().makeTranslation(-position.x,-position.y,-position.z).multiply(sk.boneInverses[hi]);
  for(const [k,p] of list){const f=share(p)*T.MathUtils.smoothstep(p.w,.85,.98);if(!f)continue;let wh=0,free=0,low=Infinity;
   for(let c=0;c<4;c++){const w=sw.getComponent(k,c),j=si.getComponent(k,c);if(j===hi)wh+=w;else if(w<low){low=w;free=c;}}
   for(let c=0;c<4;c++)if(si.getComponent(k,c)===hi)sw.setComponent(k,c,sw.getComponent(k,c)*(1-f));
   si.setComponent(k,free,fi);sw.setComponent(k,free,wh*f);}
  si.needsUpdate=sw.needsUpdate=true;mesh.bind(new T.Skeleton([...sk.bones,bone],[...sk.boneInverses,inverse]),mesh.bindMatrix);return bone;}
 const skinned=meshes.find(m=>m.isSkinnedMesh&&rig.hand.every(h=>m.skeleton.bones.includes(h)));
 if(skinned&&rig.hand.every(h=>h&&!h.children.some(c=>c.isBone))){
  const hands=[0,1].map(i=>{const hand=rig.hand[i],sk=skinned.skeleton,hi=sk.bones.indexOf(hand),pos=skinned.geometry.attributes.position,si=skinned.geometry.attributes.skinIndex,sw=skinned.geometry.attributes.skinWeight,toHand=new T.Matrix4().multiplyMatrices(sk.boneInverses[hi],skinned.bindMatrix),list=[];
   for(let k=0;k<pos.count;k++){let w=0;for(let c=0;c<4;c++)if(si.getComponent(k,c)===hi)w+=sw.getComponent(k,c);if(w>.5){const p=V().fromBufferAttribute(pos,k).applyMatrix4(toHand);p.w=w;list.push([k,p]);}}
   if(list.length<20)return null;
   const dir=list.reduce((sum,[,p])=>sum.add(p),V()).normalize(),length=Math.max(...list.map(([,p])=>p.dot(dir)));
   // The bind (T) pose holds the palms down.
   const normal=V(0,-1,0).transformDirection(sk.boneInverses[hi]);normal.addScaledVector(dir,-normal.dot(dir)).normalize();const across=V().crossVectors(dir,normal);
   const band=list.filter(([,p])=>p.dot(dir)>length*.3&&p.dot(dir)<length*.8).map(([,p])=>p.dot(across));
   return {hand,list,dir,normal,across,length,asym:-Math.min(...band)-Math.max(...band)};}).filter(Boolean);
  if(hands.length===2){
   // The thumb sticks out further than the little finger; the hands mirror each other, so read the clearer one.
   const clear=Math.abs(hands[0].asym)>Math.abs(hands[1].asym)?0:1,sigma=[0,0];sigma[clear]=hands[clear].asym>0?-1:1;sigma[1-clear]=-sigma[clear];
   hands.forEach((h,i)=>{const {hand,list,dir,normal,across,length}=h,knuckle=length*.5,thumbSide=sigma[i];
    const reach=Math.max(...list.map(([,p])=>p.dot(across)*thumbSide));
    const isThumb=p=>p.dot(dir)>length*.15&&p.dot(dir)<length*.85?T.MathUtils.smoothstep(p.dot(across)*thumbSide,reach*.45,reach*.7):0;
    const thumbBase=V().copy(dir).multiplyScalar(length*.2).addScaledVector(across,thumbSide*reach*.35);
    const thumb=addBone(skinned,hand,`${hand.name}_thumb`,thumbBase,list,isThumb);
    const finger=addBone(skinned,hand,`${hand.name}_grip`,V().copy(dir).multiplyScalar(knuckle),list,p=>isThumb(p)>.5?0:T.MathUtils.smoothstep(p.dot(dir),knuckle*.8,knuckle*1.15));
    // Curling turns the fingertips toward the palm; the thumb folds under the palm about the hand's long axis.
    grip[i]={bone:finger,dir,normal,curl:[{bone:finger,axis:V().crossVectors(dir,normal).normalize(),amount:1.7},{bone:thumb,axis:V().copy(dir).multiplyScalar(-thumbSide),amount:1.1}]};});
  }
 }
 // Rigs with real finger bones (the Tripo v3 humanoid): the same grip data, built in bind space (T pose, palms down)
 // from each hand's skin inverses, so it holds whatever pose the clips start in.
 const fingerChain=(hand,name)=>{const p=hand.children.find(c=>c.isBone&&c.name.includes(name));const chain=[];for(let b=p;b&&chain.length<3;b=b.children.find(c=>c.isBone))chain.push(b);return chain;};
 if(skinned&&!grip[0]&&rig.hand.every(h=>h&&h.children.some(c=>c.isBone&&/Index|Middle/.test(c.name))))for(let i=0;i<2;i++){
  const hand=rig.hand[i],sk=skinned.skeleton,inv=b=>sk.boneInverses[sk.bones.indexOf(b)],handInv=inv(hand);if(!handInv)continue;
  const bindPos=b=>V().setFromMatrixPosition(inv(b).clone().invert()),handLocal=b=>bindPos(b).applyMatrix4(handInv);
  const chains=Object.fromEntries(['Thumb','Index','Middle','Ring','Pinky'].map(n=>[n,fingerChain(hand,n)]));
  const knuckles=['Index','Middle','Ring','Pinky'].map(n=>chains[n][0]).filter(Boolean);if(knuckles.length<2)continue;
  const dir=knuckles.reduce((sum,b)=>sum.add(handLocal(b)),V()).normalize(),normal=V(0,-1,0).transformDirection(handInv);normal.addScaledVector(dir,-normal.dot(dir)).normalize();
  const across=V().crossVectors(dir,normal),thumbSide=Math.sign(chains.Thumb[0]?handLocal(chains.Thumb[0]).dot(across):1)||1;
  // An axis given in hand space, re-expressed in a finger bone's own frame at bind.
  const handRot=new T.Quaternion().setFromRotationMatrix(handInv.clone().invert()),local=(b,axis)=>axis.clone().applyQuaternion(handRot).applyQuaternion(new T.Quaternion().setFromRotationMatrix(inv(b))).normalize();
  const curl=[];
  for(const n of ['Index','Middle','Ring','Pinky'])chains[n].forEach((b,k)=>curl.push({bone:b,axis:local(b,across),amount:[1.1,1.4,.9][k]}));
  chains.Thumb.forEach((b,k)=>curl.push({bone:b,axis:local(b,V().copy(dir).multiplyScalar(-thumbSide)),amount:[.6,.5,.4][k]}));
  grip[i]={bone:chains.Middle[0]??knuckles[0],dir,normal,curl};
 }
 const rest=new Map(allBones.map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone(),s:b.scale.clone()}]));
 // Each clip's own ground speed (in place): sample the feet over one cycle; stride ≈ peak foot separation,
 // two steps per cycle. Playback is later scaled to the avatar's real speed so the feet don't slide.
 // The same sweep finds each foot's plant: the phase where it is lowest and furthest forward (heel strike).
 const nativeSpeed={},contact={},cycles={};
 for(const name of ['walk','run']){const action=actions.get(name),feet=rig.foot;if(!action||!feet?.[0]||!feet?.[1])continue;
  const duration=action.getClip().duration,a=V(),b=V(),samples=[[],[]],N=96;let sep=0;idle?.stop();action.reset().play();
  for(let k=0;k<N;k++){action.time=duration*k/N;mixer.update(0);root.updateMatrixWorld(true);feet[0].getWorldPosition(a);feet[1].getWorldPosition(b);sep=Math.max(sep,Math.hypot(a.x-b.x,a.z-b.z));samples[0].push([a.y,a.z]);samples[1].push([b.y,b.z]);}
  action.stop();
  // A clip may hold several gait cycles (the Tripo walk has two): a foot swings forward and back once per cycle.
  const z=samples[0].map(v=>v[1]),mean=z.reduce((p,v)=>p+v,0)/N;let cross=0;for(let k=0;k<N;k++)if(Math.sign(z[k]-mean)!==Math.sign(z[(k+1)%N]-mean))cross++;
  const n=Math.max(1,Math.round(cross/2));cycles[name]=n;nativeSpeed[name]=2*n*sep/duration;
  // Heel strikes, one per cycle and foot: the lowest, furthest-forward sample in each cycle's window.
  contact[name]=samples.map(list=>{const low=Math.min(...list.map(v=>v[0])),high=Math.max(...list.map(v=>v[0])),phases=[];
   for(let w=0;w<n;w++){let best=-1,score=-Infinity;for(let k=Math.floor(w*N/n);k<Math.floor((w+1)*N/n);k++){const [y,zz]=list[k],s=zz-(y-low)/(high-low||1)*sep*2;if(y-low<(high-low)*.35&&s>score){score=s;best=k;}}if(best>=0)phases.push(best/N);}
   return phases;});}
 idle?.reset().play();mixer.update(0);for(const [bone,r] of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p);bone.scale.copy(r.s);}root.updateMatrixWorld(true);
 // Directions expressed in each bone's local frame make procedural poses portable
 // across the three rigs' different bone rolls and coordinate systems.
 const axes=new Map(),q=new T.Quaternion(),parentQ=new T.Quaternion(),turn=new T.Quaternion(),dir=V(),from=V(),to=V();
 function axis(b,end){if(!b)return;const a=end?end.getWorldPosition(V()).sub(b.getWorldPosition(V())):V(0,1,0);axes.set(b,a.normalize().applyQuaternion(b.getWorldQuaternion(new T.Quaternion()).invert()));}
 for(let i=0;i<2;i++){axis(rig.thigh[i],rig.calf[i]);axis(rig.calf[i],source==='C'?rig.calf[i]?.children[0]:rig.foot[i]);axis(rig.arm[i],rig.fore[i]);axis(rig.fore[i],rig.hand[i]);}axis(rig.spine,rig.head);
 const hipY=rig.hip?.getWorldPosition(V()).y??.91,hipHalf=rig.thigh?.[0]&&rig.thigh?.[1]?rig.thigh[0].getWorldPosition(V()).distanceTo(rig.thigh[1].getWorldPosition(V()))/2:.1,legLength=rig.thigh?.[0]&&rig.foot?.[0]?rig.thigh[0].getWorldPosition(V()).distanceTo(rig.foot[0].getWorldPosition(V())):hipY*.9;
 const soleTurn=new T.Quaternion(),idleFeet=[null,null];let settle=null,stance=null,pace=0,locoPhase=0,locoSync=false,posed=false,active='idle',age=0,actionAge=0,oneShot='',oneAge=0,opacity=1,lastPhase=null,stride=0;const steps=[];
 const previousPose=new Map(allBones.map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone()}]));
 const poseRotation=new T.Quaternion(),posePosition=V(),bodyRotation=new T.Quaternion(),bodyPosition=V(),headWorld=V();
 function aim(b,x,y,z,weight=1){if(!b||!axes.has(b))return;b.updateWorldMatrix(true,false);b.getWorldQuaternion(q);from.copy(axes.get(b)).applyQuaternion(q);dir.set(x,y,z).normalize().applyQuaternion(root.getWorldQuaternion(parentQ));turn.setFromUnitVectors(from,dir);q.premultiply(turn);b.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);b.quaternion.slerp(q,weight);b.updateWorldMatrix(false,true);}
 const loco=n=>n==='walk'||n==='run';
 function play(name){if(name===active)return;
  // Walk and run already blend in step (below): trading which one leads must not restart either clip.
  if(locoSync&&loco(name)&&loco(active)){active=name;return;}
  if(loco(active))for(const n of ['walk','run'])if(n!==active&&n!==name)actions.get(n)?.fadeOut(.25);
  locoSync=false;const previous=actions.get(active),next=actions.get(name);if(next){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(previous)next.crossFadeFrom(previous,.25,false);}else previous?.fadeOut(.25);active=name;actionAge=0;}
 // From a procedural pose (lie, sit, paddle: no clip) the clip starts at full weight: fading it in would mix it with
 // the bind pose (B and C spread their arms in a T for a moment); the bone smoothing below eases the switch instead.
 function trigger(name){oneShot=name;oneAge=0;}
 function restore(){for(const [b,r] of rest){b.quaternion.copy(r.q);b.position.copy(r.p);b.scale.copy(r.s);}}
 // IK layer, shared by all three rigs and applied after the clip/procedural pose. Targets are world points; each
 // limb has its own weight so callers can ease contacts in and out.
 // Quaternius feet are sibling IK bones and the shin's end bone does not follow the clips, so a helper on each shin
 // marks where the animated foot is; IK moves it and the foot bone follows.
 const ankleMark=source==='C'?[0,1].map(i=>{if(!rig.calf[i])return null;const m=new T.Object3D();m.name='ankle-mark';rig.calf[i].add(m);return m;}):null;
 function markAnkles(){if(!ankleMark)return;for(let i=0;i<2;i++)if(ankleMark[i]&&rig.foot[i]){rig.calf[i].updateWorldMatrix(true,false);ankleMark[i].position.copy(rig.calf[i].worldToLocal(rig.foot[i].getWorldPosition(V())));ankleMark[i].updateWorldMatrix(false,false);}}
 markAnkles();
 const endOf=(i,leg)=>leg?(ankleMark?ankleMark[i]:rig.foot[i]):rig.hand[i];
 // Rig sides differ (A's index 0 sits at -x, the GLB rigs may not): side[i] is the avatar-local x sign of limb i.
 const side=[0,1].map(i=>Math.sign(root.worldToLocal(rig.arm[i]?.getWorldPosition(V())??V(i?1:-1)).x)||(i?1:-1));
 // Ankle height above the sole in the rest pose, for feet planted on a floor.
 const ankle=[0,1].map(i=>{const e=endOf(i,true);return e?root.worldToLocal(e.getWorldPosition(V())).y:.08;});
 const headForward=rig.head?V(0,0,1).applyQuaternion(rig.head.getWorldQuaternion(new T.Quaternion()).invert().multiply(root.getWorldQuaternion(new T.Quaternion()))):null;
 const mw=new T.Matrix4(),ml=new T.Matrix4(),cross=V(),A1=V(),B1=V(),C1=V(),goal=V(),knee=V(),bendDir=V(),worldUp=V(0,1,0),local=V(),rootQ=new T.Quaternion(),Q1=new T.Quaternion();
 const armLength=rig.arm[0]&&rig.fore[0]&&rig.hand[0]?rig.arm[0].getWorldPosition(V()).distanceTo(rig.fore[0].getWorldPosition(B1))+B1.distanceTo(rig.hand[0].getWorldPosition(C1)):.55;
 // Rotate bone b about its origin so the direction toward `tip` points at `point`.
 function swing(b,tip,point,weight=1){b.getWorldPosition(A1);from.copy(tip.getWorldPosition(B1)).sub(A1);dir.copy(point).sub(A1);if(from.lengthSq()<1e-10||dir.lengthSq()<1e-10)return;turn.setFromUnitVectors(from.normalize(),dir.normalize());b.getWorldQuaternion(q);q.premultiply(turn);b.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);b.quaternion.slerp(q,weight);b.updateWorldMatrix(false,true);}
 // Rotate bone b about a world axis.
 function twist(b,axis,angle){if(!b||!angle)return;turn.setFromAxisAngle(axis,angle);b.getWorldQuaternion(q);q.premultiply(turn);b.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);b.quaternion.copy(q);b.updateWorldMatrix(false,true);}
 // Analytic two-bone IK; the middle joint bends toward the world point `pole`.
 function reach(upper,lower,end,target,pole,weight=1){
  if(!upper||!lower||!end||!target||weight<=0)return null;upper.updateWorldMatrix(true,true);
  const a=upper.getWorldPosition(V()),l1=a.distanceTo(lower.getWorldPosition(B1)),l2=B1.distanceTo(end.getWorldPosition(C1));
  goal.copy(target).sub(a);const d=T.MathUtils.clamp(goal.length(),Math.abs(l1-l2)+1e-3,(l1+l2)*.999);goal.normalize();
  bendDir.copy(pole).sub(a);bendDir.addScaledVector(goal,-bendDir.dot(goal));if(bendDir.lengthSq()<1e-8)bendDir.copy(B1).sub(a).addScaledVector(goal,-B1.clone().sub(a).dot(goal));bendDir.normalize();
  const cos=T.MathUtils.clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1);knee.copy(a).addScaledVector(goal,l1*cos).addScaledVector(bendDir,l1*Math.sqrt(1-cos*cos));
  swing(upper,lower,knee,weight);swing(lower,end,goal.multiplyScalar(d).add(a),weight);return end.getWorldPosition(V()).distanceTo(target);
 }
 const toWorld=(x,y,z)=>local.set(x,y,z).applyMatrix4(root.matrixWorld);
 const toWorldDir=(x,y,z)=>V(x,y,z).applyQuaternion(root.getWorldQuaternion(rootQ));
 const error={hands:[null,null],feet:[null,null]},lastFeet=[V(),V()];
 function solve({hands,feet,handWeight=1,footWeight=1,pelvis=0,ground,floor,spine,look,lookWeight=1,handAim,curl,sole,kneeOut}){
  root.updateWorldMatrix(true,true);markAnkles();
  // Terrain-following feet: each foot keeps the clip's lift above its own patch of ground; the pelvis drops to the
  // lower foot so the legs only ever shorten.
  let feetTargets=feet;
  if(!feet&&ground){const rootY=root.getWorldPosition(A1).y,out=[];let drop=0;
   // Stance width: standing each foot stays at least a hip's half-width out from the body's centre line. Under way the
   // feet come in to nearly one line, whatever the clip does (people walk about 5 cm each side of it and run closer;
   // the rigs' legs hang at hip width, 10-11 cm, and B's clips cross).
   const centre=root.getWorldPosition(B1),right=toWorldDir(1,0,0),under=T.MathUtils.smoothstep(pace,.2,1.2),line=T.MathUtils.lerp(.06,.04,T.MathUtils.smoothstep(pace,2.9,4.3));
   for(let i=0;i<2;i++){const e=endOf(i,true);if(!e){out.push(null);continue;}const p=e.getWorldPosition(V()),off=side[i]*((p.x-centre.x)*right.x+(p.z-centre.z)*right.z),shift=T.MathUtils.lerp(Math.max(off,hipHalf),line,under)-off;
    p.x+=right.x*side[i]*shift;p.z+=right.z*side[i]*shift;
    const g=ground(p.x,p.z)-rootY;out.push(p.setY(p.y+g));drop=Math.min(drop,g);}
   if(settle){if(settle.first==null)settle.first=out[0]&&out[1]&&settle.plant[1].distanceTo(out[1])>settle.plant[0].distanceTo(out[0])?1:0;
    for(let i=0;i<2;i++){if(!out[i])continue;const start=i===settle.first?.05:.3,t=T.MathUtils.clamp((settle.age-start)/.26,0,1),k=T.MathUtils.smoothstep(t,0,1),far=settle.plant[i].distanceTo(out[i])>.05;
     out[i].lerpVectors(settle.plant[i],out[i],far?k:1);if(far)out[i].y+=Math.sin(Math.PI*t)*.06;}
    if(settle.age>.65)settle=null;}
   // Standing still: the feet stay where they landed. The Tripo idle clip slides them about while the hips stay put,
   // so pin them (any weight shift stays in the upper body). Moving off the spot, turning on it, or a teleport
   // releases them (getting up from the lounger lands on the spot it was entered from, turned: pinned there, the
   // feet stayed where the old heading put them and the legs crossed until the first step).
   if(active==='idle'&&!settle&&out[0]&&out[1]){const at=root.getWorldPosition(C1),facing=root.getWorldQuaternion(Q1);
    // Both soles on the sand: each ankle at its standing (rest pose) height above the ground under it.
    if(!stance||stance.at.distanceTo(at)>.01||stance.facing.angleTo(facing)>.05){stance={at:at.clone(),facing:facing.clone(),feet:out.map((p,i)=>p.clone().setY(ground(p.x,p.z)+ankle[i]))};const fw=toWorldDir(0,0,1);stance.feet.forEach((p,i)=>{idleFeet[i]=[(p.x-at.x)*right.x+(p.z-at.z)*right.z,(p.x-at.x)*fw.x+(p.z-at.z)*fw.z];});}
    for(let i=0;i<2;i++)out[i].copy(stance.feet[i]);}
   else stance=null;
   pelvis+=drop;feetTargets=out;}
  // Seated feet rest on a floor (boat hull) instead; the body stays on its seat.
  if(!feet&&floor)feetTargets=[0,1].map(i=>{const e=endOf(i,true);if(!e)return null;const p=e.getWorldPosition(V()),y=floor(p.x,p.z);return y==null?null:p.setY(y+ankle[i]);});
  // Crouch: lower the body, then let foot IK bend the knees back down to the planted feet.
  if(pelvis){if(!feetTargets)feetTargets=[0,1].map(i=>endOf(i,true)?.getWorldPosition(V())??null);pivot.position.y+=pelvis;root.updateMatrixWorld(true);}
  if(spine&&rig.spine){const fwd=toWorldDir(0,0,1),right=toWorldDir(1,0,0);
   if(spine.lean)twist(rig.spine,right,spine.lean);if(spine.roll)twist(rig.spine,fwd,spine.roll);if(spine.twist)twist(rig.spine,toWorldDir(0,1,0),spine.twist);}
  const fwd=toWorldDir(0,0,1),up=toWorldDir(0,1,0);
  // On the ground the soles keep the clip's world orientation through the leg IK; otherwise a crouch tilts the shins
  // forward and the toes dig into the sand. (C's foot bones are IK siblings placed separately below.)
  const keepSole=ground&&source!=='C'?rig.foot.map(f=>f?f.getWorldQuaternion(new T.Quaternion()):null):null;
  for(let i=0;i<2;i++){
   const s=side[i],target=hands?.[i];
   if(target){const elbow=rig.fore[i]?.getWorldPosition(V())??toWorld(s*.3,1.1,0);const pole=elbow.add(toWorldDir(s*.6,-.5,-.35));const w=Array.isArray(handWeight)?handWeight[i]:handWeight;error.hands[i]=reach(rig.arm[i],rig.fore[i],endOf(i,false),target,pole,w);}else error.hands[i]=null;
   const foot=feetTargets?.[i];
   if(foot){const kneeAt=rig.calf[i]?.getWorldPosition(V())??toWorld(s*.1,.5,0);const pole=kneeAt.addScaledVector(fwd,1).addScaledVector(up,.1).addScaledVector(toWorldDir(1,0,0),s*(kneeOut??T.MathUtils.lerp(.15,.03,T.MathUtils.smoothstep(pace,.2,1.2))));const w=Array.isArray(footWeight)?footWeight[i]:footWeight;error.feet[i]=reach(rig.thigh[i],rig.calf[i],endOf(i,true),foot,pole,w);
    if(source==='C'&&rig.foot[i]){endOf(i,true).getWorldPosition(to);rig.foot[i].parent.worldToLocal(to);rig.foot[i].position.copy(to);}
    if(keepSole?.[i]){const f=rig.foot[i];f.parent.getWorldQuaternion(parentQ).invert();f.quaternion.copy(parentQ.multiply(keepSole[i]));f.updateWorldMatrix(false,true);}
    // Heel up (+) or toes up (-), about the body's side axis.
    if(sole?.[i]&&rig.foot[i]){const f=rig.foot[i],q=f.getWorldQuaternion(new T.Quaternion()).premultiply(soleTurn.setFromAxisAngle(toWorldDir(1,0,0),sole[i]));f.parent.getWorldQuaternion(parentQ).invert();f.quaternion.copy(parentQ.multiply(q));f.updateWorldMatrix(false,true);}}else error.feet[i]=null;
  }
  // Wrists: point the fingers along `dir` with the palm facing `palm` (world), then close the knuckle bones.
  for(let i=0;i<2;i++){const aimAt=handAim?.[i],g=grip[i],hand=rig.hand[i];
   if(aimAt&&g&&hand){const w=Array.isArray(handWeight)?handWeight[i]:handWeight;mw.makeBasis(aimAt.dir,aimAt.palm,cross.crossVectors(aimAt.dir,aimAt.palm));ml.makeBasis(g.dir,g.normal,cross.crossVectors(g.dir,g.normal)).transpose();const want=new T.Quaternion().setFromRotationMatrix(mw.multiply(ml));
    // Pronation belongs to the forearm (a wrist that rolls far tears the skin), so roll the forearm about its own axis
    // by the twist part of the change, then bend the wrist the rest of the way, within a natural range.
    const fore=rig.fore[i],axisW=hand.getWorldPosition(A1).sub(fore.getWorldPosition(B1)).normalize();
    const delta=want.clone().multiply(hand.getWorldQuaternion(q).invert()),proj=axisW.dot(V(delta.x,delta.y,delta.z));
    const roll=new T.Quaternion(axisW.x*proj,axisW.y*proj,axisW.z*proj,delta.w).normalize();turn.identity().slerp(roll,w);
    fore.getWorldQuaternion(q).premultiply(turn);fore.parent.getWorldQuaternion(parentQ).invert();fore.quaternion.copy(q.premultiply(parentQ));fore.updateWorldMatrix(false,true);
    const bend=want.clone().multiply(hand.getWorldQuaternion(q).invert()),angle=2*Math.acos(Math.min(1,Math.abs(bend.w)));turn.identity().slerp(bend,w*Math.min(1,1.1/Math.max(angle,1e-6)));
    hand.getWorldQuaternion(q).premultiply(turn);hand.parent.getWorldQuaternion(parentQ).invert();hand.quaternion.copy(q.premultiply(parentQ));hand.updateWorldMatrix(false,true);}
   if(g)for(const c of g.curl)c.bone.quaternion.multiply(turn.setFromAxisAngle(c.axis,(curl?.[i]??0)*c.amount));}
  // Head turns toward a point of interest, within a comfortable neck range.
  if(look&&rig.head&&headForward){const h=rig.head.getWorldPosition(A1);rig.head.getWorldQuaternion(q);from.copy(headForward).applyQuaternion(q);dir.copy(look).sub(h).normalize();const angle=from.angleTo(dir);if(angle>1e-4){const limit=Math.min(angle,1.05)/angle;turn.setFromUnitVectors(from,dir);const partial=new T.Quaternion().slerp(turn,limit*lookWeight);q.premultiply(partial);rig.head.parent.getWorldQuaternion(parentQ).invert();q.premultiply(parentQ);rig.head.quaternion.copy(q);rig.head.updateWorldMatrix(false,true);}}
 }
 function update(dt,{speed=0,airborne=false,pose='stand',first=false,fade=1,animation=null,ik=null,recline=0,snapPose=false,cut=false}={}){
  // A dt=0 call (a render between offline steps) keeps the current pose. Re-running restore() there would leave
  // the rest pose on screen: three.js PropertyMixer skips writing values that did not change since its last apply.
  if(!dt&&posed&&!animation)return;posed=true;
  age+=dt;actionAge+=dt;oneAge+=dt;if(oneAge>.85)oneShot='';
  // While moving, locomotion wins: a pickup only layers its arm reach on top, a kick is skipped.
  // Speed eases between walk and run (the body itself speeds up and slows down over a few strides, src/explore.js);
  // from 2.9 to 4.3 m/s both cycles play, weighted, on one shared stride phase.
  // A negative speed walks backwards (pulling the boat back): the same gait, its phase running the other way.
  const back=speed<0?-1:1;speed=Math.abs(speed);
  pace=dt?T.MathUtils.damp(pace,speed,10,dt):speed;const blendRun=T.MathUtils.smoothstep(pace,2.9,4.3);
  const gait=speed>.12?(blendRun>.5?'run':'walk'):'idle',layered=gait!=='idle'&&oneShot==='interact'&&!animation;
  const selected=animation??(pose==='climb'?'climb':pose==='paddle'?'paddle':pose==='lie'?'lie':pose==='sit'||pose==='sand'?'sit':airborne?'jump':gait!=='idle'?gait:oneShot||gait);
  // Stopping: crossfading walk into idle would slide the planted feet across the sand. Pin them where they are and
  // step them into the idle stance one at a time (the further one first).
  const was=active;play(selected);
  if(selected!=='idle'||animation)settle=null;else if(loco(was)&&dt)settle={plant:lastFeet.map(v=>v.clone()),age:0,first:null};
  if(settle)settle.age+=dt;
  const walkA=actions.get('walk'),runA=actions.get('run'),both=!animation&&loco(selected)&&walkA&&runA&&nativeSpeed.walk&&nativeSpeed.run;
  if(both&&(locoSync||actionAge>.25)){
   // One shared gait phase (0 = the first foot's heel strike); each clip plays the matching moment of its first cycle.
   const frac=x=>(x%1+1)%1,lead=n=>frac((contact[n]?.[0]?.[0]??0)*cycles[n]),stride=n=>nativeSpeed[n]*actions.get(n).getClip().duration/cycles[n];
   const cycle=T.MathUtils.lerp(stride('walk'),stride('run'),blendRun);
   if(!locoSync){const n=active==='run'?'run':'walk',a=actions.get(n);locoPhase=frac(a.time/a.getClip().duration*cycles[n]-lead(n));}
   locoSync=true;locoPhase=frac(locoPhase+back*dt*Math.min(speed,cycle*3)/cycle);
   for(const [a,w,n] of [[walkA,1-blendRun,'walk'],[runA,blendRun,'run']]){a.enabled=true;if(!a.isRunning())a.play();a.setEffectiveTimeScale(0).setEffectiveWeight(w);a.time=frac(locoPhase+lead(n))/cycles[n]*a.getClip().duration;}
  }
  else if(nativeSpeed[selected]&&!animation)actions.get(selected).setEffectiveTimeScale(back*T.MathUtils.clamp(speed/nativeSpeed[selected],.5,5));
  restore();mixer.update(dt);
  // Foot plants: report each foot whose contact phase the clip passed this frame.
  steps.length=0;const clipAction=actions.get(selected);
  if(contact[selected]&&clipAction&&dt){const phase=(clipAction.time/clipAction.getClip().duration)%1;if(lastPhase!==null&&lastPhase[0]===selected){const from=lastPhase[1];contact[selected].forEach((list,i)=>{for(const c of list)if(phase>=from?c>from&&c<=phase:c>from||c<=phase)steps.push(i);});}lastPhase=[selected,phase];}else lastPhase=null;
  if(layered){const w=Math.sin(Math.PI*Math.min(oneAge/.85,1));for(let i=0;i<2;i++){const sign=i?1:-1;aim(rig.arm[i],sign*.2,-.6,.9,w);aim(rig.fore[i],0,-.3,1,w);}}
  const proceduralPose=!actions.has(selected),seated=selected==='sit'||selected==='paddle',lying=selected==='lie';
  // Reset the outer transform before posing. All anatomical directions are avatar-local.
  pivot.position.set(0,0,0);pivot.quaternion.identity();root.updateMatrixWorld(true);
  if(proceduralPose){
   // Procedural gait (no clip): fixed cadence; the stance leg stays straight and its amplitude is matched to speed so
   // the foot sweeps back at ground speed as it passes under the hip (leg·amplitude·ω = speed). That moment is the plant.
   const rate=loco(selected)?(source==='A'?Math.max(T.MathUtils.lerp(7.5+pace*.5,9.5+pace*.25,blendRun),speed*Math.PI*T.MathUtils.lerp(.56,.34,blendRun)/T.MathUtils.lerp(.39,.46,blendRun)):T.MathUtils.lerp(7,10,blendRun)):0,gait=rate?T.MathUtils.clamp(speed/(legLength*rate),.15,1.1):0;
   if(rate&&dt){const before=stride;stride+=back*rate*dt;if(Math.floor(stride/Math.PI)!==Math.floor(before/Math.PI))steps.push(Math.floor(stride/Math.PI)%2?1:0);}
   const cycle=rate?stride:age*8,swing=Math.sin(cycle)*gait;
   if(source==='A'&&(rate>0||selected==='idle')){
    // All targets are functions of stride/age. No pose state is integrated here.
    // During stance z = -legLength * amplitude * phase, hence dz/dt = -speed.
    const run=blendRun,scale=model.scale.y,L1=rest.get(rig.calf[0]).p.length()*scale,L2=rest.get(rig.foot[0]).p.length()*scale;
    const duty=T.MathUtils.lerp(.56,.34,run),edge=Math.PI*duty,amplitude=rate?speed/(legLength*rate):0,A=legLength*amplitude,span=2*Math.PI-2*edge;
    const hipRest=rest.get(rig.hip).p,baseY=hipY+rest.get(rig.thigh[0]).p.y*scale,baseZ=model.position.z+.015*scale;
    const roll=rate?.025*Math.cos(cycle):.006*Math.sin(age*.63),yaw=rate?.045*Math.sin(cycle):.012*Math.sin(age*.41);
    rig.hip.rotation.set(0,yaw,roll);rig.hip.position.x=hipRest.x+(rate?0:.004*Math.sin(age*.63))/scale;rig.hip.position.z=hipRest.z+(rate?.05:0)/scale;
    // Collapse flight continuously to double support as blendRun passes through duty=1/2.
    // The outgoing support height approaches the incoming one before the flight interval vanishes.
    const flight=T.MathUtils.smoothstep(.5-duty,0,.16),width2=(hipHalf-T.MathUtils.lerp(.06,.04,run))**2;
    const entryPitch=T.MathUtils.lerp(-.22,.10,run),exitPitch=T.MathUtils.lerp(.48,.55,run),entryBend=T.MathUtils.lerp(.26,.30,run),exitBend=T.MathUtils.lerp(.41,.30,run);
    const exitZ=.015*scale-.05-A*edge,entryZ=.015*scale-.05+A*edge;
    const exitY=ankle[0]*Math.cos(exitPitch)+.197*Math.sin(exitPitch)+Math.sqrt(Math.max(.1,L1*L1+L2*L2+2*L1*L2*Math.cos(exitBend)-exitZ*exitZ-width2));
    const entryY=ankle[0]*Math.cos(entryPitch)+(entryPitch<0?.075:.197)*Math.abs(Math.sin(entryPitch))+Math.sqrt(Math.max(.1,L1*L1+L2*L2+2*L1*L2*Math.cos(entryBend)-entryZ*entryZ-width2));
    // The lower support sets pelvis height. Walk has double support; run has a ballistic-looking flight arc.
    let hipLevel=Infinity;
    for(let i=0;i<2&&rate;i++){
     const ph=Math.atan2(Math.sin(cycle-i*Math.PI),Math.cos(cycle-i*Math.PI));
     const beyond=Math.max(0,Math.abs(ph)-edge);if(beyond>.28)continue;
     const support=T.MathUtils.clamp(ph,-edge,edge),u=(support+edge)/(2*edge),pitch=T.MathUtils.lerp(-.22*(1-T.MathUtils.smoothstep(u,0,.20))+.48*T.MathUtils.smoothstep(u,.65,1),.10*(1-T.MathUtils.smoothstep(u,0,.25))+.55*T.MathUtils.smoothstep(u,.55,1),run);
     const footY=ankle[i]*Math.cos(pitch)+(pitch<0?.075:.197)*Math.abs(Math.sin(pitch));
     const bend=T.MathUtils.lerp(.10+.16*(2*u-1)**2+.15*T.MathUtils.smoothstep(u,.65,1),.30+.55*Math.sin(Math.PI*u),run);
     const reach2=L1*L1+L2*L2+2*L1*L2*Math.cos(bend),z=.015*scale-.05-A*support;
     hipLevel=Math.min(hipLevel,footY+Math.sqrt(Math.max(.1,reach2-z*z-width2))-(exitY-entryY)*(1-flight)*T.MathUtils.smoothstep(u,.7,1)+.25*T.MathUtils.smoothstep(beyond,0,.28));
    }
    if(!rate)hipLevel=baseY-.003;
    else if(Math.acos(Math.cos(2*cycle))/2>edge){
     const half=((cycle%Math.PI)+Math.PI)%Math.PI,v=(half-edge)/(Math.PI-2*edge);
     hipLevel=Math.min(hipLevel,T.MathUtils.lerp(entryY+(exitY-entryY)*flight,entryY,v)+.075*run*flight*Math.sin(Math.PI*v));
    }
    rig.hip.position.y=hipRest.y+(hipLevel-baseY-(rate?.001:0))/scale;
    root.updateMatrixWorld(true);
    for(let i=0;i<2;i++){
     const sign=side[i],ph=Math.atan2(Math.sin(cycle-i*Math.PI),Math.cos(cycle-i*Math.PI));
     let x=sign*(rate?T.MathUtils.lerp(.06,.04,run):hipHalf),z=baseZ,y=ankle[i],pitch=0;
     if(rate&&Math.abs(ph)<=edge){
      const u=(ph+edge)/(2*edge);z-=A*ph;
      pitch=T.MathUtils.lerp(-.22*(1-T.MathUtils.smoothstep(u,0,.20))+.48*T.MathUtils.smoothstep(u,.65,1),.10*(1-T.MathUtils.smoothstep(u,0,.25))+.55*T.MathUtils.smoothstep(u,.55,1),run);
      y=ankle[i]*Math.cos(pitch)+(pitch<0?.075:.197)*Math.abs(Math.sin(pitch));
     }else if(rate){
      const u=((ph>0?ph:ph+2*Math.PI)-edge)/span,t=u*u*(3-2*u);
      z+=A*edge*(2*t-1)-A*span*u*(1-u)*(1-2*u);
      const endBend=T.MathUtils.lerp(T.MathUtils.lerp(.41,.30,run),T.MathUtils.lerp(.26,.30,run),u),flex=T.MathUtils.lerp(endBend,T.MathUtils.lerp(Math.PI/3,Math.PI*5/9,run),Math.sin(Math.PI*u));
      const reach2=L1*L1+L2*L2+2*L1*L2*Math.cos(flex);
      y=hipLevel-Math.sqrt(Math.max(.08,reach2-(z-model.position.z-.05)**2-(hipHalf-Math.abs(x))**2));
      pitch=T.MathUtils.lerp(.48,.55,run)*(1-T.MathUtils.smoothstep(u,0,.45))+T.MathUtils.lerp(-.22,.10,run)*T.MathUtils.smoothstep(u,.65,1);
      y=Math.max(y,ankle[i]*Math.cos(pitch)+(pitch<0?.075:.197)*Math.abs(Math.sin(pitch))+.008*Math.sin(Math.PI*u));
     }
     // Closed-form two-link construction in avatar space; aim() accounts for the rotated pelvis.
     rig.thigh[i].getWorldPosition(B1);root.worldToLocal(B1);const hx=B1.x,hy=B1.y,hz=B1.z;
     const dx=x-hx,dy=y-hy,dz=z-hz,kx=sign*(rate?T.MathUtils.lerp(.089,.081,run):hipHalf)-hx;
     const a=Math.sqrt(L1*L1-kx*kx),b=Math.sqrt(L2*L2-(dx-kx)**2),d0=Math.hypot(dy,dz),d=Math.min(d0,(a+b)*.999);
     const along=(a*a+d*d-b*b)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along)),ky=dy/d0*along+dz/d0*height,kz=dz/d0*along-dy/d0*height;
     aim(rig.thigh[i],kx,ky,kz);aim(rig.calf[i],dx-kx,dy-ky,dz-kz);
     // Set a world-relative sole angle. solve() preserves it while following terrain.
     root.getWorldQuaternion(q);turn.set(Math.sin(pitch/2),0,0,Math.cos(pitch/2));q.multiply(turn);rig.foot[i].parent.getWorldQuaternion(parentQ).invert();rig.foot[i].quaternion.copy(parentQ.multiply(q));
     const shoulder=rate?T.MathUtils.lerp(.36,.65,run)*Math.sin(ph):.035+.014*Math.sin(age*.72+i*.8);
     const elbow=rate?T.MathUtils.lerp(.24+.22*Math.max(0,Math.sin(ph)),1.45+.10*Math.sin(ph+.4),run):.18;
     aim(rig.arm[i],sign*.12,-Math.cos(shoulder),Math.sin(shoulder));aim(rig.fore[i],sign*.035,-Math.cos(shoulder+elbow),Math.sin(shoulder+elbow));
     // Roll at the forearm, leaving a quiet wrist and a loose, partially closed hand.
     rig.fore[i].rotateOnAxis(axes.get(rig.fore[i]),sign*(.25+.85*run));
     if(!ik?.curl?.[i]&&grip[i])for(const c of grip[i].curl)c.bone.quaternion.setFromAxisAngle(c.axis,c.amount*(rate?.18+.24*run:.12));
    }
    rig.spine.rotation.set(.025+run*.12+(rate?.008*Math.cos(2*cycle):.008*Math.sin(age*1.4)),-yaw*1.7,-roll*.85);
    // Chest breathing does not propagate to the legs, which remain at their fixed targets in idle.
    if(!rate){const chest=rig.spine.children[0],breath=Math.sin(age*1.4);chest.scale.set(1+.004*breath,1+.002*breath,1+.008*breath);}
    root.updateMatrixWorld(true);root.getWorldQuaternion(q);turn.setFromAxisAngle(worldUp,rate?.008*Math.sin(cycle):.025*Math.sin(age*.39));q.multiply(turn);rig.head.parent.getWorldQuaternion(parentQ).invert();rig.head.quaternion.copy(parentQ.multiply(q));
   }else{
   for(let i=0;i<2;i++){const sign=i?1:-1,s=i?swing:-swing,stance=rate&&(i?Math.cos(cycle):-Math.cos(cycle))<0;let thigh=[0,-Math.cos(s),Math.sin(s)],calf=stance?thigh:[0,-1,Math.max(0,-s)*.7],arm=[sign*.15,-1,-s*.7],fore=[0,-1,.12];
    if(seated){thigh=[0,-.12,1];calf=pose==='sand'?[0,-.05,1]:[0,-1,.08];arm=[sign*.3,-1,.45];fore=[0,-.15,1];if(selected==='paddle'){arm=[sign*.4,-.4,.8+Math.sin(age*6+i)*.5];fore=[sign*.25,-.2,.9];}}
    // Lying back at recline (radians above level): the legs stay level along the seat, so in the body's frame they
    // point down and forward by the recline.
    if(lying){const c=Math.cos(recline),s=Math.sin(recline);thigh=[0,-c,s];calf=[0,-c,s+.05];arm=[sign*.16,-1,.22];fore=[0,-1,.3];}
    if(selected==='jump'){thigh=[0,-1,.45];calf=[0,-.8,-.5];arm=[sign*.3,.2,.9];fore=[0,.8,.3];}
    if(selected==='climb'){const c=Math.sin(age*5+i*Math.PI);thigh=[0,-.7,.5+c*.3];calf=[0,-1,-.2];arm=[sign*.3,.6+c*.3,.5];fore=[0,.5,.7];}
    if(selected==='kick'&&i===1){const k=Math.sin(Math.min((animation?age%1:oneAge)/.75,1)*Math.PI);thigh=[0,-Math.cos(k*1.4),Math.sin(k*1.4)];calf=[0,-Math.cos(k*1.7),Math.sin(k*1.7)];}
    if(selected==='interact'){arm=[sign*.2,-.6,.9];fore=[0,-.3,1];}
    aim(rig.thigh[i],...thigh);aim(rig.calf[i],...calf);aim(rig.arm[i],...arm);aim(rig.fore[i],...fore);
    // Quaternius feet use sibling IK bones, so keep them at the posed ankle.
    if(source==='C'&&rig.foot[i]){const end=rig.calf[i].children[0];end.getWorldPosition(to);rig.foot[i].parent.worldToLocal(to);rig.foot[i].position.copy(to);}
   }
   aim(rig.spine,0,1,lying?.45*(1-Math.min(1,recline/.4)):selected==='interact'?.35:seated?.08:Math.sin(age*1.7)*.018);
  }
   }

  // Smooth bones only right after a clip/pose switch; smoothing every frame flattens the gait cycle itself.
  // cut: a teleport between modes (getting up from the lounger, off the boat): no easing from the old pose at all.
  const blend=1-Math.exp(-12*dt),boneBlend=actionAge<.3&&!cut?blend:1;
  for(const [b,previous] of previousPose){q.copy(b.quaternion);b.quaternion.copy(previous.q).slerp(q,dt?boneBlend:1);b.position.lerpVectors(previous.p,b.position,dt?boneBlend:1);previous.q.copy(b.quaternion);previous.p.copy(b.position);}
  posePosition.set(0,0,0);poseRotation.identity();
  // Lying: the body tips back about the hips (which rest .135 above the avatar origin) to the recline.
  if(lying){const tip=recline-Math.PI/2;posePosition.set(0,.135-hipY*Math.cos(tip),-hipY*Math.sin(tip));poseRotation.setFromAxisAngle(V(1,0,0),tip);}
  else if(seated)posePosition.set(0,-hipY+.10,0);
  // snapPose: the caller has already brought the body to the new pose's height (climbing into the boat ends seated).
  bodyRotation.slerp(poseRotation,dt&&!snapPose&&!cut?blend:1);bodyPosition.lerp(posePosition,dt&&!snapPose&&!cut?blend:1);
  pivot.quaternion.copy(bodyRotation);pivot.position.copy(bodyPosition);
  if(ik)solve(ik);else{error.hands.fill(null);error.feet.fill(null);}
  for(let i=0;i<2;i++)endOf(i,true)?.getWorldPosition(lastFeet[i]);
  // Hide the head through its bone (also covers a unified Tripo skin).
  if(rig.head&&first)rig.head.scale.multiplyScalar(.001);
  opacity=T.MathUtils.damp(opacity,fade,12,dt);for(const m of materials){m.mat.opacity=m.opacity*opacity;m.mat.transparent=m.transparent||opacity<.995;m.mat.depthWrite=m.depthWrite&&opacity>.5;}
  root.updateMatrixWorld(true);
 }
 function info(){return {pace,blendRun:T.MathUtils.smoothstep(pace,2.9,4.3),group,source:CHARACTER_SOURCES[source],fallback,triangles,clips:clips.map(c=>c.name),animation:active,actionTime:actionAge,skinnedMeshes:meshes.filter(m=>m.isSkinnedMesh).length,bones:allBones.length,height:1.75,headHidden:rig.head?.scale.x<.01,poseSample:rig.thigh.map(b=>b?.quaternion.toArray()),clipTime:actions.get(active)?.time??null,footSep:rig.foot?.[0]&&rig.foot?.[1]?rig.foot[0].getWorldPosition(V()).distanceTo(rig.foot[1].getWorldPosition(V())):null,calfSep:rig.calf?.[0]&&rig.calf?.[1]?rig.calf[0].getWorldPosition(V()).distanceTo(rig.calf[1].getWorldPosition(V())):null,nativeSpeed,ik:{hands:[...error.hands],feet:[...error.feet]},side,timeScale:actions.get(active)?.getEffectiveTimeScale()??null};}
 function footWorld(i,out=V()){return rig.foot?.[i]?rig.foot[i].getWorldPosition(out):null;}
 function palm(i,out=V()){const h=rig.hand[i];if(!h)return head(out);h.getWorldPosition(out);return grip[i]?out.lerp(grip[i].bone.getWorldPosition(A1),.75):out;}
 function head(out=headWorld){return rig.head?rig.head.getWorldPosition(out):out.copy(root.position).add(V(0,1.6,0));}
 update(0);
 return {root,update,trigger,info,head,palm,footWorld,steps,side,idleFoot:i=>idleFeet[i]??[side[i]*hipHalf,0],armLength,hipHeight:hipY,ankleHeight:(ankle[0]+ankle[1])/2,get gripReach(){return grip[0]?grip[0].bone.getWorldPosition(V()).distanceTo(rig.hand[0].getWorldPosition(V())):0;},hasGrip:!!grip[0],grip,get plants(){return !!contact[active]||!actions.has(active)&&(active==='walk'||active==='run');},mixer,rig,meshes,dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);disposeModel(model);root.removeFromParent();},animations:[...new Set(['idle','walk','run','jump','climb','sit','lie','paddle','kick','interact',...actions.keys()])]};
}
