import{$ as e,A as t,B as n,C as r,D as i,E as a,F as o,H as s,I as c,K as l,L as u,M as d,N as f,O as p,P as m,Q as h,R as ee,S as g,T as _,U as v,V as y,W as b,X as x,Y as S,Z as C,_ as w,a as T,b as E,c as D,et as O,f as k,g as te,h as A,i as j,it as M,j as ne,k as re,l as ie,m as N,nt as P,o as F,p as ae,q as I,r as oe,rt as se,s as ce,t as le,tt as L,u as ue,v as de,w as R,x as z,y as fe,z as pe}from"./props-B4M3UByy.js";function me(e){return()=>(e=1664525*e+1013904223>>>0,e/4294967296)}function he(e,t){let n=new I({side:1,depthWrite:!1,uniforms:{uSun:{value:e},uTime:t},vertexShader:`varying vec3 vDirection;
      void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vDirection;uniform vec3 uSun;uniform float uTime;
      ${F}
      vec4 cloud(vec2 p,vec2 center,vec2 radius){
        vec2 q=(p-center)/radius;
        q.y+=.075*sin(q.x*9.+center.x*30.);
        float body=1.-length((q-vec2(0.,-.18))/vec2(1.,.46));
        body=max(body,1.-length((q-vec2(-.48,.02))/vec2(.40,.60)));
        body=max(body,1.-length((q-vec2(-.04,.28))/vec2(.45,.78)));
        body=max(body,1.-length((q-vec2(.45,.05))/vec2(.40,.56)));
        body+=(fbm(q*7.)-.5)*.34;
        float mask=smoothstep(-.12,.19,body);
        float light=smoothstep(-.65,.65,q.y)*.55+fbm(q*6.)*.35;
        vec3 color=mix(vec3(.44,.52,.63),vec3(1.45,1.42,1.30),light);
        return vec4(color,mask*.94);
      }
      void main(){
        vec3 dir=normalize(vDirection);float y=max(0.,dir.y);
        vec3 color=mix(vec3(.012,.105,.36),vec3(.32,.55,.71),exp(-y*9.));
        float s=max(0.,dot(dir,uSun));
        color+=vec3(1.,.67,.3)*pow(s,35.)*.13;
        color+=vec3(8.,6.,3.)*smoothstep(.9998,.99995,s);
        vec2 p=vec2(atan(dir.z,dir.x),asin(dir.y));p.x+=uTime*.0007;
        vec4 c=cloud(p,vec2(-.98,.22),vec2(.19,.063));color=mix(color,c.rgb,c.a);
        c=cloud(p,vec2(-.26,.13),vec2(.16,.036));color=mix(color,c.rgb,c.a);
        c=cloud(p,vec2(-1.65,.31),vec2(.16,.06));color=mix(color,c.rgb,c.a);
        c=cloud(p,vec2(.35,.30),vec2(.21,.065));color=mix(color,c.rgb,c.a);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}),r=new f(new S(6e3,32,16),n);return r.name=`tropical-atmosphere`,r}function B(e,t,n,r,i){let a=Math.sqrt((e/(n*.5))**2+(t/(i*.5))**2),o=Math.max(0,1-a*a)**1.2,s=.68+.22*Math.sin(e*.12+t*.065)+.13*Math.cos(e*.25-t*.12)+.07*Math.sin(e*.63+t*.43);return o*r*s-1.4}function ge(){let t=new r;t.name=`shared-cove-headlands`;let s=me(73019),l=new c,u=new o({color:7368285,roughness:.94,flatShading:!0}),d=new o({color:16777215,roughness:.95}),p=new o({color:7364676,roughness:1}),m=new a(1,2),h=m.attributes.position;for(let e=0;e<h.count;e++){let t=h.getX(e),n=h.getY(e),r=h.getZ(e),i=1+.12*Math.sin(t*19+n*11)*Math.cos(r*17-t*8)+.06*Math.sin(n*31+r*27);h.setXYZ(e,t*i,n*i,r*i)}m.computeVertexNormals(),d.onBeforeCompile=e=>{e.vertexShader=`varying vec3 vLeaf;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
vLeaf=position;`),e.fragmentShader=`varying vec3 vLeaf;
`+F+e.fragmentShader,e.fragmentShader=e.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>
      diffuseColor.rgb*=.68+.65*fbm(vLeaf.xz*22.+vLeaf.y*9.);
    `)};function ee(e){e.onBeforeCompile=e=>{e.vertexShader=`varying vec3 vRock;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
vRock=position;`),e.fragmentShader=`varying vec3 vRock;
`+F+e.fragmentShader,e.fragmentShader=e.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>
        float mineral=fbm(vRock.xz*2.+vRock.y*.6);
        float strata=sin(vRock.y*6.+fbm(vRock.xz*.8)*4.);
        diffuseColor.rgb*=.7+.5*mineral+.065*strata;
      `)}}ee(u);let g=new o({color:5402154,roughness:.85,side:2});function _(n,r,i,a,o){let c=a*.13,l=new ae([new P(n,r,i),new P(n+c*.2,r+a*.5,i),new P(n+c,r+a,i+.3)]),u=new f(new e(l,10,a*.022,6,!1),p);u.castShadow=u.receiveShadow=!0,t.add(u);let d=[];for(let e=0;e<9;e++){let t=o+e*Math.PI*2/9,l=a*(.33+s()*.15),u=(e,o=0,s=0)=>new P(n+c+Math.cos(t)*e*l+Math.sin(t)*o*s,r+a+l*(.45*Math.sin(e*Math.PI)-.26*e)-Math.abs(s)*.18,i+.3+Math.sin(t)*e*l-Math.cos(t)*o*s);for(let e=0;e<13;e++){let t=.08+e*.067,n=l*.19*Math.sin(t*Math.PI);for(let e of[-1,1]){let r=[u(t),u(t+.15,e,n),u(t+.075)];for(let e of r)d.push(e.x,e.y,e.z)}}}let m=new k;m.setAttribute(`position`,new z(d,3)),m.computeVertexNormals();let h=new f(m,g);h.castShadow=h.receiveShadow=!0,t.add(h)}function v(e,r,a,c,p,h){let g=new n(a,p,100,70);g.rotateX(-Math.PI/2);let v=g.attributes.position,y=[],b=new N;for(let e=0;e<v.count;e++)v.setY(e,B(v.getX(e),v.getZ(e),a,c,p));g.computeVertexNormals();for(let e=0;e<v.count;e++){let t=v.getX(e),n=v.getZ(e),r=v.getY(e),i=g.attributes.normal.getY(e),a=r>2.5&&i>.66;b.set(a?2506265:7828837),b.multiplyScalar(.76+.3*s()+.12*Math.sin(t*.7+n*.3)),y.push(b.r,b.g,b.b)}g.setAttribute(`color`,new z(y,3));let x=new o({vertexColors:!0,roughness:1});ee(x);let S=new f(g,x);S.position.set(e,0,r),S.castShadow=S.receiveShadow=!0,t.add(S);let C=h?1250:420,w=new i(m,d,C),T=0;for(;T<C;){let t=(s()-.5)*a*.89,n=(s()-.5)*p*.88,i=B(t,n,a,c,p);if(i<2.4)continue;let o=(h?.65:1.1)+s()*(h?1.35:2);l.position.set(e+t,i+o*.32,r+n),l.scale.set(o,o*(.65+s()*.5),o*(.65+s()*.35)),l.rotation.set(s()*.4,s()*6.28,s()*.4),l.updateMatrix(),w.setMatrixAt(T,l.matrix),b.setHSL(.22+s()*.07,.35+s()*.2,.14+s()*.09),w.setColorAt(T++,b)}w.castShadow=w.receiveShadow=!0,t.add(w);let D=new i(new E(1,0),u,h?50:26);for(let t=0;t<D.count;t++){let n=s()*Math.PI*2,i=.65+s()*.3,o=Math.cos(n)*a*.5*i,u=Math.sin(n)*p*.5*i,d=B(o,u,a,c,p),f=1+s()*2.3;l.position.set(e+o,Math.max(-.3,d),r+u),l.scale.set(f*1.3,f*.8,f),l.rotation.set(s(),s()*6.28,s()),l.updateMatrix(),D.setMatrixAt(t,l.matrix)}if(D.castShadow=D.receiveShadow=!0,t.add(D),h)for(let t=0;t<16;t++){let t=(s()-.5)*a*.8,n=(s()-.5)*p*.75,i=B(t,n,a,c,p);i>1&&_(e+t,i,r+n,5+s()*4,s()*6.28)}}return v(-105,-330,215,49,100,!1),v(215,-560,205,44,110,!1),v(-74,-90,100,27,120,!0),v(74,-26,83,28,125,!0),t}function _e(){let e=new r;e.name=`shared-shells-pebbles-wrack`;let t=me(8231),n=new c,s=new N,l=new S(1,16,8,0,Math.PI*2,0,Math.PI*.5),u=l.attributes.position;for(let e=0;e<u.count;e++){let t=u.getX(e),n=u.getZ(e),r=Math.atan2(n,t),i=1+.075*Math.cos(r*12);u.setXYZ(e,t*i,u.getY(e)*(.82+.18*Math.cos(r*12)),n*i)}l.computeVertexNormals();let d=[l,new a(1,0),new w(.025,.045,1,5)],f=[new o({color:14930868,roughness:.65}),new o({color:8483680,roughness:.82}),new o({color:5325867,roughness:1})];for(let r=0;r<3;r++){let a=new i(d[r],f[r],r===2?160:220);for(let e=0;e<a.count;e++){let i=-38+t()*82,o=r===2?3.5+t()*1.1:2.6+t()*10,c=ce(i)+o,l=.045+t()*.09;n.position.set(i,T(i,c)+.02,c),n.rotation.set(r===2?Math.PI*.5:t()*.3,t()*6.28,t()*.3),r===2?n.scale.set(.5+t(),.16+t()*.38,.5+t()):n.scale.set(l,l*(r===0?.25:.55),l*.7),n.updateMatrix(),a.setMatrixAt(e,n.matrix),s.setScalar(.7+t()*.5),a.setColorAt(e,s)}a.castShadow=!1,a.receiveShadow=!0,e.add(a)}return e}var ve={type:`change`},ye={type:`start`},be={type:`end`},V=new v,xe=new pe,Se=Math.cos(70*ne.DEG2RAD),H=new P,U=2*Math.PI,W={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Ce=1e-6,we=class extends te{constructor(e,n=null){super(e,n),this.state=W.NONE,this.target=new P,this.cursor=new P,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:t.ROTATE,MIDDLE:t.DOLLY,RIGHT:t.PAN},this.touches={ONE:C.ROTATE,TWO:C.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new P,this._lastQuaternion=new y,this._lastTargetPosition=new P,this._quat=new y().setFromUnitVectors(e.up,new P(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new x,this._sphericalDelta=new x,this._scale=1,this._panOffset=new P,this._rotateStart=new L,this._rotateEnd=new L,this._rotateDelta=new L,this._panStart=new L,this._panEnd=new L,this._panDelta=new L,this._dollyStart=new L,this._dollyEnd=new L,this._dollyDelta=new L,this._dollyDirection=new P,this._mouse=new L,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Ee.bind(this),this._onPointerDown=Te.bind(this),this._onPointerUp=De.bind(this),this._onContextMenu=Pe.bind(this),this._onMouseWheel=Ae.bind(this),this._onKeyDown=je.bind(this),this._onTouchStart=Me.bind(this),this._onTouchMove=Ne.bind(this),this._onMouseDown=Oe.bind(this),this._onMouseMove=ke.bind(this),this._interceptControlDown=Fe.bind(this),this._interceptControlUp=Ie.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=W.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),e.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(ve),this.update(),this.state=W.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;H.copy(t).sub(this.target),H.applyQuaternion(this._quat),this._spherical.setFromVector3(H),this.autoRotate&&this.state===W.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=U:n>Math.PI&&(n-=U),r<-Math.PI?r+=U:r>Math.PI&&(r-=U),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(H.setFromSpherical(this._spherical),H.applyQuaternion(this._quatInverse),t.copy(this.target).add(H),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=H.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new P(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new P(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=H.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(V.origin.copy(this.object.position),V.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(V.direction))<Se?this.object.lookAt(this.target):(xe.setFromNormalAndCoplanarPoint(this.object.up,this.target),V.intersectPlane(xe,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>Ce||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Ce||this._lastTargetPosition.distanceToSquared(this.target)>Ce?(this.dispatchEvent(ve),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?U/60/60*this.autoRotateSpeed:U/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){H.setFromMatrixColumn(t,0),H.multiplyScalar(-e),this._panOffset.add(H)}_panUp(e,t){this.screenSpacePanning===!0?H.setFromMatrixColumn(t,1):(H.setFromMatrixColumn(t,0),H.crossVectors(this.object.up,H)),H.multiplyScalar(e),this._panOffset.add(H)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;H.copy(r).sub(this.target);let i=H.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(U*this._rotateDelta.x/t.clientHeight),this._rotateUp(U*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(U*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-U*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(U*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-U*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(U*this._rotateDelta.x/t.clientHeight),this._rotateUp(U*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new L,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Te(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function Ee(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function De(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(be),this.state=W.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function Oe(e){let n;switch(e.button){case 0:n=this.mouseButtons.LEFT;break;case 1:n=this.mouseButtons.MIDDLE;break;case 2:n=this.mouseButtons.RIGHT;break;default:n=-1}switch(n){case t.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=W.DOLLY;break;case t.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=W.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=W.ROTATE}break;case t.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=W.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=W.PAN}break;default:this.state=W.NONE}this.state!==W.NONE&&this.dispatchEvent(ye)}function ke(e){switch(this.state){case W.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case W.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case W.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function Ae(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===W.NONE&&(e.preventDefault(),this.dispatchEvent(ye),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(be))}function je(e){this.enabled!==!1&&this._handleKeyDown(e)}function Me(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case C.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=W.TOUCH_ROTATE;break;case C.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=W.TOUCH_PAN;break;default:this.state=W.NONE}break;case 2:switch(this.touches.TWO){case C.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=W.TOUCH_DOLLY_PAN;break;case C.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=W.TOUCH_DOLLY_ROTATE;break;default:this.state=W.NONE}break;default:this.state=W.NONE}this.state!==W.NONE&&this.dispatchEvent(ye)}function Ne(e){switch(this._trackPointer(e),this.state){case W.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case W.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case W.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case W.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=W.NONE}}function Pe(e){this.enabled!==!1&&e.preventDefault()}function Fe(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function Ie(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var Le={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},G=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Re=new u(-1,1,1,-1,0,1),ze=new class extends k{constructor(){super(),this.setAttribute(`position`,new z([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new z([0,2,0,0,2,0],2))}},Be=class{constructor(e){this._mesh=new f(ze,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Re)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},Ve=class extends G{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof I?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=O.clone(e.uniforms),this.material=new I({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Be(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},He=class extends G{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Ue=class extends G{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},We=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new L);this._width=n.width,this._height=n.height,t=new M(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:R}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ve(Le),this.copyPass.material.blending=0,this.timer=new h}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}He!==void 0&&(r instanceof He?n=!0:r instanceof Ue&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new L);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},Ge=class extends G{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new N}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},Ke={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new N(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`},qe=class e extends G{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new L(256,256):new L(e.x,e.y),this.clearColor=new N(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new M(i,a,{type:R,depthBuffer:!1}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new M(i,a,{type:R,depthBuffer:!1});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new M(i,a,{type:R,depthBuffer:!1});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),a=Math.round(a/2)}let o=Ke;this.highPassUniforms=O.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new I({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let s=[6,10,14,18,22];i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(s[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new L(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new P(1,1,1),new P(1,1,1),new P(1,1,1),new P(1,1,1),new P(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=O.clone(Le.uniforms),this.blendMaterial=new I({uniforms:this.copyUniforms,vertexShader:Le.vertexShader,fragmentShader:Le.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new N,this._oldClearAlpha=1,this._basic=new m,this._fsQuad=new Be(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new L(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);let r=[],i=[];for(let n=1;n<e;n+=2){let a=t[n],o=n+1<e?t[n+1]:0,s=a+o;r.push((n*a+(n+1)*o)/s),i.push(s)}return new I({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new L(.5,.5)},direction:{value:new L(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:i}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new I({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};qe.BlurDirectionX=new L(1,0),qe.BlurDirectionY=new L(0,1);var Je={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`},Ye=class extends G{constructor(){super(),this.isOutputPass=!0,this.uniforms=O.clone(Je.uniforms),this.material=new s({name:Je.name,uniforms:this.uniforms,vertexShader:Je.vertexShader,fragmentShader:Je.fragmentShader}),this._fsQuad=new Be(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},A.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Xe=class extends f{constructor(e,t={}){super(e),this.isWater=!0;let n=this,r=t.textureWidth===void 0?512:t.textureWidth,i=t.textureHeight===void 0?512:t.textureHeight,a=t.clipBias===void 0?0:t.clipBias,o=t.alpha===void 0?1:t.alpha,s=t.time===void 0?0:t.time,c=t.waterNormals===void 0?null:t.waterNormals,l=t.sunDirection===void 0?new P(.70707,.70707,0):t.sunDirection,u=new N(t.sunColor===void 0?16777215:t.sunColor),f=new N(t.waterColor===void 0?8355711:t.waterColor),p=t.eye===void 0?new P(0,0,0):t.eye,m=t.distortionScale===void 0?20:t.distortionScale,h=t.side===void 0?0:t.side,g=t.fog!==void 0&&t.fog,_=new pe,v=new P,y=new P,b=new P,x=new d,S=new P(0,0,-1),C=new se,w=new P,T=new P,E=new se,D=new d,k=new ee,te=new M(r,i,{type:R}),A={name:`MirrorShader`,uniforms:O.merge([ie.fog,ie.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new d},sunColor:{value:new N(8355711)},sunDirection:{value:new P(.70707,.70707,0)},eye:{value:new P},waterColor:{value:new N(5592405)}}]),vertexShader:`
				uniform mat4 textureMatrix;
				uniform float time;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,fragmentShader:`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				void main() {

					#include <logdepthbuf_fragment>
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = 0.02;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), reflectionSample + specularLight, reflectance );
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},j=new I({name:A.name,uniforms:O.clone(A.uniforms),vertexShader:A.vertexShader,fragmentShader:A.fragmentShader,lights:!0,side:h,fog:g});j.uniforms.mirrorSampler.value=te.texture,j.uniforms.textureMatrix.value=D,j.uniforms.alpha.value=o,j.uniforms.time.value=s,j.uniforms.normalSampler.value=c,j.uniforms.sunColor.value=u,j.uniforms.waterColor.value=f,j.uniforms.sunDirection.value=l,j.uniforms.distortionScale.value=m,j.uniforms.eye.value=p,n.material=j,n.onBeforeRender=function(e,t,r){if(y.setFromMatrixPosition(n.matrixWorld),b.setFromMatrixPosition(r.matrixWorld),x.extractRotation(n.matrixWorld),v.set(0,0,1),v.applyMatrix4(x),w.subVectors(y,b),w.dot(v)>0)return;w.reflect(v).negate(),w.add(y),x.extractRotation(r.matrixWorld),S.set(0,0,-1),S.applyMatrix4(x),S.add(b),T.subVectors(y,S),T.reflect(v).negate(),T.add(y),k.position.copy(w),k.up.set(0,1,0),k.up.applyMatrix4(x),k.up.reflect(v),k.lookAt(T),k.far=r.far,k.updateMatrixWorld(),k.projectionMatrix.copy(r.projectionMatrix),D.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),D.multiply(k.projectionMatrix),D.multiply(k.matrixWorldInverse),_.setFromNormalAndCoplanarPoint(v,y),_.applyMatrix4(k.matrixWorldInverse),C.set(_.normal.x,_.normal.y,_.normal.z,_.constant);let i=k.projectionMatrix;E.x=(Math.sign(C.x)+i.elements[8])/i.elements[0],E.y=(Math.sign(C.y)+i.elements[9])/i.elements[5],E.z=-1,E.w=(1+i.elements[10])/i.elements[14],C.multiplyScalar(2/C.dot(E)),i.elements[2]=C.x,i.elements[6]=C.y,i.elements[10]=C.z+1-a,i.elements[14]=C.w,p.setFromMatrixPosition(r.matrixWorld);let o=e.getRenderTarget(),s=e.xr.enabled,c=e.shadowMap.autoUpdate;n.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(te),e.state.buffers.depth.setMask(!0),e.autoClear===!1&&e.clear(),e.render(t,k),n.visible=!0,e.xr.enabled=s,e.shadowMap.autoUpdate=c,e.setRenderTarget(o);let l=r.viewport;l!==void 0&&e.state.viewport(l)}}};function Ze(){let e=new Uint8Array(262144),t=[];for(let e=0;e<32;e++){let n=e=>{let t=Math.sin(e*127.1+311.7)*43758.5453;return t-Math.floor(t)},r=n(e+1)*Math.PI*2,i=3+Math.floor(n(e+70)*38);t.push([Math.round(Math.cos(r)*i),Math.round(Math.sin(r)*i),n(e+33)*6.283,.065/(1+e*.06)])}for(let n=0;n<256;n++)for(let r=0;r<256;r++){let i=0,a=0;for(let[e,o,s,c]of t){let t=Math.cos((r*e+n*o)/256*Math.PI*2+s)*c;i+=t*e/Math.hypot(e,o),a+=t*o/Math.hypot(e,o)}let o=new P(-i,-a,1).normalize(),s=(n*256+r)*4;e[s]=(o.x*.5+.5)*255,e[s+1]=(o.y*.5+.5)*255,e[s+2]=(o.z*.5+.5)*255,e[s+3]=255}let n=new de(e,256,256);return n.wrapS=n.wrapT=b,n.magFilter=p,n.minFilter=re,n.generateMipmaps=!0,n.needsUpdate=!0,n}var Qe=`
vec3 gerstner(vec2 p,vec2 direction,float wavelength,float amplitude,float phase,float t) {
 float k=6.283185/wavelength;
 float f=dot(direction,p)*k-sqrt(9.81*k)*t+phase;
 return vec3(direction.x*amplitude*.55*cos(f),amplitude*sin(f),direction.y*amplitude*.55*cos(f));
}
vec3 seaDisplacement(vec2 p,float t) {
 float edge=shore(p.x)-p.y;
 float lagoon=mix(.45,1.,smoothstep(7.,65.,edge))*smoothstep(.0,5.,edge);
 vec3 d=gerstner(p,normalize(vec2(.18,1.)),19.,.28,.4,t);
 d+=gerstner(p,normalize(vec2(-.36,1.)),11.3,.15,2.1,t);
 d+=gerstner(p,normalize(vec2(.71,.71)),6.7,.075,1.5,t);
 d+=gerstner(p,normalize(vec2(-.85,.52)),3.4,.035,3.2,t);
 d*=lagoon*(1.-smoothstep(100.,450.,edge));
 float phase=breakerPhase(p,t);
 float breaker=pow(.5+.5*cos(phase+.24*sin(phase)),3.);
 float surf=smoothstep(-1.5,1.5,edge)*(1.-smoothstep(9.,19.,edge));
 d.y+=(breaker*.76-.12)*surf*(.75+.25*sin(p.x*.31+t*.16));
 d.y+=(noise2(p*1.7+vec2(t*.21,-t*.38))-.5)*.12*breaker*surf;
 d.z-=sin(phase)*.19*surf;
 return d;
}
float seaHeight(vec2 p,float t) {
 float edge=shore(p.x)-p.y;
 float h=seaDisplacement(p,t).y;
 float coverage=smoothstep(0.,1.4,washFront(p.x,t)-shoreDistance(p));
 // Centimetre-thick swash film climbs the ORIGINAL terrain; it never reshapes it.
 float film=bottom(p)+.018+.065*coverage;
 return mix(max(h,film),h,smoothstep(-.5,2.8,edge));
}
`;function $e(e,t){let r=new n(1,1,420,320),i=r.attributes.position;for(let e=0;e<i.count;e++){let t=i.getX(e)*2,n=.5-i.getY(e),r=Math.sign(t)*(Math.abs(t)*80+Math.abs(t)**7*3500),a=-5+n*65+n**5*3500,o=ce(ne.clamp(r,-130,130));i.setXYZ(e,r,a-o,0)}let a=r.index.array;for(let e=0;e<a.length;e+=3){let t=a[e];a[e]=a[e+2],a[e+2]=t}r.computeVertexNormals(),r.computeBoundingSphere();let o=new Xe(r,{textureWidth:768,textureHeight:768,waterNormals:Ze(),sunDirection:e,sunColor:16774366,waterColor:555659,distortionScale:1.4,fog:!0});o.rotation.x=-Math.PI/2,o.name=`tropical-water`,o.frustumCulled=!1;let s=o.material;return s.uniforms.time=t,s.transparent=!0,s.vertexShader=s.vertexShader.replace(`void main() {`,F+D+Qe+`void main() {
 vec3 displaced=position;
 vec2 wp=(modelMatrix*vec4(position,1.)).xz;
 vec3 displacement=seaDisplacement(wp,time);
 displaced.x+=displacement.x;displaced.y-=displacement.z;
 wp+=displacement.xz;
 displaced.z=seaHeight(wp,time);
 `).replaceAll(`vec4( position, 1.0 )`,`vec4( displaced, 1.0 )`),s.fragmentShader=`
 uniform sampler2D mirrorSampler,normalSampler;
 uniform float time,distortionScale;
 uniform vec3 sunDirection,sunColor,eye;
 varying vec4 mirrorCoord,worldPosition;
 #include <common>
 #include <fog_pars_fragment>
 ${F}
 ${D}
 ${Qe}
 vec2 slopes(vec2 p,float t,float dist) {
  mat2 r=mat2(.8,-.6,.6,.8);
  vec2 a=texture2D(normalSampler,p/17.+vec2(t*.011,-t*.007)).xy*2.-1.;
  vec2 b=texture2D(normalSampler,r*p/9.73+vec2(-t*.018,t*.009)).xy*2.-1.;
  vec2 c=texture2D(normalSampler,r*r*p/4.31+vec2(t*.021,t*.015)).xy*2.-1.;
  vec2 d=texture2D(normalSampler,r*p/1.87-vec2(t*.031,t*.023)).xy*2.-1.;
  return a*.55+r*b*.32+r*r*c*.20*(1.-smoothstep(25.,130.,dist))+r*d*.09*(1.-smoothstep(7.,40.,dist));
 }
 void main() {
  vec2 p=worldPosition.xz;
  float d=shoreDistance(p),front=washFront(p.x,time),behind=front-d;
  if(behind<0.)discard;
  float depth=max(.005,worldPosition.y-bottom(p));
  float dist=length(eye-worldPosition.xyz);
  vec3 view=normalize(eye-worldPosition.xyz);
  float eps=.12;
  vec2 slope=vec2(seaHeight(p+vec2(eps,0),time)-seaHeight(p-vec2(eps,0),time),seaHeight(p+vec2(0,eps),time)-seaHeight(p-vec2(0,eps),time))/(2.*eps);
  vec2 micro=slopes(p,time,dist)*smoothstep(.015,.35,depth);
  vec3 n=normalize(vec3(-slope.x+micro.x,1.,-slope.y+micro.y));
  float ndv=clamp(dot(n,view),0.,1.);
  float fresnel=.0204+.9796*pow(1.-ndv,5.);
  vec2 uv=mirrorCoord.xy/mirrorCoord.w+n.xz*.022;
  vec3 reflected=texture2D(mirrorSampler,uv).rgb*.5;
  reflected+=texture2D(mirrorSampler,uv+vec2(.004,.001)).rgb*.25;
  reflected+=texture2D(mirrorSampler,uv-vec2(.004,.001)).rgb*.25;
  // Refracted ray intersects the analytic, unchanged sand shelf.
  vec3 ray=refract(-view,n,1./1.333);
  vec2 floorP=p+ray.xz*min(18.,depth/max(.22,-ray.y));
  float rayDepth=max(.01,worldPosition.y-bottom(floorP));
  float opticalPath=rayDepth/max(.35,-ray.y);
  float bottomRipple=sandPattern(floorP);
  float resolved=1.-smoothstep(.6,3.,fwidth(floorP.y*17.+floorP.x*3.2));
  vec3 sand=vec3(.60,.49,.31)*(.88+.16*fbm(floorP*.31)+.055*bottomRipple*resolved+.024*(noise2(floorP*85.)-.5)*resolved);
  sand*=1.+caustic(floorP,time)*.28*exp(-rayDepth*.38)*smoothstep(.04,.35,rayDepth)*resolved;
  vec3 transmission=exp(-vec3(.34,.075,.045)*opticalPath);
  vec3 scatter=vec3(.008,.20,.25);
  vec3 body=sand*transmission+scatter*(1.-transmission);
  body=mix(body,vec3(.006,.045,.105),1.-exp(-opticalPath*.025));
  vec3 color=mix(body,min(reflected,vec3(1.2)),clamp(fresnel,.02,.94));
  vec3 halfVector=normalize(view+sunDirection);
  float glitter=pow(max(0.,dot(n,halfVector)),950.);
  color+=sunColor*glitter*.6;
  float crest=pow(.5+.5*cos(breakerPhase(p,time)),5.);
  color+=vec3(.015,.10,.075)*crest*smoothstep(.3,2.,depth)*pow(max(0.,dot(view,-sunDirection)),2.);
  // Turbulent foam: broad spilling crest + lace sheet + dissipating backwash.
  vec2 advect=p+vec2(.12*sin(p.y*.7+time*.4),-time*.46);
  float cells=fbm(advect*5.1+fbm(advect*1.3)*1.6);
  float lace=smoothstep(.43,.64,cells);
  float foamPatch=smoothstep(.26,.62,fbm(p*.65+vec2(0.,time*.12)));
  // Small holes surrounded by thin, broken bubble walls, with anti-aliased edges.
  vec2 q=advect*12.+vec2(fbm(advect*3.7),fbm(advect*3.1+4.))*3.2;
  vec2 cell=floor(q),f=fract(q);
  float nearest=8.,second=8.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++) {
   vec2 g=vec2(float(x),float(y));
   vec2 jitter=vec2(hash21(cell+g),hash21(cell+g+31.));
   float r=length(g+.18+jitter*.64-f);
   if(r<nearest){second=nearest;nearest=r;}else{second=min(second,r);}
  }
  float wall=second-nearest;
  float aa=max(.018,fwidth(wall));
  float bubbles=(1.-smoothstep(.035,.035+aa,wall))*smoothstep(.27,.48,noise2(advect*31.))*(.3+.7*lace);
  float foamTexture=mix(bubbles,lace,smoothstep(.45,.78,cells));
  foamTexture*=.7+.3*noise2(advect*73.);
  float breakZone=smoothstep(.5,2.5,-d)*(1.-smoothstep(8.,14.,-d));
  float foam=crest*breakZone*(.25+.75*foamTexture)*(.3+.7*foamPatch);
  float edgeFoam=(1.-smoothstep(.0,.45,behind))*(.18+.82*foamTexture);
  float sheet=(1.-smoothstep(.3,3.8,behind))*smoothstep(-2.,.4,d)*foamTexture*.38;
  foam=max(foam,max(edgeFoam,sheet));
  vec3 foamColor=vec3(.86,.92,.89)*(.86+.14*noise2(p*22.));
  color=mix(color,foamColor,clamp(foam,0.,.92));
  gl_FragColor=vec4(color,smoothstep(0.,.16,behind));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
 }`,o.add(et(t,e)),o}function et(e,t){let n=[],r=[];for(let e=0;e<3;e++){let t=n.length/3;for(let i=0;i<=560;i++)for(let a=0;a<=8;a++)if(n.push(-80+i/560*160,a/8,e),i<560&&a<8){let e=t+i*9+a,n=e+8+1;r.push(e,n,e+1,n,n+1,e+1)}}let i=new k;i.setAttribute(`position`,new z(n,3)),i.setIndex(r);let a=new I({transparent:!0,depthWrite:!1,side:2,fog:!0,uniforms:{time:e,sunDirection:{value:t},...O.clone(ie.fog)},vertexShader:`
   uniform float time;
   varying vec3 vFoamWorld;
   varying float vAcross,vStrength;
   #include <common>
   #include <fog_pars_vertex>
   ${F}
   ${D}
   ${Qe}
   void main(){
    float x=position.x,u=position.y;
    float edge=((floor(time/8.)+position.z)*6.283185-time*.785398)/.62;
    vec2 p=vec2(x,shore(x)-edge);
    for(int i=0;i<3;i++) {
     float warp=.42*sin(x*.13)+.16*sin(x*.47)+.11*sin(p.y*.38+x*.27);
     p.y=shore(x)-edge+warp/.62;
    }
    float e=shore(x)-p.y;
    float strength=smoothstep(.8,2.8,e)*(1.-smoothstep(7.,12.,e));
    float height=seaHeight(p,time);
    float tumble=.5+.5*noise2(vec2(x*2.8,time*.9));
    vec3 world=vec3(p.x,height+.012+strength*(.11*sin(u*3.14159)*tumble-.10*u*u),p.y+strength*(.15*sin(u*3.14159)+u*.35));
    vFoamWorld=world;vAcross=u;vStrength=strength;
    vec4 mvPosition=viewMatrix*vec4(world,1.);gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
   }`,fragmentShader:`
   uniform float time;uniform vec3 sunDirection;
   varying vec3 vFoamWorld;varying float vAcross,vStrength;
   #include <common>
   #include <fog_pars_fragment>
   ${F}
   void main(){
    vec2 p=vFoamWorld.xz+vec2(0.,-time*.45);
    float froth=fbm(p*12.);
    float clumps=smoothstep(.28,.62,noise2(p*1.5+vec2(time*.1,0.)));
    float alpha=vStrength*pow(max(0.,sin(vAcross*3.14159)),.6)*clumps*smoothstep(.28,.56,froth)*.87;
    if(alpha<.015)discard;
    vec3 n=normalize(cross(dFdx(vFoamWorld),dFdy(vFoamWorld)));if(n.y<0.)n=-n;
    vec3 color=vec3(.83,.90,.86)*(.72+.28*max(0.,dot(n,sunDirection)));
    gl_FragColor=vec4(color,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
   }`}),o=new f(i,a);return o.name=`spilling-wave-lips`,o.frustumCulled=!1,o.renderOrder=1,o}var K=new URLSearchParams(location.search),tt=K.get(`group`)||`A`,q=new l;q.fog=new g(8302275,28e-5);var J=new ue({antialias:!0,preserveDrawingBuffer:!0});J.setPixelRatio(Math.min(devicePixelRatio,1.5)),J.setSize(innerWidth,innerHeight),J.toneMapping=4,J.toneMappingExposure=.9,J.shadowMap.enabled=!0,J.shadowMap.type=2,document.body.prepend(J.domElement);var Y=new ee(55,innerWidth/innerHeight,.1,9e3),nt=oe.cameras[K.get(`cam`)]||oe.cameras.wide;Y.position.fromArray(nt.pos),Y.lookAt(...nt.target);var X;K.has(`cam`)||(X=new we(Y,J.domElement),X.target.fromArray(nt.target),X.enableDamping=!0,X.maxPolarAngle=Math.PI*.49,X.minDistance=3,X.maxDistance=180);var rt=new P(.55,.38,-.74).normalize(),Z={value:0};q.add(he(rt,Z)),q.add(new _(11917813,9138253,1.45));var Q=new fe(16769712,3.2);Q.position.copy(rt).multiplyScalar(110),Q.castShadow=!0,Q.shadow.mapSize.set(2048,2048),Object.assign(Q.shadow.camera,{left:-95,right:95,top:95,bottom:-95,near:1,far:280}),Q.shadow.bias=-2e-4,Q.shadow.normalBias=.045,q.add(Q),q.add(j(Z,rt)),q.add(ge()),q.add(_e());var it=$e(rt,Z);q.add(it);var $=new We(J);$.addPass(new Ge(q,Y)),$.addPass(new qe(new L(innerWidth,innerHeight),.055,.4,1.4)),$.addPass(new Ye),window.addEventListener(`resize`,()=>{Y.aspect=innerWidth/innerHeight,Y.updateProjectionMatrix(),J.setSize(innerWidth,innerHeight),$.setSize(innerWidth,innerHeight)});var at=K.has(`time`)?Number(K.get(`time`)):null,ot=performance.now();window.__SCENE__={scene:q,camera:Y,renderer:J,water:it,time:Z,config:oe,controls:X,group:tt};function st(){return Number.isFinite(window.__TIME__)?window.__TIME__:at??(performance.now()-ot)/1e3}window.__setTime=e=>{at=e,window.__TIME__=e,Z.value=st(),$.render()},window.__SCENE__.render=()=>{Z.value=st(),$.render()};function ct(){requestAnimationFrame(ct),Z.value=st(),X?.update(),$.render()}try{let e=await le(tt);q.add(e),window.__SCENE__.props=e,document.querySelector(`#status`).textContent=``,ct(),window.__READY__=!0}catch(e){document.querySelector(`#status`).textContent=e.message,console.error(e)}