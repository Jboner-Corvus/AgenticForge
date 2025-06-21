// ===== src/tools/longProcess.tool.ts =====
import { z } from 'zod';
import type { Tool, Ctx } from '../types.js';

export const longProcessParams = z.object({
  // ...
});
export const longProcessTool: Tool<typeof longProcessParams> = {
  name: 'asynchronousTaskSimulatorEnhanced',
  description: 'Simulateur de tâche longue asynchrone.',
  parameters: longProcessParams,
  annotations: { streamingHint: true },
  execute: async (_args, _context: Ctx): Promise<string> => {
    // ... reste de la logique inchangée
    return 'Long process tool executed.';
  },
};
