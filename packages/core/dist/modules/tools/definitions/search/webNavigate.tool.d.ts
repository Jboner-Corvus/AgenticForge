import { z } from 'zod';
import { T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const webNavigateParams: z.ZodObject<{
    action: z.ZodOptional<z.ZodEnum<["summarize", "extract_text", "get_title"]>>;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    action?: "summarize" | "extract_text" | "get_title" | undefined;
}, {
    url: string;
    action?: "summarize" | "extract_text" | "get_title" | undefined;
}>;
declare const webNavigateOutput: z.ZodObject<{
    result: z.ZodString;
}, "strip", z.ZodTypeAny, {
    result: string;
}, {
    result: string;
}>;
declare const webNavigateTool: Tool<typeof webNavigateParams, typeof webNavigateOutput>;

export { webNavigateOutput, webNavigateParams, webNavigateTool };
