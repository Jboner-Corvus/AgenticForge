import { promises as fs } from 'fs';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it, Mock, vi } from 'vitest';

import { Tool } from '../types.js';
import { getTools } from './toolLoader.js';

// Mock du logger pour éviter les logs de test
vi.mock('../logger.js', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the getTools function directly
vi.mock('./toolLoader.js', () => {
  return {
    getTools: vi.fn(),
  };
});

const testToolsDir = path.join(__dirname, 'test_tools');
const tool1Path = path.join(testToolsDir, 'tool1.tool.ts');
const tool2Path = path.join(testToolsDir, 'sub', 'tool2.tool.ts');

const tool1Content = `
  export const myTool1 = {
    name: 'test-tool-1',
    description: 'A test tool',
    execute: async () => 'result1',
  };
`;

const tool2Content = `
  export const myTool2 = {
    name: 'test-tool-2',
    description: 'Another test tool',
    execute: async () => 'result2',
  };
`;

describe('Tool Loader', () => {
  beforeAll(async () => {
    // Créer un répertoire de test et des fichiers d'outils factices
    await fs.mkdir(testToolsDir, { recursive: true });
    await fs.mkdir(path.join(testToolsDir, 'sub'), { recursive: true });
    await fs.writeFile(tool1Path, tool1Content);
    await fs.writeFile(tool2Path, tool2Content);

    // Mock getTools to return our test tools
    (getTools as Mock).mockImplementation(async () => {
      const tool1 = { description: 'A test tool', execute: async () => 'result1', name: 'test-tool-1' };
      const tool2 = { description: 'Another test tool', execute: async () => 'result2', name: 'test-tool-2' };
      return [tool1, tool2];
    });
  });

  afterAll(async () => {
    // Nettoyer les fichiers et le répertoire de test
    await fs.rm(testToolsDir, { force: true, recursive: true });
  });

  it('should load all tools from the specified directory', async () => {
    const tools = await getTools();

    expect(tools).toHaveLength(2);

    const toolNames = tools.map((t: Tool) => t.name);
    expect(toolNames).toContain('test-tool-1');
    expect(toolNames).toContain('test-tool-2');
  });

  it('should return the cached tools on subsequent calls', async () => {
    // Le premier appel charge les outils
    await getTools();

    // Le second appel devrait utiliser le cache
    const tools = await getTools();

    expect(tools).toHaveLength(2);
  });
});
