// packages/ui/vite.config.ts

import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'fs';

// Fonction pour charger le .env depuis le répertoire racine
function loadRootEnv() {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, 'utf8');
    const envVars: Record<string, string> = {};

    envContent.split('\n').forEach((line) => {
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

// Fonction pour charger le .env local du répertoire UI
function loadLocalEnv() {
  const localEnvPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(localEnvPath)) {
    const envContent = fs.readFileSync(localEnvPath, 'utf8');
    const envVars: Record<string, string> = {};

    envContent.split('\n').forEach((line) => {
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
  // Charger les variables d'environnement locales
  const localEnv = loadLocalEnv();

  console.log(
    '🔐 [Vite Config] AUTH_TOKEN from root .env:',
    rootEnv.AUTH_TOKEN
      ? 'PRÉSENT (' + rootEnv.AUTH_TOKEN.substring(0, 20) + '...)'
      : 'ABSENT',
  );

  console.log(
    '🔐 [Vite Config] VITE_AUTH_TOKEN from local .env:',
    localEnv.VITE_AUTH_TOKEN
      ? 'PRÉSENT (' + localEnv.VITE_AUTH_TOKEN.substring(0, 20) + '...)'
      : 'ABSENT',
  );

  // Log the actual values for debugging
  console.log('🔐 [Vite Config] Root AUTH_TOKEN value:', rootEnv.AUTH_TOKEN);
  console.log('🔐 [Vite Config] Local VITE_AUTH_TOKEN value:', localEnv.VITE_AUTH_TOKEN);

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
              '@radix-ui/react-tooltip',
            ],
            'vendor-state': ['zustand', 'immer'],
            'vendor-animations': ['framer-motion'],
            'vendor-utils': [
              'clsx',
              'class-variance-authority',
              'tailwind-merge',
            ],
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
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
        jsxRuntime: 'automatic',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Injecte AUTH_TOKEN du serveur vers le frontend
      // Priorité: local .env > root .env > process.env
      'import.meta.env.AUTH_TOKEN': JSON.stringify(
        localEnv.VITE_AUTH_TOKEN || rootEnv.AUTH_TOKEN || process.env.AUTH_TOKEN || '',
      ),
      'import.meta.env.VITE_AUTH_TOKEN': JSON.stringify(
        localEnv.VITE_AUTH_TOKEN || rootEnv.AUTH_TOKEN || process.env.AUTH_TOKEN || '',
      ),
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(
        localEnv.VITE_BACKEND_PORT || rootEnv.VITE_BACKEND_PORT || process.env.VITE_BACKEND_PORT || '3001',
      ),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        localEnv.VITE_API_BASE_URL || rootEnv.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || '',
      ),
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
    },
    esbuild: {
      // Supprime les console.log en production
      drop:
        process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    // Configuration serveur pour dev et preview
    server: {
      host: '0.0.0.0',
      port: 3003,
      headers: {
        'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: http: https:; img-src 'self' data: https:; media-src 'self';",
      },
      proxy: {
        '/api': {
                    target: `http://localhost:${rootEnv.PUBLIC_PORT || rootEnv.PORT || '3001'}`, // Use backend port from environment
          changeOrigin: true,
          secure: false,
          ws: true, // Support WebSockets pour SSE
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Forcer l'auth header sur toutes les requêtes proxy
              // Priorité: local .env > root .env > process.env
              const authToken = localEnv.VITE_AUTH_TOKEN || rootEnv.AUTH_TOKEN || process.env.AUTH_TOKEN || '';
              console.log('🔐 [Proxy] Setting Authorization header with token:', authToken ? 'PRÉSENT' : 'ABSENT');
              if (authToken) {
                console.log('🔐 [Proxy] Token value (first 20 chars):', authToken.substring(0, 20));
              }
              proxyReq.setHeader(
                'Authorization',
                'Bearer ' + authToken,
              );
            });
            proxy.on('error', (err, req, res) => {
              console.error('🚨 [Proxy] Proxy error:', err);
              res.writeHead(500, {
                'Content-Type': 'text/plain',
              });
              res.end('Proxy error');
            });
          },
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3003,
      headers: {
        'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: http: https:; img-src 'self' data: https:; media-src 'self';",
      },
      proxy: {
        '/api': {
                    target: `http://localhost:${rootEnv.PUBLIC_PORT || rootEnv.PORT || '3001'}`, // Use backend port from environment
          changeOrigin: true,
          secure: false,
          ws: true, // Support WebSockets pour SSE
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Forcer l'auth header sur toutes les requêtes proxy
              // Priorité: local .env > root .env > process.env
              const authToken = localEnv.VITE_AUTH_TOKEN || rootEnv.AUTH_TOKEN || process.env.AUTH_TOKEN || '';
              console.log('🔐 [Preview Proxy] Setting Authorization header with token:', authToken ? 'PRÉSENT' : 'ABSENT');
              if (authToken) {
                console.log('🔐 [Preview Proxy] Token value (first 20 chars):', authToken.substring(0, 20));
              }
              proxyReq.setHeader(
                'Authorization',
                'Bearer ' + authToken,
              );
            });
            proxy.on('error', (err, req, res) => {
              console.error('🚨 [Preview Proxy] Proxy error:', err);
              res.writeHead(500, {
                'Content-Type': 'text/plain',
              });
              res.end('Proxy error');
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