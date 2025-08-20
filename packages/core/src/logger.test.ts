import { pino } from 'pino';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { getLogger, resetLoggerForTesting } from './logger.ts';

vi.mock('pino', () => ({
  pino: vi.fn(() => ({ info: vi.fn(), trace: vi.fn() })),
}));

vi.mock('./logger.ts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getLogger: vi.fn().mockImplementation(() => {
      return pino();
    }),
    resetLoggerForTesting: vi.fn(),
  };
});

describe('logger', () => {
  beforeEach(() => {
    (resetLoggerForTesting as import('vitest').Mock).mockClear();
    (getLogger as import('vitest').Mock).mockClear();
    (pino as unknown as import('vitest').Mock).mockClear();
  });

  it('should be an instance of a pino logger', () => {
    const logger = getLogger();
    expect(logger).toBeDefined();
    expect(pino).toHaveBeenCalled();
  });
});
