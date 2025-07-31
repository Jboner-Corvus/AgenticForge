import { Client as PgClient } from 'pg';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger first to prevent it from calling getConfig during module load
vi.mock('../../logger.js', () => ({
  getLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      trace: vi.fn(),
      warn: vi.fn(),
    })),
    debug: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    info: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
  })),
}));

import { config } from '../../config';
import { summarizeTool } from '../tools/definitions/ai/summarize.tool';

// Mock dependencies
vi.mock('pg', () => {
  const mClient = {
    connect: vi.fn(),
    end: vi.fn(),
    query: vi.fn(),
  };
  return { Client: vi.fn(() => mClient) };
});

vi.mock('../../modules/tools/definitions/ai/summarize.tool', () => ({
  summarizeTool: {
    execute: vi.fn(),
  },
}));

vi.mock('../../modules/redis/redisClient.js', () => ({
  getRedisClient: vi.fn(() => ({
    del: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

vi.mock('../../config', async () => {
  const actual = await vi.importActual('../../config');
  const mockConfig = {
    ...(actual as any).config,
    HISTORY_MAX_LENGTH: 10,
    LOG_LEVEL: 'debug',
    NODE_ENV: 'test',
  };
  return {
    ...actual,
    config: mockConfig,
    getConfig: vi.fn(() => mockConfig),
  };
});

import { Job, Queue } from 'bullmq';

import { Message, SessionData } from '../../types';
import { SessionManager } from './sessionManager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockPgClient: any;
  let mockJob: Job;
  let mockTaskQueue: Queue;

  beforeEach(() => {
    mockPgClient = new PgClient();
    sessionManager = new SessionManager(mockPgClient);
    vi.clearAllMocks();
    SessionManager.clearActiveSessionsForTest();

    mockJob = { id: 'test-job-id', updateProgress: vi.fn() } as unknown as Job;
    mockTaskQueue = { add: vi.fn() } as unknown as Queue;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a new session if one does not exist in the database', async () => {
    mockPgClient.query.mockResolvedValue({ rows: [] });
    const session = await sessionManager.getSession('new-session-id');
    expect(session).toBeDefined();
    expect(session.id).toBe('new-session-id');
    expect(session.history).toEqual([]);
    expect(session.name).toContain('Session');
  });

  it('should load an existing session from the database', async () => {
    const mockSessionData = {
      id: 'existing-session-id',
      identities: [],
      messages: JSON.stringify([
        { content: 'Hello', id: '1', timestamp: Date.now(), type: 'user' },
      ]),
      name: 'Existing Session',
      timestamp: Date.now(),
    };
    mockPgClient.query.mockResolvedValue({ rows: [mockSessionData] });

    const session = await sessionManager.getSession('existing-session-id');
    expect(session).toBeDefined();
    expect(session.id).toBe('existing-session-id');
    expect(session.name).toBe('Existing Session');
    expect(session.history).toHaveLength(1);
    expect(session.history[0].type).toBe('user');
  });

  it('should save a session to the database', async () => {
    const session: SessionData = {
      history: [
        { content: 'Test', id: '1', timestamp: Date.now(), type: 'user' },
      ],
      id: 'session-to-save',
      identities: [],
      name: 'Session to Save',
      timestamp: Date.now(),
    };
    mockPgClient.query.mockResolvedValue({ rows: [] });
    await sessionManager.saveSession(session, mockJob, mockTaskQueue);
    expect(mockPgClient.query).toHaveBeenCalledWith(
      'INSERT INTO sessions (id, name, messages, timestamp, identities, active_llm_provider) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, messages = EXCLUDED.messages, timestamp = EXCLUDED.timestamp, identities = EXCLUDED.identities, active_llm_provider = EXCLUDED.active_llm_provider',
      [
        'session-to-save',
        'Session to Save',
        JSON.stringify(session.history),
        session.timestamp,
        JSON.stringify(session.identities),
        null,
      ],
    );
  });

  it('should summarize history if it exceeds HISTORY_MAX_LENGTH', async () => {
    config.HISTORY_MAX_LENGTH = 5;
    const longHistory: Message[] = Array.from({ length: 10 }, (_, i) => ({
      content: `Message ${i}`,
      id: `${i}`,
      timestamp: Date.now(),
      type: 'user',
    }));
    const session: SessionData = {
      history: longHistory,
      id: 'long-history-session',
      identities: [],
      name: 'Long History Session',
      timestamp: Date.now(),
    };

    vi.mocked(summarizeTool.execute).mockResolvedValue('This is a summary.');
    mockPgClient.query.mockResolvedValue({ rows: [] });

    await sessionManager.saveSession(session, mockJob, mockTaskQueue);

    expect(summarizeTool.execute).toHaveBeenCalled();
    expect(session.history.length).toBe(config.HISTORY_MAX_LENGTH);
    expect(session.history[0].type).toBe('agent_response');
    expect((session.history[0] as { content: string }).content).toContain(
      'Summarized conversation',
    );
  });

  it('should delete a session from the database', async () => {
    mockPgClient.query.mockResolvedValue({ rows: [] });
    await sessionManager.deleteSession('session-to-delete');
    expect(mockPgClient.query).toHaveBeenCalledWith(
      'DELETE FROM sessions WHERE id = $1',
      ['session-to-delete'],
    );
  });

  it('should retrieve all sessions from the database', async () => {
    const mockSessions = [
      {
        id: 's1',
        identities: [],
        name: 'Session 1',
        timestamp: Date.now(),
      },
      {
        id: 's2',
        identities: [],
        name: 'Session 2',
        timestamp: Date.now() - 1000,
      },
    ];
    mockPgClient.query.mockResolvedValue({ rows: mockSessions });
    const sessions = await sessionManager.getAllSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].name).toBe('Session 1');
    expect(sessions[1].name).toBe('Session 2');
  });
});
