import { z } from 'zod';
import { T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const editFileParams: z.ZodObject<{
    content_to_replace: z.ZodString;
    is_regex: z.ZodOptional<z.ZodBoolean>;
    new_content: z.ZodString;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content_to_replace: string;
    new_content: string;
    path: string;
    is_regex?: boolean | undefined;
}, {
    content_to_replace: string;
    new_content: string;
    path: string;
    is_regex?: boolean | undefined;
}>;
declare const editFileOutput: z.ZodUnion<[z.ZodObject<{
    message: z.ZodString;
    modified_content: z.ZodOptional<z.ZodString>;
    original_content: z.ZodOptional<z.ZodString>;
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    modified_content?: string | undefined;
    original_content?: string | undefined;
}, {
    message: string;
    success: boolean;
    modified_content?: string | undefined;
    original_content?: string | undefined;
}>, z.ZodObject<{
    erreur: z.ZodString;
}, "strip", z.ZodTypeAny, {
    erreur: string;
}, {
    erreur: string;
}>]>;
declare const editFileTool: Tool<typeof editFileParams, typeof editFileOutput>;

export { editFileOutput, editFileParams, editFileTool };
