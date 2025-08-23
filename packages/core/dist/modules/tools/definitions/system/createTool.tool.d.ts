import { z } from 'zod';
import { T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const parameters: z.ZodObject<{
    description: z.ZodString;
    execute_function: z.ZodString;
    parameters: z.ZodString;
    run_checks: z.ZodOptional<z.ZodBoolean>;
    tool_name: z.ZodString;
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
