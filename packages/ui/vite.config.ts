// packages/ui/vite.config.ts

import react from "@vitejs/plugin-react";
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
  plugins: [
    react({
      jsxRuntime: 'automatic'
    })
  ],
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
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3007', // Backend running on port 3007 (fixed version)
        changeOrigin: true,
        secure: false,
        ws: true, // Support WebSockets pour SSE
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forcer l'auth header sur toutes les requêtes proxy
            proxyReq.setHeader('Authorization', 'Bearer ' + (rootEnv.AUTH_TOKEN || process.env.AUTH_TOKEN || ''));
          });
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3007', // Backend running on port 3007 (fixed version)
        changeOrigin: true,
        secure: false,
        ws: true, // Support WebSockets pour SSE
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forcer l'auth header sur toutes les requêtes proxy
            proxyReq.setHeader('Authorization', 'Bearer ' + (rootEnv.AUTH_TOKEN || process.env.AUTH_TOKEN || ''));
          });
        },
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