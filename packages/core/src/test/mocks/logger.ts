import { vi } from 'vitest';

const mockChildLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

const mockLogger = {
  child: vi.fn(() => mockChildLogger),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

export const getLogger = vi.fn(() => mockLogger);

export default mockLogger;
