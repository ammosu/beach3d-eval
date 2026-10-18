import { defineConfig } from 'vite';
import { cp } from 'node:fs/promises';
export default defineConfig({plugins:[{name:'copy-scene-assets',async closeBundle(){await cp('assets','dist/assets',{recursive:true});}}]});
