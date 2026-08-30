import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.js',
      name: 'atools',
      fileName: () => 'NionTools.js',
      formats: ['iife'] 
    },
    minify: 'esbuild'
  }
});