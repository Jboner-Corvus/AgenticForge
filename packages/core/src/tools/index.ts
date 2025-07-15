import { z } from 'zod';

// packages/core/src/tools/index.ts
import type { Tool } from '../types.js';

import { getTools } from '../utils/toolLoader.js';

export const getAllTools = async (): Promise<
  Tool<z.AnyZodObject, z.ZodTypeAny>[]
> => {
  return getTools();
};

export type { Tool };
export { FinishToolSignal } from './system/finish.tool.js';
