import { z } from 'zod';

import type { Tool } from '../types.js';
export declare const longProcessParams: z.ZodObject<
  Record<string, never>,
  'strip',
  z.ZodTypeAny,
  Record<string, never>,
  Record<string, never>
>;
export declare const longProcessTool: Tool<typeof longProcessParams>;
//# sourceMappingURL=longProcess.tool.d.ts.map
