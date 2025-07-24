import express from 'express';
import { promises as fs } from 'fs';
import request from 'supertest';
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  vi,
} from 'vitest';

import { config } from './config';

vi.mock('./config');
vi.mock('./utils/toolLoader');
vi.mock('./modules/queue/queue');
vi.mock('./modules/llm/LlmKeyManager');

vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    resolve: vi.fn((...args) => {
      if (args[0] === process.cwd() && args[1] === 'workspace') {
        return '/mock/workspace'; // Mock the workspace path
      }
      return (actual as any).resolve(...args);
    }),
  };
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Callback, Redis, RedisKey } from 'ioredis';

import { LlmKeyManager } from './modules/llm/LlmKeyManager';
import { jobQueue } from './modules/queue/queue';
import { redis } from './modules/redis/redisClient';
import * as toolLoader from './utils/toolLoader';
import { initializeWebServer } from './webServer';



describe('webServer', () => {
  let app: express.Application;

  beforeAll(async () => {
    config.AUTH_API_KEY = 'test-api-key'; // Set a test API key
    const mockPgClient = {} as any; // Mock pgClient
    app = await initializeWebServer(redis as any, jobQueue, mockPgClient);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to prevent test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Ensure jobQueue.add always returns a mock job for tests
    (jobQueue.add as Mock).mockResolvedValue({ id: 'mockJobId' });
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

    await new Promise<void>((resolve, reject) => {
      let receivedData = '';
      req.on('response', (res) => {
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/event-stream');

        res.on('data', (chunk: Buffer) => {
          receivedData += chunk.toString();
          if (receivedData.includes('data: {"type":"test"}\n\n')) {
            expect(receivedData).toContain('data: {"type":"test"}\n\n');
            res.destroy(); // Close the connection
            resolve();
          }
        });

        res.on('end', () => {
          if (!receivedData.includes('data: {"type":"test"}\n\n')) {
            reject(new Error('Stream ended without receiving expected data.'));
          }
        });

        res.on('error', (err: Error) => {
          reject(err);
        });
      });

      // Simulate a message being published to the Redis channel after the connection is established
      // This needs to happen after the 'response' event listener is set up
      // We need to wait for the subscriber.subscribe to be called in webServer.ts
      // A small delay or a more robust mock for redis.duplicate might be needed
      setTimeout(() => {
        const onMessageCallback = mockSubscriber.on.mock.calls.find(
          (call) => call[0] === 'message',
        );
        if (onMessageCallback) {
          onMessageCallback[1]('job:testJobId:events', '{"type":"test"}');
        }
      }, 100); // Small delay to allow subscriber.on to be called
    });
  });

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
      .get('/api/display?file=index.html')
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
