// packages/core/src/tools/index.ts
import type { Tool } from '../types.js';

import { getTools } from '../utils/toolLoader.js';
import { browserTool } from './browser.tool.js';
import { getTextFromUrlTool } from './web/getTextFromUrl.tool.js';

export const getAllTools = async (): Promise<any[]> => {
  const tools = await getTools();
  return [
    ...tools,
    browserTool,
    getTextFromUrlTool,
  ];
};

export type { Tool };
