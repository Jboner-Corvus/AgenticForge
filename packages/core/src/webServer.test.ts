/// <reference types="vitest/globals" />

import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock necessary modules for webServer.ts
vi.mock('./modules/redis/redisClient', () => ({
  getRedisClientInstance: vi.fn(() => ({
    del: vi.fn(),
    duplicate: vi.fn(() => ({})),
    get: vi.fn(),
    incr: vi.fn(),
    lrange: vi.fn().mockResolvedValue([]),
    on: vi.fn(),
    options: { host: 'localhost', port: 6379 },
    publish: vi.fn(),
    quit: vi.fn(),
    rpush: vi.fn(),
    set: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
}));

vi.mock('./config', () => ({
  config: {
    HISTORY_MAX_LENGTH: 10,
    LLM_PROVIDER: 'gemini',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
  },
  getConfig: vi.fn(() => ({
    HISTORY_MAX_LENGTH: 10,
    LLM_PROVIDER: 'gemini',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
  })),
}));

vi.mock('./logger', () => {
  const mockLoggerInstance = {
    child: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    })),
    error: vi.fn(),
    info: vi.fn(),
  };
  return {
    getLogger: vi.fn(() => mockLoggerInstance),
    getLoggerInstance: vi.fn(() => mockLoggerInstance),
  };
});

vi.mock('./modules/session/sessionManager', () => ({
  SessionManager: vi.fn(() => ({
    getSession: vi.fn().mockResolvedValue({ history: [] }),
    saveSession: vi.fn(),
  })),
}));

// Import the function to be tested
import { initializeWebServer } from '../src/webServer';
vi.mock('./utils/toolLoader', () => ({
  getTools: vi.fn(() => []),
}));

describe('initializeWebServer', () => {
  let app: express.Application;
  let server: Server;

  beforeAll(async () => {
    const mockPgClient: any = {
      query: vi.fn((sql: string, params: any[]) => {
        if (sql.includes('SELECT * FROM sessions WHERE id = $1')) {
          if (params[0] === 'testSessionId') {
            return Promise.resolve({
              rows: [
                {
                  active_llm_provider: 'gemini',
                  id: 'testSessionId',
                  identities: '[]',
                  messages: '[]',
                  name: 'Test Session',
                  timestamp: Date.now().toString(),
                },
              ],
            });
          }
        }
        if (sql.includes('UPDATE sessions SET name = $1 WHERE id = $2')) {
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      }),
    };
    const mockRedisClient: any = {
      duplicate: vi.fn(() => ({
        on: vi.fn(),
        quit: vi.fn(),
        subscribe: vi.fn().mockResolvedValue(undefined),
        unsubscribe: vi.fn(),
      })),
      get: vi.fn().mockResolvedValue(null),
      incr: vi.fn().mockResolvedValue(1),
      publish: vi.fn().mockResolvedValue(1),
      set: vi.fn().mockResolvedValue('OK'),
    };
    const initialized = await initializeWebServer(
      mockPgClient,
      mockRedisClient,
    );
    app = initialized.app;
    server = initialized.server;
  });

  afterAll(() => {
    server.close();
  });

  it('should be defined', () => {
    expect(initializeWebServer).toBeDefined();
  });

  it('should initialize the web server without throwing errors', async () => {
    const mockPgClient: any = {
      query: vi.fn(),
    };
    const mockRedisClient: any = {
      duplicate: vi.fn(() => ({
        on: vi.fn(),
        quit: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      })),
      get: vi.fn(),
      incr: vi.fn(),
      publish: vi.fn(),
      set: vi.fn(),
    };
    await expect(
      initializeWebServer(mockPgClient, mockRedisClient),
    ).resolves.not.toThrow();
  });

  it('should return 200 for authorized access to /api/tools', async () => {
    const response = await request(app).get('/api/tools');
    expect(response.statusCode).toBe(200);
  });

  it('should return 200 for /api/session', async () => {
    const response = await request(app).get('/api/session');
    expect(response.statusCode).toBe(200);
  });

  it('should load a session via /api/sessions/:id', async () => {
    const sessionId = 'testSessionId';
    const response = await request(app).get(`/api/sessions/${sessionId}`);
    expect(response.statusCode).toBe(200);
  });

  it('should rename a session via /api/sessions/:id/rename', async () => {
    const sessionId = 'testSessionId';
    const newName = 'newSessionName';
    const response = await request(app)
      .put(`/api/sessions/${sessionId}/rename`)
      .send({ newName });
    expect(response.statusCode).toBe(200);
  });
});
