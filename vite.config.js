import { defineConfig } from 'vite';
import { cp, mkdir } from 'node:fs/promises';
export default defineConfig({base:'./',build:{rollupOptions:{input:['index.html','scene.html','compare.html','props.html','game.html','tidepool.html']}},plugins:[{name:'copy-scene-assets',async closeBundle(){
 await cp('assets','dist/assets',{recursive:true,filter:src=>!/[\\/]assets[\\/]raw([\\/]|$)|__[^\\/]*\.glb$/.test(src)});   // raw Tripo downloads and trial variants stay out of the build
 await cp('report','dist/report',{recursive:true});
 for(const group of ['A','B','C']){await mkdir(`dist/shots/${group}`,{recursive:true});try{await cp(`shots/${group}/beach.png`,`dist/shots/${group}/beach.png`);}catch(error){if(error.code!=='ENOENT')throw error;}}
}}]});
