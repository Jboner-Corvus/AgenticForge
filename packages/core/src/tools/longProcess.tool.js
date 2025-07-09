// ===== src/tools/longProcess.tool.ts =====
import { z } from 'zod';
export const longProcessParams = z.object({
  // ...
});
export const longProcessTool = {
  description: 'Simulateur de tâche longue asynchrone.',
  execute: async () => {
    // ... reste de la logique inchangée
    return 'Long process tool executed.';
  },
  name: 'asynchronousTaskSimulatorEnhanced',
  parameters: longProcessParams,
};
//# sourceMappingURL=longProcess.tool.js.map
