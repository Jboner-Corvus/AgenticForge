import { z } from 'zod';

import type { Tool } from '../../types.js';
export declare const executePythonParams: z.ZodObject<
  {
    code: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    code: string;
  },
  {
    code: string;
  }
>;
export declare const executePythonTool: Tool<typeof executePythonParams>;
//# sourceMappingURL=executePython.tool.d.ts.map
