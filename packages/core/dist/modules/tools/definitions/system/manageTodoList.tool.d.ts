import { z } from 'zod';
import { C as Ctx, T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const parameters: z.ZodObject<{
    action: z.ZodEnum<["create", "update", "display", "clear"]>;
    todos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "completed"]>;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
        category: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        priority?: "high" | "low" | "medium" | undefined;
        category?: string | undefined;
    }, {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        priority?: "high" | "low" | "medium" | undefined;
        category?: string | undefined;
    }>, "many">>;
    itemId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "completed"]>>;
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "create" | "display" | "clear" | "update";
    status?: "in_progress" | "pending" | "completed" | undefined;
    title?: string | undefined;
    todos?: {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        priority?: "high" | "low" | "medium" | undefined;
        category?: string | undefined;
    }[] | undefined;
    itemId?: string | undefined;
}, {
    action: "create" | "display" | "clear" | "update";
    status?: "in_progress" | "pending" | "completed" | undefined;
    title?: string | undefined;
    todos?: {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        priority?: "high" | "low" | "medium" | undefined;
        category?: string | undefined;
    }[] | undefined;
    itemId?: string | undefined;
}>;
declare const todoListOutput: z.ZodUnion<[z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    todos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "completed"]>;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
        category: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        priority?: "high" | "low" | "medium" | undefined;
        category?: string | undefined;
    }, {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        priority?: "high" | "low" | "medium" | undefined;
        category?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    todos?: {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        priority?: "high" | "low" | "medium" | undefined;
        category?: string | undefined;
    }[] | undefined;
}, {
    message: string;
    success: boolean;
    todos?: {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        priority?: "high" | "low" | "medium" | undefined;
        category?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error: string;
}, {
    error: string;
}>]>;
type TodoListTool = {
    execute: (args: z.infer<typeof parameters>, ctx: Ctx) => Promise<z.infer<typeof todoListOutput>>;
} & Tool<typeof parameters, typeof todoListOutput>;
declare const manageTodoListTool: TodoListTool;

export { manageTodoListTool as default, manageTodoListTool, parameters, todoListOutput };
