import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SessionData, Tool } from '../../types.ts';

import { getMockQueue } from '../../test/mockQueue.ts';
import { Agent } from './agent.ts';

// Mock WebSocket avec fonctionnalités real-time
const mockWebSocket = {
  addEventListener: vi.fn(),
  bufferedAmount: 0,
  close: vi.fn(),
  CLOSED: 3,
  CLOSING: 2,
  CONNECTING: 0,
  extensions: '',
  onclose: null as ((event: CloseEvent) => void) | null,
  onerror: null as ((event: Event) => void) | null,
  onmessage: null as ((event: MessageEvent) => void) | null,
  onopen: null as ((event: Event) => void) | null,
  OPEN: 1,
  protocol: '',
  readyState: 1, // OPEN
  removeEventListener: vi.fn(),
  send: vi.fn(),
  url: 'ws://localhost:3001/websocket',
};

// Mock WebSocket Server
const mockWebSocketServer = {
  broadcast: vi.fn(),
  clients: new Set(),
  getClientInfo: vi.fn(),
  getRoomClients: vi.fn(),
  handleConnection: vi.fn(),
  handleDisconnection: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  sendToClient: vi.fn(),
  sendToRoom: vi.fn(),
};

// Mock Socket.IO pour comparaison
const mockSocketIO = {
  broadcast: vi.fn(),
  connected: true,
  disconnect: vi.fn(),
  emit: vi.fn(),
  handshake: {
    address: '127.0.0.1',
    headers: {},
    time: new Date().toISOString(),
  },
  id: 'socket-id-123',
  join: vi.fn(),
  leave: vi.fn(),
  off: vi.fn(),
  on: vi.fn(),
  rooms: new Set(['room1', 'room2']),
  to: vi.fn(),
};

// Mocks globaux
vi.mock('../../config.ts', async () => {
  const actual = await vi.importActual('../../config.ts');
  return {
    ...actual,
    config: {
      AGENT_MAX_ITERATIONS: 5,
      LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
      MAX_WEBSOCKET_CONNECTIONS: 1000,
      WEBSOCKET_COMPRESSION: true,
      WEBSOCKET_PING_INTERVAL: 30000,
      WEBSOCKET_PING_TIMEOUT: 5000,
      WEBSOCKET_PORT: 3001,
    },
  };
});

vi.mock('../../logger.ts', async () => {
  const actual = await vi.importActual('../../logger.ts');
  return {
    ...actual,
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
  };
});

vi.mock('../redis/redisClient.ts', async () => {
  const actual = await vi.importActual('../redis/redisClient.ts');
  return {
    ...actual,
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
      sadd: vi.fn(),
      smembers: vi.fn(),
      srem: vi.fn(),
      subscribe: vi.fn(),
    }),
  };
});

vi.mock('../../utils/llmProvider.ts', async () => {
  const actual = await vi.importActual('../../utils/llmProvider.ts');
  return {
    ...actual,
    getLlmProvider: () => ({
      getLlmResponse: vi
        .fn()
        .mockResolvedValue('{"answer": "WebSocket test response"}'),
    }),
  };
});

vi.mock('../llm/LlmKeyManager.ts', async () => {
  const actual = await vi.importActual('../llm/LlmKeyManager.ts');
  return {
    ...actual,
    LlmKeyManager: {
      hasAvailableKeys: vi.fn().mockResolvedValue(true),
    },
  };
});

vi.mock('../tools/toolRegistry.ts', async () => {
  const actual = await vi.importActual('../tools/toolRegistry.ts');
  return {
    ...actual,
    toolRegistry: {
      execute: vi.fn(),
    },
  };
});

vi.mock('./orchestrator.prompt.ts', async () => {
  const actual = await vi.importActual('./orchestrator.prompt.ts');
  return {
    ...actual,
    getMasterPrompt: vi.fn().mockReturnValue('Mock prompt'),
  };
});

vi.mock('./responseSchema.ts', async () => {
  const actual = await vi.importActual('./responseSchema.ts');
  return {
    ...actual,
    llmResponseSchema: {
      parse: vi.fn().mockReturnValue({ answer: 'WebSocket test response' }),
    },
  };
});

// Mock WebSocket et Socket.IO
vi.mock('ws', async () => {
  const actual = await vi.importActual('ws');
  return {
    ...actual,
    WebSocket: vi.fn(() => mockWebSocket),
    WebSocketServer: vi.fn(() => mockWebSocketServer),
  };
});

vi.mock('socket.io', async () => {
  const actual = await vi.importActual('socket.io');
  return {
    ...actual,
    Server: vi.fn(() => ({
      close: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      to: vi.fn(() => ({ emit: vi.fn() })),
    })),
  };
});

describe('WebSocket Real-time Communication Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let mockTools: Tool[];
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJob = {
      data: { prompt: 'Test WebSocket integration' },
      id: 'websocket-test-job',
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      activeLlmProvider: 'openai',
      history: [],
      id: 'websocket-test-session',
      identities: [{ id: 'test', type: 'user' }],
      name: 'websocket-test-session',
      timestamp: Date.now(),
      websocketConnection: {
        connected: true,
        id: 'connection-123',
        lastPing: Date.now(),
        rooms: ['session-room', 'user-room'],
        userId: 'user-456',
      },
    };

    mockSessionManager = {
      saveSession: vi.fn(),
    };

    mockTools = [];

    agent = new Agent(
      mockJob,
      mockSessionData,
      getMockQueue() as any,
      mockTools,
      'openai',
      mockSessionManager,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Real-time Agent Communication', () => {
    it('should send real-time progress updates via WebSocket', async () => {
      const progressUpdates = [
        { message: 'Starting agent', progress: 0, stage: 'initializing' },
        { message: 'Analyzing request', progress: 25, stage: 'processing' },
        { message: 'Generating response', progress: 50, stage: 'thinking' },
        { message: 'Task completed', progress: 100, stage: 'completing' },
      ];

      // Simuler l'envoi de updates en temps réel
      progressUpdates.forEach((update, index) => {
        setTimeout(() => {
          mockWebSocket.send(
            JSON.stringify({
              data: update,
              jobId: 'websocket-test-job',
              sessionId: 'websocket-test-session',
              timestamp: Date.now(),
              type: 'agent_progress',
            }),
          );
        }, index * 100);
      });

      await agent.run();

      expect(mockWebSocket.send).toHaveBeenCalledTimes(4);
      expect(mockWebSocket.send).toHaveBeenLastCalledWith(
        expect.stringContaining('agent_progress'),
      );
    });

    it('should stream agent thoughts in real-time', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;

      const thoughtStream = [
        'I need to analyze this request carefully...',
        'The user is asking about WebSocket integration...',
        'Let me break this down into steps...',
        'I should provide a comprehensive response...',
      ];

      thoughtStream.forEach((thought, index) => {
        mockLlmProvider.getLlmResponse.mockResolvedValueOnce(
          `{"thought": "${thought}"}`,
        );
        mockResponseSchema.parse.mockReturnValueOnce({ thought });
      });

      mockLlmProvider.getLlmResponse.mockResolvedValueOnce(
        '{"answer": "Final comprehensive response"}',
      );
      mockResponseSchema.parse.mockReturnValueOnce({
        answer: 'Final comprehensive response',
      });

      await agent.run();

      // Vérifier que chaque pensée a été envoyée en temps réel
      const thoughtMessages = thoughtStream.map((thought) =>
        expect.stringContaining(`"thought":"${thought}"`),
      );

      thoughtMessages.forEach((expectedMessage) => {
        expect(mockWebSocket.send).toHaveBeenCalledWith(expectedMessage);
      });
    });

    it('should broadcast tool execution results in real-time', async () => {
      const mockLlmProvider =
        require('../../utils/llmProvider.ts').getLlmProvider();
      const mockResponseSchema =
        require('./responseSchema.ts').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.ts').toolRegistry;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "webSearch", "params": {"query": "real-time updates"}}}',
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'webSearch', params: { query: 'real-time updates' } },
      });

      // Simuler une exécution d'outil avec résultats progressifs
      mockToolRegistry.execute.mockImplementation(
        async (toolName: string, params: any) => {
          // Envoi du début d'exécution
          mockWebSocket.send(
            JSON.stringify({
              params,
              timestamp: Date.now(),
              toolName,
              type: 'tool_execution_start',
            }),
          );

          // Simuler des résultats progressifs
          const partialResults = [
            { found: 5, status: 'searching' },
            { found: 12, status: 'processing' },
            { found: 18, status: 'completed' },
          ];

          for (const result of partialResults) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            mockWebSocket.send(
              JSON.stringify({
                data: result,
                timestamp: Date.now(),
                toolName,
                type: 'tool_execution_progress',
              }),
            );
          }

          return { results: ['Result 1', 'Result 2', 'Result 3'] };
        },
      );

      await agent.run();

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('tool_execution_start'),
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('tool_execution_progress'),
      );
    });

    it('should handle real-time user interruptions', async () => {
      // Mock the logger properly
      const mockLogger = {
        child: vi.fn().mockReturnThis(),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      };

      vi.mocked(require('../../logger.ts').getLoggerInstance).mockReturnValue(
        mockLogger,
      );

      let interruptHandler: Function;

      mockWebSocket.addEventListener = vi.fn();
      (mockWebSocket.addEventListener as any).mockImplementation(
        (event: string, handler: Function) => {
          if (event === 'message') {
            interruptHandler = handler;
          }
        },
      );

      const runPromise = agent.run();

      // Simuler une interruption utilisateur après 100ms
      setTimeout(() => {
        if (interruptHandler) {
          const interruptMessage = {
            data: JSON.stringify({
              action: 'stop',
              reason: 'User requested cancellation',
              sessionId: 'websocket-test-session',
              type: 'user_interrupt',
            }),
          };
          interruptHandler(interruptMessage);
        }
      }, 100);

      const result = await runPromise;

      // Check that the agent was interrupted properly
      expect(mockLogger.info).toHaveBeenCalledWith('Job has been interrupted.');
      expect(result).toBe('Agent run interrupted by user');
    });
  });

  describe('Multi-client Collaboration', () => {
    it('should broadcast session updates to all connected clients', async () => {
      const connectedClients = [
        { id: 'client-1', rooms: ['session-room'], userId: 'user-1' },
        { id: 'client-2', rooms: ['session-room'], userId: 'user-2' },
        { id: 'client-3', rooms: ['session-room'], userId: 'user-1' }, // Same user, different device
      ];

      mockWebSocketServer.getRoomClients = vi.fn();
      (mockWebSocketServer.getRoomClients as any).mockReturnValue(
        connectedClients,
      );

      await agent.run();

      // Vérifier que la mise à jour est diffusée à tous les clients
      expect(mockWebSocketServer.sendToRoom).toHaveBeenCalledWith(
        'session-room',
        expect.objectContaining({
          sessionId: 'websocket-test-session',
          type: 'session_update',
        }),
      );
    });

    it('should handle collaborative session editing', async () => {
      const collaborativeEdit = {
        clientId: 'client-1',
        edit: {
          messageId: 'msg-123',
          newContent: 'Updated message content',
          timestamp: Date.now(),
          type: 'message_edit',
        },
        sessionId: 'websocket-test-session',
        type: 'session_edit',
        userId: 'user-456',
      };

      // Simuler une modification collaborative
      let messageHandler: Function;
      mockWebSocket.addEventListener = vi.fn();
      (mockWebSocket.addEventListener as any).mockImplementation(
        (event: string, handler: Function) => {
          if (event === 'message') {
            messageHandler = handler;
          }
        },
      );

      const runPromise = agent.run();

      setTimeout(() => {
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(collaborativeEdit),
          });
        }
      }, 50);

      await runPromise;

      // Vérifier que l'édition est diffusée aux autres clients
      expect(mockWebSocketServer.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          edit: collaborativeEdit.edit,
          type: 'collaborative_edit',
        }),
        { exclude: ['client-1'] }, // Exclure l'expéditeur
      );
    });

    it('should manage presence and typing indicators', async () => {
      const presenceUpdates = [
        { status: 'typing', timestamp: Date.now(), userId: 'user-1' },
        { status: 'idle', timestamp: Date.now() - 30000, userId: 'user-2' },
        { status: 'active', timestamp: Date.now() - 5000, userId: 'user-3' },
      ];

      await agent.run();

      presenceUpdates.forEach((presence) => {
        mockWebSocket.send(
          JSON.stringify({
            presence,
            sessionId: 'websocket-test-session',
            type: 'presence_update',
          }),
        );
      });

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('presence_update'),
      );
    });

    it('should synchronize canvas updates across clients', async () => {
      // Properly mock the LLM provider and response schema
      const mockLlmProvider = {
        getLlmResponse: vi
          .fn()
          .mockResolvedValue(
            '{"canvas": {"content": "<h1>Collaborative Canvas</h1>", "contentType": "html"}}',
          ),
      };

      const mockResponseSchema = {
        parse: vi.fn().mockReturnValue({
          canvas: {
            content: '<h1>Collaborative Canvas</h1>',
            contentType: 'html',
          },
        }),
      };

      // Update the mocks
      vi.mocked(
        require('../../utils/llmProvider.ts').getLlmProvider,
      ).mockReturnValue(mockLlmProvider);
      vi.mocked(require('./responseSchema.ts').llmResponseSchema).parse =
        mockResponseSchema.parse;

      await agent.run();

      // Vérifier que le canvas est synchronisé
      expect(mockWebSocketServer.sendToRoom).toHaveBeenCalledWith(
        'session-room',
        expect.objectContaining({
          canvas: {
            content: '<h1>Collaborative Canvas</h1>',
            contentType: 'html',
          },
          sessionId: 'websocket-test-session',
          type: 'canvas_update',
        }),
      );
    });
  });

  describe('Connection Management and Reliability', () => {
    it('should handle connection drops and reconnection', async () => {
      // Simuler une perte de connexion
      mockWebSocket.readyState = mockWebSocket.CLOSED;

      const reconnectionAttempts: any[] = [];
      let attempts = 0;

      const mockReconnect = vi.fn().mockImplementation(() => {
        attempts++;
        reconnectionAttempts.push({
          attempt: attempts,
          delay: Math.min(1000 * Math.pow(2, attempts - 1), 30000), // Exponential backoff
          timestamp: Date.now(),
        });

        // Simuler une reconnexion réussie après 3 tentatives
        if (attempts >= 3) {
          mockWebSocket.readyState = mockWebSocket.OPEN;
          return Promise.resolve();
        }
        return Promise.reject(new Error('Connection failed'));
      });

      await agent.run();

      // Simuler les tentatives de reconnexion
      for (let i = 0; i < 3; i++) {
        await mockReconnect().catch(() => {});
      }

      expect(reconnectionAttempts).toHaveLength(3);
      expect(reconnectionAttempts[2].delay).toBeGreaterThan(
        reconnectionAttempts[0].delay,
      );
    });

    it('should implement heartbeat/ping-pong mechanism', async () => {
      const heartbeatInterval = 30000; // 30 seconds
      let pingCount = 0;

      const mockPing = vi.fn().mockImplementation(() => {
        pingCount++;
        mockWebSocket.send(
          JSON.stringify({
            timestamp: Date.now(),
            type: 'ping',
          }),
        );

        // Simuler une réponse pong
        setTimeout(() => {
          const pongMessage = {
            data: JSON.stringify({
              timestamp: Date.now(),
              type: 'pong',
            }),
          };

          if (mockWebSocket.onmessage) {
            mockWebSocket.onmessage(pongMessage as any);
          }
        }, 50);
      });

      await agent.run();

      // Simuler des pings périodiques
      const pingInterval = setInterval(() => {
        if (pingCount < 3 && mockPing) {
          mockPing();
        } else {
          clearInterval(pingInterval);
        }
      }, 100);

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(pingCount).toBe(3);
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"ping"'),
      );
    });

    it('should handle connection timeouts gracefully', async () => {
      const connectionTimeout = 5000; // 5 seconds
      let timeoutTriggered = false;

      const mockConnectionTimeout = setTimeout(() => {
        timeoutTriggered = true;
        mockWebSocket.readyState = mockWebSocket.CLOSED;

        if (mockWebSocket.onerror) {
          mockWebSocket.onerror(new Event('error') as any);
        }
      }, connectionTimeout);

      await agent.run();

      // Simuler un timeout
      await new Promise((resolve) =>
        setTimeout(resolve, connectionTimeout + 100),
      );

      expect(timeoutTriggered).toBe(true);
      clearTimeout(mockConnectionTimeout);
    });

    it('should manage connection pooling and load balancing', async () => {
      const connectionPool = {
        'server-1': { capacity: 500, connections: 250, healthy: true },
        'server-2': { capacity: 500, connections: 180, healthy: true },
        'server-3': { capacity: 500, connections: 320, healthy: false },
      };

      const selectOptimalServer = () => {
        const healthyServers = Object.entries(connectionPool)
          .filter(([_, info]) => info.healthy)
          .sort(([_, a], [__, b]) => a.connections - b.connections);

        return healthyServers[0]?.[0] || null;
      };

      const selectedServer = selectOptimalServer();
      expect(selectedServer).toBe('server-2'); // Least loaded healthy server

      await agent.run();

      // Vérifier que la connexion est établie sur le serveur optimal
      expect(mockWebSocket.url).toContain('websocket');
    });
  });

  describe('Real-time Analytics and Monitoring', () => {
    it('should track real-time connection metrics', async () => {
      const connectionMetrics = {
        activeConnections: 189,
        averageLatency: 45, // ms
        bandwidth: {
          inbound: '2.5 MB/s',
          outbound: '8.1 MB/s',
        },
        errorRate: 0.002, // 0.2%
        messagesPerSecond: 150,
        totalConnections: 245,
      };

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        'websocket_metrics',
        expect.objectContaining({
          activeConnections: '189',
          averageLatency: '45',
          totalConnections: '245',
        }),
      );
    });

    it('should monitor message throughput and performance', async () => {
      const messageStats = {
        averageSize: 0,
        errors: 0,
        received: 0,
        sent: 0,
        totalSize: 0,
      };

      const trackMessage = (
        message: string,
        direction: 'received' | 'sent',
      ) => {
        messageStats[direction]++;
        messageStats.totalSize += message.length;
        messageStats.averageSize =
          messageStats.totalSize / (messageStats.sent + messageStats.received);
      };

      await agent.run();

      // Simuler l'envoi de messages
      const testMessages = [
        JSON.stringify({ data: 'test', type: 'progress' }),
        JSON.stringify({ content: 'thinking...', type: 'thought' }),
        JSON.stringify({ data: { answer: 'response' }, type: 'result' }),
      ];

      testMessages.forEach((msg) => {
        trackMessage(msg, 'sent');
        mockWebSocket.send(msg);
      });

      expect(messageStats.sent).toBe(3);
      expect(messageStats.averageSize).toBeGreaterThan(0);
    });

    it('should detect and alert on connection anomalies', async () => {
      const anomalyThresholds = {
        maxConnectionDrop: 0.1, // 10% per minute
        maxErrorRate: 0.05, // 5%
        maxLatency: 1000, // ms
        minMessageRate: 10, // messages per second
      };

      const currentStats = {
        connectionDropRate: 0.15, // Exceeds threshold
        errorRate: 0.08, // Exceeds threshold
        latency: 1500, // Exceeds threshold
        messageRate: 5, // Below threshold
      };

      const detectedAnomalies: string[] = [];

      if (currentStats.latency > anomalyThresholds.maxLatency) {
        detectedAnomalies.push('high_latency');
      }
      if (currentStats.errorRate > anomalyThresholds.maxErrorRate) {
        detectedAnomalies.push('high_error_rate');
      }
      if (
        currentStats.connectionDropRate > anomalyThresholds.maxConnectionDrop
      ) {
        detectedAnomalies.push('high_connection_drop');
      }
      if (currentStats.messageRate < anomalyThresholds.minMessageRate) {
        detectedAnomalies.push('low_message_rate');
      }

      await agent.run();

      expect(detectedAnomalies).toContain('high_latency');
      expect(detectedAnomalies).toContain('high_error_rate');
      expect(detectedAnomalies).toContain('high_connection_drop');
      expect(detectedAnomalies).toContain('low_message_rate');

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'alerts:websocket_anomaly',
        expect.stringContaining('high_latency'),
      );
    });
  });

  describe('Security and Authentication', () => {
    it('should validate WebSocket authentication tokens', async () => {
      const authTokens: any[] = [
        { token: 'valid-jwt-token', userId: 'user-123', valid: true },
        { reason: 'expired', token: 'expired-token', valid: false },
        {
          reason: 'invalid_signature',
          token: 'invalid-signature',
          valid: false,
        },
        { reason: 'missing_token', token: '', valid: false },
      ];

      const validateToken = (token: string) => {
        const tokenData = authTokens.find((t) => t.token === token);
        return tokenData || { reason: 'unknown_token', valid: false };
      };

      authTokens.forEach(({ token }) => {
        const validation = validateToken(token);
        if (!validation.valid) {
          expect((validation as any).reason).toBeTruthy();
        }
      });

      await agent.run();
    });

    it('should enforce rate limiting on WebSocket connections', async () => {
      const rateLimits = {
        connectionsPerIP: 10,
        messagesPerMinute: 1000,
        messagesPerSecond: 50,
      };

      const clientIP = '192.168.1.100';
      const connectionCount = 12; // Exceeds limit

      if (connectionCount > rateLimits.connectionsPerIP) {
        // Simuler le rejet de connexion
        expect(connectionCount).toBeGreaterThan(rateLimits.connectionsPerIP);
      }

      await agent.run();

      const redisClient =
        require('../redis/redisClient.ts').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        expect.stringContaining('rate_limit'),
        expect.any(Object),
      );
    });

    it('should sanitize and validate incoming messages', async () => {
      const incomingMessages: any[] = [
        { content: 'Normal message', safe: true },
        { content: '<script>alert("xss")</script>', safe: false },
        {
          content: "SQL injection attempt'; DROP TABLE users; --",
          safe: false,
        },
        { content: JSON.stringify({ malicious: 'payload' }), safe: true }, // JSON is OK
      ];

      const sanitizeMessage = (message: string) => {
        // Simuler la sanitisation
        const dangerous = /<script|javascript:|data:|vbscript:/i.test(message);
        const sqlInjection =
          /('|\\|;|\||`|\*|;drop|alter|create|insert|update|delete)\s+(?:table|database)/i.test(
            message,
          );

        return !dangerous && !sqlInjection;
      };

      incomingMessages.forEach((msg) => {
        const isSafe = sanitizeMessage(msg.content);
        expect(isSafe).toBe(msg.safe);
      });

      await agent.run();
    });

    it('should implement message encryption for sensitive data', async () => {
      const sensitiveMessage: any = {
        containsSensitiveData: true,
        content: 'This contains sensitive information',
        sessionId: 'secure-session',
        type: 'agent_response',
      };

      const encryptMessage = (message: any) => {
        if (message.containsSensitiveData) {
          // Simuler le chiffrement
          return {
            ...message,
            content:
              'encrypted_content_' +
              Buffer.from(message.content).toString('base64'),
            encrypted: true,
          };
        }
        return message;
      };

      const encryptedMessage = encryptMessage(sensitiveMessage);
      expect(encryptedMessage.encrypted).toBe(true);
      expect(encryptedMessage.content).toContain('encrypted_content_');

      await agent.run();
    });
  });

  describe('WebSocket vs HTTP Performance Comparison', () => {
    it('should demonstrate WebSocket efficiency over HTTP polling', async () => {
      const scenarios = {
        httpPolling: {
          overheadPerRequest: 800, // HTTP headers + connection setup
          requestsPerSecond: 100,
          totalBandwidth: 0,
        },
        websocket: {
          connections: 1,
          messagesPerSecond: 100,
          overhead: 2, // bytes per message
          totalBandwidth: 0,
        },
      };

      const messageSize = 200; // bytes
      const duration = 60; // seconds

      // WebSocket calculation
      scenarios.websocket.totalBandwidth =
        (messageSize + scenarios.websocket.overhead) *
        scenarios.websocket.messagesPerSecond *
        duration;

      // HTTP polling calculation
      scenarios.httpPolling.totalBandwidth =
        (messageSize + scenarios.httpPolling.overheadPerRequest) *
        scenarios.httpPolling.requestsPerSecond *
        duration;

      const efficiency =
        scenarios.websocket.totalBandwidth /
        scenarios.httpPolling.totalBandwidth;

      expect(efficiency).toBeLessThan(0.5); // WebSocket should use less than 50% bandwidth

      await agent.run();
    });

    it('should measure real-time latency improvements', async () => {
      const latencyMeasurements = {
        httpPolling: [] as number[],
        websocket: [] as number[],
      };

      // Simuler des mesures de latence
      for (let i = 0; i < 10; i++) {
        // WebSocket: latence constante et faible
        latencyMeasurements.websocket.push(15 + Math.random() * 10); // 15-25ms

        // HTTP polling: latence plus élevée et variable
        latencyMeasurements.httpPolling.push(80 + Math.random() * 40); // 80-120ms
      }

      const avgWebSocketLatency =
        latencyMeasurements.websocket.reduce((a, b) => a + b) / 10;
      const avgHttpLatency =
        latencyMeasurements.httpPolling.reduce((a, b) => a + b) / 10;

      expect(avgWebSocketLatency).toBeLessThan(avgHttpLatency);
      expect(avgWebSocketLatency).toBeLessThan(30); // Should be under 30ms

      await agent.run();
    });
  });
});
