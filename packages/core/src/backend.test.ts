import express from 'express';
import { RedisKey } from 'ioredis';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRedis } from '../test/mocks/redisClient.mock';
import { LlmKeyManager } from './modules/llm/LlmKeyManager.js';
import { jobQueue } from './modules/queue/queue.js';
import { redis } from './modules/redis/redisClient.js';
import { initializeWebServer } from './webServer.js';
import { processJob } from './worker.js';

vi.mock('./modules/llm/LlmKeyManager.js', () => ({
  LlmKeyManager: {
    addKey: vi.fn(),
    getKeysForApi: vi.fn(),
    getNextAvailableKey: vi.fn(),
    markKeyAsBad: vi.fn(),
    removeKey: vi.fn(),
    resetKeyStatus: vi.fn(),
  },
}));

vi.mock('./modules/queue/queue.js', () => ({
  jobQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mockJobId' }), // Add default mock for job.id
    getJob: vi.fn(),
  },
}));

vi.mock('./worker.js', () => ({
  processJob: vi.fn(),
}));

vi.mock('../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock config to control environment variables
vi.mock('./config.js', () => ({
  config: {
    AUTH_API_KEY: 'test-api-key',
    GITHUB_CLIENT_ID: 'test_client_id',
    GITHUB_CLIENT_SECRET: 'test_client_secret',
    HISTORY_MAX_LENGTH: 10,
    LLM_MODEL_NAME: 'test-model',
    LLM_PROVIDER: 'gemini',
    PORT: 3000,
    WORKER_CONCURRENCY: 5,
  },
}));

describe('Leaderboard Statistics Backend', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue);
  });

  it('should return initial leaderboard stats', async () => {
    vi.mocked(redis.get).mockImplementation((key: RedisKey) => {
      if (key === 'leaderboard:sessionsCreated') return Promise.resolve('0');
      if (key === 'leaderboard:tokensSaved') return Promise.resolve('0');
      if (key === 'leaderboard:successfulRuns') return Promise.resolve('0');
      return Promise.resolve(null);
    });

    const res = await request(app)
      .get('/api/leaderboard-stats')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      apiKeysAdded: 0,
      sessionsCreated: 0,
      successfulRuns: 0,
      tokensSaved: 0,
    });
  });

  it('should increment sessionsCreated when a new session is created', async () => {
    let sessionsCreatedCount = 0;
    vi.mocked(redis.incr).mockImplementation(async (key: RedisKey) => {
      if (key === 'leaderboard:sessionsCreated') {
        sessionsCreatedCount++;
        mockRedis._getStore()[key.toString()] = sessionsCreatedCount.toString();
        return Promise.resolve(sessionsCreatedCount);
      }
      return Promise.resolve(0);
    });
    vi.mocked(redis.get).mockImplementation(async (key: RedisKey) => {
      return Promise.resolve(mockRedis._getStore()[key.toString()] || null);
    });

    const agent = request.agent(app);
    // Simulate a request that triggers session creation
    await agent.get('/api/tools').set('Authorization', 'Bearer test-api-key');

    const res = await agent
      .get('/api/leaderboard-stats')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body.sessionsCreated).toEqual(1);
    expect(redis.incr).toHaveBeenCalledWith('leaderboard:sessionsCreated');
  });

  it('should increment tokensSaved when an LLM response is generated', async () => {
    vi.mocked(redis.incrby).mockImplementation(
      async (key: RedisKey, increment: number | string) => {
        const keyString = key.toString();
        const currentValue = parseInt(
          mockRedis._getStore()[keyString] || '0',
          10,
        );
        const newValue = currentValue + Number(increment);
        mockRedis._getStore()[keyString] = String(newValue);
        return Promise.resolve(newValue);
      },
    );
    vi.mocked(redis.get).mockImplementation(async (key: RedisKey) => {
      const keyString = key.toString();
      return Promise.resolve(mockRedis._getStore()[keyString] || '0');
    });

    // Simulate a chat message that triggers LLM response and token saving
    vi.mocked(processJob).mockImplementation(async () => {
      await redis.incrby('leaderboard:tokensSaved', 50);
      return 'Success';
    });
    await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer test-api-key')
      .send({ prompt: 'hello' });
    await processJob({} as any, []);

    const res = await request(app)
      .get('/api/leaderboard-stats')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body.tokensSaved).toBeGreaterThan(0);
    expect(redis.incrby).toHaveBeenCalledWith(
      'leaderboard:tokensSaved',
      expect.any(Number),
    );
  });

  it('should increment successfulRuns when a job completes successfully', async () => {
    vi.mocked(redis.incr).mockImplementation(async (key: RedisKey) => {
      const keyString = key.toString();
      const currentValue = parseInt(
        mockRedis._getStore()[keyString] || '0',
        10,
      );
      const newValue = currentValue + 1;
      mockRedis._getStore()[keyString] = String(newValue);
      return Promise.resolve(newValue);
    });
    vi.mocked(redis.get).mockImplementation(async (key: RedisKey) => {
      const keyString = key.toString();
      return Promise.resolve(mockRedis._getStore()[keyString] || '0');
    });

    // Simulate a job completion (this is handled by the processJob mock)
    vi.mocked(processJob).mockImplementation(async () => {
      await redis.incr('leaderboard:successfulRuns');
      return 'Success';
    });
    await processJob(
      { data: { sessionId: 'test-session' }, id: 'job1' } as any,
      [],
    );

    const res = await request(app)
      .get('/api/leaderboard-stats')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body.successfulRuns).toEqual(1);
    expect(redis.incr).toHaveBeenCalledWith('leaderboard:successfulRuns');
  });
});

describe('Session Management Backend', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue);
  });

  it('should save a session', async () => {
    const sessionData = {
      id: 'test-session-id',
      messages: [{ content: 'Hello', role: 'user' }],
      name: 'Test Session',
      timestamp: Date.now(),
    };
    vi.mocked(redis.set).mockResolvedValue('OK');

    const res = await request(app)
      .post('/api/sessions/save')
      .set('Authorization', 'Bearer test-api-key')
      .send(sessionData);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Session saved successfully.');
    expect(redis.set).toHaveBeenCalledWith(
      `session:${sessionData.id}:data`,
      JSON.stringify(sessionData),
    );
  });

  it('should load a session', async () => {
    const sessionData = {
      id: 'test-session-id',
      messages: [{ content: 'Hello', role: 'user' }],
      name: 'Test Session',
      timestamp: Date.now(),
    };
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify(sessionData));

    const res = await request(app)
      .get(`/api/sessions/${sessionData.id}`)
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(sessionData);
    expect(redis.get).toHaveBeenCalledWith(`session:${sessionData.id}:data`);
  });

  it('should return 404 if session not found on load', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/sessions/non-existent-id')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toEqual('Session not found');
  });

  it('should delete a session', async () => {
    const sessionId = 'test-session-id';
    vi.mocked(redis.del).mockResolvedValue(1); // 1 indicates success

    const res = await request(app)
      .delete(`/api/sessions/${sessionId}`)
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Session deleted successfully.');
    expect(redis.del).toHaveBeenCalledWith(`session:${sessionId}:data`);
  });

  it('should rename a session', async () => {
    const sessionId = 'test-session-id';
    const oldSessionData = {
      id: sessionId,
      messages: [],
      name: 'Old Name',
      timestamp: Date.now(),
    };
    const newName = 'New Session Name';
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify(oldSessionData));
    vi.mocked(redis.set).mockResolvedValue('OK');

    const res = await request(app)
      .put(`/api/sessions/${sessionId}/rename`)
      .set('Authorization', 'Bearer test-api-key')
      .send({ newName });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Session renamed successfully.');
    expect(redis.set).toHaveBeenCalledWith(
      `session:${sessionId}:data`,
      JSON.stringify({ ...oldSessionData, name: newName }),
    );
  });

  it('should return 404 if session not found on rename', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/sessions/non-existent-id/rename')
      .set('Authorization', 'Bearer test-api-key')
      .send({ newName: 'New Name' });
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toEqual('Session not found');
  });
});

describe('LLM API Key Management Backend', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue);
  });

  it('should add an LLM API key', async () => {
    const provider = 'openai';
    const key = 'sk-testkey';
    vi.mocked(LlmKeyManager.addKey).mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/llm-api-keys')
      .set('Authorization', 'Bearer test-api-key')
      .send({ key, provider });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('LLM API key added successfully.');
    expect(LlmKeyManager.addKey).toHaveBeenCalledWith(provider, key);
  });

  it('should retrieve LLM API keys', async () => {
    const mockKeys = [
      { key: 'sk-key1', provider: 'openai' },
      { key: 'gemini-key2', provider: 'gemini' },
    ];
    vi.mocked(LlmKeyManager.getKeysForApi).mockResolvedValue(mockKeys);

    const res = await request(app)
      .get('/api/llm-api-keys')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockKeys);
    expect(LlmKeyManager.getKeysForApi).toHaveBeenCalled();
  });

  it('should delete an LLM API key', async () => {
    const index = 0;
    vi.mocked(LlmKeyManager.removeKey).mockResolvedValue(undefined);

    const res = await request(app)
      .delete(`/api/llm-api-keys/${index}`)
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('LLM API key removed successfully.');
    expect(LlmKeyManager.removeKey).toHaveBeenCalledWith(index);
  });

  it('should return 400 for invalid index on delete', async () => {
    const index = 'abc';

    const res = await request(app)
      .delete(`/api/llm-api-keys/${index}`)
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Invalid index');
  });

  it('should return 500 if LlmKeyManager.removeKey throws an error', async () => {
    const index = 0;
    vi.mocked(LlmKeyManager.removeKey).mockRejectedValue(
      new Error('Key not found'),
    );

    const res = await request(app)
      .delete(`/api/llm-api-keys/${index}`)
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('Key not found');
  });
});

describe('GitHub OAuth Backend', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue);
  });

  it('should redirect to GitHub for OAuth initiation', async () => {
    const res = await request(app).get('/api/auth/github');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toContain(
      'https://github.com/login/oauth/authorize',
    );
    expect(res.headers.location).toContain('client_id=test_client_id');
    expect(res.headers.location).toContain('scope=user:email');
  });

  it('should handle GitHub OAuth callback successfully', async () => {
    const mockAccessToken = 'gho_test_token';
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({ access_token: mockAccessToken }),
      ok: true,
    } as Response);
    vi.mocked(redis.set).mockResolvedValue('OK');

    const res = await request(app)
      .get('/api/auth/github/callback?code=test_code')
      .set('Cookie', 'agenticforge_session_id=test-session-id');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/?github_auth_success=true');
    expect(redis.set).toHaveBeenCalledWith(
      `github:accessToken:test-session-id`,
      mockAccessToken,
      'EX',
      3600,
    );
  });

  it('should handle GitHub OAuth callback with error from GitHub', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        error: 'bad_code',
        error_description: 'The code is invalid.',
      }),
      ok: true,
    } as Response);

    const res = await request(app).get(
      '/api/auth/github/callback?code=bad_code',
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('GitHub OAuth error');
  });

  it('should handle GitHub OAuth callback with missing code', async () => {
    const res = await request(app).get('/api/auth/github/callback');
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Missing code or GitHub credentials');
  });
});
