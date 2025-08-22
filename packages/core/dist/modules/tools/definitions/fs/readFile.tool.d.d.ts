import { z } from 'zod';
import { T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
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
