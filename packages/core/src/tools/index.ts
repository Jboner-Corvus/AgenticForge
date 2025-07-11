// packages/core/src/tools/index.ts
import type { Tool } from '../types.js';
import { getTools } from '../utils/toolLoader.js';
import { browserTool } from './browser.tool.js';
import { getTextFromUrlTool } from './web/getTextFromUrl.tool.js';

export const getAllTools = async (): Promise<Tool<any, any>[]> => {
  const tools = await getTools();
  return [
    ...tools,
    browserTool as Tool<any, any>,
    getTextFromUrlTool as Tool<any, any>,
  ];
};

export type { Tool };
