import { z } from 'zod';
import { C as Ctx, T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const parameters: z.ZodObject<{
    action: z.ZodEnum<["create", "update", "display", "clear"]>;
    itemId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "completed"]>>;
    title: z.ZodOptional<z.ZodString>;
    todos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        content: z.ZodString;
        id: z.ZodString;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
        status: z.ZodEnum<["pending", "in_progress", "completed"]>;
    }, "strip", z.ZodTypeAny, {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        category?: string | undefined;
        priority?: "high" | "low" | "medium" | undefined;
    }, {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        category?: string | undefined;
        priority?: "high" | "low" | "medium" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    action: "create" | "display" | "clear" | "update";
    status?: "in_progress" | "pending" | "completed" | undefined;
    title?: string | undefined;
    itemId?: string | undefined;
    todos?: {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        category?: string | undefined;
        priority?: "high" | "low" | "medium" | undefined;
    }[] | undefined;
}, {
    action: "create" | "display" | "clear" | "update";
    status?: "in_progress" | "pending" | "completed" | undefined;
    title?: string | undefined;
    itemId?: string | undefined;
    todos?: {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        category?: string | undefined;
        priority?: "high" | "low" | "medium" | undefined;
    }[] | undefined;
}>;
declare const todoListOutput: z.ZodUnion<[z.ZodObject<{
    message: z.ZodString;
    success: z.ZodBoolean;
    todos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        content: z.ZodString;
        id: z.ZodString;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
        status: z.ZodEnum<["pending", "in_progress", "completed"]>;
    }, "strip", z.ZodTypeAny, {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        category?: string | undefined;
        priority?: "high" | "low" | "medium" | undefined;
    }, {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        category?: string | undefined;
        priority?: "high" | "low" | "medium" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    todos?: {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        category?: string | undefined;
        priority?: "high" | "low" | "medium" | undefined;
    }[] | undefined;
}, {
    message: string;
    success: boolean;
    todos?: {
        status: "in_progress" | "pending" | "completed";
        id: string;
        content: string;
        category?: string | undefined;
        priority?: "high" | "low" | "medium" | undefined;
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
