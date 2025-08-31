import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const AgentThoughtParams: z.ZodObject<{
    /**
     * La pensée ou réflexion de l'agent
     */
    thought: z.ZodString;
}, "strip", z.ZodTypeAny, {
    thought: string;
}, {
    thought: string;
}>;
declare const agentThoughtTool: Tool<typeof AgentThoughtParams>;

export { agentThoughtTool };
