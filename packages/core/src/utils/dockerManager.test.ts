import { PassThrough } from 'stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '../config.js';
import { UserError } from './errorUtils.js';

interface ErrorWithStatusCode extends Error {
  statusCode?: number;
}

interface MockContainer {
  logs: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  wait: ReturnType<typeof vi.fn>;
}

interface MockDockerInstance {
  createContainer: ReturnType<typeof vi.fn>;
  getImage: ReturnType<typeof vi.fn>;
  modem: {
    followProgress: ReturnType<typeof vi.fn>;
  };
  pull: ReturnType<typeof vi.fn>;
}

// Define mockDockerInstance at the top level
const mockDockerInstance: any = {
  createContainer: vi.fn(),
  getImage: vi.fn(() => ({
    inspect: vi.fn(),
  })),
  modem: {
    followProgress: vi.fn(),
  },
  pull: vi.fn(),
};

// Mock the entire dockerode module to return our mock instance
vi.mock('dockerode', () => {
  const MockDockerConstructor = vi.fn(() => mockDockerInstance);
  return {
    default: MockDockerConstructor,
  };
});

describe('DockerManager', () => {
  let mockContainer: MockContainer;
  let runInSandbox: typeof import('./dockerManager.js').runInSandbox; // Declare type

  beforeEach(async () => {
    // Clear all mocks before each test
    mockDockerInstance.createContainer.mockClear();
    mockDockerInstance.getImage.mockClear();
    mockDockerInstance.modem.followProgress.mockClear();
    mockDockerInstance.pull.mockClear();

    mockContainer = {
      logs: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
      wait: vi.fn().mockResolvedValue({ StatusCode: 0 }),
    };

    // Configure the mockDockerInstance methods for each test
    mockDockerInstance.createContainer.mockResolvedValue(mockContainer);
    mockDockerInstance.getImage.mockImplementation(() => ({
      inspect: vi.fn().mockResolvedValue({}), // Default: image exists
    }));
    mockDockerInstance.modem.followProgress.mockImplementation((stream: any, cb: (err: Error | null, result: any) => void) => cb(null, 'Pull complete'));
    mockDockerInstance.pull.mockImplementation((_image: string, cb: (err: Error | null, stream: any) => void) => {
      const stream = new PassThrough();
      if (cb) {
        cb(null, stream);
      }
      setTimeout(() => stream.end(), 10);
      return Promise.resolve(stream);
    });

    // Dynamically import runInSandbox after mocks are set up
    ({ runInSandbox } = await import('./dockerManager.js'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute a command in a sandbox and return stdout', async () => {
    const payload = Buffer.from('hello world');
    const header = Buffer.alloc(8);
    header.writeUInt8(1, 0); // stdout
    header.writeUInt32BE(payload.length, 4);
    const logBuffer = Buffer.concat([header, payload]);
    mockContainer.logs.mockResolvedValue(logBuffer);

    const result = await runInSandbox('test-image', ['echo', 'hello world'], {}, mockDockerInstance);

    expect(mockDockerInstance.createContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        Cmd: ['echo', 'hello world'],
        Image: 'test-image',
      }),
    );
    expect(mockContainer.start).toHaveBeenCalled();
    expect(mockContainer.wait).toHaveBeenCalled();
    expect(result.stdout).toBe('hello world');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
    expect(mockContainer.remove).toHaveBeenCalled();
  });

  it('should handle stderr correctly', async () => {
    const payload = Buffer.from('error message');
    const header = Buffer.alloc(8);
    header.writeUInt8(2, 0); // stderr
    header.writeUInt32BE(payload.length, 4);
    const logBuffer = Buffer.concat([header, payload]);
    mockContainer.logs.mockResolvedValue(logBuffer);
    mockContainer.wait.mockResolvedValue({ StatusCode: 1 });

    const result = await runInSandbox('test-image', ['ls', '/nonexistent'], {}, mockDockerInstance);

    expect(result.stderr).toBe('error message');
    expect(result.stdout).toBe('');
    expect(result.exitCode).toBe(1);
  });

  it('should time out if execution takes too long', async () => {
    config.CODE_EXECUTION_TIMEOUT_MS = 50; // Set a short timeout for testing
    mockContainer.wait.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ StatusCode: 0 }), 100),
        ),
    );

    await expect(runInSandbox('test-image', ['sleep', '1'], {}, mockDockerInstance)).rejects.toThrow(
      UserError,
    );
    await expect(runInSandbox('test-image', ['sleep', '1'], {}, mockDockerInstance)).rejects.toThrow(
      'Execution timed out',
    );
  });

  it('should pull the image if it does not exist locally', async () => {
    // Configure getImage pour simuler que l'image n'existe pas
    const inspectError = new Error('Not Found');
    (inspectError as ErrorWithStatusCode).statusCode = 404;
    mockDockerInstance.getImage.mockReturnValue({
      inspect: vi.fn().mockRejectedValue(inspectError),
    });

    // Add mock for logs here
    const payload = Buffer.from('test'); // Define payload first
    const header = Buffer.alloc(8);
    header.writeUInt8(1, 0); // stdout
    header.writeUInt32BE(payload.length, 4);
    const logBuffer = Buffer.concat([header, payload]);
    mockContainer.logs.mockResolvedValue(logBuffer);

    await runInSandbox('new-image', ['echo', 'test'], {}, mockDockerInstance);

    expect(mockDockerInstance.pull).toHaveBeenCalledWith('new-image');
  });
});
