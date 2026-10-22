const e=new URLSearchParams(location.search).get("lite"),a=e!=null?e!=="0":matchMedia("(pointer: coarse)").matches&&!matchMedia("(any-pointer: fine)").matches;export{a as l};
