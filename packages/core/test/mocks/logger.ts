import { vi } from 'vitest';
import { Logger } from 'pino';

export const mockLogger: Logger = {
  child: vi.fn(() => mockLogger), // child returns the same mock logger
  debug: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  info: vi.fn(),
  trace: vi.fn(),
  warn: vi.fn(),
  customLevels: {},
  useOnlyCustomLevels: false,
} as any;