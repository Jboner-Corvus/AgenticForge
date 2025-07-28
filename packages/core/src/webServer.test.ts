import express from 'express';
import { promises as fs } from 'fs';
vi.mock('fs/promises', () => ({
  readdir: vi.fn().mockResolvedValue(['file1.txt']),
  readFile: vi.fn().mockResolvedValue('content of file1'),
  stat: vi.fn().mockResolvedValue({ size: 10 }),
}));

import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Redis and PostgreSQL clients at the top level
import { mockRedis } from '../test/mocks/redisClient.mock';
vi.mock('./modules/redis/redisClient.js', () => ({ redis: mockRedis }));

const mockPgClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  end: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
};
vi.mock('pg', () => ({ Client: () => mockPgClient }));

import { config } from './config';
import { jobQueue } from './modules/queue/queue';
import { SessionManager } from './modules/session/sessionManager';
import * as toolLoader from './utils/toolLoader';
import { initializeWebServer } from './webServer';

vi.mock('./modules/session/sessionManager');

vi.mock('./config');
vi.mock('./utils/toolLoader');
vi.mock('./modules/queue/queue');
vi.mock('./modules/llm/LlmKeyManager');
vi.mock('jsonwebtoken');
vi.mock('fs/promises');

describe('webServer', () => {
  let app: express.Application;

  beforeAll(async () => {
    config.AUTH_API_KEY = 'test-api-key';
    config.MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB
    app = await initializeWebServer(
      mockRedis as any,
      jobQueue,
      mockPgClient as any,
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis._resetStore();
    mockPgClient.query.mockResolvedValue({ rows: [] });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(jobQueue.add).mockResolvedValue({ id: 'mockJobId' } as any);
  });

  it('should return 200 for authorized access to /api/tools', async () => {
    const mockTools = [{ description: 'desc1', name: 'tool1', parameters: {} }];
    vi.spyOn(toolLoader, 'getTools').mockResolvedValue(mockTools as any);

    const res = await request(app)
      .get('/api/tools')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(mockTools);
  });

  it('should handle /api/chat/stream/:jobId correctly', async () => {
    const mockSubscriber = {
      on: vi.fn(),
      quit: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };
    mockRedis.duplicate.mockReturnValue(mockSubscriber as any);

    const testRequest = request(app)
      .get('/api/chat/stream/testJobId')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);

    // Execute the request and get the response stream
    const res = await testRequest; // This will wait for the initial headers

    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
      'job:testJobId:events',
    );

    // Simulate a message being published to the Redis channel
    mockSubscriber.on.mock.calls[0][1](
      'job:testJobId:events',
      '{"type":"test","content":"hello"}',
    );

    // Explicitly destroy the client-side response stream to trigger server-side 'close'
    testRequest.abort(); // This should trigger req.on('close') on the server side

    // Wait for cleanup to be called by the server's req.on('close') handler
    await vi.waitFor(
      () => {
        expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith(
          'job:testJobId:events',
        );
        expect(mockSubscriber.quit).toHaveBeenCalled();
      },
      { timeout: 10000 },
    ); // Give it some time for async cleanup
  }, 10000);

  it('should return 200 for /api/session', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual(
      'Session managed automatically via cookie/header.',
    );
  });

  it('should load a session via /api/sessions/:id', async () => {
    const sessionData = {
      history: [],
      id: 's1',
      identities: [],
      name: 'test',
      timestamp: Date.now(),
    };
    vi.mocked(SessionManager.prototype.getSession).mockResolvedValue(
      sessionData,
    );

    const res = await request(app)
      .get('/api/sessions/s1')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual('s1');
  });

  it('should rename a session via /api/sessions/:id/rename', async () => {
    mockPgClient.query.mockResolvedValue({ rows: [{ id: 's1' }] }); // for getSession
    mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // for renameSession

    const res = await request(app)
      .put('/api/sessions/s1/rename')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
      .send({ newName: 'newName' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Session renamed successfully.');
  });

  it('should handle /api/display correctly', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue('content');

    const res = await request(app)
      .get('/api/display?file=test.txt')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);

    expect(res.statusCode).toEqual(200);
    expect(mockRedis.publish).toHaveBeenCalled();
  });
});
