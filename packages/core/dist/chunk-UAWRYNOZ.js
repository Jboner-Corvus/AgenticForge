import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  SessionManager
} from "./chunk-KBVJI43H.js";
import {
  LlmKeyManager
} from "./chunk-ZEBJECHX.js";
import {
  getTools
} from "./chunk-6VDWH2OR.js";
import {
  AppError,
  handleError
} from "./chunk-LCH7Z4UB.js";
import {
  getRedisClientInstance
} from "./chunk-SIBAPVHV.js";
import {
  getLoggerInstance
} from "./chunk-E5QXXMSG.js";
import {
  getConfig,
  loadConfig
} from "./chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/webServer.ts
init_esm_shims();
import { exec } from "child_process";
import chokidar from "chokidar";
import cookieParser from "cookie-parser";
import express2 from "express";
import { createHash, randomBytes } from "crypto";
import { Server } from "http";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// src/modules/queue/queue.ts
init_esm_shims();
import { Queue } from "bullmq";
var jobQueueInstance = null;
var deadLetterQueueInstance = null;
function getDeadLetterQueue() {
  if (!deadLetterQueueInstance) {
    const redisClient = getRedisClientInstance();
    deadLetterQueueInstance = new Queue("dead-letters", {
      connection: redisClient
    });
    deadLetterQueueInstance.on("error", (err) => {
      getLoggerInstance().error({ err }, "Dead-letter queue error");
    });
  }
  return deadLetterQueueInstance;
}
function getJobQueue() {
  if (!jobQueueInstance) {
    const redisClient = getRedisClientInstance();
    jobQueueInstance = new Queue("tasks", { connection: redisClient });
    jobQueueInstance.on("error", (err) => {
      getLoggerInstance().error({ err }, "Job queue error");
    });
  }
  return jobQueueInstance;
}

// src/utils/keyMaskingUtils.ts
init_esm_shims();
function maskApiKey(key, visibleStart = 3, visibleEnd = 4) {
  if (!key || key.length <= visibleStart + visibleEnd) {
    return key ? `${key.charAt(0)}...${key.charAt(key.length - 1)}` : "";
  }
  const start = key.substring(0, visibleStart);
  const end = key.substring(key.length - visibleEnd);
  return `${start}...${end}`;
}

// src/modules/api/clientConsole.api.ts
init_esm_shims();
import express from "express";
var router = express.Router();
var HELP_COMMANDS = {
  help: "Affiche cette aide.",
  ls: "Liste les propri\xE9t\xE9s de l'objet window.",
  url: "Affiche l'URL actuelle de la page.",
  title: "Affiche le titre de la page.",
  screenshot: "Capture d'\xE9cran de la page (simulation).",
  cookies: "Affiche les cookies de la page (noms seulement).",
  storage: "Affiche les cl\xE9s du localStorage (noms seulement).",
  performance: "Affiche des m\xE9triques de performance basiques."
};
function generateHelpText() {
  let helpText = "Commandes de la console client disponibles :\n";
  for (const [cmd, desc] of Object.entries(HELP_COMMANDS)) {
    helpText += `  ${cmd}: ${desc}
`;
  }
  helpText += "\nUtilisez 'help <command>' pour plus de d\xE9tails sur une commande sp\xE9cifique.";
  return helpText;
}
router.post("/api/client-console/execute", async (req, res) => {
  try {
    const { jobId, command, args = [] } = req.body;
    const sessionId = req.headers["x-session-id"];
    if (!jobId || !command) {
      return res.status(400).json({ error: "Missing jobId or command" });
    }
    if (command === "help") {
      if (args.length > 0 && args[0] in HELP_COMMANDS) {
        return res.json({
          output: `Aide pour '${args[0]}': ${HELP_COMMANDS[args[0]]}`
        });
      } else {
        return res.json({ output: generateHelpText() });
      }
    }
    let jsCommand = command;
    switch (command) {
      case "ls":
        jsCommand = "Object.keys(window)";
        break;
      case "url":
        jsCommand = "window.location.href";
        break;
      case "title":
        jsCommand = "document.title";
        break;
      case "screenshot":
        jsCommand = '"Screenshot captured (simulated)"';
        break;
      case "cookies":
        jsCommand = 'document.cookie.split(";").map(c => c.trim().split("=")[0])';
        break;
      case "storage":
        jsCommand = "Object.keys(localStorage)";
        break;
      case "performance":
        jsCommand = "({loadTime: performance.loadEventEnd - performance.navigationStart, domContentLoaded: performance.domContentLoadedEventEnd - performance.navigationStart})";
        break;
      default:
        break;
    }
    const redisClient = getRedisClientInstance();
    const channel = `job:${jobId}:events`;
    const message = JSON.stringify({
      type: "execute_client_command",
      content: jsCommand,
      originalCommand: command,
      args
    });
    await redisClient.publish(channel, message);
    res.json({
      status: "Command sent to client. Awaiting result...",
      command,
      args
    });
  } catch (error) {
    getLoggerInstance().error({ error }, "Error executing client console command");
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/api/client-console/result", async (req, res) => {
  try {
    const { jobId, result, error, command } = req.body;
    if (!jobId) {
      return res.status(400).json({ error: "Job ID is missing." });
    }
    const redisClient = getRedisClientInstance();
    const channel = `job:${jobId}:events`;
    const message = JSON.stringify({
      type: "tool_result",
      toolName: "client_console",
      result: {
        command_executed: command,
        output: result,
        error
      }
    });
    await redisClient.publish(channel, message);
    res.status(200).json({ message: "Result received." });
  } catch (error) {
    getLoggerInstance().error({ error }, "Error handling client console result");
    res.status(500).json({ error: "Internal server error" });
  }
});
var clientConsole_api_default = router;

// src/webServer.ts
var config = getConfig();
var configWatcher = null;
async function initializeWebServer(pgClient, redisClient) {
  console.log("Initializing web server...");
  try {
    const jobQueue = getJobQueue();
    console.log("\u{1F50D} Performing automatic LLM keys deduplication...");
    try {
      const deduplicationResult = await LlmKeyManager.deduplicateKeys();
      if (deduplicationResult.duplicatesRemoved > 0) {
        console.log(`\u2705 Removed ${deduplicationResult.duplicatesRemoved} duplicate LLM keys (${deduplicationResult.originalCount} \u2192 ${deduplicationResult.uniqueCount})`);
      } else {
        console.log("\u2705 No duplicate LLM keys found");
      }
    } catch (error) {
      console.warn("\u26A0\uFE0F Failed to deduplicate LLM keys:", error);
    }
    console.log("\u{1F511} Synchronizing master LLM API key from environment variables...");
    try {
      const syncResult = await LlmKeyManager.syncEnvMasterKey();
      console.log(`\u{1F511} Master LLM API key sync result: ${syncResult.action} - ${syncResult.message}`);
    } catch (error) {
      console.warn("\u26A0\uFE0F Failed to sync master LLM API key:", error);
    }
    const app = express2();
    const sessionManager = await SessionManager.create(pgClient);
    app.use(express2.json());
    const uiDistPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "ui", "dist");
    console.log(`[STATIC] Serving static files from: ${uiDistPath}`);
    app.use(express2.static(uiDistPath));
    app.use(cookieParser());
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-ID");
      if (req.headers.origin) {
        res.header("Access-Control-Allow-Credentials", "true");
      }
      if (req.method === "OPTIONS") {
        return res.status(204).send();
      }
      next();
    });
    app.use(
      (req, res, next) => {
        req.sessionManager = sessionManager;
        next();
      }
    );
    app.use(clientConsole_api_default);
    if (process.env.NODE_ENV !== "production") {
      watchConfig();
    }
    app.use(
      (req, res, next) => {
        let _sessionId = req.cookies.agenticforge_session_id || req.headers["x-session-id"];
        if (!_sessionId) {
          _sessionId = uuidv4();
          res.cookie("agenticforge_session_id", _sessionId, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1e3,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
          });
          redisClient.incr("leaderboard:sessionsCreated").catch((err) => {
            getLoggerInstance().error(
              { err },
              "Failed to increment sessionsCreated in Redis"
            );
          });
        }
        req.sessionId = _sessionId;
        req.redis = redisClient;
        res.setHeader("X-Session-ID", _sessionId);
        getLoggerInstance().debug(
          { sessionId: _sessionId },
          "Session initialized"
        );
        next();
      }
    );
    app.use(
      (req, res, next) => {
        if (process.env.NODE_ENV === "test") {
          return next();
        }
        if (req.method === "OPTIONS") {
          return next();
        }
        if (req.path.startsWith("/api/chat/stream/") && !req.headers.authorization && (req.query.auth || req.query.token)) {
          const token = req.query.auth || req.query.token;
          getLoggerInstance().debug(
            { tokenType: typeof token, tokenValue: token ? `${String(token).substring(0, 20)}...` : "undefined" },
            "Processing SSE auth token from query parameters in main auth middleware"
          );
          if (typeof token === "string") {
            if (token.startsWith("Bearer ")) {
              req.headers.authorization = token;
            } else {
              req.headers.authorization = `Bearer ${token}`;
            }
            getLoggerInstance().debug(
              { authorizationHeader: req.headers.authorization },
              "Set authorization header for SSE in main auth middleware"
            );
          }
        }
        if (req.path.startsWith("/api/chat/stream/")) {
          console.log("Skipping auth for SSE stream:", req.path);
          return next();
        }
        const publicRoutes = [
          "/api/health",
          "/api/auth/github",
          "/api/auth/qwen",
          "/api/llm-api-keys/providers",
          // Pour afficher les providers LLM
          "/api/llm-keys/providers",
          // Pour afficher les providers LLM
          "/api/llm-keys/hierarchy",
          // Pour afficher la hiérarchie des clés
          "/api/llm-keys/master-key",
          // Pour afficher la clé maîtresse
          "/api/sessions",
          // Pour naviguer dans les sessions
          "/api/leaderboard"
          // Pour la page leaderboard
        ];
        const isPublicRoute = publicRoutes.some(
          (route) => req.path === route || req.path.startsWith(route)
        );
        if (isPublicRoute) {
          return next();
        }
        const apiKey = req.headers.authorization;
        console.log("\u{1F510} Auth check for:", req.path);
        console.log("\u{1F510} Auth token present:", !!apiKey);
        console.log("\u{1F510} Config token present:", !!config.AUTH_TOKEN);
        getLoggerInstance().debug(
          { apiKey: apiKey ? `${apiKey.substring(0, 20)}...` : "undefined" },
          "Checking authorization header"
        );
        const expectedToken = config.AUTH_TOKEN || process.env.AUTH_TOKEN || "";
        const expectedBearer = `Bearer ${expectedToken}`;
        console.log("\u{1F510} Auth validation in progress...");
        if (apiKey !== expectedBearer) {
          console.log("\u274C AUTH FAILED - Bearer token mismatch");
          getLoggerInstance().warn(
            { providedKey: apiKey, requiredKey: `Bearer ${expectedToken.substring(0, 10)}...` },
            "Unauthorized access attempt"
          );
          return res.status(401).json({ error: "Unauthorized - Authentication required for this endpoint" });
        }
        console.log("\u2705 AUTH SUCCESS - Bearer token matched!");
        console.log("\u{1F510}\u{1F510}\u{1F510} === END BEARER TOKEN ANALYSIS ===");
        next();
      }
    );
    app.get("/api/health", (req, res) => {
      res.status(200).send("OK");
    });
    app.get(
      "/api/tools",
      async (req, res, next) => {
        try {
          const tools = await getTools();
          const toolNames = tools.map((tool) => ({ name: tool.name }));
          res.status(200).json(toolNames);
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.post(
      "/api/chat",
      async (req, res, next) => {
        try {
          const { apiKey, llmApiKey, llmModelName, llmProvider, prompt } = req.body;
          if (!prompt) {
            throw new AppError("Le prompt est manquant.", { statusCode: 400 });
          }
          getLoggerInstance().info(
            { prompt, sessionId: req.sessionId },
            "Nouveau message re\xE7u"
          );
          const _job = await jobQueue.add("process-message", {
            apiKey,
            llmApiKey,
            llmModelName,
            llmProvider,
            prompt,
            sessionId: req.sessionId
          });
          req.job = _job;
          res.status(202).json({
            jobId: _job.id,
            message: "Requ\xEAte re\xE7ue, traitement en cours."
          });
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.post(
      "/api/test-chat",
      async (req, res, next) => {
        try {
          const { apiKey, llmApiKey, llmModelName, llmProvider, prompt, sessionName } = req.body;
          if (!prompt) {
            throw new AppError("Le prompt est manquant.", { statusCode: 400 });
          }
          const testSessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const testSessionName = sessionName || `\u{1F916} Test Auto - ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`;
          getLoggerInstance().info(
            { prompt, sessionId: testSessionId, sessionName: testSessionName },
            "Test automatique lanc\xE9"
          );
          const testSession = await sessionManager.getSession(testSessionId);
          testSession.name = testSessionName;
          await sessionManager.saveSession(testSession, void 0, jobQueue);
          const _job = await jobQueue.add("process-message", {
            apiKey,
            llmApiKey,
            llmModelName,
            llmProvider,
            prompt,
            sessionId: testSessionId
          });
          res.status(202).json({
            jobId: _job.id,
            sessionId: testSessionId,
            sessionName: testSessionName,
            message: "Test automatique lanc\xE9, visible dans l'interface."
          });
        } catch (_error) {
          next(_error);
        }
      }
    );
    const sseAuthMiddleware = (req, res, next) => {
      getLoggerInstance().debug(
        {
          path: req.path,
          hasAuthHeader: !!req.headers.authorization,
          hasAuthQuery: !!req.query.auth,
          hasTokenQuery: !!req.query.token,
          query: req.query
        },
        "SSE auth middleware called"
      );
      if (req.path.startsWith("/api/chat/stream/") && !req.headers.authorization && (req.query.auth || req.query.token)) {
        const token = req.query.auth || req.query.token;
        getLoggerInstance().debug(
          { tokenType: typeof token, tokenValue: token ? `${String(token).substring(0, 20)}...` : "undefined" },
          "Processing SSE auth token from query parameters in SSE auth middleware"
        );
        if (typeof token === "string") {
          if (token.startsWith("Bearer ")) {
            req.headers.authorization = token;
          } else {
            req.headers.authorization = `Bearer ${token}`;
          }
          getLoggerInstance().debug(
            { authorizationHeader: req.headers.authorization },
            "Set authorization header for SSE in SSE auth middleware"
          );
        }
      }
      const apiKey = req.headers.authorization;
      getLoggerInstance().debug(
        { apiKey: apiKey ? `${apiKey.substring(0, 20)}...` : "undefined" },
        "Checking authorization header for SSE stream"
      );
      const expectedToken = config.AUTH_TOKEN || process.env.AUTH_TOKEN || "";
      const expectedBearer = `Bearer ${expectedToken}`;
      getLoggerInstance().debug(
        {
          providedKey: apiKey,
          requiredKey: expectedBearer,
          configToken: config.AUTH_TOKEN ? `${config.AUTH_TOKEN.substring(0, 10)}...` : "undefined",
          envToken: process.env.AUTH_TOKEN ? `${process.env.AUTH_TOKEN.substring(0, 10)}...` : "undefined",
          expectedTokenLength: expectedToken.length,
          providedKeyLength: apiKey ? apiKey.length : 0,
          matchResult: apiKey === expectedBearer
        },
        "SSE auth validation - Detailed comparison"
      );
      if (apiKey !== expectedBearer) {
        getLoggerInstance().warn(
          {
            providedKey: apiKey,
            requiredKey: expectedBearer,
            configToken: config.AUTH_TOKEN ? `${config.AUTH_TOKEN.substring(0, 10)}...` : "undefined",
            envToken: process.env.AUTH_TOKEN ? `${process.env.AUTH_TOKEN.substring(0, 10)}...` : "undefined"
          },
          "Unauthorized SSE access attempt"
        );
        return res.status(401).json({ error: "Unauthorized" });
      }
      next();
    };
    app.get(
      "/api/chat/stream/:jobId",
      sseAuthMiddleware,
      async (req, res, _next) => {
        console.log("SSE route called");
        const { jobId } = req.params;
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Cache-Control"
        });
        res.write('data: {"type":"connection","message":"Connected to stream"}\n\n');
        try {
          const subscriber = redisClient.duplicate();
          req.on("close", () => {
            console.log(`Client disconnected from stream for job ${jobId}`);
            subscriber.quit();
          });
          await subscriber.subscribe(`job:${jobId}:events`);
          subscriber.on("message", (channel, message) => {
            try {
              const eventData = JSON.parse(message);
              res.write(`data: ${JSON.stringify(eventData)}

`);
              if (eventData.type === "completed" || eventData.type === "error") {
                res.write('data: {"type":"stream_end","message":"Stream closed"}\n\n');
                res.end();
                subscriber.quit();
              }
            } catch (err) {
              console.error("Error processing stream message:", err);
              res.write(`data: {"type":"error","message":"Error processing message"}

`);
            }
          });
          const jobCompletionChannel = `job:${jobId}:completed`;
          await subscriber.subscribe(jobCompletionChannel);
          subscriber.on("message", (channel, message) => {
            if (channel === jobCompletionChannel) {
              try {
                const completionData = JSON.parse(message);
                res.write(`data: ${JSON.stringify(completionData)}

`);
                res.write('data: {"type":"stream_end","message":"Stream closed"}\n\n');
                res.end();
                subscriber.quit();
              } catch (err) {
                console.error("Error processing completion message:", err);
                res.write(`data: {"type":"error","message":"Error processing completion"}

`);
                res.end();
                subscriber.quit();
              }
            }
          });
        } catch (error) {
          console.error("Error in SSE stream:", error);
          res.write(`data: {"type":"error","message":"Stream error: ${error}"}

`);
          res.end();
        }
      }
    );
    app.post(
      "/api/session",
      async (req, res, next) => {
        const sessionId = req.sessionId;
        if (!sessionId) {
          return res.status(400).json({ error: "Session ID is missing." });
        }
        try {
          await req.sessionManager.getSession(sessionId);
          getLoggerInstance().info(
            { sessionId },
            "Session implicitly created/retrieved via cookie/header."
          );
          res.status(200).json({
            message: "Session managed automatically via cookie/header.",
            sessionId
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error managing session implicitly"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/session/llm-provider",
      async (req, res, next) => {
        try {
          const { providerName } = req.body;
          const sessionId = req.sessionId;
          if (!sessionId || !providerName) {
            throw new AppError(
              "Missing session ID or provider name",
              {
                statusCode: 400
              }
            );
          }
          const session = await req.sessionManager.getSession(sessionId);
          session.activeLlmProvider = providerName;
          await req.sessionManager.saveSession(session, req.job, jobQueue);
          getLoggerInstance().info(
            { providerName, sessionId },
            "Active LLM provider updated for session."
          );
          res.status(200).json({ message: "Active LLM provider updated successfully." });
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.get(
      "/api/leaderboard-stats",
      async (req, res, next) => {
        try {
          let sessionsCreated = await redisClient.get("leaderboard:sessionsCreated");
          if (sessionsCreated === null) {
            sessionsCreated = "0";
            await redisClient.set("leaderboard:sessionsCreated", "0");
          }
          let tokensSaved = await redisClient.get("leaderboard:tokensSaved");
          if (tokensSaved === null) {
            tokensSaved = "0";
            await redisClient.set("leaderboard:tokensSaved", "0");
          }
          let successfulRuns = await redisClient.get("leaderboard:successfulRuns");
          if (successfulRuns === null) {
            successfulRuns = "0";
            await redisClient.set("leaderboard:successfulRuns", "0");
          }
          let apiKeysAdded = await redisClient.get("leaderboard:apiKeysAdded");
          if (apiKeysAdded === null) {
            apiKeysAdded = "0";
            await redisClient.set("leaderboard:apiKeysAdded", "0");
          }
          res.status(200).json({
            apiKeysAdded: parseInt(apiKeysAdded, 10),
            sessionsCreated: parseInt(sessionsCreated, 10),
            successfulRuns: parseInt(successfulRuns, 10),
            tokensSaved: parseInt(tokensSaved, 10)
          });
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.get(
      "/api/leaderboard",
      async (req, res, next) => {
        try {
          const apiKeys = await LlmKeyManager.getKeysForApi();
          const leaderboardData = apiKeys.map((key, index) => {
            const requestsLimit = Math.floor(Math.random() * 1e4) + 1e3;
            const requestsCount = Math.floor(Math.random() * requestsLimit);
            const tokensLimit = Math.floor(Math.random() * 2e6) + 1e5;
            const tokensCount = Math.floor(Math.random() * tokensLimit);
            return {
              id: `key-${index + 1}`,
              provider: key.apiProvider,
              keyMask: maskApiKey(key.apiKey),
              requests: { count: requestsCount, limit: requestsLimit },
              tokens: { count: tokensCount, limit: tokensLimit },
              rank: index + 1
            };
          });
          res.status(200).json(leaderboardData);
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.post(
      "/api/sessions/save",
      async (req, res, next) => {
        try {
          const { id, messages, name, timestamp } = req.body;
          if (!id || !name || !messages || !timestamp) {
            throw new AppError("Missing session data", { statusCode: 400 });
          }
          const sessionDataToSave = {
            history: messages,
            id,
            identities: [],
            name,
            timestamp
          };
          await req.sessionManager.saveSession(
            sessionDataToSave,
            req.job,
            getJobQueue()
          );
          getLoggerInstance().info(
            { sessionId: id, sessionName: name },
            "Session saved to PostgreSQL."
          );
          res.status(200).json({ message: "Session saved successfully." });
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.get(
      "/api/sessions/:id",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const sessionData = await req.sessionManager.getSession(id);
          if (!sessionData) {
            throw new AppError("Session not found", { statusCode: 404 });
          }
          res.status(200).json(sessionData);
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.delete(
      "/api/sessions/:id",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          await req.sessionManager.deleteSession(id);
          getLoggerInstance().info(
            { sessionId: id },
            "Session deleted from PostgreSQL."
          );
          res.status(200).json({ message: "Session deleted successfully." });
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.put(
      "/api/sessions/:id/rename",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const { newName } = req.body;
          if (!newName) {
            throw new AppError("New name is missing", { statusCode: 400 });
          }
          const updatedSession = await req.sessionManager.renameSession(
            id,
            newName
          );
          getLoggerInstance().info(
            { newName, sessionId: id },
            "Session renamed in PostgreSQL."
          );
          res.status(200).json({
            message: "Session renamed successfully.",
            session: updatedSession
          });
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.post(
      "/api/llm-keys/keys",
      async (req, res, next) => {
        try {
          const { baseUrl, keyValue, apiModel, providerId, providerName, keyName, metadata } = req.body;
          if (!providerId || !keyValue) {
            throw new AppError("Missing provider or key", { statusCode: 400 });
          }
          await LlmKeyManager.addKey(
            providerId,
            keyValue,
            apiModel || config.LLM_MODEL_NAME,
            baseUrl
          );
          const redisKey = `llm:keys:${providerId}:${Date.now()}`;
          const keyData = {
            provider: providerId,
            providerName: providerName || providerId,
            keyName: keyName || (providerId === "gemini" ? "Gemini Key" : `${providerId}-key`),
            keyValue,
            isEncrypted: false,
            isActive: true,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            usageCount: 0,
            metadata: metadata || {
              environment: "development",
              tags: [],
              description: ""
            }
          };
          await redisClient.set(redisKey, JSON.stringify(keyData));
          res.status(200).json({
            id: redisKey.split(":").pop(),
            // Extract ID from Redis key
            ...keyData
          });
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.get(
      "/api/llm-keys/keys",
      async (req, res, next) => {
        try {
          const legacyKeys = await LlmKeyManager.getKeysForApi();
          const redisKeys = await redisClient.keys("llm:keys:*");
          const newKeys = [];
          for (const key of redisKeys) {
            const value = await redisClient.get(key);
            if (value) {
              try {
                const keyData = JSON.parse(value);
                newKeys.push({
                  id: key,
                  ...keyData
                });
              } catch (parseError) {
                getLoggerInstance().warn(
                  { key, error: parseError },
                  "Failed to parse Redis key value as JSON"
                );
              }
            }
          }
          const allKeys = [
            ...legacyKeys.map((key, index) => ({
              id: `legacy-${index}`,
              providerId: key.apiProvider,
              providerName: key.apiProvider,
              keyName: `${key.apiProvider}-key`,
              keyValue: key.apiKey,
              isEncrypted: false,
              isActive: true,
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
              usageCount: 0,
              metadata: {
                environment: "development",
                tags: [],
                description: ""
              }
            })),
            ...newKeys
          ];
          res.status(200).json(allKeys);
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.delete(
      "/api/llm-keys/keys/:id",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          if (id.startsWith("legacy-")) {
            const keyIndex = parseInt(id.replace("legacy-", ""), 10);
            if (isNaN(keyIndex)) {
              throw new AppError("Invalid index", { statusCode: 400 });
            }
            await LlmKeyManager.removeKey(keyIndex);
          } else {
            await redisClient.del(id);
          }
          res.status(200).json({ message: "LLM API key removed successfully." });
        } catch (error) {
          next(error);
        }
      }
    );
    app.put(
      "/api/llm-keys/keys/:id",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const { baseUrl, keyValue, apiModel, providerId, providerName, keyName, metadata, isActive } = req.body;
          if (!providerId || !keyValue) {
            throw new AppError("Missing provider or key", { statusCode: 400 });
          }
          if (id.startsWith("legacy-")) {
            const keyIndex = parseInt(id.replace("legacy-", ""), 10);
            if (isNaN(keyIndex)) {
              throw new AppError("Invalid index", { statusCode: 400 });
            }
            await LlmKeyManager.removeKey(keyIndex);
            await LlmKeyManager.addKey(
              providerId,
              keyValue,
              apiModel || config.LLM_MODEL_NAME,
              baseUrl
            );
            res.status(200).json({ message: "LLM API key updated successfully." });
          } else {
            const keyData = {
              provider: providerId,
              providerName: providerName || providerId,
              keyName: keyName || (providerId === "gemini" ? "Gemini Key" : `${providerId}-key`),
              keyValue,
              isEncrypted: false,
              isActive: isActive !== void 0 ? isActive : true,
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
              usageCount: 0,
              metadata: metadata || {
                environment: "development",
                tags: [],
                description: ""
              }
            };
            await redisClient.set(id, JSON.stringify(keyData));
            res.status(200).json({
              id,
              ...keyData
            });
          }
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/test",
      async (req, res, next) => {
        try {
          const { provider, apiKey, baseUrl } = req.body;
          if (!provider || !apiKey) {
            throw new AppError("Le fournisseur et la cl\xE9 API sont requis.", { statusCode: 400 });
          }
          let requestUrl = "";
          let requestOptions = {};
          switch (provider) {
            case "openai":
              requestUrl = baseUrl || "https://api.openai.com/v1/chat/completions";
              requestOptions = {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                  model: "gpt-3.5-turbo",
                  messages: [{ role: "user", content: "test" }],
                  max_tokens: 1
                })
              };
              break;
            case "anthropic":
              requestUrl = baseUrl || "https://api.anthropic.com/v1/messages";
              requestOptions = {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": apiKey,
                  "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                  model: "claude-3-haiku-20240307",
                  messages: [{ role: "user", content: "test" }],
                  max_tokens: 1
                })
              };
              break;
            case "gemini":
              requestUrl = baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
              requestOptions = {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: "test" }] }]
                })
              };
              break;
            case "qwen":
              requestUrl = baseUrl || "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
              requestOptions = {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                  model: "qwen-turbo",
                  input: {
                    prompt: "test"
                  },
                  parameters: {
                    max_tokens: 1
                  }
                })
              };
              break;
            default:
              throw new AppError(`Le fournisseur '${provider}' n'est pas support\xE9 pour le test.`, { statusCode: 400 });
          }
          const response = await fetch(requestUrl, requestOptions);
          if (response.ok) {
            res.status(200).json({ success: true, message: "La cl\xE9 est valide." });
          } else {
            const errorBody = await response.text();
            getLoggerInstance().warn({
              provider,
              status: response.status,
              error: errorBody
            }, "Test de cl\xE9 API LLM \xE9chou\xE9");
            res.status(200).json({ success: false, message: `Cl\xE9 invalide ou erreur API (status: ${response.status})` });
          }
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-api-keys",
      async (req, res, next) => {
        try {
          const { baseUrl, key, model, provider } = req.body;
          if (!provider || !key) {
            throw new AppError("Missing provider or key", { statusCode: 400 });
          }
          await LlmKeyManager.addKey(
            provider,
            key,
            model || config.LLM_MODEL_NAME,
            baseUrl
          );
          res.status(200).json({ message: "LLM API key added successfully." });
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.get(
      "/api/llm-api-keys",
      async (req, res, next) => {
        try {
          const keys = await LlmKeyManager.getKeysForApi();
          res.status(200).json(keys);
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.delete(
      "/api/llm-api-keys/:index",
      async (req, res, next) => {
        try {
          const { index } = req.params;
          const keyIndex = parseInt(index, 10);
          if (isNaN(keyIndex)) {
            throw new AppError("Invalid index", { statusCode: 400 });
          }
          await LlmKeyManager.removeKey(keyIndex);
          res.status(200).json({ message: "LLM API key removed successfully." });
        } catch (error) {
          next(error);
        }
      }
    );
    app.put(
      "/api/llm-api-keys/:index",
      async (req, res, next) => {
        try {
          const { index } = req.params;
          const { baseUrl, key, model, provider } = req.body;
          const keyIndex = parseInt(index, 10);
          if (isNaN(keyIndex)) {
            throw new AppError("Invalid index", { statusCode: 400 });
          }
          if (!provider || !key) {
            throw new AppError("Missing provider or key", { statusCode: 400 });
          }
          await LlmKeyManager.removeKey(keyIndex);
          await LlmKeyManager.addKey(
            provider,
            key,
            model || config.LLM_MODEL_NAME,
            baseUrl
          );
          res.status(200).json({ message: "LLM API key updated successfully." });
        } catch (error) {
          next(error);
        }
      }
    );
    app.put(
      "/api/llm-api-keys/keys/:id",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const { isActive } = req.body;
          const keys = await LlmKeyManager.getKeysForApi();
          const keyIndex = keys.findIndex(
            (key2, index) => `${key2.apiProvider}-${index}-${Math.floor(Date.now() / 1e3) * 1e3}` === id || id.startsWith(`${key2.apiProvider}-${index}-`)
          );
          if (keyIndex === -1) {
            throw new AppError("Key not found", { statusCode: 404 });
          }
          const key = keys[keyIndex];
          key.isPermanentlyDisabled = !isActive;
          await LlmKeyManager.saveKeys(keys);
          res.status(200).json({ message: "Key updated successfully" });
        } catch (error) {
          next(error);
        }
      }
    );
    app.delete(
      "/api/llm-api-keys/keys/:id",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const keys = await LlmKeyManager.getKeysForApi();
          const keyIndex = keys.findIndex(
            (key, index) => `${key.apiProvider}-${index}-${Math.floor(Date.now() / 1e3) * 1e3}` === id || id.startsWith(`${key.apiProvider}-${index}-`)
          );
          if (keyIndex === -1) {
            throw new AppError("Key not found", { statusCode: 404 });
          }
          await LlmKeyManager.removeKey(keyIndex);
          res.status(200).json({ message: "Key deleted successfully" });
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-api-keys/keys/:id/test",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const keys = await LlmKeyManager.getKeysForApi();
          const keyIndex = keys.findIndex(
            (key2, index) => `${key2.apiProvider}-${index}-${Math.floor(Date.now() / 1e3) * 1e3}` === id || id.startsWith(`${key2.apiProvider}-${index}-`)
          );
          if (keyIndex === -1) {
            throw new AppError("Key not found", { statusCode: 404 });
          }
          const key = keys[keyIndex];
          const isValid = !key.isPermanentlyDisabled && key.apiKey && key.apiKey.length > 0;
          res.status(200).json({
            valid: isValid,
            message: isValid ? "Key is valid" : "Key is invalid or disabled"
          });
        } catch (error) {
          next(error);
        }
      }
    );
    const verifyAuthToken = (req, res, next) => {
      const authHeader = req.headers.authorization;
      let token = authHeader;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
      const expectedToken = config.AUTH_TOKEN || process.env.AUTH_TOKEN || "Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0";
      if (!token || token !== expectedToken) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      next();
    };
    app.post(
      "/api/llm-api-keys/sync",
      verifyAuthToken,
      async (req, res, next) => {
        try {
          res.status(200).json({ message: "Sync completed successfully" });
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-api-keys/import-from-redis",
      verifyAuthToken,
      async (req, res, next) => {
        try {
          res.status(200).json({ message: "Import completed successfully" });
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-api-keys/export-to-redis",
      verifyAuthToken,
      async (req, res, next) => {
        try {
          res.status(200).json({ message: "Export completed successfully" });
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-api-keys/cleanup-duplicates",
      verifyAuthToken,
      async (req, res, next) => {
        try {
          const result = await LlmKeyManager.deduplicateKeys();
          if (result.duplicatesRemoved > 0) {
            res.status(200).json({
              message: `\u{1F9F9} Cleanup completed. Removed ${result.duplicatesRemoved} duplicates.`,
              before: result.originalCount,
              after: result.uniqueCount,
              duplicatesRemoved: result.duplicatesRemoved
            });
          } else {
            res.status(200).json({
              message: "\u2705 No duplicates found - all keys are unique!",
              before: result.originalCount,
              after: result.uniqueCount,
              duplicatesRemoved: 0
            });
          }
        } catch (error) {
          next(error);
        }
      }
    );
    app.get(
      "/api/sessions",
      async (req, res, next) => {
        try {
          const sessions = await req.sessionManager.getAllSessions();
          res.status(200).json(sessions);
        } catch (_error) {
          next(_error);
        }
      }
    );
    app.get("/api/auth/github", (req, res) => {
      const githubClientId = config.GITHUB_CLIENT_ID;
      if (!githubClientId) {
        return res.status(500).json({ error: "GitHub Client ID not configured." });
      }
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/github/callback`;
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;
      res.redirect(githubAuthUrl);
    });
    app.get(
      "/api/auth/github/callback",
      async (req, res, next) => {
        try {
          const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
          const githubClientId = config.GITHUB_CLIENT_ID;
          const githubClientSecret = config.GITHUB_CLIENT_SECRET;
          getLoggerInstance().info(
            { code: code ? `${String(code).substring(0, 10)}...` : "undefined" },
            "GitHub OAuth callback received"
          );
          if (!code || !githubClientId || !githubClientSecret) {
            getLoggerInstance().error(
              { code, githubClientId: githubClientId ? "***REDACTED***" : "undefined", githubClientSecret: githubClientSecret ? "***REDACTED***" : "undefined" },
              "Missing code or GitHub credentials"
            );
            throw new AppError(
              "Missing code or GitHub credentials",
              {
                statusCode: 400
              }
            );
          }
          const tokenResponse = await fetch(
            "https://github.com/login/oauth/access_token",
            {
              body: JSON.stringify({
                client_id: githubClientId,
                client_secret: githubClientSecret,
                code: String(code)
              }),
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
              },
              method: "POST"
            }
          );
          const tokenData = await tokenResponse.json();
          if (tokenData.error) {
            const loggedTokenData = { ...tokenData };
            if (loggedTokenData.access_token) {
              loggedTokenData.access_token = "***REDACTED***";
            }
            getLoggerInstance().error(
              { tokenData: loggedTokenData },
              "GitHub OAuth Error"
            );
            throw new AppError(
              `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`,
              { statusCode: 400 }
            );
          }
          const accessToken = tokenData.access_token;
          getLoggerInstance().info(
            { accessToken: "***REDACTED***" },
            "GitHub access token received"
          );
          if (req.sessionId) {
            await redisClient.set(
              `github:accessToken:${req.sessionId}`,
              accessToken,
              "EX",
              3600
            );
            getLoggerInstance().info(
              { accessToken: "***REDACTED***", sessionId: req.sessionId },
              "GitHub access token stored in Redis."
            );
            if (config.JWT_SECRET) {
              const userId = req.sessionId;
              const token = jwt.sign({ userId }, config.JWT_SECRET, {
                expiresIn: "1h"
              });
              res.cookie("agenticforge_jwt", token, {
                httpOnly: true,
                maxAge: 3600 * 1e3,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production"
              });
              getLoggerInstance().info(
                { userId, token: `${token.substring(0, 20)}...` },
                "JWT issued and sent to frontend."
              );
            } else {
              getLoggerInstance().warn(
                "JWT_SECRET is not configured, skipping JWT issuance."
              );
            }
          }
          res.redirect("/?github_auth_success=true");
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error in GitHub OAuth callback"
          );
          next(error);
        }
      }
    );
    app.get("/api/auth/qwen", (req, res) => {
      const qwenClientId = config.QWEN_CLIENT_ID;
      if (!qwenClientId) {
        return res.status(500).json({ error: "Qwen Client ID not configured." });
      }
      const codeVerifier = randomBytes(32).toString("hex");
      const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      if (req.sessionId) {
        redisClient.set(
          `qwen:codeVerifier:${req.sessionId}`,
          codeVerifier,
          "EX",
          600
        );
        getLoggerInstance().info(
          { sessionId: req.sessionId },
          "Qwen code verifier stored in Redis for PKCE."
        );
      }
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/qwen/callback`;
      const qwenAuthUrl = `https://qianwen.aliyun.com/oauth2/v1/authorize?response_type=code&client_id=${qwenClientId}&redirect_uri=${redirectUri}&scope=https://qianwen.aliyun.com/api&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      res.redirect(qwenAuthUrl);
    });
    app.get(
      "/api/auth/qwen/callback",
      async (req, res, next) => {
        try {
          const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
          const qwenClientId = config.QWEN_CLIENT_ID;
          const qwenClientSecret = config.QWEN_CLIENT_SECRET;
          getLoggerInstance().info(
            { code: code ? `${String(code).substring(0, 10)}...` : "undefined" },
            "Qwen OAuth callback received"
          );
          if (!code || !qwenClientId || !qwenClientSecret) {
            getLoggerInstance().error(
              { code, qwenClientId: qwenClientId ? "***REDACTED***" : "undefined", qwenClientSecret: qwenClientSecret ? "***REDACTED***" : "undefined" },
              "Missing code or Qwen credentials"
            );
            throw new AppError(
              "Missing code or Qwen credentials",
              {
                statusCode: 400
              }
            );
          }
          let codeVerifier = null;
          if (req.sessionId) {
            codeVerifier = await redisClient.get(
              `qwen:codeVerifier:${req.sessionId}`
            );
            await redisClient.del(`qwen:codeVerifier:${req.sessionId}`);
            if (!codeVerifier) {
              getLoggerInstance().error(
                { sessionId: req.sessionId },
                "Code verifier not found in Redis for Qwen PKCE flow"
              );
              throw new AppError(
                "Code verifier not found for PKCE flow",
                {
                  statusCode: 400
                }
              );
            }
          }
          const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/qwen/callback`;
          const tokenResponse = await fetch(
            "https://qianwen.aliyun.com/oauth2/v1/token",
            {
              body: JSON.stringify({
                client_id: qwenClientId,
                client_secret: qwenClientSecret,
                code: String(code),
                code_verifier: codeVerifier,
                grant_type: "authorization_code",
                redirect_uri: redirectUri
              }),
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
              },
              method: "POST"
            }
          );
          const tokenData = await tokenResponse.json();
          if (tokenData.error) {
            const loggedTokenData = { ...tokenData };
            if (loggedTokenData.access_token) {
              loggedTokenData.access_token = "***REDACTED***";
            }
            getLoggerInstance().error(
              { tokenData: loggedTokenData },
              "Qwen OAuth Error"
            );
            throw new AppError(
              `Qwen OAuth error: ${tokenData.error_description || tokenData.error}`,
              { statusCode: 400 }
            );
          }
          const accessToken = tokenData.access_token;
          getLoggerInstance().info(
            { accessToken: "***REDACTED***" },
            "Qwen access token received"
          );
          if (req.sessionId) {
            await redisClient.set(
              `qwen:accessToken:${req.sessionId}`,
              accessToken,
              "EX",
              3600
            );
            getLoggerInstance().info(
              { accessToken: "***REDACTED***", sessionId: req.sessionId },
              "Qwen access token stored in Redis."
            );
            if (config.JWT_SECRET) {
              const userId = req.sessionId;
              const token = jwt.sign({ userId }, config.JWT_SECRET, {
                expiresIn: "1h"
              });
              res.cookie("agenticforge_jwt", token, {
                httpOnly: true,
                maxAge: 3600 * 1e3,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production"
              });
              getLoggerInstance().info(
                { userId, token: `${token.substring(0, 20)}...` },
                "JWT issued and sent to frontend."
              );
            } else {
              getLoggerInstance().warn(
                "JWT_SECRET is not configured, skipping JWT issuance."
              );
            }
          }
          res.redirect("/?qwen_auth_success=true");
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error in Qwen OAuth callback"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/interrupt/:jobId",
      async (req, res, next) => {
        try {
          const { jobId } = req.params;
          const job = await getJobQueue().getJob(jobId);
          if (!job) {
            throw new AppError("Job non trouv\xE9.", { statusCode: 404 });
          }
          await redisClient.publish(`job:${jobId}:interrupt`, "interrupt");
          res.status(200).json({ message: "Interruption signal sent." });
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/admin/:action",
      async (req, res, next) => {
        try {
          const { action } = req.params;
          const scriptPath = path.resolve(process.cwd(), "..", "run.sh");
          let command = "";
          switch (action) {
            case "all-checks":
              command = `${scriptPath} all-checks`;
              break;
            case "rebuild":
              command = `${scriptPath} rebuild`;
              break;
            case "restart":
              command = `${scriptPath} restart`;
              break;
            default:
              throw new AppError("Invalid admin action.", { statusCode: 400 });
          }
          exec(command, (error, stdout, stderr) => {
            if (error) {
              getLoggerInstance().error(
                { error, stderr, stdout },
                `Error executing ${action}`
              );
              return res.status(500).json({
                error: error.message,
                message: `Error during ${action}.`,
                stderr,
                stdout
              });
            }
            getLoggerInstance().info(
              { stderr, stdout },
              `${action} executed successfully`
            );
            res.status(200).json({
              message: `${action} completed successfully.`,
              output: stdout
            });
          });
        } catch (error) {
          next(error);
        }
      }
    );
    app.get(
      "/api/status/:jobId",
      async (req, res, next) => {
        try {
          const { jobId } = req.params;
          const job = await getJobQueue().getJob(jobId);
          if (!job) {
            throw new AppError("Job non trouv\xE9.", { statusCode: 404 });
          }
          const state = await job.getState();
          const progress = job.progress;
          const returnvalue = job.returnvalue;
          res.status(200).json({ jobId, progress, returnvalue, state });
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/canvas/display",
      async (req, res, next) => {
        try {
          const { jobId, content, contentType = "html" } = req.body;
          if (!jobId || !content) {
            throw new AppError("Les param\xE8tres jobId et content sont requis.", { statusCode: 400 });
          }
          const validContentTypes = ["html", "markdown", "text", "url"];
          if (!validContentTypes.includes(contentType)) {
            throw new AppError(`Type de contenu invalide. Types valides: ${validContentTypes.join(", ")}`, { statusCode: 400 });
          }
          const channel = `job:${jobId}:events`;
          const message = JSON.stringify({
            content,
            contentType,
            type: "agent_canvas_output"
          });
          await redisClient.publish(channel, message);
          getLoggerInstance().info(`Contenu envoy\xE9 au canvas pour le job ${jobId}`);
          res.status(200).json({
            success: true,
            message: "Contenu envoy\xE9 au canvas avec succ\xE8s"
          });
        } catch (error) {
          next(error);
        }
      }
    );
    app.get(
      "/api/auth/qwen/status",
      async (req, res, next) => {
        try {
          if (!req.sessionId) {
            return res.status(400).json({ error: "Session ID is missing." });
          }
          const qwenAccessToken = await redisClient.get(
            `qwen:accessToken:${req.sessionId}`
          );
          res.status(200).json({
            connected: !!qwenAccessToken,
            message: qwenAccessToken ? "Qwen is connected" : "Qwen is not connected"
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error checking Qwen connection status"
          );
          next(error);
        }
      }
    );
    app.get(
      "/api/auth/qwen/credentials",
      async (req, res, next) => {
        try {
          const fs = await import("fs");
          const os = await import("os");
          const path2 = await import("path");
          const qwenDir = path2.join(os.homedir(), ".qwen");
          const credsFile = path2.join(qwenDir, "oauth_creds.json");
          if (!fs.existsSync(credsFile)) {
            return res.status(404).json({
              error: "Qwen credentials file not found",
              message: "Please authenticate with Qwen first to create the credentials file"
            });
          }
          const credsData = fs.readFileSync(credsFile, "utf8");
          const creds = JSON.parse(credsData);
          res.status(200).json({
            accessToken: creds.access_token
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error reading Qwen credentials file"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/auth/qwen/logout",
      async (req, res, next) => {
        try {
          if (!req.sessionId) {
            return res.status(400).json({ error: "Session ID is missing." });
          }
          await redisClient.del(`qwen:accessToken:${req.sessionId}`);
          getLoggerInstance().info(
            { sessionId: req.sessionId },
            "Qwen access token removed from Redis."
          );
          res.status(200).json({
            success: true,
            message: "Successfully logged out from Qwen"
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error logging out from Qwen"
          );
          next(error);
        }
      }
    );
    app.get(
      "/api/llm-keys/qwen/status",
      async (req, res, next) => {
        try {
          if (!req.sessionId) {
            return res.status(400).json({ error: "Session ID is missing." });
          }
          const qwenAccessToken = await redisClient.get(
            `qwen:accessToken:${req.sessionId}`
          );
          if (!qwenAccessToken) {
            return res.status(200).json({
              isValid: false,
              requestsRemaining: null,
              errorMessage: "No Qwen access token found"
            });
          }
          try {
            const response = await fetch("https://dashscope.aliyuncs.com/api/v1/token-status", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${qwenAccessToken}`,
                "Content-Type": "application/json"
              }
            });
            if (response.ok) {
              const data = await response.json();
              return res.status(200).json({
                isValid: true,
                requestsRemaining: data.remaining_requests || null,
                lastChecked: (/* @__PURE__ */ new Date()).toISOString()
              });
            } else {
              const errorData = await response.json();
              return res.status(200).json({
                isValid: false,
                requestsRemaining: null,
                errorMessage: errorData.message || "Invalid Qwen token"
              });
            }
          } catch (error) {
            getLoggerInstance().error(
              { error },
              "Error validating Qwen access token"
            );
            return res.status(200).json({
              isValid: false,
              requestsRemaining: null,
              errorMessage: "Failed to validate Qwen token"
            });
          }
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error checking Qwen token status"
          );
          next(error);
        }
      }
    );
    app.get(
      "/api/llm-keys/redis/info",
      async (req, res, next) => {
        try {
          const info = await redisClient.info();
          const lines = info.split("\n");
          let keyCount = 0;
          let memory = "0K";
          for (const line of lines) {
            if (line.startsWith("db0:")) {
              const match = line.match(/keys=(\d+)/);
              if (match) {
                keyCount = parseInt(match[1], 10);
              }
            }
            if (line.startsWith("used_memory_human:")) {
              memory = line.split(":")[1].trim();
            }
          }
          res.status(200).json({
            connected: true,
            keyCount,
            memory
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error getting Redis info"
          );
          res.status(200).json({
            connected: false,
            keyCount: 0,
            memory: "0K"
          });
        }
      }
    );
    app.post(
      "/api/llm-keys/redis/scan",
      async (req, res, next) => {
        try {
          const { pattern } = req.body;
          const keys = await redisClient.keys(pattern || "llm:keys:*");
          res.status(200).json({ keys });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error scanning Redis keys"
          );
          next(error);
        }
      }
    );
    app.get(
      "/api/llm-keys/redis/keys",
      async (req, res, next) => {
        try {
          const keys = await redisClient.keys("llm:keys:*");
          const llmKeys = [];
          for (const key of keys) {
            const value = await redisClient.get(key);
            if (value) {
              try {
                llmKeys.push(JSON.parse(value));
              } catch (parseError) {
                getLoggerInstance().warn(
                  { key, error: parseError },
                  "Failed to parse Redis key value as JSON"
                );
              }
            }
          }
          res.status(200).json(llmKeys);
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error fetching LLM keys from Redis"
          );
          next(error);
        }
      }
    );
    app.get(
      "/api/llm-keys/redis/key/:keyPath",
      async (req, res, next) => {
        try {
          const { keyPath } = req.params;
          const decodedKeyPath = decodeURIComponent(keyPath);
          const value = await redisClient.get(decodedKeyPath);
          if (!value) {
            return res.status(404).json({ error: "Key not found" });
          }
          try {
            const keyData = JSON.parse(value);
            res.status(200).json(keyData);
          } catch (parseError) {
            getLoggerInstance().warn(
              { keyPath: decodedKeyPath, error: parseError },
              "Failed to parse Redis key value as JSON"
            );
            res.status(200).json({ value });
          }
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error fetching LLM key from Redis"
          );
          next(error);
        }
      }
    );
    app.get(
      "/api/llm-keys/hierarchy",
      async (req, res, next) => {
        try {
          const hierarchyJson = await redisClient.get("llmApiKeysHierarchy");
          const hierarchy = hierarchyJson ? JSON.parse(hierarchyJson) : {};
          res.status(200).json(hierarchy);
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error getting key hierarchy from Redis"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/hierarchy",
      verifyAuthToken,
      async (req, res, next) => {
        try {
          const hierarchy = req.body;
          await redisClient.set("llmApiKeysHierarchy", JSON.stringify(hierarchy));
          res.status(200).json({ message: "Key hierarchy saved successfully" });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error saving key hierarchy to Redis"
          );
          next(error);
        }
      }
    );
    app.get(
      "/api/llm-keys/master-key",
      async (req, res, next) => {
        try {
          const masterApiKey = process.env.MASTER_LLM_API_KEY || process.env.LLM_API_KEY || config.LLM_API_KEY;
          if (!masterApiKey) {
            return res.status(404).json({ error: "Master key not found" });
          }
          res.status(200).json({
            apiKey: masterApiKey,
            provider: "google-flash",
            // Default provider for master key
            model: "gemini-2.5-flash"
            // Default model for master key
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error getting master key info"
          );
          next(error);
        }
      }
    );
    app.put(
      "/api/llm-keys/redis/key/:keyPath",
      async (req, res, next) => {
        try {
          const { keyPath } = req.params;
          const { value } = req.body;
          const decodedKeyPath = decodeURIComponent(keyPath);
          await redisClient.set(decodedKeyPath, JSON.stringify(value));
          res.status(200).json({ message: "Key set successfully" });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error setting LLM key in Redis"
          );
          next(error);
        }
      }
    );
    app.delete(
      "/api/llm-keys/redis/key/:keyPath",
      async (req, res, next) => {
        try {
          const { keyPath } = req.params;
          const decodedKeyPath = decodeURIComponent(keyPath);
          await redisClient.del(decodedKeyPath);
          res.status(200).json({ message: "Key deleted successfully" });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error deleting LLM key from Redis"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/redis/bulk-import",
      async (req, res, next) => {
        try {
          const { patterns } = req.body;
          const allKeys = [];
          for (const pattern of patterns) {
            const keys = await redisClient.keys(pattern);
            allKeys.push(...keys);
          }
          const importedKeys = [];
          const errors = [];
          for (const key of allKeys) {
            try {
              const value = await redisClient.get(key);
              if (value) {
                importedKeys.push({ key, value });
              }
            } catch (error) {
              errors.push(`Failed to import key ${key}: ${error}`);
            }
          }
          res.status(200).json({
            imported: importedKeys.length,
            errors
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error bulk importing LLM keys from Redis"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/redis/bulk-export",
      async (req, res, next) => {
        try {
          const { keys } = req.body;
          const errors = [];
          for (const keyData of keys) {
            try {
              const keyPath = `llm:keys:${keyData.provider}:${keyData.keyId}`;
              await redisClient.set(keyPath, JSON.stringify(keyData));
            } catch (error) {
              errors.push(`Failed to export key ${keyData.keyId}: ${error}`);
            }
          }
          res.status(200).json({
            exported: keys.length,
            errors
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error bulk exporting LLM keys to Redis"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/sync",
      async (req, res, next) => {
        try {
          res.status(200).json({ message: "Sync completed successfully" });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error syncing LLM keys"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-api-keys/sync",
      async (req, res, next) => {
        try {
          res.status(200).json({ message: "Sync completed successfully" });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error syncing LLM keys"
          );
          next(error);
        }
      }
    );
    app.get(
      "/api/llm-api-keys/providers",
      async (req, res, next) => {
        try {
          const providers = [
            {
              id: "openai",
              name: "openai",
              displayName: "OpenAI",
              description: "GPT models including GPT-4, GPT-3.5, and DALL-E",
              website: "https://openai.com",
              keyFormat: "sk-...",
              testEndpoint: "/v1/models",
              supportedModels: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "dall-e-3", "whisper-1"],
              isActive: true
            },
            {
              id: "anthropic",
              name: "anthropic",
              displayName: "Anthropic",
              description: "Claude models for advanced AI assistance",
              website: "https://anthropic.com",
              keyFormat: "sk-ant-...",
              testEndpoint: "/v1/models",
              supportedModels: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
              isActive: true
            },
            {
              id: "google-flash",
              name: "google",
              displayName: "Google Gemini Flash",
              description: "Gemini 2.5 Flash - Fast and efficient model",
              website: "https://ai.google.dev",
              keyFormat: "AI...",
              testEndpoint: "/v1/models",
              supportedModels: ["gemini-2.5-flash"],
              isActive: true
            },
            {
              id: "gemini",
              name: "google",
              displayName: "Gemini",
              description: "Gemini 2.5 Pro - Advanced reasoning model",
              website: "https://ai.google.dev",
              keyFormat: "AI...",
              testEndpoint: "/v1/models",
              supportedModels: ["gemini-2.5-pro"],
              isActive: true
            },
            {
              id: "xai",
              name: "xai",
              displayName: "xAI Grok",
              description: "Grok-4 advanced reasoning model",
              website: "https://x.ai",
              keyFormat: "xai-...",
              testEndpoint: "/v1/models",
              supportedModels: ["grok-4"],
              isActive: true
            },
            {
              id: "qwen",
              name: "qwen",
              displayName: "Qwen",
              description: "Qwen3 Coder Plus - Advanced coding model",
              website: "https://portal.qwen.ai",
              keyFormat: "...",
              testEndpoint: "https://portal.qwen.ai/v1/chat/completions",
              supportedModels: ["qwen3-coder-plus"],
              isActive: true
            },
            {
              id: "openrouter",
              name: "openrouter",
              displayName: "OpenRouter",
              description: "Access to multiple AI models via unified API - GLM-4.5-Air Free",
              website: "https://openrouter.ai",
              keyFormat: "sk-or-...",
              testEndpoint: "https://openrouter.ai/api/v1/models",
              supportedModels: ["z-ai/glm-4.5-air:free"],
              isActive: true
            }
          ];
          res.status(200).json(providers);
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error getting LLM providers"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/import-from-redis",
      async (req, res, next) => {
        try {
          const keys = await redisClient.keys("llm:keys:*");
          for (const keyPath of keys) {
            try {
              const value = await redisClient.get(keyPath);
              if (value) {
                const keyData = JSON.parse(value);
                getLoggerInstance().info(
                  { keyPath, keyData },
                  "Would import key from Redis to local store"
                );
              }
            } catch (parseError) {
              getLoggerInstance().warn(
                { keyPath, error: parseError },
                "Failed to parse Redis key value as JSON during import"
              );
            }
          }
          res.status(200).json({ message: "Import from Redis completed successfully" });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error importing LLM keys from Redis"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/cleanup-duplicates",
      verifyAuthToken,
      async (req, res, next) => {
        try {
          const result = await LlmKeyManager.deduplicateKeys();
          if (result.duplicatesRemoved > 0) {
            res.status(200).json({
              message: `\u{1F9F9} Cleanup completed. Removed ${result.duplicatesRemoved} duplicates.`,
              before: result.originalCount,
              after: result.uniqueCount,
              duplicatesRemoved: result.duplicatesRemoved
            });
          } else {
            res.status(200).json({
              message: "\u2705 No duplicates found - all keys are unique!",
              before: result.originalCount,
              after: result.uniqueCount,
              duplicatesRemoved: 0
            });
          }
        } catch (error) {
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-api-keys/cleanup-duplicates",
      async (req, res, next) => {
        try {
          const legacyKeys = await LlmKeyManager.getKeysForApi();
          const redisKeys = await redisClient.keys("llm:keys:*");
          const newKeys = [];
          for (const key of redisKeys) {
            const value = await redisClient.get(key);
            if (value) {
              try {
                const keyData = JSON.parse(value);
                newKeys.push({
                  id: key,
                  ...keyData
                });
              } catch (parseError) {
                getLoggerInstance().warn(
                  { key, error: parseError },
                  "Failed to parse Redis key value as JSON"
                );
              }
            }
          }
          const uniqueLegacyKeys = legacyKeys.filter(
            (key, index, self) => index === self.findIndex((k) => k.apiKey === key.apiKey && k.apiProvider === key.apiProvider)
          );
          const uniqueNewKeys = newKeys.filter(
            (key, index, self) => index === self.findIndex((k) => k.keyValue === key.keyValue && k.provider === key.provider)
          );
          await redisClient.del("llmApiKeys");
          if (uniqueLegacyKeys.length > 0) {
            await redisClient.rpush(
              "llmApiKeys",
              ...uniqueLegacyKeys.map((key) => JSON.stringify(key))
            );
          }
          getLoggerInstance().info(
            {
              legacyKeysCount: legacyKeys.length,
              uniqueLegacyKeysCount: uniqueLegacyKeys.length,
              newKeysCount: newKeys.length,
              uniqueNewKeysCount: uniqueNewKeys.length
            },
            "LLM API keys cleanup completed"
          );
          res.status(200).json({
            message: "Duplicate keys cleanup completed successfully",
            stats: {
              legacyKeysRemoved: legacyKeys.length - uniqueLegacyKeys.length,
              newKeysRemoved: newKeys.length - uniqueNewKeys.length
            }
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error cleaning up duplicate LLM keys"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/export-to-redis",
      async (req, res, next) => {
        try {
          res.status(200).json({ message: "Export to Redis completed successfully" });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error exporting LLM keys to Redis"
          );
          next(error);
        }
      }
    );
    app.post(
      "/api/llm-keys/keys/:id/test",
      async (req, res, next) => {
        try {
          const { id } = req.params;
          res.status(200).json({
            valid: true,
            message: "Key test not implemented yet"
          });
        } catch (error) {
          next(error);
        }
      }
    );
    app.get(
      "/api/llm-keys/providers",
      async (req, res, next) => {
        try {
          const providers = [
            {
              id: "openai",
              name: "openai",
              displayName: "OpenAI",
              description: "GPT models including GPT-4, GPT-3.5, and DALL-E",
              website: "https://openai.com",
              keyFormat: "sk-...",
              testEndpoint: "/v1/models",
              supportedModels: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "dall-e-3", "whisper-1"],
              isActive: true
            },
            {
              id: "anthropic",
              name: "anthropic",
              displayName: "Anthropic",
              description: "Claude models for advanced AI assistance",
              website: "https://anthropic.com",
              keyFormat: "sk-ant-...",
              testEndpoint: "/v1/models",
              supportedModels: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
              isActive: true
            },
            {
              id: "google-flash",
              name: "google",
              displayName: "Google Gemini Flash",
              description: "Gemini 2.5 Flash - Fast and efficient model",
              website: "https://ai.google.dev",
              keyFormat: "AI...",
              testEndpoint: "/v1/models",
              supportedModels: ["gemini-2.5-flash"],
              isActive: true
            },
            {
              id: "gemini",
              name: "google",
              displayName: "Gemini",
              description: "Gemini 2.5 Pro - Advanced reasoning model",
              website: "https://ai.google.dev",
              keyFormat: "AI...",
              testEndpoint: "/v1/models",
              supportedModels: ["gemini-2.5-pro"],
              isActive: true
            },
            {
              id: "xai",
              name: "xai",
              displayName: "xAI Grok",
              description: "Grok-4 advanced reasoning model",
              website: "https://x.ai",
              keyFormat: "xai-...",
              testEndpoint: "/v1/models",
              supportedModels: ["grok-4"],
              isActive: true
            },
            {
              id: "qwen",
              name: "qwen",
              displayName: "Qwen",
              description: "Qwen3 Coder Plus - Advanced coding model",
              website: "https://portal.qwen.ai",
              keyFormat: "...",
              testEndpoint: "https://portal.qwen.ai/v1/chat/completions",
              supportedModels: ["qwen3-coder-plus"],
              isActive: true
            },
            {
              id: "openrouter",
              name: "openrouter",
              displayName: "OpenRouter",
              description: "Access to multiple AI models via unified API - GLM-4.5-Air Free",
              website: "https://openrouter.ai",
              keyFormat: "sk-or-...",
              testEndpoint: "https://openrouter.ai/api/v1/models",
              supportedModels: ["z-ai/glm-4.5-air:free"],
              isActive: true
            }
          ];
          res.status(200).json(providers);
        } catch (error) {
          getLoggerInstance().error(
            { error },
            "Error getting LLM providers"
          );
          next(error);
        }
      }
    );
    app.use(handleError);
    const server = new Server(app);
    if (process.env.NODE_ENV !== "test") {
      process.on("uncaughtException", (error) => {
        getLoggerInstance().fatal({ error }, "Unhandled exception caught!");
        process.exit(1);
      });
      process.on(
        "unhandledRejection",
        (reason, promise) => {
          getLoggerInstance().fatal(
            { promise, reason },
            "Unhandled rejection caught!"
          );
          process.exit(1);
        }
      );
    }
    console.log("Web server initialized.");
    return { app, server };
  } catch (error) {
    console.error("Error initializing web server:", error);
    throw error;
  }
}
function watchConfig() {
  const envPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../.env"
  );
  getLoggerInstance().info(
    `[watchConfig] Watching for .env changes in: ${envPath}`
  );
  configWatcher = chokidar.watch(envPath, {
    ignoreInitial: true,
    persistent: true
  });
  configWatcher.on("change", async () => {
    getLoggerInstance().info(
      "[watchConfig] .env file changed, reloading configuration..."
    );
    await loadConfig();
    getLoggerInstance().info("[watchConfig] Configuration reloaded.");
  });
  configWatcher.on("error", (error) => {
    getLoggerInstance().error(
      { error },
      "[watchConfig] Watcher error"
    );
  });
}

export {
  getDeadLetterQueue,
  getJobQueue,
  configWatcher,
  initializeWebServer
};
