// FICHIER : src/logger.ts
import { pino } from 'pino';

import { config } from './config.js';

const logger = pino({
  level: 'debug',
  ...(config.NODE_ENV === 'development' && {
    transport: {
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:standard',
        singleLine: false,
        depth: 5,
      },
      target: 'pino-pretty',
    },
  }),
});

export default logger;
