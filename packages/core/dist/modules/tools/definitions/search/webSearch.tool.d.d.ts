import { z } from 'zod';
import { T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const webSearchParams: z.ZodObject<
  {
    query: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    query: string;
  },
  {
    query: string;
  }
>;
declare const webSearchTool: Tool<typeof webSearchParams>;

export { webSearchParams, webSearchTool };
