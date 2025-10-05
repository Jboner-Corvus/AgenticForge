import { Job, Queue } from 'bullmq';
import { Content } from 'fastmcp';
import { Client as PgClient } from 'pg';

import { config } from '../../config.ts';
import { getLogger, Logger } from '../../logger.ts';
import {
  ILlmProvider as _ILlmProvider,
  MinimalJob as _MinimalJob,
  Ctx,
  Message,
  SessionData,
} from '../../types.ts';
import { getLlmProvider } from '../../utils/llmProvider.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';
import { summarizeTool } from '../tools/definitions/ai/summarize.tool.ts';

// 🚀 Enhanced Memory System for Semantic Compression
interface SemanticMemory {
  keyDecisions: Array<{decision: string; context: string; timestamp: number}>;
  codePatterns: Array<{pattern: string; file?: string; usage: string}>;
  userPreferences: Record<string, any>;
  conversationThemes: string[];
  importantInsights: Array<{insight: string; context: string; importance: 'low' | 'medium' | 'high'}>;
}

interface CompressedHistory {
  semanticMemory: SemanticMemory;
  recentMessages: Message[]; // Only recent, important messages
  summary: string; // Generated summary of older messages
  compressionRatio: number; // How much was compressed
}

export type Session = SessionData;

export class SessionManager {
  private static activeSessions = new Map<string, SessionData>();
  private pgClient: PgClient;

  private constructor(pgClient: PgClient) {
    this.pgClient = pgClient;
  }

  public static clearActiveSessionsForTest(): void {
    SessionManager.activeSessions.clear();
  }

  public static async create(pgClient: PgClient): Promise<SessionManager> {
    const manager = new SessionManager(pgClient);
    await manager.initDb();
    return manager;
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

  // 🚀 ENHANCED SEMANTIC MEMORY: Claude Code-inspired memory compression
  private static async compressHistorySemantically(
    session: SessionData,
    _job: Job,
    taskQueue: Queue,
  ): Promise<CompressedHistory> {
    const log = getLogger().child({
      module: 'SemanticCompressor',
      sessionId: session.id,
    });

    log.info('Performing semantic compression...');

    // Initialize semantic memory
    const semanticMemory: SemanticMemory = {
      keyDecisions: [],
      codePatterns: [],
      userPreferences: {},
      conversationThemes: [],
      importantInsights: []
    };

    // Split history: recent messages (keep) vs older messages (compress)
    const recentMessageCount = Math.min(50, config.HISTORY_MAX_LENGTH / 2);
    const recentMessages = session.history.slice(-recentMessageCount);
    const olderMessages = session.history.slice(0, -recentMessageCount);

    // Extract semantic information from older messages
    for (const message of olderMessages) {
      this.extractSemanticInfo(message, semanticMemory);
    }

    // Generate intelligent summary
    const summary = await this.generateSemanticSummary(olderMessages, semanticMemory, _job, taskQueue, log);

    // Calculate compression ratio
    const compressionRatio = (olderMessages.length - 1) / olderMessages.length;

    log.info(`Semantic compression completed: ${compressionRatio.toFixed(2)} ratio, ${semanticMemory.keyDecisions.length} decisions, ${semanticMemory.codePatterns.length} patterns`);

    return {
      semanticMemory,
      recentMessages,
      summary,
      compressionRatio
    };
  }

  /**
   * Extract semantic information from a message
   */
  private static extractSemanticInfo(message: Message, memory: SemanticMemory): void {
    const content = 'content' in message ? String(message.content) : '';
    const lowerContent = content.toLowerCase();

    // Extract decisions and intentions
    if (message.type === 'user') {
      // User preferences and intentions
      if (lowerContent.includes('prefer') || lowerContent.includes('like') || lowerContent.includes('want')) {
        const preference = content.match(/prefer (.+)|like (.+)|want (.+)/i)?.[0];
        if (preference) {
          memory.userPreferences.communication = preference;
        }
      }
    } else if (message.type === 'agent_response') {
      // Agent decisions and insights
      const decisionPatterns = [
        /I (will|shall|should|must|need to)/gi,
        /going to/gi,
        /decided to/gi,
        /plan to/gi
      ];

      for (const pattern of decisionPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          memory.keyDecisions.push({
            decision: matches[0],
            context: content.substring(0, 100),
            timestamp: message.timestamp
          });
        }
      }

      // Important insights (numbered lists, conclusions, summaries)
      if (content.includes(':') || content.includes('•') || content.includes('-') || content.includes('Conclusion')) {
        const insightMatch = content.match(/^([^:\n]+)[:\n]\s*(.+)$/m);
        if (insightMatch) {
          memory.importantInsights.push({
            insight: insightMatch[2].substring(0, 100),
            context: insightMatch[1],
            importance: content.includes('important') || content.includes('critical') ? 'high' : 'medium'
          });
        }
      }
    } else if (message.type === 'tool_call') {
      // Tool usage patterns
      const toolName = (message as any).toolName || '';
      if (toolName.includes('File') || toolName.includes('write') || toolName.includes('read')) {
        memory.codePatterns.push({
          pattern: `File operation: ${toolName}`,
          usage: content.substring(0, 50)
        });
      }
    }

    // Extract themes and topics
    const themes = this.extractThemes(content);
    themes.forEach(theme => {
      if (!memory.conversationThemes.includes(theme)) {
        memory.conversationThemes.push(theme);
      }
    });

    // Keep only most important items to prevent memory bloat
    if (memory.keyDecisions.length > 20) {
      memory.keyDecisions = memory.keyDecisions.slice(-20);
    }
    if (memory.importantInsights.length > 15) {
      memory.importantInsights = memory.importantInsights.slice(-15);
    }
    if (memory.codePatterns.length > 30) {
      memory.codePatterns = memory.codePatterns.slice(-30);
    }
    if (memory.conversationThemes.length > 10) {
      memory.conversationThemes = memory.conversationThemes.slice(-10);
    }
  }

  /**
   * Extract conversation themes from content
   */
  private static extractThemes(content: string): string[] {
    const themes: string[] = [];
    const lowerContent = content.toLowerCase();

    const themeKeywords = {
      'development': ['develop', 'code', 'implement', 'build', 'create'],
      'testing': ['test', 'verify', 'check', 'debug', 'fix'],
      'planning': ['plan', 'design', 'architecture', 'structure'],
      'documentation': ['document', 'explain', 'describe', 'comment'],
      'optimization': ['optimize', 'improve', 'performance', 'efficiency'],
      'deployment': ['deploy', 'release', 'publish', 'production'],
      'troubleshooting': ['error', 'issue', 'problem', 'troubleshoot']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes;
  }

  /**
   * Generate semantic summary using LLM
   */
  private static async generateSemanticSummary(
    messages: Message[],
    memory: SemanticMemory,
    _job: Job,
    taskQueue: Queue,
    log: Logger
  ): Promise<string> {
    if (messages.length === 0) return '';

    // Convert messages to text
    const textToSummarize = messages
      .map((msg: Message) => {
        if ('content' in msg && typeof msg.content === 'string') {
          return `${msg.type}: ${msg.content}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');

    if (textToSummarize.length < 100) {
      return textToSummarize; // Too short to summarize
    }

    try {
      // Create a minimal session context for the summarization tool
      const tempSession: SessionData = {
        history: messages,
        id: 'temp-summarization',
        identities: [],
        name: 'Temp Summarization Session',
        timestamp: Date.now()
      };
      const context = this.createToolContext(_job, tempSession, taskQueue, log);

      // Enhanced prompt for semantic summarization
      const enhancedPrompt = `Please provide a comprehensive but concise summary of this conversation. Focus on:

1. Key decisions made and important outcomes
2. Technical patterns and code changes discussed
3. User preferences and requirements identified
4. Current state and next steps
5. Important insights or conclusions

Conversation to summarize:
${textToSummarize}

Provide a structured summary that preserves the semantic meaning while being much more concise than the original.`;

      const summary = await summarizeTool.execute(
        { text: enhancedPrompt },
        context,
      );

      return String(summary);
    } catch (error) {
      log.error({ error }, 'Error generating semantic summary, falling back to basic summary');
      // Fallback to basic summarization
      return `Conversation summary: ${textToSummarize.substring(0, 200)}... (${messages.length} messages compressed)`;
    }
  }

  /**
   * Apply semantic compression to session history
   */
  public static async applySemanticCompression(
    session: SessionData,
    _job: Job,
    taskQueue: Queue
  ): Promise<void> {
    if (session.history.length <= config.HISTORY_MAX_LENGTH) {
      return; // No compression needed
    }

    const compressed = await this.compressHistorySemantically(session, _job, taskQueue);

    // Create compressed history structure
    const compressionMessage: Message = {
      content: `🧠 Semantic Memory Compression:
${compressed.summary}

Key Decisions: ${compressed.semanticMemory.keyDecisions.length}
Code Patterns: ${compressed.semanticMemory.codePatterns.length}
Themes: ${compressed.semanticMemory.conversationThemes.join(', ')}
Compression Ratio: ${(compressed.compressionRatio * 100).toFixed(1)}%`,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'agent_response',
    };

    // Update session history with compressed version
    session.history = [
      compressionMessage,
      ...compressed.recentMessages
    ];

    getLogger().info(
      { sessionId: session.id, originalLength: session.history.length + compressed.semanticMemory.keyDecisions.length },
      'Applied semantic compression to session history'
    );
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
        // 🚀 Use enhanced semantic compression instead of basic summarization
        await SessionManager.applySemanticCompression(session, job, taskQueue);
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
