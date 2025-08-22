import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getConfig
} from "./chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/logger.ts
init_esm_shims();
import { pino } from "pino";
var loggerInstance;
function getLogger() {
  if (!loggerInstance) {
    const config = getConfig();
    loggerInstance = pino({
      level: config.LOG_LEVEL || "info",
      serializers: {
        // Filtrer les objets Zod pour éviter les logs verbeux
        tool: (tool) => {
          if (tool && typeof tool === "object" && tool.parameters) {
            return {
              name: tool.name,
              description: tool.description,
              // Masquer les paramètres Zod verbeux
              parameters: "[ZodObject - details hidden to reduce verbosity]"
            };
          }
          return tool;
        },
        // Serializer pour les objets Zod dans les logs
        zod: (obj) => {
          if (obj && typeof obj === "object" && obj._def) {
            return "[ZodObject - details hidden]";
          }
          return obj;
        },
        // Serializer pour les paramètres d'outils
        toolParameters: (params) => {
          if (params && typeof params === "object" && params._def) {
            return "[ZodSchema - details hidden to reduce verbosity]";
          }
          return params;
        }
      },
      ...config.NODE_ENV === "development" && {
        transport: {
          options: {
            colorize: true,
            depth: 2,
            // Réduire encore la profondeur d'affichage
            levelFirst: true,
            singleLine: false,
            translateTime: "SYS:standard"
          },
          target: "pino-pretty"
        }
      }
    });
  }
  return loggerInstance;
}
var getLoggerInstance = getLogger;
function resetLoggerForTesting() {
  loggerInstance = void 0;
}

export {
  getLogger,
  getLoggerInstance,
  resetLoggerForTesting
};
