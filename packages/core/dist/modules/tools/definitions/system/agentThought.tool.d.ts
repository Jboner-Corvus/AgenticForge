import { z } from 'zod';
import { T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
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
