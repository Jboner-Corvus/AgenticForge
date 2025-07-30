import express from 'express';
import request from 'supertest';

vi.mock('fs/promises', () => ({
  readdir: vi.fn().mockResolvedValue(['file1.txt']),
  readFile: vi.fn().mockResolvedValue('content of file1'),
  stat: vi.fn().mockResolvedValue({ size: 10 }),
}));

// Mock Redis and PostgreSQL clients at the top level
import { mockRedis } from '../test/mocks/redisClient.mock';
vi.mock('./modules/redis/redisClient.js', () => ({ redis: mockRedis }));

const mockPgClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  end: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
};
vi.mock('pg', () => ({ Client: () => mockPgClient }));

import { jobQueue } from './modules/queue/queue';
import { SessionManager } from './modules/session/sessionManager';
import * as toolLoader from './utils/toolLoader';
import { initializeWebServer } from './webServer';

vi.mock('./modules/session/sessionManager');

vi.mock('./utils/toolLoader');
vi.mock('./modules/queue/queue');
vi.mock('./modules/llm/LlmKeyManager');
vi.mock('jsonwebtoken');
vi.mock('fs/promises');
vi.mock('chokidar', () => ({
  watch: vi.fn(() => ({
    close: vi.fn(),
    on: vi.fn(),
  })),
}));

vi.mock('./config', async () => {
  return {
    config: {
      AUTH_API_KEY: 'test-api-key',
      LOG_LEVEL: 'debug',
      MAX_FILE_SIZE_BYTES: 1024 * 1024,
      NODE_ENV: 'test',
    },
    getConfig: vi.fn(() => ({
      AUTH_API_KEY: 'test-api-key',
      LOG_LEVEL: 'debug',
      MAX_FILE_SIZE_BYTES: 1024 * 1024,
      NODE_ENV: 'test',
    })),
  };
});

import { Server } from 'http';

describe('webServer', () => {
  let app: express.Application;
  let server: Server;

  beforeAll(async () => {
    const { initializeWebServer } = await import('./webServer');

    const webServer = await initializeWebServer(
      mockRedis as any,
      jobQueue,
      mockPgClient as any,
    );
    app = webServer.app;
    server = webServer.server;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
    if ((mockRedis as any).quit) {
      await (mockRedis as any).quit();
    }
    await mockPgClient.end();
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
});
