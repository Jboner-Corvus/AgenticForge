import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "../../../../chunk-YEKQLZW5.js";
import "../../../../chunk-6533HQRT.js";
import "../../../../chunk-SL6HGGTS.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/canvasConsoleFeedback.tool.ts
init_esm_shims();
import { z } from "zod";
var CanvasConsoleFeedbackParams = z.object({
  /**
   * Action à effectuer (get_logs, clear_logs, enable_capture, disable_capture)
   */
  action: z.enum(["get_logs", "clear_logs", "enable_capture", "disable_capture"]).optional().default("get_logs"),
  /**
   * Filtre par niveau de log (log, error, warn, info, debug)
   */
  level: z.enum(["log", "error", "warn", "info", "debug"]).optional(),
  /**
   * Nombre maximum de logs à récupérer
   */
  limit: z.number().min(1).max(100).optional().default(50),
  /**
   * Filtre par pattern dans le message
   */
  filter: z.string().optional()
});
var canvasConsoleFeedbackTool = {
  description: "\u{1F50D} CANVAS CONSOLE FEEDBACK - Obtient les logs console du canvas pour debugging frontend. Permet de r\xE9cup\xE9rer, filtrer et g\xE9rer les logs console du contenu affich\xE9 dans le canvas.",
  execute: async (params, context) => {
    const { job, log } = context;
    const parsedParams = CanvasConsoleFeedbackParams.parse(params);
    const { action = "get_logs", level, limit = 50, filter } = parsedParams;
    if (!job?.id) {
      throw new Error("No job ID available for canvas console feedback");
    }
    const redisClient = getRedisClientInstance();
    try {
      log.info(`\u{1F50D} Canvas Console Feedback - Action: ${action}`);
      const message = JSON.stringify({
        type: "canvas_console_feedback",
        action,
        level,
        limit,
        filter,
        timestamp: Date.now(),
        toolName: "canvas_console_feedback"
      });
      const channel = `job:${job.id}:events`;
      await redisClient.publish(channel, message);
      let responseMessage = "";
      switch (action) {
        case "get_logs":
          responseMessage = `\u{1F4CB} R\xE9cup\xE9ration des logs console${level ? ` (niveau: ${level})` : ""}${filter ? ` (filtre: ${filter})` : ""}`;
          break;
        case "clear_logs":
          responseMessage = "\u{1F9F9} Logs console effac\xE9s";
          break;
        case "enable_capture":
          responseMessage = "\u{1F3AF} Capture console activ\xE9e";
          break;
        case "disable_capture":
          responseMessage = "\u23F8\uFE0F Capture console d\xE9sactiv\xE9e";
          break;
      }
      log.info(`\u2705 ${responseMessage}`);
      return {
        success: true,
        message: responseMessage,
        data: {
          action,
          level,
          limit,
          filter
        }
      };
    } catch (error) {
      log.error({ err: error }, "\u{1F4A5} Erreur canvas console feedback");
      throw new Error(
        `Canvas console feedback failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  name: "canvas_console_feedback",
  parameters: CanvasConsoleFeedbackParams
};
export {
  canvasConsoleFeedbackTool
};
