// FICHIER : src/logger.ts
import pino from 'pino';
import pretty from 'pino-pretty';

import { config } from './config.js';

const logger = pino({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  ...(config.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:standard',
      },
    },
  }),
});

export default logger;