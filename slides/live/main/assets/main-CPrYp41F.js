const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/compare-D9ZE02Th.js","assets/props-B_xnBcxz.js","assets/GLTFLoader-BHvbDJQJ.js","assets/compare-CBcrXqmb.css","assets/ui-CFe6ZiZZ.css","assets/explore-DCgZhQiy.js","assets/explore-B6A3MxAo.css","assets/index-DAhNPxHS.js","assets/water-C4rnm7ra.js","assets/character-BG_2zSqH.js","assets/species-BwhzQEuU.js","assets/index-mNTWrKiL.css"])))=>i.map(i=>d[i]);
import{M as q,O as Ce,d as Se,F as Z,e as P,U as X,f as x,g as k,h as W,N as Pe,T as Ee,C as R,V as S,i as Ae,j as ye,R as Re,k as De,l as Fe,L as Be,m as Ne,n as Ue,A as me,o as Oe,p as Ie,q as Le,G as re,r as pe,I as oe,s as ze,b as y,t as ne,u as le,a as ge,W as Ge,P as Ve,S as He,v as Qe,c as ke,w as We,H as je,D as Xe,x as qe}from"./GLTFLoader-BHvbDJQJ.js";import{c as Ke,s as Ye}from"./water-C4rnm7ra.js";import{O as Ze}from"./OrbitControls-Bg1yRkI1.js";import{g as ve,s as $e,p as xe,l as Je}from"./props-B_xnBcxz.js";const et="modulepreload",tt=function(o){return"/"+o},he={},$=function(e,t,i){let a=Promise.resolve();if(t&&t.length>0){let n=function(c){return Promise.all(c.map(l=>Promise.resolve(l).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),h=r?.nonce||r?.getAttribute("nonce");a=n(t.map(c=>{if(c=tt(c),c in he)return;he[c]=!0;const l=c.endsWith(".css"),f=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${f}`))return;const u=document.createElement("link");if(u.rel=l?"stylesheet":et,l||(u.as="script"),u.crossOrigin="",u.href=c,h&&u.setAttribute("nonce",h),document.head.appendChild(u),l)return new Promise((T,v)=>{u.addEventListener("load",T),u.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(r){const h=new Event("vite:preloadError",{cancelable:!0});if(h.payload=r,window.dispatchEvent(h),!h.defaultPrevented)throw r}return a.then(r=>{for(const h of r||[])h.status==="rejected"&&s(h.reason);return e().catch(s)})},j={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class F{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const st=new Ce(-1,1,1,-1,0,1);class it extends Se{constructor(){super(),this.setAttribute("position",new Z([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Z([0,2,0,0,2,0],2))}}const at=new it;class J{constructor(e){this._mesh=new q(at,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,st)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class rt extends F{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof P?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=X.clone(e.uniforms),this.material=new P({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new J(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class ue extends F{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){const a=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let r,h;this.inverse?(r=0,h=1):(r=1,h=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),s.buffers.stencil.setFunc(a.ALWAYS,r,4294967295),s.buffers.stencil.setClear(h),s.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(a.EQUAL,1,4294967295),s.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),s.buffers.stencil.setLocked(!0)}}class ot extends F{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class nt{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const i=e.getSize(new x);this._width=i.width,this._height=i.height,t=new k(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:W}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new rt(j),this.copyPass.material.blending=Pe,this.timer=new Ee}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let i=!1;for(let a=0,s=this.passes.length;a<s;a++){const r=this.passes[a];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(a),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),r.needsSwap){if(i){const h=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(h.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(h.EQUAL,1,4294967295)}this.swapBuffers()}ue!==void 0&&(r instanceof ue?i=!0:r instanceof ot&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new x);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const i=this._width*this._pixelRatio,a=this._height*this._pixelRatio;this.renderTarget1.setSize(i,a),this.renderTarget2.setSize(i,a);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(i,a)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class lt extends F{constructor(e,t,i=null,a=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=i,this.clearColor=a,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new R}render(e,t,i){const a=e.autoClear;e.autoClear=!1;let s,r;this.overrideMaterial!==null&&(r=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=r),e.autoClear=a}}const ht={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new R(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class D extends F{constructor(e,t=1,i,a){super(),this.strength=t,this.radius=i,this.threshold=a,this.resolution=e!==void 0?new x(e.x,e.y):new x(256,256),this.clearColor=new R(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);this.renderTargetBright=new k(s,r,{type:W}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let l=0;l<this.nMips;l++){const f=new k(s,r,{type:W});f.texture.name="UnrealBloomPass.h"+l,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);const u=new k(s,r,{type:W});u.texture.name="UnrealBloomPass.v"+l,u.texture.generateMipmaps=!1,this.renderTargetsVertical.push(u),s=Math.round(s/2),r=Math.round(r/2)}const h=ht;this.highPassUniforms=X.clone(h.uniforms),this.highPassUniforms.luminosityThreshold.value=a,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new P({uniforms:this.highPassUniforms,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader}),this.separableBlurMaterials=[];const n=[6,10,14,18,22];s=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);for(let l=0;l<this.nMips;l++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(n[l])),this.separableBlurMaterials[l].uniforms.invSize.value=new x(1/s,1/r),s=Math.round(s/2),r=Math.round(r/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new S(1,1,1),new S(1,1,1),new S(1,1,1),new S(1,1,1),new S(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=X.clone(j.uniforms),this.blendMaterial=new P({uniforms:this.copyUniforms,vertexShader:j.vertexShader,fragmentShader:j.fragmentShader,premultipliedAlpha:!0,blending:Ae,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new R,this._oldClearAlpha=1,this._basic=new ye,this._fsQuad=new J(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let i=Math.round(e/2),a=Math.round(t/2);this.renderTargetBright.setSize(i,a);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(i,a),this.renderTargetsVertical[s].setSize(i,a),this.separableBlurMaterials[s].uniforms.invSize.value=new x(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2)}render(e,t,i,a,s){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const r=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=i.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let h=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=h.texture,this.separableBlurMaterials[n].uniforms.direction.value=D.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[n]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=D.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[n]),e.clear(),this._fsQuad.render(e),h=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(i),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=r}_getSeparableBlurMaterial(e){const t=[],i=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(i*i))/i);return new P({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new x(.5,.5)},direction:{value:new x(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}}D.BlurDirectionX=new x(1,0);D.BlurDirectionY=new x(0,1);const Q={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`};class ut extends F{constructor(){super(),this.isOutputPass=!0,this.uniforms=X.clone(Q.uniforms),this.material=new Re({name:Q.name,uniforms:this.uniforms,vertexShader:Q.vertexShader,fragmentShader:Q.fragmentShader}),this._fsQuad=new J(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,i){this.uniforms.tDiffuse.value=i.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},De.getTransfer(this._outputColorSpace)===Fe&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Be?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Ne?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Ue?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===me?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Oe?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Ie?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===Le&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}function ct(o){let e=7921;const t=()=>(e=1664525*e+1013904223>>>0,e/4294967296),i=new re;i.name="shared-coastal-landforms",o.add(i);function a(n,c,l,f,u){const T=(m,_)=>{const b=Math.max(0,1-(m/l)**2-(_/f)**2);return Math.pow(b,.7)*(u*(.7+.18*Math.sin(m*.14+_*.06)+.12*Math.sin(m*.31-_*.22))+2*Math.sin(m*.8+_*.5))-.5},v=new ge(l*2,f*2,110,70);v.rotateX(-Math.PI/2);const z=v.attributes.position,ae=[];for(let m=0;m<z.count;m++){const _=z.getX(m),b=z.getZ(m),O=T(_,b);z.setY(m,O);const E=O>u*.2&&Math.sin(_*.32+b*.44)+Math.cos(b*.24)<1.1,H=new R(E?2377004:7566955);H.multiplyScalar(.8+t()*.35),ae.push(H.r,H.g,H.b)}v.setAttribute("color",new Z(ae,3)),v.computeVertexNormals();const G=new q(v,new y({vertexColors:!0,roughness:1}));G.position.set(n,0,c),G.receiveShadow=!0,G.castShadow=!0,i.add(G);const V=new ne(new oe(1,1),new y({color:16777215,roughness:1}),3200),U=new le;for(let m=0;m<3200;m++){let _=(t()-.5)*l*1.65,b=(t()-.5)*f*1.65,O=T(_,b);if(O<3){m--;continue}const E=.5+t()*.9;U.position.set(n+_,O-E*.3,c+b),U.scale.set(E*1.5,E*.8,E*1.3),U.rotation.set(0,t()*6,0),U.updateMatrix(),V.setMatrixAt(m,U.matrix),V.setColorAt(m,new R().setHSL(.26+t()*.07,.28+t()*.25,.13+t()*.08))}V.castShadow=!0,i.add(V)}a(90,-340,105,40,29),a(114,-58,64,78,29);const s=new re;s.name="shared-tide-debris",o.add(s);const r=[new pe(1,7,4),new oe(1,0),new ze(1,.12,4,7,3.5)],h=[new y({color:15655368}),new y({color:7237991}),new y({color:4801331})];for(let n=0;n<3;n++){const c=new ne(r[n],h[n],240),l=new le;for(let f=0;f<240;f++){const u=(t()-.5)*150,T=$e(u)+3.8+t()*1.5+Math.sin(u*1.7)*.4,v=.045+t()*.1;l.position.set(u,ve(u,T)+.025,T),l.scale.set(v*(n===2?2:1),v*.3,v*.7),l.rotation.set(0,t()*6,0),l.updateMatrix(),c.setMatrixAt(f,l.matrix)}c.castShadow=!0,s.add(c)}}const d=new URLSearchParams(location.search),K=location.pathname.endsWith("/game.html");K&&(d.set("explore","1"),d.delete("cam"),d.has("group")||d.set("group","B"));const ee=location.pathname.endsWith("/compare.html");ee&&(d.set("explore","1"),d.delete("cam"));const p=new Ge({antialias:!0});p.setPixelRatio(Math.min(devicePixelRatio,1.5));p.setSize(innerWidth,innerHeight);p.toneMapping=me;p.toneMappingExposure=.65;p.shadowMap.enabled=!0;p.shadowMap.type=Ve;document.body.appendChild(p.domElement);const g=new He;g.fog=new Qe(10470612,7e-4);const M=new ke(52,innerWidth/innerHeight,.1,4e3),ft=new q(new pe(1800,32,16),new P({side:We,depthWrite:!1,uniforms:{},vertexShader:"varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:`
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
 gl_FragColor=vec4(col,1.);}`}));g.add(ft);const _e=new S(.45,.38,-.8).normalize();g.add(new je(12115967,13215607,1.25));const B=new Xe(16766880,3.4);B.position.copy(_e).multiplyScalar(100);g.add(B);B.castShadow=!0;B.shadow.mapSize.set(2048,2048);Object.assign(B.shadow.camera,{left:-65,right:65,top:65,bottom:-65});B.shadow.bias=-4e-4;const Y=new ge(2,2,500,500);Y.rotateX(-Math.PI/2);const A=Y.attributes.position;for(let o=0;o<A.count;o++){const e=Math.sign(A.getX(o))*A.getX(o)**2*2200,t=Math.sign(A.getZ(o))*A.getZ(o)**2*2200;A.setXYZ(o,e,ve(e,t),t)}Y.computeVertexNormals();const Me=new y({color:16045995,roughness:.92}),w=Ke(_e);g.add(w);Ye(Me,w.material.uniforms.time);const we=new q(Y,Me);we.receiveShadow=!0;g.add(we);ct(g);g.add(xe);const{config:I,results:te}=await Je(d.get("group")||"A"),se=I.cameras[d.get("cam")]||I.cameras.wide;M.position.fromArray(se.pos);M.lookAt(new S().fromArray(se.target));const be=d.get("explore")==="1"&&!d.has("cam");let C;!be&&!d.has("cam")&&(C=new Ze(M,p.domElement),C.target.fromArray(se.target),C.maxPolarAngle=Math.PI*.48,C.minDistance=2,C.maxDistance=180,C.enableDamping=!0);const N=new nt(p);N.addPass(new lt(g,M));N.addPass(new D(new x(innerWidth,innerHeight),.035,.4,3));N.addPass(new ut);const L=ee?await(await $(async()=>{const{createComparison:o}=await import("./compare-D9ZE02Th.js");return{createComparison:o}},__vite__mapDeps([0,1,2,3,4]))).createComparison({scene:g,camera:M,renderer:p,composer:N,config:I,results:te,initialGroup:d.get("group")||"A"}):null,ie=be?(await $(async()=>{const{createExplore:o}=await import("./explore-DCgZhQiy.js");return{createExplore:o}},__vite__mapDeps([5,1,2,6]))).createExplore({scene:g,camera:M,renderer:p,config:I,results:te,group:d.get("group")||"A",auto:d.get("auto")==="1",comparison:ee,gameMode:K}):null,ce=K?await(await $(async()=>{const{createGame:o}=await import("./index-DAhNPxHS.js");return{createGame:o}},__vite__mapDeps([7,1,2,8,9,10,11]))).createGame({scene:g,camera:M,renderer:p,water:w,config:I,explore:ie,auto:d.get("auto")==="1"}):null;let fe=performance.now(),de=w.material.uniforms.time.value;L?.connect(ie);const dt=new qe,mt=d.has("time")?Number(d.get("time")):null;function Te(){requestAnimationFrame(Te),w.material.uniforms.time.value=window.__TIME__??mt??dt.getElapsedTime(),C?.update();const o=performance.now(),e=Math.max(0,Math.min(.1,w.material.uniforms.time.value-de));ie?.update(K?e:(o-fe)/1e3),ce?.update(e,w.material.uniforms.time.value),de=w.material.uniforms.time.value,fe=o,L?L.render():ce?.suspended||N.render()}Te();window.__SCENE__={scene:g,camera:M,water:w,propRoot:xe,results:te,renderer:p};window.__READY__=!0;addEventListener("resize",()=>{if(L){L.resize();return}M.aspect=innerWidth/innerHeight,M.updateProjectionMatrix(),p.setSize(innerWidth,innerHeight),N.setSize(innerWidth,innerHeight)});
