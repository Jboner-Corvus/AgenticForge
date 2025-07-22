import { Job, Queue } from 'bullmq';
import { Content } from 'fastmcp';

import { Ctx, Message, SessionData } from '@/types.js';

import { config } from '../../config.js';
import logger from '../../logger.js';
import { llmProvider } from '../../utils/llmProvider.js';
import { redis } from '../redis/redisClient.js';
import { summarizeTool } from '../tools/definitions/ai/summarize.tool.js';

const SESSION_EXPIRATION = 7 * 24 * 60 * 60; // 7 days

export type Session = SessionData;

export class SessionManager {
  private static readonly activeSessions = new Map<string, SessionData>();

  public static async getSession(sessionId: string): Promise<SessionData> {
    if (this.activeSessions.has(sessionId)) {
      logger.info({ sessionId }, 'Reusing existing session data from memory.');
      return this.activeSessions.get(sessionId)!;
    }

    const historyKey = `session:${sessionId}:history`;
    const storedHistory = await redis.get(historyKey);
    const initialHistory: Message[] = storedHistory
      ? JSON.parse(storedHistory)
      : [];

    const sessionData: SessionData = {
      history: initialHistory,
      id: sessionId,
      identities: [{ id: 'user', type: 'email' }], // Placeholder
    };

    this.activeSessions.set(sessionId, sessionData);
    logger.info({ sessionId }, 'Created new session data from Redis.');
    return sessionData;
  }

  public static async saveSession(
    session: SessionData,
    job: Job,
    taskQueue: Queue,
  ): Promise<void> {
    if (session.history.length > config.HISTORY_MAX_LENGTH) {
      await this.summarizeHistory(session, job, taskQueue);
    }

    const historyKey = `session:${session.id}:history`;
    const historyJson = JSON.stringify(session.history);

    await redis.set(historyKey, historyJson, 'EX', SESSION_EXPIRATION);
    this.activeSessions.set(session.id, session);
    logger.info({ sessionId: session.id }, 'Session history saved to Redis.');
  }

  private static createToolContext(
    job: Job,
    session: SessionData,
    taskQueue: Queue,
    log: typeof logger,
  ): Ctx {
    return {
      job,
      llm: llmProvider,
      log,
      reportProgress: async (progress: {
        current: number;
        total: number;
        unit?: string;
      }) => {
        log.debug(
          `Tool progress: ${progress.current}/${progress.total} ${
            progress.unit || ''
          }`,
        );
      },
      session,
      streamContent: async (content: Content | Content[]) => {
        log.debug(`Tool stream: ${JSON.stringify(content)}`);
      },
      taskQueue,
    };
  }

  private static async summarizeHistory(
    session: SessionData,
    job: Job,
    taskQueue: Queue,
  ) {
    const log = logger.child({ module: 'Summarizer', sessionId: session.id });
    log.info('History length exceeds max length, summarizing...');
    const historyToSummarize = session.history.slice(
      0,
      session.history.length - config.HISTORY_MAX_LENGTH,
    );
    const textToSummarize = historyToSummarize
      .map((msg: Message) => `${msg.role}: ${msg.content}`)
      .join('\n');

    try {
      const context = this.createToolContext(job, session, taskQueue, log);
      const summary = await summarizeTool.execute(
        { text: textToSummarize },
        context,
      );
      const summarizedMessage: Message = {
        content: `Summarized conversation: ${summary}`,
        role: 'model',
      };
      session.history = [
        summarizedMessage,
        ...session.history.slice(-(config.HISTORY_MAX_LENGTH - 1)),
      ];
      log.info('History summarized successfully.');
    } catch (error) {
      log.error({ error }, 'Error summarizing history');
    }
  }
}
