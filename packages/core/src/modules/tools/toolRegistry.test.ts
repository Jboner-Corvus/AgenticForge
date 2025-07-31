import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { AnyZodObject, z, ZodString } from 'zod';

import { Ctx, Tool } from '../../types.js';
import { toolRegistry } from './toolRegistry.js';

// Mock a simple tool for testing
const mockToolSchema = z.object({
  input: z.string(),
});

const mockTool: Tool<AnyZodObject, ZodString> = {
  description: 'A mock tool for testing.',

  execute: vi.fn(async (args: any, _ctx: Ctx) => {
    const parsedArgs = args as z.infer<typeof mockToolSchema>;
    return `Processed: ${parsedArgs.input}`;
  }),
  name: 'mockTool',
  parameters: mockToolSchema,
};

const mockTool2: Tool<AnyZodObject, ZodString> = {
  description: 'Another mock tool for testing.',

  execute: vi.fn(async (args: any, _ctx: Ctx) => {
    const parsedArgs = args as z.infer<typeof mockToolSchema>;
    return `Processed by tool 2: ${parsedArgs.input}`;
  }),
  name: 'mockTool2',
  parameters: mockToolSchema,
};

describe('ToolRegistry', () => {
  beforeEach(() => {
    // Clear the registry before each test to ensure isolation
    toolRegistry.clear();
    vi.clearAllMocks();
  });

  const mockLogger = {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  const mockCtx: Ctx = {
    llm: {} as Ctx['llm'], // Mock LLM provider
    log: mockLogger as unknown as Ctx['log'],
    reportProgress: vi.fn(),
    session: {} as Ctx['session'], // Mock session data
    streamContent: vi.fn(),
    taskQueue: {} as Ctx['taskQueue'], // Mock task queue
  };

  // Test for register method
  it('should register a tool successfully', () => {
    toolRegistry.register(mockTool);
    expect(toolRegistry.get('mockTool')).toBe(mockTool);
  });

  it('should throw an error if a tool with the same name is registered twice', () => {
    toolRegistry.register(mockTool);
    expect(() => toolRegistry.register(mockTool)).toThrow(
      'Tool with name mockTool already registered.',
    );
  });

  // Test for get method
  it('should retrieve a registered tool', () => {
    toolRegistry.register(mockTool);
    const retrievedTool = toolRegistry.get('mockTool');
    expect(retrievedTool).toBe(mockTool);
  });

  it('should return undefined if a tool is not found', () => {
    const retrievedTool = toolRegistry.get('nonExistentTool');
    expect(retrievedTool).toBeUndefined();
  });

  // Test for getAll method
  it('should return all registered tools', () => {
    toolRegistry.register(mockTool);
    toolRegistry.register(mockTool2);
    const allTools = toolRegistry.getAll();
    expect(allTools).toEqual([mockTool, mockTool2]);
  });

  it('should return an empty array if no tools are registered', () => {
    const allTools = toolRegistry.getAll();
    expect(allTools).toEqual([]);
  });

  // Test for execute method
  it('should execute a registered tool successfully', async () => {
    toolRegistry.register(mockTool);
    const result = await toolRegistry.execute(
      'mockTool',
      { input: 'test' },
      mockCtx,
    );
    expect(mockTool.execute).toHaveBeenCalledWith({ input: 'test' }, mockCtx);
    expect(result).toBe('Processed: test');
  });

  it('should throw an error if the tool to execute is not found', async () => {
    await expect(
      toolRegistry.execute('nonExistentTool', { input: 'test' }, mockCtx),
    ).rejects.toThrowError('Tool not found: nonExistentTool');
  });

  it('should throw an error if tool execution fails', async () => {
    toolRegistry.register(mockTool);
    (mockTool.execute as Mock).mockRejectedValueOnce(
      new Error('Tool execution failed'),
    );

    await expect(
      toolRegistry.execute('mockTool', { input: 'test' }, mockCtx),
    ).rejects.toThrow('Tool execution failed');
  });

  it('should handle invalid parameters for tool execution', async () => {
    toolRegistry.register(mockTool);
    // Pass invalid parameters (e.g., missing 'input' which is required by mockToolSchema)
    await expect(
      toolRegistry.execute('mockTool', { wrongParam: 'value' }, mockCtx),
    ).rejects.toThrow('Invalid tool parameters');
  });

  // Test for unregister method
  it('should unregister a tool successfully', () => {
    toolRegistry.register(mockTool);
    expect(toolRegistry.get('mockTool')).toBeDefined();
    toolRegistry.unregister('mockTool');
    expect(toolRegistry.get('mockTool')).toBeUndefined();
  });

  it('should not throw an error when unregistering a non-existent tool', () => {
    expect(() => toolRegistry.unregister('nonExistentTool')).not.toThrow();
  });
});
