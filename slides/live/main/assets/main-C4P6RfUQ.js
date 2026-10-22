const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./compare-B_FU29wX.js","./props-DUNbACCA.js","./url-D9h6cwyH.js","./credits-DDKuO3lD.js","./compare-CBcrXqmb.css","./ui-CFe6ZiZZ.css","./explore-CjjbvMbn.js","./coast-DwqGpoed.js","./explore-B6A3MxAo.css","./index-fhp90R2Z.js","./character-BXUafPRc.js","./scene-DMnWWgKl.js","./index-B1bjt1r_.css"])))=>i.map(i=>d[i]);
import{M as k,O as ne,e as ue,F as X,f as M,U as z,g as d,h as U,i as B,N as he,T as fe,C as O,V as b,j as ce,k as me,R as de,l as pe,m as ge,L as ve,n as _e,o as xe,A as ee,p as be,q as Me,r as Te,W as we,P as Ce,S as Se,s as Pe,c as Ee,t as ye,u as Re,H as Ae,D as De,a as Fe,b as Ue,v as Be}from"./url-D9h6cwyH.js";import{c as Ne,s as ze,a as Oe}from"./coast-DwqGpoed.js";import{O as Le}from"./OrbitControls-Bf33PwBr.js";import{g as Ie,p as te,l as Ve}from"./props-DUNbACCA.js";import{l as A}from"./lite-CsUg0vFM.js";const ke="modulepreload",Ge=function(r,e){return new URL(r,e).href},K={},G=function(e,t,s){let a=Promise.resolve();if(t&&t.length>0){let V=function(n){return Promise.all(n.map(m=>Promise.resolve(m).then(v=>({status:"fulfilled",value:v}),v=>({status:"rejected",reason:v}))))};const o=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),u=l?.nonce||l?.getAttribute("nonce");a=V(t.map(n=>{if(n=Ge(n,s),n in K)return;K[n]=!0;const m=n.endsWith(".css"),v=m?'[rel="stylesheet"]':"";if(s)for(let E=o.length-1;E>=0;E--){const D=o[E];if(D.href===n&&(!m||D.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${n}"]${v}`))return;const _=document.createElement("link");if(_.rel=m?"stylesheet":ke,m||(_.as="script"),_.crossOrigin="",_.href=n,u&&_.setAttribute("nonce",u),document.head.appendChild(_),m)return new Promise((E,D)=>{_.addEventListener("load",E),_.addEventListener("error",()=>D(new Error(`Unable to preload CSS for ${n}`)))})}))}function i(o){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=o,window.dispatchEvent(l),!l.defaultPrevented)throw o}return a.then(o=>{for(const l of o||[])l.status==="rejected"&&i(l.reason);return e().catch(i)})},N={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class P{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const He=new ne(-1,1,1,-1,0,1);class Qe extends ue{constructor(){super(),this.setAttribute("position",new X([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new X([0,2,0,0,2,0],2))}}const We=new Qe;class H{constructor(e){this._mesh=new k(We,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,He)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class ie extends P{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof M?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=z.clone(e.uniforms),this.material=new M({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new H(this.material)}render(e,t,s){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=s.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class Y extends P{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,s){const a=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let o,l;this.inverse?(o=0,l=1):(o=1,l=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),i.buffers.stencil.setFunc(a.ALWAYS,o,4294967295),i.buffers.stencil.setClear(l),i.buffers.stencil.setLocked(!0),e.setRenderTarget(s),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(a.EQUAL,1,4294967295),i.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),i.buffers.stencil.setLocked(!0)}}class je extends P{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class qe{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const s=e.getSize(new d);this._width=s.width,this._height=s.height,t=new U(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:B}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new ie(N),this.copyPass.material.blending=he,this.timer=new fe}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let s=!1;for(let a=0,i=this.passes.length;a<i;a++){const o=this.passes[a];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(a),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,s),o.needsSwap){if(s){const l=this.renderer.getContext(),u=this.renderer.state.buffers.stencil;u.setFunc(l.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),u.setFunc(l.EQUAL,1,4294967295)}this.swapBuffers()}Y!==void 0&&(o instanceof Y?s=!0:o instanceof je&&(s=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new d);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const s=this._width*this._pixelRatio,a=this._height*this._pixelRatio;this.renderTarget1.setSize(s,a),this.renderTarget2.setSize(s,a);for(let i=0;i<this.passes.length;i++)this.passes[i].setSize(s,a)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Xe extends P{constructor(e,t,s=null,a=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=s,this.clearColor=a,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new O}render(e,t,s){const a=e.autoClear;e.autoClear=!1;let i,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:s),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=a}}const Ke={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new O(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class S extends P{constructor(e,t=1,s,a){super(),this.strength=t,this.radius=s,this.threshold=a,this.resolution=e!==void 0?new d(e.x,e.y):new d(256,256),this.clearColor=new O(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new U(i,o,{type:B}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let n=0;n<this.nMips;n++){const m=new U(i,o,{type:B});m.texture.name="UnrealBloomPass.h"+n,m.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(m);const v=new U(i,o,{type:B});v.texture.name="UnrealBloomPass.v"+n,v.texture.generateMipmaps=!1,this.renderTargetsVertical.push(v),i=Math.round(i/2),o=Math.round(o/2)}const l=Ke;this.highPassUniforms=z.clone(l.uniforms),this.highPassUniforms.luminosityThreshold.value=a,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new M({uniforms:this.highPassUniforms,vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}),this.separableBlurMaterials=[];const u=[6,10,14,18,22];i=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let n=0;n<this.nMips;n++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(u[n])),this.separableBlurMaterials[n].uniforms.invSize.value=new d(1/i,1/o),i=Math.round(i/2),o=Math.round(o/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const V=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=V,this.bloomTintColors=[new b(1,1,1),new b(1,1,1),new b(1,1,1),new b(1,1,1),new b(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=z.clone(N.uniforms),this.blendMaterial=new M({uniforms:this.copyUniforms,vertexShader:N.vertexShader,fragmentShader:N.fragmentShader,premultipliedAlpha:!0,blending:ce,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new O,this._oldClearAlpha=1,this._basic=new me,this._fsQuad=new H(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let s=Math.round(e/2),a=Math.round(t/2);this.renderTargetBright.setSize(s,a);for(let i=0;i<this.nMips;i++)this.renderTargetsHorizontal[i].setSize(s,a),this.renderTargetsVertical[i].setSize(s,a),this.separableBlurMaterials[i].uniforms.invSize.value=new d(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2)}render(e,t,s,a,i){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),i&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=s.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=s.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let l=this.renderTargetBright;for(let u=0;u<this.nMips;u++)this._fsQuad.material=this.separableBlurMaterials[u],this.separableBlurMaterials[u].uniforms.colorTexture.value=l.texture,this.separableBlurMaterials[u].uniforms.direction.value=S.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[u]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[u].uniforms.colorTexture.value=this.renderTargetsHorizontal[u].texture,this.separableBlurMaterials[u].uniforms.direction.value=S.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[u]),e.clear(),this._fsQuad.render(e),l=this.renderTargetsVertical[u];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,i&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(s),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){const t=[],s=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(s*s))/s);return new M({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new d(.5,.5)},direction:{value:new d(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new M({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}}S.BlurDirectionX=new d(1,0);S.BlurDirectionY=new d(0,1);const F={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`};class Ye extends P{constructor(){super(),this.isOutputPass=!0,this.uniforms=z.clone(F.uniforms),this.material=new de({name:F.name,uniforms:this.uniforms,vertexShader:F.vertexShader,fragmentShader:F.fragmentShader}),this._fsQuad=new H(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,s){this.uniforms.tDiffuse.value=s.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},pe.getTransfer(this._outputColorSpace)===ge&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===ve?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===_e?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===xe?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===ee?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===be?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Me?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===Te&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}const h=new URLSearchParams(location.search),L=location.pathname.endsWith("/game.html");L&&(h.set("explore","1"),h.delete("cam"),h.has("group")||h.set("group","B"));const Q=location.pathname.endsWith("/compare.html");Q&&(h.set("explore","1"),h.delete("cam"));const f=new we({antialias:!A});f.setPixelRatio(A?1:Math.min(devicePixelRatio,1.5));f.setSize(innerWidth,innerHeight);f.toneMapping=ee;f.toneMappingExposure=.65;f.shadowMap.enabled=!0;f.shadowMap.type=Ce;document.body.appendChild(f.domElement);const c=new Se;c.fog=new Pe(10470612,7e-4);const g=new Ee(52,innerWidth/innerHeight,.1,4e3),$e=new k(new ye(1800,32,16),new M({side:Re,depthWrite:!1,uniforms:{},vertexShader:"varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:`
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
 // Small fair-weather cumulus scattered low around the horizon, all the way round.
 for(int i=0;i<30;i++){float fi=float(i),k=fract(sin(fi*5.1)*17.3);if(fract(sin(fi*2.3)*61.7)<.3)continue;
 vec2 center=vec2(-3.1+fi*.21+.2*(fract(sin(fi*11.7)*91.3)-.5),.04+.11*fract(sin(fi*3.7)*43.1)*fract(sin(fi*1.9)*29.3));
 vec2 q=(uv-center)/(vec2(.04,.016)*(.4+.9*k*k));
 float billow=min(length(q-vec2(-.55,.05)),min(length((q-vec2(.05,.4))*vec2(.9,.85)),length(q-vec2(.6,-.02))));
 float n=noise(uv*140.)*.14+noise(uv*290.)*.06,c=1.-smoothstep(.7,1.1,billow+n);
 shade=max(shade,clamp(q.y*.3+.55,0.,1.)*c*(1.-cloud));cloud=max(cloud,c);}
 col=mix(col,mix(vec3(.47,.59,.72),vec3(1.5,1.42,1.28),shade),cloud*.95);
 float sun=pow(max(0.,dot(d,normalize(vec3(.45,.38,-.8)))),850.);col+=vec3(5.,3.8,2.3)*sun;
 gl_FragColor=vec4(col,1.);}`}));c.add($e);const se=new b(.45,.38,-.8).normalize();c.add(new Ae(12115967,13215607,1.25));const T=new De(16766880,3.4);T.position.copy(se).multiplyScalar(100);c.add(T);T.castShadow=!0;T.shadow.mapSize.setScalar(A?2048:4096);Object.assign(T.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:5,far:200});T.shadow.bias=-5e-5;T.shadow.normalBias=.03;const I=new Fe(2,2,500,500);I.rotateX(-Math.PI/2);const C=I.attributes.position;for(let r=0;r<C.count;r++){const e=Math.sign(C.getX(r))*C.getX(r)**2*2200,t=Math.sign(C.getZ(r))*C.getZ(r)**2*2200;C.setXYZ(r,e,Ie(e,t),t)}I.computeVertexNormals();const ae=new Ue({color:16045995,roughness:.92}),p=Ne(se);c.add(p);ze(ae,p.material.uniforms.time);const re=new k(I,ae);re.receiveShadow=!0;c.add(re);Oe(c);A&&c.getObjectByName("island-vegetation").traverse(r=>{r.castShadow=!1});c.add(te);const{config:y,results:W}=await Ve(h.get("group")||"A"),j=y.cameras[h.get("cam")]||y.cameras.wide;g.position.fromArray(j.pos);g.lookAt(new b().fromArray(j.target));const oe=h.get("explore")==="1"&&!h.has("cam");let x;!oe&&!h.has("cam")&&(x=new Le(g,f.domElement),x.target.fromArray(j.target),x.maxPolarAngle=Math.PI*.48,x.minDistance=2,x.maxDistance=180,x.enableDamping=!0);const Ze=new ie({uniforms:{tDiffuse:{value:null}},vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);gl_FragColor=any(isnan(c))||any(isinf(c))?vec4(0.,0.,0.,1.):min(c,vec4(1e4));}"}),w=new qe(f);w.addPass(new Xe(c,g));w.addPass(Ze);{const r=new S(new d(innerWidth,innerHeight),.035,.4,3);r.enabled=!A,w.addPass(r)}w.addPass(new Ye);const R=Q?await(await G(async()=>{const{createComparison:r}=await import("./compare-B_FU29wX.js");return{createComparison:r}},__vite__mapDeps([0,1,2,3,4,5]),import.meta.url)).createComparison({scene:c,camera:g,renderer:f,composer:w,config:y,results:W,initialGroup:h.get("group")||"A"}):null,q=oe?(await G(async()=>{const{createExplore:r}=await import("./explore-CjjbvMbn.js");return{createExplore:r}},__vite__mapDeps([6,1,2,7,3,8]),import.meta.url)).createExplore({scene:c,camera:g,renderer:f,config:y,results:W,group:h.get("group")||"A",auto:h.get("auto")==="1",comparison:Q,gameMode:L}):null,$=L?await(await G(async()=>{const{createGame:r}=await import("./index-fhp90R2Z.js");return{createGame:r}},__vite__mapDeps([9,1,2,7,10,11,3,12]),import.meta.url)).createGame({scene:c,camera:g,renderer:f,water:p,config:y,explore:q,auto:h.get("auto")==="1"}):null;let Z=performance.now(),J=p.material.uniforms.time.value;R?.connect(q);const Je=new Be,et=h.has("time")?Number(h.get("time")):null;function le(){requestAnimationFrame(le),p.material.uniforms.time.value=window.__TIME__??et??Je.getElapsedTime(),x?.update();const r=performance.now(),e=Math.max(0,Math.min(.1,p.material.uniforms.time.value-Math.max(J,p.userData.simTime??-1/0)));q?.update(L?e:(r-Z)/1e3),$?.update(e,p.material.uniforms.time.value),J=p.material.uniforms.time.value,Z=r,R?R.render():$?.suspended||w.render()}le();window.__SCENE__={scene:c,camera:g,water:p,propRoot:te,results:W,renderer:f};window.__READY__=!0;addEventListener("resize",()=>{if(R){R.resize();return}g.aspect=innerWidth/innerHeight,g.updateProjectionMatrix(),f.setSize(innerWidth,innerHeight),w.setSize(innerWidth,innerHeight)});
