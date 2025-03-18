import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { readPackageJSON } from 'pkg-types'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// We'll check if terser is available for minification
let minify = 'esbuild'
try {
  require.resolve('terser')
  minify = 'terser'
} catch (error) {
  console.warn('Terser not found, using esbuild for minification')
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const pkg = await readPackageJSON()
  const isElectron = mode === 'electron'
  
  return {
    base: isElectron ? './' : '/',
    plugins: [
      react(),
      nodePolyfills(),
    ],
    server: {
      port: 3000, // Changed to match electron:start script
      strictPort: true, // Force specific port for Electron
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: minify,
      cssMinify: true,
      sourcemap: false,
      // Fix asset path issues in build
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
            utils: ['idb'],
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BASE_PATH__: JSON.stringify(isElectron ? './' : '/'),
      // Fix for crypto.getRandomValues in Node.js environment
      'process.env': {},
      // Ensure global and window are defined
      global: 'globalThis',
      // Indicate if we're running in Electron
      __IS_ELECTRON__: isElectron,
    },
    // Handle crypto for build
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },
    // Ensure data files are copied to the dist directory
    publicDir: 'public',
    preview: {
      port: 3000,
      strictPort: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: ['node_modules/', 'src/test/', '**/*.d.ts'],
      },
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      exclude: [
        '**/node_modules/**', 
        '**/dist/**', 
        '**/playwright/**',
        '**/e2e/**',
        '**/test/e2e/**',
        'src/test/e2e/**',
        '**/playwright.config.{js,ts}',
        '**/*.e2e.spec.{js,jsx,ts,tsx}',
        '**/e2e/*.spec.{js,jsx,ts,tsx}',
        '**/*.config.{js,ts}'
      ],
    },
  }
}) 