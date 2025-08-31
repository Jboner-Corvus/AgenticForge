import { vi } from 'vitest';

// Create a mock logger type that matches pino's interface
interface MockLogger {
  child: (bindings: any) => MockLogger;
  debug: (...args: any[]) => void;
  error: (...args: any[]) => void;
  fatal: (...args: any[]) => void;
  info: (...args: any[]) => void;
  trace: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  customLevels: Record<string, number>;
  useOnlyCustomLevels: boolean;
}

export const mockLogger: MockLogger = {
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

export const getLogger = vi.fn((): MockLogger => mockLogger);
export const getLoggerInstance = getLogger;
