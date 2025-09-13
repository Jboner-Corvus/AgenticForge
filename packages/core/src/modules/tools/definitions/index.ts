import { z } from 'zod';

// ATTENTION : Ce fichier est le point d'agrégation pour tous les outils de l'agent.
// Il utilise `getTools` (défini dans `utils/toolLoader.js`) pour charger dynamiquement
// les outils à partir des sous-dossiers de ce répertoire.
//
// POUR AJOUTER UN NOUVEL OUTIL :
// 1. Créez un nouveau fichier `monOutil.tool.ts` dans un des sous-dossiers
//    (par exemple, `packages/core/src/tools/fs/`).
// 2. Dans ce fichier, exportez une constante qui respecte l'interface `Tool`.
//    Exemple : `export const myTool: Tool<typeof params, typeof output> = { ... };`
// 3. Le `toolLoader` le découvrira et l'ajoutera automatiquement au registre au démarrage.
//
// Assurez-vous que chaque outil a un nom unique, une description pertinente pour le LLM,
// et un schéma de paramètres Zod correct.
// packages/core/src/tools/index.ts
import type { Ctx as _Ctx, Tool } from '../../../types.ts';

import { getTools } from '../../../utils/toolLoader.ts';
import { canvasConsoleFeedbackTool } from './system/canvasConsoleFeedback.tool.ts';
import { finishTool, FinishToolSignal } from './system/finish.tool.ts';

export const getAllTools = async (): Promise<
  Tool<z.AnyZodObject, z.ZodTypeAny>[]
> => {
  console.log('[getAllTools] function called');
  const allTools = await getTools();

  // Filter out redundant tools and keep only essential ones
  const essentialTools = allTools.filter((tool) => {
    const essentialToolNames = [
      // Core system tools
      'finish',
      'display_canvas',
      'todo_write',
      'listTools',

      // New composite tools (prioritize these)
      'finance', // Replaces all Alpha Vantage tools
      'file_manager', // Replaces individual file tools
      'web_automation', // Replaces individual Playwright tools

      // Keep some individual tools for specific use cases
      // 'global_quote',   // REMOVED: Duplicate with core_stock_apis (finance)
      'readFile', // Keep for simple file reading
      'writeFile', // Keep for simple file writing
      'playwright_navigate', // Keep for simple navigation

      // AI tools
      'summarize',

      // Planning
      'project_planning',

      // Code execution
      'executeShellCommand',
    ];

    return (
      essentialToolNames.includes(tool.name) ||
      tool.name.startsWith('canvas_console_feedback') ||
      tool.name.startsWith('finish')
    );
  });

  console.log(
    `[getAllTools] Filtered from ${allTools.length} to ${essentialTools.length} essential tools`,
  );

  return essentialTools;
};

export { FinishToolSignal };
