import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { Job } from 'bullmq';
import { z } from 'zod';
import { Agent } from './agent.js';
import { SessionManager } from '../session/sessionManager.js';
import { LlmError } from '../../utils/LlmError.js';
import { FinishToolSignal } from '../tools/definitions/index.js';
import type { SessionData, Tool, Message } from '../../types.js';

// Mock all dependencies
vi.mock('../../config.js', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic', 'qwen'],
  },
}));

vi.mock('../../logger.js', () => ({
  getLoggerInstance: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('../../utils/llmProvider.js', () => ({
  getLlmProvider: vi.fn(),
}));

vi.mock('../redis/redisClient.js', () => ({
  getRedisClientInstance: () => ({
    publish: vi.fn(),
    duplicate: () => ({
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      quit: vi.fn(),
    }),
  }),
}));

vi.mock('../llm/LlmKeyManager.js', () => ({
  LlmKeyManager: {
    hasAvailableKeys: vi.fn(),
  },
}));

vi.mock('../tools/toolRegistry.js', () => ({
  toolRegistry: {
    execute: vi.fn(),
  },
}));

vi.mock('./orchestrator.prompt.js', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock master prompt'),
}));

vi.mock('./responseSchema.js', () => ({
  llmResponseSchema: {
    parse: vi.fn(),
  },
}));

describe('Agent Comprehensive Tests', () => {
  let mockJob: Partial<Job>;
  let mockSessionData: SessionData;
  let mockSessionManager: Partial<SessionManager>;
  let mockTools: Tool[];
  let agent: Agent;

  let mockLlmProvider: { getLlmResponse: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    mockLlmProvider = {
      getLlmResponse: vi.fn(),
    };
    
    const { getLlmProvider } = require('../../utils/llmProvider.ts');
    (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);

    mockJob = {
      id: 'test-job-123',
      data: { prompt: 'Test user prompt' },
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      history: [],
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'Test Session',
      timestamp: Date.now(),
      activeLlmProvider: 'openai',
    };

    mockSessionManager = {
      saveSession: vi.fn(),
    };

    const testToolSchema = z.object({
      input: z.string(),
    });

    mockTools = [
      {
        name: 'testTool',
        description: 'A test tool',
        parameters: testToolSchema,
        execute: vi.fn(),
      },
    ];

    agent = new Agent(
      mockJob as Job,
      mockSessionData,
      {} as any, // taskQueue
      mockTools,
      'openai',
      mockSessionManager as SessionManager,
      'test-api-key',
      'gpt-4',
      'test-llm-key'
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Agent Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(agent).toBeInstanceOf(Agent);
      expect(mockSessionData.activeLlmProvider).toBe('openai');
    });

    it('should handle tools initialization', () => {
      const agentWithoutTools = new Agent(
        mockJob as Job,
        mockSessionData,
        {} as any,
        [],
        'openai',
        mockSessionManager as SessionManager
      );
      expect(agentWithoutTools).toBeInstanceOf(Agent);
    });

    it('should set up loop detection properties', () => {
      // Test that agent is initialized with proper loop detection
      expect(agent).toHaveProperty('behaviorHistory');
      expect(agent).toHaveProperty('loopDetectionThreshold');
    });
  });

  describe('Agent Main Loop', () => {
    it('should run successfully with valid LLM response', async () => {
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue('{"answer": "Test response"}');
      (mockResponseSchema.parse as Mock).mockReturnValue({
        answer: 'Test response',
      });

      const result = await agent.run();

      expect(result).toBe('Test response');
      expect(mockSessionData.history).toHaveLength(2); // User message + agent response
      expect(mockSessionData.history[0].type).toBe('user');
      expect(mockSessionData.history[1].type).toBe('agent_response');
    });

    it('should handle thought-only responses', async () => {
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "Thinking..."}')
        .mockResolvedValueOnce('{"answer": "Final answer"}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'Thinking...' })
        .mockReturnValueOnce({ answer: 'Final answer' });

      const result = await agent.run();

      expect(result).toBe('Final answer');
      expect(mockSessionData.history.some(msg => msg.type === 'agent_thought')).toBe(true);
    });

    it('should handle tool execution', async () => {
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;
      const mockToolRegistry = (await import('../tools/toolRegistry')).toolRegistry;

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"command": {"name": "testTool", "params": {"input": "test"}}}')
        .mockResolvedValueOnce('{"answer": "Tool executed successfully"}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({
          command: { name: 'testTool', params: { input: 'test' } },
        })
        .mockReturnValueOnce({ answer: 'Tool executed successfully' });

      (mockToolRegistry.execute as Mock).mockResolvedValue('Tool result');

      const result = await agent.run();

      expect(result).toBe('Tool executed successfully');
      expect(mockToolRegistry.execute).toHaveBeenCalledWith(
        'testTool',
        { input: 'test' },
        expect.any(Object)
      );
    });

    it('should handle canvas output', async () => {
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"canvas": [{"type": "text", "content": "Test output"}]}')
        .mockResolvedValueOnce('{"answer": "Canvas displayed"}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ canvas: [{ type: 'text', content: 'Test output' }] })
        .mockReturnValueOnce({ answer: 'Canvas displayed' });
    });

    it('should handle finish tool signal', async () => {
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;
      const mockToolRegistry = (await import('../tools/toolRegistry')).toolRegistry;

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"command": {"name": "finish", "params": {"result": "Task completed"}}}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ command: { name: 'finish', params: { result: 'Task completed' } } });

      (mockToolRegistry.execute as Mock).mockResolvedValue({ success: true, result: 'Task completed' });

      const result = await agent.run();

      expect(result).toBe('Task completed');
    });

    it('should handle finish tool with invalid response', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;
      
      const toolRegistryModule = await import('../tools/toolRegistry.js');
      toolRegistryModule.toolRegistry.execute = vi.fn();
      const mockToolRegistry = toolRegistryModule.toolRegistry;

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"command": {"name": "finish", "params": {"invalid": "response"}}}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ command: { name: 'finish', params: { invalid: 'response' } } });

      (mockToolRegistry.execute as Mock).mockResolvedValue({ success: false, error: 'Invalid finish tool response' });
    });

  describe('Error Handling', () => {
    it('should handle LLM errors and retry with different providers', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;

      // First provider fails, second succeeds
      (mockLlmProvider.getLlmResponse as Mock)
        .mockRejectedValueOnce(new LlmError('Provider 1 failed'))
        .mockResolvedValueOnce('{"answer": "Success with provider 2"}');

      (mockResponseSchema.parse as Mock).mockReturnValue({
        answer: 'Success with provider 2',
      });

      const result = await agent.run();

      expect(result).toBe('Success with provider 2');
      expect(mockLlmProvider.getLlmResponse).toHaveBeenCalledTimes(2);
    });

    it('should handle Qwen timeout errors with retries', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;

      // Mock Qwen timeout error
      const qwenTimeoutError = new LlmError('Qwen API request failed with status 504 stream timeout');

      (mockLlmProvider.getLlmResponse as Mock)
        .mockRejectedValueOnce(qwenTimeoutError)
        .mockRejectedValueOnce(qwenTimeoutError)
        .mockResolvedValueOnce('{"answer": "Success after retries"}');

      (mockResponseSchema.parse as Mock).mockReturnValue({
        answer: 'Success after retries',
      });

      const result = await agent.run();

      expect(result).toBe('Success after retries');
      expect(mockLlmProvider.getLlmResponse).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed LLM responses', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce('{"answer": "Valid response"}');

      (mockResponseSchema.parse as Mock)
        .mockImplementationOnce(() => {
          throw new Error('Failed to parse');
        })
        .mockReturnValueOnce({ answer: 'Valid response' });

      const result = await agent.run();

      expect(result).toBe('Valid response');
    });

    it('should handle tool execution errors', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;
      
      const toolRegistryModule = await import('../tools/toolRegistry.js');
      toolRegistryModule.toolRegistry.execute = vi.fn();
      const mockToolRegistry = toolRegistryModule.toolRegistry;

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"command": {"name": "testTool", "params": {"input": "test"}}}')
        .mockResolvedValueOnce('{"answer": "Tool execution completed"}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ command: { name: 'testTool', params: { input: 'test' } } })
        .mockReturnValueOnce({ answer: 'Tool execution completed' });

      (mockToolRegistry.execute as Mock).mockRejectedValueOnce(new Error('Tool execution failed'));

      const result = await agent.run();

      expect(result).toBe('Handled error');
      expect(mockSessionData.history.some(msg => 
        msg.type === 'tool_result' && 
        typeof msg.result === 'string' && 
        (msg.result as string).includes('Error executing tool')
      )).toBe(true);
    });

    it('should handle FinishToolSignal exception', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;
      
      const toolRegistryModule = await import('../tools/toolRegistry.js');
      toolRegistryModule.toolRegistry.execute = vi.fn();
      const mockToolRegistry = toolRegistryModule.toolRegistry;

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"command": {"name": "testTool", "params": {"input": "test"}}}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ command: { name: 'testTool', params: { input: 'test' } } });

      (mockToolRegistry.execute as Mock).mockRejectedValueOnce(new FinishToolSignal('Finish signal'));
    });

    it('should reach maximum iterations', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;

      // Mock responses that keep the agent in a loop
      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue('{"thought": "Still thinking..."}');
      (mockResponseSchema.parse as Mock).mockReturnValue({ thought: 'Still thinking...' });
    });

  describe('Loop Detection', () => {
    it('should detect command loops', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;
      
      const toolRegistryModule = await import('../tools/toolRegistry.js');
      toolRegistryModule.toolRegistry.execute = vi.fn();
      const mockToolRegistry = toolRegistryModule.toolRegistry;

      // Return the same command multiple times
      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue(
        '{"command": {"name": "testTool", "params": {"same": "params"}}}'
      );

      (mockResponseSchema.parse as Mock).mockReturnValue({
        command: { name: 'testTool', params: { same: 'params' } },
      });

      (mockToolRegistry.execute as Mock).mockResolvedValue('Same result');

      const result = await agent.run();

      expect(result).toContain('loop');
    });

    it('should detect thought loops', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;

      // Return similar thoughts multiple times
      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue('{"thought": "I am thinking about the same thing"}');
      (mockResponseSchema.parse as Mock).mockReturnValue({ thought: 'I am thinking about the same thing' });

      const result = await agent.run();

      expect(result).toContain('loop');
    });
  });

  describe('Interruption Handling', () => {
    it('should handle job interruption', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);

      // Simulate interruption by making job fail
      (mockJob.isFailed as Mock) = vi.fn().mockResolvedValue(true);

      const result = await agent.run();

      expect(result).toContain('interrupted');
    });

    it('should set up interrupt listener properly', async () => {
      const redisClientModule = await import('../redis/redisClient.js');
      const mockRedisClient = redisClientModule.getRedisClientInstance();
      const mockDuplicate = mockRedisClient.duplicate();

      await agent.run();

      expect(mockDuplicate.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockDuplicate.subscribe).toHaveBeenCalled();
    });
  });

  describe('Response Parsing', () => {
    it('should extract JSON from markdown code blocks', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;

      const markdownResponse = '```json\n{"answer": "Extracted from markdown"}\n```';
      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue(markdownResponse);
      (mockResponseSchema.parse as Mock).mockReturnValue({ answer: 'Extracted from markdown' });

      const result = await agent.run();

      expect(result).toBe('Extracted from markdown');
    });

    it('should convert plain text to valid JSON', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      
      const responseSchemaModule = await import('./responseSchema.js');
      responseSchemaModule.llmResponseSchema.parse = vi.fn();
      const mockResponseSchema = responseSchemaModule.llmResponseSchema;

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue('Just plain text response');

      // First parse fails, second succeeds with converted response
      (mockResponseSchema.parse as Mock)
        .mockImplementationOnce(() => {
          throw new Error('Not valid JSON');
        })
        .mockReturnValueOnce({
          thought: "L'utilisateur a répondu avec du texte brut. Je vais convertir cela en format JSON valide.",
          command: { name: 'finish', params: { response: 'Just plain text response' } },
        });

      const result = await agent.run();

      expect(mockResponseSchema.parse).toHaveBeenCalledTimes(2);
    });
  });

  describe('Message History Management', () => {
    it('should properly format message history for LLM', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;

      // Add some history to the session
      mockSessionData.history = [
        { type: 'user', content: 'Hello', timestamp: Date.now() - 1000 },
        { type: 'agent_response', content: 'Hi there', timestamp: Date.now() - 500 },
      ] as Message[];

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue('{"answer": "History processed"}');
      (mockResponseSchema.parse as Mock).mockReturnValue({ answer: 'History processed' });

      const result = await agent.run();

      expect(result).toBe('History processed');
      expect(mockLlmProvider.getLlmResponse).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user' }),
          expect.objectContaining({ role: 'model' }),
          expect.objectContaining({ role: 'tool' }),
        ]),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle long content truncation', async () => {
      const { getLlmProvider } = await import('../../utils/llmProvider.js');
      const mockLlmProvider = {
        getLlmResponse: vi.fn(),
      };
      (getLlmProvider as Mock).mockReturnValue(mockLlmProvider);
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;
      const mockGetMasterPrompt = (await import('./orchestrator.prompt')).getMasterPrompt;

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue('{"answer": "Handled long content"}');
      (mockResponseSchema.parse as Mock).mockReturnValue({ answer: 'Handled long content' });

      await agent.run();

      // Check that getMasterPrompt was called - content truncation happens there
      expect(mockGetMasterPrompt).toHaveBeenCalled();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty tool list', async () => {
      const agentWithoutTools = new Agent(
        mockJob as Job,
        mockSessionData,
        {} as any,
        [],
        'openai',
        mockSessionManager as SessionManager
      );

      const mockLlmProvider = (await import('../../utils/llmProvider.js')).getLlmProvider('openai');
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue('{"answer": "No tools needed"}');
      (mockResponseSchema.parse as Mock).mockReturnValue({ answer: 'No tools needed' });

      const result = await agentWithoutTools.run();

      expect(result).toBe('No tools needed');
    });

    it('should handle null/undefined responses gracefully', async () => {
      const mockLlmProvider = (await import('../../utils/llmProvider.js')).getLlmProvider('openai');

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue(null);

      const result = await agent.run();

      expect(result).toContain('malformed');
    });

    it('should handle very rapid iterations', async () => {
      const mockLlmProvider = (await import('../../utils/llmProvider.js')).getLlmProvider('openai');
      const mockResponseSchema = (await import('./responseSchema')).llmResponseSchema;

      // Mock rapid responses that don't lead to completion
      let callCount = 0;
      (mockLlmProvider.getLlmResponse as Mock).mockImplementation(() => {
        callCount++;
        if (callCount >= 5) {
          return Promise.resolve('{"answer": "Finally done"}');
        }
        return Promise.resolve(`{"thought": "Iteration ${callCount}"}`);
      });

      (mockResponseSchema.parse as Mock).mockImplementation((data: any) => {
        if (data.answer) return { answer: data.answer };
        return { thought: data.thought };
      });

      const result = await agent.run();

      expect(result).toBe('Finally done');
      expect(callCount).toBe(5);
    });

  });
});
});
});
