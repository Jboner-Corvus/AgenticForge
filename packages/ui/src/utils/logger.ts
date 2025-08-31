// Utilitaire de logging optimisé pour la production
const isDev = process.env.NODE_ENV === 'development';

interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private minLevel: number = isDev ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;

  debug(...args: unknown[]) {
    if (this.minLevel <= LOG_LEVELS.DEBUG) {
      console.log('🐛', ...args);
    }
  }

  info(...args: unknown[]) {
    if (this.minLevel <= LOG_LEVELS.INFO) {
      console.log('ℹ️', ...args);
    }
  }

  warn(...args: unknown[]) {
    if (this.minLevel <= LOG_LEVELS.WARN) {
      console.warn('⚠️', ...args);
    }
  }

  error(...args: unknown[]) {
    if (this.minLevel <= LOG_LEVELS.ERROR) {
      console.error('🚨', ...args);
    }
  }

  performance(label: string, fn: () => void) {
    if (isDev) {
      const start = performance.now();
      fn();
      const end = performance.now();
      this.debug(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
    } else {
      fn();
    }
  }
}

export const logger = new Logger();
export default logger;
