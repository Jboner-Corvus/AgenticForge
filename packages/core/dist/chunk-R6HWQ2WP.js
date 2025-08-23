import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  summarizeTool
} from "./chunk-JKB35YK2.js";
import {
  getLlmProvider
} from "./chunk-BGGAYOXK.js";
import {
  getRedisClientInstance
} from "./chunk-2TWFUMQU.js";
import {
  getLogger
} from "./chunk-5JE7E5SU.js";
import {
  config
} from "./chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/session/sessionManager.ts
init_esm_shims();
var SessionManager = class _SessionManager {
  static activeSessions = /* @__PURE__ */ new Map();
  pgClient;
  constructor(pgClient) {
    this.pgClient = pgClient;
  }
  static clearActiveSessionsForTest() {
    _SessionManager.activeSessions.clear();
  }
  static async create(pgClient) {
    const manager = new _SessionManager(pgClient);
    await manager.initDb();
    return manager;
  }
  static createToolContext(_job, session, _taskQueue, log) {
    return {
      job: _job,
      llm: getLlmProvider(session.activeLlmProvider || "gemini"),
      // Default to 'gemini' if not set
      log,
      reportProgress: async (progress) => {
        log.debug(
          `Tool progress: ${progress.current}/${progress.total} ${progress.unit || ""}`
        );
      },
      session,
      streamContent: async (content, toolName) => {
        log.debug(`Tool stream: ${JSON.stringify(content)}`);
        const channel = `job:${_job.id}:events`;
        let contentString;
        if (Array.isArray(content)) {
          contentString = content.map((c) => c.toString()).join("");
        } else {
          contentString = String(content);
        }
        const message = JSON.stringify({
          content: contentString,
          toolName: toolName || "unknown_tool",
          type: "tool_stream"
        });
        getRedisClientInstance().publish(channel, message);
      },
      taskQueue: _taskQueue
    };
  }
  static async summarizeHistory(session, _job, taskQueue) {
    const log = getLogger().child({
      module: "Summarizer",
      sessionId: session.id
    });
    log.info("History length exceeds max length, summarizing...");
    const historyToSummarize = session.history.slice(
      0,
      session.history.length - config.HISTORY_MAX_LENGTH
    );
    const textToSummarize = historyToSummarize.map((msg) => {
      if ("content" in msg && typeof msg.content === "string") {
        return `${msg.type}: ${msg.content}`;
      }
      return "";
    }).join("\n");
    try {
      const context = this.createToolContext(_job, session, taskQueue, log);
      const summary = await summarizeTool.execute(
        { text: textToSummarize },
        context
      );
      const summarizedMessage = {
        content: `Summarized conversation: ${String(summary)}`,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "agent_response"
      };
      session.history = [
        summarizedMessage,
        ...session.history.slice(-(config.HISTORY_MAX_LENGTH - 1))
      ];
      log.info("History summarized successfully.");
    } catch (error) {
      log.error({ error }, "Error summarizing history");
      throw error;
    }
  }
  async deleteSession(sessionId) {
    await this.pgClient.query("DELETE FROM sessions WHERE id = $1", [
      sessionId
    ]);
    _SessionManager.activeSessions.delete(sessionId);
    getLogger().info(
      { sessionId },
      "Session deleted from PostgreSQL and memory."
    );
  }
  async getAllSessions() {
    const res = await this.pgClient.query(
      "SELECT id, name, timestamp, identities FROM sessions ORDER BY timestamp DESC"
    );
    return res.rows.map((row) => ({
      history: [],
      id: row.id,
      identities: row.identities || [],
      name: row.name,
      timestamp: parseInt(row.timestamp, 10)
    }));
  }
  async getSession(sessionId) {
    if (_SessionManager.activeSessions.has(sessionId)) {
      getLogger().info(
        { sessionId },
        "Reusing existing session data from memory."
      );
      return _SessionManager.activeSessions.get(sessionId);
    }
    const res = await this.pgClient.query(
      "SELECT * FROM sessions WHERE id = $1",
      [sessionId]
    );
    let initialHistory = [];
    let sessionName = `Session ${(/* @__PURE__ */ new Date()).toLocaleString()}`;
    let sessionTimestamp = Date.now();
    let identities = [];
    let activeLlmProvider = void 0;
    if (res.rows.length > 0) {
      const storedSession = res.rows[0];
      try {
        if (typeof storedSession.messages === "string") {
          initialHistory = JSON.parse(storedSession.messages);
        } else if (Array.isArray(storedSession.messages)) {
          initialHistory = storedSession.messages;
        }
      } catch (error) {
        getLogger().error(
          { error, sessionId },
          "Failed to parse messages from DB, initializing with empty history."
        );
        initialHistory = [];
      }
      sessionName = storedSession.name;
      sessionTimestamp = parseInt(storedSession.timestamp, 10);
      identities = storedSession.identities || [];
      activeLlmProvider = storedSession.active_llm_provider || void 0;
    } else {
      getLogger().info(
        { sessionId },
        "No session found in PostgreSQL, creating new one."
      );
    }
    const historyToUse = config.HISTORY_LOAD_LENGTH > 0 && initialHistory.length > config.HISTORY_LOAD_LENGTH ? initialHistory.slice(-config.HISTORY_LOAD_LENGTH) : initialHistory;
    const sessionData = {
      activeLlmProvider,
      // Add to sessionData
      history: historyToUse,
      id: sessionId,
      identities,
      name: sessionName,
      timestamp: sessionTimestamp
    };
    _SessionManager.activeSessions.set(sessionId, sessionData);
    getLogger().info(
      { sessionId },
      "Created new session data from PostgreSQL."
    );
    return sessionData;
  }
  async renameSession(sessionId, newName) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found.`);
    }
    session.name = newName;
    await this.pgClient.query("UPDATE sessions SET name = $1 WHERE id = $2", [
      newName,
      sessionId
    ]);
    _SessionManager.activeSessions.set(sessionId, session);
    getLogger().info(
      { newName, sessionId },
      "Session renamed in PostgreSQL and memory."
    );
    return session;
  }
  async saveSession(session, job, taskQueue) {
    try {
      if (session.history.length > config.HISTORY_MAX_LENGTH && job) {
        await _SessionManager.summarizeHistory(session, job, taskQueue);
      }
      await this.pgClient.query(
        "INSERT INTO sessions (id, name, messages, timestamp, identities, active_llm_provider) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, messages = EXCLUDED.messages, timestamp = EXCLUDED.timestamp, identities = EXCLUDED.identities, active_llm_provider = EXCLUDED.active_llm_provider",
        [
          session.id,
          session.name,
          JSON.stringify(session.history),
          session.timestamp,
          JSON.stringify(session.identities),
          session.activeLlmProvider || null
          // Save the new field
        ]
      );
      _SessionManager.activeSessions.set(session.id, session);
      getLogger().info(
        { sessionId: session.id },
        "Session history saved to PostgreSQL."
      );
    } catch (error) {
      getLogger().error({ error }, "Error saving session");
      throw error;
    }
  }
  async initDb() {
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
    getLogger().info("PostgreSQL sessions table ensured.");
  }
};

export {
  SessionManager
};
