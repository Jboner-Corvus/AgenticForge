import { z } from 'zod';
import { T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const webSearchApiParams: z.ZodObject<{
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
}, {
    query: string;
}>;
declare const webSearchApiOutput: z.ZodObject<{
    summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    summary: string;
}, {
    summary: string;
}>;
declare const webSearchApiTool: Tool<typeof webSearchApiParams, typeof webSearchApiOutput>;

export { webSearchApiOutput, webSearchApiParams, webSearchApiTool };
