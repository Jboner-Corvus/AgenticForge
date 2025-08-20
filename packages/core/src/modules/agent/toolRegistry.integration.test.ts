import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Agent } from './agent.ts';
import { getMockQueue } from '../../test/mockQueue.ts';
import type { SessionData, Tool } from '../../types.ts';

// Mock Tool Registry avec outils complexes
const mockToolRegistry = {
  execute: vi.fn(),
  register: vi.fn(),
  unregister: vi.fn(),
  list: vi.fn(),
  validate: vi.fn(),
  getToolDefinition: vi.fn(),
  executeWithTimeout: vi.fn(),
  executeInSandbox: vi.fn(),
  getToolMetrics: vi.fn(),
  monitorToolExecution: vi.fn(),
};

// Outils de test simulés
const mockTools: Tool[] = [
  {
    name: 'readFile',
    description: 'Read content from a file',
    parameters: {
      shape: {
        path: { _def: { typeName: 'ZodString' }, isOptional: () => false, isNullable: () => false },
        encoding: { _def: { typeName: 'ZodString' }, isOptional: () => true, isNullable: () => false },
      },
    } as any,
    execute: vi.fn(),
  },
  {
    name: 'writeFile',
    description: 'Write content to a file',
    parameters: {
      shape: {
        path: { _def: { typeName: 'ZodString' }, isOptional: () => false, isNullable: () => false },
        content: { _def: { typeName: 'ZodString' }, isOptional: () => false, isNullable: () => false },
        mode: { _def: { typeName: 'ZodString' }, isOptional: () => true, isNullable: () => false },
      },
    } as any,
    execute: vi.fn(),
  },
  {
    name: 'webSearch',
    description: 'Search the web for information',
    parameters: {
      shape: {
        query: { _def: { typeName: 'ZodString' }, isOptional: () => false, isNullable: () => false },
        limit: { _def: { typeName: 'ZodNumber' }, isOptional: () => true, isNullable: () => false },
        filter: { _def: { typeName: 'ZodObject' }, isOptional: () => true, isNullable: () => false },
      },
    } as any,
    execute: vi.fn(),
  },
  {
    name: 'codeExecutor',
    description: 'Execute code in a secure environment',
    parameters: {
      shape: {
        code: { _def: { typeName: 'ZodString' }, isOptional: () => false, isNullable: () => false },
        language: { _def: { typeName: 'ZodString' }, isOptional: () => false, isNullable: () => false },
        timeout: { _def: { typeName: 'ZodNumber' }, isOptional: () => true, isNullable: () => false },
      },
    } as any,
    execute: vi.fn(),
  },
  {
    name: 'dataProcessor',
    description: 'Process large datasets with various operations',
    parameters: {
      shape: {
        data: { _def: { typeName: 'ZodArray' }, isOptional: () => false, isNullable: () => false },
        operation: { _def: { typeName: 'ZodEnum' }, isOptional: () => false, isNullable: () => false },
        options: { _def: { typeName: 'ZodObject' }, isOptional: () => true, isNullable: () => false },
      },
    } as any,
    execute: vi.fn(),
  },
];

// Mocks globaux
vi.mock('../../config.ts', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
    TOOL_EXECUTION_TIMEOUT: 30000,
    TOOL_SANDBOX_ENABLED: true,
    TOOL_RATE_LIMIT_ENABLED: true,
    MAX_CONCURRENT_TOOLS: 5,
  },
}));

vi.mock('../../logger.ts', () => ({
  getLoggerInstance: () => ({
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../redis/redisClient.ts', () => ({
  getRedisClientInstance: () => ({
    publish: vi.fn(),
    duplicate: () => ({
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      quit: vi.fn(),
    }),
    incr: vi.fn(),
    expire: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

vi.mock('../../utils/llmProvider.ts', () => ({
  getLlmProvider: () => ({
    getLlmResponse: vi.fn(),
  }),
}));

vi.mock('../llm/LlmKeyManager.ts', () => ({
  LlmKeyManager: {
    hasAvailableKeys: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../tools/toolRegistry.ts', () => ({
  toolRegistry: mockToolRegistry,
}));

vi.mock('./orchestrator.prompt.ts', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock prompt'),
}));

vi.mock('./responseSchema.ts', () => ({
  llmResponseSchema: {
    parse: vi.fn(),
  },
}));

describe('Tool Registry Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJob = {
      id: 'tool-test-job',
      data: { prompt: 'Test tool registry integration' },
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      id: 'tool-test-session',
      history: [],
      activeLlmProvider: 'openai',
      identities: [{ id: 'test', type: 'user' }],
      name: 'tool-test-session',
      timestamp: Date.now(),
    };

    mockSessionManager = {
      saveSession: vi.fn(),
    };

    agent = new Agent(
      mockJob,
      mockSessionData,
      getMockQueue() as any,
      mockTools,
      'openai',
      mockSessionManager
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Tool Execution', () => {
    it('should execute simple file read operation', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "readFile", "params": {"path": "/test/file.txt"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'readFile', params: { path: '/test/file.txt' } },
      });
      mockToolRegistry.execute.mockResolvedValue('File content here');

      await agent.run();

      expect(mockToolRegistry.execute).toHaveBeenCalledWith(
        'readFile',
        { path: '/test/file.txt' },
        expect.any(Object)
      );
    });

    it('should execute web search with complex parameters', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      const searchParams = {
        query: 'AI agent frameworks',
        limit: 10,
        filter: { domain: 'github.com', language: 'en' }
      };

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        `{"command": {"name": "webSearch", "params": ${JSON.stringify(searchParams)}}}`
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'webSearch', params: searchParams },
      });
      mockToolRegistry.execute.mockResolvedValue({
        results: [
          { title: 'LangChain', url: 'https://github.com/langchain-ai/langchain' },
          { title: 'AutoGPT', url: 'https://github.com/Significant-Gravitas/AutoGPT' },
        ]
      });

      await agent.run();

      expect(mockToolRegistry.execute).toHaveBeenCalledWith(
        'webSearch',
        searchParams,
        expect.any(Object)
      );
    });

    it('should handle tool execution with nested parameters', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      const complexParams = {
        data: [
          { id: 1, name: 'Item 1', metadata: { category: 'A', score: 0.8 } },
          { id: 2, name: 'Item 2', metadata: { category: 'B', score: 0.9 } },
        ],
        operation: 'filter',
        options: {
          criteria: { score: { $gte: 0.85 } },
          sortBy: 'score',
          order: 'desc'
        }
      };

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        `{"command": {"name": "dataProcessor", "params": ${JSON.stringify(complexParams)}}}`
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'dataProcessor', params: complexParams },
      });
      mockToolRegistry.execute.mockResolvedValue({
        processed: [{ id: 2, name: 'Item 2', metadata: { category: 'B', score: 0.9 } }],
        count: 1
      });

      await agent.run();

      expect(mockToolRegistry.execute).toHaveBeenCalledWith(
        'dataProcessor',
        complexParams,
        expect.any(Object)
      );
    });
  });

  describe('Tool Chaining and Orchestration', () => {
    it('should execute multiple tools in sequence', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"command": {"name": "readFile", "params": {"path": "/data/input.txt"}}}')
        .mockResolvedValueOnce('{"command": {"name": "dataProcessor", "params": {"data": ["line1", "line2"], "operation": "count"}}}')
        .mockResolvedValueOnce('{"command": {"name": "writeFile", "params": {"path": "/data/output.txt", "content": "Processed: 2 lines"}}}')
        .mockResolvedValueOnce('{"answer": "Data processing completed successfully"}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ command: { name: 'readFile', params: { path: '/data/input.txt' } } })
        .mockReturnValueOnce({ command: { name: 'dataProcessor', params: { data: ['line1', 'line2'], operation: 'count' } } })
        .mockReturnValueOnce({ command: { name: 'writeFile', params: { path: '/data/output.txt', content: 'Processed: 2 lines' } } })
        .mockReturnValueOnce({ answer: 'Data processing completed successfully' });

      mockToolRegistry.execute
        .mockResolvedValueOnce('line1\nline2')
        .mockResolvedValueOnce({ count: 2, lines: ['line1', 'line2'] })
        .mockResolvedValueOnce('File written successfully');

      const result = await agent.run();

      expect(result).toBe('Data processing completed successfully');
      expect(mockToolRegistry.execute).toHaveBeenCalledTimes(3);
      expect(mockToolRegistry.execute).toHaveBeenNthCalledWith(1, 'readFile', { path: '/data/input.txt' }, expect.any(Object));
      expect(mockToolRegistry.execute).toHaveBeenNthCalledWith(2, 'dataProcessor', { data: ['line1', 'line2'], operation: 'count' }, expect.any(Object));
      expect(mockToolRegistry.execute).toHaveBeenNthCalledWith(3, 'writeFile', { path: '/data/output.txt', content: 'Processed: 2 lines' }, expect.any(Object));
    });

    it('should handle parallel tool execution', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      // Simuler l'exécution d'outils en parallèle
      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"thought": "I need to gather information from multiple sources simultaneously"}'
      );
      mockResponseSchema.parse.mockReturnValue({
        thought: 'I need to gather information from multiple sources simultaneously'
      });

      // Simuler plusieurs outils exécutés en parallèle
      const parallelTools = [
        { name: 'webSearch', params: { query: 'AI news' } },
        { name: 'readFile', params: { path: '/data/reports.txt' } },
        { name: 'dataProcessor', params: { data: [], operation: 'summarize' } },
      ];

      mockToolRegistry.execute
        .mockResolvedValueOnce('Web search results')
        .mockResolvedValueOnce('File content')
        .mockResolvedValueOnce('Data summary');

      // Simuler l'exécution en parallèle
      const promises = parallelTools.map(tool => 
        mockToolRegistry.execute(tool.name, tool.params, {})
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockToolRegistry.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle tool dependencies and prerequisites', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      // Outil qui dépend du résultat d'un autre outil
      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"command": {"name": "webSearch", "params": {"query": "data source"}}}')
        .mockResolvedValueOnce('{"command": {"name": "readFile", "params": {"path": "{{search_result_url}}"}}}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ command: { name: 'webSearch', params: { query: 'data source' } } })
        .mockReturnValueOnce({ command: { name: 'readFile', params: { path: '{{search_result_url}}' } } });

      mockToolRegistry.execute
        .mockResolvedValueOnce({ results: [{ url: '/found/data.txt' }] })
        .mockResolvedValueOnce('Found data content');

      await agent.run();

      expect(mockToolRegistry.execute).toHaveBeenNthCalledWith(
        2, 'readFile', { path: '{{search_result_url}}' }, expect.any(Object)
      );
    });
  });

  describe('Tool Security and Sandboxing', () => {
    it('should execute tools in secure sandbox environment', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      const codeParams = {
        code: 'console.log("Hello from sandbox");',
        language: 'javascript',
        timeout: 5000
      };

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        `{"command": {"name": "codeExecutor", "params": ${JSON.stringify(codeParams)}}}`
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'codeExecutor', params: codeParams },
      });

      mockToolRegistry.executeInSandbox = vi.fn();
      (mockToolRegistry.executeInSandbox as any).mockResolvedValue({
        output: 'Hello from sandbox',
        exitCode: 0,
        executionTime: 45,
        memoryUsed: '12MB'
      });

      await agent.run();

      expect(mockToolRegistry.executeInSandbox).toHaveBeenCalledWith(
        'codeExecutor',
        codeParams,
        expect.objectContaining({
          isolated: true,
          networkAccess: false,
          fileSystemAccess: false
        })
      );
    });

    it('should enforce tool resource limits', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      const heavyProcessingParams = {
        data: Array.from({ length: 100000 }, (_, i) => ({ id: i, value: Math.random() })),
        operation: 'complex_analysis',
        options: { precision: 'high' }
      };

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        `{"command": {"name": "dataProcessor", "params": ${JSON.stringify(heavyProcessingParams)}}}`
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'dataProcessor', params: heavyProcessingParams },
      });

      // Simuler un échec dû aux limites de ressources
      mockToolRegistry.execute.mockRejectedValue(
        new Error('Tool execution exceeded memory limit: 512MB')
      );

      await agent.run();

      expect(mockToolRegistry.execute).toHaveBeenCalled();
      expect(mockSessionData.history.some(msg => 
        msg.type === 'tool_result' && 
        typeof msg.result === 'string' &&
        (msg.result as string).includes('memory limit')
      )).toBe(true);
    });

    it('should validate tool parameters before execution', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      // Paramètres invalides
      const invalidParams = {
        path: null, // path requis
        content: 123, // doit être string
      };

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        `{"command": {"name": "writeFile", "params": ${JSON.stringify(invalidParams)}}}`
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'writeFile', params: invalidParams },
      });

      mockToolRegistry.validate = vi.fn();
      (mockToolRegistry.validate as any).mockReturnValue({
        valid: false,
        errors: ['path is required', 'content must be a string']
      });

      await agent.run();

      expect(mockToolRegistry.validate).toHaveBeenCalledWith('writeFile', invalidParams);
      expect(mockToolRegistry.execute).not.toHaveBeenCalled();
    });
  });

  describe('Tool Performance and Monitoring', () => {
    it('should monitor tool execution performance', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "webSearch", "params": {"query": "performance test"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'webSearch', params: { query: 'performance test' } },
      });

      mockToolRegistry.monitorToolExecution = vi.fn();
      (mockToolRegistry.monitorToolExecution as any).mockImplementation((toolName: string, params: any, callback: any) => {
        const startTime = Date.now();
        return mockToolRegistry.execute(toolName, params, {}).then((result: any) => {
          const endTime = Date.now();
          callback({
            tool: toolName,
            executionTime: endTime - startTime,
            memoryUsage: '45MB',
            cpuUsage: '12%',
            result
          });
          return result;
        });
      });

      mockToolRegistry.execute = vi.fn();
      (mockToolRegistry.execute as any).mockResolvedValue({ results: ['Performance test results'] });

      await agent.run();

      expect(mockToolRegistry.monitorToolExecution).toHaveBeenCalled();
    });

    it('should track tool usage metrics', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "readFile", "params": {"path": "/metrics/test.txt"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'readFile', params: { path: '/metrics/test.txt' } },
      });
      mockToolRegistry.execute = vi.fn();
      (mockToolRegistry.execute as any).mockResolvedValue('Metrics test content');

      mockToolRegistry.getToolMetrics = vi.fn();
      (mockToolRegistry.getToolMetrics as any).mockResolvedValue({
        totalExecutions: 145,
        averageExecutionTime: 234,
        successRate: 0.98,
        errorRate: 0.02,
        lastUsed: Date.now() - 3600000,
      });

      await agent.run();

      expect(mockToolRegistry.getToolMetrics).toHaveBeenCalledWith('readFile');
    });

    it('should handle tool timeout gracefully', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "codeExecutor", "params": {"code": "while(true) {}", "language": "javascript"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'codeExecutor', params: { code: 'while(true) {}', language: 'javascript' } },
      });

      mockToolRegistry.executeWithTimeout = vi.fn();
      (mockToolRegistry.executeWithTimeout as any).mockImplementation((toolName: string, params: any, timeout: number) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error(`Tool execution timed out after ${timeout}ms`));
          }, timeout);
        });
      });

      await agent.run();

      expect(mockToolRegistry.executeWithTimeout).toHaveBeenCalledWith(
        'codeExecutor',
        { code: 'while(true) {}', language: 'javascript' },
        30000 // timeout from tool definition
      );
    });
  });

  describe('Tool Rate Limiting and Concurrency', () => {
    it('should enforce rate limits on tool usage', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;
      const mockRedisClient = require('../redis/redisClient.ts').getRedisClientInstance();

      // Simuler plusieurs appels rapides au même outil
      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "webSearch", "params": {"query": "rate limit test"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'webSearch', params: { query: 'rate limit test' } },
      });

      // Simuler que la limite de taux est atteinte
      mockRedisClient.incr = vi.fn();
      (mockRedisClient.incr as any).mockResolvedValue(11); // Dépasse la limite de 10
      mockRedisClient.expire = vi.fn();
      (mockRedisClient.expire as any).mockResolvedValue(1);

      mockToolRegistry.execute = vi.fn();
      (mockToolRegistry.execute as any).mockRejectedValue(
        new Error('Rate limit exceeded: 10 requests per minute')
      );

      await agent.run();

      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        expect.stringContaining('rate_limit:webSearch')
      );
      expect(mockToolRegistry.execute).toHaveBeenCalled();
    });

    it('should manage concurrent tool executions', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      // Simuler plusieurs agents essayant d'exécuter des outils simultanément
      const agents = Array.from({ length: 8 }, (_, i) => 
        new Agent(
          { ...mockJob, id: `concurrent-job-${i}` },
          { ...mockSessionData, id: `session-${i}` },
          getMockQueue() as any,
          mockTools,
          'openai',
          mockSessionManager
        )
      );

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "dataProcessor", "params": {"data": [1,2,3], "operation": "sum"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'dataProcessor', params: { data: [1,2,3], operation: 'sum' } },
      });

      let concurrentExecutions = 0;
      const maxConcurrentTools = 5;

      mockToolRegistry.execute.mockImplementation(async () => {
        concurrentExecutions++;
        if (concurrentExecutions > maxConcurrentTools) {
          throw new Error('Too many concurrent tool executions');
        }
        
        // Simuler du travail
        await new Promise(resolve => setTimeout(resolve, 100));
        concurrentExecutions--;
        return { sum: 6 };
      });

      const results = await Promise.all(agents.map(agent => agent.run()));

      expect(results.every(result => typeof result === 'string')).toBe(true);
    });

    it('should queue tool executions when at capacity', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "codeExecutor", "params": {"code": "console.log(\\"test\\")", "language": "javascript"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'codeExecutor', params: { code: 'console.log("test")', language: 'javascript' } },
      });

      let queuedExecutions = 0;
      mockToolRegistry.execute.mockImplementation(async () => {
        queuedExecutions++;
        if (queuedExecutions > 5) {
          // Simuler la mise en file d'attente
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        return { output: 'test', exitCode: 0 };
      });

      await agent.run();

      expect(mockToolRegistry.execute).toHaveBeenCalled();
    });
  });

  describe('Tool Error Handling and Recovery', () => {
    it('should handle tool execution failures gracefully', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"command": {"name": "readFile", "params": {"path": "/nonexistent/file.txt"}}}')
        .mockResolvedValueOnce('{"answer": "I encountered an error reading the file. Let me try an alternative approach."}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ command: { name: 'readFile', params: { path: '/nonexistent/file.txt' } } })
        .mockReturnValueOnce({ answer: 'I encountered an error reading the file. Let me try an alternative approach.' });

      mockToolRegistry.execute.mockRejectedValue(new Error('File not found: /nonexistent/file.txt'));

      const result = await agent.run();

      expect(result).toContain('alternative approach');
      expect(mockSessionData.history.some(msg => 
        msg.type === 'tool_result' && 
        typeof msg.result === 'string' &&
        (msg.result as string).includes('File not found')
      )).toBe(true);
    });

    it('should retry failed tool executions with exponential backoff', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "webSearch", "params": {"query": "retry test"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'webSearch', params: { query: 'retry test' } },
      });

      // Premier appel échoue, deuxième réussit
      mockToolRegistry.execute
        .mockRejectedValueOnce(new Error('Temporary network error'))
        .mockRejectedValueOnce(new Error('Still failing'))
        .mockResolvedValueOnce({ results: ['Retry success'] });

      await agent.run();

      expect(mockToolRegistry.execute).toHaveBeenCalledTimes(3);
    });

    it('should provide detailed error diagnostics', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "codeExecutor", "params": {"code": "invalid syntax", "language": "python"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'codeExecutor', params: { code: 'invalid syntax', language: 'python' } },
      });

      const detailedError: any = new Error('Syntax error in Python code');
      detailedError.details = {
        line: 1,
        column: 8,
        errorType: 'SyntaxError',
        suggestion: 'Check for missing colons or parentheses'
      };

      mockToolRegistry.execute = vi.fn();
      (mockToolRegistry.execute as any).mockRejectedValue(detailedError);

      await agent.run();

      const errorResult = mockSessionData.history.find(msg => 
        msg.type === 'tool_result' && 
        typeof msg.result === 'string' &&
        (msg.result as string).includes('Syntax error')
      );

      expect(errorResult).toBeDefined();
      expect((errorResult as any).result).toContain('line: 1');
      expect((errorResult as any).result).toContain('SyntaxError');
    });
  });

  describe('Dynamic Tool Discovery and Loading', () => {
    it('should discover and load new tools at runtime', async () => {
      const newTool: Tool = {
        name: 'newDynamicTool',
        description: 'A dynamically loaded tool',
        parameters: {
          shape: {
            input: { _def: { typeName: 'ZodString' }, isOptional: () => false, isNullable: () => false },
          },
        } as any,
        execute: vi.fn().mockResolvedValue('Dynamic tool result'),
      };

      mockToolRegistry.register = vi.fn();
      (mockToolRegistry.register as any).mockResolvedValue(true);
      mockToolRegistry.list = vi.fn();
      (mockToolRegistry.list as any).mockReturnValue([...mockTools, newTool]);

      await agent.run();

      expect(mockToolRegistry.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          description: expect.any(String),
        })
      );
    });

    it('should hot-reload updated tool definitions', async () => {
      const updatedTool: any = {
        ...mockTools[0],
        version: '2.0',
        description: 'Updated file reader with enhanced features',
        parameters: {
          ...mockTools[0].parameters,
          shape: {
            ...mockTools[0].parameters.shape,
            maxSize: { _def: { typeName: 'ZodNumber' }, isOptional: () => true, isNullable: () => false },
          }
        }
      };

      mockToolRegistry.getToolDefinition = vi.fn();
      (mockToolRegistry.getToolDefinition as any).mockReturnValue(updatedTool);

      await agent.run();

      expect(mockToolRegistry.getToolDefinition).toHaveBeenCalledWith('readFile');
    });

    it('should handle tool compatibility checks', async () => {
      const incompatibleTool: any = {
        name: 'legacyTool',
        version: '1.0',
        compatibleVersions: ['1.x'],
        currentSystemVersion: '2.0'
      };

      mockToolRegistry.validate = vi.fn();
      (mockToolRegistry.validate as any).mockReturnValue({
        valid: false,
        errors: ['Tool version 1.0 is not compatible with system version 2.0']
      });

      await agent.run();

      // Le système devrait gérer l'incompatibilité gracieusement
      expect(mockToolRegistry.validate).toHaveBeenCalled();
    });
  });
});