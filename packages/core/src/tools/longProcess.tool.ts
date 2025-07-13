import { z } from 'zod';

import type { Tool } from '../../types.js';

export const longProcessParams = z.object({}).strict();

export const longProcessOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const longProcessTool: Tool<typeof longProcessParams, typeof longProcessOutput> = {
  description: 'Simulateur de tâche longue asynchrone.',
  execute: async (): Promise<string | { erreur: string }> => {
    try {
      // ... reste de la logique inchangée
      return 'Long process tool executed.';
    } catch (error: any) {
      return { "erreur": `An unexpected error occurred: ${error.message || error}` };
    }
  },
  name: 'asynchronousTaskSimulatorEnhanced',
  parameters: longProcessParams,
};
