import { z } from 'zod';

import type { Tool } from '@/types.js';
export declare const webSearchParams: z.ZodObject<
  {
    query: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    query: string;
  },
  {
    query: string;
  }
>;
export declare const webSearchTool: Tool<typeof webSearchParams>;
//# sourceMappingURL=webSearch.tool.d.ts.map
