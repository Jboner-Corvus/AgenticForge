import { z } from 'zod';

import type { Tool } from '../../types.js';
export declare const executeDevCommandParams: z.ZodObject<
  {
    command: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    command: string;
  },
  {
    command: string;
  }
>;
export declare const executeDevCommandTool: Tool<
  typeof executeDevCommandParams
>;
//# sourceMappingURL=executeDevCommand.tool.d.ts.map
