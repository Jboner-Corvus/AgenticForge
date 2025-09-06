import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const navigateParams: z.ZodObject<{
    url: z.ZodString;
    waitUntil: z.ZodOptional<z.ZodEnum<["load", "domcontentloaded", "networkidle"]>>;
}, "strip", z.ZodTypeAny, {
    url: string;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | undefined;
}, {
    url: string;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | undefined;
}>;
declare const clickParams: z.ZodObject<{
    selector: z.ZodString;
    button: z.ZodDefault<z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>>;
}, "strip", z.ZodTypeAny, {
    selector: string;
    button: "left" | "right" | "middle";
}, {
    selector: string;
    button?: "left" | "right" | "middle" | undefined;
}>;
declare const typeParams: z.ZodObject<{
    selector: z.ZodString;
    text: z.ZodString;
    clear: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    selector: string;
    text: string;
    clear: boolean;
}, {
    selector: string;
    text: string;
    clear?: boolean | undefined;
}>;
declare const screenshotParams: z.ZodObject<{
    fullPage: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    selector: z.ZodOptional<z.ZodString>;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["png", "jpeg"]>>>;
    quality: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    fullPage: boolean;
    format: "png" | "jpeg";
    selector?: string | undefined;
    quality?: number | undefined;
}, {
    selector?: string | undefined;
    fullPage?: boolean | undefined;
    format?: "png" | "jpeg" | undefined;
    quality?: number | undefined;
}>;
declare const evaluateParams: z.ZodObject<{
    script: z.ZodString;
    returnByValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    script: string;
    returnByValue: boolean;
}, {
    script: string;
    returnByValue?: boolean | undefined;
}>;
declare const waitForSelectorParams: z.ZodObject<{
    selector: z.ZodString;
    timeout: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    state: z.ZodDefault<z.ZodOptional<z.ZodEnum<["attached", "detached", "visible", "hidden"]>>>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    selector: string;
    state: "attached" | "detached" | "visible" | "hidden";
}, {
    selector: string;
    timeout?: number | undefined;
    state?: "attached" | "detached" | "visible" | "hidden" | undefined;
}>;
declare const getContentParams: z.ZodObject<{
    selector: z.ZodOptional<z.ZodString>;
    property: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    property?: string | undefined;
    selector?: string | undefined;
}, {
    property?: string | undefined;
    selector?: string | undefined;
}>;
declare const setViewportParams: z.ZodObject<{
    width: z.ZodNumber;
    height: z.ZodNumber;
    deviceScaleFactor: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    width: number;
    height: number;
    deviceScaleFactor: number;
}, {
    width: number;
    height: number;
    deviceScaleFactor?: number | undefined;
}>;
declare const playwrightNavigateTool: Tool<typeof navigateParams, any>;
declare const playwrightClickTool: Tool<typeof clickParams, any>;
declare const playwrightTypeTool: Tool<typeof typeParams, any>;
declare const playwrightScreenshotTool: Tool<typeof screenshotParams, any>;
declare const playwrightEvaluateTool: Tool<typeof evaluateParams, any>;
declare const playwrightWaitForSelectorTool: Tool<typeof waitForSelectorParams, any>;
declare const playwrightGetContentTool: Tool<typeof getContentParams, any>;
declare const playwrightSetViewportTool: Tool<typeof setViewportParams, any>;
declare const playwrightMcpTools: (Tool<z.ZodObject<{
    url: z.ZodString;
    waitUntil: z.ZodOptional<z.ZodEnum<["load", "domcontentloaded", "networkidle"]>>;
}, "strip", z.ZodTypeAny, {
    url: string;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | undefined;
}, {
    url: string;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | undefined;
}>, any> | Tool<z.ZodObject<{
    selector: z.ZodString;
    button: z.ZodDefault<z.ZodOptional<z.ZodEnum<["left", "right", "middle"]>>>;
}, "strip", z.ZodTypeAny, {
    selector: string;
    button: "left" | "right" | "middle";
}, {
    selector: string;
    button?: "left" | "right" | "middle" | undefined;
}>, any> | Tool<z.ZodObject<{
    selector: z.ZodString;
    text: z.ZodString;
    clear: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    selector: string;
    text: string;
    clear: boolean;
}, {
    selector: string;
    text: string;
    clear?: boolean | undefined;
}>, any> | Tool<z.ZodObject<{
    script: z.ZodString;
    returnByValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    script: string;
    returnByValue: boolean;
}, {
    script: string;
    returnByValue?: boolean | undefined;
}>, any> | Tool<z.ZodObject<{
    selector: z.ZodString;
    timeout: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    state: z.ZodDefault<z.ZodOptional<z.ZodEnum<["attached", "detached", "visible", "hidden"]>>>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    selector: string;
    state: "attached" | "detached" | "visible" | "hidden";
}, {
    selector: string;
    timeout?: number | undefined;
    state?: "attached" | "detached" | "visible" | "hidden" | undefined;
}>, any> | Tool<z.ZodObject<{
    selector: z.ZodOptional<z.ZodString>;
    property: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    property?: string | undefined;
    selector?: string | undefined;
}, {
    property?: string | undefined;
    selector?: string | undefined;
}>, any> | Tool<z.ZodObject<{
    width: z.ZodNumber;
    height: z.ZodNumber;
    deviceScaleFactor: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    width: number;
    height: number;
    deviceScaleFactor: number;
}, {
    width: number;
    height: number;
    deviceScaleFactor?: number | undefined;
}>, any>)[];

export { playwrightClickTool, playwrightEvaluateTool, playwrightGetContentTool, playwrightMcpTools, playwrightNavigateTool, playwrightScreenshotTool, playwrightSetViewportTool, playwrightTypeTool, playwrightWaitForSelectorTool };
