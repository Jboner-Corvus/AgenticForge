// packages/ui/vite.config.ts

import react from "@vitejs/plugin-react";
import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
// This configuration is now simplified for a production-only workflow.
// The development server and proxy settings have been removed to eliminate ambiguity,
// as Nginx handles all routing in the production Docker environment.
export default defineConfig({
  build: {
    minify: true, // Enabled for production
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [react(), reactRefresh()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
