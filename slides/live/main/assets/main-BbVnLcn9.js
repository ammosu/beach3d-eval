const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/compare-CM-4TrOs.js","assets/props-BfMgVns_.js","assets/GLTFLoader-Dq4q0Con.js","assets/compare-CBcrXqmb.css","assets/ui-CFe6ZiZZ.css","assets/explore-HHlsr2Ey.js","assets/explore-B6A3MxAo.css","assets/index-C1NQs95Y.js","assets/water-C-VaPpBh.js","assets/character-D7PY5GsZ.js","assets/species-BwhzQEuU.js","assets/index-mNTWrKiL.css"])))=>i.map(i=>d[i]);
import{M as q,O as Se,d as Pe,F as Z,e as P,U as X,f as x,g as k,h as W,N as Ee,T as ye,C as F,V as S,i as Ae,j as Re,R as De,k as Fe,l as Ue,L as Be,m as Ne,n as Oe,A as me,o as ze,p as Ie,q as Le,G as re,r as pe,I as oe,s as Ge,b as D,t as ne,u as le,a as ge,W as Ve,P as He,S as Qe,v as ke,c as We,w as je,H as Xe,D as qe,x as Ke}from"./GLTFLoader-Dq4q0Con.js";import{c as Ye,s as Ze}from"./water-C-VaPpBh.js";import{O as $e}from"./OrbitControls-swn83C5c.js";import{g as ve,s as Je,p as xe,l as et}from"./props-BfMgVns_.js";const tt="modulepreload",it=function(o){return"/"+o},ue={},$=function(e,t,s){let a=Promise.resolve();if(t&&t.length>0){let n=function(c){return Promise.all(c.map(l=>Promise.resolve(l).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),u=r?.nonce||r?.getAttribute("nonce");a=n(t.map(c=>{if(c=it(c),c in ue)return;ue[c]=!0;const l=c.endsWith(".css"),f=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${f}`))return;const h=document.createElement("link");if(h.rel=l?"stylesheet":tt,l||(h.as="script"),h.crossOrigin="",h.href=c,u&&h.setAttribute("nonce",u),document.head.appendChild(h),l)return new Promise((T,v)=>{h.addEventListener("load",T),h.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${c}`)))})}))}function i(r){const u=new Event("vite:preloadError",{cancelable:!0});if(u.payload=r,window.dispatchEvent(u),!u.defaultPrevented)throw r}return a.then(r=>{for(const u of r||[])u.status==="rejected"&&i(u.reason);return e().catch(i)})},j={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class B{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const st=new Se(-1,1,1,-1,0,1);class at extends Pe{constructor(){super(),this.setAttribute("position",new Z([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Z([0,2,0,0,2,0],2))}}const rt=new at;class J{constructor(e){this._mesh=new q(rt,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,st)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class _e extends B{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof P?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=X.clone(e.uniforms),this.material=new P({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new J(this.material)}render(e,t,s){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=s.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class he extends B{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,s){const a=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let r,u;this.inverse?(r=0,u=1):(r=1,u=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),i.buffers.stencil.setFunc(a.ALWAYS,r,4294967295),i.buffers.stencil.setClear(u),i.buffers.stencil.setLocked(!0),e.setRenderTarget(s),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(a.EQUAL,1,4294967295),i.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),i.buffers.stencil.setLocked(!0)}}class ot extends B{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class nt{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const s=e.getSize(new x);this._width=s.width,this._height=s.height,t=new k(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:W}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new _e(j),this.copyPass.material.blending=Ee,this.timer=new ye}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let s=!1;for(let a=0,i=this.passes.length;a<i;a++){const r=this.passes[a];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(a),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,s),r.needsSwap){if(s){const u=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(u.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(u.EQUAL,1,4294967295)}this.swapBuffers()}he!==void 0&&(r instanceof he?s=!0:r instanceof ot&&(s=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new x);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const s=this._width*this._pixelRatio,a=this._height*this._pixelRatio;this.renderTarget1.setSize(s,a),this.renderTarget2.setSize(s,a);for(let i=0;i<this.passes.length;i++)this.passes[i].setSize(s,a)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class lt extends B{constructor(e,t,s=null,a=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=s,this.clearColor=a,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new F}render(e,t,s){const a=e.autoClear;e.autoClear=!1;let i,r;this.overrideMaterial!==null&&(r=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:s),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=r),e.autoClear=a}}const ut={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new F(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class U extends B{constructor(e,t=1,s,a){super(),this.strength=t,this.radius=s,this.threshold=a,this.resolution=e!==void 0?new x(e.x,e.y):new x(256,256),this.clearColor=new F(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);this.renderTargetBright=new k(i,r,{type:W}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let l=0;l<this.nMips;l++){const f=new k(i,r,{type:W});f.texture.name="UnrealBloomPass.h"+l,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);const h=new k(i,r,{type:W});h.texture.name="UnrealBloomPass.v"+l,h.texture.generateMipmaps=!1,this.renderTargetsVertical.push(h),i=Math.round(i/2),r=Math.round(r/2)}const u=ut;this.highPassUniforms=X.clone(u.uniforms),this.highPassUniforms.luminosityThreshold.value=a,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new P({uniforms:this.highPassUniforms,vertexShader:u.vertexShader,fragmentShader:u.fragmentShader}),this.separableBlurMaterials=[];const n=[6,10,14,18,22];i=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);for(let l=0;l<this.nMips;l++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(n[l])),this.separableBlurMaterials[l].uniforms.invSize.value=new x(1/i,1/r),i=Math.round(i/2),r=Math.round(r/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new S(1,1,1),new S(1,1,1),new S(1,1,1),new S(1,1,1),new S(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=X.clone(j.uniforms),this.blendMaterial=new P({uniforms:this.copyUniforms,vertexShader:j.vertexShader,fragmentShader:j.fragmentShader,premultipliedAlpha:!0,blending:Ae,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new F,this._oldClearAlpha=1,this._basic=new Re,this._fsQuad=new J(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let s=Math.round(e/2),a=Math.round(t/2);this.renderTargetBright.setSize(s,a);for(let i=0;i<this.nMips;i++)this.renderTargetsHorizontal[i].setSize(s,a),this.renderTargetsVertical[i].setSize(s,a),this.separableBlurMaterials[i].uniforms.invSize.value=new x(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2)}render(e,t,s,a,i){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const r=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),i&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=s.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=s.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let u=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=u.texture,this.separableBlurMaterials[n].uniforms.direction.value=U.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[n]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=U.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[n]),e.clear(),this._fsQuad.render(e),u=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,i&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(s),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=r}_getSeparableBlurMaterial(e){const t=[],s=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(s*s))/s);return new P({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new x(.5,.5)},direction:{value:new x(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new P({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}}U.BlurDirectionX=new x(1,0);U.BlurDirectionY=new x(0,1);const Q={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`};class ht extends B{constructor(){super(),this.isOutputPass=!0,this.uniforms=X.clone(Q.uniforms),this.material=new De({name:Q.name,uniforms:this.uniforms,vertexShader:Q.vertexShader,fragmentShader:Q.fragmentShader}),this._fsQuad=new J(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,s){this.uniforms.tDiffuse.value=s.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},Fe.getTransfer(this._outputColorSpace)===Ue&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Be?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Ne?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Oe?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===me?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===ze?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Ie?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===Le&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}function ct(o){let e=7921;const t=()=>(e=1664525*e+1013904223>>>0,e/4294967296),s=new re;s.name="shared-coastal-landforms",o.add(s);function a(n,c,l,f,h){const T=(m,_)=>{const b=Math.max(0,1-(m/l)**2-(_/f)**2);return Math.pow(b,.7)*(h*(.7+.18*Math.sin(m*.14+_*.06)+.12*Math.sin(m*.31-_*.22))+2*Math.sin(m*.8+_*.5))-.5},v=new ge(l*2,f*2,110,70);v.rotateX(-Math.PI/2);const L=v.attributes.position,ae=[];for(let m=0;m<L.count;m++){const _=L.getX(m),b=L.getZ(m),O=T(_,b);L.setY(m,O);const A=O>h*.2&&Math.sin(_*.32+b*.44)+Math.cos(b*.24)<1.1,H=new F(A?2377004:7566955);H.multiplyScalar(.8+t()*.35),ae.push(H.r,H.g,H.b)}v.setAttribute("color",new Z(ae,3)),v.computeVertexNormals();const G=new q(v,new D({vertexColors:!0,roughness:1}));G.position.set(n,0,c),G.receiveShadow=!0,G.castShadow=!0,s.add(G);const V=new ne(new oe(1,1),new D({color:16777215,roughness:1}),3200),N=new le;for(let m=0;m<3200;m++){let _=(t()-.5)*l*1.65,b=(t()-.5)*f*1.65,O=T(_,b);if(O<3){m--;continue}const A=.5+t()*.9;N.position.set(n+_,O-A*.3,c+b),N.scale.set(A*1.5,A*.8,A*1.3),N.rotation.set(0,t()*6,0),N.updateMatrix(),V.setMatrixAt(m,N.matrix),V.setColorAt(m,new F().setHSL(.26+t()*.07,.28+t()*.25,.13+t()*.08))}V.castShadow=!0,s.add(V)}a(90,-340,105,40,29),a(114,-58,64,78,29);const i=new re;i.name="shared-tide-debris",o.add(i);const r=[new pe(1,7,4),new oe(1,0),new Ge(1,.12,4,7,3.5)],u=[new D({color:15655368}),new D({color:7237991}),new D({color:4801331})];for(let n=0;n<3;n++){const c=new ne(r[n],u[n],240),l=new le;for(let f=0;f<240;f++){const h=(t()-.5)*150,T=Je(h)+3.8+t()*1.5+Math.sin(h*1.7)*.4,v=.045+t()*.1;l.position.set(h,ve(h,T)+.025,T),l.scale.set(v*(n===2?2:1),v*.3,v*.7),l.rotation.set(0,t()*6,0),l.updateMatrix(),c.setMatrixAt(f,l.matrix)}c.castShadow=!0,i.add(c)}}const d=new URLSearchParams(location.search),K=location.pathname.endsWith("/game.html");K&&(d.set("explore","1"),d.delete("cam"),d.has("group")||d.set("group","B"));const ee=location.pathname.endsWith("/compare.html");ee&&(d.set("explore","1"),d.delete("cam"));const p=new Ve({antialias:!0});p.setPixelRatio(Math.min(devicePixelRatio,1.5));p.setSize(innerWidth,innerHeight);p.toneMapping=me;p.toneMappingExposure=.65;p.shadowMap.enabled=!0;p.shadowMap.type=He;document.body.appendChild(p.domElement);const g=new Qe;g.fog=new ke(10470612,7e-4);const M=new We(52,innerWidth/innerHeight,.1,4e3),ft=new q(new pe(1800,32,16),new P({side:je,depthWrite:!1,uniforms:{},vertexShader:"varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:`
 varying vec3 direction;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 col=mix(vec3(.24,.53,.79),vec3(.012,.15,.48),pow(h,.28));
 vec2 uv=vec2(atan(d.x,-d.z),asin(d.y));
 float cloud=0.;float shade=0.;
 for(int i=0;i<4;i++){vec2 center=vec2(-.65+float(i)*.76,.19+.09*sin(float(i)*2.));
 vec2 q=(uv-center)/vec2(.115,.045);
 float billow=min(length(q-vec2(-.65,.02)),min(length((q-vec2(.0,.36))*vec2(.85,.8)),length(q-vec2(.75,-.04))));
 float n=noise(uv*85.)*.10+noise(uv*173.)*.04;
 cloud=max(cloud,1.-smoothstep(.72,1.12,billow+n));shade=max(shade,clamp(q.y*.30+.55,0.,1.)*cloud);}
 col=mix(col,mix(vec3(.47,.59,.72),vec3(1.5,1.42,1.28),shade),cloud*.95);
 float sun=pow(max(0.,dot(d,normalize(vec3(.45,.38,-.8)))),850.);col+=vec3(5.,3.8,2.3)*sun;
 gl_FragColor=vec4(col,1.);}`}));g.add(ft);const Me=new S(.45,.38,-.8).normalize();g.add(new Xe(12115967,13215607,1.25));const E=new qe(16766880,3.4);E.position.copy(Me).multiplyScalar(100);g.add(E);E.castShadow=!0;E.shadow.mapSize.set(4096,4096);Object.assign(E.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:5,far:200});E.shadow.bias=-5e-5;E.shadow.normalBias=.03;const Y=new ge(2,2,500,500);Y.rotateX(-Math.PI/2);const R=Y.attributes.position;for(let o=0;o<R.count;o++){const e=Math.sign(R.getX(o))*R.getX(o)**2*2200,t=Math.sign(R.getZ(o))*R.getZ(o)**2*2200;R.setXYZ(o,e,ve(e,t),t)}Y.computeVertexNormals();const we=new D({color:16045995,roughness:.92}),w=Ye(Me);g.add(w);Ze(we,w.material.uniforms.time);const be=new q(Y,we);be.receiveShadow=!0;g.add(be);ct(g);g.add(xe);const{config:z,results:te}=await et(d.get("group")||"A"),ie=z.cameras[d.get("cam")]||z.cameras.wide;M.position.fromArray(ie.pos);M.lookAt(new S().fromArray(ie.target));const Te=d.get("explore")==="1"&&!d.has("cam");let C;!Te&&!d.has("cam")&&(C=new $e(M,p.domElement),C.target.fromArray(ie.target),C.maxPolarAngle=Math.PI*.48,C.minDistance=2,C.maxDistance=180,C.enableDamping=!0);const dt=new _e({uniforms:{tDiffuse:{value:null}},vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);gl_FragColor=any(isnan(c))||any(isinf(c))?vec4(0.,0.,0.,1.):min(c,vec4(1e4));}"}),y=new nt(p);y.addPass(new lt(g,M));y.addPass(dt);y.addPass(new U(new x(innerWidth,innerHeight),.035,.4,3));y.addPass(new ht);const I=ee?await(await $(async()=>{const{createComparison:o}=await import("./compare-CM-4TrOs.js");return{createComparison:o}},__vite__mapDeps([0,1,2,3,4]))).createComparison({scene:g,camera:M,renderer:p,composer:y,config:z,results:te,initialGroup:d.get("group")||"A"}):null,se=Te?(await $(async()=>{const{createExplore:o}=await import("./explore-HHlsr2Ey.js");return{createExplore:o}},__vite__mapDeps([5,1,2,6]))).createExplore({scene:g,camera:M,renderer:p,config:z,results:te,group:d.get("group")||"A",auto:d.get("auto")==="1",comparison:ee,gameMode:K}):null,ce=K?await(await $(async()=>{const{createGame:o}=await import("./index-C1NQs95Y.js");return{createGame:o}},__vite__mapDeps([7,1,2,8,9,10,11]))).createGame({scene:g,camera:M,renderer:p,water:w,config:z,explore:se,auto:d.get("auto")==="1"}):null;let fe=performance.now(),de=w.material.uniforms.time.value;I?.connect(se);const mt=new Ke,pt=d.has("time")?Number(d.get("time")):null;function Ce(){requestAnimationFrame(Ce),w.material.uniforms.time.value=window.__TIME__??pt??mt.getElapsedTime(),C?.update();const o=performance.now(),e=Math.max(0,Math.min(.1,w.material.uniforms.time.value-de));se?.update(K?e:(o-fe)/1e3),ce?.update(e,w.material.uniforms.time.value),de=w.material.uniforms.time.value,fe=o,I?I.render():ce?.suspended||y.render()}Ce();window.__SCENE__={scene:g,camera:M,water:w,propRoot:xe,results:te,renderer:p};window.__READY__=!0;addEventListener("resize",()=>{if(I){I.resize();return}M.aspect=innerWidth/innerHeight,M.updateProjectionMatrix(),p.setSize(innerWidth,innerHeight),y.setSize(innerWidth,innerHeight)});
