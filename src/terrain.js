export const shore = x => -12 - .009 * Math.min(x*x,6400) + 1.5*Math.sin(x*.075);
export function groundHeight(x,z) {
 const d=z-shore(x);
 return d<0 ? Math.max(-18,d*.12) : 1.0*(1-Math.exp(-d/40)) + .16*Math.sin(x*.13)*Math.sin(z*.17)*Math.min(1,d/8);
}
export const shoreGLSL = `float shore(float x){return -12.0-.009*min(x*x,6400.0)+1.5*sin(x*.075);}`;
