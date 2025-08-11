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
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting optimisé pour réduire la taille du bundle
        manualChunks: {
          // Vendor chunks pour les dépendances stables
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-icons',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip'
          ],
          'vendor-state': ['zustand', 'immer'],
          'vendor-animations': ['framer-motion'],
          'vendor-utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
          'vendor-markdown': ['react-markdown', 'remark-gfm']
        },
        // Force new file names to bypass browser cache
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
    target: 'es2020',
    // Optimisations supplémentaires
    assetsDir: 'assets',
    emptyOutDir: true,
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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  esbuild: {
    // Supprime les console.log en production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
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