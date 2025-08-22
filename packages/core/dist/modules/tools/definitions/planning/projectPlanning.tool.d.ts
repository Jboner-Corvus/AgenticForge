import { z } from 'zod';
import { C as Ctx, T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const projectPlanningParams: z.ZodObject<{
    projectName: z.ZodString;
    projectDescription: z.ZodString;
    projectId: z.ZodOptional<z.ZodString>;
    complexity: z.ZodOptional<z.ZodEnum<["simple", "medium", "complex"]>>;
}, "strip", z.ZodTypeAny, {
    projectName: string;
    projectDescription: string;
    projectId?: string | undefined;
    complexity?: "simple" | "medium" | "complex" | undefined;
}, {
    projectName: string;
    projectDescription: string;
    projectId?: string | undefined;
    complexity?: "simple" | "medium" | "complex" | undefined;
}>;
declare const projectPlanningOutput: z.ZodUnion<[z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    plan: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        phase: z.ZodString;
        priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
        estimatedTime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        description: string;
        phase: string;
        priority: "medium" | "low" | "high" | "critical";
        estimatedTime: number;
    }, {
        id: string;
        title: string;
        description: string;
        phase: string;
        priority: "medium" | "low" | "high" | "critical";
        estimatedTime: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    plan: {
        id: string;
        title: string;
        description: string;
        phase: string;
        priority: "medium" | "low" | "high" | "critical";
        estimatedTime: number;
    }[];
}, {
    message: string;
    success: boolean;
    plan: {
        id: string;
        title: string;
        description: string;
        phase: string;
        priority: "medium" | "low" | "high" | "critical";
        estimatedTime: number;
    }[];
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
