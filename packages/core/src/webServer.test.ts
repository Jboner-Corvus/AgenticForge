import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { setRedisClientInstance } from './modules/redis/redisClient';
import { initializeWebServer } from './webServer';

// Mock toolLoader to prevent filesystem access during tests
vi.mock('./utils/toolLoader', async () => {
  return {
    getTools: vi.fn().mockResolvedValue([]),
  };
});

describe('API Routes', () => {
  let app: express.Application;
  let server: Server;

  beforeAll(async () => {
    const mockPgClient: any = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
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
      lrange: vi.fn().mockResolvedValue([]),
      publish: vi.fn().mockResolvedValue(1),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      rpush: vi.fn().mockResolvedValue(1),
    };
    setRedisClientInstance(mockRedisClient);
    const initialized = await initializeWebServer(
      mockPgClient,
      mockRedisClient,
    );
    app = initialized.app;
    server = initialized.server;
  });

  afterAll(() => {
    server.close();
    setRedisClientInstance(null);
  });

  it('should return 200 for GET /api/tools', async () => {
    const response = await request(app).get('/api/tools');
    expect(response.status).toBe(200);
  });

  it('should return 200 for POST /api/session', async () => {
    const response = await request(app).post('/api/session');
    expect(response.status).toBe(200);
  });

  it('should return 200 for GET /api/sessions/:id', async () => {
    const response = await request(app).get('/api/sessions/test-session-id');
    expect(response.status).toBe(200);
  });

  it('should return 200 for PUT /api/sessions/:id/rename', async () => {
    const response = await request(app)
      .put('/api/sessions/test-session-id/rename')
      .send({ newName: 'new-name' });
    expect(response.status).toBe(200);
  });

  it('should return 200 for GET /api/leaderboard', async () => {
    const response = await request(app).get('/api/leaderboard');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});
