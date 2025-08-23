import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { SessionData, Tool } from '../../types.ts';

import { getMockQueue } from '../../test/mockQueue.ts';
import { Agent } from './agent.ts';

// Mocks globaux simplifiés
vi.mock('../../config.ts', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 10,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
  },
}));
vi.mock('../../logger.ts', () => ({
  getLoggerInstance: () => ({
    child: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));
vi.mock('../redis/redisClient.ts', () => ({
  getRedisClientInstance: () => ({
    duplicate: () => ({
      on: vi.fn(),
      quit: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    }),
    hget: vi.fn(),
    hset: vi.fn(),
    publish: vi.fn(),
  }),
}));
vi.mock('../../utils/llmProvider.ts', () => ({
  getLlmProvider: () => ({ getLlmResponse: vi.fn() }),
}));
vi.mock('../llm/LlmKeyManager.ts', () => ({
  LlmKeyManager: { hasAvailableKeys: vi.fn().mockResolvedValue(true) },
}));
vi.mock('../tools/toolRegistry.ts', () => ({
  toolRegistry: { execute: vi.fn() },
}));
vi.mock('./orchestrator.prompt.ts', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock prompt'),
}));
vi.mock('./responseSchema.ts', () => ({
  llmResponseSchema: { parse: vi.fn() },
}));

describe('End-to-End Workflow Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let mockTools: Tool[];
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJob = {
      data: { prompt: 'Complete workflow test' },
      id: 'e2e-test',
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };
    mockSessionData = {
      activeLlmProvider: 'openai',
      history: [],
      id: 'e2e-session',
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'E2E Test Session',
      timestamp: Date.now(),
    };
    mockSessionManager = { saveSession: vi.fn() };
    const emptySchema = z.object({});

    mockTools = [
      {
        description: 'Read files',
        execute: vi.fn(),
        name: 'fileRead',
        parameters: emptySchema,
      },
      {
        description: 'Search web',
        execute: vi.fn(),
        name: 'webSearch',
        parameters: emptySchema,
      },
      {
        description: 'Analyze data',
        execute: vi.fn(),
        name: 'dataAnalysis',
        parameters: emptySchema,
      },
    ];
    agent = new Agent(
      mockJob,
      mockSessionData,
      getMockQueue(),
      mockTools,
      'openai',
      mockSessionManager,
    );
  });

  describe('Complete Data Analysis Workflow', () => {
    it('should execute complete data analysis pipeline', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.ts').toolRegistry;

      // Workflow: Read data → Process → Analyze → Generate report
      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce(
          '{"thought": "I need to read the data file first"}',
        )
        .mockResolvedValueOnce(
          '{"command": {"name": "fileRead", "params": {"path": "/data/sales.csv"}}}',
        )
        .mockResolvedValueOnce(
          '{"thought": "Now I need to analyze this sales data"}',
        )
        .mockResolvedValueOnce(
          '{"command": {"name": "dataAnalysis", "params": {"data": "csv_data", "type": "sales_analysis"}}}',
        )
        .mockResolvedValueOnce(
          '{"canvas": {"content": "Sales Analysis Report", "contentType": "html"}}',
        )
        .mockResolvedValueOnce(
          '{"answer": "Sales analysis completed. Revenue increased 15% compared to last quarter."}',
        );

      mockResponseSchema.parse
        .mockReturnValueOnce({ thought: 'I need to read the data file first' })
        .mockReturnValueOnce({
          command: { name: 'fileRead', params: { path: '/data/sales.csv' } },
        })
        .mockReturnValueOnce({
          thought: 'Now I need to analyze this sales data',
        })
        .mockReturnValueOnce({
          command: {
            name: 'dataAnalysis',
            params: { data: 'csv_data', type: 'sales_analysis' },
          },
        })
        .mockReturnValueOnce({
          canvas: { content: 'Sales Analysis Report', contentType: 'html' },
        })
        .mockReturnValueOnce({
          answer:
            'Sales analysis completed. Revenue increased 15% compared to last quarter.',
        });

      mockToolRegistry.execute
        .mockResolvedValueOnce(
          'ProductA,100,5000\nProductB,150,7500\nProductC,200,10000',
        )
        .mockResolvedValueOnce({
          growth: 0.15,
          topProduct: 'ProductC',
          totalRevenue: 22500,
        });

      const result = await agent.run();

      expect(result).toContain('Sales analysis completed');
      expect(result).toContain('15%');
      expect(mockToolRegistry.execute).toHaveBeenCalledTimes(2);
      expect(mockSessionData.history.length).toBeGreaterThan(5);
    });

    it('should handle research and synthesis workflow', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.ts').toolRegistry;

      // Research workflow: Search → Gather → Synthesize → Report
      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce(
          '{"thought": "I should search for recent developments in AI"}',
        )
        .mockResolvedValueOnce(
          '{"command": {"name": "webSearch", "params": {"query": "AI developments 2024", "limit": 10}}}',
        )
        .mockResolvedValueOnce(
          '{"thought": "Let me search for more specific information about AI safety"}',
        )
        .mockResolvedValueOnce(
          '{"command": {"name": "webSearch", "params": {"query": "AI safety research 2024", "limit": 5}}}',
        )
        .mockResolvedValueOnce(
          '{"answer": "Based on my research, key AI developments in 2024 include advances in safety research, new model architectures, and improved alignment techniques."}',
        );

      mockResponseSchema.parse
        .mockReturnValueOnce({
          thought: 'I should search for recent developments in AI',
        })
        .mockReturnValueOnce({
          command: {
            name: 'webSearch',
            params: { limit: 10, query: 'AI developments 2024' },
          },
        })
        .mockReturnValueOnce({
          thought:
            'Let me search for more specific information about AI safety',
        })
        .mockReturnValueOnce({
          command: {
            name: 'webSearch',
            params: { limit: 5, query: 'AI safety research 2024' },
          },
        })
        .mockReturnValueOnce({
          answer:
            'Based on my research, key AI developments in 2024 include advances in safety research, new model architectures, and improved alignment techniques.',
        });

      mockToolRegistry.execute
        .mockResolvedValueOnce({
          results: [
            {
              summary: 'New alignment research',
              title: 'AI Safety Paper',
              url: 'example.com',
            },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            {
              summary: 'Improved efficiency',
              title: 'AI Model Architecture',
              url: 'paper.com',
            },
          ],
        });

      const result = await agent.run();

      expect(result).toContain('AI developments in 2024');
      expect(mockToolRegistry.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Multi-step Problem Solving', () => {
    it('should solve complex problems requiring multiple iterations', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      // Complex problem: Plan → Execute → Validate → Adjust → Finalize
      const responses = [
        '{"thought": "This is a complex problem. Let me break it down into steps."}',
        '{"thought": "Step 1: I need to gather initial data"}',
        '{"command": {"name": "fileRead", "params": {"path": "/problem/data.json"}}}',
        '{"thought": "Step 2: The data shows inconsistencies. I need to cross-reference."}',
        '{"command": {"name": "webSearch", "params": {"query": "data validation techniques"}}}',
        '{"thought": "Step 3: Now I can apply the validation technique"}',
        '{"command": {"name": "dataAnalysis", "params": {"operation": "validate", "method": "cross_reference"}}}',
        '{"answer": "Problem solved using multi-step validation approach. Data inconsistencies resolved."}',
      ];

      responses.forEach((response) => {
        mockLlmProvider.getLlmResponse.mockResolvedValueOnce(response);
        mockResponseSchema.parse.mockReturnValueOnce(JSON.parse(response));
      });

      const mockToolRegistry = require('../tools/toolRegistry.ts').toolRegistry;
      mockToolRegistry.execute
        .mockResolvedValueOnce(
          '{"inconsistent_records": 15, "total_records": 1000}',
        )
        .mockResolvedValueOnce(
          '{"validation_methods": ["cross_reference", "statistical_check"]}',
        )
        .mockResolvedValueOnce(
          '{"validation_result": "success", "fixed_records": 15}',
        );

      const result = await agent.run();

      expect(result).toContain('Problem solved');
      expect(result).toContain('multi-step');
      expect(mockLlmProvider.getLlmResponse).toHaveBeenCalledTimes(8);
    });

    it('should handle error recovery and alternative approaches', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.ts').toolRegistry;

      // Error recovery workflow
      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce(
          '{"command": {"name": "fileRead", "params": {"path": "/missing/file.txt"}}}',
        )
        .mockResolvedValueOnce(
          '{"thought": "The file is missing. Let me try an alternative approach."}',
        )
        .mockResolvedValueOnce(
          '{"command": {"name": "webSearch", "params": {"query": "alternative data source"}}}',
        )
        .mockResolvedValueOnce(
          '{"answer": "Successfully found alternative data source and completed the task."}',
        );

      mockResponseSchema.parse
        .mockReturnValueOnce({
          command: { name: 'fileRead', params: { path: '/missing/file.txt' } },
        })
        .mockReturnValueOnce({
          thought: 'The file is missing. Let me try an alternative approach.',
        })
        .mockReturnValueOnce({
          command: {
            name: 'webSearch',
            params: { query: 'alternative data source' },
          },
        })
        .mockReturnValueOnce({
          answer:
            'Successfully found alternative data source and completed the task.',
        });

      mockToolRegistry.execute
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce({
          results: [{ data: 'backup_data', source: 'alternative_api' }],
        });

      const result = await agent.run();

      expect(result).toContain('Successfully found alternative');
      expect(mockToolRegistry.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Session Continuity and State Management', () => {
    it('should maintain context across conversation turns', async () => {
      // Initialize with previous conversation
      mockSessionData.history = [
        {
          content: 'Analyze quarterly sales data',
          id: '1',
          timestamp: Date.now() - 5000,
          type: 'user',
        },
        {
          content: 'I analyzed Q3 sales. Revenue was $2.5M, up 12%.',
          id: '2',
          timestamp: Date.now() - 4000,
          type: 'agent_response',
        },
        {
          content: 'Now compare with Q2 data',
          id: '3',
          timestamp: Date.now() - 3000,
          type: 'user',
        },
      ] as any[];

      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Comparing Q3 ($2.5M) with Q2 ($2.2M), we see a 13.6% growth quarter-over-quarter."}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer:
          'Comparing Q3 ($2.5M) with Q2 ($2.2M), we see a 13.6% growth quarter-over-quarter.',
      });

      const result = await agent.run();

      expect(result).toContain('Comparing Q3');
      expect(result).toContain('Q2');
      expect(result).toContain('13.6%');
    });

    it('should handle session persistence and recovery', async () => {
      // Simulate session recovery
      const persistedSession = {
        ...mockSessionData,
        workingContext: {
          currentFile: 'data_analysis.json',
          lastAction: 'progress 70% - revenue: 2500000, growth: 0.12',
        },
      };

      const recoveredAgent = new Agent(
        mockJob,
        persistedSession,
        getMockQueue(),
        mockTools,
        'openai',
        mockSessionManager,
      );

      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Continuing from previous analysis, I can now finalize the report."}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer:
          'Continuing from previous analysis, I can now finalize the report.',
      });

      const result = await recoveredAgent.run();

      expect(result).toContain('Continuing from previous');
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });

  describe('Integration with External Systems', () => {
    it('should integrate with multiple external APIs', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.ts').toolRegistry;

      // Multi-API integration workflow
      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce(
          '{"command": {"name": "webSearch", "params": {"query": "weather forecast Paris"}}}',
        )
        .mockResolvedValueOnce(
          '{"command": {"name": "dataAnalysis", "params": {"type": "weather_trend"}}}',
        )
        .mockResolvedValueOnce(
          '{"answer": "Weather analysis complete. Paris will have mild temperatures this week with a 20% chance of rain."}',
        );

      mockResponseSchema.parse
        .mockReturnValueOnce({
          command: {
            name: 'webSearch',
            params: { query: 'weather forecast Paris' },
          },
        })
        .mockReturnValueOnce({
          command: { name: 'dataAnalysis', params: { type: 'weather_trend' } },
        })
        .mockReturnValueOnce({
          answer:
            'Weather analysis complete. Paris will have mild temperatures this week with a 20% chance of rain.',
        });

      mockToolRegistry.execute
        .mockResolvedValueOnce({
          forecast: '7 days',
          humidity: '65%',
          temperature: '18°C',
        })
        .mockResolvedValueOnce({ rain_probability: 0.2, trend: 'stable' });

      const result = await agent.run();

      expect(result).toContain('Weather analysis complete');
      expect(result).toContain('Paris');
      expect(result).toContain('20%');
    });

    it('should handle workflow orchestration across services', async () => {
      const workflowSteps = [
        { service: 'data_ingestion', status: 'completed' },
        { service: 'data_processing', status: 'in_progress' },
        { service: 'analysis', status: 'pending' },
        { service: 'reporting', status: 'pending' },
      ];

      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Workflow orchestration complete. All services executed successfully in sequence."}',
      );
      mockResponseSchema.parse.mockReturnValue({
        answer:
          'Workflow orchestration complete. All services executed successfully in sequence.',
      });

      const result = await agent.run();

      expect(result).toContain('Workflow orchestration complete');
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });
});
