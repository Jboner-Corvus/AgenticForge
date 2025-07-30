import { Job } from 'bullmq';
import express from 'express';
import { Client } from 'pg';
import request from 'supertest';
import { Mock, vi } from 'vitest';

vi.mock('fs/promises', () => ({
  readdir: vi.fn().mockResolvedValue(['file1.txt']),
  readFile: vi.fn().mockResolvedValue('content of file1'),
  stat: vi.fn().mockResolvedValue({ size: 10 }),
}));

import type { SessionData } from '@/types';

import { mockRedis } from '../test/mocks/redisClient.mock';

vi.mock('./modules/redis/redisClient.js', () => ({
  redisClient: mockRedis,
}));
vi.mock('./logger.js', () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

const mockPgClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  end: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
} as unknown as Client;

vi.mock('pg', () => ({
  Client: vi.fn(() => mockPgClient),
  QueryResult: vi.fn(() => ({
    command: '',
    fields: [],
    oid: 0,
    rowCount: 0,
    rows: [],
  })),
}));

import { getJobQueue } from './modules/queue/queue';
import { SessionManager } from './modules/session/sessionManager';
import * as toolLoader from './utils/toolLoader';

vi.mock('./modules/session/sessionManager');

vi.mock('./utils/toolLoader');

vi.mock('bullmq', async () => {
  const actual = await vi.importActual<typeof import('bullmq')>('bullmq');
  return {
    ...actual,
    Queue: vi.fn(() => ({
      add: vi.fn((name: string, data: any, opts?: any) => {
        return Promise.resolve({ data, id: 'mockJobId', name, opts } as Job);
      }),
      emit: vi.fn(),
      libName: 'mock-bullmq',
      off: vi.fn(),
      on: vi.fn(),
    })),
  };
});
vi.mock('./modules/llm/LlmKeyManager');
vi.mock('jsonwebtoken');
vi.mock('fs/promises');
vi.mock('chokidar', async () => {
  const actual = await vi.importActual('chokidar');
  return {
    ...actual,
    watch: vi.fn(() => ({
      close: vi.fn(),
      on: vi.fn(),
    })),
  };
});

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

import { config } from './config';

const mockConfigWatcher = {
  close: vi.fn(),
  on: vi.fn(),
};

vi.mock('./webServer', async () => {
  const actual = await vi.importActual<typeof import('./webServer')>('./webServer');
  return {
    ...actual,
    configWatcher: mockConfigWatcher,
    initializeWebServer: vi.fn(actual.initializeWebServer) as typeof actual.initializeWebServer,
  };
});

describe('webServer', () => {
  let app: express.Application;
  let server: Server;

  beforeAll(async () => {
    const { initializeWebServer } = await import('./webServer');

    const webServer = await initializeWebServer(getJobQueue() as any, mockPgClient as any);
    app = webServer.app;
    server = webServer.server;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }
    // Ensure the config watcher is closed after all tests
    if (mockConfigWatcher) {
      mockConfigWatcher.close();
    }
    if ((mockRedis as any).quit) {
      await (mockRedis as any).quit();
    }
    await mockPgClient.end();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis._resetStore();

    (mockPgClient.query as Mock).mockResolvedValue({ rows: [] });
    vi.spyOn(console, 'log').mockImplementation(() => {});
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
    const sessionData: SessionData = {
      history: [],
      id: 's1',
      identities: [],
      name: 'test',
      timestamp: Date.now(),
    };
    vi.spyOn(SessionManager.prototype, 'getSession').mockResolvedValue(
      sessionData as any,
    );

    const res = await request(app)
      .get('/api/sessions/s1')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual('s1');
  });

  it('should rename a session via /api/sessions/:id/rename', async () => {
    (mockPgClient.query as Mock).mockResolvedValueOnce({
      command: 'SELECT',
      fields: [],
      oid: 0,
      rowCount: 1,
      rows: [{ id: 's1' }],
    }); // for getSession
    (mockPgClient.query as Mock).mockResolvedValueOnce({
      command: 'UPDATE',
      fields: [],
      oid: 0,
      rowCount: 0,
      rows: [],
    }); // for renameSession

    const res = await request(app)
      .put('/api/sessions/s1/rename')
      .set('Authorization', `Bearer ${config.AUTH_API_KEY}`)
      .send({ newName: 'newName' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Session renamed successfully.');
  });
});
