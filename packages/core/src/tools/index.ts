import { z } from 'zod';

// packages/core/src/tools/index.ts
import type { Tool } from '../types.js';

import { getTools } from '../utils/toolLoader.js';
import { finishTool, FinishToolSignal } from './system/finish.tool.js';

export const getAllTools = async (): Promise<
  Tool<z.AnyZodObject, z.ZodTypeAny>[]
> => {
  const tools = await getTools();
  tools.push(finishTool as unknown as Tool<z.AnyZodObject, z.ZodTypeAny>);
  return tools;
};

export type { Tool };
export { FinishToolSignal };
