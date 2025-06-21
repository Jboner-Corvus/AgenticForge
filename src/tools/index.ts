// This file aggregates and exports all available tools.
import type { Tool } from '../types.js';
import { finishTool } from './system/finish.tool.js';
import { executeDevCommandTool } from './code/executeDevCommand.tool.js';
import { createToolTool } from './system/createTool.tool.js';
import { restartServerTool } from './system/restartServer.tool.js';
// Import other tools...
import { readFileTool } from './fs/readFile.tool.js';
import { writeFileTool } from './fs/writeFile.tool.js';
import { listFilesTool } from './fs/listFiles.tool.js';

// Explicitly type the array to satisfy TypeScript's generic constraints
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: Tool<any>[] = [
  // System Tools
  finishTool,
  createToolTool,
  restartServerTool,

  // Code Execution Tools
  executeDevCommandTool, // Remplacé executePythonTool

  // Filesystem Tools
  readFileTool,
  writeFileTool,
  listFilesTool,

  // Add other corrected tools here as they are fixed
];
