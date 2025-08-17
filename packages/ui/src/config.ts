import { z } from 'zod';

const clientConfigSchema = z.object({
  AUTH_TOKEN: z.string().optional(),
});

// Parse the configuration with a fallback for development
export const clientConfig = clientConfigSchema.parse({
  AUTH_TOKEN: import.meta.env.AUTH_TOKEN || import.meta.env.VITE_AUTH_TOKEN || process.env.AUTH_TOKEN || '',
});
