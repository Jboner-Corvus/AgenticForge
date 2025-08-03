
// Outil généré par l'agent : dire_bonjour
import { z } from 'zod';
import type { Ctx, Tool } from '../../../../types.js';


export const direBonjourParams = z.object(z.object({}));

export const direBonjourTool: Tool<typeof direBonjourParams> = {
  name: 'dire_bonjour',
  description: 'Dit bonjour au monde.',
  parameters: direBonjourParams,
  execute: async (args, ctx: Ctx) => {
    return "Bonjour le monde !";
  },
};
