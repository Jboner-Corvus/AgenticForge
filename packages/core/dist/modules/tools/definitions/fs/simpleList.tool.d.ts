import { z } from 'zod';
import { T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const simpleListParams: z.ZodObject<{
    detailed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    detailed?: boolean | undefined;
}, {
    detailed?: boolean | undefined;
}>;
declare const simpleListOutput: z.ZodString;
declare const simpleListTool: Tool<typeof simpleListParams, typeof simpleListOutput>;

export { simpleListOutput, simpleListParams, simpleListTool };
