// packages/ui/vite.config.ts

import react from "@vitejs/plugin-react";
import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  build: {
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Force new file names to bypass browser cache
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
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
  define: {
    'process.env.AUTH_TOKEN': JSON.stringify(process.env.AUTH_TOKEN),
  },
  // AJOUTEZ CETTE SECTION
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Cible le port public du backend
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
});