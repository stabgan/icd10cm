import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get the repository name from package.json or environment variable
const getRepoName = () => {
  try {
    // This will extract the repository name from the Git remote URL
    // You should replace 'icd10cm' below with your actual repository name if different
    return '/icd10cm/';
  } catch (e) {
    return '/';
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? getRepoName() : '/',
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
    port: 3030,
    strictPort: false,
    open: true
  }
}) 