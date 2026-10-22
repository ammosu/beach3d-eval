import * as T from 'three';
export function createBirds(scene,clock){
 const root=new T.Group();root.name='extra-birds';scene.add(root);const birds=[];
 const bodyGeo=new T.SphereGeometry(1,8,5),white=new T.MeshStandardMaterial({color:0xf2efe4,roughness:.85}),beakMat=new T.MeshStandardMaterial({color:0xb9a078});
 const wingGeo=new T.BufferGeometry();wingGeo.setAttribute('position',new T.Float32BufferAttribute([-.09,0,0,-.44,.035,-.04,-.78,-.03,-.22,-.08,0,-.14,-.44,.035,-.04,-.09,0,0,.09,0,0,.78,-.03,-.22,.44,.035,-.04,.08,0,-.14,.09,0,0,.44,.035,-.04],3));wingGeo.computeVertexNormals();
 const wingMat=new T.MeshStandardMaterial({color:0xf7f4e9,side:T.DoubleSide,roughness:.85});
 wingMat.onBeforeCompile=s=>{s.uniforms.birdTime=clock;s.vertexShader='uniform float birdTime;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float phase=birdTime+modelMatrix[3].x*.05;float flap=pow(max(0.,sin(phase*.19)),14.);transformed.y+=abs(position.x)*(.12*sin(phase*.6)+.4*flap*sin(phase*7.));`);};
 for(let i=0;i<4;i++){const bird=new T.Group(),body=new T.Mesh(bodyGeo,white);body.scale.set(.085,.08,.28);bird.add(body);const head=new T.Mesh(bodyGeo,white);head.scale.set(.065,.07,.09);head.position.set(0,.055,.25);bird.add(head);const beak=new T.Mesh(new T.ConeGeometry(.025,.12,5),beakMat);beak.rotation.x=Math.PI/2;beak.position.set(0,.045,.35);bird.add(beak);bird.add(new T.Mesh(wingGeo,wingMat));root.add(bird);birds.push(bird);}
 // B/C bird (head +x, back up, length 1) turned head to +z; fit .6 m long, 1.4 m wingspan. Wings are fixed, so it banks a little instead of flapping.
 const procedural=birds.map(b=>[...b.children]);let model=null;
 function setGroup(m){model=m;birds.forEach((b,i)=>{if(b.userData.model){b.remove(b.userData.model);b.userData.model=null;}for(const o of procedural[i])o.visible=!m;if(!m)return;const g=m.clone(),box=new T.Box3().setFromObject(g),size=box.getSize(new T.Vector3()),s=Math.min(.6/size.x,1.4/size.z);g.scale.setScalar(s);g.rotation.y=-Math.PI/2;b.add(g);b.userData.model=g;});}
 function pose(i,t,out){const a=t*(.035+i*.006)+i*1.7,r=20+i*9;out.set(-8+Math.cos(a)*r,18+i*5+Math.sin(a*2)*2,-62+Math.sin(a)*(r*.7));if(i===0)out.y-=16*Math.pow(Math.max(0,Math.sin(a)),8);return out;}
 const next=new T.Vector3();return {count:birds.length,setGroup,update(t){birds.forEach((b,i)=>{pose(i,t,b.position);pose(i,t+.05,next);b.lookAt(next);if(model)b.rotateZ(.12*Math.sin(t*.7+i*1.9));});}};
}
