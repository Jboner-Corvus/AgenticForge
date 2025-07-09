import { z } from 'zod';

import type { Tool } from '../types.js';
export declare const debugContextParams: z.ZodObject<
  {
    message: z.ZodOptional<z.ZodString>;
    useClientLogger: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    userId: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    message?: string | undefined;
    useClientLogger: boolean;
    userId?: string | undefined;
  },
  {
    message?: string | undefined;
    useClientLogger?: boolean | undefined;
    userId?: string | undefined;
  }
>;
export type ParamsType = z.infer<typeof debugContextParams>;
export declare const debugContextTool: Tool<typeof debugContextParams>;
//# sourceMappingURL=debugContext.tool.d.ts.map
