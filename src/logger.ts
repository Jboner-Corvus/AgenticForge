import pino from 'pino';
import { config } from './config.js';

const pinoOptions: pino.LoggerOptions = {
  level: config.LOG_LEVEL,
};

if (config.NODE_ENV === 'development') {
  pinoOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

// Use pino.default for ES module compatibility
const logger = pino.default(pinoOptions);

export default logger;
