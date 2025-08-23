import { z } from 'zod';
import { T as Tool } from '../../../../types-X5iVOMgV.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import 'pino';

declare const DisplayCanvasParams: z.ZodObject<{
    /**
     * Le contenu à afficher dans le canvas
     */
    content: z.ZodString;
    /**
     * Le type de contenu (html, markdown, text, url)
     */
    contentType: z.ZodOptional<z.ZodEnum<["html", "markdown", "text", "url"]>>;
    /**
     * Titre optionnel pour le canvas
     */
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    title?: string | undefined;
    contentType?: "text" | "html" | "markdown" | "url" | undefined;
}, {
    content: string;
    title?: string | undefined;
    contentType?: "text" | "html" | "markdown" | "url" | undefined;
}>;
declare const displayCanvasTool: Tool<typeof DisplayCanvasParams>;

export { displayCanvasTool };
