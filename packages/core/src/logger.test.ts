/// <reference types="vitest/globals" />

import { pino } from 'pino';
import { describe, expect, it, vi } from 'vitest';

import { getLogger } from './logger.js';

vi.mock('pino', () => ({
  pino: vi.fn(() => ({ info: vi.fn(), trace: vi.fn() })),
}));

describe('logger', () => {
  it('should be an instance of a pino logger', () => {
    const logger = getLogger();
    expect(logger).toBeDefined();
    expect(pino).toHaveBeenCalled();
  });
});
