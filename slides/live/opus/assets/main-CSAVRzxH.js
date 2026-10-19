import{$ as e,A as t,B as n,D as r,E as i,F as a,G as o,H as s,I as c,J as l,K as u,L as d,M as f,O as p,P as m,Q as h,R as g,S as _,T as v,U as y,V as b,W as x,X as S,Z as ee,_ as te,_t as C,a as w,at as T,b as E,c as D,ct as O,d as k,dt as A,f as j,ft as M,g as N,gt as P,h as ne,ht as re,i as ie,it as ae,j as oe,k as se,l as ce,m as le,mt as F,n as ue,nt as de,p as fe,pt as pe,rt as me,s as he,st as ge,tt as _e,u as ve,ut as ye,v as be,vt as xe,w as I,x as Se,yt as L,z as Ce}from"./props-CusrTcRx.js";var we={type:`change`},Te={type:`start`},Ee={type:`end`},De=new ae,Oe=new h,ke=Math.cos(70*y.DEG2RAD),R=new C,z=2*Math.PI,B={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Ae=1e-6,je=class extends i{constructor(e,t=null){super(e,t),this.state=B.NONE,this.target=new C,this.cursor=new C,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:s.ROTATE,MIDDLE:s.DOLLY,RIGHT:s.PAN},this.touches={ONE:M.ROTATE,TWO:M.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new C,this._lastQuaternion=new _e,this._lastTargetPosition=new C,this._quat=new _e().setFromUnitVectors(e.up,new C(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new A,this._sphericalDelta=new A,this._scale=1,this._panOffset=new C,this._rotateStart=new P,this._rotateEnd=new P,this._rotateDelta=new P,this._panStart=new P,this._panEnd=new P,this._panDelta=new P,this._dollyStart=new P,this._dollyEnd=new P,this._dollyDelta=new P,this._dollyDirection=new C,this._mouse=new P,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Ne.bind(this),this._onPointerDown=Me.bind(this),this._onPointerUp=Pe.bind(this),this._onContextMenu=Ve.bind(this),this._onMouseWheel=Le.bind(this),this._onKeyDown=Re.bind(this),this._onTouchStart=ze.bind(this),this._onTouchMove=Be.bind(this),this._onMouseDown=Fe.bind(this),this._onMouseMove=Ie.bind(this),this._interceptControlDown=He.bind(this),this._interceptControlUp=Ue.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=B.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),e.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(we),this.update(),this.state=B.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;R.copy(t).sub(this.target),R.applyQuaternion(this._quat),this._spherical.setFromVector3(R),this.autoRotate&&this.state===B.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=z:n>Math.PI&&(n-=z),r<-Math.PI?r+=z:r>Math.PI&&(r-=z),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(R.setFromSpherical(this._spherical),R.applyQuaternion(this._quatInverse),t.copy(this.target).add(R),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=R.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new C(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new C(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=R.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(De.origin.copy(this.object.position),De.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(De.direction))<ke?this.object.lookAt(this.target):(Oe.setFromNormalAndCoplanarPoint(this.object.up,this.target),De.intersectPlane(Oe,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>Ae||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Ae||this._lastTargetPosition.distanceToSquared(this.target)>Ae?(this.dispatchEvent(we),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?z/60/60*this.autoRotateSpeed:z/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){R.setFromMatrixColumn(t,0),R.multiplyScalar(-e),this._panOffset.add(R)}_panUp(e,t){this.screenSpacePanning===!0?R.setFromMatrixColumn(t,1):(R.setFromMatrixColumn(t,0),R.crossVectors(this.object.up,R)),R.multiplyScalar(e),this._panOffset.add(R)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;R.copy(r).sub(this.target);let i=R.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(z*this._rotateDelta.x/t.clientHeight),this._rotateUp(z*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(z*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-z*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(z*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-z*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(z*this._rotateDelta.x/t.clientHeight),this._rotateUp(z*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new P,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Me(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function Ne(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function Pe(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(Ee),this.state=B.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function Fe(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case s.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=B.DOLLY;break;case s.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=B.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=B.ROTATE}break;case s.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=B.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=B.PAN}break;default:this.state=B.NONE}this.state!==B.NONE&&this.dispatchEvent(Te)}function Ie(e){switch(this.state){case B.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case B.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case B.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function Le(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===B.NONE&&(e.preventDefault(),this.dispatchEvent(Te),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(Ee))}function Re(e){this.enabled!==!1&&this._handleKeyDown(e)}function ze(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case M.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=B.TOUCH_ROTATE;break;case M.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=B.TOUCH_PAN;break;default:this.state=B.NONE}break;case 2:switch(this.touches.TWO){case M.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=B.TOUCH_DOLLY_PAN;break;case M.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=B.TOUCH_DOLLY_ROTATE;break;default:this.state=B.NONE}break;default:this.state=B.NONE}this.state!==B.NONE&&this.dispatchEvent(Te)}function Be(e){switch(this._trackPointer(e),this.state){case B.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case B.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case B.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case B.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=B.NONE}}function Ve(e){this.enabled!==!1&&e.preventDefault()}function He(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function Ue(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var We=class e extends o{constructor(){let t=e.SkyShader,n=new O({name:t.name,uniforms:F.clone(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:1,depthWrite:!1});super(new E(1,1,1),n),this.isSky=!0}};We.SkyShader={name:`SkyShader`,uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new C},cloudScale:{value:2e-4},cloudSpeed:{value:2e-5},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calculation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( vSunDirection.y );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorption + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform float cloudScale;
		uniform float cloudSpeed;
		uniform float cloudCoverage;
		uniform float cloudDensity;
		uniform float cloudElevation;
		uniform float showSunDisc;
		uniform float time;

		// gradient at a lattice corner; sinless hash so every GPU produces the same clouds
		vec2 gradient( vec2 i ) {
			vec3 p = fract( i.xyx * vec3( 0.1031, 0.1030, 0.0973 ) );
			p += dot( p, p.yzx + 33.33 );
			return fract( ( p.xx + p.yz ) * p.zy ) * 2.0 - 1.0;
		}

		// 2D gradient noise: isotropic lobes like Perlin at value-noise cost
		float noise( vec2 p ) {
			vec2 i = floor( p );
			vec2 f = fract( p );
			vec2 u = f * f * f * ( f * ( f * 6.0 - 15.0 ) + 10.0 ); // quintic fade
			float a = dot( gradient( i ), f );
			float b = dot( gradient( i + vec2( 1.0, 0.0 ) ), f - vec2( 1.0, 0.0 ) );
			float c = dot( gradient( i + vec2( 0.0, 1.0 ) ), f - vec2( 0.0, 1.0 ) );
			float d = dot( gradient( i + vec2( 1.0, 1.0 ) ), f - vec2( 1.0, 1.0 ) );
			return mix( mix( a, b, u.x ), mix( c, d, u.x ), u.y ) * 1.6; // ~[-1,1]
		}

		// fbm; per-octave drift makes clouds billow instead of scrolling as a rigid stamp
		float fbm( vec2 p, float drift ) {
			float result = 0.0;
			float amplitude = 1.0;
			for ( int i = 0; i < 4; i ++ ) {
				result += amplitude * noise( p );
				amplitude *= 0.5;
				p = p * 2.0 + drift;
			}
			return result;
		}

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, direction.y ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - vSunDirection.y, 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisc = clamp( ( cosTheta - sunAngularDiameterCos ) * 50000.0, 0.0, 1.0 ) * showSunDisc;
			vec3 sundiscColor = ( 760.0 * sundisc ) * min( vSunE * Fex, 80.0 );

			vec3 texColor = ( Lin + L0 ) * 0.04 + sundiscColor + vec3( 0.0, 0.0003, 0.00075 );

			// Clouds
			if ( direction.y > 0.0 && cloudCoverage > 0.0 ) {

				// Project to cloud plane (higher elevation = clouds appear lower/closer)
				float elevation = mix( 1.0, 0.1, cloudElevation );
				vec2 cloudUV = direction.xz / ( direction.y * elevation );
				cloudUV *= cloudScale;
				cloudUV += time * cloudSpeed;

				// Cloud density field
				float evolve = time * cloudSpeed * 300.0;
				float cloudNoise = clamp( fbm( cloudUV * 1000.0, evolve ) * 0.7 + 0.5, 0.0, 1.0 );

				// Large-scale coverage variation: clear gaps next to dense banks
				float region = noise( cloudUV * 300.0 ) * 0.37 + 0.5;
				float cov = clamp( cloudCoverage + ( region - 0.5 ) * 0.6, 0.0, 1.0 );

				// Carve clouds where noise rises above the coverage level
				float threshold = 1.0 - cov;
				float cloudMask = smoothstep( threshold, threshold + 0.3, cloudNoise );

				// Fade clouds near horizon (adjusted by elevation)
				float horizonFade = smoothstep( 0.0, 0.03 + 0.06 * cloudElevation, direction.y );
				cloudMask *= horizonFade;

				// Cloud lighting from the sky's own radiance
				float dayFactor = smoothstep( -0.08, 0.3, vSunDirection.y );
				vec3 sunColor = vSunE * Fex * 0.22 * 0.04; // 0.22 ~ albedo/pi, 0.04 = exposure; the aerial composite adds the eye-leg extinction
				vec3 skyAmbient = Lin * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

				// Beer-powder self-shadow from the sampled density
				float depth = max( 0.0, cloudNoise - threshold );
				float beer = exp( depth * -4.0 );
				float powder = 1.0 - beer * beer; // beer*beer == exp(-8*depth)
				float shade = mix( 0.45, 1.0, clamp( beer * powder * 2.6, 0.0, 1.0 ) ); // 2.6 = 1/0.385, normalizes beer*powder peak to 1

				// Henyey-Greenstein forward lobe ( g = 0.7 ): silver lining on rims toward the sun
				float silver = clamp( 0.51 / pow( 1.49 - cosTheta * 1.4, 1.5 ), 0.0, 3.0 ); // 0.51=1-g^2, 1.49=1+g^2, 1.4=2g
				float edge = cloudMask * ( 1.0 - cloudMask ) * 4.0;

				vec3 cloudColor = skyAmbient + sunColor * shade;
				cloudColor += sunColor * silver * edge * 0.6;
				cloudColor *= max( dayFactor, 0.03 );

				// Cloud opacity via Beer's law: density sets how solid the clouds get
				float alpha = ( 1.0 - exp( depth * cloudDensity * -12.0 ) ) * horizonFade;

				// Occlude the sun disc/glow behind opaque cloud
				texColor -= L0 * 0.04 * alpha;

				// Composite through the atmosphere so distant clouds dissolve into haze
				vec3 cloudAerial = mix( texColor, cloudColor, Fex );
				texColor = mix( texColor, cloudAerial, alpha );

			}

			gl_FragColor = vec4( texColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};var Ge={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`},V=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Ke=new S(-1,1,1,-1,0,1),qe=new class extends _{constructor(){super(),this.setAttribute(`position`,new f([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new f([0,2,0,0,2,0],2))}},Je=class{constructor(e){this._mesh=new o(qe,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ke)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},Ye=class extends V{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof O?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=F.clone(e.uniforms),this.material=new O({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Je(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Xe=class extends V{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Ze=class extends V{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},Qe=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new P);this._width=n.width,this._height=n.height,t=new L(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:c}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ye(Ge),this.copyPass.material.blending=0,this.timer=new pe}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}Xe!==void 0&&(r instanceof Xe?n=!0:r instanceof Ze&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new P);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},$e=class extends V{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new I}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},et={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new I(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`},tt=class e extends V{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new P(256,256):new P(e.x,e.y),this.clearColor=new I(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new L(i,a,{type:c,depthBuffer:!1}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new L(i,a,{type:c,depthBuffer:!1});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new L(i,a,{type:c,depthBuffer:!1});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),a=Math.round(a/2)}let o=et;this.highPassUniforms=F.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new O({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let s=[6,10,14,18,22];i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(s[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new P(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let l=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=l,this.bloomTintColors=[new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=F.clone(Ge.uniforms),this.blendMaterial=new O({uniforms:this.copyUniforms,vertexShader:Ge.vertexShader,fragmentShader:Ge.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new I,this._oldClearAlpha=1,this._basic=new u,this._fsQuad=new Je(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new P(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);let r=[],i=[];for(let n=1;n<e;n+=2){let a=t[n],o=n+1<e?t[n+1]:0,s=a+o;r.push((n*a+(n+1)*o)/s),i.push(s)}return new O({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new P(.5,.5)},direction:{value:new P(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:i}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new O({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}};tt.BlurDirectionX=new P(1,0),tt.BlurDirectionY=new P(0,1);var nt={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`},rt=class extends V{constructor(){super(),this.isOutputPass=!0,this.uniforms=F.clone(nt.uniforms),this.material=new me({name:nt.name,uniforms:this.uniforms,vertexShader:nt.vertexShader,fragmentShader:nt.fragmentShader}),this._fsQuad=new Je(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},v.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},it=[[82,31,.085],[101,19,.055],[63,11.3,.034],[117,7.1,.022],[74,4.3,.013],[96,2.6,.008],[52,1.63,.0045],[128,1.04,.003]],at=`
const int NG = ${it.length};
const vec3 GW[NG] = vec3[NG]( ${it.map(([e,t,n])=>`vec3(${e.toFixed(1)}, ${t.toFixed(3)}, ${n.toFixed(4)})`).join(`, `)} );
// xyz: Gerstner displacement; waves shorter than ~4 grid cells are left to the fragment normals
vec3 gerstnerDisp( vec2 p, float t, float cell ) {
	vec3 d = vec3( 0.0 );
	for ( int i = 0; i < NG; i ++ ) {
		float a = radians( GW[ i ].x );
		vec2 dir = vec2( cos( a ), sin( a ) );
		float k = 6.28318 / GW[ i ].y;
		float w = sqrt( 9.81 * k );
		float A = GW[ i ].z * smoothstep( 3.0 * cell, 6.0 * cell, GW[ i ].y );
		float th = k * dot( dir, p ) - w * t + float( i ) * 1.7;
		float Q = 0.55 / ( k * 0.09 * float( NG ) );
		d.xz += min( Q, 6.0 ) * A * dir * cos( th );
		d.y += A * sin( th );
	}
	return d;
}
// surface slope (d/dx, d/dz); each wave fades out before it aliases (fw: pixel footprint, m)
vec2 gerstnerSlope( vec2 p, float t, float fw ) {
	vec2 g = vec2( 0.0 );
	for ( int i = 0; i < NG; i ++ ) {
		float a = radians( GW[ i ].x );
		vec2 dir = vec2( cos( a ), sin( a ) );
		float k = 6.28318 / GW[ i ].y;
		float w = sqrt( 9.81 * k );
		float th = k * dot( dir, p ) - w * t + float( i ) * 1.7;
		g += dir * ( GW[ i ].z * k * cos( th ) ) * ( 1.0 - smoothstep( 0.25, 0.6, fw / GW[ i ].y ) );
	}
	return g;
}
// open-water waves calm down over the shallows, where the breaker train takes over
float gerstnerFade( float h ) { return smoothstep( 0.0, 0.8, h ) * ( 0.3 + 0.7 * smoothstep( 1.5, 9.0, h ) ); }
`;function ot(e,t,n,r,i,a=1.045){let o=[];for(let r=e;r<=t+1e-6;r+=n)o.push(r);let s=n,c=o[o.length-1];for(;c<i;)s*=a,c=Math.min(c+s,i),o.push(c);let l=[];for(s=n,c=o[0];c>r;)s*=a,c=Math.max(c-s,r),l.push(c);return l.reverse().concat(o)}function st(e=.25){let t=ot(-62,62,e,-3e3,3e3),n=ot(-74,7,e,-3e3,90),r=t.length,i=n.length,a=new Float32Array(r*i*3),o=new Float32Array(r*i),s=(e,t)=>Math.max(e[Math.min(t+1,e.length-1)]-e[t],e[t]-e[Math.max(t-1,0)]);for(let e=0;e<i;e++)for(let i=0;i<r;i++){let c=e*r+i;a[c*3]=t[i],a[c*3+1]=-n[e],o[c]=Math.max(s(t,i),s(n,e))}let c=new Uint32Array((r-1)*(i-1)*6),l=0;for(let e=0;e<i-1;e++)for(let t=0;t<r-1;t++){let n=e*r+t,i=n+1,a=n+r,o=a+1;c[l++]=n,c[l++]=a,c[l++]=i,c[l++]=i,c[l++]=a,c[l++]=o}let u=new _;return u.setAttribute(`position`,new Se(a,3)),u.setAttribute(`cell`,new Se(o,1)),u.setIndex(new Se(c,1)),u.computeBoundingSphere(),u.boundingSphere.radius+=2,u}var ct=class extends o{constructor(e,t={}){super(e),this.isWater=!0;let r=this,i=t.mirrorScale===void 0?.5:t.mirrorScale,a=t.clipBias===void 0?0:t.clipBias,o=t.waterNormals===void 0?null:t.waterNormals,s=t.sunDirection===void 0?new C(.70707,.70707,0):t.sunDirection,l=t.side===void 0?0:t.side,u=t.fog!==void 0&&t.fog,d=new h,f=new C,p=new C,m=new C,g=new x,_=new C(0,0,-1),v=new xe,y=new C,S=new C,w=new xe,T=new P,E=new x,D=new ee,k=new L(512,512,{type:c});k.texture.generateMipmaps=!0,k.texture.minFilter=b;let A=new L(512,512,{type:c,minFilter:n,magFilter:n});A.depthTexture=new se(512,512,re);let j={name:`BeachWater`,uniforms:F.merge([te.fog,te.lights,{normalSampler:{value:null},mirrorSampler:{value:null},refractionSampler:{value:null},depthSampler:{value:null},resolution:{value:new P(1,1)},cameraNear:{value:.1},cameraFar:{value:1e3},time:{value:0},debugMode:{value:0},skyEnv:{value:null},textureMatrix:{value:new x},sunDirection:{value:new C(.70707,.70707,0)},absorption:{value:new C(.42,.075,.042)},scatterColor:{value:new I(.005,.1,.26)},shallowGlow:{value:new I(.05,.42,.36)},skyAmbient:{value:new I(.55,.68,.85)}}]),vertexShader:`
				uniform mat4 textureMatrix;
				uniform float time;
				attribute float cell;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;
				varying vec3 vViewPos;
				varying float vGFade;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				${ce}
				${ve}
				${le}
				${at}

				void main() {
					vec4 wp = modelMatrix * vec4( position, 1.0 );
					vec2 p = wp.xz;
					float h = max( - terrainH( p ), 0.0 );
					float gf = gerstnerFade( h );
					vec3 g = gerstnerDisp( p, time, cell ) * gf;
					Surf sf = surfWaves( p, time );
					float y = max( sf.eta + g.y, swashSurface( p, sf.s, time ) );
					wp.xz += g.xz;
					wp.y = y;
					vGFade = gf;
					worldPosition = wp;
					// mirror lookup on the undisplaced plane: raised crests would otherwise pull the
					// reflection of distant objects down onto themselves
					mirrorCoord = textureMatrix * vec4( wp.x, 0.0, wp.z, 1.0 );
					vec4 mvPosition = viewMatrix * wp;
					vViewPos = mvPosition.xyz;
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,fragmentShader:`
				uniform sampler2D mirrorSampler;
				uniform mat4 textureMatrix;
				uniform sampler2D refractionSampler;
				uniform sampler2D depthSampler;
				uniform sampler2D normalSampler;
				uniform vec2 resolution;
				uniform float cameraNear;
				uniform float cameraFar;
				uniform float time;
				uniform int debugMode;
				uniform vec3 sunDirection;
				uniform vec3 absorption;
				uniform vec3 scatterColor;
				uniform vec3 shallowGlow;
				uniform vec3 skyAmbient;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;
				varying vec3 vViewPos;
				varying float vGFade;

				#include <common>
				#ifdef SKY_ENV
					uniform sampler2D skyEnv;
					#include <cube_uv_reflection_fragment>
				#endif
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				${ce}
				${ve}
				${le}
				${at}

				// surf + swash surface height (the Gerstner part is added analytically)
				float surfHeight( vec2 p ) {
					Surf sf = surfWaves( p, time );
					return max( sf.eta, swashSurface( p, sf.s, time ) );
				}

				// capillary / short wind waves: four rotated, drifting layers of the normal map at
				// unrelated scales (no visible tiling); mip-mapping fades them with distance
				vec2 detailSlope( vec2 p, float strength ) {
					vec2 g = vec2( 0.0 );
					mat2 r1 = mat2( 0.80, 0.60, -0.60, 0.80 ), r2 = mat2( -0.35, 0.94, -0.94, -0.35 );
					mat2 r3 = mat2( 0.26, -0.97, 0.97, 0.26 );
					g += ( texture2D( normalSampler, p / 6.7 + vec2( 0.011, 0.031 ) * time ).xy * 2.0 - 1.0 ) * 0.9;
					g += ( texture2D( normalSampler, r1 * p / 2.9 + vec2( -0.037, 0.029 ) * time ).xy * 2.0 - 1.0 ) * 0.8;
					g += ( texture2D( normalSampler, r2 * p / 1.31 + vec2( 0.05, -0.061 ) * time ).xy * 2.0 - 1.0 ) * 0.55;
					g += ( texture2D( normalSampler, r3 * p / 0.53 + vec2( -0.09, -0.11 ) * time ).xy * 2.0 - 1.0 ) * 0.35;
					return -g * strength;
				}

				float D_GGX2( float a, float NoH ) {
					float a2 = a * a;
					float d = NoH * NoH * ( a2 - 1.0 ) + 1.0;
					return a2 / ( 3.14159 * d * d );
				}

				void main() {

					#include <logdepthbuf_fragment>
					vec2 p = worldPosition.xz;
					float floorH = terrainH( p );
					float s = shoreDist( p );
					vec4 sev = swashEvents( p, time );
					// wash edge: tongues and fine fingers, slowly changing
					float edgeN = ( fbm( vec2( p.x * 0.7, s * 0.5 + time * 0.08 ) ) - 0.5 ) * 0.06
						+ ( vnoise( vec2( p.x * 3.3, s * 1.5 + time * 0.3 ) ) - 0.5 ) * 0.02 + ( vnoise( p * 12.0 + time * 0.4 ) - 0.5 ) * 0.006;
					// exact swash level per fragment (the vertex grid would cut straight triangle edges)
					float thin = max( worldPosition.y, max( sev.x, sev.y ) - 0.035 * max( s, 0.0 ) ) - floorH;
					if ( thin + edgeN < 0.0 || s < - 9.0 ) discard;

					vec3 toEye = cameraPosition - worldPosition.xyz;
					float dist = length( toEye );
					vec3 V = toEye / dist;
					float fw = max( length( fwidth( p ) ), 1e-4 );

					// ---- surface normal: surf (finite differences) + Gerstner + detail
					Surf sf = surfWaves( p, time );
					vec2 slope = vec2( 0.0 );
					if ( s < 70.0 && s > - 9.0 ) {
						float e = clamp( fw * 0.6, 0.03, 0.4 );
						float h0 = max( sf.eta, swashSurface( p, sf.s, time ) );
						slope = vec2( surfHeight( p + vec2( e, 0.0 ) ) - h0, surfHeight( p + vec2( 0.0, e ) ) - h0 ) / e;
					}
					slope += gerstnerSlope( p, time, fw ) * vGFade;
					float depthStill = max( - floorH, 0.0 );
					// ripples: weaker in very shallow water and on the swash sheet, more chop in wind patches
					float patchN = fbm( p * 0.03 + vec2( time * 0.012, - time * 0.007 ) );
					float ripple = ( 0.35 + 0.65 * smoothstep( 0.05, 1.2, depthStill ) ) * ( 0.7 + 0.6 * smoothstep( 0.35, 0.7, patchN ) );
					vec2 dslope = detailSlope( p, 0.055 * ripple );
					vec3 N = normalize( vec3( - slope.x - dslope.x, 1.0, - slope.y - dslope.y ) );
					// glitter facets: same normal with the fine layers exaggerated
					vec3 Ng = normalize( vec3( - slope.x - dslope.x * 2.6, 1.0, - slope.y - dslope.y * 2.6 ) );

					float NoV = max( dot( N, V ), 1e-3 );
					// roughness grows with distance: detail the pixels can't resolve becomes micro-facets
					float rough = 0.06 + 0.22 * smoothstep( 0.05, 2.0, fw );

					// ---- light
					vec3 sunE = vec3( 3.5 );
					#if NUM_DIR_LIGHTS > 0
						sunE = directionalLights[ 0 ].color;
					#endif
					float shadow = getShadowMask();
					vec3 L = normalize( sunDirection );

					// ---- refraction: bottom seen through the water + absorption / in-scatter on the view path
					vec2 suv = gl_FragCoord.xy / resolution;
					float surfZ = - vViewPos.z;
					float rayScale = dist / surfZ;
					vec2 ruv = suv + N.xz * vec2( 1.0, - 1.0 ) * 0.035 * clamp( thin * 2.0, 0.0, 1.0 ) / max( surfZ * 0.05, 1.0 );
					float rz = - perspectiveDepthToViewZ( texture2D( depthSampler, ruv ).x, cameraNear, cameraFar );
					if ( rz < surfZ ) { ruv = suv; rz = - perspectiveDepthToViewZ( texture2D( depthSampler, suv ).x, cameraNear, cameraFar ); }
					vec3 bottom = texture2D( refractionSampler, ruv ).rgb;
					float path = max( rz - surfZ, 0.0 ) * rayScale;
					// deep water is opaque (and the ray may have left the terrain)
					path = mix( path, 1e3, smoothstep( 9.0, 22.0, depthStill ) );
					vec3 T = exp( - absorption * path );
					// scattered light: brighter where the sun reaches deeper (sunlit, shallow white sand)
					// over shallow white sand the upwelling light is turquoise (bottom-reflected light that
					// lost its red on the way); over deep water only the blue scattered by the water itself
					vec3 inscatter = mix( shallowGlow * 0.4, scatterColor, smoothstep( 1.0, 11.0, depthStill ) );
					inscatter *= ( 0.55 + 0.45 * shadow ) * ( 0.6 + 0.8 * L.y );
					vec3 transmitted = bottom * T + inscatter * ( 1.0 - exp( - ( absorption + 0.06 ) * path ) );

					// light through thin, steep wave crests (seen against the sun)
					float crestH = clamp( ( sf.eta + 0.28 * sf.H ) / max( sf.H, 0.04 ), 0.0, 1.0 );
					float faceU = smoothstep( 1.0 - sf.span, 1.0, sf.u ) * ( 1.0 - smoothstep( 0.97, 1.0, sf.u ) );
					float backlit = pow( max( dot( - V.xz, L.xz ) / max( length( V.xz ) * length( L.xz ), 1e-3 ), 0.0 ), 2.0 );
					float sss = crestH * min( sf.H * 3.0, 1.0 ) * ( 0.4 + 1.6 * faceU * ( 1.0 - sf.bFront ) );
					transmitted += shallowGlow * sunE * 0.03 * sss * ( 0.3 + 0.7 * backlit ) * ( 0.5 + 0.5 * shadow );

					// ---- reflection: planar mirror, distorted by the normal and blurred with distance.
					// Facets facing the viewer dominate at a distance, so the Fresnel term uses a normal
					// tilted towards the eye (less mirror-like than a flat surface at grazing angles).
					float tilt = 0.06 + 0.22 * smoothstep( 0.05, 2.0, fw );
					vec3 Nr = normalize( N + vec3( V.x, 0.0, V.z ) * tilt );
					// long waves shift the reflection a little, ripples break it into horizontal streaks
					vec2 muv = mirrorCoord.xy / mirrorCoord.w + ( N.xz * 0.2 + ( Ng.xz - N.xz ) * 0.5 ) * vec2( 1.0, - 1.0 ) / ( 4.0 + dist * 0.6 );
					// explicit LOD: the derivatives of the perturbed lookup are noisy and picked a
					// different mip level for every 2x2 pixel quad (blocky "bricks" in the distance)
					vec3 refl = textureLod( mirrorSampler, muv, clamp( log2( 1.0 + fw * 3.0 ) * 1.6, 0.0, 4.0 ) ).rgb;
					// the sun disc is carried by the specular term
					refl = min( refl, vec3( 3.0 ) );
					#ifdef SKY_ENV
						// tilted facets see higher (bluer, darker) sky than the flat mirror: rescale the
						// mirror by the sky-radiance ratio between the two directions
						float envR = 0.2 + 0.3 * smoothstep( 0.05, 2.0, fw );
						vec3 Rf = reflect( - V, vec3( 0.0, 1.0, 0.0 ) ); Rf.y = max( Rf.y, 0.02 );
						vec3 Rt = reflect( - V, Nr ); Rt.y = max( Rt.y, 0.02 );
						vec3 skyF = textureCubeUV( skyEnv, Rf, envR ).rgb, skyT = textureCubeUV( skyEnv, Rt, envR ).rgb;
						refl *= clamp( dot( skyT, vec3( 0.3, 0.5, 0.2 ) ) / max( dot( skyF, vec3( 0.3, 0.5, 0.2 ) ), 1e-4 ), 0.3, 1.2 );
					#endif
					float F0 = 0.02;
					float NoVr = max( dot( Nr, V ), 0.0 );
					float F = F0 + ( 1.0 - F0 ) * pow( 1.0 - NoVr, 5.0 );

					vec3 col = mix( transmitted, refl, F );

					// ---- sun: broad sheen + sparse sharp glitter
					vec3 H = normalize( L + V );
					float NoL = max( dot( N, L ), 0.0 );
					float Fs = F0 + ( 1.0 - F0 ) * pow( 1.0 - max( dot( H, V ), 0.0 ), 5.0 );
					float spec = D_GGX2( rough, max( dot( N, H ), 0.0 ) ) * Fs * NoL / ( 4.0 * NoV * max( NoL, 0.1 ) + 1e-3 );
					float NgH = max( dot( Ng, H ), 0.0 );
					float glit = D_GGX2( 0.012, NgH ) * Fs * 0.25 / max( NoV, 0.2 ) * ( 1.0 - smoothstep( 0.2, 1.2, fw ) );
					col += sunE * shadow * ( min( spec * 0.15, 2.5 ) + min( glit * 0.3, 10.0 ) ) * NoL;

					// ---- foam
					vec2 sea = seawardDir( p.x );
					float u = sf.u, lam = sf.lam;
					float behind = u * lam;                 // metres behind crest n
					float ahead = ( 1.0 - u ) * lam;        // metres ahead of crest n+1
					float foamAmt = 0.0;
					// whitewater varies along each crest (sections break harder, some barely), with
					// ragged edges
					float secB = vnoise( vec2( p.x * 0.3 + sf.n * 3.7, sf.n * 1.9 ) );
					float secF = vnoise( vec2( p.x * 0.3 + ( sf.n + 1.0 ) * 3.7, ( sf.n + 1.0 ) * 1.9 ) );
					float jag = ( vnoise( vec2( p.x * 1.4, sf.n * 1.7 + 4.0 ) ) - 0.5 ) * 0.9 + ( vnoise( p * 2.3 ) - 0.5 ) * 0.5;
					// bore roller: whitewater on the front face and ~2 m behind the crest
					foamAmt = max( foamAmt, sf.bBack * ( 0.5 + 0.65 * secB ) * ( 1.0 - smoothstep( 0.3, 2.4, behind + jag ) ) );
					foamAmt = max( foamAmt, sf.bFront * ( 0.5 + 0.65 * secF ) * ( 1.0 - smoothstep( 0.0, 0.8, ahead - jag * 0.5 ) ) );
					// a crest just starting to break: white feathering along the lip
					float lip = smoothstep( 0.52, 0.66, sf.rFront ) * ( 1.0 - smoothstep( 0.0, 0.35, ahead ) );
					foamAmt = max( foamAmt, lip * 0.8 * secF );
					// decaying foam trail behind the bore, opening up into lace
					float age = u * SURF_T;
					foamAmt = max( foamAmt, sf.bBack * ( 0.45 + 0.4 * secB ) * exp( - age / 4.0 ) );
					// residual patches over the whole surf zone, slowly drifting
					foamAmt = max( foamAmt, 0.32 * max( sf.bBack, sf.bFront ) * smoothstep( 0.3, 0.7, fbm( p * vec2( 0.11, 0.25 ) + time * 0.02 ) ) );
					// foam rides shoreward with the bore, a bit slower than the crest
					vec2 fq = p + sea * behind * 0.6;

					// bore foam runs out irregularly on the beach face, where the swash foam takes over
					foamAmt *= smoothstep( - 1.2, 1.2, s + 1.6 * ( fbm( p * vec2( 0.5, 0.9 ) + 2.0 ) - 0.5 ) );
					// swash: foam of the newest uprush and of the previous event's backwash
					if ( s < 4.0 ) {
						float sn = fbm( p * vec2( 0.6, 1.1 ) + vec2( 0.0, time * 0.05 ) );
						// a ragged bore front where an uprush runs over the previous backwash
						float lipN = ( fbm( p * vec2( 1.3, 2.4 ) + vec2( time * 0.2, 0.0 ) ) - 0.5 ) * 0.07;
						float swAmt = max( swashFoam( sev.x - floorH + edgeN + lipN, sev.z, sn ), swashFoam( sev.y - floorH + edgeN, sev.z + 1.0, sn ) ) * 0.88;
						swAmt *= smoothstep( 4.0, 1.0, s );
						foamAmt = max( foamAmt, swAmt );
					}
					// swash foam is carried up and down the beach with the water
					fq += sea * ( - max( sev.x, sev.y ) / 0.09 ) * smoothstep( 6.0, 3.0, s );
					// never fully solid: real whitewater always shows texture
					foamAmt = min( foamAmt, 0.97 );
					float pat = foamPattern( fq, time * 0.6, fw );
					float foam = foamCover( pat, foamAmt );
					// thick fresh foam is opaque white, thin lace is translucent
					float foamThick = clamp( ( pat - ( 0.92 - foamAmt ) ) / 0.35, 0.0, 1.0 );
					float foamA = foam * ( 0.4 + 0.6 * foamThick );
					// sparse whitecaps out on the bay
					float wc = smoothstep( 0.8, 0.9, fbm( p * 0.3 + vec2( time * 0.21, time * 0.13 ) ) * 0.6 + patchN * 0.5 ) * smoothstep( 40.0, 80.0, s );
					foamA = max( foamA, wc * 0.6 * foamCover( pat, 0.6 ) );
					// foam: diffuse, slightly bumpy, lit by sun and sky
					vec3 fN = normalize( N + vec3( ( pat - 0.5 ) * 0.4, 0.0, ( vnoise( fq * 9.0 ) - 0.5 ) * 0.4 ) );
					// foam is a thick multiple-scattering layer: bright, nearly white, partly lit through
					vec3 foamCol = 0.9 * ( mix( sunE, vec3( dot( sunE, vec3( 0.333 ) ) ), 0.35 ) * ( 0.35 + 0.65 * max( dot( fN, L ), 0.0 ) ) * ( 0.25 + 0.75 * shadow ) + skyAmbient * 2.5 ) / 3.14159 * 1.6;
					col = mix( col, foamCol * ( 0.78 + 0.22 * foamThick ), clamp( foamA, 0.0, 1.0 ) );

					gl_FragColor = vec4( col, 1.0 );
					if ( debugMode == 1 ) gl_FragColor = vec4( foamAmt, foamA, 0.0, 1.0 );
					if ( debugMode == 2 ) gl_FragColor = vec4( sf.bBack, sf.bFront, fract( sf.n / 3.0 ), 1.0 );
					if ( debugMode == 3 ) gl_FragColor = vec4( vec3( 0.5 + sf.eta ), 1.0 );
					if ( debugMode == 5 ) gl_FragColor = vec4( refl * F, 1.0 );
					if ( debugMode == 6 ) gl_FragColor = vec4( transmitted * ( 1.0 - F ), 1.0 );
					if ( debugMode == 7 ) gl_FragColor = vec4( sunE * shadow * ( min( spec * 0.15, 2.5 ) + min( glit * 0.3, 10.0 ) ) * NoL, 1.0 );
					if ( debugMode == 8 ) gl_FragColor = vec4( N * 0.5 + 0.5, 1.0 );
					if ( debugMode == 4 ) gl_FragColor = vec4( fract( s ), depthStill / 10.0, sf.rFront, 1.0 );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>
				}`},M=new O({name:j.name,uniforms:F.clone(j.uniforms),vertexShader:j.vertexShader,fragmentShader:j.fragmentShader,lights:!0,side:l,fog:u}),N=M.uniforms;N.mirrorSampler.value=k.texture,N.refractionSampler.value=A.texture,N.depthSampler.value=A.depthTexture,N.textureMatrix.value=E,N.normalSampler.value=o,N.sunDirection.value=s,r.material=M,r.setEnvironment=function(e){let t=e.image.height,n=Math.log2(t)-2;Object.assign(M.defines,{SKY_ENV:``,ENVMAP_TYPE_CUBE_UV:``,CUBEUV_TEXEL_WIDTH:1/(3*Math.max(2**n,112)),CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:n.toFixed(1)}),N.skyEnv.value=e,M.needsUpdate=!0},r.renderOrder=10,r.frustumCulled=!1,r.refractionSkip=[];function ne(e){let t=e.getRenderTarget();t?T.set(t.width,t.height):e.getDrawingBufferSize(T),(A.width!==T.x||A.height!==T.y)&&A.setSize(T.x,T.y);let n=Math.max(2,Math.round(T.x*i)),r=Math.max(2,Math.round(T.y*i));(k.width!==n||k.height!==r)&&k.setSize(n,r),N.resolution.value.copy(T)}r.onBeforeRender=function(e,t,n){ne(e);let i=e.getRenderTarget(),o=e.xr.enabled,s=e.shadowMap.autoUpdate;r.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,N.cameraNear.value=n.near,N.cameraFar.value=n.far;let c=r.refractionSkip.filter(e=>e.visible);for(let e of c)e.visible=!1;e.setRenderTarget(A),e.state.buffers.depth.setMask(!0),e.autoClear===!1&&e.clear(),r.skipRefraction||e.render(t,n);for(let e of c)e.visible=!0;if(p.setFromMatrixPosition(r.matrixWorld),m.setFromMatrixPosition(n.matrixWorld),g.extractRotation(r.matrixWorld),f.set(0,0,1),f.applyMatrix4(g),y.subVectors(p,m),y.dot(f)<=0&&!r.skipMirror){y.reflect(f).negate(),y.add(p),g.extractRotation(n.matrixWorld),_.set(0,0,-1),_.applyMatrix4(g),_.add(m),S.subVectors(p,_),S.reflect(f).negate(),S.add(p),D.position.copy(y),D.up.set(0,1,0),D.up.applyMatrix4(g),D.up.reflect(f),D.lookAt(S),D.far=n.far,D.updateMatrixWorld(),D.projectionMatrix.copy(n.projectionMatrix),E.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),E.multiply(D.projectionMatrix),E.multiply(D.matrixWorldInverse),d.setFromNormalAndCoplanarPoint(f,p),d.applyMatrix4(D.matrixWorldInverse),v.set(d.normal.x,d.normal.y,d.normal.z,d.constant);let r=D.projectionMatrix;w.x=(Math.sign(v.x)+r.elements[8])/r.elements[0],w.y=(Math.sign(v.y)+r.elements[9])/r.elements[5],w.z=-1,w.w=(1+r.elements[10])/r.elements[14],v.multiplyScalar(2/v.dot(w)),r.elements[2]=v.x,r.elements[6]=v.y,r.elements[10]=v.z+1-a,r.elements[14]=v.w,e.setRenderTarget(k),e.state.buffers.depth.setMask(!0),e.autoClear===!1&&e.clear(),e.render(t,D)}r.visible=!0,e.xr.enabled=o,e.shadowMap.autoUpdate=s,e.setRenderTarget(i);let l=n.viewport;l!==void 0&&e.state.viewport(l)}}};function lt(e=256,t=7){let r=t,i=()=>(r=r*16807%2147483647)/2147483647,a=[];for(let e=0;e<48;e++){let e=2+Math.floor(i()*i()*30),t=i()*Math.PI*2,n=Math.round(Math.cos(t)*e),r=Math.round(Math.sin(t)*e);if(n===0&&r===0)continue;let o=Math.hypot(n,r);a.push({kx:n,ky:r,amp:1/o**1.3,ph:i()*Math.PI*2})}let o=new Uint8Array(e*e*4),s=.6;for(let t=0;t<e;t++)for(let n=0;n<e;n++){let r=n/e,i=t/e,c=0,l=0;for(let e of a){let t=2*Math.PI*(e.kx*r+e.ky*i)+e.ph,n=Math.cos(t),a=e.amp*2*Math.PI*n*(1+.6*Math.sin(t));c+=a*e.kx,l+=a*e.ky}let u=new C(-c*s*8/256,-l*s*8/256,1).normalize(),d=(t*e+n)*4;o[d]=(u.x*.5+.5)*255,o[d+1]=(u.y*.5+.5)*255,o[d+2]=(u.z*.5+.5)*255,o[d+3]=255}let c=new p(o,e,e,de);return c.wrapS=c.wrapT=T,c.magFilter=n,c.minFilter=b,c.generateMipmaps=!0,c.anisotropy=4,c.needsUpdate=!0,c}function ut(e,t,n){let r=Math.sin(e*127.1+t*311.7+n*74.7)*43758.5453;return r-Math.floor(r)}function dt(e,t,n){let r=Math.floor(e),i=Math.floor(t),a=e-r,o=t-i,s=a*a*(3-2*a),c=o*o*(3-2*o),l=ut(r,i,n),u=ut(r+1,i,n),d=ut(r,i+1,n),f=ut(r+1,i+1,n);return l+(u-l)*s+(d-l)*c+(l-u-d+f)*s*c}function ft(e,t,n,r=5){let i=0,a=.5;for(let o=0;o<r;o++)i+=a*dt(e,t,n+o*13),e=e*2.03+3.1,t=t*2.03-1.7,a*=.5;return i}function pt(e,t,n,r=5){let i=0,a=.5;for(let o=0;o<r;o++)i+=a*(1-Math.abs(2*dt(e,t,n+o*7)-1))**2,e=e*2.1-1.3,t=t*2.1+2.9,a*=.5;return i}function mt({x:t,z:n,radiusX:r,radiusZ:i,peaks:a,seed:s,nx:c=280,nz:u=130}){let d=new e(r*2.4,i*2.4,c,u).rotateX(-Math.PI/2),p=d.attributes.position,m=new Float32Array(p.count);for(let e=0;e<p.count;e++){let t=p.getX(e),n=p.getZ(e),o=Math.atan2(n/i,t/r),c=Math.hypot(t/r,n/i)/(1+.16*Math.sin(o*3+s)+.08*Math.sin(o*7+s*2)+.12*(ft(t*.01,n*.01,s)-.5)),l=Math.max(0,1-c),u=0;for(let e of a){let r=(t-e.x)/e.r,i=(n-e.z)/(e.r*.7);u=Math.max(u,e.h*Math.exp(-(r*r+i*i)))}let d=pt(t*.012,n*.012,s);u=u*(.6+.65*d)+6*ft(t*.03,n*.03,s+5)*l,u*=Math.min(1,l*4),u+=3*Math.min(1,l*12)-4,m[e]=u,p.setY(e,u)}d.computeVertexNormals();let h=d.attributes.normal,g=new Float32Array(p.count*3),_=new I;for(let e=0;e<p.count;e++){let t=p.getX(e),n=p.getZ(e),r=m[e],i=1-h.getY(e),a=ft(t*.05,n*.05,s+9),o=dt(t*.35,n*.35,s+3);_.setRGB(.025+.03*a,.07+.06*a,.03+.015*a).multiplyScalar(.7+.6*o);let c=Math.min(1,Math.max(0,(i-.32)/.18))+Math.max(0,pt(t*.02,n*.02,s+2)-.62)*3,l=Math.min(1,c)*(.6+.4*a);_.lerp(new I(.2+.06*o,.19+.05*o,.17+.04*o),l);let u=1-Math.min(1,Math.max(0,(r+.5)/2.5));_.lerp(i>.35?new I(.12,.11,.1):new I(.55,.48,.36),u),g[e*3]=_.r,g[e*3+1]=_.g,g[e*3+2]=_.b}d.setAttribute(`color`,new f(g,3));let v=new l({vertexColors:!0,roughness:1}),y=new o(d,v);return y.position.set(t,0,n),y}function ht(){let e=new a;return e.name=`islands`,e.add(mt({x:90,z:-520,radiusX:190,radiusZ:80,seed:1.3,peaks:[{x:-30,z:0,r:55,h:50},{x:45,z:-10,r:40,h:34},{x:-95,z:10,r:35,h:20},{x:110,z:5,r:45,h:16}]})),e.add(mt({x:-170,z:-640,radiusX:100,radiusZ:45,seed:4.1,nx:160,nz:70,peaks:[{x:10,z:0,r:40,h:26},{x:-45,z:5,r:25,h:15}]})),e}function gt(e){let t=e;return()=>(t=t*16807%2147483647)/2147483647}function _t(e,t){let n=.75,r=(j(e+n,t)-j(e-n,t))/(2*n),i=(j(e,t+n)-j(e,t-n))/(2*n);return 1-1/Math.sqrt(1+r*r+i*i)}function vt(e,t,n){let r=e.attributes.position,i=new C;for(let e=0;e<r.count;e++){i.fromBufferAttribute(r,e);let a=Math.sin(i.x*5.1+n)*Math.sin(i.y*4.3+n*2)*Math.sin(i.z*6.7+n*3),o=Math.sin(i.x*13.3+n*5)*Math.sin(i.y*11.9-n)*Math.sin(i.z*12.7+n*4);i.multiplyScalar(1+t*a+t*.45*o),r.setXYZ(e,i.x,i.y,i.z)}e.computeVertexNormals();let a=new Float32Array(r.count*3);for(let e=0;e<r.count;e++){i.fromBufferAttribute(r,e);let t=(.55+.45*Math.min(1,Math.max(0,i.y+.6)))*(.75+.5*Math.abs(Math.sin(i.x*9.1+i.z*7.3+n)*Math.sin(i.y*8.7-i.x*3.1)));a[e*3]=a[e*3+1]=a[e*3+2]=t}return e.setAttribute(`color`,new f(a,3)),e}function yt(){let e=[],t=(e,t,n,r)=>{let i=e.attributes.position.count,a=new Float32Array(i*3);for(let e=0;e<i;e++)a[e*3]=t,a[e*3+1]=n,a[e*3+2]=r;return e.setAttribute(`color`,new f(a,3)),e},n=new r(.018,.03,1,6,8,!0).translate(0,.5,0),i=n.attributes.position;for(let e=0;e<i.count;e++)i.setX(e,i.getX(e)+.12*i.getY(e)**2);n.deleteAttribute(`uv`),e.push(t(n.toNonIndexed(),.3,.24,.16));let a=new C(.12,1,0);for(let n=0;n<11;n++){let r=n/11*Math.PI*2+.3*Math.sin(n*7.1),i=.32+.08*Math.sin(n*3.3),o=.35+.25*Math.cos(n*5.7),s=[],c=[];for(let e=0;e<=6;e++){let t=e/6,n=i*t,s=o*i*t-.9*i*t*t;c.push(new C(a.x+Math.cos(r)*n,a.y+s,a.z+Math.sin(r)*n))}let l=new C(-Math.sin(r),0,Math.cos(r));for(let e=0;e<6;e++){let t=.055*Math.sin(Math.PI*Math.min(1,e/6*1.15+.05)),n=.055*Math.sin(Math.PI*Math.min(1,(e+1)/6*1.15+.05)),r=c[e],i=c[e+1],a=new C(0,-.4*t,0),o=new C(0,-.4*n,0),u=r.clone().addScaledVector(l,t).add(a),d=r.clone().addScaledVector(l,-t).add(a),f=i.clone().addScaledVector(l,n).add(o),p=i.clone().addScaledVector(l,-n).add(o);s.push(...u.toArray(),...r.toArray(),...f.toArray(),...r.toArray(),...i.toArray(),...f.toArray()),s.push(...r.toArray(),...d.toArray(),...i.toArray(),...d.toArray(),...p.toArray(),...i.toArray())}let u=new _;u.setAttribute(`position`,new f(s,3)),u.computeVertexNormals();let d=.85+.3*Math.sin(n*2.3);e.push(t(u,.07*d,.13*d,.03*d))}return he(e)}function bt(e={}){let t=Object.values(e).map(e=>e.pos),n=(e,n)=>t.some(t=>Math.hypot(e-t[0],n-t[2])<30),r=new a;r.name=`vegetation`;let i=gt(4242),o=new x,s=new _e,c=new I,u=[];for(let e=0;e<16e4&&u.length<11e3;e++){let e=-186+i()*376,t=-200+i()*245;if(Math.abs(e)<34||n(e,t))continue;let r=j(e,t);if(r<2.2+i()*1.5)continue;let a=_t(e,t);a>.32||u.push({x:e,z:t,h:r,sl:a})}let d=vt(D(new g(1,2).deleteAttribute(`normal`).deleteAttribute(`uv`)),.22,11),f=new l({roughness:1,vertexColors:!0}),p=new Ce(d,f,u.length);u.forEach((e,t)=>{let n=1.1+i()*i()*2,r=.65+i()*.35;s.setFromEuler(new oe(0,i()*6.28,(i()-.5)*.3)),o.compose(new C(e.x,e.h+n*r*.55,e.z),s,new C(n,n*r,n*(.8+i()*.3))),p.setMatrixAt(t,o);let a=i();c.setRGB(.02+.03*a,.05+.05*a+.02*i(),.015+.015*a),i()<.08&&c.setRGB(.08,.1,.03),p.setColorAt(t,c)}),p.castShadow=!0,p.receiveShadow=!0,p.name=`treeCrowns`,r.add(p);let m=[];for(let e=0;e<4e4&&m.length<140;e++){let e=-186+i()*376,t=-160+i()*200;if(Math.abs(e)<36||n(e,t))continue;let r=j(e,t);r<1||r>4.5||_t(e,t)>.2||m.push({x:e,z:t,h:r})}let h=new Ce(yt(),new l({roughness:.85,vertexColors:!0,side:2}),m.length);m.forEach((e,t)=>{let n=7+i()*6;s.setFromEuler(new oe(0,i()*6.28,0)),o.compose(new C(e.x,e.h-.1,e.z),s,new C(n,n,n)),h.setMatrixAt(t,o)}),h.castShadow=!0,h.name=`palms`,r.add(h);let _=[];for(let e=0;e<8e4&&_.length<600;e++){let e=-186+i()*376,t=-200+i()*245;if(Math.abs(e)<40)continue;let n=t-fe(e),r=j(e,t),a=_t(e,t),o=r>-1.5&&r<1&&Math.abs(e)>55&&a>.04;(o||a>.3&&r>0)&&(n>60||_.push({x:e,z:t,h:r,shore:o}))}let v=vt(new g(1,1),.3,5),y=new l({roughness:.85,flatShading:!0,vertexColors:!0}),b=new Ce(v,y,_.length);return _.forEach((e,t)=>{let n=(e.shore?.5:.8)+i()*(e.shore?1.6:2.4);s.setFromEuler(new oe(i()*6.28,i()*6.28,i()*6.28)),o.compose(new C(e.x,e.h+n*.15,e.z),s,new C(n*(.8+i()*.6),n*(.5+i()*.4),n*(.8+i()*.6))),b.setMatrixAt(t,o);let r=.09+i()*.1;c.setRGB(r,r*.95,r*.9),b.setColorAt(t,c)}),b.castShadow=!0,b.receiveShadow=!0,b.name=`boulders`,r.add(b),r}function xt(e){let t=e;return()=>(t=t*16807%2147483647)/2147483647}function St(e,t){let n=fe(e);for(let r=0;r<15;r+=.05)if(j(e,n+r)>=t)return r;return null}function Ct(e=[]){let t=new a;t.name=`debris`;let n=xt(777),r=(t,n)=>e.every(e=>Math.hypot(t-e.pos[0],n-e.pos[2])>1.2+.25*e.height),i={weed:[],shell:[],pebble:[]};for(let e=-70;e<75;e+=.12){let t=St(e,ne+.06);if(t===null)continue;let a=.5+.5*Math.sin(e*.37)*Math.sin(e*.11+1);if(n()>.35+.65*a)continue;let o=fe(e)+t+(n()-.5)*.9,s=e+(n()-.5)*.1;if(!r(s,o))continue;let c=n();(c<.55?i.weed:c<.8?i.shell:i.pebble).push([s,o])}for(let e=0;e<2600;e++){let e=-60+n()*120,t=fe(e)+1+n()*24;Math.abs(e)>38||!r(e,t)||(n()<.55?i.shell:i.pebble).push([e,t])}let o=new x,s=new _e,c=new I,u=(e,r,i,a)=>{let c=new Ce(e,r,i.length);return i.forEach(([e,t],r)=>{let{s:i,color:l,yOff:u=0,tilt:d=.3}=a();s.setFromEuler(new oe((n()-.5)*d,n()*6.28,(n()-.5)*d)),o.compose(new C(e,j(e,t)+u,t),s,i),c.setMatrixAt(r,o),c.setColorAt(r,l)}),c.castShadow=!0,c.receiveShadow=!0,t.add(c),c},d=new g(1,1);u(d,new l({roughness:.5}),i.weed,()=>{let e=.12+n()*.35;return c.setRGB(.06+.06*n(),.06+.04*n(),.02+.02*n()),{s:new C(e,.025+n()*.03,e*(.25+n()*.4)),color:c,tilt:.1}}).name=`seaweed`;let f=new ye(1,8,4,0,Math.PI*2,0,Math.PI/2);u(f,new l({roughness:.45}),i.shell,()=>{let e=.018+n()*.035,t=n();return c.setRGB(.85+.1*t,.78+.08*t-.12*(t>.7),.7+.05*t),{s:new C(e,e*.45,e*(.7+n()*.3)),color:c,yOff:-.004}}).name=`shells`;let p=new g(1,1);return u(p,new l({roughness:.7}),i.pebble,()=>{let e=.02+n()*n()*.07,t=.2+n()*.3;return c.setRGB(t,t*(.9+.08*n()),t*(.8+.1*n())),{s:new C(e*(1+n()*.5),e*.55,e),color:c,yOff:-e*.15}}).name=`pebbles`,t}var H=new URLSearchParams(location.search),wt=(H.get(`group`)||`A`).toUpperCase(),Tt=H.get(`cam`),Et=H.has(`t`)?parseFloat(H.get(`t`)):null,U=(e,t)=>H.has(e)?parseFloat(H.get(e)):t,Dt=e=>H.has(e)?H.get(e).split(`,`).map(Number):null,W=new be({antialias:!0,powerPreference:`high-performance`});W.setPixelRatio(Math.min(window.devicePixelRatio,2)),W.setSize(window.innerWidth,window.innerHeight),W.toneMapping=4,W.toneMappingExposure=U(`exp`,.5),W.shadowMap.enabled=!0,W.shadowMap.type=1,document.body.appendChild(W.domElement);var G=new ge,K=new ee(50,window.innerWidth/window.innerHeight,.1,2e4),Ot=U(`sunel`,30),kt=U(`sunaz`,166),At=new C().setFromSphericalCoords(1,y.degToRad(90-Ot),y.degToRad(kt)),jt=new We;jt.scale.setScalar(1e4);var q=jt.material.uniforms;q.turbidity.value=U(`turb`,1),q.rayleigh.value=U(`ray`,.65),q.mieCoefficient.value=U(`mie`,6e-4),q.mieDirectionalG.value=.9,q.cloudCoverage.value=U(`cloud`,.32),q.cloudDensity.value=.55,q.cloudScale.value=18e-5,q.cloudElevation.value=.55,q.sunPosition.value.copy(At),G.add(jt);var Mt=new I(9287902);G.fog=new m(Mt,U(`fog`,7e-4));var J=new t(16766886,U(`sunI`,3.5));J.position.copy(At).multiplyScalar(120),J.target.position.set(2,0,0),J.castShadow=!0,J.shadow.mapSize.set(2048,2048);var Y=J.shadow.camera;Y.left=-45,Y.right=45,Y.top=45,Y.bottom=-45,Y.near=10,Y.far=300,J.shadow.bias=-4e-4,J.shadow.normalBias=.04,G.add(J,J.target),G.add(new d(10275583,14205850,.28));var Nt=new ge,Pt=new We;Pt.scale.setScalar(1e4),Pt.material.uniforms=F.clone(q),Nt.add(Pt);var X=null;function Ft(){let e=new N(W);G.environment?.dispose(),G.environment=e.fromScene(Nt).texture,e.dispose(),X?.setEnvironment(G.environment)}Ft(),W.domElement.addEventListener(`webglcontextrestored`,()=>requestAnimationFrame(Ft)),G.environmentIntensity=.35;var It={uTime:{value:0}};G.add(k(It)),G.add(ht()),X=new ct(st(),{waterNormals:lt(512),sunDirection:At.clone(),fog:!0}),X.rotation.x=-Math.PI/2,X.name=`water`,X.setEnvironment(G.environment),X.material.uniforms.debugMode.value=U(`wdebug`,0),G.add(X);var Z=await w(),Lt=bt(Z.cameras);G.add(Lt),X.refractionSkip=[`treeCrowns`,`palms`].map(e=>Lt.getObjectByName(e)).filter(Boolean),G.add(Ct(Z.slots)),ie(G);var Rt=ue(wt),Q=null,zt=Dt(`pos`)?{pos:Dt(`pos`),target:Dt(`look`)??[0,0,-10]}:Tt&&Z.cameras[Tt];if(zt)K.position.fromArray(zt.pos),K.lookAt(new C().fromArray(zt.target));else{let e=Z.cameras.wide;K.position.fromArray(e.pos),Q=new je(K,W.domElement),Q.target.fromArray(e.target),Q.maxPolarAngle=Math.PI*.495,Q.enableDamping=!0,Q.update()}var $=new Qe(W);$.addPass(new $e(G,K));var Bt=new tt(new P(window.innerWidth/2,window.innerHeight/2),U(`bloom`,.3),.3,U(`bth`,12));$.addPass(Bt),$.addPass(new rt);function Vt(){K.aspect=window.innerWidth/window.innerHeight,K.updateProjectionMatrix(),W.setSize(window.innerWidth,window.innerHeight),$.setSize(window.innerWidth,window.innerHeight)}window.addEventListener(`resize`,Vt);var Ht=new pe,Ut=0;await Rt;function Wt(){return typeof window.__TIME__==`number`&&Number.isFinite(window.__TIME__)?window.__TIME__:Et??Ht.getElapsed()}function Gt(e){It.uTime.value=e,X.material.uniforms.time.value=e}G.onBeforeRender=()=>Gt(Wt());function Kt(){Gt(Wt()),Q?.update(),$.render()}W.setAnimationLoop(()=>{Ht.update(),Kt(),++Ut===3&&(window.__sceneReady=window.__READY__=!0)}),window.__scene=window.__SCENE__={scene:G,camera:K,renderer:W,composer:$,water:X,group:wt,cameras:Z.cameras,render:Kt,applyTime:Gt};