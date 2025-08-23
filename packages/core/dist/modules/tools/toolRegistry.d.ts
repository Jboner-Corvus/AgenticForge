import { z } from 'zod';
import { C as Ctx, T as Tool } from '../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare class ToolRegistry {
    private static instance;
    private readonly tools;
    private constructor();
    static getInstance(): ToolRegistry;
    clear(): void;
    execute(name: string, params: unknown, ctx: Ctx): Promise<unknown>;
    get(name: string): Tool<z.AnyZodObject, z.ZodTypeAny> | undefined;
    getAll(): Tool[];
    register(tool: Tool<z.AnyZodObject, z.ZodTypeAny>): void;
    unregister(name: string): void;
}
declare const toolRegistry: ToolRegistry;

export { toolRegistry };
