import { z } from 'zod';

const clientConfigSchema = z.object({
  VITE_AUTH_TOKEN: z.string().optional(),
  VITE_APP_API_BASE_URL: z.string(),
});

export const clientConfig = clientConfigSchema.parse(import.meta.env);
