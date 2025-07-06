// src/tools/index.ts
// Ce fichier est maintenant le point d'entrée unique pour obtenir tous les outils dynamiquement.

import type { Tool } from '../types.js';

import { getTools } from '../utils/toolLoader.js';
import { writeTool } from '../src/tools/system/write.tool.js';
import { recallTool } from '../src/tools/system/recall.tool.js';
import { scrollTool } from '../src/tools/browser/scroll.tool.js';
import { takeScreenshotTool } from '../src/tools/browser/takeScreenshot.tool.js';
import { navigateTool } from '../src/tools/browser/navigate.tool.js';
import { getContentTool } from '../src/tools/browser/getContent.tool.js';

import { navigateTool } from '../src/tools/browser/navigate.tool.js';
import { getContentTool } from '../src/tools/browser/getContent.tool.js';

/**
 * Exporte la fonction de chargement dynamique comme unique source de vérité pour les outils.
 * Toute partie de l'application (serveur, worker) qui a besoin de la liste des outils
 * devra appeler cette fonction.
 */
export const getAllTools = async (): Promise<Tool[]> => {
  const tools = await getTools();
  return [...tools, writeTool, recallTool, scrollTool, takeScreenshotTool, navigateTool, getContentTool];
};

// Exporter le type Tool pour la commodité des autres fichiers.
export type { Tool };
