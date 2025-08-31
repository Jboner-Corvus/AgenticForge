import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
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
