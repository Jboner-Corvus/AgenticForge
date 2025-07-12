import type { Queue } from 'bullmq'; // Import Queue type

import { promises as fs } from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type logger from '../logger.js'; // Import logger type
import type { Ctx as _Ctx } from '../types.js';

import { toolRegistry } from '../toolRegistry.js';
import { _resetTools, getTools } from './toolLoader.js';

// Mock pour logger
const mockLogger: Partial<typeof logger> = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  info: vi.fn(),
  level: 'info',
  silent: vi.fn(),
  trace: vi.fn(),
  warn: vi.fn(),
};

// Mock pour Queue
const mockQueue: Partial<Queue> = {
  add: vi.fn(),
};

// Mock complet et typé pour le contexte Ctx
const mockCtx: _Ctx = {
  log: mockLogger as typeof logger,
  reportProgress: vi.fn(),
  session: undefined,
  streamContent: vi.fn(),
  taskQueue: mockQueue as Queue,
};

// Mock du logger pour éviter les logs de test
vi.mock('../logger.js', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const testToolsDir = path.join(__dirname, 'test_tools');

const createToolContent = (name: string, result: string) => `
  export const ${name} = {
    name: '${name}',
    description: 'A test tool',
    execute: async (args, context) => '${result}', // Ajout des arguments pour correspondre à l'interface Tool
  };
`;

describe('Tool Loader', () => {
  beforeEach(async () => {
    // Définir le chemin des outils de test
    process.env.TOOLS_PATH = testToolsDir;

    // Nettoyer avant chaque test
    await fs.rm(testToolsDir, { force: true, recursive: true });
    await fs.mkdir(testToolsDir, { recursive: true });
    // Réinitialiser le registre des outils et le cache du loader
    toolRegistry.getAll().forEach((tool) => toolRegistry.unregister(tool.name));
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
    expect(await tools[0].execute({}, mockCtx)).toBe('result1');
  });

  it('should reload a tool when its file changes', async () => {
    const toolPath = path.join(testToolsDir, 'dynamicTool.tool.ts');
    await fs.writeFile(toolPath, createToolContent('dynamicTool', 'initial'));

    let tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(await tools[0].execute({}, mockCtx)).toBe('initial');

    // Modifier le fichier
    await fs.writeFile(toolPath, createToolContent('dynamicTool', 'updated'));

    // Forcer le rechargement en réinitialisant le cache
    _resetTools();
    tools = await getTools(); // Recharger les outils
    expect(tools).toHaveLength(1);
    expect(await tools[0].execute({}, mockCtx)).toBe('updated');
  });

  it('should unload a tool when its file is deleted', async () => {
    const toolPath = path.join(testToolsDir, 'deletableTool.tool.ts');
    await fs.writeFile(
      toolPath,
      createToolContent('deletableTool', 'toDelete'),
    );

    let tools = await getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('deletableTool');

    // Supprimer le fichier
    await fs.unlink(toolPath);

    // Vider le registre et réinitialiser le loader pour simuler un rechargement complet
    toolRegistry.getAll().forEach((tool) => toolRegistry.unregister(tool.name));
    _resetTools();

    tools = await getTools(); // Recharger les outils
    expect(tools).toHaveLength(0);
  });
});
