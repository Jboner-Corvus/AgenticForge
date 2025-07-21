import type { Mock } from 'vitest';

/// <reference types="vitest/globals" />
import { Job, Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '../../config.js';
import logger from '../../logger.js';
import { Message, SessionData } from '../../types.js';
import { redis } from '../redis/redisClient.js';
import { summarizeTool } from '../tools/definitions/ai/summarize.tool.js';
import { SessionManager } from './sessionManager.js';

// Mock dependencies
vi.mock('../../config.js', () => ({
  config: {
    HISTORY_MAX_LENGTH: 5,
    REDIS_DB: 0,
  },
}));

vi.mock('../../logger.js', () => ({
  default: {
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(), // Added warn mock
  },
}));

vi.mock('../redis/redisClient.js', () => ({
  redis: {
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      quit: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    get: vi.fn(),
    on: vi.fn(),
    options: { keyPrefix: '' },
    publish: vi.fn(),
    select: vi.fn().mockResolvedValue('OK'),
    set: vi.fn(),
  },
}));

vi.mock('../tools/definitions/ai/summarize.tool.js', async () => {
  const actual = await vi.importActual<
    typeof import('../tools/definitions/ai/summarize.tool.js')
  >('../tools/definitions/ai/summarize.tool.js');
  return {
    ...actual,
    summarizeTool: {
      ...actual.summarizeTool,
      execute: vi.fn(),
    },
  };
});

// Mock BullMQ Queue if it's directly instantiated in SessionManager (it's passed in saveSession)
const MockQueue = vi.fn(() => ({
  add: vi.fn(),
})) as unknown as Mock<[], Queue>;

describe('SessionManager', () => {
  let mockJob: Job;
  let mockTaskQueue: Queue;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the internal activeSessions map for each test
    // @ts-expect-error - Accessing private static property for testing
    SessionManager.activeSessions = new Map<string, SessionData>();

    mockJob = {
      data: {},
      id: 'test-job-id',
    } as unknown as Job;

    mockTaskQueue = new MockQueue();
  });

  // Test getSession
  it('should return an existing session from memory if available', async () => {
    const sessionId = 'session1';
    const existingSession: SessionData = {
      history: [{ content: 'Hello', role: 'user' }],
      id: sessionId,
      identities: [],
    };
    // @ts-expect-error - For testing private static property
    SessionManager.activeSessions.set(sessionId, existingSession);

    const session = await SessionManager.getSession(sessionId);

    expect(session).toBe(existingSession);
    expect(redis.get).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      { sessionId },
      'Reusing existing session data from memory.',
    );
  });

  it('should retrieve a new session from Redis and store it in memory', async () => {
    const sessionId = 'session2';
    const storedHistory: Message[] = [
      { content: 'Hi', role: 'user' },
      { content: 'Hello there', role: 'model' },
    ];
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(storedHistory));

    const session = await SessionManager.getSession(sessionId);

    expect(session.id).toBe(sessionId);
    expect(session.history).toEqual(storedHistory);
    expect(redis.get).toHaveBeenCalledWith(`session:${sessionId}:history`);
    // @ts-expect-error - For testing private static property
    expect(SessionManager.activeSessions.get(sessionId)).toBe(session);
    expect(logger.info).toHaveBeenCalledWith(
      { sessionId },
      'Created new session data from Redis.',
    );
  });

  it('should create a new session with empty history if not in Redis', async () => {
    const sessionId = 'session3';
    vi.mocked(redis.get).mockResolvedValueOnce(null);

    const session = await SessionManager.getSession(sessionId);

    expect(session.id).toBe(sessionId);
    expect(session.history).toEqual([]);
    expect(redis.get).toHaveBeenCalledWith(`session:${sessionId}:history`);
    // @ts-expect-error - For testing private static property
    expect(SessionManager.activeSessions.get(sessionId)).toBe(session);
    expect(logger.info).toHaveBeenCalledWith(
      { sessionId },
      'Created new session data from Redis.',
    );
  });

  // Test saveSession
  it('should save session history to Redis and update in memory', async () => {
    const sessionId = 'session4';
    const session: SessionData = {
      history: [{ content: 'Test message', role: 'user' }],
      id: sessionId,
      identities: [],
    };

    await SessionManager.saveSession(session, mockJob, mockTaskQueue);

    expect(redis.set).toHaveBeenCalledWith(
      `session:${sessionId}:history`,
      JSON.stringify(session.history),
      'EX',
      expect.any(Number),
    );
    // @ts-expect-error - For testing private static property
    expect(SessionManager.activeSessions.get(sessionId)).toBe(session);
    expect(logger.info).toHaveBeenCalledWith(
      { sessionId },
      'Session history saved to Redis.',
    );
    expect(summarizeTool.execute).not.toHaveBeenCalled();
  });

  it('should summarize history if it exceeds max length', async () => {
    const sessionId = 'session5';
    const longHistory: Message[] = Array.from({ length: 10 }, (_, i) => ({
      content: `Message ${i + 1}`,
      role: 'user',
    }));
    const session: SessionData = {
      history: longHistory,
      id: sessionId,
      identities: [],
    };

    vi.mocked(summarizeTool.execute).mockResolvedValueOnce(
      'Summarized content',
    );

    await SessionManager.saveSession(session, mockJob, mockTaskQueue);

    expect(summarizeTool.execute).toHaveBeenCalledTimes(1);
    expect(summarizeTool.execute).toHaveBeenCalledWith(
      { text: expect.stringContaining('Message 1') }, // Should contain early messages
      expect.any(Object),
    );
    expect(session.history.length).toBe(config.HISTORY_MAX_LENGTH);
    expect(session.history[0].content).toContain('Summarized conversation');
    expect(session.history[session.history.length - 1].content).toBe(
      'Message 10',
    ); // Last 10 messages should remain
    expect(redis.set).toHaveBeenCalledTimes(1);
  });

  it('should log an error if history summarization fails', async () => {
    const sessionId = 'session6';
    const longHistory: Message[] = Array.from({ length: 10 }, (_, i) => ({
      content: `Message ${i + 1}`,
      role: 'user',
    }));
    const session: SessionData = {
      history: longHistory,
      id: sessionId,
      identities: [],
    };

    const mockError = new Error('Summarization failed');
    (summarizeTool.execute as Mock).mockRejectedValueOnce(mockError);

    await SessionManager.saveSession(session, mockJob, mockTaskQueue);

    expect(summarizeTool.execute).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      { error: mockError },
      'Error summarizing history',
    );
    // Ensure session is still saved even if summarization fails
    expect(redis.set).toHaveBeenCalledTimes(1);
  });
});
