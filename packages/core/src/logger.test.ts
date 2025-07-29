import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the config module to control NODE_ENV
vi.mock('./config.js', () => ({
  config: {
    NODE_ENV: 'test', // Default to 'test' environment
  },
}));

// Mock the pino module
const pinoMock = vi.fn((options) => ({
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  level: options?.level || 'debug',
  warn: vi.fn(),
}));

vi.mock('pino', () => ({
  pino: pinoMock,
}));

describe('Logger', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // Reset module cache
    pinoMock.mockClear(); // Clear pino mock calls
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv; // Restore original NODE_ENV
  });

  it('should instantiate a pino logger with debug level', async () => {
    // Re-import logger.js to ensure it picks up the mock
    await import('./logger.ts');
    expect(pinoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
      }),
    );
  });

  it('should set the log level based on LOG_LEVEL environment variable', async () => {
    process.env.LOG_LEVEL = 'warn';
    vi.doMock('./config.js', () => ({
      config: {
        LOG_LEVEL: process.env.LOG_LEVEL,
        NODE_ENV: 'test',
      },
    }));
    vi.resetModules();
    const { getLogger: newGetLogger } = await import('./logger.ts');
    expect(newGetLogger().level).toBe('warn');
    delete process.env.LOG_LEVEL;
  });

  it('should configure pino-pretty transport in development environment', async () => {
    process.env.NODE_ENV = 'development';
    vi.doMock('./config.js', () => ({
      config: {
        NODE_ENV: 'development',
      },
    }));
    vi.resetModules();
    await import('./logger.ts');

    expect(pinoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        transport: {
          options: {
            colorize: true,
            depth: 5,
            levelFirst: true,
            singleLine: false,
            translateTime: 'SYS:standard',
          },
          target: 'pino-pretty',
        },
      }),
    );
  });

  it('should not configure pino-pretty transport in non-development environment', async () => {
    process.env.NODE_ENV = 'production';
    vi.doMock('./config.js', () => ({
      config: {
        NODE_ENV: 'production',
      },
    }));
    vi.resetModules();
    await import('./logger.ts');

    expect(pinoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
      }),
    );

    expect(pinoMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        transport: expect.anything(),
      }),
    );
  });
});
