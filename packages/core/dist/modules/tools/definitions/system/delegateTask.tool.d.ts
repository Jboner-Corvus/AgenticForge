import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
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
