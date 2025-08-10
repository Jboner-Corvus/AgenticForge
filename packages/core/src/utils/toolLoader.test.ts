import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// --- Test Setup ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempToolsDir = path.resolve(__dirname, 'temp_tools_for_testing');

// Mock logger to prevent console noise
vi.mock('../logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

// Helper function to create a temporary tool file
async function createToolFile(name: string, content: string) {
  await fs.writeFile(path.join(tempToolsDir, name), content, 'utf-8');
}

// --- Test Suite ---

describe('toolLoader Integration Test', () => {
  let toolLoader: typeof import('./toolLoader');

  // Create a temporary directory for tools before all tests
  beforeAll(async () => {
    await fs.mkdir(tempToolsDir, { recursive: true });
  });

  // Clean up the temporary directory after all tests
  afterAll(async () => {
    await fs.rm(tempToolsDir, { force: true, recursive: true });
  });

  // Reset everything before each test to ensure a clean slate
  beforeEach(async () => {
    // 1. Reset modules to get a fresh instance of the toolLoader and its state
    vi.resetModules();

    // 2. Set up environment variables
    delete process.env.TOOLS_PATH;
    process.env.TOOLS_PATH = tempToolsDir;

    // 3. Re-import the module to be tested AFTER resetting modules
    toolLoader = await import('./toolLoader');
    // Manually reset its internal state just in case
    await toolLoader._resetTools();

    // 4. Manually unregister all tools from the actual registry
    const { toolRegistry: actualRegistry } = await import(
      '../modules/tools/toolRegistry.js'
    );
    actualRegistry
      .getAll()
      .forEach((tool) => actualRegistry.unregister(tool.name));

    // 5. Clean directory content
    const files = await fs.readdir(tempToolsDir).catch(() => []);
    for (const file of files) {
      await fs.unlink(path.join(tempToolsDir, file));
    }
  });

  describe('getTools', () => {
    it('should return an empty array when no tools are found', async () => {
      // Act
      const tools = await toolLoader.getTools();
      // Assert
      expect(tools).toHaveLength(0);
    });

    it('should correctly load a valid tool file', async () => {
      // Arrange
      const validToolContent = `
        import { z } from 'zod';
        export const myTestTool = {
          name: 'myTool',
          description: 'A test tool',
          parameters: z.object({ param1: z.string() }),
          execute: () => 'result',
        };
      `;
      await createToolFile('valid.tool.ts', validToolContent);

      // Act
      const tools = await toolLoader.getTools();

      // Assert
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('myTool');
    });

    it('should load multiple tool files', async () => {
      // Arrange
      await createToolFile(
        'tool1.tool.ts',
        `export const tool1 = { name: 'tool1', description: 'd1', parameters: {}, execute: () => {} };`,
      );
      await createToolFile(
        'tool2.tool.ts',
        `export const tool2 = { name: 'tool2', description: 'd2', parameters: {}, execute: () => {} };`,
      );

      // Act
      const tools = await toolLoader.getTools();

      // Assert
      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.name).sort()).toEqual(['tool1', 'tool2']);
    });

    it('should not load files that do not match the .tool.ts extension', async () => {
      // Arrange
      await createToolFile(
        'valid.tool.ts',
        `export const myTool = { name: 'myTool', description: 'd', parameters: {}, execute: () => {} };`,
      );
      await createToolFile('not_a_tool.ts', 'export const a = 1;');

      // Act
      const tools = await toolLoader.getTools();

      // Assert
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('myTool');
    });

    it('should not crash and load zero tools for files with invalid schemas', async () => {
      // Arrange
      const invalidToolContent = `
        export const invalidTool = {
          // Missing 'name' property
          description: 'This tool is invalid',
          parameters: {},
          execute: () => {},
        };
      `;
      await createToolFile('invalid.tool.ts', invalidToolContent);

      // Act
      const tools = await toolLoader.getTools();

      // Assert
      expect(tools).toHaveLength(0);
    });
  });
});
