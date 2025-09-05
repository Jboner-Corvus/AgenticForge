import { z } from 'zod';
import { T as Tool } from '../../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'pg';
import '../../../llm/LlmKeyManager.js';
import 'pino';

declare const CanvasConsoleFeedbackParams: z.ZodObject<{
    /**
     * Action à effectuer (get_logs, clear_logs, enable_capture, disable_capture)
     */
    action: z.ZodDefault<z.ZodOptional<z.ZodEnum<["get_logs", "clear_logs", "enable_capture", "disable_capture"]>>>;
    /**
     * Filtre par niveau de log (log, error, warn, info, debug)
     */
    level: z.ZodOptional<z.ZodEnum<["log", "error", "warn", "info", "debug"]>>;
    /**
     * Nombre maximum de logs à récupérer
     */
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /**
     * Filtre par pattern dans le message
     */
    filter: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    action: "get_logs" | "clear_logs" | "enable_capture" | "disable_capture";
    filter?: string | undefined;
    level?: "debug" | "error" | "warn" | "info" | "log" | undefined;
}, {
    filter?: string | undefined;
    level?: "debug" | "error" | "warn" | "info" | "log" | undefined;
    limit?: number | undefined;
    action?: "get_logs" | "clear_logs" | "enable_capture" | "disable_capture" | undefined;
}>;
declare const canvasConsoleFeedbackTool: Tool<typeof CanvasConsoleFeedbackParams>;

export { canvasConsoleFeedbackTool };
