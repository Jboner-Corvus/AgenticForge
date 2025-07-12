// packages/core/src/tools/index.ts
import type { Tool } from '../types.js';
import { ZodTypeAny } from 'zod';

import { getTools } from '../utils/toolLoader.js';

export const getAllTools = async (): Promise<Tool<ZodTypeAny, ZodTypeAny>[]> => {
  return getTools() as Promise<Tool<ZodTypeAny, ZodTypeAny>[]>;
};

export type { Tool };
