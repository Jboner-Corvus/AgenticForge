// src/tools/index.ts - Import correct des outils
import type { Tool } from '../types.js';
import { finishTool } from './system/finish.tool.js';
import { executeDevCommandTool } from './code/executeDevCommand.tool.js';
import { createToolTool } from './system/createTool.tool.js';
import { restartServerTool } from './system/restartServer.tool.js';
import { readFileTool } from './fs/readFile.tool.js';
import { writeFileTool } from './fs/writeFile.tool.js';
import { listFilesTool } from './fs/listFiles.tool.js';
import { getContentTool } from './browser/getContent.tool.js';
import { navigateTool } from './browser/navigate.tool.js';

// Explicitement typé pour satisfaire TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: Tool<any>[] = [
  // System Tools - Outils de gestion du système
  finishTool,
  createToolTool,
  restartServerTool,

  // Code Execution Tools - Exécution de code
  executeDevCommandTool,

  // Filesystem Tools - Manipulation de fichiers
  readFileTool,
  writeFileTool,
  listFilesTool,

  // Browser Tools - Navigation web (async)
  getContentTool,
  navigateTool,
];

// Export du nombre d'outils pour diagnostic
export const toolCount = allTools.length;

// Export des catégories pour organisation
export const toolCategories = {
  system: [finishTool, createToolTool, restartServerTool],
  code: [executeDevCommandTool],
  filesystem: [readFileTool, writeFileTool, listFilesTool],
  browser: [getContentTool, navigateTool],
} as const;
