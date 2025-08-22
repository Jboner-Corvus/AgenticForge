import { z } from 'zod';
import { T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const executeShellCommandParams: z.ZodObject<{
    command: z.ZodString;
    detach: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    command: string;
    detach?: boolean | undefined;
}, {
    command: string;
    detach?: boolean | undefined;
}>;
declare const executeShellCommandOutput: z.ZodObject<{
    exitCode: z.ZodNullable<z.ZodNumber>;
    stderr: z.ZodString;
    stdout: z.ZodString;
}, "strip", z.ZodTypeAny, {
    exitCode: number | null;
    stderr: string;
    stdout: string;
}, {
    exitCode: number | null;
    stderr: string;
    stdout: string;
}>;
declare const executeShellCommandTool: Tool<typeof executeShellCommandParams, typeof executeShellCommandOutput>;

export { executeShellCommandOutput, executeShellCommandParams, executeShellCommandTool };
