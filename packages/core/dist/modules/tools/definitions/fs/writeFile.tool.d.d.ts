import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const writeFileParams: z.ZodObject<
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
declare const writeFileTool: Tool<typeof writeFileParams>;

export { writeFileParams, writeFileTool };
