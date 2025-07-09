import type { Context as FastMCPContext } from 'fastmcp';

import { z, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';
export interface AgentSession {
    data: SessionData;
    id: string;
}
export type Ctx = FastMCPContext<SessionData>;
export interface Message {
    content: string;
    role: 'model' | 'tool' | 'user';
}
export interface SessionData {
    [key: string]: unknown;
    history: Message[];
    id: string;
    identities: Array<{
        id: string;
        type: string;
    }>;
}
export interface Tool<T extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>, U extends ZodTypeAny = ZodTypeAny> {
    description: string;
    execute: (args: z.infer<T>, context: Ctx) => Promise<string | void | z.infer<U>>;
    name: string;
    output?: U;
    parameters: T;
}
//# sourceMappingURL=types.d.ts.map
