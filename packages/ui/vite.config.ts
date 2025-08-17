// packages/ui/vite.config.ts

import react from "@vitejs/plugin-react";
import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import fs from "fs";

// Fonction pour charger le .env depuis le répertoire racine
function loadRootEnv() {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, 'utf8');
    const envVars: Record<string, string> = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#\s][^=]*)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        envVars[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
      }
    });
    
    return envVars;
  }
  return {};
}

export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement du répertoire racine
  const rootEnv = loadRootEnv();
  console.log('🔐 [Vite Config] AUTH_TOKEN from root .env:', rootEnv.AUTH_TOKEN ? 'PRÉSENT (' + rootEnv.AUTH_TOKEN.substring(0, 20) + '...)' : 'ABSENT');

  return {
  // Use '/' as the base path for the app
  base: '/',
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
    // Injecte AUTH_TOKEN du serveur vers le frontend depuis le .env racine
    'import.meta.env.AUTH_TOKEN': JSON.stringify(rootEnv.AUTH_TOKEN || process.env.AUTH_TOKEN || ''),
    'import.meta.env.VITE_AUTH_TOKEN': JSON.stringify(rootEnv.AUTH_TOKEN || process.env.AUTH_TOKEN || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  esbuild: {
    // Supprime les console.log en production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  // Configuration serveur pour dev et preview
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Docker container port
        changeOrigin: true,
        secure: false,
        ws: true, // Support WebSockets pour SSE
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Docker container port
        changeOrigin: true,
        secure: false,
        ws: true, // Support WebSockets pour SSE
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
  };
});