// packages/core/src/tools/index.ts
import type { Tool } from '../types.js';
import { ZodTypeAny } from 'zod';

import { getTools } from '../utils/toolLoader.js';
import { browserTool } from './browser.tool.js';
import { getTextFromUrlTool } from './web/getTextFromUrl.tool.js';

export const getAllTools = async (): Promise<Tool<ZodTypeAny, ZodTypeAny>[]> => {
  const tools = await getTools();
  return [
    ...tools,
    browserTool as unknown as Tool<ZodTypeAny, ZodTypeAny>,
    getTextFromUrlTool as unknown as Tool<ZodTypeAny, ZodTypeAny>,
  ];
};

export type { Tool };
