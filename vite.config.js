import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import preload from 'vite-plugin-preload'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    compression(),
    preload()
  ],
  server: {
    host: true,
  },
	root: 'src/',
	publicDir: '../public/',
	build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false
  }
});