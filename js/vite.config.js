import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
   // outDir: 'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources',
    emptyOutDir: false,

    lib: {
      entry: 'src/main.js',
      name: 'atools',
      fileName: () => 'NionTools.js',
      formats: ['iife']
    },

    minify: 'esbuild'
  }
});
