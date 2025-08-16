import { vi } from 'vitest';

const mockLogger = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  trace: vi.fn(),
  warn: vi.fn(),
};

export const getLogger = vi.fn(() => mockLogger);
export const getLoggerInstance = getLogger;
