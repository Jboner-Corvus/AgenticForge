import { z } from 'zod';

import type { Tool } from '@/types.js';
export declare const writeFileParams: z.ZodObject<
  {
    content: z.ZodString;
    path: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    content: string;
    path: string;
  },
  {
    content: string;
    path: string;
  }
>;
export declare const writeFileTool: Tool<typeof writeFileParams>;
//# sourceMappingURL=writeFile.tool.d.ts.map
