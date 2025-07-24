import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _resetTools, getTools } from '@/utils/toolLoader';

import { toolRegistry } from '../modules/tools/toolRegistry';

// Mock the logger to prevent console output during tests
vi.mock('../logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fs.promises for file system operations
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    readFile: vi.fn(),
  },
}));

// Mock path.resolve to control resolved paths
vi.mock('path', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof path;
  return {
    ...actual,
    resolve: vi.fn((...args) => actual.resolve(...args)),
  };
});

describe('toolLoader', () => {
  beforeEach(() => {
    _resetTools();
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test'; // Reset NODE_ENV for each test
    delete process.env.TOOLS_PATH; // Clear custom tools path

    // Explicitly reset mock implementations
    vi.mocked(fs.promises.readdir).mockReset();
    vi.mocked(fs.promises.readFile).mockReset();
    toolRegistry.clear(); // Clear the toolRegistry before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load tools from default development path', async () => {
    process.env.NODE_ENV = 'development';
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'testTool.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      "export const name = 'testTool'; export const execute = () => {};",
    );

    const tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('testTool');
    expect(path.resolve).toHaveBeenCalledWith(
      expect.any(String),
      'src',
      'modules',
      'tools',
      'definitions',
    );
    _resetTools();
  });

  it('should load tools from default production path', async () => {
    process.env.NODE_ENV = 'production';
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'prodTool.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      "export const name = 'prodTool'; export const execute = () => {};",
    );

    const tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('prodTool');
    expect(path.resolve).toHaveBeenCalledWith(
      expect.any(String),
      'dist',
      'modules',
      'tools',
      'definitions',
    );
    _resetTools();
  });

  it('should load tools from custom TOOLS_PATH', async () => {
    process.env.TOOLS_PATH = '/custom/tools';
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'customTool.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      "export const name = 'customTool'; export const execute = () => {};",
    );

    const tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('customTool');
    expect(path.resolve).toHaveBeenCalledWith('/custom/tools');
    _resetTools();
  });

  it('should throw an error if tools directory does not exist', async () => {
    vi.mocked(fs.promises.readdir).mockRejectedValueOnce(
      new Error('ENOENT: no such file or directory, scandir /custom/tools'),
    );
    process.env.TOOLS_PATH = '/custom/tools'; // Set a custom path to trigger the error
    await expect(getTools()).rejects.toThrow(
      'Impossible de lire le répertoire des outils /custom/tools. Détails: ENOENT: no such file or directory, scandir /custom/tools',
    );
    _resetTools();
  });

  it('should handle tool files with errors gracefully', async () => {
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'errorTool.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      "export const name = 'errorTool'; export const execute = () => { throw new Error('Tool error'); };",
    );

    const tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('errorTool');
    // Expect the execute function to throw when called
    expect(() => tools[0].execute({}, {} as any)).toThrow('Tool error');
    _resetTools();
  });

  // Test for _resetTools function
  it('should reset loaded tools', async () => {
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'tool1.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      "export const name = 'tool1'; export const execute = () => {};",
    );

    await getTools(); // Load tools

    _resetTools(); // Reset tools

    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'tool2.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      "export const name = 'tool2'; export const execute = () => {};",
    );

    const tools = await getTools(); // Load again after reset
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('tool2');
  });

  it('should validate loaded tools against Tool interface', async () => {
    // Test case for a valid tool
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'validTool.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      "export const name = 'validTool'; export const execute = () => {};",
    );
    let tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('validTool');
    expect(typeof tools[0].execute).toBe('function');

    _resetTools();

    // Test case for an invalid tool (missing execute)
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'invalidTool.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      "export const name = 'invalidTool';",
    );
    tools = await getTools();
    expect(tools).toHaveLength(0); // Invalid tool should not be loaded

    _resetTools();

    // Test case for an invalid tool (missing name)
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce([
      { isFile: () => true, name: 'invalidTool2.js' },
    ] as any);
    vi.mocked(fs.promises.readFile).mockResolvedValueOnce(
      'export const execute = () => {};',
    );
    tools = await getTools();
    expect(tools).toHaveLength(0); // Invalid tool should not be loaded
  });
});
