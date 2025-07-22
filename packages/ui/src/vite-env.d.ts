/// <reference types="vite/client" />
/// <reference types="vitest/import.meta.env" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  
  readonly VITE_MCP_PROXY_ADDRESS: string;
  readonly VITE_MCP_PROXY_AUTH_TOKEN: string;
  // Add other environment variables here as needed
}

