import { z } from 'zod';

const clientConfigSchema = z.object({
  AUTH_TOKEN: z.string().optional(),
  BACKEND_PORT: z.number().optional(),
});

// Parse the configuration with a fallback for development
export const clientConfig = clientConfigSchema.parse({
  AUTH_TOKEN:
    import.meta.env.AUTH_TOKEN ||
    import.meta.env.VITE_AUTH_TOKEN ||
    process.env.AUTH_TOKEN ||
    '',
  BACKEND_PORT:
    Number(import.meta.env.VITE_BACKEND_PORT) ||
    Number(process.env.BACKEND_PORT) ||
    3002, // Use nginx port (3002) instead of backend port (8080)
});
