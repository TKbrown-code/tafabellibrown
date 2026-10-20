import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return ({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_ROUTER === "hash" ? "./" : "/",
  // Keep the project's ordinary paths intact in Windows environments where native realpath is restricted.
  resolve: { preserveSymlinks: true, alias: { "@": path.resolve(__dirname, "src") } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("/node_modules/")) return;
          if (/\/(react|react-dom|scheduler)\//.test(id)) return "react-vendor";
          if (/\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return "motion-vendor";
          if (id.includes("/@tanstack/")) return "query-vendor";
          if (id.includes("/lucide-react/")) return "icons-vendor";
        },
      },
    },
  },
  server: {
      proxy: {
        "/api": {
            target: env.VITE_API_PROXY_TARGET || "http://localhost:5000",
            changeOrigin: true,
          secure: true,
        },
    },
    },
  });
});
