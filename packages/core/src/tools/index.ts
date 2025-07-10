// src/tools/index.ts
// Ce fichier est maintenant le point d'entrée unique pour obtenir tous les outils dynamiquement.

import type { Tool } from '../types.js';
import { getTools } from '../utils/toolLoader.js';
// AJOUT : Importer le nouvel outil
import { browseWebsiteTool } from './browser/browseWebsite.tool.js';

export const getAllTools = async (): Promise<Tool<any, any>[]> => {
  const tools = await getTools();
  return [
    ...tools,
    // AJOUT : Ajouter le nouvel outil à la liste
    browseWebsiteTool as Tool<any, any>, 
    // ... (gardez les autres outils s'il y en a)
  ];
};

export type { Tool };
