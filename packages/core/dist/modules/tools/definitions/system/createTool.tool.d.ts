import { z } from 'zod';
import { T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const parameters: z.ZodObject<{
    description: z.ZodString;
    execute_function: z.ZodString;
    parameters: z.ZodString;
    tool_name: z.ZodString;
    run_checks: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description: string;
    execute_function: string;
    parameters: string;
    tool_name: string;
    run_checks?: boolean | undefined;
}, {
    description: string;
    execute_function: string;
    parameters: string;
    tool_name: string;
    run_checks?: boolean | undefined;
}>;
declare const createToolTool: Tool<typeof parameters>;

export { createToolTool, parameters };
