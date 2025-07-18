// FICHIER : src/logger.ts
import { pino } from 'pino';

import { config } from './config.js';

const logger = pino({
  level: 'debug',
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
