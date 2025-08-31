import { z } from 'zod';
import { C as Ctx, T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const parameters: z.ZodObject<{
    todos: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "completed"]>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "in_progress" | "completed";
        content: string;
        id: string;
    }, {
        status: "pending" | "in_progress" | "completed";
        content: string;
        id: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    todos: {
        status: "pending" | "in_progress" | "completed";
        content: string;
        id: string;
    }[];
}, {
    todos: {
        status: "pending" | "in_progress" | "completed";
        content: string;
        id: string;
    }[];
}>;
declare const todoWriteOutput: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    todos: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "completed"]>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "in_progress" | "completed";
        content: string;
        id: string;
    }, {
        status: "pending" | "in_progress" | "completed";
        content: string;
        id: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    todos: {
        status: "pending" | "in_progress" | "completed";
        content: string;
        id: string;
    }[];
}, {
    message: string;
    success: boolean;
    todos: {
        status: "pending" | "in_progress" | "completed";
        content: string;
        id: string;
    }[];
}>;
type TodoWriteTool = {
    execute: (args: z.infer<typeof parameters>, ctx: Ctx) => Promise<z.infer<typeof todoWriteOutput>>;
} & Tool<typeof parameters, typeof todoWriteOutput>;
declare const todoWriteTool: TodoWriteTool;
declare const getTodosForSession: (sessionKey: string) => {
    status: "pending" | "in_progress" | "completed";
    content: string;
    id: string;
}[];

export { todoWriteTool as default, getTodosForSession, parameters, todoWriteOutput, todoWriteTool };
