// ===== src/logger.ts (Final and Robust) =====
import { pino } from 'pino';
import { config } from './config.js';

const pinoOptions: pino.LoggerOptions = {
  level: config.LOG_LEVEL,
  // NOTE: The pino-pretty transport is no longer configured in code
  // to avoid deployment errors in Docker.
  // For "pretty" display in local development, you can run
  // your application and pipe the output to pino-pretty.
  // Example: `pnpm run dev | pnpm exec pino-pretty`
};

const logger = pino(pinoOptions);

export default logger;
