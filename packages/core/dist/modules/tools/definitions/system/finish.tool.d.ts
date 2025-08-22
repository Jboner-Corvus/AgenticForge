import { z } from 'zod';
import { C as Ctx, T as Tool } from '../../../../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const parameters: z.ZodObject<{
    response: z.ZodString;
}, "strip", z.ZodTypeAny, {
    response: string;
}, {
    response: string;
}>;
declare const finishOutput: z.ZodString;
type FinishTool = {
    execute: (args: string | z.infer<typeof parameters>, ctx: Ctx) => Promise<string>;
} & Tool<typeof parameters, typeof finishOutput>;
declare class FinishToolSignal extends Error {
    readonly response: string;
    constructor(response: string);
}
declare const finishTool: FinishTool;

export { FinishToolSignal, finishOutput, finishTool, parameters };
