import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
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
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To fix flexsearch and other modules that use Node.js APIs
      include: ['path', 'fs', 'util', 'process', 'buffer', 'stream'],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    minify,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}) 