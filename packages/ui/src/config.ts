import { z } from 'zod';

const clientConfigSchema = z.object({
  VITE_AUTH_TOKEN: z.string().optional(),
});

export const clientConfig = clientConfigSchema.parse(import.meta.env);
