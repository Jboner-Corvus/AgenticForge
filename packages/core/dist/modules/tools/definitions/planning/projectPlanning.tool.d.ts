import { z } from 'zod';
import { C as Ctx, T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const projectPlanningParams: z.ZodObject<{
    complexity: z.ZodOptional<z.ZodEnum<["simple", "medium", "complex"]>>;
    projectDescription: z.ZodString;
    projectId: z.ZodOptional<z.ZodString>;
    projectName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    projectDescription: string;
    projectName: string;
    complexity?: "simple" | "medium" | "complex" | undefined;
    projectId?: string | undefined;
}, {
    projectDescription: string;
    projectName: string;
    complexity?: "simple" | "medium" | "complex" | undefined;
    projectId?: string | undefined;
}>;
declare const projectPlanningOutput: z.ZodUnion<[z.ZodObject<{
    message: z.ZodString;
    plan: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        estimatedTime: z.ZodNumber;
        id: z.ZodString;
        phase: z.ZodString;
        priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        estimatedTime: number;
        id: string;
        phase: string;
        priority: "medium" | "low" | "high" | "critical";
        title: string;
    }, {
        description: string;
        estimatedTime: number;
        id: string;
        phase: string;
        priority: "medium" | "low" | "high" | "critical";
        title: string;
    }>, "many">;
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    message: string;
    plan: {
        description: string;
        estimatedTime: number;
        id: string;
        phase: string;
        priority: "medium" | "low" | "high" | "critical";
        title: string;
    }[];
    success: boolean;
}, {
    message: string;
    plan: {
        description: string;
        estimatedTime: number;
        id: string;
        phase: string;
        priority: "medium" | "low" | "high" | "critical";
        title: string;
    }[];
    success: boolean;
}>, z.ZodObject<{
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error: string;
}, {
    error: string;
}>]>;
type ProjectPlanningTool = {
    execute: (args: z.infer<typeof projectPlanningParams>, ctx: Ctx) => Promise<z.infer<typeof projectPlanningOutput>>;
} & Tool<typeof projectPlanningParams, typeof projectPlanningOutput>;
declare const projectPlanningTool: ProjectPlanningTool;

export { projectPlanningTool };
