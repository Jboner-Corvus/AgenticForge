import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
      import tailwindcss from "tailwindcss";
      import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
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
  define: {
    "import.meta.env.VITE_AUTH_TOKEN": JSON.stringify(process.env.AUTH_TOKEN),
  },
  plugins: [react()],
  preview: {
    host: true,
    port: Number(process.env.WEB_PORT) || 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        target: 'http://server:3001',
      },
    },
  },
});
