import { Logger, pino } from 'pino';
export type { Logger };

import { getConfig } from './config.ts';

let loggerInstance: Logger | undefined;

export function getLogger(): Logger {
  if (!loggerInstance) {
    const config = getConfig();
    loggerInstance = pino({
      level: config.LOG_LEVEL || 'info',
      serializers: {
        // Filtrer les objets Zod pour éviter les logs verbeux
        tool: (tool: any) => {
          if (tool && typeof tool === 'object' && tool.parameters) {
            // Ne pas afficher les détails complets des paramètres Zod
            return {
              name: tool.name,
              description: tool.description,
              // Masquer les paramètres Zod verbeux
              parameters: '[ZodObject - details hidden to reduce verbosity]'
            };
          }
          return tool;
        },
        // Serializer pour les objets Zod dans les logs
        zod: (obj: any) => {
          if (obj && typeof obj === 'object' && obj._def) {
            // Ne pas afficher les détails internes des objets Zod
            return '[ZodObject - details hidden]';
          }
          return obj;
        },
        // Serializer pour les paramètres d'outils
        toolParameters: (params: any) => {
          if (params && typeof params === 'object' && params._def) {
            // Ne pas afficher les détails complets des schémas Zod
            return '[ZodSchema - details hidden to reduce verbosity]';
          }
          return params;
        }
      },
      ...(config.NODE_ENV === 'development' && {
        transport: {
          options: {
            colorize: true,
            depth: 2,  // Réduire encore la profondeur d'affichage
            levelFirst: true,
            singleLine: false,
            translateTime: 'SYS:standard',
          },
          target: 'pino-pretty',
        },
      }),
    });
  }
  return loggerInstance;
}

export const getLoggerInstance = getLogger;

export function resetLoggerForTesting(): void {
  loggerInstance = undefined;
}
