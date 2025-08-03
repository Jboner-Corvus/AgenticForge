
// Outil généré par l'agent : generate-uuid
import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.js';


export const generateUuidParams = z.object(z.object({}));

export const generateUuidTool: Tool<typeof generateUuidParams> = {
  name: 'generate-uuid',
  description: 'Génère un UUID en utilisant crypto.randomUUID() de Node.js.',
  parameters: generateUuidParams,
  execute: async (args, ctx: Ctx) => {
    return crypto.randomUUID();
  },
};
