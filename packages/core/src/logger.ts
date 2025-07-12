// FICHIER : src/logger.ts
import { pino } from 'pino';

import { config } from './config.js';

const logger = pino({
  level: 'info',
  ...(config.NODE_ENV === 'development' && {
    transport: {
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:standard',
      },
      target: 'pino-pretty',
    },
  }),
});

export default logger;
