import { z as zod } from 'zod';

import type { Tool } from '../types.js';
export declare const synchronousExampleParams: zod.ZodObject<
  {
    data: zod.ZodString;
    delayMs: zod.ZodDefault<zod.ZodOptional<zod.ZodNumber>>;
    useClientLogger: zod.ZodDefault<zod.ZodOptional<zod.ZodBoolean>>;
    userId: zod.ZodOptional<zod.ZodString>;
  },
  'strip',
  zod.ZodTypeAny,
  {
    data: string;
    delayMs: number;
    useClientLogger: boolean;
    userId?: string | undefined;
  },
  {
    data: string;
    delayMs?: number | undefined;
    useClientLogger?: boolean | undefined;
    userId?: string | undefined;
  }
>;
export type SyncParamsType = zod.infer<typeof synchronousExampleParams>;
export declare const synchronousExampleTool: Tool<
  typeof synchronousExampleParams
>;
//# sourceMappingURL=synchronousExample.tool.d.ts.map
