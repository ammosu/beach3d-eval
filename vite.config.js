import { defineConfig } from 'vite';
import { cp, mkdir } from 'node:fs/promises';
export default defineConfig({build:{rollupOptions:{input:['index.html','scene.html','compare.html','props.html','game.html']}},plugins:[{name:'copy-scene-assets',async closeBundle(){
 await cp('assets','dist/assets',{recursive:true});await cp('report','dist/report',{recursive:true});
 for(const group of ['A','B','C']){await mkdir(`dist/shots/${group}`,{recursive:true});try{await cp(`shots/${group}/beach.png`,`dist/shots/${group}/beach.png`);}catch(error){if(error.code!=='ENOENT')throw error;}}
}}]});
