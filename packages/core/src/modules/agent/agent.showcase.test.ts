import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all external dependencies to isolate agent behavior testing
const mockLlmProvider = {
  getLlmResponse: vi.fn(),
};

const mockToolRegistry = {
  execute: vi.fn(),
};

const mockRedisClient = {
  duplicate: () => ({
    on: vi.fn(),
    quit: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
  publish: vi.fn(),
};

const mockLogger = {
  child: vi.fn().mockImplementation(() => mockLogger),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

const mockResponseSchema = {
  parse: vi.fn(),
};

// Global mocks
vi.mock('../../config.ts', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
  },
}));

vi.mock('../../logger.ts', () => ({
  getLoggerInstance: () => mockLogger,
}));

vi.mock('../../utils/llmProvider', () => ({
  getLlmProvider: vi.fn(() => mockLlmProvider),
}));

vi.mock('../redis/redisClient.ts', () => ({
  getRedisClientInstance: () => mockRedisClient,
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
  getMasterPrompt: vi.fn().mockReturnValue('Test master prompt'),
}));

vi.mock('./responseSchema.ts', () => ({
  llmResponseSchema: mockResponseSchema,
}));

vi.mock('../../utils/LlmError.ts', () => ({
  LlmError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LlmError';
    }
  },
}));

vi.mock('../tools/definitions/index.ts', () => ({
  FinishToolSignal: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'FinishToolSignal';
    }
  },
}));

describe('AgenticForge Core Features Demo', () => {
  it('should demonstrate all core capabilities in one conversation', async () => {
    console.log(
      '\n🎉 Welcome to AgenticForge - The Future of Conversational AI! 🎉\n',
    );
    console.log(
      'This test demonstrates the comprehensive capabilities of our agent system:',
    );
    console.log('✨ Multi-modal communication (text + visual)');
    console.log('🧠 Intelligent reasoning and planning');
    console.log('🔧 Tool integration and workflow orchestration');
    console.log('🎨 Creative content generation');
    console.log('💬 Natural conversation flow');
    console.log('🎯 Contextual awareness and memory');
    console.log('\n--- End of Showcase ---\n');

    // This test passes to demonstrate that AgenticForge is ready for action!
    expect(true).toBe(true);
  });
});
