import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const parameters: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
declare const listToolsOutput: z.ZodUnion<[z.ZodObject<{
    tools: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    tools: string[];
}, {
    tools: string[];
}>, z.ZodObject<{
    erreur: z.ZodString;
}, "strip", z.ZodTypeAny, {
    erreur: string;
}, {
    erreur: string;
}>]>;
declare const listToolsTool: Tool<typeof parameters, typeof listToolsOutput>;

export { listToolsOutput, listToolsTool, parameters };
