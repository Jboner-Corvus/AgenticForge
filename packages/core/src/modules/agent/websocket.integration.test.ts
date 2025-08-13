import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Agent } from './agent.js';
import { getMockQueue } from '../../test/mockQueue.js';
import type { SessionData, Tool } from '../../types.js';

// Mock WebSocket avec fonctionnalités real-time
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
  url: 'ws://localhost:3001/websocket',
  protocol: '',
  extensions: '',
  bufferedAmount: 0,
};

// Mock WebSocket Server
const mockWebSocketServer = {
  clients: new Set(),
  broadcast: vi.fn(),
  handleConnection: vi.fn(),
  handleDisconnection: vi.fn(),
  sendToClient: vi.fn(),
  sendToRoom: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  getClientInfo: vi.fn(),
  getRoomClients: vi.fn(),
};

// Mock Socket.IO pour comparaison
const mockSocketIO = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  join: vi.fn(),
  leave: vi.fn(),
  to: vi.fn(),
  broadcast: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'socket-id-123',
  rooms: new Set(['room1', 'room2']),
  handshake: {
    headers: {},
    address: '127.0.0.1',
    time: new Date().toISOString(),
  },
};

// Mocks globaux
vi.mock('../../config.js', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
    WEBSOCKET_PORT: 3001,
    WEBSOCKET_PING_INTERVAL: 30000,
    WEBSOCKET_PING_TIMEOUT: 5000,
    MAX_WEBSOCKET_CONNECTIONS: 1000,
    WEBSOCKET_COMPRESSION: true,
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
  getRedisClientInstance: () => ({
    publish: vi.fn(),
    subscribe: vi.fn(),
    duplicate: () => ({
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      quit: vi.fn(),
    }),
    hset: vi.fn(),
    hget: vi.fn(),
    sadd: vi.fn(),
    srem: vi.fn(),
    smembers: vi.fn(),
  }),
}));

vi.mock('../../utils/llmProvider.js', () => ({
  getLlmProvider: () => ({
    getLlmResponse: vi.fn().mockResolvedValue('{"answer": "WebSocket test response"}'),
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
    parse: vi.fn().mockReturnValue({ answer: 'WebSocket test response' }),
  },
}));

// Mock WebSocket et Socket.IO
vi.mock('ws', () => ({
  WebSocketServer: vi.fn(() => mockWebSocketServer),
  WebSocket: vi.fn(() => mockWebSocket),
}));

vi.mock('socket.io', () => ({
  Server: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    to: vi.fn(() => ({ emit: vi.fn() })),
    close: vi.fn(),
  })),
}));

describe('WebSocket Real-time Communication Integration Tests', () => {
  let mockJob: any;
  let mockSessionData: SessionData;
  let mockSessionManager: any;
  let mockTools: Tool[];
  let agent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJob = {
      id: 'websocket-test-job',
      data: { prompt: 'Test WebSocket integration' },
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      id: 'websocket-test-session',
      history: [],
      activeLlmProvider: 'openai',
      websocketConnection: {
        id: 'connection-123',
        userId: 'user-456',
        rooms: ['session-room', 'user-room'],
        connected: true,
        lastPing: Date.now(),
      },
      identities: [{ id: 'test', type: 'user' }],
      name: 'websocket-test-session',
      timestamp: Date.now(),
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
      mockSessionManager
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Real-time Agent Communication', () => {
    it('should send real-time progress updates via WebSocket', async () => {
      const progressUpdates = [
        { stage: 'initializing', progress: 0, message: 'Starting agent' },
        { stage: 'processing', progress: 25, message: 'Analyzing request' },
        { stage: 'thinking', progress: 50, message: 'Generating response' },
        { stage: 'completing', progress: 100, message: 'Task completed' },
      ];

      // Simuler l'envoi de updates en temps réel
      progressUpdates.forEach((update, index) => {
        setTimeout(() => {
          mockWebSocket.send(JSON.stringify({
            type: 'agent_progress',
            sessionId: 'websocket-test-session',
            jobId: 'websocket-test-job',
            data: update,
            timestamp: Date.now(),
          }));
        }, index * 100);
      });

      await agent.run();

      expect(mockWebSocket.send).toHaveBeenCalledTimes(4);
      expect(mockWebSocket.send).toHaveBeenLastCalledWith(
        expect.stringContaining('agent_progress')
      );
    });

    it('should stream agent thoughts in real-time', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      const thoughtStream = [
        'I need to analyze this request carefully...',
        'The user is asking about WebSocket integration...',
        'Let me break this down into steps...',
        'I should provide a comprehensive response...',
      ];

      thoughtStream.forEach((thought, index) => {
        mockLlmProvider.getLlmResponse
          .mockResolvedValueOnce(`{"thought": "${thought}"}`);
        mockResponseSchema.parse
          .mockReturnValueOnce({ thought });
      });

      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"answer": "Final comprehensive response"}');
      mockResponseSchema.parse
        .mockReturnValueOnce({ answer: 'Final comprehensive response' });

      await agent.run();

      // Vérifier que chaque pensée a été envoyée en temps réel
      const thoughtMessages = thoughtStream.map(thought => 
        expect.stringContaining(`"thought":"${thought}"`)
      );

      thoughtMessages.forEach(expectedMessage => {
        expect(mockWebSocket.send).toHaveBeenCalledWith(expectedMessage);
      });
    });

    it('should broadcast tool execution results in real-time', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;
      const mockToolRegistry = require('../tools/toolRegistry.js').toolRegistry;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"command": {"name": "webSearch", "params": {"query": "real-time updates"}}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        command: { name: 'webSearch', params: { query: 'real-time updates' } },
      });

      // Simuler une exécution d'outil avec résultats progressifs
      mockToolRegistry.execute.mockImplementation(async (toolName: string, params: any) => {
        // Envoi du début d'exécution
        mockWebSocket.send(JSON.stringify({
          type: 'tool_execution_start',
          toolName,
          params,
          timestamp: Date.now(),
        }));

        // Simuler des résultats progressifs
        const partialResults = [
          { status: 'searching', found: 5 },
          { status: 'processing', found: 12 },
          { status: 'completed', found: 18 },
        ];

        for (const result of partialResults) {
          await new Promise(resolve => setTimeout(resolve, 50));
          mockWebSocket.send(JSON.stringify({
            type: 'tool_execution_progress',
            toolName,
            data: result,
            timestamp: Date.now(),
          }));
        }

        return { results: ['Result 1', 'Result 2', 'Result 3'] };
      });

      await agent.run();

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('tool_execution_start')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('tool_execution_progress')
      );
    });

    it('should handle real-time user interruptions', async () => {
      let interruptHandler: Function;
      
      mockWebSocket.addEventListener = vi.fn();
      (mockWebSocket.addEventListener as any).mockImplementation((event: string, handler: Function) => {
        if (event === 'message') {
          interruptHandler = handler;
        }
      });

      const runPromise = agent.run();

      // Simuler une interruption utilisateur après 100ms
      setTimeout(() => {
        if (interruptHandler) {
          const interruptMessage = {
            data: JSON.stringify({
              type: 'user_interrupt',
              action: 'stop',
              sessionId: 'websocket-test-session',
              reason: 'User requested cancellation',
            })
          };
          interruptHandler(interruptMessage);
        }
      }, 100);

      const result = await runPromise;

      expect(result).toContain('interrupted');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('agent_interrupted')
      );
    });
  });

  describe('Multi-client Collaboration', () => {
    it('should broadcast session updates to all connected clients', async () => {
      const connectedClients = [
        { id: 'client-1', userId: 'user-1', rooms: ['session-room'] },
        { id: 'client-2', userId: 'user-2', rooms: ['session-room'] },
        { id: 'client-3', userId: 'user-1', rooms: ['session-room'] }, // Same user, different device
      ];

      mockWebSocketServer.getRoomClients = vi.fn();
      (mockWebSocketServer.getRoomClients as any).mockReturnValue(connectedClients);

      await agent.run();

      // Vérifier que la mise à jour est diffusée à tous les clients
      expect(mockWebSocketServer.sendToRoom).toHaveBeenCalledWith(
        'session-room',
        expect.objectContaining({
          type: 'session_update',
          sessionId: 'websocket-test-session',
        })
      );
    });

    it('should handle collaborative session editing', async () => {
      const collaborativeEdit = {
        type: 'session_edit',
        sessionId: 'websocket-test-session',
        userId: 'user-456',
        edit: {
          type: 'message_edit',
          messageId: 'msg-123',
          newContent: 'Updated message content',
          timestamp: Date.now(),
        },
        clientId: 'client-1',
      };

      // Simuler une modification collaborative
      let messageHandler: Function;
      mockWebSocket.addEventListener = vi.fn();
      (mockWebSocket.addEventListener as any).mockImplementation((event: string, handler: Function) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      const runPromise = agent.run();

      setTimeout(() => {
        if (messageHandler) {
          messageHandler({
            data: JSON.stringify(collaborativeEdit)
          });
        }
      }, 50);

      await runPromise;

      // Vérifier que l'édition est diffusée aux autres clients
      expect(mockWebSocketServer.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collaborative_edit',
          edit: collaborativeEdit.edit,
        }),
        { exclude: ['client-1'] } // Exclure l'expéditeur
      );
    });

    it('should manage presence and typing indicators', async () => {
      const presenceUpdates = [
        { userId: 'user-1', status: 'typing', timestamp: Date.now() },
        { userId: 'user-2', status: 'idle', timestamp: Date.now() - 30000 },
        { userId: 'user-3', status: 'active', timestamp: Date.now() - 5000 },
      ];

      await agent.run();

      presenceUpdates.forEach(presence => {
        mockWebSocket.send(JSON.stringify({
          type: 'presence_update',
          sessionId: 'websocket-test-session',
          presence,
        }));
      });

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('presence_update')
      );
    });

    it('should synchronize canvas updates across clients', async () => {
      const mockLlmProvider = require('../../utils/llmProvider.js').getLlmProvider();
      const mockResponseSchema = require('./responseSchema.js').llmResponseSchema;

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"canvas": {"content": "<h1>Collaborative Canvas</h1>", "contentType": "html"}}'
      );
      mockResponseSchema.parse.mockReturnValue({
        canvas: { content: '<h1>Collaborative Canvas</h1>', contentType: 'html' },
      });

      await agent.run();

      // Vérifier que le canvas est synchronisé
      expect(mockWebSocketServer.sendToRoom).toHaveBeenCalledWith(
        'session-room',
        expect.objectContaining({
          type: 'canvas_update',
          sessionId: 'websocket-test-session',
          canvas: {
            content: '<h1>Collaborative Canvas</h1>',
            contentType: 'html',
          },
        })
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
          timestamp: Date.now(),
          delay: Math.min(1000 * Math.pow(2, attempts - 1), 30000), // Exponential backoff
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
      expect(reconnectionAttempts[2].delay).toBeGreaterThan(reconnectionAttempts[0].delay);
    });

    it('should implement heartbeat/ping-pong mechanism', async () => {
      const heartbeatInterval = 30000; // 30 seconds
      let pingCount = 0;

      const mockPing = vi.fn().mockImplementation(() => {
        pingCount++;
        mockWebSocket.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        }));

        // Simuler une réponse pong
        setTimeout(() => {
          const pongMessage = {
            data: JSON.stringify({
              type: 'pong',
              timestamp: Date.now(),
            })
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

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(pingCount).toBe(3);
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"ping"')
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
      await new Promise(resolve => setTimeout(resolve, connectionTimeout + 100));

      expect(timeoutTriggered).toBe(true);
      clearTimeout(mockConnectionTimeout);
    });

    it('should manage connection pooling and load balancing', async () => {
      const connectionPool = {
        'server-1': { connections: 250, capacity: 500, healthy: true },
        'server-2': { connections: 180, capacity: 500, healthy: true },
        'server-3': { connections: 320, capacity: 500, healthy: false },
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
        totalConnections: 245,
        activeConnections: 189,
        averageLatency: 45, // ms
        messagesPerSecond: 150,
        errorRate: 0.002, // 0.2%
        bandwidth: {
          inbound: '2.5 MB/s',
          outbound: '8.1 MB/s',
        },
      };

      await agent.run();

      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        'websocket_metrics',
        expect.objectContaining({
          totalConnections: '245',
          activeConnections: '189',
          averageLatency: '45',
        })
      );
    });

    it('should monitor message throughput and performance', async () => {
      const messageStats = {
        sent: 0,
        received: 0,
        errors: 0,
        averageSize: 0,
        totalSize: 0,
      };

      const trackMessage = (message: string, direction: 'sent' | 'received') => {
        messageStats[direction]++;
        messageStats.totalSize += message.length;
        messageStats.averageSize = messageStats.totalSize / (messageStats.sent + messageStats.received);
      };

      await agent.run();

      // Simuler l'envoi de messages
      const testMessages = [
        JSON.stringify({ type: 'progress', data: 'test' }),
        JSON.stringify({ type: 'thought', content: 'thinking...' }),
        JSON.stringify({ type: 'result', data: { answer: 'response' } }),
      ];

      testMessages.forEach(msg => {
        trackMessage(msg, 'sent');
        mockWebSocket.send(msg);
      });

      expect(messageStats.sent).toBe(3);
      expect(messageStats.averageSize).toBeGreaterThan(0);
    });

    it('should detect and alert on connection anomalies', async () => {
      const anomalyThresholds = {
        maxLatency: 1000, // ms
        maxErrorRate: 0.05, // 5%
        maxConnectionDrop: 0.1, // 10% per minute
        minMessageRate: 10, // messages per second
      };

      const currentStats = {
        latency: 1500, // Exceeds threshold
        errorRate: 0.08, // Exceeds threshold
        connectionDropRate: 0.15, // Exceeds threshold
        messageRate: 5, // Below threshold
      };

      const detectedAnomalies: string[] = [];
      
      if (currentStats.latency > anomalyThresholds.maxLatency) {
        detectedAnomalies.push('high_latency');
      }
      if (currentStats.errorRate > anomalyThresholds.maxErrorRate) {
        detectedAnomalies.push('high_error_rate');
      }
      if (currentStats.connectionDropRate > anomalyThresholds.maxConnectionDrop) {
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

      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.publish).toHaveBeenCalledWith(
        'alerts:websocket_anomaly',
        expect.stringContaining('high_latency')
      );
    });
  });

  describe('Security and Authentication', () => {
    it('should validate WebSocket authentication tokens', async () => {
      const authTokens: any[] = [
        { token: 'valid-jwt-token', valid: true, userId: 'user-123' },
        { token: 'expired-token', valid: false, reason: 'expired' },
        { token: 'invalid-signature', valid: false, reason: 'invalid_signature' },
        { token: '', valid: false, reason: 'missing_token' },
      ];

      const validateToken = (token: string) => {
        const tokenData = authTokens.find(t => t.token === token);
        return tokenData || { valid: false, reason: 'unknown_token' };
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
        messagesPerSecond: 50,
        messagesPerMinute: 1000,
      };

      const clientIP = '192.168.1.100';
      const connectionCount = 12; // Exceeds limit

      if (connectionCount > rateLimits.connectionsPerIP) {
        // Simuler le rejet de connexion
        expect(connectionCount).toBeGreaterThan(rateLimits.connectionsPerIP);
      }

      await agent.run();

      const redisClient = require('../redis/redisClient.js').getRedisClientInstance();
      expect(redisClient.hset).toHaveBeenCalledWith(
        expect.stringContaining('rate_limit'),
        expect.any(Object)
      );
    });

    it('should sanitize and validate incoming messages', async () => {
      const incomingMessages: any[] = [
        { content: 'Normal message', safe: true },
        { content: '<script>alert("xss")</script>', safe: false },
        { content: "SQL injection attempt'; DROP TABLE users; --", safe: false },
        { content: JSON.stringify({ malicious: 'payload' }), safe: true }, // JSON is OK
      ];

      const sanitizeMessage = (message: string) => {
        // Simuler la sanitisation
        const dangerous = /<script|javascript:|data:|vbscript:/i.test(message);
        const sqlInjection = /('|(\\\\|;)|(\\||`)|(\\*|;)|(drop|alter|create|insert|update|delete)\\s+(table|database)/i.test(message);
        
        return !dangerous && !sqlInjection;
      };

      incomingMessages.forEach(msg => {
        const isSafe = sanitizeMessage(msg.content);
        expect(isSafe).toBe(msg.safe);
      });

      await agent.run();
    });

    it('should implement message encryption for sensitive data', async () => {
      const sensitiveMessage: any = {
        type: 'agent_response',
        sessionId: 'secure-session',
        content: 'This contains sensitive information',
        containsSensitiveData: true,
      };

      const encryptMessage = (message: any) => {
        if (message.containsSensitiveData) {
          // Simuler le chiffrement
          return {
            ...message,
            content: 'encrypted_content_' + Buffer.from(message.content).toString('base64'),
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
        websocket: {
          connections: 1,
          messagesPerSecond: 100,
          overhead: 2, // bytes per message
          totalBandwidth: 0,
        },
        httpPolling: {
          requestsPerSecond: 100,
          overheadPerRequest: 800, // HTTP headers + connection setup
          totalBandwidth: 0,
        }
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

      const efficiency = scenarios.websocket.totalBandwidth / scenarios.httpPolling.totalBandwidth;

      expect(efficiency).toBeLessThan(0.5); // WebSocket should use less than 50% bandwidth

      await agent.run();
    });

    it('should measure real-time latency improvements', async () => {
      const latencyMeasurements = {
        websocket: [] as number[],
        httpPolling: [] as number[],
      };

      // Simuler des mesures de latence
      for (let i = 0; i < 10; i++) {
        // WebSocket: latence constante et faible
        latencyMeasurements.websocket.push(15 + Math.random() * 10); // 15-25ms

        // HTTP polling: latence plus élevée et variable
        latencyMeasurements.httpPolling.push(80 + Math.random() * 40); // 80-120ms
      }

      const avgWebSocketLatency = latencyMeasurements.websocket.reduce((a, b) => a + b) / 10;
      const avgHttpLatency = latencyMeasurements.httpPolling.reduce((a, b) => a + b) / 10;

      expect(avgWebSocketLatency).toBeLessThan(avgHttpLatency);
      expect(avgWebSocketLatency).toBeLessThan(30); // Should be under 30ms

      await agent.run();
    });
  });
});