import { z } from 'zod';

import type { Tool } from '@/types.ts';
export declare const readFileParams: z.ZodObject<
  {
    path: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    path: string;
  },
  {
    path: string;
  }
>;
export declare const readFileTool: Tool<typeof readFileParams>;
//# sourceMappingURL=readFile.tool.d.ts.map
