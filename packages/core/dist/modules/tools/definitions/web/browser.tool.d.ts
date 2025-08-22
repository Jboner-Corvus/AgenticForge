import { z } from 'zod';
import { T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const parameters: z.ZodObject<{
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
}, {
    url: string;
}>;
declare const browserOutput: z.ZodUnion<[z.ZodObject<{
    content: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    content: string;
}, {
    url: string;
    content: string;
}>, z.ZodObject<{
    erreur: z.ZodString;
}, "strip", z.ZodTypeAny, {
    erreur: string;
}, {
    erreur: string;
}>]>;
declare const browserTool: Tool<typeof parameters, typeof browserOutput>;

export { browserOutput, browserTool, parameters };
