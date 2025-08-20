import { Logger } from 'pino';
import { vi } from 'vitest';

export const mockLogger: Logger = {
  child: vi.fn(() => mockLogger), // child returns the same mock logger
  customLevels: {},
  debug: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  info: vi.fn(),
  trace: vi.fn(),
  useOnlyCustomLevels: false,
  warn: vi.fn(),
} as any;

export const getLogger = vi.fn((): Logger => mockLogger);
export const getLoggerInstance = getLogger;
