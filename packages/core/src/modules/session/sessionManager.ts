import { Job, Queue } from 'bullmq';
import { Content } from 'fastmcp';
import { Client as PgClient } from 'pg';

import { config } from '../../config.js';
import { getLogger, Logger } from '../../logger.js';
import {
  ILlmProvider as _ILlmProvider,
  MinimalJob as _MinimalJob,
  Ctx,
  Message,
  SessionData,
} from '../../types.js';
import { getLlmProvider } from '../../utils/llmProvider.js';
import { getRedisClientInstance } from '../redis/redisClient.js';
import { summarizeTool } from '../tools/definitions/ai/summarize.tool.js';

export type Session = SessionData;

export class SessionManager {
  private static activeSessions = new Map<string, SessionData>();
  private pgClient: PgClient;

  constructor(pgClient: PgClient) {
    this.pgClient = pgClient;
    this.initDb();
  }

  public static clearActiveSessionsForTest(): void {
    SessionManager.activeSessions.clear();
  }

  private static createToolContext(
    _job: Job,
    session: SessionData,
    _taskQueue: Queue,
    log: Logger,
  ): Ctx {
    return {
      job: _job,
      llm: getLlmProvider(session.activeLlmProvider || 'gemini'), // Default to 'gemini' if not set
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
      streamContent: async (
        content: Content | Content[],
        toolName?: string,
      ) => {
        log.debug(`Tool stream: ${JSON.stringify(content)}`);
        const channel = `job:${_job.id}:events`;
        let contentString: string;
        if (Array.isArray(content)) {
          contentString = content.map((c) => c.toString()).join('');
        } else {
          contentString = String(content);
        }
        const message = JSON.stringify({
          content: contentString,
          toolName: toolName || 'unknown_tool',
          type: 'tool_stream',
        });
        getRedisClientInstance().publish(channel, message);
      },
      taskQueue: _taskQueue,
    };
  }

  private static async summarizeHistory(
    session: SessionData,
    _job: Job,
    taskQueue: Queue,
  ) {
    const log = getLogger().child({
      module: 'Summarizer',
      sessionId: session.id,
    });
    log.info('History length exceeds max length, summarizing...');
    const historyToSummarize = session.history.slice(
      0,
      session.history.length - config.HISTORY_MAX_LENGTH,
    );
    const textToSummarize = historyToSummarize
      .map((msg: Message) => {
        if ('content' in msg && typeof msg.content === 'string') {
          return `${msg.type}: ${msg.content}`;
        }
        return '';
      })
      .join('\n');

    try {
      const context = this.createToolContext(_job, session, taskQueue, log);
      const summary = await summarizeTool.execute(
        { text: textToSummarize },
        context,
      );
      const summarizedMessage: Message = {
        content: `Summarized conversation: ${String(summary)}`,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'agent_response',
      };
      session.history = [
        summarizedMessage,
        ...session.history.slice(-(config.HISTORY_MAX_LENGTH - 1)),
      ];
      log.info('History summarized successfully.');
    } catch (error) {
      log.error({ error }, 'Error summarizing history');
      throw error;
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.pgClient.query('DELETE FROM sessions WHERE id = $1', [
      sessionId,
    ]);
    SessionManager.activeSessions.delete(sessionId);
    getLogger().info(
      { sessionId },
      'Session deleted from PostgreSQL and memory.',
    );
  }

  public async getAllSessions(): Promise<SessionData[]> {
    const res = await this.pgClient.query(
      'SELECT id, name, timestamp, identities FROM sessions ORDER BY timestamp DESC',
    );
    return res.rows.map((row) => ({
      history: [],
      id: row.id,
      identities: row.identities || [],
      name: row.name,
      timestamp: parseInt(row.timestamp, 10),
    }));
  }

  public async getSession(sessionId: string): Promise<SessionData> {
    if (SessionManager.activeSessions.has(sessionId)) {
      getLogger().info(
        { sessionId },
        'Reusing existing session data from memory.',
      );
      return SessionManager.activeSessions.get(sessionId)!;
    }

    const res = await this.pgClient.query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId],
    );
    let initialHistory: Message[] = [];
    let sessionName = `Session ${new Date().toLocaleString()}`;
    let sessionTimestamp = Date.now();
    let identities: any[] = [];
    let activeLlmProvider: string | undefined = undefined; // Initialize new field

    if (res.rows.length > 0) {
      const storedSession = res.rows[0];
      try {
        if (typeof storedSession.messages === 'string') {
          initialHistory = JSON.parse(storedSession.messages) as Message[];
        } else if (Array.isArray(storedSession.messages)) {
          initialHistory = storedSession.messages as Message[];
        }
      } catch (error) {
        getLogger().error(
          { error, sessionId },
          'Failed to parse messages from DB, initializing with empty history.',
        );
        initialHistory = [];
      }
      sessionName = storedSession.name;
      sessionTimestamp = parseInt(storedSession.timestamp, 10);
      identities = storedSession.identities || [];
      activeLlmProvider = storedSession.active_llm_provider || undefined; // Retrieve new field
    } else {
      getLogger().info(
        { sessionId },
        'No session found in PostgreSQL, creating new one.',
      );
    }

    const historyToUse =
      config.HISTORY_LOAD_LENGTH > 0 &&
      initialHistory.length > config.HISTORY_LOAD_LENGTH
        ? initialHistory.slice(-config.HISTORY_LOAD_LENGTH)
        : initialHistory;

    const sessionData: SessionData = {
      activeLlmProvider: activeLlmProvider, // Add to sessionData
      history: historyToUse,
      id: sessionId,
      identities: identities,
      name: sessionName,
      timestamp: sessionTimestamp,
    };

    SessionManager.activeSessions.set(sessionId, sessionData);
    getLogger().info(
      { sessionId },
      'Created new session data from PostgreSQL.',
    );
    return sessionData;
  }

  public async renameSession(
    sessionId: string,
    newName: string,
  ): Promise<SessionData> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found.`);
    }

    session.name = newName;
    await this.pgClient.query('UPDATE sessions SET name = $1 WHERE id = $2', [
      newName,
      sessionId,
    ]);
    SessionManager.activeSessions.set(sessionId, session);
    getLogger().info(
      { newName, sessionId },
      'Session renamed in PostgreSQL and memory.',
    );
    return session;
  }

  public async saveSession(
    session: SessionData,
    job: Job | undefined,
    taskQueue: Queue,
  ): Promise<void> {
    try {
      if (session.history.length > config.HISTORY_MAX_LENGTH && job) {
        await SessionManager.summarizeHistory(session, job, taskQueue);
      }

      await this.pgClient.query(
        'INSERT INTO sessions (id, name, messages, timestamp, identities, active_llm_provider) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, messages = EXCLUDED.messages, timestamp = EXCLUDED.timestamp, identities = EXCLUDED.identities, active_llm_provider = EXCLUDED.active_llm_provider',
        [
          session.id,
          session.name,
          JSON.stringify(session.history),
          session.timestamp as any,
          JSON.stringify(session.identities),
          session.activeLlmProvider || null, // Save the new field
        ],
      );
      SessionManager.activeSessions.set(session.id as string, session);
      getLogger().info(
        { sessionId: session.id },
        'Session history saved to PostgreSQL.',
      );
    } catch (error) {
      getLogger().error({ error }, 'Error saving session');
      throw error;
    }
  }

  private async initDb() {
    await this.pgClient.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        messages JSONB NOT NULL,
        timestamp BIGINT NOT NULL,
        identities JSONB,
        active_llm_provider VARCHAR(255) -- New column
      );
    `);
    getLogger().info('PostgreSQL sessions table ensured.');
  }
}
