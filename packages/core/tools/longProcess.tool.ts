// ===== src/tools/longProcess.tool.ts =====
import { z } from 'zod';
import { Context } from 'fastmcp';
import type { Tool, SessionData } from '../../types.js';

export const longProcessParams = z.object({
  // ...
});
export const longProcessTool: Tool<typeof longProcessParams> = {
  annotations: { streamingHint: true },
  description: 'Simulateur de tâche longue asynchrone.',
  execute: async (): Promise<string> => {
    // ... reste de la logique inchangée
    return 'Long process tool executed.';
  },
  name: 'asynchronousTaskSimulatorEnhanced',
  parameters: longProcessParams,
};
