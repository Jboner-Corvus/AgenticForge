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
import type { Ctx as _Ctx, Tool } from '../../../types.js';

import { getTools } from '../../../utils/toolLoader.js';
import { finishTool, FinishToolSignal } from './system/finish.tool.js';
import { clientConsoleTool } from './clientConsole.tool.js';

export const getAllTools = async (): Promise<
  Tool<z.AnyZodObject, z.ZodTypeAny>[]
> => {
  console.log('[getAllTools] function called');
  const tools = await getTools();
  tools.push(finishTool as unknown as Tool<z.AnyZodObject, z.ZodTypeAny>);
  tools.push(clientConsoleTool as unknown as Tool<z.AnyZodObject, z.ZodTypeAny>);
  return tools;
};

export { FinishToolSignal };
