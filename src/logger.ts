// ===== src/logger.ts =====
import pino from 'pino';
import { config } from './config.js';

const pinoOptions: pino.LoggerOptions = {
  level: config.LOG_LEVEL,
};

// Utilise pino-pretty seulement en développement ET si nous ne sommes pas dans Docker
if (config.NODE_ENV === 'development' && !process.env.DOCKER) {
  try {
    pinoOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    };
  } catch {
    // Si pino-pretty n'est pas disponible, utilise le format par défaut
    console.warn('pino-pretty not available, using default format');
  }
}

// Use pino.default for ES module compatibility
const logger = pino.default(pinoOptions);

export default logger;
