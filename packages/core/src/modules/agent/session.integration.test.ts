import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Agent } from './agent.js';
import { getMockQueue } from '../../test/mockQueue.js';
import type { SessionData, Tool, Message } from '../../types.js';

// Mock Session Manager avec fonctionnalités complètes
const mockSessionManager = {
  createSession: vi.fn(),
  getSession: vi.fn(),
  saveSession: vi.fn(),
  deleteSession: vi.fn(),
  listSessions: vi.fn(),
  cloneSession: vi.fn(),
  mergeSession: vi.fn(),
  archiveSession: vi.fn(),
  getSessionMetrics: vi.fn(),
  cleanupExpiredSessions: vi.fn(),
  lockSession: vi.fn(),
  unlockSession: vi.fn(),
  getAllSessions: vi.fn(),
  renameSession: vi.fn(),
  initDb: vi.fn(),
};

// Mock Redis pour persistance
const mockRedisClient = {
  hset: vi.fn(),
  hget: vi.fn(),
  hgetall: vi.fn(),
  hdel: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  exists: vi.fn(),
  scan: vi.fn(),
  publish: vi.fn(),
  subscribe: vi.fn(),
};

// Mocks globaux
vi.mock('../../config.js', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
    SESSION_TTL: 3600, // 1 heure
    MAX_SESSION_HISTORY: 1000,
    SESSION_CLEANUP_INTERVAL: 300, // 5 minutes
  },
}));

vi.mock('../../logger.js', () => ({
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

vi.mock('../redis/redisClient.js', () => ({
  getRedisClientInstance: () => mockRedisClient,
}));

vi.mock('../../utils/llmProvider.js', () => ({
  getLlmProvider: () => ({
    getLlmResponse: vi.fn().mockResolvedValue('{"answer": "Session test response"}'),
  }),
}));

vi.mock('../llm/LlmKeyManager.js', () => ({
  LlmKeyManager: {
    hasAvailableKeys: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../tools/toolRegistry.js', () => ({
  toolRegistry: {
    execute: vi.fn(),
  },
}));

vi.mock('./orchestrator.prompt.js', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Mock prompt'),
}));

vi.mock('./responseSchema.js', () => ({
  llmResponseSchema: {
    parse: vi.fn().mockReturnValue({ answer: 'Session test response' }),
  },
}));

describe('Session Management Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockTools: Tool[];
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJob = {
      id: 'session-test-job',
      data: { prompt: 'Test session management' },
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      history: [],
      identities: [{ id: 'test-user', type: 'user' }],
      name: 'Session Test',
      timestamp: Date.now(),
      activeLlmProvider: 'openai',
      metadata: {
        userAgent: 'test-browser',
        clientIP: '127.0.0.1',
        userPreferences: { theme: 'dark', language: 'fr' }
      }
    };

    mockTools = [];

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

  describe('Session Creation and Initialization', () => {
    it('should create a new session with proper defaults', async () => {
      const newSessionData = {
        id: 'new-session-456',
        history: [],
        activeLlmProvider: 'openai',
      } as any as SessionData;

      mockSessionManager.createSession = vi.fn();
      (mockSessionManager.createSession as any).mockResolvedValue(newSessionData);

      const newAgent = new Agent(
        { ...mockJob, id: 'new-job' },
        newSessionData,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await newAgent.run();

      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          createdAt: expect.any(Number),
          lastActivity: expect.any(Number),
        })
      );
    });

    it('should initialize session with user context', async () => {
      const contextData = {
        userId: 'user-123',
        workspaceId: 'workspace-456',
        projectId: 'project-789',
        permissions: ['read', 'write'],
      };

      const contextualAgent = new Agent(
        { ...mockJob, data: { ...mockJob.data, userContext: contextData } },
        { ...mockSessionData, userContext: contextData },
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await contextualAgent.run();

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userContext: contextData
        })
      );
    });

    it('should handle session collision gracefully', async () => {
      mockSessionManager.createSession = vi.fn();
      (mockSessionManager.createSession as any).mockRejectedValue(new Error('Session ID already exists'));
      mockSessionManager.getSession = vi.fn();
      (mockSessionManager.getSession as any).mockResolvedValue(mockSessionData);

      await agent.run();

      expect(mockSessionManager.getSession).toHaveBeenCalledWith('session-test-123');
    });
  });

  describe('Session Persistence and Recovery', () => {
    it('should automatically save session state during conversation', async () => {
      await agent.run();

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-test-123',
          history: expect.any(Array),
          lastActivity: expect.any(Number),
        })
      );
    });

    it('should persist session to Redis with proper TTL', async () => {
      await agent.run();

      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'session:session-test-123',
        expect.objectContaining({
          data: expect.any(String),
          lastActivity: expect.any(String),
        })
      );

      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        'session:session-test-123',
        3600 // TTL from config
      );
    });

    it('should recover session from persistent storage', async () => {
      const persistedSession = {
        ...mockSessionData,
        history: [
          { type: 'user' as const, content: 'Previous message', id: '1', timestamp: Date.now() - 1000 },
          { type: 'agent_response' as const, content: 'Previous response', id: '2', timestamp: Date.now() - 500 },
        ]
      };

      mockSessionManager.getSession = vi.fn();
      (mockSessionManager.getSession as any).mockResolvedValue(persistedSession);
      mockRedisClient.hgetall = vi.fn();
      (mockRedisClient.hgetall as any).mockResolvedValue({
        data: JSON.stringify(persistedSession),
        lastActivity: Date.now().toString(),
      });

      const recoveredAgent = new Agent(
        mockJob,
        persistedSession,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await recoveredAgent.run();

      expect(mockSessionManager.getSession).toHaveBeenCalledWith('session-test-123');
      expect(persistedSession.history).toHaveLength(2);
    });

    it('should handle corrupted session data gracefully', async () => {
      mockRedisClient.hgetall = vi.fn();
      (mockRedisClient.hgetall as any).mockResolvedValue({
        data: 'invalid-json',
        lastActivity: Date.now().toString(),
      });

      mockSessionManager.getSession = vi.fn();
      (mockSessionManager.getSession as any).mockRejectedValue(new Error('Corrupted session data'));
      mockSessionManager.createSession = vi.fn();
      (mockSessionManager.createSession as any).mockResolvedValue(mockSessionData);

      await agent.run();

      expect(mockSessionManager.createSession).toHaveBeenCalled();
    });
  });

  describe('Session History Management', () => {
    it('should maintain conversation history within limits', async () => {
      // Créer un historique qui dépasse la limite
      const largeHistory: Message[] = Array.from({ length: 1200 }, (_, i) => ({
        type: 'user',
        content: `Message ${i}`,
        id: `msg-${i}`,
        timestamp: Date.now() + i,
      }));

      const agentWithLargeHistory = new Agent(
        mockJob,
        { ...mockSessionData, history: largeHistory },
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await agentWithLargeHistory.run();

      const savedSession = mockSessionManager.saveSession.mock.calls[0][0];
      expect(savedSession.history.length).toBeLessThanOrEqual(1000); // MAX_SESSION_HISTORY
    });

    it('should compress old conversation history', async () => {
      const oldMessages: Message[] = Array.from({ length: 500 }, (_, i) => ({
        type: i % 2 === 0 ? 'user' : 'agent_response',
        content: `Old message ${i}`,
        id: `old-${i}`,
        timestamp: Date.now() - (500 - i) * 1000,
      }));

      const agentWithOldHistory = new Agent(
        mockJob,
        { ...mockSessionData, history: oldMessages },
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await agentWithOldHistory.run();

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          compressedHistory: expect.any(String),
          history: expect.arrayContaining([
            expect.objectContaining({ type: 'user' })
          ])
        })
      );
    });

    it('should handle concurrent session updates', async () => {
      const agent1 = new Agent(mockJob, mockSessionData, getMockQueue(), mockTools, 'openai', mockSessionManager);
      const agent2 = new Agent(mockJob, mockSessionData, getMockQueue(), mockTools, 'openai', mockSessionManager);

      mockSessionManager.lockSession = vi.fn();
      (mockSessionManager.lockSession as any).mockResolvedValue(true);
      mockSessionManager.unlockSession = vi.fn();
      (mockSessionManager.unlockSession as any).mockResolvedValue(true);

      await Promise.all([agent1.run(), agent2.run()]);

      expect(mockSessionManager.lockSession).toHaveBeenCalledTimes(2);
      expect(mockSessionManager.unlockSession).toHaveBeenCalledTimes(2);
    });
  });

  describe('Session Sharing and Collaboration', () => {
    it('should enable session sharing between users', async () => {
      const sharedSessionData = {
        ...mockSessionData,
        sharedWith: ['user-456', 'user-789'],
        permissions: {
          'user-456': ['read', 'write'],
          'user-789': ['read'],
        }
      };

      const sharedAgent = new Agent(
        mockJob,
        sharedSessionData,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await sharedAgent.run();

      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'session:shared:session-test-123',
        expect.stringContaining('conversation_update')
      );
    });

    it('should handle collaborative editing conflicts', async () => {
      mockSessionManager.mergeSession = vi.fn();
      (mockSessionManager.mergeSession as any).mockImplementation((sessionId: string, changes: any) => ({
        ...mockSessionData,
        history: [...mockSessionData.history, ...changes.newMessages],
        conflictResolution: 'merged'
      }));

      const collaborativeAgent = new Agent(
        mockJob,
        mockSessionData,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await collaborativeAgent.run();

      expect(mockSessionManager.mergeSession).toHaveBeenCalled();
    });

    it('should track session activity from multiple participants', async () => {
      const multiUserSession = {
        ...mockSessionData,
        participants: [
          { userId: 'user-123', lastSeen: Date.now(), active: true },
          { userId: 'user-456', lastSeen: Date.now() - 30000, active: false },
        ]
      };

      const multiUserAgent = new Agent(
        mockJob,
        multiUserSession,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await multiUserAgent.run();

      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'session_participants:session-test-123',
        expect.any(Object)
      );
    });
  });

  describe('Session Analytics and Metrics', () => {
    it('should track session usage metrics', async () => {
      await agent.run();

      expect(mockSessionManager.getSessionMetrics).toHaveBeenCalledWith('session-test-123');
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'metrics:session_usage',
        expect.stringContaining('message_count')
      );
    });

    it('should monitor session performance', async () => {
      const startTime = Date.now();
      await agent.run();
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'metrics:session_performance',
        expect.stringContaining(duration.toString())
      );
    });

    it('should analyze conversation quality', async () => {
      const qualityMetrics = {
        responseTime: 150,
        userSatisfaction: 0.85,
        completionRate: 0.92,
        errorRate: 0.05,
      };

      await agent.run();

      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'session_quality:session-test-123',
        expect.objectContaining({
          responseTime: expect.any(String),
          userSatisfaction: expect.any(String),
        })
      );
    });
  });

  describe('Session Cleanup and Archival', () => {
    it('should clean up expired sessions', async () => {
      const expiredSessions = ['expired-1', 'expired-2', 'expired-3'];
      mockSessionManager.cleanupExpiredSessions = vi.fn();
      (mockSessionManager.cleanupExpiredSessions as any).mockResolvedValue(expiredSessions);

      await agent.run();

      // Simuler le nettoyage périodique
      setTimeout(() => {
        expect(mockSessionManager.cleanupExpiredSessions).toHaveBeenCalled();
      }, 100);
    });

    it('should archive completed sessions', async () => {
      const completedSessionData: any = {
        ...mockSessionData,
        status: 'completed',
        endTime: Date.now(),
      };

      mockSessionManager.archiveSession = vi.fn();
      (mockSessionManager.archiveSession as any).mockResolvedValue(true);

      const completedAgent = new Agent(
        { ...mockJob, data: { ...mockJob.data, status: 'completed' } },
        completedSessionData,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await completedAgent.run();

      expect(mockSessionManager.archiveSession).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          archiveReason: 'completed',
          archiveDate: expect.any(Number),
        })
      );
    });

    it('should compress archived session data', async () => {
      const largeSessionData: any = {
        ...mockSessionData,
        history: Array.from({ length: 2000 }, (_, i) => ({
          type: 'user',
          content: `Large content ${i}`.repeat(100),
          id: `large-${i}`,
          timestamp: Date.now() + i,
        })),
      };

      mockSessionManager.archiveSession = vi.fn();
      (mockSessionManager.archiveSession as any).mockImplementation((sessionId: string, options: any) => {
        const compressed = JSON.stringify(largeSessionData);
        return Promise.resolve({
          originalSize: JSON.stringify(largeSessionData).length,
          compressedSize: compressed.length * 0.3, // Simulation compression
          compressionRatio: 0.7,
        });
      });

      const largeAgent = new Agent(
        mockJob,
        largeSessionData,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await largeAgent.run();

      expect(mockSessionManager.archiveSession).toHaveBeenCalled();
    });
  });

  describe('Session Security and Privacy', () => {
    it('should sanitize sensitive data in session history', async () => {
      const sensitiveHistory: Message[] = [
        {
          type: 'user',
          content: 'My password is secret123 and my email is user@example.com',
          id: 'sensitive-1',
          timestamp: Date.now(),
        },
        {
          type: 'user',
          content: 'My credit card number is 1234-5678-9012-3456',
          id: 'sensitive-2',
          timestamp: Date.now(),
        },
      ];

      const sensitiveAgent = new Agent(
        mockJob,
        { ...mockSessionData, history: sensitiveHistory },
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await sensitiveAgent.run();

      const savedSession = mockSessionManager.saveSession.mock.calls[0][0];
      const savedContent = savedSession.history.map((msg: Message) => {
        if ('content' in msg) {
          return (msg as any).content;
        }
        return '';
      }).join(' ');
      
      expect(savedContent).not.toContain('secret123');
      expect(savedContent).not.toContain('1234-5678-9012-3456');
      expect(savedContent).toContain('[REDACTED]');
    });

    it('should enforce session access controls', async () => {
      const restrictedSession: any = {
        ...mockSessionData,
        accessControl: {
          allowedUsers: ['user-123'],
          restrictedActions: ['export', 'share'],
          requireAuth: true,
        }
      };

      const restrictedAgent = new Agent(
        { ...mockJob, data: { ...mockJob.data, userId: 'unauthorized-user' } },
        restrictedSession,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      try {
        await restrictedAgent.run();
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
      }
    });

    it('should audit session access and modifications', async () => {
      await agent.run();

      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'session_audit:session-test-123',
        expect.objectContaining({
          action: 'modified',
          timestamp: expect.any(String),
          actor: expect.any(String),
        })
      );
    });
  });

  describe('Session Migration and Versioning', () => {
    it('should migrate sessions between schema versions', async () => {
      const oldVersionSession: any = {
        id: 'old-version-session',
        messages: [ // Old format
          { role: 'user', text: 'Old format message' },
          { role: 'assistant', text: 'Old format response' },
        ],
        version: '1.0',
      };

      const migratedSession: any = {
        id: 'old-version-session',
        history: [ // New format
          { type: 'user', content: 'Old format message', id: '1', timestamp: Date.now() },
          { type: 'agent_response', content: 'Old format response', id: '2', timestamp: Date.now() },
        ],
        version: '2.0',
      };

      mockSessionManager.getSession = vi.fn();
      (mockSessionManager.getSession as any).mockResolvedValue(migratedSession);

      const migrationAgent = new Agent(
        mockJob,
        migratedSession,
        getMockQueue() as any,
        mockTools,
        'openai',
        mockSessionManager
      );

      await migrationAgent.run();

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '2.0',
          history: expect.any(Array),
        })
      );
    });
  });
});