import { z } from 'zod';
import { T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const listFilesParams: z.ZodObject<{
    path: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path?: string | undefined;
}, {
    path?: string | undefined;
}>;
declare const listFilesOutput: z.ZodUnion<[z.ZodString, z.ZodObject<{
    erreur: z.ZodString;
}, "strip", z.ZodTypeAny, {
    erreur: string;
}, {
    erreur: string;
}>]>;
declare const listFilesTool: Tool<typeof listFilesParams, typeof listFilesOutput>;

export { listFilesOutput, listFilesParams, listFilesTool };
