// FICHIER : src/logger.ts
import pino from 'pino';
import pretty from 'pino-pretty';
import { config } from './config.js';

const stream = pretty({
  colorize: true,
  levelFirst: true,
  translateTime: 'SYS:standard',
});

const logger = pino(
  {
    level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  },
  stream,
);

export default logger;