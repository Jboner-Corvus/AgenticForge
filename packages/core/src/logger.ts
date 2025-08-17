import { Logger, pino } from 'pino';
export type { Logger };

import { getConfig } from './config.ts';

let loggerInstance: Logger | undefined;

export function getLogger(): Logger {
  if (!loggerInstance) {
    const config = getConfig();
    loggerInstance = pino({
      level: config.LOG_LEVEL || 'debug',
      ...(config.NODE_ENV === 'development' && {
        transport: {
          options: {
            colorize: true,
            depth: 5,
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
