import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(() => ({
  plugins: [react()],
  // relative base for sandboxed hash-routed previews; absolute for clean URLs in production
  base: process.env.VITE_ROUTER === "hash" ? "./" : "/",
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
}));
