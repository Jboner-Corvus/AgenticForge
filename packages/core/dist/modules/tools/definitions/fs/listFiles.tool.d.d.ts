import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const listFilesParams: z.ZodObject<
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
declare const listFilesTool: Tool<typeof listFilesParams>;

export { listFilesParams, listFilesTool };
