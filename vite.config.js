import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/icd10cm/', // Path for GitHub Pages deployment
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['react-markdown', 'file-saver', 'fuse.js'],
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true
  }
}) 