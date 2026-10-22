const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/compare-DjO8R--n.js","assets/props-B641MWa4.js","assets/GLTFLoader-B6bGjBLD.js","assets/compare-CBcrXqmb.css","assets/ui-CFe6ZiZZ.css","assets/explore-ClzVH0QJ.js","assets/coast-rei-XCcc.js","assets/explore-B6A3MxAo.css","assets/index-xsU4A6tQ.js","assets/character-eY-7fSfp.js","assets/species-BwhzQEuU.js","assets/index-BU15X1er.css"])))=>i.map(i=>d[i]);
import{M as O,O as oe,d as le,F as Q,e as M,U,f as p,g as A,h as D,N as ne,T as ue,C as B,V as b,i as he,j as fe,R as ce,k as de,l as me,L as pe,m as ge,n as ve,A as Y,o as _e,p as xe,q as be,W as Me,P as Te,S as we,r as Ce,c as Se,s as Pe,t as Ee,H as ye,D as Re,a as Ae,b as De,u as Fe}from"./GLTFLoader-B6bGjBLD.js";import{c as Ue,s as Be,a as Ne}from"./coast-rei-XCcc.js";import{O as ze}from"./OrbitControls-Bib_TP1Q.js";import{g as Oe,p as Z,l as Le}from"./props-B641MWa4.js";const Ie="modulepreload",Ve=function(o){return"/"+o},W={},L=function(e,t,a){let s=Promise.resolve();if(t&&t.length>0){let n=function(d){return Promise.all(d.map(h=>Promise.resolve(h).then(_=>({status:"fulfilled",value:_}),_=>({status:"rejected",reason:_}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),l=r?.nonce||r?.getAttribute("nonce");s=n(t.map(d=>{if(d=Ve(d),d in W)return;W[d]=!0;const h=d.endsWith(".css"),_=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${_}`))return;const m=document.createElement("link");if(m.rel=h?"stylesheet":Ie,h||(m.as="script"),m.crossOrigin="",m.href=d,l&&m.setAttribute("nonce",l),document.head.appendChild(m),h)return new Promise((ae,re)=>{m.addEventListener("load",ae),m.addEventListener("error",()=>re(new Error(`Unable to preload CSS for ${d}`)))})}))}function i(r){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=r,window.dispatchEvent(l),!l.defaultPrevented)throw r}return s.then(r=>{for(const l of r||[])l.status==="rejected"&&i(l.reason);return e().catch(i)})},F={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class P{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Ge=new oe(-1,1,1,-1,0,1);class ke extends le{constructor(){super(),this.setAttribute("position",new Q([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Q([0,2,0,0,2,0],2))}}const He=new ke;class I{constructor(e){this._mesh=new O(He,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ge)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class $ extends P{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof M?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=U.clone(e.uniforms),this.material=new M({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new I(this.material)}render(e,t,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class j extends P{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,a){const s=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let r,l;this.inverse?(r=0,l=1):(r=1,l=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),i.buffers.stencil.setFunc(s.ALWAYS,r,4294967295),i.buffers.stencil.setClear(l),i.buffers.stencil.setLocked(!0),e.setRenderTarget(a),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(s.EQUAL,1,4294967295),i.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),i.buffers.stencil.setLocked(!0)}}class Qe extends P{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class We{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const a=e.getSize(new p);this._width=a.width,this._height=a.height,t=new A(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:D}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new $(F),this.copyPass.material.blending=ne,this.timer=new ue}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let a=!1;for(let s=0,i=this.passes.length;s<i;s++){const r=this.passes[s];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,a),r.needsSwap){if(a){const l=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(l.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(l.EQUAL,1,4294967295)}this.swapBuffers()}j!==void 0&&(r instanceof j?a=!0:r instanceof Qe&&(a=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new p);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const a=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(a,s),this.renderTarget2.setSize(a,s);for(let i=0;i<this.passes.length;i++)this.passes[i].setSize(a,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class je extends P{constructor(e,t,a=null,s=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=a,this.clearColor=s,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new B}render(e,t,a){const s=e.autoClear;e.autoClear=!1;let i,r;this.overrideMaterial!==null&&(r=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=r),e.autoClear=s}}const qe={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new B(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class S extends P{constructor(e,t=1,a,s){super(),this.strength=t,this.radius=a,this.threshold=s,this.resolution=e!==void 0?new p(e.x,e.y):new p(256,256),this.clearColor=new B(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);this.renderTargetBright=new A(i,r,{type:D}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){const _=new A(i,r,{type:D});_.texture.name="UnrealBloomPass.h"+h,_.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(_);const m=new A(i,r,{type:D});m.texture.name="UnrealBloomPass.v"+h,m.texture.generateMipmaps=!1,this.renderTargetsVertical.push(m),i=Math.round(i/2),r=Math.round(r/2)}const l=qe;this.highPassUniforms=U.clone(l.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new M({uniforms:this.highPassUniforms,vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}),this.separableBlurMaterials=[];const n=[6,10,14,18,22];i=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(n[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new p(1/i,1/r),i=Math.round(i/2),r=Math.round(r/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const d=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=d,this.bloomTintColors=[new b(1,1,1),new b(1,1,1),new b(1,1,1),new b(1,1,1),new b(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=U.clone(F.uniforms),this.blendMaterial=new M({uniforms:this.copyUniforms,vertexShader:F.vertexShader,fragmentShader:F.fragmentShader,premultipliedAlpha:!0,blending:he,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new B,this._oldClearAlpha=1,this._basic=new fe,this._fsQuad=new I(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let a=Math.round(e/2),s=Math.round(t/2);this.renderTargetBright.setSize(a,s);for(let i=0;i<this.nMips;i++)this.renderTargetsHorizontal[i].setSize(a,s),this.renderTargetsVertical[i].setSize(a,s),this.separableBlurMaterials[i].uniforms.invSize.value=new p(1/a,1/s),a=Math.round(a/2),s=Math.round(s/2)}render(e,t,a,s,i){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const r=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),i&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=a.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=a.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let l=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=l.texture,this.separableBlurMaterials[n].uniforms.direction.value=S.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[n]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=S.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[n]),e.clear(),this._fsQuad.render(e),l=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,i&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(a),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=r}_getSeparableBlurMaterial(e){const t=[],a=e/3;for(let s=0;s<e;s++)t.push(.39894*Math.exp(-.5*s*s/(a*a))/a);return new M({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new p(.5,.5)},direction:{value:new p(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}}S.BlurDirectionX=new p(1,0);S.BlurDirectionY=new p(0,1);const R={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`};class Xe extends P{constructor(){super(),this.isOutputPass=!0,this.uniforms=U.clone(R.uniforms),this.material=new ce({name:R.name,uniforms:this.uniforms,vertexShader:R.vertexShader,fragmentShader:R.fragmentShader}),this._fsQuad=new I(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,a){this.uniforms.tDiffuse.value=a.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},de.getTransfer(this._outputColorSpace)===me&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===pe?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===ge?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===ve?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Y?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===_e?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===xe?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===be&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}const u=new URLSearchParams(location.search),N=location.pathname.endsWith("/game.html");N&&(u.set("explore","1"),u.delete("cam"),u.has("group")||u.set("group","B"));const V=location.pathname.endsWith("/compare.html");V&&(u.set("explore","1"),u.delete("cam"));const f=new Me({antialias:!0});f.setPixelRatio(Math.min(devicePixelRatio,1.5));f.setSize(innerWidth,innerHeight);f.toneMapping=Y;f.toneMappingExposure=.65;f.shadowMap.enabled=!0;f.shadowMap.type=Te;document.body.appendChild(f.domElement);const c=new we;c.fog=new Ce(10470612,7e-4);const v=new Se(52,innerWidth/innerHeight,.1,4e3),Ke=new O(new Pe(1800,32,16),new M({side:Ee,depthWrite:!1,uniforms:{},vertexShader:"varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:`
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
 gl_FragColor=vec4(col,1.);}`}));c.add(Ke);const J=new b(.45,.38,-.8).normalize();c.add(new ye(12115967,13215607,1.25));const T=new Re(16766880,3.4);T.position.copy(J).multiplyScalar(100);c.add(T);T.castShadow=!0;T.shadow.mapSize.set(4096,4096);Object.assign(T.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:5,far:200});T.shadow.bias=-5e-5;T.shadow.normalBias=.03;const z=new Ae(2,2,500,500);z.rotateX(-Math.PI/2);const C=z.attributes.position;for(let o=0;o<C.count;o++){const e=Math.sign(C.getX(o))*C.getX(o)**2*2200,t=Math.sign(C.getZ(o))*C.getZ(o)**2*2200;C.setXYZ(o,e,Oe(e,t),t)}z.computeVertexNormals();const ee=new De({color:16045995,roughness:.92}),g=Ue(J);c.add(g);Be(ee,g.material.uniforms.time);const te=new O(z,ee);te.receiveShadow=!0;c.add(te);Ne(c);c.add(Z);const{config:E,results:G}=await Le(u.get("group")||"A"),k=E.cameras[u.get("cam")]||E.cameras.wide;v.position.fromArray(k.pos);v.lookAt(new b().fromArray(k.target));const ie=u.get("explore")==="1"&&!u.has("cam");let x;!ie&&!u.has("cam")&&(x=new ze(v,f.domElement),x.target.fromArray(k.target),x.maxPolarAngle=Math.PI*.48,x.minDistance=2,x.maxDistance=180,x.enableDamping=!0);const Ye=new $({uniforms:{tDiffuse:{value:null}},vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);gl_FragColor=any(isnan(c))||any(isinf(c))?vec4(0.,0.,0.,1.):min(c,vec4(1e4));}"}),w=new We(f);w.addPass(new je(c,v));w.addPass(Ye);w.addPass(new S(new p(innerWidth,innerHeight),.035,.4,3));w.addPass(new Xe);const y=V?await(await L(async()=>{const{createComparison:o}=await import("./compare-DjO8R--n.js");return{createComparison:o}},__vite__mapDeps([0,1,2,3,4]))).createComparison({scene:c,camera:v,renderer:f,composer:w,config:E,results:G,initialGroup:u.get("group")||"A"}):null,H=ie?(await L(async()=>{const{createExplore:o}=await import("./explore-ClzVH0QJ.js");return{createExplore:o}},__vite__mapDeps([5,1,2,6,7]))).createExplore({scene:c,camera:v,renderer:f,config:E,results:G,group:u.get("group")||"A",auto:u.get("auto")==="1",comparison:V,gameMode:N}):null,q=N?await(await L(async()=>{const{createGame:o}=await import("./index-xsU4A6tQ.js");return{createGame:o}},__vite__mapDeps([8,1,2,6,9,10,11]))).createGame({scene:c,camera:v,renderer:f,water:g,config:E,explore:H,auto:u.get("auto")==="1"}):null;let X=performance.now(),K=g.material.uniforms.time.value;y?.connect(H);const Ze=new Fe,$e=u.has("time")?Number(u.get("time")):null;function se(){requestAnimationFrame(se),g.material.uniforms.time.value=window.__TIME__??$e??Ze.getElapsedTime(),x?.update();const o=performance.now(),e=Math.max(0,Math.min(.1,g.material.uniforms.time.value-Math.max(K,g.userData.simTime??-1/0)));H?.update(N?e:(o-X)/1e3),q?.update(e,g.material.uniforms.time.value),K=g.material.uniforms.time.value,X=o,y?y.render():q?.suspended||w.render()}se();window.__SCENE__={scene:c,camera:v,water:g,propRoot:Z,results:G,renderer:f};window.__READY__=!0;addEventListener("resize",()=>{if(y){y.resize();return}v.aspect=innerWidth/innerHeight,v.updateProjectionMatrix(),f.setSize(innerWidth,innerHeight),w.setSize(innerWidth,innerHeight)});
