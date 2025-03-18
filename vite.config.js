import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Get the repository name or use custom path for production
const getBasePath = () => {
  // Always use /icd10cm/ for production builds
  if (process.env.NODE_ENV === 'production') {
    return '/icd10cm/';
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
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['react-markdown', 'file-saver', 'fuse.js'],
        },
        // Ensure proper path for chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep data files in their original structure with original names
          if (assetInfo.name && (assetInfo.name.endsWith('.json') || assetInfo.name.includes('data/'))) {
            const parts = assetInfo.name.split('/');
            const fileName = parts[parts.length - 1];
            if (parts.includes('data')) {
              // Preserve the full path for data files
              return assetInfo.name;
            }
            return `data/${fileName}`;
          }
          return 'assets/[ext]/[name]-[hash].[ext]';
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
  },
  // Ensure data files are copied to the dist directory
  publicDir: 'public'
}) 