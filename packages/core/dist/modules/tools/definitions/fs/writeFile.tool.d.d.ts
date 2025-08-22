import { z } from 'zod';
import { T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
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
