import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Get the repository name or use custom path for production
const getBasePath = () => {
  // Check for specific environment variables for GitHub Pages deployment
  if (process.env.GITHUB_PAGES === 'true') {
    return '/icd10cm/';
  }
  
  // For production builds with custom domain, check if in production
  if (process.env.NODE_ENV === 'production') {
    // If a CNAME file exists, assume we're using a custom domain
    try {
      if (fs.existsSync(path.resolve('public', 'CNAME'))) {
        return '/';
      }
      return '/icd10cm/';
    } catch (e) {
      return '/icd10cm/';
    }
  }
  
  // Default for development
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
    // Explicitly make BASE_URL available to the application
    '__APP_BASE_PATH__': JSON.stringify(getBasePath())
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