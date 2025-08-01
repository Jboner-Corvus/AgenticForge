/// <reference types="vitest/globals" />

/// <reference types="vitest/globals" />

import * as chokidar from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path'; // Import path explicitly
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mock internal dependencies
vi.mock('../logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

vi.mock('../modules/tools/toolRegistry.js', () => ({
  toolRegistry: {
    getAll: vi.fn(() => []), // Default to empty array
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

vi.mock('chokidar', () => ({
  watch: vi.fn(() => ({
    close: vi.fn(),
    on: vi.fn(() => ({})),
  })),
}));

vi.mock('fs/promises', () => ({
  readdir: vi.fn(() => []), // Default to an empty array
  // Mock Dirent-like objects for readdir
  Dirent: class {
    name: string;
    private type: number;

    constructor(name: string, type: number) {
      this.name = name;
      this.type = type;
    }

    isDirectory(): boolean {
      return this.type === 1; // Example type for directory
    }

    isFile(): boolean {
      return this.type === 2; // Example type for file
    }
  },
}));

vi.mock('path', () => ({
  dirname: vi.fn(() => '/mock/path/to/dist'),
  join: vi.fn((...args: string[]) => args.join('/')),
  // Mock posix as well, as it's used in the original path module
  posix: {
    join: vi.fn((...args: string[]) => args.join('/')),
    resolve: vi.fn((...args: string[]) => args.join('/')),
  },
  resolve: vi.fn((...args: string[]) => args.join('/')),
}));

vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/mock/path/to/dist/toolLoader.js'),
}));

import { toolRegistry } from '../modules/tools/toolRegistry';
// Import the functions to be tested
import {
  _internalLoadTools,
  _resetTools,
  getTools,
  getToolsDir,
} from './toolLoader';

describe('toolLoader', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks for fs and path to their original behavior for each test
    vi.mocked(fs.readdir).mockClear();
    vi.mocked(path.join).mockClear();
    vi.mocked(path.resolve).mockClear();
    vi.mocked(path.dirname).mockClear();
    (toolRegistry.getAll as Mock).mockClear(); // Clear mock for toolRegistry.getAll
    (toolRegistry.getAll as Mock).mockReturnValue([]); // Reset to default

    delete process.env.TOOLS_PATH; // Ensure TOOLS_PATH is not set for most tests
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    _resetTools(); // Ensure tools are reset after each test
  });

  describe('getToolsDir', () => {
    it('should return the correct path for production environment', () => {
      process.env.NODE_ENV = 'production';
      // Mock path.join to return a predictable value
      vi.mocked(path.join).mockReturnValueOnce(
        '/mock/path/to/dist/../modules/tools/definitions',
      );
      const expectedPath = '/mock/path/to/dist/../modules/tools/definitions';
      expect(getToolsDir()).toBe(expectedPath);
      expect(path.join).toHaveBeenCalledWith(
        '/mock/path/to/dist', // This will be the mocked __dirname
        '..',
        'modules',
        'tools',
        'definitions',
      );
    });

    it('should return the correct path for development environment', () => {
      process.env.NODE_ENV = 'development';
      // Mock path.resolve to return a predictable value
      vi.mocked(path.resolve).mockReturnValueOnce(
        '/mock/path/to/dist/../modules/tools/definitions',
      );
      const expectedPath = '/mock/path/to/dist/../modules/tools/definitions';
      expect(getToolsDir()).toBe(expectedPath);
      expect(path.resolve).toHaveBeenCalledWith(
        '/mock/path/to/dist', // This will be the mocked __dirname
        '..',
        'modules',
        'tools',
        'definitions',
      );
    });

    it('should use TOOLS_PATH environment variable if set', () => {
      process.env.TOOLS_PATH = '/custom/tools';
      expect(getToolsDir()).toBe('/custom/tools');
    });
  });

  describe('_resetTools', () => {
    it('should close the watcher if it exists', () => {
      const mockWatcher = { close: vi.fn(), on: vi.fn() };
      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher as any);
      getTools(); // Initialize watcher
      _resetTools();
      expect(mockWatcher.close).toHaveBeenCalled();
    });
  });

  describe('_internalLoadTools', () => {
    it('should load tools from files and register them', async () => {
      process.env.NODE_ENV = 'development';
      const _mockToolsDir = '/mock/path/to/dist/../modules/tools/definitions';

      // Ensure path mocks are set up for getToolsDir to return _mockToolsDir
      vi.mocked(path.join).mockImplementation((...args: string[]) =>
        args.join('/'),
      );
      vi.mocked(path.resolve).mockImplementation((...args: string[]) =>
        args.join('/'),
      );
      vi.mocked(path.dirname).mockReturnValue('/mock/path/to/dist');

      vi.mocked(fs.readdir).mockResolvedValueOnce([
        new fs.Dirent('myTool.tool.ts', 2), // 2 for file
      ] as any);

      // Mock the dynamic import of the tool file using vi.doMock
      // The path here must match what toolLoader will try to import
      vi.doMock(`${_mockToolsDir}/myTool.tool.ts`, () => ({
        myTool: {
          description: 'A test tool',
          execute: vi.fn(),
          name: 'myTool',
        },
      }));

      await _internalLoadTools();

      expect(fs.readdir).toHaveBeenCalledWith(_mockToolsDir, {
        withFileTypes: true,
      });
      expect(toolRegistry.register).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'myTool' }),
      );
      expect(toolRegistry.getAll as Mock).toHaveBeenCalled();
    });

    it('should handle errors during tool file discovery', async () => {
      vi.mocked(fs.readdir).mockRejectedValueOnce(
        new Error('Permission denied'),
      );
      await expect(_internalLoadTools()).rejects.toThrow(
        'Impossible de lire le répertoire des outils',
      );
    });
  });

  describe('getTools', () => {
    it('should load tools if not already loaded', async () => {
      (toolRegistry.getAll as Mock).mockReturnValueOnce([]); // Simulate no tools loaded initially

      const _mockToolsDir = '/mock/path/to/dist/../modules/tools/definitions';
      // Ensure path mocks are set up for getToolsDir to return _mockToolsDir
      vi.mocked(path.join).mockImplementation((...args: string[]) =>
        args.join('/'),
      );
      vi.mocked(path.resolve).mockImplementation((...args: string[]) =>
        args.join('/'),
      );
      vi.mocked(path.dirname).mockReturnValue('/mock/path/to/dist');

      vi.mocked(fs.readdir).mockResolvedValueOnce([
        new fs.Dirent('testTool.tool.ts', 2), // 2 for file
      ] as any);

      // Mock the dynamic import of the tool file using vi.doMock
      vi.doMock(`${_mockToolsDir}/testTool.tool.ts`, () => ({
        testTool: { description: 'Test', execute: vi.fn(), name: 'testTool' },
      }));

      await getTools();
      expect(toolRegistry.getAll).toHaveBeenCalledTimes(2); // Once for initial check, once after loading
    });

    it('should not load tools if already loaded', async () => {
      (toolRegistry.getAll as Mock).mockReturnValueOnce([
        { name: 'existingTool' },
      ] as any);
      await getTools();
      expect(toolRegistry.getAll).toHaveBeenCalledTimes(1);
      expect(fs.readdir).not.toHaveBeenCalled(); // Should not try to read directory if tools are already loaded
    });
  });
});
