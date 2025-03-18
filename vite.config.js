import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Get the repository name or use custom path for production
const getBasePath = () => {
  // For production builds with custom domain, use '/icd10cm/'
  if (process.env.NODE_ENV === 'production') {
    return '/icd10cm/';
  }
  return '/';
};

// Check if terser is installed - ESM compatible approach
let minifyOption = 'esbuild'; // Default to esbuild
try {
  // Use fs to check if terser exists in node_modules
  const terserPath = path.resolve('node_modules', 'terser');
  if (fs.existsSync(terserPath)) {
    minifyOption = 'terser'; // Use terser if available
  }
} catch (e) {
  console.warn('Terser not found, using esbuild for minification');
}

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
    minify: minifyOption,
    sourcemap: false,
    // Fix asset path issues in production build
    assetsDir: 'assets',
    assetsInlineLimit: 4096, // 4kb
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['react-markdown', 'file-saver', 'fuse.js'],
        },
        // Ensure proper path for chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
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
    'process.env': {},
    // Ensure global and window are defined
    global: 'globalThis',
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