import { defineConfig } from 'vite';
import { cp, mkdir } from 'node:fs/promises';
export default defineConfig({build:{rollupOptions:{input:['index.html','scene.html','compare.html','props.html','game.html','tidepool.html']}},plugins:[{name:'copy-scene-assets',async closeBundle(){
 await cp('assets','dist/assets',{recursive:true});await cp('report','dist/report',{recursive:true});
 // 外海任務用的 Reef Lagoon（單檔 r128，不經 Vite 打包）
 for(const dir of ['opus','tripo_lagoon'])await cp(`reef/${dir}`,`dist/reef/${dir}`,{recursive:true,filter:src=>!src.endsWith('build.py')});
 for(const group of ['A','B','C']){await mkdir(`dist/shots/${group}`,{recursive:true});try{await cp(`shots/${group}/beach.png`,`dist/shots/${group}/beach.png`);}catch(error){if(error.code!=='ENOENT')throw error;}}
}}]});
