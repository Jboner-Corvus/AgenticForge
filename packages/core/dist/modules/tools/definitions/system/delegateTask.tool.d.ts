import { z } from 'zod';
import { T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const delegateTaskParams: z.ZodObject<{
    taskDescription: z.ZodString;
    agent: z.ZodEnum<["gemini-cli", "qwen-cli"]>;
}, "strip", z.ZodTypeAny, {
    taskDescription: string;
    agent: "gemini-cli" | "qwen-cli";
}, {
    taskDescription: string;
    agent: "gemini-cli" | "qwen-cli";
}>;
declare const delegateTaskTool: Tool<typeof delegateTaskParams>;

export { delegateTaskTool as default };
