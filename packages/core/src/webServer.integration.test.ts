import express from 'express';
import fs from 'fs/promises';
import { RedisKey } from 'ioredis';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRedis } from '../test/mocks/redisClient.mock';
import logger from './logger.js'; // Import logger
import { LlmKeyManager } from './modules/llm/LlmKeyManager.js';
import { jobQueue } from './modules/queue/queue.js'; // Import jobQueue
import { redis } from './modules/redis/redisClient.js';
import { AppError, UserError } from './utils/errorUtils.js';
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

vi.mock('./modules/queue/queue.js', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('./modules/queue/queue.js')>();
  return {
    ...original,
    jobQueue: {
      add: vi.fn().mockResolvedValue({ id: 'mockJobId' }), // Add default mock for job.id
      getJob: vi.fn(),
    },
  };
});

vi.mock('./worker.js', () => ({
  processJob: vi.fn(
    async (job: any, tools: any, jobQueue: any, ctx: any): Promise<string> => {
      throw new Error('processJob not mocked for this scenario');
    },
  ),
}));

vi.mock('./logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./logger.js')>();
  return {
    default: {
      ...actual.default,
      child: vi.fn().mockReturnThis(),
      debug: vi.fn(),
      error: vi.fn((obj: object, msg: string) => {}), // Explicitly define signature
      info: vi.fn(),
      warn: vi.fn(),
    },
  };
});

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
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
    errorSpy = vi.spyOn(logger, 'error');
  });

  it('should return initial leaderboard stats', async () => {
    vi.mocked(redis.get).mockImplementation(
      async (key: RedisKey): Promise<null | string> => {
        if (key === 'leaderboard:sessionsCreated') return '0';
        if (key === 'leaderboard:tokensSaved') return '0';
        if (key === 'leaderboard:successfulRuns') return '0';
        return null;
      },
    );

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
    vi.spyOn(redis, 'incr').mockImplementation(
      async (key: RedisKey): Promise<number> => {
        if (key === 'leaderboard:sessionsCreated') {
          sessionsCreatedCount++;
          return sessionsCreatedCount;
        }
        return 0;
      },
    );
    vi.spyOn(redis, 'get').mockImplementation(
      async (key: RedisKey): Promise<null | string> => {
        if (key === 'leaderboard:sessionsCreated') {
          return String(sessionsCreatedCount);
        }
        return null;
      },
    );

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

  it('should log an error if redis.incr fails for sessionsCreated', async () => {
    vi.spyOn(redis, 'incr').mockRejectedValue(new Error('Redis incr failed'));

    const agent = request.agent(app);
    await agent.get('/api/tools').set('Authorization', 'Bearer test-api-key');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Failed to increment sessionsCreated in Redis',
    );
  });

  it('should increment tokensSaved when an LLM response is generated', async () => {
    let tokensSavedCount = 0;
    vi.spyOn(redis, 'incrby').mockImplementation(
      async (key: RedisKey, increment: number | string): Promise<number> => {
        if (key === 'leaderboard:tokensSaved') {
          tokensSavedCount += Number(increment);
          return tokensSavedCount;
        }
        return 0;
      },
    );
    vi.spyOn(redis, 'get').mockImplementation(
      async (key: RedisKey): Promise<null | string> => {
        if (key === 'leaderboard:tokensSaved') {
          return String(tokensSavedCount);
        }
        return null;
      },
    );

    // Simulate a chat message that triggers LLM response and token saving
    vi.mocked(processJob).mockImplementationOnce(
      async (job: any, _tools: any, _jobQueue: any): Promise<string> => {
        await redis.incrby('leaderboard:tokensSaved', 50);
        return 'Success';
      },
    );
    await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer test-api-key')
      .send({ prompt: 'hello' });
    await processJob({} as any, [], jobQueue, {} as any);

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

  it('should log an error if redis.incrby fails for tokensSaved', async () => {
    vi.spyOn(redis, 'incrby').mockRejectedValue(
      new Error('Redis incrby failed'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    // Simulate a chat message that triggers LLM response and token saving
    vi.mocked(processJob).mockImplementationOnce(
      async (job: any, _tools: any, _jobQueue: any): Promise<string> => {
        try {
          await redis.incrby('leaderboard:tokensSaved', 50);
          return 'Success';
        } catch (error) {
          throw error; // Re-throw the error so it can be caught by the test's errorSpy
        }
      },
    );
    await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer test-api-key')
      .send({ prompt: 'hello' });
    await processJob({} as any, [], jobQueue, {} as any);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Failed to increment tokensSaved in Redis',
    );
  });

  it('should increment successfulRuns when a job completes successfully', async () => {
    vi.mocked(redis.incr).mockImplementation(
      async (key: RedisKey): Promise<number> => {
        const keyString = key.toString();
        const currentValue = parseInt(
          mockRedis._getStore()[keyString] || '0',
          10,
        );
        const newValue = currentValue + 1;
        mockRedis._getStore()[keyString] = String(newValue);
        return newValue;
      },
    );
    vi.mocked(redis.get).mockImplementation(
      async (key: RedisKey): Promise<null | string> => {
        const keyString = key.toString();
        return mockRedis._getStore()[keyString] || null;
      },
    );

    // Simulate a job completion (this is handled by the processJob mock)
    vi.mocked(processJob).mockImplementation(async (): Promise<string> => {
      await redis.incr('leaderboard:successfulRuns');
      return 'Success';
    });
    await processJob(
      { data: { sessionId: 'test-session' }, id: 'job1' } as any,
      [],
      jobQueue,
      {} as any,
    );

    const res = await request(app)
      .get('/api/leaderboard-stats')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body.successfulRuns).toEqual(1);
    expect(redis.incr).toHaveBeenCalledWith('leaderboard:successfulRuns');
  });

  it('should log an error if redis.incr fails for successfulRuns', async () => {
    vi.spyOn(redis, 'incr').mockRejectedValue(new Error('Redis incr failed'));
    const errorSpy = vi.spyOn(logger, 'error');

    // Simulate a job completion (this is handled by the processJob mock)
    vi.mocked(processJob).mockImplementation(async (): Promise<string> => {
      await redis.incr('leaderboard:successfulRuns');
      return 'Success';
    });
    await processJob(
      { data: { sessionId: 'test-session' }, id: 'job1' } as any,
      [],
      jobQueue,
      {} as any,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Failed to increment successfulRuns in Redis',
    );
  });
});

describe('Session Management Backend', () => {
  let app: express.Application;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
    errorSpy = vi.spyOn(logger, 'error');
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

  it('should log an error if redis.set fails for session save', async () => {
    const sessionData = {
      id: 'test-session-id',
      messages: [{ content: 'Hello', role: 'user' }],
      name: 'Test Session',
      timestamp: Date.now(),
    };
    vi.spyOn(redis, 'set').mockRejectedValue(new Error('Redis set failed'));
    // Mock redis.incr to succeed to avoid interference from session middleware
    vi.spyOn(redis, 'incr').mockResolvedValue(1);
    const errorSpy = vi.spyOn(logger, 'error');

    await request(app)
      .post('/api/sessions/save')
      .set('Authorization', 'Bearer test-api-key')
      .send(sessionData);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Error caught by error handling middleware',
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

  it('should log an error if redis.get fails for session load', async () => {
    const sessionId = 'test-session-id';
    vi.spyOn(redis, 'get').mockRejectedValue(new Error('Redis get failed'));
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toContain('Redis get failed');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Error caught by error handling middleware',
    );
  });

  it('should return 404 if session not found on load', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/sessions/non-existent-id')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(404);
    expect(res.body.error.message).toEqual('Session not found');
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

  it('should log an error if redis.del fails for session delete', async () => {
    const sessionId = 'test-session-id';
    vi.spyOn(redis, 'del').mockRejectedValue(new Error('Redis del failed'));
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .delete(`/api/sessions/${sessionId}`)
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toContain('Redis del failed');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Error caught by error handling middleware',
    );
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

  it('should log an error if redis.get fails during session rename', async () => {
    const sessionId = 'test-session-id';
    const newName = 'New Session Name';
    vi.spyOn(redis, 'get').mockRejectedValue(
      new Error('Redis get failed during rename'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .put(`/api/sessions/${sessionId}/rename`)
      .set('Authorization', 'Bearer test-api-key')
      .send({ newName });

    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toContain('Redis get failed during rename');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Error caught by error handling middleware',
    );
  });

  it('should return 404 if session not found on rename', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);

    const res = await request(app)
      .put('/api/sessions/non-existent-id/rename')
      .set('Authorization', 'Bearer test-api-key')
      .send({ newName: 'New Name' });
    expect(res.statusCode).toEqual(404);
    expect(res.body.error.message).toEqual('Session not found');
  });
});

describe('LLM API Key Management Backend', () => {
  let app: express.Application;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
    errorSpy = vi.spyOn(logger, 'error');
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

  it('should return 500 if LlmKeyManager.addKey throws an error', async () => {
    vi.mocked(LlmKeyManager.addKey).mockRejectedValue(
      new Error('Failed to add key'),
    );
    const provider = 'openai';
    const key = 'sk-testkey';
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .post('/api/llm-api-keys')
      .set('Authorization', 'Bearer test-api-key')
      .send({ key, provider });
    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toContain('Failed to add key');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error adding LLM API key',
    );
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

  it('should return 500 if LlmKeyManager.getKeysForApi throws an error', async () => {
    vi.mocked(LlmKeyManager.getKeysForApi).mockRejectedValue(
      new Error('Failed to retrieve keys'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .get('/api/llm-api-keys')
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toContain('Failed to retrieve keys');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error retrieving LLM API keys',
    );
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
    expect(res.body.error.message).toEqual('Invalid index');
  });

  it('should return 500 if LlmKeyManager.removeKey throws an error', async () => {
    const index = 0;
    vi.mocked(LlmKeyManager.removeKey).mockRejectedValue(
      new Error('Key not found'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .delete(`/api/llm-api-keys/${index}`)
      .set('Authorization', 'Bearer test-api-key');
    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toContain('Key not found');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error removing LLM API key',
    );
  });
});

describe('GitHub OAuth Backend', () => {
  let app: express.Application;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    errorSpy = vi.spyOn(logger, 'error');
    vi.clearAllMocks();
    mockRedis._resetStore();
    // Ensure config values are set for GitHub OAuth tests
    vi.doMock('./config.js', async (importOriginal) => {
      const original = await importOriginal<typeof import('./config.js')>();
      return {
        ...original,
        config: {
          ...original.config,
          GITHUB_CLIENT_ID: 'test_client_id',
          GITHUB_CLIENT_SECRET: 'test_client_secret',
        },
      };
    });
    // Re-initialize app after config mock
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
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
    vi.doMock('./config.js', async (importOriginal) => {
      const original = await importOriginal<typeof import('./config.js')>();
      return {
        ...original,
        config: {
          ...original.config,
          GITHUB_CLIENT_ID: 'test_client_id',
          GITHUB_CLIENT_SECRET: 'test_client_secret',
        },
      };
    });
    const mockAccessToken = 'gho_test_token';
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({ access_token: mockAccessToken }),
      ok: true,
      status: 200, // Add status to mock response
    } as Response);
    vi.mocked(redis.set).mockResolvedValue('OK');

    // Re-initialize app after config mock and fetch mock
    app = await initializeWebServer(mockRedis as any, jobQueue as any);

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
    vi.doMock('./config.js', async (importOriginal) => {
      const original = await importOriginal<typeof import('./config.js')>();
      return {
        ...original,
        config: {
          ...original.config,
          GITHUB_CLIENT_ID: 'test_client_id',
          GITHUB_CLIENT_SECRET: 'test_client_secret',
        },
      };
    });
    // Re-initialize app after config mock
    app = await initializeWebServer(mockRedis as any, jobQueue as any);

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
    expect(res.body.error.message).toContain(
      'Missing code or GitHub credentials',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'GitHub OAuth callback error',
    );
  });

  it('should handle network errors during GitHub OAuth callback', async () => {
    vi.doMock('./config.js', async (importOriginal) => {
      const original = await importOriginal<typeof import('./config.js')>();
      return {
        ...original,
        config: {
          ...original.config,
          GITHUB_CLIENT_ID: 'test_client_id',
          GITHUB_CLIENT_SECRET: 'test_client_secret',
        },
      };
    });
    // Re-initialize app after config mock
    app = await initializeWebServer(mockRedis as any, jobQueue as any);

    vi.spyOn(global, 'fetch').mockRejectedValue(
      new TypeError('Network request failed'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app).get(
      '/api/auth/github/callback?code=test_code',
    );
    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toContain('Network request failed');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'GitHub OAuth network error',
    );
  });

  it('should handle GitHub OAuth callback with missing code', async () => {
    const res = await request(app).get('/api/auth/github/callback');
    expect(res.statusCode).toEqual(400);
    expect(res.body.error.message).toEqual(
      'Missing code or GitHub credentials',
    );
  });

  it('should return 500 if GITHUB_CLIENT_ID is missing for OAuth initiation', async () => {
    vi.mock('./config.js', async (importOriginal) => {
      const original = await importOriginal<typeof import('./config.js')>();
      return {
        ...original,
        config: {
          ...original.config,
          GITHUB_CLIENT_ID: undefined,
        },
      };
    });
    app = await initializeWebServer(mockRedis as any, jobQueue as any);

    const res = await request(app).get('/api/auth/github');
    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toEqual('GitHub Client ID not configured.');
  });

  it('should return 400 if GITHUB_CLIENT_SECRET is missing for OAuth callback', async () => {
    vi.mock('./config.js', async (importOriginal) => {
      const original = await importOriginal<typeof import('./config.js')>();
      return {
        ...original,
        config: {
          ...original.config,
          GITHUB_CLIENT_SECRET: undefined,
        },
      };
    });
    app = await initializeWebServer(mockRedis as any, jobQueue as any);

    const res = await request(app).get(
      '/api/auth/github/callback?code=test_code',
    );
    const errorSpy = vi.spyOn(logger, 'error');
    expect(res.statusCode).toEqual(400);
    expect(res.body.error.message).toContain(
      'Missing code or GitHub credentials',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'GitHub Client Secret not configured.',
    );
  });
});

describe('Server Initialization', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    errorSpy = vi.spyOn(logger, 'error');
  });

  it('should handle initialization errors gracefully', async () => {
    vi.spyOn(redis, 'duplicate').mockImplementation(() => {
      throw new Error('Redis connection failed during initialization');
    });

    // We expect initializeWebServer to throw, so we wrap it in a try/catch
    await expect(
      initializeWebServer(redis as any, jobQueue as any),
    ).rejects.toThrow('Redis connection failed during initialization');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error during web server initialization',
    );
  });
});

describe('Chat API Backend', () => {
  let app: express.Application;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
    errorSpy = vi.spyOn(logger, 'error');
  });

  it('should return 500 if jobQueue.add fails', async () => {
    vi.mocked(jobQueue.add).mockRejectedValue(
      new Error('Failed to add job to queue'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer test-api-key')
      .send({ prompt: 'test prompt' });

    expect(res.statusCode).toEqual(500);
    expect(res.body.error.message).toContain('Failed to add job to queue');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error adding job to queue',
    );
  });
});

describe('Job Management Backend', () => {
  let app: express.Application;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
    errorSpy = vi.spyOn(logger, 'error');
  });

  it('should return 500 if jobQueue.getJob fails in /api/interrupt', async () => {
    vi.mocked(jobQueue.getJob).mockRejectedValue(
      new Error('Failed to get job from queue'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .post('/api/interrupt/nonExistentJobId')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('Failed to get job from queue');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error interrupting job',
    );
  });

  it('should return 500 if jobQueue.getJob fails in /api/status', async () => {
    vi.mocked(jobQueue.getJob).mockRejectedValue(
      new Error('Failed to get job from queue'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .get('/api/status/nonExistentJobId')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('Failed to get job from queue');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error getting job status',
    );
  });
});

describe('Redis Publish Errors', () => {
  let app: express.Application;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
    errorSpy = vi.spyOn(logger, 'error');
  });

  it('should return 500 if redis.publish fails in /api/interrupt', async () => {
    vi.mocked(jobQueue.getJob).mockResolvedValue({ id: 'mockJobId' } as any);
    vi.spyOn(redis, 'publish').mockRejectedValue(
      new Error('Redis publish failed'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .post('/api/interrupt/mockJobId')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('Redis publish failed');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error interrupting job',
    );
  });

  it('should return 500 if redis.publish fails in /api/display', async () => {
    vi.spyOn(redis, 'publish').mockRejectedValue(
      new Error('Redis publish failed'),
    );
    vi.spyOn(fs, 'readFile').mockResolvedValue('<html>test</html>');
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .get('/api/display?file=index.html')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('Redis publish failed');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error sending display event',
    );
  });
});

describe('Memory API Backend', () => {
  let app: express.Application;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
    errorSpy = vi.spyOn(logger, 'error');
  });

  it('should return 500 if fs.promises.readdir fails', async () => {
    vi.spyOn(fs, 'readdir').mockRejectedValue(
      new Error('Failed to read directory'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .get('/api/memory')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('Failed to read directory');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error reading memory contents',
    );
  });

  it('should return 500 if fs.promises.readFile fails', async () => {
    vi.spyOn(fs, 'readdir').mockResolvedValue(['file1.txt'] as any);
    vi.spyOn(fs, 'readFile').mockRejectedValue(
      new Error('Failed to read file'),
    );
    const errorSpy = vi.spyOn(logger, 'error');

    const res = await request(app)
      .get('/api/memory')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('Failed to read file');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ _error: expect.any(Error) }),
      'Error reading memory contents',
    );
  });
});

describe('Error Handling Middleware', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
  });

  it('should handle AppError and return custom status code and message', async () => {
    app.get('/test-app-error', (req, res, next) => {
      next(new AppError('Custom App Error', { statusCode: 403 }));
    });

    const res = await request(app)
      .get('/test-app-error')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toEqual('Custom App Error');
  });

  it('should handle UserError and return custom status code and message', async () => {
    app.get('/test-user-error', (req, res, next) => {
      next(new UserError('Custom User Error'));
    });

    const res = await request(app)
      .get('/test-user-error')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(400); // UserError defaults to 400
    expect(res.body.error).toEqual('Custom User Error');
  });

  it('should handle generic Error and return 500', async () => {
    app.get('/test-generic-error', (req, res, next) => {
      next(new Error('Generic Error Message'));
    });

    const res = await request(app)
      .get('/test-generic-error')
      .set('Authorization', 'Bearer test-api-key');

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toEqual('Generic Error Message');
  });
});

describe('Authentication Backend', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    // Temporarily set AUTH_API_KEY to undefined for this test suite
    vi.mock('./config.js', async (importOriginal) => {
      const original = await importOriginal<typeof import('./config.js')>();
      return {
        ...original,
        config: {
          ...original.config,
          AUTH_API_KEY: undefined,
        },
      };
    });
    app = await initializeWebServer(mockRedis as any, jobQueue as any);
  });

  it('should not require authentication if AUTH_API_KEY is not set', async () => {
    const res = await request(app).get('/api/tools');
    expect(res.statusCode).toEqual(200);
  });
});
