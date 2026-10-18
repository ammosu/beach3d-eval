export const shore = x => -12 - .009 * Math.min(x*x,6400) + 1.5*Math.sin(x*.075);
export function groundHeight(x,z) {
 const d=z-shore(x);
 if(d<0) return Math.max(-18,d*.12);
 const berm=.34*Math.exp(-(((d-5.2)/2.2)**2));
 const dunes=(.36+.27*Math.sin(x*.16+z*.09)+.18*Math.sin(z*.27-x*.09))*Math.min(1,Math.max(0,(d-6)/12));
 return .75*(1-Math.exp(-d/32))+berm+dunes;
}
export const shoreGLSL = `float shore(float x){return -12.0-.009*min(x*x,6400.0)+1.5*sin(x*.075);}`;
