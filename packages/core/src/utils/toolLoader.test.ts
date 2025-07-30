import * as fs from 'fs/promises';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toolRegistry } from '../modules/tools/toolRegistry';
import {
  _internalLoadTools,
  _resetTools,
  fileExtension,
  getToolsDir,
} from './toolLoader';

// Mock the entire toolRegistry module
vi.mock('../modules/tools/toolRegistry', () => ({
  toolRegistry: {
    clear: vi.fn(),
    getAll: vi.fn(() => []),
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

// Mock the logger
vi.mock('../logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../logger')>();
  const mockLoggerInstance = {
    child: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    })),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
  return {
    ...actual,
    getLogger: vi.fn(() => mockLoggerInstance),
    getLoggerInstance: vi.fn(() => mockLoggerInstance),
  };
});

// Mock fs/promises
vi.mock('fs/promises', async () => {
  const actual = (await vi.importActual('fs/promises')) as typeof fs;
  return {
    ...actual,
    readdir: vi.fn((path, options) => {
      if (path === getToolsDir()) {
        return Promise.resolve([
          {
            isDirectory: () => false,
            isFile: () => true,
            name: `testTool1${fileExtension}`,
          },
          {
            isDirectory: () => false,
            isFile: () => true,
            name: `testTool2${fileExtension}`,
          },
          {
            isDirectory: () => false,
            isFile: () => true,
            name: 'not-a-tool.txt',
          },
          { isDirectory: () => true, isFile: () => false, name: 'sub-dir' },
          {
            isDirectory: () => false,
            isFile: () => true,
            name: `errorTool${fileExtension}`,
          },
          {
            isDirectory: () => false,
            isFile: () => true,
            name: `invalidTool${fileExtension}`,
          },
        ]);
      }
      return actual.readdir(path, options);
    }),
    readFile: vi.fn(),
    stat: vi.fn(),
  };
});

describe('toolLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetTools(); // Reset the tool loader state before each test
  });

  afterEach(() => {
    vi.doUnmock('fs/promises');
  });

  it('should discover and load tool files correctly', async () => {
    const mockToolDir = getToolsDir();
    const mockToolFiles = [
      path.join(mockToolDir, `testTool1${fileExtension}`),
      path.join(mockToolDir, `testTool2${fileExtension}`),
    ];

    // Mock readdir to return dirent objects
    vi.spyOn(fs, 'readdir').mockResolvedValue([
      {
        isDirectory: () => false,
        isFile: () => true,
        name: `testTool1${fileExtension}`,
      },
      {
        isDirectory: () => false,
        isFile: () => true,
        name: `testTool2${fileExtension}`,
      },
      { isDirectory: () => false, isFile: () => true, name: 'not-a-tool.txt' },
      { isDirectory: () => true, isFile: () => false, name: 'sub-dir' },
    ] as any);

    // Mock the dynamic import of the tool files
    vi.doMock(mockToolFiles[0], () => ({
      testTool1: {
        description: 'A test tool',
        execute: vi.fn(),
        name: 'testTool1',
        parameters: {},
      },
    }));
    vi.doMock(mockToolFiles[1], () => ({
      testTool2: {
        description: 'Another test tool',
        execute: vi.fn(),
        name: 'testTool2',
        parameters: {},
      },
    }));

    await _internalLoadTools();

    expect(toolRegistry.register).toHaveBeenCalledTimes(2);
    expect(toolRegistry.register).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'testTool1' }),
    );
    expect(toolRegistry.register).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'testTool2' }),
    );
  });

  it('should handle errors during file loading gracefully', async () => {
    const mockToolDir = getToolsDir();
    const mockToolFile = path.join(mockToolDir, `errorTool${fileExtension}`);

    vi.spyOn(fs, 'readdir').mockResolvedValue([
      {
        isDirectory: () => false,
        isFile: () => true,
        name: `errorTool${fileExtension}`,
      },
    ] as any);

    // Mock the dynamic import to throw an error
    vi.doMock(mockToolFile, () => {
      throw new Error('Failed to load');
    });

    await _internalLoadTools();

    expect(toolRegistry.register).not.toHaveBeenCalled();
  });

  it('should not register invalid tools', async () => {
    const mockToolDir = getToolsDir();
    const mockToolFile = path.join(mockToolDir, `invalidTool${fileExtension}`);

    vi.spyOn(fs, 'readdir').mockResolvedValue([
      {
        isDirectory: () => false,
        isFile: () => true,
        name: `invalidTool${fileExtension}`,
      },
    ] as any);

    // Mock a tool with a missing description
    vi.doMock(mockToolFile, () => ({
      invalidTool: {
        execute: vi.fn(),
        name: 'invalidTool',
        parameters: {},
      },
    }));

    await _internalLoadTools();

    expect(toolRegistry.register).not.toHaveBeenCalled();
  });
});
