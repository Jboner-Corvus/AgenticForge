import pino from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('pino', () => ({
  default: vi.fn(() => ({ info: vi.fn(), trace: vi.fn() })),
}));

vi.mock('./logger.ts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
  };
});

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be an instance of a pino logger', async () => {
    // Reset the logger instance for testing
    const loggerModule = await import('./logger.ts');
    loggerModule.resetLoggerForTesting();

    const logger = loggerModule.getLogger();
    expect(logger).toBeDefined();
    expect(pino).toHaveBeenCalled();
  });
});
