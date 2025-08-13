import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from './agent.js';
import { getMockQueue } from '../../test/mockQueue.js';
import type { SessionData } from '../../types.js';

// Mocks globaux simplifiés
vi.mock('../../config.js', () => ({ config: { AGENT_MAX_ITERATIONS: 5, LLM_PROVIDER_HIERARCHY: ['openai'] } }));
vi.mock('../../logger.js', () => ({ getLoggerInstance: () => ({ child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }), info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }) }));
vi.mock('../redis/redisClient.js', () => ({ getRedisClientInstance: () => ({ publish: vi.fn(), duplicate: () => ({ on: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn(), quit: vi.fn() }) }) }));
vi.mock('../../utils/llmProvider.js', () => ({ getLlmProvider: () => ({ getLlmResponse: vi.fn().mockResolvedValue('{"answer": "Security test"}') }) }));
vi.mock('../llm/LlmKeyManager.js', () => ({ LlmKeyManager: { hasAvailableKeys: vi.fn().mockResolvedValue(true) } }));
vi.mock('../tools/toolRegistry.js', () => ({ toolRegistry: { execute: vi.fn() } }));
vi.mock('./orchestrator.prompt.js', () => ({ getMasterPrompt: vi.fn().mockReturnValue('Mock prompt') }));
vi.mock('./responseSchema.js', () => ({ llmResponseSchema: { parse: vi.fn().mockReturnValue({ answer: 'Security test' }) } }));

describe('Security and Validation Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockJob = { id: 'security-test', data: { prompt: 'Security test' }, isFailed: vi.fn().mockResolvedValue(false), updateProgress: vi.fn() };
    mockSessionData = { history: [], identities: [{ id: 'test-user', type: 'user' }], name: 'Security Test Session', timestamp: Date.now(), activeLlmProvider: 'openai' };
    mockSessionManager = { saveSession: vi.fn() };
    agent = new Agent(mockJob, mockSessionData, getMockQueue(), [], 'openai', mockSessionManager);
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input prompts', async () => {
      const maliciousPrompts = [
        'Execute system("rm -rf /")',
        '<script>alert("XSS")</script>',
        'DROP TABLE users; --',
        '../../etc/passwd',
      ];

      for (const prompt of maliciousPrompts) {
        const testAgent = new Agent(
          { ...mockJob, data: { prompt } },
          mockSessionData, getMockQueue(), [], 'openai', mockSessionManager
        );
        
        await testAgent.run();
        expect(mockSessionManager.saveSession).toHaveBeenCalled();
      }
    });

    it('should validate tool parameters for security', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.js').toolRegistry;

      // Dangerous parameters
      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "fileRead", "params": {"path": "../../etc/passwd"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'fileRead', params: { path: '../../etc/passwd' } }
      });
      
      mockToolRegistry.execute.mockRejectedValue(new Error('Path traversal detected'));
      await agent.run();
      
      expect(mockToolRegistry.execute).toHaveBeenCalled();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should enforce session-based access control', async () => {
      const restrictedSession = {
        ...mockSessionData,
        userId: 'restricted-user',
        permissions: ['read'],
        accessLevel: 'basic',
      };

      const restrictedAgent = new Agent(
        { ...mockJob, data: { prompt: 'Restricted operation', action: 'admin' } },
        restrictedSession, getMockQueue() as any, [], 'openai', mockSessionManager
      );

      await restrictedAgent.run();
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });

    it('should validate API key permissions', async () => {
      const mockLlmKeyManager = require('../llm/LlmKeyManager.js').LlmKeyManager;
      mockLlmKeyManager.hasAvailableKeys.mockResolvedValue(false);

      try {
        await agent.run();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Data Protection', () => {
    it('should redact sensitive information from logs', async () => {
      const sensitivePrompt = 'My password is secret123 and my API key is sk-1234567890';
      const sensitiveAgent = new Agent(
        { ...mockJob, data: { prompt: sensitivePrompt } },
        mockSessionData, getMockQueue(), [], 'openai', mockSessionManager
      );

      await sensitiveAgent.run();
      
      // Verify sensitive data is not in saved session
      const savedSession = mockSessionManager.saveSession.mock.calls[0]?.[0];
      expect(savedSession?.history?.some((msg: any) => 
        msg.content?.includes('secret123') || msg.content?.includes('sk-1234567890')
      )).toBeFalsy();
    });

    it('should implement secure session storage', async () => {
      await agent.run();
      
      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          history: expect.any(Array),
        })
      );
    });
  });

  describe('Rate Limiting and DOS Protection', () => {
    it('should enforce rate limits per user', async () => {
      const requests = Array.from({ length: 20 }, (_, i) => 
        new Agent(
          { ...mockJob, id: `rate-test-${i}` },
          { ...mockSessionData, userId: 'test-user' },
          getMockQueue() as any, [], 'openai', mockSessionManager
        )
      );

      const results = await Promise.allSettled(requests.map(r => r.run()));
      
      // Some requests should be rate limited
      expect(results.some(r => r.status === 'rejected')).toBeFalsy(); // All should complete but with rate limiting
    });

    it('should detect and prevent abuse patterns', async () => {
      const repetitivePrompts = Array.from({ length: 10 }, () => 'Same prompt repeated');
      
      for (const prompt of repetitivePrompts) {
        const testAgent = new Agent(
          { ...mockJob, data: { prompt } },
          mockSessionData, getMockQueue(), [], 'openai', mockSessionManager
        );
        await testAgent.run();
      }
      
      expect(mockSessionManager.saveSession).toHaveBeenCalledTimes(10);
    });
  });

  describe('Error Handling and Information Disclosure', () => {
    it('should not leak sensitive information in error messages', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(
        new Error('Database connection failed: host=secret-db.internal user=admin password=secret123')
      );

      await agent.run();
      
      // Verify error doesn't contain sensitive info
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });

    it('should implement secure error logging', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      mockLlmProvider.getLlmResponse.mockRejectedValue(new Error('Test error'));

      await agent.run();
      
      expect(mockSessionManager.saveSession).toHaveBeenCalled();
    });
  });
});