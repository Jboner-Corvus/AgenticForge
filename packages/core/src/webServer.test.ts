import express from 'express';
import { promises as fs } from 'fs';
import request from 'supertest';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  vi,
} from 'vitest';

import { config } from './config';
import * as toolLoader from './utils/toolLoader';
import { initializeWebServer } from './webServer';

vi.mock('./modules/queue/queue', () => ({
  jobQueue: {
    add: vi.fn(),
    getJob: vi.fn(),
  },
}));

vi.mock('./modules/llm/LlmKeyManager', () => ({
  LlmKeyManager: {
    addKey: vi.fn(),
    getKeysForApi: vi.fn(),
    removeKey: vi.fn(),
  },
}));

import { mockRedis as redis } from '../test/mocks/redisClient.mock';
import { LlmKeyManager } from './modules/llm/LlmKeyManager';
import { jobQueue } from './modules/queue/queue';

vi.mock('./modules/redis/redisClient', () => {
  const mockRedisClient = {
    condition: 'ready',
    del: vi.fn().mockResolvedValue(1),
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      quit: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    })),
    get: vi.fn().mockResolvedValue(null),
    incr: vi.fn().mockResolvedValue(1),
    incrby: vi.fn().mockResolvedValue(1),
    isCluster: false,
    on: vi.fn(),
    options: { host: 'localhost', port: 6379 },
    publish: vi.fn().mockResolvedValue(1),
    set: vi.fn().mockResolvedValue('OK'),
    // Added missing properties for Redis type compatibility
    status: 'ready',
    stream: {} as any,
    subscribe: vi.fn().mockResolvedValue(undefined),
    // Add other properties as needed by the Redis type if more errors appear
  };
  return { redis: mockRedisClient };
});

describe('webServer', () => {
  let app: express.Application;

  beforeAll(async () => {
    config.AUTH_API_KEY = 'test-api-key'; // Set a test API key
    app = await initializeWebServer(redis as any, jobQueue);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to prevent test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Ensure jobQueue.add always returns a mock job for tests
    (jobQueue.add as Mock).mockResolvedValue({ id: 'mockJobId' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 200 for /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('OK');
  });

  it('should return 401 for unauthorized access to /api/tools', async () => {
    const res = await request(app).get('/api/tools');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 200 for authorized access to /api/tools', async () => {
    const mockTools = [
      { description: 'Tool 1 description', name: 'tool1', parameters: {} },
      { description: 'Tool 2 description', name: 'tool2', parameters: {} },
    ];
    vi.spyOn(toolLoader, 'getTools').mockResolvedValue(mockTools as any);

    const res = await request(app)
      .get('/api/tools')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockTools);
  });

  it('should return 401 for unauthorized access to /api/chat', async () => {
    const res = await request(app).post('/api/chat').send({ prompt: 'test' });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 if prompt is missing in /api/chat', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Le prompt est manquant.');
  });

  it('should return 202 and a jobId for valid /api/chat request', async () => {
    (jobQueue.add as Mock).mockResolvedValue({ id: 'mockJobId' });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
      .send({ prompt: 'hello' });

    expect(res.statusCode).toEqual(202);
    expect(res.body).toEqual({
      jobId: 'mockJobId',
      message: 'Requête reçue, traitement en cours.',
    });
    expect(jobQueue.add).toHaveBeenCalledWith(
      'process-message',
      expect.any(Object),
    );
  });

  it('should handle /api/chat/stream/:jobId correctly', async () => {
    const mockSubscriber = {
      on: vi.fn(),
      quit: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    };
    (redis.duplicate as Mock).mockReturnValue(mockSubscriber);

    const req = request(app)
      .get('/api/chat/stream/testJobId')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);

    // Wait for the response headers to be sent
    await new Promise<void>((resolve) => {
      req.on('response', (res) => {
        expect(res.statusCode).toEqual(200);
        expect(res.headers['content-type']).toEqual('text/event-stream');
        resolve();
      });
    });

    expect(redis.duplicate).toHaveBeenCalled();
    expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
      'job:testJobId:events',
    );
  }, 30000);

  it('should return 200 for /api/history', async () => {
    (redis.get as Mock).mockResolvedValue(
      JSON.stringify([{ content: 'test', role: 'user' }]),
    );
    const res = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([{ content: 'test', role: 'user' }]);
  });

  it('should return 200 for /api/session', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      message: 'Session gérée automatiquement via cookie.',
      sessionId: expect.any(String),
    });
  });

  it('should return leaderboard stats for /api/leaderboard-stats', async () => {
    (redis.get as Mock)
      .mockResolvedValueOnce('10') // sessionsCreated
      .mockResolvedValueOnce('100') // tokensSaved
      .mockResolvedValueOnce('5'); // successfulRuns

    const res = await request(app)
      .get('/api/leaderboard-stats')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      apiKeysAdded: 0,
      sessionsCreated: 10,
      successfulRuns: 5,
      tokensSaved: 100,
    });
  });

  it('should return memory contents for /api/memory', async () => {
    vi.spyOn(fs, 'readdir').mockResolvedValue([
      'file1.txt',
      'file2.txt',
    ] as any);
    vi.spyOn(fs, 'readFile')
      .mockResolvedValueOnce('content of file1')
      .mockResolvedValueOnce('content of file2');

    const res = await request(app)
      .get('/api/memory')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([
      { content: 'content of file1', fileName: 'file1.txt' },
      { content: 'content of file2', fileName: 'file2.txt' },
    ]);
  });

  it('should save a session via /api/sessions/save', async () => {
    const sessionData = {
      id: 's1',
      messages: [],
      name: 'testSession',
      timestamp: Date.now(),
    };
    const res = await request(app)
      .post('/api/sessions/save')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
      .send(sessionData);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Session saved successfully.' });
    expect(redis.set).toHaveBeenCalledWith(
      `session:${sessionData.id}:data`,
      JSON.stringify(sessionData),
    );
  });

  it('should load a session via /api/sessions/:id', async () => {
    const sessionData = {
      id: 's1',
      messages: [],
      name: 'testSession',
      timestamp: Date.now(),
    };
    (redis.get as Mock).mockResolvedValue(JSON.stringify(sessionData));
    const res = await request(app)
      .get('/api/sessions/s1')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(sessionData);
  });

  it('should delete a session via /api/sessions/:id', async () => {
    const res = await request(app)
      .delete('/api/sessions/s1')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Session deleted successfully.' });
    expect(redis.del).toHaveBeenCalledWith('session:s1:data');
  });

  it('should rename a session via /api/sessions/:id/rename', async () => {
    const sessionData = {
      id: 's1',
      messages: [],
      name: 'oldName',
      timestamp: Date.now(),
    };
    (redis.get as Mock).mockResolvedValue(JSON.stringify(sessionData));
    const res = await request(app)
      .put('/api/sessions/s1/rename')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
      .send({ newName: 'newName' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Session renamed successfully.' });
    expect(redis.set).toHaveBeenCalledWith(
      'session:s1:data',
      JSON.stringify({ ...sessionData, name: 'newName' }),
    );
  });

  it('should add an LLM API key via /api/llm-api-keys', async () => {
    const res = await request(app)
      .post('/api/llm-api-keys')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
      .send({ key: 'test_key', provider: 'gemini' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'LLM API key added successfully.' });
    expect(LlmKeyManager.addKey).toHaveBeenCalledWith('gemini', 'test_key');
  });

  it('should retrieve LLM API keys via /api/llm-api-keys', async () => {
    const mockKeys = [{ key: 'key1', provider: 'gemini' }];
    (LlmKeyManager.getKeysForApi as Mock).mockResolvedValue(mockKeys);
    const res = await request(app)
      .get('/api/llm-api-keys')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockKeys);
  });

  it('should delete an LLM API key via /api/llm-api-keys/:index', async () => {
    const res = await request(app)
      .delete('/api/llm-api-keys/0')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'LLM API key removed successfully.' });
    expect(LlmKeyManager.removeKey).toHaveBeenCalledWith(0);
  });

  it('should handle /api/interrupt/:jobId correctly', async () => {
    (jobQueue.add as Mock).mockResolvedValue({ id: 'mockJobId' });
    (jobQueue.getJob as Mock).mockResolvedValue({ id: 'mockJobId' });
    const res = await request(app)
      .post('/api/interrupt/mockJobId')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Interruption signal sent.' });
    expect(redis.publish).toHaveBeenCalledWith(
      'job:mockJobId:interrupt',
      'interrupt',
    );
  });

  it('should handle /api/status/:jobId correctly', async () => {
    (jobQueue.getJob as Mock).mockResolvedValue({
      getState: vi.fn().mockResolvedValue('completed'),
      id: 'mockJobId',
      progress: 100,
      returnvalue: 'success',
    });
    const res = await request(app)
      .get('/api/status/mockJobId')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      jobId: 'mockJobId',
      progress: 100,
      returnvalue: 'success',
      state: 'completed',
    });
  });

  it('should handle /api/display correctly', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue('<html>test</html>');
    const res = await request(app)
      .get('/api/display')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Display event sent.' });
    expect(redis.publish).toHaveBeenCalledWith(
      'job:display:events',
      JSON.stringify({
        payload: { content: '<html>test</html>', type: 'html' },
        type: 'displayOutput',
      }),
    );
  });
});
