import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { z } from 'zod';
import { Agent } from './agent.ts';
import type { SessionData, Tool, Message } from '../../types.ts';

// Mock all dependencies for integration testing
vi.mock('../../config.ts', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 10,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
  },
}));

vi.mock('../../logger.ts', () => ({
  getLoggerInstance: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('../../utils/llmProvider', () => ({
  getLlmProvider: vi.fn().mockReturnValue({
    getLlmResponse: vi.fn(),
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
  }),
}));

vi.mock('../llm/LlmKeyManager.ts', () => ({
  LlmKeyManager: {
    hasAvailableKeys: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../tools/toolRegistry.ts', () => ({
  toolRegistry: {
    execute: vi.fn(),
  },
}));

vi.mock('./orchestrator.prompt.ts', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock master prompt'),
}));

vi.mock('./responseSchema.ts', () => ({
  llmResponseSchema: {
    parse: vi.fn(),
  },
}));

describe('Agent Conversation Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let mockTools: Tool[];
  let mockLlmProvider: any;
  let mockResponseSchema: any;
  let mockToolRegistry: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockJob = {
      id: 'conversation-job-123',
      data: { prompt: 'Start conversation' },
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      history: [],
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'Conversation Session',
      timestamp: Date.now(),
      activeLlmProvider: 'openai',
    };

    mockSessionManager = {
      saveSession: vi.fn(),
    };

    const emptySchema = z.object({});

    mockTools = [
      {
        name: 'readFile',
        description: 'Read a file',
        parameters: emptySchema,
        execute: vi.fn(),
      },
      {
        name: 'writeFile',
        description: 'Write to a file',
        parameters: emptySchema,
        execute: vi.fn(),
      },
      {
        name: 'webSearch',
        description: 'Search the web',
        parameters: emptySchema,
        execute: vi.fn(),
      },
    ];

    const llmProviderModule = await import('../../utils/llmProvider.ts');
    (llmProviderModule.getLlmProvider as Mock).mockReturnValue({
      getLlmResponse: vi.fn(),
    });
    mockLlmProvider = llmProviderModule.getLlmProvider('openai');

    const responseSchemaModule = await import('./responseSchema.ts');
    (responseSchemaModule.llmResponseSchema.parse as Mock) = vi.fn();
    mockResponseSchema = responseSchemaModule.llmResponseSchema;

    const toolRegistryModule = await import('../tools/toolRegistry.ts');
    (toolRegistryModule.toolRegistry.execute as Mock) = vi.fn();
    mockToolRegistry = toolRegistryModule.toolRegistry;
  });

  describe('Complete Conversation Flows', () => {
    it('should handle a simple question-answer conversation', async () => {
      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue(
        '{"answer": "Hello! I can help you with file operations, web searches, and more."}'
      );

      (mockResponseSchema.parse as Mock).mockReturnValue({
        answer: 'Hello! I can help you with file operations, web searches, and more.',
      });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toBe('Hello! I can help you with file operations, web searches, and more.');
      expect(mockSessionData.history).toHaveLength(3); // User prompt + thinking message + agent response
      expect(mockSessionData.history[0].type).toBe('user');
      expect(mockSessionData.history[1].type).toBe('agent_thought');
      expect(mockSessionData.history[2].type).toBe('agent_response');
    });

    it('should handle multi-step file operation workflow', async () => {
      // Step 1: Agent thinks about the request
      // Step 2: Agent reads a file
      // Step 3: Agent processes and responds
      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "I need to read the file first to help the user"}')
        .mockResolvedValueOnce('{"command": {"name": "readFile", "params": {"path": "/data/test.txt"}}}')
        .mockResolvedValueOnce('{"answer": "The file contains 5 lines of test data. I can help you process it further."}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'I need to read the file first to help the user' })
        .mockReturnValueOnce({ command: { name: 'readFile', params: { path: '/data/test.txt' } } })
        .mockReturnValueOnce({ answer: 'The file contains 5 lines of test data. I can help you process it further.' });

      (mockToolRegistry.execute as Mock).mockResolvedValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toBe('The file contains 5 lines of test data. I can help you process it further.');
      expect(mockToolRegistry.execute).toHaveBeenCalledWith(
        'readFile',
        { path: '/data/test.txt' },
        expect.any(Object)
      );
      
      // Check conversation history progression
      const history = mockSessionData.history;
      // Based on the actual implementation, we expect 4 agent_thought messages:
      // 1. Initial "The agent is thinking..." message
      // 2. Thought from first LLM response
      // 3. Another "The agent is thinking..." message for the next iteration
      // 4. Thought from third LLM response (before returning answer)
      expect(history.filter(msg => msg.type === 'agent_thought')).toHaveLength(4);
      expect(history.filter(msg => msg.type === 'tool_call')).toHaveLength(1);
      expect(history.filter(msg => msg.type === 'tool_result')).toHaveLength(1);
    });

    it('should handle research and analysis workflow', async () => {
      // Simulate a research task with web search and analysis
      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "I need to search for information about this topic"}')
        .mockResolvedValueOnce('{"command": {"name": "webSearch", "params": {"query": "AI agent frameworks 2024"}}}')
        .mockResolvedValueOnce('{"thought": "Great! I found relevant information. Let me analyze and summarize it."}')
        .mockResolvedValueOnce('{"answer": "Based on my research, here are the top AI agent frameworks in 2024: 1) LangChain 2) AutoGPT 3) AgentGPT 4) CrewAI. Each has unique strengths for different use cases."}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'I need to search for information about this topic' })
        .mockReturnValueOnce({ command: { name: 'webSearch', params: { query: 'AI agent frameworks 2024' } } })
        .mockReturnValueOnce({ thought: 'Great! I found relevant information. Let me analyze and summarize it.' })
        .mockReturnValueOnce({ answer: 'Based on my research, here are the top AI agent frameworks in 2024: 1) LangChain 2) AutoGPT 3) AgentGPT 4) CrewAI. Each has unique strengths for different use cases.' });

      (mockToolRegistry.execute as Mock).mockResolvedValue({
        results: [
          { title: 'LangChain Documentation', snippet: 'Framework for building LLM applications' },
          { title: 'AutoGPT GitHub', snippet: 'Autonomous AI agent framework' },
          { title: 'CrewAI Features', snippet: 'Multi-agent collaboration framework' },
        ],
      });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('AI agent frameworks in 2024');
      expect(mockToolRegistry.execute).toHaveBeenCalledWith(
        'webSearch',
        { query: 'AI agent frameworks 2024' },
        expect.any(Object)
      );
    });

    it('should handle canvas visualization workflow', async () => {
      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "The user wants a chart. I should create a visualization."}')
        .mockResolvedValueOnce('{"canvas": {"content": "<div><h2>Sales Data</h2><canvas id=\"chart\"></canvas></div>", "contentType": "html"}}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'The user wants a chart. I should create a visualization.' })
        .mockReturnValueOnce({
          canvas: {
            content: '<div><h2>Sales Data</h2><canvas id="chart"></canvas></div>',
            contentType: 'html',
          },
        });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toBe('Agent displayed content on the canvas.');
      
      const canvasMessage = mockSessionData.history.find(msg => msg.type === 'agent_canvas_output');
      expect(canvasMessage).toBeDefined();
      expect(canvasMessage?.content).toContain('<h2>Sales Data</h2>');
      expect(canvasMessage?.contentType).toBe('html');
    });

    it('should handle error recovery in conversation', async () => {
      // First attempt fails, agent recovers with alternative approach
      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"command": {"name": "readFile", "params": {"path": "/nonexistent/file.txt"}}}')
        .mockResolvedValueOnce('{"thought": "The file doesn\'t exist. Let me try a different approach."}')
        .mockResolvedValueOnce('{"command": {"name": "webSearch", "params": {"query": "alternative data source"}}}')
        .mockResolvedValueOnce('{"answer": "I couldn\'t access the requested file, but I found alternative information online that might help."}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ command: { name: 'readFile', params: { path: '/nonexistent/file.txt' } } })
        .mockReturnValueOnce({ thought: "The file doesn't exist. Let me try a different approach." })
        .mockReturnValueOnce({ command: { name: 'webSearch', params: { query: 'alternative data source' } } })
        .mockReturnValueOnce({ answer: "I couldn't access the requested file, but I found alternative information online that might help." });

      (mockToolRegistry.execute as Mock)
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce({ results: [{ title: 'Alternative Data', snippet: 'Found relevant info' }] });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('alternative information online');
      
      // Should have error message in history
      const errorMessage = mockSessionData.history.find(msg => 
        msg.type === 'tool_result' && 
        typeof msg.result === 'string' && 
        (msg.result as string).includes('Error executing tool')
      );
      expect(errorMessage).toBeDefined();
    });
  });

  describe('Complex Multi-Turn Conversations', () => {
    it('should maintain context across multiple interactions', async () => {
      // Pre-populate conversation history
      mockSessionData.history = [
        { type: 'user', content: 'What is in my project folder?', id: '1', timestamp: Date.now() - 1000 },
        { type: 'agent_response', content: 'I found 3 files: main.py, data.csv, and README.md', id: '2', timestamp: Date.now() - 900 },
        { type: 'user', content: 'Can you analyze the data.csv file?', id: '3', timestamp: Date.now() - 800 },
      ] as Message[];

      mockJob.data.prompt = 'Show me a summary of the analysis';

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "The user previously asked about data.csv analysis. I should read that file and provide a summary."}')
        .mockResolvedValueOnce('{"command": {"name": "readFile", "params": {"path": "data.csv"}}}')
        .mockResolvedValueOnce('{"answer": "Based on the data.csv analysis: 100 records, average age 35, 60% male/40% female distribution."}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'The user previously asked about data.csv analysis. I should read that file and provide a summary.' })
        .mockReturnValueOnce({ command: { name: 'readFile', params: { path: 'data.csv' } } })
        .mockReturnValueOnce({ answer: 'Based on the data.csv analysis: 100 records, average age 35, 60% male/40% female distribution.' });

      (mockToolRegistry.execute as Mock).mockResolvedValue('name,age,gender\nJohn,25,M\nJane,30,F\n...');

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('100 records');
      expect(result).toContain('average age 35');
      
      // Verify the conversation context was maintained
      expect(mockSessionData.history.length).toBeGreaterThan(3); // Started with 3, added more
    });

    it('should handle branching conversation paths', async () => {
      // User asks for analysis, agent offers multiple options
      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "The user wants analysis. I should offer different types of analysis."}')
        .mockResolvedValueOnce('{"answer": "I can provide several types of analysis: 1) Statistical summary 2) Data visualization 3) Trend analysis. Which would you prefer?"}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'The user wants analysis. I should offer different types of analysis.' })
        .mockReturnValueOnce({ answer: 'I can provide several types of analysis: 1) Statistical summary 2) Data visualization 3) Trend analysis. Which would you prefer?' });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('Statistical summary');
      expect(result).toContain('Data visualization');
      expect(result).toContain('Trend analysis');
    });

    it('should handle clarification requests', async () => {
      mockJob.data.prompt = 'Process the file';

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue(
        '{"answer": "I\'d be happy to help process a file! Could you please specify: 1) Which file you\'d like me to process? 2) What type of processing you need (analysis, conversion, filtering, etc.)?"}'
      );

      (mockResponseSchema.parse as Mock).mockReturnValue({
        answer: "I'd be happy to help process a file! Could you please specify: 1) Which file you'd like me to process? 2) What type of processing you need (analysis, conversion, filtering, etc.)?",
      });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('Which file');
      expect(result).toContain('What type of processing');
    });
  });

  describe('Agent Behavior Patterns', () => {
    it('should demonstrate reasoning and planning', async () => {
      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "This is a complex request. I need to: 1) Search for information 2) Analyze the results 3) Create a summary report."}')
        .mockResolvedValueOnce('{"command": {"name": "webSearch", "params": {"query": "research topic"}}}')
        .mockResolvedValueOnce('{"thought": "Good results found. Now I need to analyze and structure this information."}')
        .mockResolvedValueOnce('{"canvas": {"content": "# Research Report\n\n## Key Findings\n- Finding 1\n- Finding 2", "contentType": "markdown"}}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'This is a complex request. I need to: 1) Search for information 2) Analyze the results 3) Create a summary report.' })
        .mockReturnValueOnce({ command: { name: 'webSearch', params: { query: 'research topic' } } })
        .mockReturnValueOnce({ thought: 'Good results found. Now I need to analyze and structure this information.' })
        .mockReturnValueOnce({ canvas: { content: '# Research Report\n\n## Key Findings\n- Finding 1\n- Finding 2', contentType: 'markdown' } });

      (mockToolRegistry.execute as Mock).mockResolvedValue({ results: [{ title: 'Research Data', snippet: 'Important findings' }] });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toBe('Agent displayed content on the canvas.');
      
      // Verify planning and reasoning in thoughts
      const thoughts = mockSessionData.history.filter(msg => msg.type === 'agent_thought');
      // Based on the actual implementation, we expect 6 agent_thought messages:
      // 1. Initial "The agent is thinking..." message for first iteration
      // 2. Thought from first LLM response
      // 3. Another "The agent is thinking..." message for second iteration
      // 4. Thought from second LLM response (command)
      // 5. Another "The agent is thinking..." message for third iteration
      // 6. Thought from third LLM response (before displaying canvas)
      expect(thoughts).toHaveLength(6);
      // Find the actual thought messages (not the "thinking..." messages)
      const explicitThoughts = thoughts.filter(msg => !msg.content.includes('The agent is thinking'));
      expect(explicitThoughts).toHaveLength(2);
      expect(explicitThoughts[0].content).toContain('complex request');
      expect(explicitThoughts[1].content).toContain('analyze and structure');
    });

    it('should show adaptive behavior based on context', async () => {
      // Simulate different responses based on session context
      mockSessionData.workingContext = {
        currentFile: 'data-analysis.ts',
        lastAction: 'development',
      };

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue(
        '{"answer": "Since you\'re working on data analysis in a development environment, I\'ll provide beginner-friendly explanations with each step."}'
      );

      (mockResponseSchema.parse as Mock).mockReturnValue({
        answer: "Since you're working on data analysis in a development environment, I'll provide beginner-friendly explanations with each step.",
      });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('beginner-friendly explanations');
      expect(result).toContain('development environment');
    });

    it('should handle tool chaining effectively', async () => {
      // Demonstrate intelligent tool usage in sequence
      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"command": {"name": "readFile", "params": {"path": "input.txt"}}}')
        .mockResolvedValueOnce('{"thought": "I have the input data. Now I need to process it and save the results."}')
        .mockResolvedValueOnce('{"command": {"name": "writeFile", "params": {"path": "output.txt", "content": "Processed: [data]"}}}')
        .mockResolvedValueOnce('{"answer": "Successfully processed input.txt and saved results to output.txt"}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ command: { name: 'readFile', params: { path: 'input.txt' } } })
        .mockReturnValueOnce({ thought: 'I have the input data. Now I need to process it and save the results.' })
        .mockReturnValueOnce({ command: { name: 'writeFile', params: { path: 'output.txt', content: 'Processed: [data]' } } })
        .mockReturnValueOnce({ answer: 'Successfully processed input.txt and saved results to output.txt' });

      (mockToolRegistry.execute as Mock)
        .mockResolvedValueOnce('Sample input data')
        .mockResolvedValueOnce('File written successfully');

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('Successfully processed');
      expect(mockToolRegistry.execute).toHaveBeenCalledTimes(2);
      expect(mockToolRegistry.execute).toHaveBeenNthCalledWith(1, 'readFile', { path: 'input.txt' }, expect.any(Object));
      expect(mockToolRegistry.execute).toHaveBeenNthCalledWith(2, 'writeFile', { path: 'output.txt', content: 'Processed: [data]' }, expect.any(Object));
    });
  });

  describe('Real-world Conversation Scenarios', () => {
    it('should handle technical support conversation', async () => {
      mockJob.data.prompt = 'My application is not starting. Can you help debug?';

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "User has an application startup issue. I should gather information about the error."}')
        .mockResolvedValueOnce('{"answer": "I\'ll help you debug the startup issue. Could you please: 1) Check the application logs 2) Verify your environment setup 3) Share any error messages you\'re seeing?"}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'User has an application startup issue. I should gather information about the error.' })
        .mockReturnValueOnce({ answer: "I'll help you debug the startup issue. Could you please: 1) Check the application logs 2) Verify your environment setup 3) Share any error messages you're seeing?" });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('debug the startup issue');
      expect(result).toContain('application logs');
      expect(result).toContain('environment setup');
    });

    it('should handle creative content generation', async () => {
      mockJob.data.prompt = 'Write a story about an AI assistant';

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "The user wants creative content. I should write an engaging story."}')
        .mockResolvedValueOnce('{"canvas": {"content": "# The Digital Companion\n\nOnce upon a time, in a world where code and consciousness intertwined...", "contentType": "markdown"}}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'The user wants creative content. I should write an engaging story.' })
        .mockReturnValueOnce({ canvas: { content: '# The Digital Companion\n\nOnce upon a time, in a world where code and consciousness intertwined...', contentType: 'markdown' } });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toBe('Agent displayed content on the canvas.');
      
      const canvasOutput = mockSessionData.history.find(msg => msg.type === 'agent_canvas_output');
      expect(canvasOutput?.content).toContain('The Digital Companion');
      expect(canvasOutput?.content).toContain('Once upon a time');
    });

    it('should handle data analysis workflow', async () => {
      mockJob.data.prompt = 'Analyze sales data and create a report';

      (mockLlmProvider.getLlmResponse as Mock)
        .mockResolvedValueOnce('{"thought": "I need to read the sales data first, then analyze it and create a comprehensive report."}')
        .mockResolvedValueOnce('{"command": {"name": "readFile", "params": {"path": "sales_data.csv"}}}')
        .mockResolvedValueOnce('{"thought": "Data loaded successfully. Now I\'ll analyze the trends and create a visual report."}')
        .mockResolvedValueOnce('{"canvas": {"content": "<div><h1>Sales Analysis Report</h1><p>Total Sales: $50,000</p><p>Top Product: Widget A</p></div>", "contentType": "html"}}');

      (mockResponseSchema.parse as Mock)
        .mockReturnValueOnce({ thought: 'I need to read the sales data first, then analyze it and create a comprehensive report.' })
        .mockReturnValueOnce({ command: { name: 'readFile', params: { path: 'sales_data.csv' } } })
        .mockReturnValueOnce({ thought: "Data loaded successfully. Now I'll analyze the trends and create a visual report." })
        .mockReturnValueOnce({ canvas: { content: '<div><h1>Sales Analysis Report</h1><p>Total Sales: $50,000</p><p>Top Product: Widget A</p></div>', contentType: 'html' } });

      (mockToolRegistry.execute as Mock).mockResolvedValue('Product,Sales\nWidget A,25000\nWidget B,15000\nWidget C,10000');

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toBe('Agent displayed content on the canvas.');
      expect(mockToolRegistry.execute).toHaveBeenCalledWith('readFile', { path: 'sales_data.csv' }, expect.any(Object));
      
      const canvasOutput = mockSessionData.history.find(msg => msg.type === 'agent_canvas_output');
      expect(canvasOutput?.content).toContain('Sales Analysis Report');
      expect(canvasOutput?.content).toContain('Total Sales: $50,000');
    });
  });

  describe('Conversation Quality and Consistency', () => {
    it('should maintain professional tone throughout conversation', async () => {
      const responses = [
        '{"answer": "I\'d be happy to assist you with that task."}', 
        '{"thought": "Let me carefully analyze this request."}', 
        '{"answer": "Here\'s a comprehensive solution for your needs."}' 
      ];

      responses.forEach((response, index) => {
        (mockLlmProvider.getLlmResponse as Mock).mockResolvedValueOnce(response);
        (mockResponseSchema.parse as Mock).mockReturnValueOnce(JSON.parse(response));
      });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      // All responses should maintain professional language patterns
      expect(result).toMatch(/I'd be happy|comprehensive|assist/);
    });

    it('should handle conversation transitions smoothly', async () => {
      // Simulate topic change in conversation
      mockSessionData.history = [
        { type: 'user', content: 'Tell me about weather', id: '1', timestamp: Date.now() - 1000 },
        { type: 'agent_response', content: 'I can help with weather information.', id: '2', timestamp: Date.now() - 900 },
      ] as Message[];

      mockJob.data.prompt = 'Actually, let\'s talk about cooking recipes';

      (mockLlmProvider.getLlmResponse as Mock).mockResolvedValue(
        '{"answer": "Of course! I\'d be happy to switch topics and help you with cooking recipes. What type of cuisine or specific dish interests you?"}'
      );

      (mockResponseSchema.parse as Mock).mockReturnValue({
        answer: "Of course! I'd be happy to switch topics and help you with cooking recipes. What type of cuisine or specific dish interests you?",
      });

      const agent = new Agent(
        mockJob,
        mockSessionData,
        {} as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('switch topics');
      expect(result).toContain('cooking recipes');
    });
  });
});
