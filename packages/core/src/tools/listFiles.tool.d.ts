import { z } from 'zod';

import type { Tool } from '../types.js';
export declare const listFilesParams: z.ZodObject<
  {
    path: z.ZodDefault<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    path: string;
  },
  {
    path?: string | undefined;
  }
>;
export declare const listFilesTool: Tool<typeof listFilesParams>;
//# sourceMappingURL=listFiles.tool.d.ts.map
