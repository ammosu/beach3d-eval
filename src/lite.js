// Phones and tablets (touch only, no mouse) get a lighter render: the full scene drew about 6.4M triangles a frame
// (2.5M of them the islands' trees into a 4096 shadow map) at 1.5× pixels, which phone GPUs could not keep at a
// steady frame rate. ?lite=1 / ?lite=0 force it on or off. Desktop rendering, stills and recordings are unchanged.
const forced=new URLSearchParams(location.search).get('lite');
// touchOnly also picks the game's wording and controls (no keycaps, tap instead of E).
export const touchOnly=matchMedia('(pointer: coarse)').matches&&!matchMedia('(any-pointer: fine)').matches;
export const lite=forced!=null?forced!=='0':touchOnly;
