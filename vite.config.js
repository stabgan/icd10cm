import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Get the repository name or use custom path for production
const getBasePath = () => {
  // For production builds with custom domain, use '/icd10cm/'
  if (process.env.NODE_ENV === 'production') {
    return '/icd10cm/';
  }
  return '/';
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3030
  },
  // Set the base path for builds
  base: getBasePath(),
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
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  define: {
    // Fix for crypto.getRandomValues in Node.js environment
    'process.env': {}
  },
  // Handle crypto for GitHub Actions build
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
}) 