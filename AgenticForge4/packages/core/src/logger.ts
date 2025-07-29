import { pino } from 'pino';

// FICHIER : src/logger.ts
import { config } from './config.js';

const logger = pino({
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

export default logger;
