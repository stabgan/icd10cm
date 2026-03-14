var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// vite.config.js
import { defineConfig } from "file:///C:/Users/kaust/PycharmProjects/OMC_website/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/kaust/PycharmProjects/OMC_website/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nodePolyfills } from "file:///C:/Users/kaust/PycharmProjects/OMC_website/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "C:\\Users\\kaust\\PycharmProjects\\OMC_website";
var minify = "esbuild";
try {
  __require.resolve("terser");
  minify = "terser";
} catch (error) {
  console.warn("Terser not found, using esbuild for minification");
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To fix flexsearch and other modules that use Node.js APIs
      include: ["path", "fs", "util", "process", "buffer", "stream"],
      globals: {
        Buffer: true,
        process: true
      }
    })
  ],
  build: {
    outDir: "dist",
    minify,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html")
      }
    }
  },
  server: {
    port: 3e3,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxrYXVzdFxcXFxQeWNoYXJtUHJvamVjdHNcXFxcT01DX3dlYnNpdGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGthdXN0XFxcXFB5Y2hhcm1Qcm9qZWN0c1xcXFxPTUNfd2Vic2l0ZVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMva2F1c3QvUHljaGFybVByb2plY3RzL09NQ193ZWJzaXRlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnXHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcblxyXG4vLyBXZSdsbCBjaGVjayBpZiB0ZXJzZXIgaXMgYXZhaWxhYmxlIGZvciBtaW5pZmljYXRpb25cclxubGV0IG1pbmlmeSA9ICdlc2J1aWxkJ1xyXG50cnkge1xyXG4gIHJlcXVpcmUucmVzb2x2ZSgndGVyc2VyJylcclxuICBtaW5pZnkgPSAndGVyc2VyJ1xyXG59IGNhdGNoIChlcnJvcikge1xyXG4gIGNvbnNvbGUud2FybignVGVyc2VyIG5vdCBmb3VuZCwgdXNpbmcgZXNidWlsZCBmb3IgbWluaWZpY2F0aW9uJylcclxufVxyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgbm9kZVBvbHlmaWxscyh7XHJcbiAgICAgIC8vIFRvIGZpeCBmbGV4c2VhcmNoIGFuZCBvdGhlciBtb2R1bGVzIHRoYXQgdXNlIE5vZGUuanMgQVBJc1xyXG4gICAgICBpbmNsdWRlOiBbJ3BhdGgnLCAnZnMnLCAndXRpbCcsICdwcm9jZXNzJywgJ2J1ZmZlcicsICdzdHJlYW0nXSxcclxuICAgICAgZ2xvYmFsczoge1xyXG4gICAgICAgIEJ1ZmZlcjogdHJ1ZSxcclxuICAgICAgICBwcm9jZXNzOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgXSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICBtaW5pZnksXHJcbiAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIGlucHV0OiB7XHJcbiAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgb3BlbjogdHJ1ZSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSkgIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7QUFBMFQsU0FBUyxvQkFBb0I7QUFDdlYsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQVF6QyxJQUFJLFNBQVM7QUFDYixJQUFJO0FBQ0YsWUFBUSxRQUFRLFFBQVE7QUFDeEIsV0FBUztBQUNYLFNBQVMsT0FBTztBQUNkLFVBQVEsS0FBSyxrREFBa0Q7QUFDakU7QUFHQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUE7QUFBQSxNQUVaLFNBQVMsQ0FBQyxRQUFRLE1BQU0sUUFBUSxXQUFXLFVBQVUsUUFBUTtBQUFBLE1BQzdELFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1I7QUFBQSxJQUNBLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE1BQU0sUUFBUSxrQ0FBVyxZQUFZO0FBQUEsTUFDdkM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
