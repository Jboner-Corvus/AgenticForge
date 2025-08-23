import { z } from 'zod';
import { T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const delegateTaskParams: z.ZodObject<{
    agent: z.ZodEnum<["gemini-cli", "qwen-cli"]>;
    taskDescription: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agent: "gemini-cli" | "qwen-cli";
    taskDescription: string;
}, {
    agent: "gemini-cli" | "qwen-cli";
    taskDescription: string;
}>;
declare const delegateTaskTool: Tool<typeof delegateTaskParams>;

export { delegateTaskTool as default };
