import { promises as fs } from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toolRegistry } from '../toolRegistry.js';
import { getTools, _resetTools } from './toolLoader.js';

// Mock du logger pour éviter les logs de test
vi.mock('../logger.js', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const testToolsDir = path.join(__dirname, 'test_tools');

const createToolContent = (name: string, result: string) => `
  export const ${name} = {
    name: '${name}',
    description: 'A test tool',
    execute: async () => '${result}',
  };
`;

describe('Tool Loader', () => {
  beforeEach(async () => {
    // Nettoyer avant chaque test
    await fs.rm(testToolsDir, { force: true, recursive: true });
    await fs.mkdir(testToolsDir, { recursive: true });
    // Réinitialiser le registre des outils et le cache du loader
    toolRegistry.getAll().forEach(tool => toolRegistry.unregister(tool.name));
    _resetTools();
  });

  afterEach(async () => {
    await fs.rm(testToolsDir, { force: true, recursive: true });
  });

  it('should load all tools from the specified directory', async () => {
    const tool1Path = path.join(testToolsDir, 'tool1.tool.ts');
    await fs.writeFile(tool1Path, createToolContent('tool1', 'result1'));

    const tools = await getTools();

    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('tool1');
    expect(await tools[0].execute({}, {})).toBe('result1');
  });

  it('should reload a tool when its file changes', async () => {
    const toolPath = path.join(testToolsDir, 'dynamicTool.tool.ts');
    await fs.writeFile(toolPath, createToolContent('dynamicTool', 'initial'));

    let tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(await tools[0].execute({}, {})).toBe('initial');

    // Modifier le fichier
    await fs.writeFile(toolPath, createToolContent('dynamicTool', 'updated'));

    // Attendre que le watcher détecte le changement
    await new Promise((resolve) => setTimeout(resolve, 100)); // Petite pause

    tools = await getTools(); // Recharger les outils
    expect(tools).toHaveLength(1);
    expect(await tools[0].execute({}, {})).toBe('updated');
  });

  it('should unload a tool when its file is deleted', async () => {
    const toolPath = path.join(testToolsDir, 'deletableTool.tool.ts');
    await fs.writeFile(toolPath, createToolContent('deletableTool', 'toDelete'));

    let tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('deletableTool');

    // Supprimer le fichier
    await fs.unlink(toolPath);

    // Attendre que le watcher détecte la suppression
    await new Promise((resolve) => setTimeout(resolve, 100)); // Petite pause

    tools = await getTools(); // Recharger les outils
    expect(tools).toHaveLength(0);
  });
});

