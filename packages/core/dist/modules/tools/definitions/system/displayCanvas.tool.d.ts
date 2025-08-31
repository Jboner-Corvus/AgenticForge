import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const DisplayCanvasParams: z.ZodObject<{
    /**
     * Le contenu à afficher dans le canvas
     */
    content: z.ZodString;
    /**
     * Le type de contenu (html, markdown, text, url, project)
     */
    contentType: z.ZodOptional<z.ZodEnum<["html", "markdown", "text", "url", "project"]>>;
    /**
     * Titre optionnel pour le canvas
     */
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    title?: string | undefined;
    contentType?: "text" | "html" | "markdown" | "url" | "project" | undefined;
}, {
    content: string;
    title?: string | undefined;
    contentType?: "text" | "html" | "markdown" | "url" | "project" | undefined;
}>;
declare const displayCanvasTool: Tool<typeof DisplayCanvasParams>;

export { displayCanvasTool };
