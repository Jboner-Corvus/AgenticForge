import { vi } from 'vitest';

const loggerMock = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

export default loggerMock;
