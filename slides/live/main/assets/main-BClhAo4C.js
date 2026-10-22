const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./compare-CbWHG0ae.js","./props-Iwktg36J.js","./url-ddkRYY_O.js","./credits-BTc4fLkf.js","./compare-CBcrXqmb.css","./ui-CFe6ZiZZ.css","./explore-Yt733hfN.js","./coast-TORU_by-.js","./explore-B6A3MxAo.css","./index-BNntbVtQ.js","./character-BNYKatoE.js","./scene-DQmPcMSn.js","./index-CwpHbh3h.css"])))=>i.map(i=>d[i]);
import{M as V,O as le,e as ne,F as q,f as M,U as N,g as d,h as F,i as U,N as ue,T as he,C as z,V as b,j as fe,k as ce,R as me,l as de,m as pe,L as ge,n as ve,o as _e,A as J,p as xe,q as be,r as Me,W as Te,P as we,S as Ce,s as Se,c as Pe,t as Ee,u as ye,H as Re,D as Ae,a as De,b as Fe,v as Ue}from"./url-ddkRYY_O.js";import{c as Be,s as Ne,a as ze}from"./coast-TORU_by-.js";import{O as Oe}from"./OrbitControls-0Ez6uqKU.js";import{g as Le,p as ee,l as Ie}from"./props-Iwktg36J.js";const Ve="modulepreload",ke=function(o,e){return new URL(o,e).href},X={},k=function(e,t,s){let a=Promise.resolve();if(t&&t.length>0){let I=function(n){return Promise.all(n.map(m=>Promise.resolve(m).then(v=>({status:"fulfilled",value:v}),v=>({status:"rejected",reason:v}))))};const r=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),u=l?.nonce||l?.getAttribute("nonce");a=I(t.map(n=>{if(n=ke(n,s),n in X)return;X[n]=!0;const m=n.endsWith(".css"),v=m?'[rel="stylesheet"]':"";if(s)for(let E=r.length-1;E>=0;E--){const A=r[E];if(A.href===n&&(!m||A.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${n}"]${v}`))return;const _=document.createElement("link");if(_.rel=m?"stylesheet":Ve,m||(_.as="script"),_.crossOrigin="",_.href=n,u&&_.setAttribute("nonce",u),document.head.appendChild(_),m)return new Promise((E,A)=>{_.addEventListener("load",E),_.addEventListener("error",()=>A(new Error(`Unable to preload CSS for ${n}`)))})}))}function i(r){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=r,window.dispatchEvent(l),!l.defaultPrevented)throw r}return a.then(r=>{for(const l of r||[])l.status==="rejected"&&i(l.reason);return e().catch(i)})},B={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class P{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Ge=new le(-1,1,1,-1,0,1);class He extends ne{constructor(){super(),this.setAttribute("position",new q([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new q([0,2,0,0,2,0],2))}}const Qe=new He;class G{constructor(e){this._mesh=new V(Qe,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ge)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class te extends P{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof M?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=N.clone(e.uniforms),this.material=new M({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new G(this.material)}render(e,t,s){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=s.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class K extends P{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,s){const a=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let r,l;this.inverse?(r=0,l=1):(r=1,l=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),i.buffers.stencil.setFunc(a.ALWAYS,r,4294967295),i.buffers.stencil.setClear(l),i.buffers.stencil.setLocked(!0),e.setRenderTarget(s),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(a.EQUAL,1,4294967295),i.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),i.buffers.stencil.setLocked(!0)}}class We extends P{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class je{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const s=e.getSize(new d);this._width=s.width,this._height=s.height,t=new F(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:U}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new te(B),this.copyPass.material.blending=ue,this.timer=new he}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let s=!1;for(let a=0,i=this.passes.length;a<i;a++){const r=this.passes[a];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(a),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,s),r.needsSwap){if(s){const l=this.renderer.getContext(),u=this.renderer.state.buffers.stencil;u.setFunc(l.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),u.setFunc(l.EQUAL,1,4294967295)}this.swapBuffers()}K!==void 0&&(r instanceof K?s=!0:r instanceof We&&(s=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new d);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const s=this._width*this._pixelRatio,a=this._height*this._pixelRatio;this.renderTarget1.setSize(s,a),this.renderTarget2.setSize(s,a);for(let i=0;i<this.passes.length;i++)this.passes[i].setSize(s,a)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class qe extends P{constructor(e,t,s=null,a=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=s,this.clearColor=a,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new z}render(e,t,s){const a=e.autoClear;e.autoClear=!1;let i,r;this.overrideMaterial!==null&&(r=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:s),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=r),e.autoClear=a}}const Xe={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new z(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class S extends P{constructor(e,t=1,s,a){super(),this.strength=t,this.radius=s,this.threshold=a,this.resolution=e!==void 0?new d(e.x,e.y):new d(256,256),this.clearColor=new z(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);this.renderTargetBright=new F(i,r,{type:U}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let n=0;n<this.nMips;n++){const m=new F(i,r,{type:U});m.texture.name="UnrealBloomPass.h"+n,m.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(m);const v=new F(i,r,{type:U});v.texture.name="UnrealBloomPass.v"+n,v.texture.generateMipmaps=!1,this.renderTargetsVertical.push(v),i=Math.round(i/2),r=Math.round(r/2)}const l=Xe;this.highPassUniforms=N.clone(l.uniforms),this.highPassUniforms.luminosityThreshold.value=a,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new M({uniforms:this.highPassUniforms,vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}),this.separableBlurMaterials=[];const u=[6,10,14,18,22];i=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);for(let n=0;n<this.nMips;n++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(u[n])),this.separableBlurMaterials[n].uniforms.invSize.value=new d(1/i,1/r),i=Math.round(i/2),r=Math.round(r/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const I=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=I,this.bloomTintColors=[new b(1,1,1),new b(1,1,1),new b(1,1,1),new b(1,1,1),new b(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=N.clone(B.uniforms),this.blendMaterial=new M({uniforms:this.copyUniforms,vertexShader:B.vertexShader,fragmentShader:B.fragmentShader,premultipliedAlpha:!0,blending:fe,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new z,this._oldClearAlpha=1,this._basic=new ce,this._fsQuad=new G(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let s=Math.round(e/2),a=Math.round(t/2);this.renderTargetBright.setSize(s,a);for(let i=0;i<this.nMips;i++)this.renderTargetsHorizontal[i].setSize(s,a),this.renderTargetsVertical[i].setSize(s,a),this.separableBlurMaterials[i].uniforms.invSize.value=new d(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2)}render(e,t,s,a,i){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const r=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),i&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=s.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=s.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let l=this.renderTargetBright;for(let u=0;u<this.nMips;u++)this._fsQuad.material=this.separableBlurMaterials[u],this.separableBlurMaterials[u].uniforms.colorTexture.value=l.texture,this.separableBlurMaterials[u].uniforms.direction.value=S.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[u]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[u].uniforms.colorTexture.value=this.renderTargetsHorizontal[u].texture,this.separableBlurMaterials[u].uniforms.direction.value=S.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[u]),e.clear(),this._fsQuad.render(e),l=this.renderTargetsVertical[u];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,i&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(s),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=r}_getSeparableBlurMaterial(e){const t=[],s=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(s*s))/s);return new M({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new d(.5,.5)},direction:{value:new d(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}}S.BlurDirectionX=new d(1,0);S.BlurDirectionY=new d(0,1);const D={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`};class Ke extends P{constructor(){super(),this.isOutputPass=!0,this.uniforms=N.clone(D.uniforms),this.material=new me({name:D.name,uniforms:this.uniforms,vertexShader:D.vertexShader,fragmentShader:D.fragmentShader}),this._fsQuad=new G(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,s){this.uniforms.tDiffuse.value=s.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},de.getTransfer(this._outputColorSpace)===pe&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===ge?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===ve?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===_e?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===J?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===xe?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===be?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===Me&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}const h=new URLSearchParams(location.search),O=location.pathname.endsWith("/game.html");O&&(h.set("explore","1"),h.delete("cam"),h.has("group")||h.set("group","B"));const H=location.pathname.endsWith("/compare.html");H&&(h.set("explore","1"),h.delete("cam"));const f=new Te({antialias:!0});f.setPixelRatio(Math.min(devicePixelRatio,1.5));f.setSize(innerWidth,innerHeight);f.toneMapping=J;f.toneMappingExposure=.65;f.shadowMap.enabled=!0;f.shadowMap.type=we;document.body.appendChild(f.domElement);const c=new Ce;c.fog=new Se(10470612,7e-4);const g=new Pe(52,innerWidth/innerHeight,.1,4e3),Ye=new V(new Ee(1800,32,16),new M({side:ye,depthWrite:!1,uniforms:{},vertexShader:"varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:`
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
 gl_FragColor=vec4(col,1.);}`}));c.add(Ye);const ie=new b(.45,.38,-.8).normalize();c.add(new Re(12115967,13215607,1.25));const T=new Ae(16766880,3.4);T.position.copy(ie).multiplyScalar(100);c.add(T);T.castShadow=!0;T.shadow.mapSize.set(4096,4096);Object.assign(T.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:5,far:200});T.shadow.bias=-5e-5;T.shadow.normalBias=.03;const L=new De(2,2,500,500);L.rotateX(-Math.PI/2);const C=L.attributes.position;for(let o=0;o<C.count;o++){const e=Math.sign(C.getX(o))*C.getX(o)**2*2200,t=Math.sign(C.getZ(o))*C.getZ(o)**2*2200;C.setXYZ(o,e,Le(e,t),t)}L.computeVertexNormals();const se=new Fe({color:16045995,roughness:.92}),p=Be(ie);c.add(p);Ne(se,p.material.uniforms.time);const ae=new V(L,se);ae.receiveShadow=!0;c.add(ae);ze(c);c.add(ee);const{config:y,results:Q}=await Ie(h.get("group")||"A"),W=y.cameras[h.get("cam")]||y.cameras.wide;g.position.fromArray(W.pos);g.lookAt(new b().fromArray(W.target));const re=h.get("explore")==="1"&&!h.has("cam");let x;!re&&!h.has("cam")&&(x=new Oe(g,f.domElement),x.target.fromArray(W.target),x.maxPolarAngle=Math.PI*.48,x.minDistance=2,x.maxDistance=180,x.enableDamping=!0);const $e=new te({uniforms:{tDiffuse:{value:null}},vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);gl_FragColor=any(isnan(c))||any(isinf(c))?vec4(0.,0.,0.,1.):min(c,vec4(1e4));}"}),w=new je(f);w.addPass(new qe(c,g));w.addPass($e);w.addPass(new S(new d(innerWidth,innerHeight),.035,.4,3));w.addPass(new Ke);const R=H?await(await k(async()=>{const{createComparison:o}=await import("./compare-CbWHG0ae.js");return{createComparison:o}},__vite__mapDeps([0,1,2,3,4,5]),import.meta.url)).createComparison({scene:c,camera:g,renderer:f,composer:w,config:y,results:Q,initialGroup:h.get("group")||"A"}):null,j=re?(await k(async()=>{const{createExplore:o}=await import("./explore-Yt733hfN.js");return{createExplore:o}},__vite__mapDeps([6,1,2,7,3,8]),import.meta.url)).createExplore({scene:c,camera:g,renderer:f,config:y,results:Q,group:h.get("group")||"A",auto:h.get("auto")==="1",comparison:H,gameMode:O}):null,Y=O?await(await k(async()=>{const{createGame:o}=await import("./index-BNntbVtQ.js");return{createGame:o}},__vite__mapDeps([9,1,2,7,10,11,3,12]),import.meta.url)).createGame({scene:c,camera:g,renderer:f,water:p,config:y,explore:j,auto:h.get("auto")==="1"}):null;let $=performance.now(),Z=p.material.uniforms.time.value;R?.connect(j);const Ze=new Ue,Je=h.has("time")?Number(h.get("time")):null;function oe(){requestAnimationFrame(oe),p.material.uniforms.time.value=window.__TIME__??Je??Ze.getElapsedTime(),x?.update();const o=performance.now(),e=Math.max(0,Math.min(.1,p.material.uniforms.time.value-Math.max(Z,p.userData.simTime??-1/0)));j?.update(O?e:(o-$)/1e3),Y?.update(e,p.material.uniforms.time.value),Z=p.material.uniforms.time.value,$=o,R?R.render():Y?.suspended||w.render()}oe();window.__SCENE__={scene:c,camera:g,water:p,propRoot:ee,results:Q,renderer:f};window.__READY__=!0;addEventListener("resize",()=>{if(R){R.resize();return}g.aspect=innerWidth/innerHeight,g.updateProjectionMatrix(),f.setSize(innerWidth,innerHeight),w.setSize(innerWidth,innerHeight)});
