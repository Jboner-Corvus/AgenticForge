import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const readFileParams: z.ZodObject<
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
declare const readFileTool: Tool<typeof readFileParams>;

export { readFileParams, readFileTool };
