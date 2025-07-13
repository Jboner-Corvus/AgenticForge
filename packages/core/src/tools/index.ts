import { z } from 'zod';

// packages/core/src/tools/index.ts
import type { Tool } from '../types.js';

import { getTools } from '../utils/toolLoader.js';

export const getAllTools = async (): Promise<
  Tool<z.AnyZodObject, z.AnyZodObject>[]
> => {
  return getTools() as Promise<Tool<z.AnyZodObject, z.AnyZodObject>[]>;
};

export type { Tool };
