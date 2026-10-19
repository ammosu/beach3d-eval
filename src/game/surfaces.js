import * as T from 'three';
import {groundHeight} from '../terrain.js';
const down=new T.Vector3(0,-1,0),ray=new T.Raycaster(),normal=new T.Vector3();

// Search actual triangles, including lower surfaces hidden below a roof/canopy.
export function surfacesAt(root,x,z,box=new T.Box3().setFromObject(root)){
 root.updateWorldMatrix(true,true);ray.set(new T.Vector3(x,box.max.y+1,z),down);ray.far=box.max.y-box.min.y+3;
 return ray.intersectObject(root,true).filter(hit=>{if(!hit.face)return false;normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);return normal.y>.65;});
}
export function findSurface(root,kind,group,defaultPoint){
 const box=root?.children.length?new T.Box3().setFromObject(root):null;
 const fallback=()=>({point:new T.Vector3(defaultPoint.x,groundHeight(defaultPoint.x,defaultPoint.z),defaultPoint.z),box,kind:'sand',yaw:Math.PI,real:false});
 if(!box||box.isEmpty())return fallback();
 const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 if(kind==='umbrella'&&group==='C'){const f=fallback();f.point.set(center.x+Math.min(.65,size.x*.2),groundHeight(center.x+Math.min(.65,size.x*.2),center.z),center.z);return f;}
 const candidates=[];
 const nx=Math.min(32,Math.max(12,Math.ceil(size.x/.13))),nz=Math.min(32,Math.max(12,Math.ceil(size.z/.13)));
 for(let ix=1;ix<nx;ix++)for(let iz=1;iz<nz;iz++){
  const x=box.min.x+size.x*ix/nx,z=box.min.z+size.z*iz/nz;
  const column=surfacesAt(root,x,z,box);
  for(const h of column){
   const y=h.point.y-box.min.y;
   const valid=kind==='umbrella'?y>.15&&y<Math.min(1.0,size.y*.47):kind==='lifeguard'?y>size.y*.24&&y<size.y*.74:y>size.y*.10&&y<size.y*.78;
   if(valid)candidates.push({x,y:h.point.y,z,clear:!column.some(other=>other.point.y>h.point.y+.2&&other.point.y<h.point.y+1.83)});
  }
 }
 if(!candidates.length)return fallback();
 // Dominant horizontal height rejects rungs, arm rests and narrow railings.
 const bands=new Map();for(const p of candidates){const k=Math.round(p.y/.065);if(!bands.has(k))bands.set(k,[]);bands.get(k).push(p);}
 const ranked=[...bands.values()].sort((a,b)=>b.length-a.length),band=ranked[0];
 let best=null,bestScore=-Infinity;
 for(const p of band){
  let support=0;for(const q of band){if(Math.abs(p.x-q.x)<.24&&Math.abs(p.z-q.z)<.32)support++;}
  const score=support*3-(kind==='lifeguard'&&!p.clear?1000:0)-Math.hypot(p.x-center.x,p.z-center.z)*(kind==='umbrella'?.2:2);
  if(score>bestScore){bestScore=score;best=p;}
 }
 // Fit the long direction of the local seat patch, ignoring the other lounger.
 const local=band.filter(p=>Math.hypot(p.x-best.x,p.z-best.z)<.85),mx=local.reduce((n,p)=>n+p.x,0)/local.length,mz=local.reduce((n,p)=>n+p.z,0)/local.length;let xx=0,zz=0,xz=0;
 for(const p of local){xx+=(p.x-mx)**2;zz+=(p.z-mz)**2;xz+=(p.x-mx)*(p.z-mz);}
 const angle=.5*Math.atan2(2*xz,xx-zz);let yaw=Math.PI/2-angle;
 if(kind==='umbrella'){
  const height=sign=>{let peak=best.y;for(const distance of [.55,.75,.95])for(const hit of surfacesAt(root,best.x+Math.sin(yaw)*distance*sign,best.z+Math.cos(yaw)*distance*sign,box)){if(hit.point.y<box.min.y+1.3)peak=Math.max(peak,hit.point.y);}return peak;};
  // Local -Z is the head end; point it toward the raised backrest.
  if(height(1)>height(-1))yaw+=Math.PI;
  const dx=Math.sin(yaw),dz=Math.cos(yaw),samples=[];
  for(let along=-1.5;along<=1.5;along+=.05)for(const across of [-.08,0,.08]){
   const x=best.x+dx*along+dz*across,z=best.z+dz*along-dx*across;
   for(const hit of surfacesAt(root,x,z,box))if(hit.point.y>best.y-.08&&hit.point.y<best.y+.65)samples.push({point:hit.point,along,across});
  }
  if(samples.length){const centre=(Math.min(...samples.map(p=>p.along))+Math.max(...samples.map(p=>p.along)))/2-.125;
   const seats=samples.filter(p=>Math.abs(p.point.y-best.y)<.12);seats.sort((a,b)=>Math.hypot(a.along-centre,a.across)-Math.hypot(b.along-centre,b.across));if(seats.length)best=seats[0].point;
  }
 }
 return {point:new T.Vector3(best.x,best.y+.015,best.z),box,kind:kind==='umbrella'?'lounger':kind==='lifeguard'?'deck':'seat',yaw:kind==='umbrella'?yaw:Math.PI,real:true};
}
