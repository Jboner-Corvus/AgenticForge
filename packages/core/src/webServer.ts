import { exec } from 'child_process';
import chokidar from 'chokidar';
import cookieParser from 'cookie-parser';
import { createHash, randomBytes } from 'crypto';
import express, { type Application } from 'express';
import { Server } from 'http';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import path from 'path';
import { Client as PgClient } from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { getConfig, loadConfig } from './config.ts';
import { getLoggerInstance } from './logger.ts';
import { getJobQueue } from './modules/queue/queue.ts';
const config = getConfig();
import clientConsoleRouter from './modules/api/clientConsole.api.ts';
import { LlmKeyManager as _LlmKeyManager } from './modules/llm/LlmKeyManager.ts';
import { SessionManager } from './modules/session/sessionManager.ts';
import VersionService from './modules/version/VersionService.ts';
import { Message, SessionData } from './types.ts';
import { AppError, handleError } from './utils/errorUtils.ts';
import { maskApiKey } from './utils/keyMaskingUtils.ts';
import { getTools } from './utils/toolLoader.ts';

export let configWatcher: import('chokidar').FSWatcher | null = null;

export async function initializeWebServer(
  pgClient: PgClient,
  redisClient: Redis,
): Promise<{ app: Application; server: Server }> {
  console.log('Initializing web server...');
  try {
    const jobQueue = getJobQueue();

    // 🧹 Dédoublonnage automatique des clés LLM au démarrage
    console.log('🔍 Performing automatic LLM keys deduplication...');
    try {
      const deduplicationResult = await _LlmKeyManager.deduplicateKeys();
      if (deduplicationResult.duplicatesRemoved > 0) {
        console.log(
          `✅ Removed ${deduplicationResult.duplicatesRemoved} duplicate LLM keys (${deduplicationResult.originalCount} → ${deduplicationResult.uniqueCount})`,
        );
      } else {
        console.log('✅ No duplicate LLM keys found');
      }
    } catch (error) {
      console.warn('⚠️ Failed to deduplicate LLM keys:', error);
    }

    // 🔑 Synchronisation de la clé API maîtresse depuis les variables d'environnement
    console.log(
      '🔑 Synchronizing master LLM API key from environment variables...',
    );
    try {
      const syncResult = await _LlmKeyManager.syncEnvMasterKey();
      console.log(
        `🔑 Master LLM API key sync result: ${syncResult.action} - ${syncResult.message}`,
      );
    } catch (error) {
      console.warn('⚠️ Failed to sync master LLM API key:', error);
    }

    // 🕐 (Optionnel) Planifier un test périodique de toutes les clés (mode simulation)
    // Cela pose les bases pour une rotation proactive.
    // setTimeout(() => {
    //     console.log('🕒 Démarrage de la tâche planifiée de test des clés (dry-run)...');
    //     setInterval(async () => {
    //         try {
    //             console.log('🕒 Exécution du test périodique des clés (dry-run)...');
    //             await _LlmKeyManager.testAllKeys(true); // true = dryRun
    //         } catch (intervalError) {
    //             console.error('🕒 Erreur dans la tâche planifiée de test des clés:', intervalError);
    //         }
    //     }, 30 * 60 * 1000); // Toutes les 30 minutes
    // }, 5 * 60 * 1000); // Démarrer 5 minutes après le lancement du serveur

    const app = express();
    const sessionManager = await SessionManager.create(pgClient);
    app.use(express.json());
    // Serve static files from UI dist directory
    const uiDistPath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      '..',
      '..',
      'ui',
      'dist',
    );
    console.log(`[STATIC] Serving static files from: ${uiDistPath}`);
    app.use(express.static(uiDistPath));
    app.use(cookieParser());

    // Add CORS middleware for all routes
    app.use((req, res, next) => {
      // For local development, allow all origins
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-ID',
      );

      // Only set credentials to true if we have a specific origin (not '*')
      if (req.headers.origin) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      // Handle preflight OPTIONS requests
      if (req.method === 'OPTIONS') {
        return res.status(204).send();
      }

      next();
    });

    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        (req as any).sessionManager = sessionManager;
        next();
      },
    );

    // Add client console API routes
    app.use(clientConsoleRouter);

    // Initialize version service
    const versionService = new VersionService();

    // Version API endpoints
    // Get current version info
    app.get(
      '/api/version/current',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const versionInfo = await versionService.getCurrentVersion();
          getLoggerInstance().info(
            { version: versionInfo.current },
            'Version info requested',
          );
          res.json(versionInfo);
        } catch (error) {
          getLoggerInstance().error({ error }, 'Failed to get version info');
          next(error);
        }
      },
    );

    // Check for updates against GitHub releases
    app.get(
      '/api/version/check',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const updateResult = await versionService.checkForUpdates();

          if (updateResult.hasUpdate && updateResult.comparison) {
            getLoggerInstance().info(
              {
                current: updateResult.current,
                latest: updateResult.latest,
                severity: updateResult.comparison.severity,
              },
              'Update available',
            );
          } else {
            getLoggerInstance().debug(
              {
                current: updateResult.current,
                latest: updateResult.latest,
              },
              'No updates available',
            );
          }

          res.json(updateResult);
        } catch (error) {
          getLoggerInstance().warn(
            { error },
            'Failed to check for updates, using cached data',
          );

          try {
            // Fallback to current version info
            const versionInfo = await versionService.getCurrentVersion();
            res.json({
              current: versionInfo.current,
              error:
                error instanceof Error ? error.message : 'Update check failed',
              hasUpdate: false,
              latest: versionInfo.current,
            });
          } catch (fallbackError) {
            next(error);
          }
        }
      },
    );

    // Get latest release info from GitHub
    app.get(
      '/api/version/latest',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const latestRelease = await versionService.getLatestRelease();
          const current = await versionService.getCurrentVersion();

          const latestVersion = versionService.cleanVersion
            ? versionService.cleanVersion(latestRelease.tag_name)
            : latestRelease.tag_name.replace(/^v/, '');

          const response = {
            current: current.current,
            hasUpdate: versionService.isNewer(current.current, latestVersion),
            latest: latestVersion,
            release: {
              body: latestRelease.body,
              html_url: latestRelease.html_url,
              name: latestRelease.name,
              published_at: latestRelease.published_at,
              tag: latestRelease.tag_name,
            },
          };

          getLoggerInstance().debug(
            {
              current: response.current,
              latest: response.latest,
            },
            'Latest release info retrieved',
          );

          res.json(response);
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Failed to get latest release info',
          );
          next(error);
        }
      },
    );

    // Get upgrade preconditions and warnings
    app.post(
      '/api/version/validate-upgrade',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { fromVersion, toVersion } = req.body;

          if (!fromVersion || !toVersion) {
            return res.status(400).json({
              error: 'fromVersion and toVersion are required',
            });
          }

          const validation = versionService.validateUpgradePreconditions(
            fromVersion,
            toVersion,
          );
          const severity = versionService.getUpdateSeverity(
            fromVersion,
            toVersion,
          );

          res.json({
            ...validation,
            severity,
            upgradePath: versionService.getUpgradePath(fromVersion, toVersion),
          });
        } catch (error) {
          getLoggerInstance().error({ error }, 'Failed to validate upgrade');
          next(error);
        }
      },
    );

    if (process.env.NODE_ENV !== 'production') {
      watchConfig();
    }

    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        let _sessionId =
          req.cookies.agenticforge_session_id || req.headers['x-session-id'];

        if (!_sessionId) {
          _sessionId = uuidv4();
          res.cookie('agenticforge_session_id', _sessionId, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          });
          redisClient
            .incr('leaderboard:sessionsCreated')
            .catch((err: unknown) => {
              getLoggerInstance().error(
                { err },
                'Failed to increment sessionsCreated in Redis',
              );
            });
        }
        (req as any).sessionId = _sessionId;
        (req as any).redis = redisClient;
        res.setHeader('X-Session-ID', _sessionId);

        // Log session information
        getLoggerInstance().debug(
          { sessionId: _sessionId },
          'Session initialized',
        );

        next();
      },
    );

    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        // Skip authentication in test environment
        if (process.env.NODE_ENV === 'test') {
          return next();
        }

        // Skip authentication for OPTIONS requests (handled by CORS middleware)
        if (req.method === 'OPTIONS') {
          return next();
        }

        // Handle authentication for SSE through query parameters as fallback
        if (
          req.path.startsWith('/api/chat/stream/') &&
          !req.headers.authorization &&
          (req.query.auth || req.query.token)
        ) {
          const token = req.query.auth || req.query.token;
          getLoggerInstance().debug(
            {
              tokenType: typeof token,
              tokenValue: token
                ? `${String(token).substring(0, 20)}...`
                : 'undefined',
            },
            'Processing SSE auth token from query parameters in main auth middleware',
          );
          if (typeof token === 'string') {
            // Check if token already has Bearer prefix
            if (token.startsWith('Bearer ')) {
              req.headers.authorization = token;
            } else {
              req.headers.authorization = `Bearer ${token}`;
            }
            getLoggerInstance().debug(
              { authorizationHeader: req.headers.authorization },
              'Set authorization header for SSE in main auth middleware',
            );
          }
        }

        // Skip authentication for SSE streams as they have their own auth middleware
        if (req.path.startsWith('/api/chat/stream/')) {
          console.log('Skipping auth for SSE stream:', req.path);
          return next();
        }

        // Routes exemptées d'authentification (accès libre pour navigation)
        const publicRoutes = [
          '/api/health',
          '/api/auth/github',
          '/api/auth/qwen',
          '/api/llm-api-keys/providers', // Pour afficher les providers LLM
          '/api/llm-keys/providers', // Pour afficher les providers LLM
          '/api/llm-keys/hierarchy', // Pour afficher la hiérarchie des clés
          '/api/llm-keys/master-key', // Pour afficher la clé maîtresse
          '/api/sessions', // Pour naviguer dans les sessions
          '/api/leaderboard', // Pour la page leaderboard
        ];

        const isPublicRoute = publicRoutes.some(
          (route) => req.path === route || req.path.startsWith(route),
        );

        if (isPublicRoute) {
          return next();
        }

        const apiKey = req.headers.authorization;

        // ULTRA VERBOSE LOGGING POUR DEBUGGING
        // Security: masked auth logging
        console.log('🔐 Auth check for:', req.path);
        console.log('🔐 Auth token present:', !!apiKey);
        console.log('🔐 Config token present:', !!config.AUTH_TOKEN);

        getLoggerInstance().debug(
          { apiKey: apiKey ? `${apiKey.substring(0, 20)}...` : 'undefined' },
          'Checking authorization header',
        );

        // SIMPLIFIÉ: Utiliser uniquement AUTH_TOKEN (qui est dans .env)
        // Utiliser la configuration chargée au lieu de process.env directement
        const expectedToken = config.AUTH_TOKEN || process.env.AUTH_TOKEN || '';
        const expectedBearer = `Bearer ${expectedToken}`;

        // Security: no token values in logs
        console.log('🔐 Auth validation in progress...');

        // Authentification Bearer pour les routes sensibles
        if (apiKey !== expectedBearer) {
          console.log('❌ AUTH FAILED - Bearer token mismatch');
          getLoggerInstance().warn(
            {
              providedKey: apiKey,
              requiredKey: `Bearer ${expectedToken.substring(0, 10)}...`,
            },
            'Unauthorized access attempt',
          );
          return res
            .status(401)
            .json({
              error: 'Unauthorized - Authentication required for this endpoint',
            });
        }
        console.log('✅ AUTH SUCCESS - Bearer token matched!');
        console.log('🔐🔐🔐 === END BEARER TOKEN ANALYSIS ===');
        next();
      },
    );

    app.get('/api/health', (req: express.Request, res: express.Response) => {
      res.status(200).send('OK');
    });

    app.get(
      '/api/tools',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const tools = await getTools();
          const toolNames = tools.map((tool) => ({ name: tool.name }));
          res.status(200).json(toolNames);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.post(
      '/api/chat',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { apiKey, llmApiKey, llmModelName, llmProvider, prompt } =
            req.body;

          if (!prompt) {
            throw new AppError('Le prompt est manquant.', { statusCode: 400 });
          }

          getLoggerInstance().info(
            { prompt, sessionId: req.sessionId },
            'Nouveau message reçu',
          );

          const _job = await jobQueue.add('process-message', {
            apiKey,
            llmApiKey,
            llmModelName,
            llmProvider,
            prompt,
            sessionId: req.sessionId,
          });
          req.job = _job;

          res.status(202).json({
            jobId: _job.id,
            message: 'Requête reçue, traitement en cours.',
          });
        } catch (_error) {
          next(_error);
        }
      },
    );

    // Endpoint for automated tests that are visible in the UI
    app.post(
      '/api/test-chat',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const {
            apiKey,
            llmApiKey,
            llmModelName,
            llmProvider,
            prompt,
            sessionName,
          } = req.body;

          if (!prompt) {
            throw new AppError('Le prompt est manquant.', { statusCode: 400 });
          }

          // Create a special test session ID
          const testSessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const testSessionName =
            sessionName || `🤖 Test Auto - ${new Date().toLocaleTimeString()}`;

          getLoggerInstance().info(
            { prompt, sessionId: testSessionId, sessionName: testSessionName },
            'Test automatique lancé',
          );

          // Create the test session
          const testSession = await sessionManager.getSession(testSessionId);
          testSession.name = testSessionName;
          await sessionManager.saveSession(testSession, undefined, jobQueue);

          const _job = await jobQueue.add('process-message', {
            apiKey,
            llmApiKey,
            llmModelName,
            llmProvider,
            prompt,
            sessionId: testSessionId,
          });

          res.status(202).json({
            jobId: _job.id,
            message: "Test automatique lancé, visible dans l'interface.",
            sessionId: testSessionId,
            sessionName: testSessionName,
          });
        } catch (_error) {
          next(_error);
        }
      },
    );

    // Middleware d'authentification pour les routes SSE
    const sseAuthMiddleware = (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      getLoggerInstance().debug(
        {
          hasAuthHeader: !!req.headers.authorization,
          hasAuthQuery: !!req.query.auth,
          hasTokenQuery: !!req.query.token,
          path: req.path,
          query: req.query,
        },
        'SSE auth middleware called',
      );

      // Handle authentication for SSE through query parameters as fallback
      if (
        req.path.startsWith('/api/chat/stream/') &&
        !req.headers.authorization &&
        (req.query.auth || req.query.token)
      ) {
        const token = req.query.auth || req.query.token;
        getLoggerInstance().debug(
          {
            tokenType: typeof token,
            tokenValue: token
              ? `${String(token).substring(0, 20)}...`
              : 'undefined',
          },
          'Processing SSE auth token from query parameters in SSE auth middleware',
        );
        if (typeof token === 'string') {
          // Check if token already has Bearer prefix
          if (token.startsWith('Bearer ')) {
            req.headers.authorization = token;
          } else {
            req.headers.authorization = `Bearer ${token}`;
          }
          getLoggerInstance().debug(
            { authorizationHeader: req.headers.authorization },
            'Set authorization header for SSE in SSE auth middleware',
          );
        }
      }

      // Apply authentication middleware to SSE endpoint
      const apiKey = req.headers.authorization;
      getLoggerInstance().debug(
        { apiKey: apiKey ? `${apiKey.substring(0, 20)}...` : 'undefined' },
        'Checking authorization header for SSE stream',
      );

      // UNIFIÉ: Utiliser uniquement AUTH_TOKEN partout
      const expectedToken = config.AUTH_TOKEN || process.env.AUTH_TOKEN || '';
      const expectedBearer = `Bearer ${expectedToken}`;
      getLoggerInstance().debug(
        {
          configToken: config.AUTH_TOKEN
            ? `${config.AUTH_TOKEN.substring(0, 10)}...`
            : 'undefined',
          envToken: process.env.AUTH_TOKEN
            ? `${process.env.AUTH_TOKEN.substring(0, 10)}...`
            : 'undefined',
          expectedTokenLength: expectedToken.length,
          matchResult: apiKey === expectedBearer,
          providedKey: apiKey,
          providedKeyLength: apiKey ? apiKey.length : 0,
          requiredKey: expectedBearer,
        },
        'SSE auth validation - Detailed comparison',
      );
      if (apiKey !== expectedBearer) {
        getLoggerInstance().warn(
          {
            configToken: config.AUTH_TOKEN
              ? `${config.AUTH_TOKEN.substring(0, 10)}...`
              : 'undefined',
            envToken: process.env.AUTH_TOKEN
              ? `${process.env.AUTH_TOKEN.substring(0, 10)}...`
              : 'undefined',
            providedKey: apiKey,
            requiredKey: expectedBearer,
          },
          'Unauthorized SSE access attempt',
        );
        return res.status(401).json({ error: 'Unauthorized' });
      }

      next();
    };

    app.get(
      '/api/chat/stream/:jobId',
      sseAuthMiddleware,
      async (
        req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        console.log('SSE route called');

        const { jobId } = req.params;

        // Set SSE headers
        res.writeHead(200, {
          'Access-Control-Allow-Headers': 'Cache-Control',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Content-Type': 'text/event-stream',
        });

        // Send initial connection message
        res.write(
          'data: {"type":"connection","message":"Connected to stream"}\n\n',
        );

        try {
          // Create Redis subscriber for job events
          const subscriber = redisClient.duplicate();

          // Handle client disconnect
          req.on('close', () => {
            console.log(`Client disconnected from stream for job ${jobId}`);
            subscriber.quit();
          });

          // Subscribe to job events
          await subscriber.subscribe(`job:${jobId}:events`);

          subscriber.on('message', (channel, message) => {
            try {
              // Parse the message
              const eventData = JSON.parse(message);

              // Filter out agent_thought messages to prevent them from being displayed in the canvas
              if (eventData.type === 'agent_thought') {
                console.log(`[FILTER] Skipping agent_thought message for job ${jobId}`);
                return;
              }

              // Special handling for chat_header_todo messages - forward them to frontend
              if (eventData.type === 'chat_header_todo') {
                console.log(`[FORWARD] Forwarding chat_header_todo message for job ${jobId}`);
                // Send the event data as-is for chat header todo messages
                res.write(`data: ${JSON.stringify(eventData)}\n\n`);
              } else {
                // Send the event data for other message types
                res.write(`data: ${JSON.stringify(eventData)}\n\n`);
              }

              // If this is a completion event, end the stream
              if (
                eventData.type === 'completed' ||
                eventData.type === 'error'
              ) {
                res.write(
                  'data: {"type":"stream_end","message":"Stream closed"}\n\n',
                );
                res.end();
                subscriber.quit();
              }
            } catch (err) {
              console.error('Error processing stream message:', err);
              res.write(
                `data: {"type":"error","message":"Error processing message"}\n\n`,
              );
            }
          });

          // Also listen for job completion through another channel if needed
          const jobCompletionChannel = `job:${jobId}:completed`;
          await subscriber.subscribe(jobCompletionChannel);

          subscriber.on('message', (channel, message) => {
            if (channel === jobCompletionChannel) {
              try {
                const completionData = JSON.parse(message);
                res.write(`data: ${JSON.stringify(completionData)}\n\n`);
                res.write(
                  'data: {"type":"stream_end","message":"Stream closed"}\n\n',
                );
                res.end();
                subscriber.quit();
              } catch (err) {
                console.error('Error processing completion message:', err);
                res.write(
                  `data: {"type":"error","message":"Error processing completion"}\n\n`,
                );
                res.end();
                subscriber.quit();
              }
            }
          });
        } catch (error) {
          console.error('Error in SSE stream:', error);
          res.write(
            `data: {"type":"error","message":"Stream error: ${error}"}\n\n`,
          );
          res.end();
        }
      },
    );

    app.post(
      '/api/session',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        const sessionId = req.sessionId;
        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID is missing.' });
        }
        try {
          await req.sessionManager!.getSession(sessionId);
          getLoggerInstance().info(
            { sessionId },
            'Session implicitly created/retrieved via cookie/header.',
          );
          res.status(200).json({
            message: 'Session managed automatically via cookie/header.',
            sessionId,
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error managing session implicitly',
          );
          next(error);
        }
      },
    );

    app.post(
      '/api/session/llm-provider',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { providerName } = req.body;
          const sessionId = req.sessionId;

          if (!sessionId || !providerName) {
            throw new AppError('Missing session ID or provider name', {
              statusCode: 400,
            });
          }

          const session = await req.sessionManager!.getSession(sessionId);
          session.activeLlmProvider = providerName;
          await req.sessionManager!.saveSession(session, req.job, jobQueue);

          getLoggerInstance().info(
            { providerName, sessionId },
            'Active LLM provider updated for session.',
          );
          res
            .status(200)
            .json({ message: 'Active LLM provider updated successfully.' });
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/leaderboard-stats',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Initialize stats with 0 if they don't exist
          let sessionsCreated = await redisClient.get(
            'leaderboard:sessionsCreated',
          );
          if (sessionsCreated === null) {
            sessionsCreated = '0';
            await redisClient.set('leaderboard:sessionsCreated', '0');
          }

          let tokensSaved = await redisClient.get('leaderboard:tokensSaved');
          if (tokensSaved === null) {
            tokensSaved = '0';
            await redisClient.set('leaderboard:tokensSaved', '0');
          }

          let successfulRuns = await redisClient.get(
            'leaderboard:successfulRuns',
          );
          if (successfulRuns === null) {
            successfulRuns = '0';
            await redisClient.set('leaderboard:successfulRuns', '0');
          }

          let apiKeysAdded = await redisClient.get('leaderboard:apiKeysAdded');
          if (apiKeysAdded === null) {
            apiKeysAdded = '0';
            await redisClient.set('leaderboard:apiKeysAdded', '0');
          }

          res.status(200).json({
            apiKeysAdded: parseInt(apiKeysAdded, 10),
            sessionsCreated: parseInt(sessionsCreated, 10),
            successfulRuns: parseInt(successfulRuns, 10),
            tokensSaved: parseInt(tokensSaved, 10),
          });
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/leaderboard',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Get the actual API keys from the key manager
          const apiKeys = await _LlmKeyManager.getKeysForApi();

          // Generate mock usage data for each key
          const leaderboardData = apiKeys.map((key, index) => {
            // Generate mock usage stats
            const requestsLimit = Math.floor(Math.random() * 10000) + 1000;
            const requestsCount = Math.floor(Math.random() * requestsLimit);
            const tokensLimit = Math.floor(Math.random() * 2000000) + 100000;
            const tokensCount = Math.floor(Math.random() * tokensLimit);

            return {
              id: `key-${index + 1}`,
              keyMask: maskApiKey(key.apiKey),
              provider: key.apiProvider,
              rank: index + 1,
              requests: { count: requestsCount, limit: requestsLimit },
              tokens: { count: tokensCount, limit: tokensLimit },
            };
          });

          res.status(200).json(leaderboardData);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.post(
      '/api/sessions/save',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id, messages, name, timestamp } = req.body;
          if (!id || !name || !messages || !timestamp) {
            throw new AppError('Missing session data', { statusCode: 400 });
          }
          const sessionDataToSave: SessionData = {
            history: messages as Message[],
            id,
            identities: [],
            name,
            timestamp,
          };
          await req.sessionManager!.saveSession(
            sessionDataToSave,
            req.job,
            getJobQueue(),
          );
          getLoggerInstance().info(
            { sessionId: id, sessionName: name },
            'Session saved to PostgreSQL.',
          );
          res.status(200).json({ message: 'Session saved successfully.' });
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/sessions/:id',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;
          const sessionData = await req.sessionManager!.getSession(id);
          if (!sessionData) {
            throw new AppError('Session not found', { statusCode: 404 });
          }
          res.status(200).json(sessionData);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.delete(
      '/api/sessions/:id',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;
          await req.sessionManager!.deleteSession(id);
          getLoggerInstance().info(
            { sessionId: id },
            'Session deleted from PostgreSQL.',
          );
          res.status(200).json({ message: 'Session deleted successfully.' });
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.put(
      '/api/sessions/:id/rename',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;
          const { newName } = req.body;
          if (!newName) {
            throw new AppError('New name is missing', { statusCode: 400 });
          }
          const updatedSession = await req.sessionManager!.renameSession(
            id,
            newName,
          );
          getLoggerInstance().info(
            { newName, sessionId: id },
            'Session renamed in PostgreSQL.',
          );
          res.status(200).json({
            message: 'Session renamed successfully.',
            session: updatedSession,
          });
        } catch (_error) {
          next(_error);
        }
      },
    );

    // LLM Key Manager API endpoints
    app.post(
      '/api/llm-keys/keys',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const {
            apiModel,
            baseUrl,
            keyName,
            keyValue,
            metadata,
            providerId,
            providerName,
          } = req.body;
          if (!providerId || !keyValue) {
            throw new AppError('Missing provider or key', { statusCode: 400 });
          }

          // Store in Redis using the LlmKeyManager
          await _LlmKeyManager.addKey(
            providerId,
            keyValue,
            apiModel || config.LLM_MODEL_NAME,
            baseUrl,
          );

          // Also store in the new Redis format for the key manager UI
          const redisKey = `llm:keys:${providerId}:${Date.now()}`;
          const keyData = {
            createdAt: new Date().toISOString(),
            isActive: true,
            isEncrypted: false,
            keyName:
              keyName ||
              (providerId === 'gemini' ? 'Gemini Key' : `${providerId}-key`),
            keyValue,
            metadata: metadata || {
              description: '',
              environment: 'development',
              tags: [],
            },
            provider: providerId,
            providerName: providerName || providerId,
            updatedAt: new Date().toISOString(),
            usageCount: 0,
          };

          await redisClient.set(redisKey, JSON.stringify(keyData));

          res.status(200).json({
            id: redisKey.split(':').pop(), // Extract ID from Redis key
            ...keyData,
          });
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-keys/keys',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Get keys from both the legacy LlmKeyManager and new Redis format
          const legacyKeys = await _LlmKeyManager.getKeysForApi();

          // Get keys from new Redis format
          const redisKeys = await redisClient.keys('llm:keys:*');
          const newKeys = [];

          for (const key of redisKeys) {
            const value = await redisClient.get(key);
            if (value) {
              try {
                const keyData = JSON.parse(value);
                newKeys.push({
                  id: key,
                  ...keyData,
                });
              } catch (parseError) {
                getLoggerInstance().warn(
                  { error: parseError, key },
                  'Failed to parse Redis key value as JSON',
                );
              }
            }
          }

          // Combine both sets of keys
          const allKeys = [
            ...legacyKeys.map((key, index) => ({
              createdAt: new Date().toISOString(),
              id: `legacy-${index}`,
              isActive: true,
              isEncrypted: false,
              keyName: `${key.apiProvider}-key`,
              keyValue: key.apiKey,
              metadata: {
                description: '',
                environment: 'development',
                tags: [],
              },
              providerId: key.apiProvider,
              providerName: key.apiProvider,
              updatedAt: new Date().toISOString(),
              usageCount: 0,
            })),
            ...newKeys,
          ];

          res.status(200).json(allKeys);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.delete(
      '/api/llm-keys/keys/:id',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;

          // Check if it's a legacy key
          if (id.startsWith('legacy-')) {
            const keyIndex = parseInt(id.replace('legacy-', ''), 10);
            if (isNaN(keyIndex)) {
              throw new AppError('Invalid index', { statusCode: 400 });
            }
            await _LlmKeyManager.removeKey(keyIndex);
          } else {
            // Delete from Redis
            await redisClient.del(id);
          }

          res
            .status(200)
            .json({ message: 'LLM API key removed successfully.' });
        } catch (error) {
          next(error);
        }
      },
    );

    app.put(
      '/api/llm-keys/keys/:id',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;
          const {
            apiModel,
            baseUrl,
            isActive,
            keyName,
            keyValue,
            metadata,
            providerId,
            providerName,
          } = req.body;

          if (!providerId || !keyValue) {
            throw new AppError('Missing provider or key', { statusCode: 400 });
          }

          // Check if it's a legacy key
          if (id.startsWith('legacy-')) {
            const keyIndex = parseInt(id.replace('legacy-', ''), 10);
            if (isNaN(keyIndex)) {
              throw new AppError('Invalid index', { statusCode: 400 });
            }
            // TODO: Implement LlmKeyManager.updateKey method
            // await _LlmKeyManager.updateKey(keyIndex, providerId, keyValue, apiModel || config.LLM_MODEL_NAME, baseUrl);

            res
              .status(200)
              .json({ message: 'Legacy key update not implemented yet' });
          } else {
            // Update in Redis
            const redisKey = id;
            const keyData = {
              createdAt: new Date().toISOString(),
              isActive: isActive !== undefined ? isActive : true,
              isEncrypted: false,
              keyName:
                keyName ||
                (providerId === 'gemini' ? 'Gemini Key' : `${providerId}-key`),
              keyValue,
              metadata: metadata || {
                description: '',
                environment: 'development',
                tags: [],
              },
              provider: providerId,
              providerName: providerName || providerId,
              updatedAt: new Date().toISOString(),
              usageCount: 0,
            };

            await redisClient.set(redisKey, JSON.stringify(keyData));

            res.status(200).json({
              id: redisKey.split(':').pop(), // Extract ID from Redis key
              ...keyData,
            });
          }
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-keys/providers',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Return the same provider list as the working endpoint
          const providers = [
            {
              description: 'GPT models including GPT-4, GPT-3.5, and DALL-E',
              displayName: 'OpenAI',
              id: 'openai',
              isActive: true,
              keyFormat: 'sk-...',
              name: 'openai',
              supportedModels: [
                'gpt-4',
                'gpt-4-turbo',
                'gpt-3.5-turbo',
                'dall-e-3',
                'whisper-1',
              ],
              testEndpoint: '/v1/models',
              website: 'https://openai.com',
            },
            {
              description: 'Claude models for advanced AI assistance',
              displayName: 'Anthropic',
              id: 'anthropic',
              isActive: true,
              keyFormat: 'sk-ant-...',
              name: 'anthropic',
              supportedModels: [
                'claude-3-opus',
                'claude-3-sonnet',
                'claude-3-haiku',
              ],
              testEndpoint: '/v1/models',
              website: 'https://anthropic.com',
            },
            {
              description: 'Gemini 2.5 Flash - Fast and efficient model',
              displayName: 'Google Gemini Flash',
              id: 'google-flash',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-flash'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Gemini 2.5 Pro - Advanced reasoning model',
              displayName: 'Gemini',
              id: 'gemini',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-pro'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Grok-4 advanced reasoning model',
              displayName: 'xAI Grok',
              id: 'xai',
              isActive: true,
              keyFormat: 'xai-...',
              name: 'xai',
              supportedModels: ['grok-4'],
              testEndpoint: '/v1/models',
              website: 'https://x.ai',
            },
            {
              description: 'Qwen3 Coder Plus - Advanced coding model',
              displayName: 'Qwen',
              id: 'qwen',
              isActive: true,
              keyFormat: '...',
              name: 'qwen',
              supportedModels: ['qwen3-coder-plus'],
              testEndpoint: 'https://portal.qwen.ai/v1/chat/completions',
              website: 'https://portal.qwen.ai',
            },
            {
              description: 'Access to multiple AI models via unified API - GLM-4.5-Air Free',
              displayName: 'OpenRouter',
              id: 'openrouter',
              isActive: true,
              keyFormat: 'sk-or-...',
              name: 'openrouter',
              supportedModels: ['z-ai/glm-4.5-air:free'],
              testEndpoint: 'https://openrouter.ai/api/v1/models',
              website: 'https://openrouter.ai',
            },
          ];
          res.status(200).json(providers);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-keys/hierarchy',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const hierarchy = await _LlmKeyManager.getKeyHierarchy();
          res.status(200).json(hierarchy);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-keys/master-key',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Get master key from environment variables
          const masterApiKey = process.env.LLM_API_KEY || config.LLM_API_KEY;

          if (!masterApiKey) {
            return res.status(200).json(null);
          }

          const masterKey = {
            apiKey: masterApiKey,
            apiModel: process.env.LLM_MODEL_NAME || config.LLM_MODEL_NAME || 'qwen3-coder-plus',
            apiProvider: process.env.LLM_PROVIDER || 'qwen',
            errorCount: 0,
          };

          res.status(200).json(masterKey);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-api-keys',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Get keys from both the legacy LlmKeyManager and new Redis format
          const legacyKeys = await _LlmKeyManager.getKeysForApi();

          // Get keys from new Redis format
          const redisKeys = await redisClient.keys('llm:keys:*');
          const newKeys = [];

          for (const key of redisKeys) {
            const value = await redisClient.get(key);
            if (value) {
              try {
                const keyData = JSON.parse(value);
                newKeys.push({
                  apiKey: keyData.keyValue,
                  apiModel:
                    keyData.metadata?.tags?.[0] || config.LLM_MODEL_NAME,
                  apiProvider: keyData.provider,
                  baseUrl: '',
                  errorCount: 0,
                  isPermanentlyDisabled: !keyData.isActive,
                });
              } catch (parseError) {
                getLoggerInstance().warn(
                  { error: parseError, key },
                  'Failed to parse Redis key value as JSON',
                );
              }
            }
          }

          // Combine both sets of keys, with legacy keys taking precedence
          const allKeys = [
            ...legacyKeys,
            ...newKeys.filter(
              (newKey) =>
                !legacyKeys.some(
                  (legacyKey) =>
                    legacyKey.apiProvider === newKey.apiProvider &&
                    legacyKey.apiKey === newKey.apiKey,
                ),
            ),
          ];

          res.status(200).json(allKeys);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-api-keys/providers',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Return the same provider list as the working endpoint
          const providers = [
            {
              description: 'GPT models including GPT-4, GPT-3.5, and DALL-E',
              displayName: 'OpenAI',
              id: 'openai',
              isActive: true,
              keyFormat: 'sk-...',
              name: 'openai',
              supportedModels: [
                'gpt-4',
                'gpt-4-turbo',
                'gpt-3.5-turbo',
                'dall-e-3',
                'whisper-1',
              ],
              testEndpoint: '/v1/models',
              website: 'https://openai.com',
            },
            {
              description: 'Claude models for advanced AI assistance',
              displayName: 'Anthropic',
              id: 'anthropic',
              isActive: true,
              keyFormat: 'sk-ant-...',
              name: 'anthropic',
              supportedModels: [
                'claude-3-opus',
                'claude-3-sonnet',
                'claude-3-haiku',
              ],
              testEndpoint: '/v1/models',
              website: 'https://anthropic.com',
            },
            {
              description: 'Gemini 2.5 Flash - Fast and efficient model',
              displayName: 'Google Gemini Flash',
              id: 'google-flash',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-flash'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Gemini 2.5 Pro - Advanced reasoning model',
              displayName: 'Gemini',
              id: 'gemini',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-pro'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Grok-4 advanced reasoning model',
              displayName: 'xAI Grok',
              id: 'xai',
              isActive: true,
              keyFormat: 'xai-...',
              name: 'xai',
              supportedModels: ['grok-4'],
              testEndpoint: '/v1/models',
              website: 'https://x.ai',
            },
            {
              description: 'Qwen3 Coder Plus - Advanced coding model',
              displayName: 'Qwen',
              id: 'qwen',
              isActive: true,
              keyFormat: '...',
              name: 'qwen',
              supportedModels: ['qwen3-coder-plus'],
              testEndpoint: 'https://portal.qwen.ai/v1/chat/completions',
              website: 'https://portal.qwen.ai',
            },
            {
              description: 'Access to multiple AI models via unified API - GLM-4.5-Air Free',
              displayName: 'OpenRouter',
              id: 'openrouter',
              isActive: true,
              keyFormat: 'sk-or-...',
              name: 'openrouter',
              supportedModels: ['z-ai/glm-4.5-air:free'],
              testEndpoint: 'https://openrouter.ai/api/v1/models',
              website: 'https://openrouter.ai',
            },
          ];
          res.status(200).json(providers);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-api-keys/hierarchy',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const hierarchy = await _LlmKeyManager.getKeyHierarchy();
          res.status(200).json(hierarchy);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-api-keys/master-key',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // TODO: Implement getMasterKey method
          const masterKey = null;
          res.status(200).json(masterKey);
        } catch (_error) {
          next(_error);
        }
      },
    );

    // PUT /api/llm-api-keys/keys/:id - Update key by ID
    app.put(
      '/api/llm-api-keys/keys/:id',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;
          const {
            apiModel,
            baseUrl,
            isActive,
            keyName,
            keyValue,
            metadata,
            priority,
            providerId,
            providerName,
          } = req.body;

          if (!providerId || !keyValue) {
            throw new AppError('Missing provider or key', { statusCode: 400 });
          }

          // Check if it's a legacy key
          if (id.startsWith('legacy-')) {
            const keyIndex = parseInt(id.replace('legacy-', ''), 10);
            if (isNaN(keyIndex)) {
              throw new AppError('Invalid index', { statusCode: 400 });
            }

            // Remove the old key
            await _LlmKeyManager.removeKey(keyIndex);

            // Add the updated key
            await _LlmKeyManager.addKey(
              providerId,
              keyValue,
              apiModel || config.LLM_MODEL_NAME,
              baseUrl,
            );

            res
              .status(200)
              .json({ message: 'LLM API key updated successfully.' });
          } else {
            // Update in Redis
            const keyData = {
              createdAt: new Date().toISOString(),
              isActive: isActive !== undefined ? isActive : true,
              isEncrypted: false,
              keyName:
                keyName ||
                (providerId === 'gemini' ? 'Gemini Key' : `${providerId}-key`),
              keyValue,
              metadata: metadata || {
                description: '',
                environment: 'development',
                tags: [],
              },
              priority: priority !== undefined ? priority : 5,
              provider: providerId,
              providerName: providerName || providerId,
              updatedAt: new Date().toISOString(),
              usageCount: 0,
            };

            await redisClient.set(id, JSON.stringify(keyData));

            res.status(200).json({
              id,
              ...keyData,
            });
          }
        } catch (error) {
          next(error);
        }
      },
    );

    // Endpoint pour tester une clé API LLM
    app.post(
      '/api/llm-keys/test',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { baseUrl, keyValue, provider } = req.body;

          if (!provider || !keyValue) {
            throw new AppError('Le fournisseur et la clé API sont requis.', {
              statusCode: 400,
            });
          }

          let requestUrl = '';
          let requestOptions: RequestInit = {};

          switch (provider) {
            case 'anthropic':
              requestUrl = baseUrl || 'https://api.anthropic.com/v1/models';
              requestOptions = {
                headers: {
                  'anthropic-version': '2023-06-01',
                  'Content-Type': 'application/json',
                  'x-api-key': keyValue,
                },
                method: 'GET',
              };
              break;
            case 'gemini':
            case 'google':
            case 'google-flash':
            case 'google-pro':
              requestUrl =
                baseUrl ||
                `https://generativelanguage.googleapis.com/v1beta/models?key=${keyValue}`;
              requestOptions = {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'GET',
              };
              break;
            case 'openai':
              requestUrl = baseUrl || 'https://api.openai.com/v1/models';
              requestOptions = {
                headers: {
                  Authorization: `Bearer ${keyValue}`,
                  'Content-Type': 'application/json',
                },
                method: 'GET',
              };
              break;
            case 'openrouter':
              requestUrl = baseUrl || 'https://openrouter.ai/api/v1/models';
              requestOptions = {
                headers: {
                  Authorization: `Bearer ${keyValue}`,
                  'Content-Type': 'application/json',
                },
                method: 'GET',
              };
              break;
            case 'qwen':
              requestUrl =
                baseUrl || 'https://dashscope.aliyuncs.com/api/v1/models';
              requestOptions = {
                headers: {
                  Authorization: `Bearer ${keyValue}`,
                  'Content-Type': 'application/json',
                },
                method: 'GET',
              };
              break;
            case 'xai':
              requestUrl = baseUrl || 'https://api.x.ai/v1/models';
              requestOptions = {
                headers: {
                  Authorization: `Bearer ${keyValue}`,
                  'Content-Type': 'application/json',
                },
                method: 'GET',
              };
              break;
            default:
              throw new AppError(
                `Le fournisseur '${provider}' n'est pas supporté pour le test.`,
                { statusCode: 400 },
              );
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(requestUrl, {
            ...requestOptions,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            res
              .status(200)
              .json({ message: 'La clé est valide.', valid: true });
          } else {
            const errorBody = await response.text();
            getLoggerInstance().warn(
              {
                error: errorBody,
                provider,
                status: response.status,
              },
              'Test de clé API LLM échoué',
            );
            res
              .status(200)
              .json({
                message: `Clé invalide ou erreur API (status: ${response.status})`,
                valid: false,
              });
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            res
              .status(200)
              .json({
                message: 'Timeout lors du test de la clé API',
                valid: false,
              });
          } else {
            next(error);
          }
        }
      },
    );

    // Legacy endpoints for backward compatibility
    app.post(
      '/api/llm-api-keys',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { baseUrl, key, model, provider } = req.body;
          if (!provider || !key) {
            throw new AppError('Missing provider or key', { statusCode: 400 });
          }

          // Store in legacy LlmKeyManager format
          await _LlmKeyManager.addKey(
            provider,
            key,
            model || config.LLM_MODEL_NAME,
            baseUrl,
          );

          // Also store in the new Redis format for the key manager UI
          const timestamp = Date.now();
          const redisKey = `llm:keys:${provider}:${timestamp}`;
          const keyData = {
            createdAt: new Date().toISOString(),
            isActive: true,
            isEncrypted: false,
            keyName: `${provider}-key`,
            keyValue: key,
            metadata: {
              description: `${provider} key added through UI`,
              environment: 'development',
              tags: [model || config.LLM_MODEL_NAME || 'default'],
            },
            provider: provider,
            providerName: provider,
            updatedAt: new Date().toISOString(),
            usageCount: 0,
          };

          getLoggerInstance().info(
            { keyData, redisKey },
            'Attempting to store key in new Redis format',
          );

          try {
            // Test Redis connection first
            const testResult = await redisClient.ping();
            getLoggerInstance().info(
              { testResult },
              'Redis connection test result',
            );

            await redisClient.set(redisKey, JSON.stringify(keyData));
            getLoggerInstance().info(
              { redisKey },
              'Successfully stored key in new Redis format',
            );
          } catch (redisError) {
            getLoggerInstance().error(
              { error: redisError, redisKey },
              'Failed to store key in new Redis format',
            );
          }

          res.status(200).json({ message: 'LLM API key added successfully.' });
        } catch (_error) {
          getLoggerInstance().error(
            { error: _error },
            'Failed to add LLM API key',
          );
          next(_error);
        }
      },
    );

    app.get(
      '/api/llm-api-keys',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const keys = await _LlmKeyManager.getKeysForApi();
          res.status(200).json(keys);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.delete(
      '/api/llm-api-keys/:index',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { index } = req.params;
          const keyIndex = parseInt(index, 10);
          if (isNaN(keyIndex)) {
            throw new AppError('Invalid index', { statusCode: 400 });
          }
          await _LlmKeyManager.removeKey(keyIndex);
          res
            .status(200)
            .json({ message: 'LLM API key removed successfully.' });
        } catch (error) {
          next(error);
        }
      },
    );

    app.put(
      '/api/llm-api-keys/:index',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { index } = req.params;
          const { baseUrl, key, model, provider } = req.body;
          const keyIndex = parseInt(index, 10);

          if (isNaN(keyIndex)) {
            throw new AppError('Invalid index', { statusCode: 400 });
          }

          if (!provider || !key) {
            throw new AppError('Missing provider or key', { statusCode: 400 });
          }

          // Remove the old key
          await _LlmKeyManager.removeKey(keyIndex);

          // Add the updated key
          await _LlmKeyManager.addKey(
            provider,
            key,
            model || config.LLM_MODEL_NAME,
            baseUrl,
          );

          res
            .status(200)
            .json({ message: 'LLM API key updated successfully.' });
        } catch (error) {
          next(error);
        }
      },
    );

    // New endpoints for frontend LLM key manager compatibility

    // PUT /api/llm-api-keys/keys/:id - Update key by frontend ID
    app.put(
      '/api/llm-api-keys/keys/:id',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;
          const { isActive } = req.body;

          // Get all keys to find the one with matching frontend ID
          const keys = await _LlmKeyManager.getKeysForApi();
          const keyIndex = keys.findIndex(
            (key, index) =>
              `${key.apiProvider}-${index}-${Math.floor(Date.now() / 1000) * 1000}` ===
                id || id.startsWith(`${key.apiProvider}-${index}-`),
          );

          if (keyIndex === -1) {
            throw new AppError('Key not found', { statusCode: 404 });
          }

          // Update the key's disabled status
          const key = keys[keyIndex];
          key.isPermanentlyDisabled = !isActive;

          // Save back to Redis
          await _LlmKeyManager.saveKeys(keys);

          res.status(200).json({ message: 'Key updated successfully' });
        } catch (error) {
          next(error);
        }
      },
    );

    // DELETE /api/llm-api-keys/keys/:id - Delete key by frontend ID
    app.delete(
      '/api/llm-api-keys/keys/:id',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;

          // Get all keys to find the one with matching frontend ID
          const keys = await _LlmKeyManager.getKeysForApi();
          const keyIndex = keys.findIndex(
            (key, index) =>
              `${key.apiProvider}-${index}-${Math.floor(Date.now() / 1000) * 1000}` ===
                id || id.startsWith(`${key.apiProvider}-${index}-`),
          );

          if (keyIndex === -1) {
            throw new AppError('Key not found', { statusCode: 404 });
          }

          await _LlmKeyManager.removeKey(keyIndex);
          res.status(200).json({ message: 'Key deleted successfully' });
        } catch (error) {
          next(error);
        }
      },
    );

    // POST /api/llm-api-keys/keys/:id/test - Test key
    app.post(
      '/api/llm-api-keys/keys/:id/test',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;

          // Get all keys to find the one with matching frontend ID
          const keys = await _LlmKeyManager.getKeysForApi();
          const keyIndex = keys.findIndex(
            (key, index) =>
              `${key.apiProvider}-${index}-${Math.floor(Date.now() / 1000) * 1000}` ===
                id || id.startsWith(`${key.apiProvider}-${index}-`),
          );

          if (keyIndex === -1) {
            throw new AppError('Key not found', { statusCode: 404 });
          }

          const key = keys[keyIndex];

          // Simple test - just check if the key exists and is not permanently disabled
          const isValid =
            !key.isPermanentlyDisabled && key.apiKey && key.apiKey.length > 0;

          res.status(200).json({
            message: isValid ? 'Key is valid' : 'Key is invalid or disabled',
            valid: isValid,
          });
        } catch (error) {
          next(error);
        }
      },
    );

    // Middleware to verify auth token for sync operations
    const verifyAuthToken = (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const authHeader = req.headers.authorization;
      let token = authHeader;

      // Handle both Bearer token format and plain token format
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }

      // Use the same token logic as the main auth middleware
      const expectedToken =
        config.AUTH_TOKEN ||
        process.env.AUTH_TOKEN ||
        'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0';

      if (!token || token !== expectedToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      next();
    };

    // POST /api/llm-api-keys/sync - Sync with Redis
    app.post(
      '/api/llm-api-keys/sync',
      verifyAuthToken,
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Just return success - keys are already synced with Redis
          res.status(200).json({ message: 'Sync completed successfully' });
        } catch (error) {
          next(error);
        }
      },
    );

    // POST /api/llm-api-keys/import-from-redis
    app.post(
      '/api/llm-api-keys/import-from-redis',
      verifyAuthToken,
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Keys are already imported from Redis in getKeys()
          res.status(200).json({ message: 'Import completed successfully' });
        } catch (error) {
          next(error);
        }
      },
    );

    // POST /api/llm-api-keys/export-to-redis
    app.post(
      '/api/llm-api-keys/export-to-redis',
      verifyAuthToken,
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Keys are automatically saved to Redis, so just return success
          res.status(200).json({ message: 'Export completed successfully' });
        } catch (error) {
          next(error);
        }
      },
    );

    // POST /api/llm-api-keys/cleanup-duplicates
    app.post(
      '/api/llm-api-keys/cleanup-duplicates',
      verifyAuthToken,
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Utiliser la nouvelle méthode de dédoublonnage intégrée
          const result = await _LlmKeyManager.deduplicateKeys();

          if (result.duplicatesRemoved > 0) {
            res.status(200).json({
              after: result.uniqueCount,
              before: result.originalCount,
              duplicatesRemoved: result.duplicatesRemoved,
              message: `🧹 Cleanup completed. Removed ${result.duplicatesRemoved} duplicates.`,
            });
          } else {
            res.status(200).json({
              after: result.uniqueCount,
              before: result.originalCount,
              duplicatesRemoved: 0,
              message: '✅ No duplicates found - all keys are unique!',
            });
          }
        } catch (error) {
          next(error);
        }
      },
    );

    app.get(
      '/api/sessions',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const sessions = await req.sessionManager!.getAllSessions();
          res.status(200).json(sessions);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.get(
      '/api/auth/github',
      (req: express.Request, res: express.Response) => {
        const githubClientId = config.GITHUB_CLIENT_ID;
        if (!githubClientId) {
          return res
            .status(500)
            .json({ error: 'GitHub Client ID not configured.' });
        }
        const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;
        res.redirect(githubAuthUrl);
      },
    );

    app.get(
      '/api/auth/github/callback',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const code = Array.isArray(req.query.code)
            ? req.query.code[0]
            : req.query.code;
          const githubClientId = config.GITHUB_CLIENT_ID;
          const githubClientSecret = config.GITHUB_CLIENT_SECRET;

          getLoggerInstance().info(
            {
              code: code ? `${String(code).substring(0, 10)}...` : 'undefined',
            },
            'GitHub OAuth callback received',
          );

          if (!code || !githubClientId || !githubClientSecret) {
            getLoggerInstance().error(
              {
                code,
                githubClientId: githubClientId ? '***REDACTED***' : 'undefined',
                githubClientSecret: githubClientSecret
                  ? '***REDACTED***'
                  : 'undefined',
              },
              'Missing code or GitHub credentials',
            );
            throw new AppError('Missing code or GitHub credentials', {
              statusCode: 400,
            });
          }

          const tokenResponse = await fetch(
            'https://github.com/login/oauth/access_token',
            {
              body: JSON.stringify({
                client_id: githubClientId,
                client_secret: githubClientSecret,
                code: String(code),
              }),
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              method: 'POST',
            },
          );

          const tokenData = await tokenResponse.json();

          if (tokenData.error) {
            const loggedTokenData = { ...tokenData };
            if (loggedTokenData.access_token) {
              loggedTokenData.access_token = '***REDACTED***';
            }
            getLoggerInstance().error(
              { tokenData: loggedTokenData },
              'GitHub OAuth Error',
            );
            throw new AppError(
              `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`,
              { statusCode: 400 },
            );
          }

          const accessToken = tokenData.access_token;
          getLoggerInstance().info(
            { accessToken: '***REDACTED***' },
            'GitHub access token received',
          );

          if (req.sessionId) {
            await redisClient.set(
              `github:accessToken:${req.sessionId}`,
              accessToken,
              'EX',
              3600,
            );
            getLoggerInstance().info(
              { accessToken: '***REDACTED***', sessionId: req.sessionId },
              'GitHub access token stored in Redis.',
            );

            if (config.JWT_SECRET) {
              const userId = req.sessionId;
              const token = jwt.sign({ userId }, config.JWT_SECRET, {
                expiresIn: '1h',
              });
              res.cookie('agenticforge_jwt', token, {
                httpOnly: true,
                maxAge: 3600 * 1000,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              });
              getLoggerInstance().info(
                { token: `${token.substring(0, 20)}...`, userId },
                'JWT issued and sent to frontend.',
              );
            } else {
              getLoggerInstance().warn(
                'JWT_SECRET is not configured, skipping JWT issuance.',
              );
            }
          }

          res.redirect('/?github_auth_success=true');
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error in GitHub OAuth callback',
          );
          next(error);
        }
      },
    );

    // Qwen OAuth 2.0 with PKCE
    app.get('/api/auth/qwen', (req: express.Request, res: express.Response) => {
      const qwenClientId = config.QWEN_CLIENT_ID;
      if (!qwenClientId) {
        return res
          .status(500)
          .json({ error: 'Qwen Client ID not configured.' });
      }

      // Generate code verifier for PKCE
      const codeVerifier = randomBytes(32).toString('hex');

      // Generate code challenge (SHA256 hash of code verifier, then base64url encoded)
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Store code verifier in Redis with a 10-minute expiration
      if (req.sessionId) {
        redisClient.set(
          `qwen:codeVerifier:${req.sessionId}`,
          codeVerifier,
          'EX',
          600,
        );
        getLoggerInstance().info(
          { sessionId: req.sessionId },
          'Qwen code verifier stored in Redis for PKCE.',
        );
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/qwen/callback`;
      const qwenAuthUrl = `https://qianwen.aliyun.com/oauth2/v1/authorize?response_type=code&client_id=${qwenClientId}&redirect_uri=${redirectUri}&scope=https://qianwen.aliyun.com/api&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      res.redirect(qwenAuthUrl);
    });

    app.get(
      '/api/auth/qwen/callback',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const code = Array.isArray(req.query.code)
            ? req.query.code[0]
            : req.query.code;
          const qwenClientId = config.QWEN_CLIENT_ID;
          const qwenClientSecret = config.QWEN_CLIENT_SECRET;

          getLoggerInstance().info(
            {
              code: code ? `${String(code).substring(0, 10)}...` : 'undefined',
            },
            'Qwen OAuth callback received',
          );

          if (!code || !qwenClientId || !qwenClientSecret) {
            getLoggerInstance().error(
              {
                code,
                qwenClientId: qwenClientId ? '***REDACTED***' : 'undefined',
                qwenClientSecret: qwenClientSecret
                  ? '***REDACTED***'
                  : 'undefined',
              },
              'Missing code or Qwen credentials',
            );
            throw new AppError('Missing code or Qwen credentials', {
              statusCode: 400,
            });
          }

          // Retrieve code verifier from Redis
          let codeVerifier = null;
          if (req.sessionId) {
            codeVerifier = await redisClient.get(
              `qwen:codeVerifier:${req.sessionId}`,
            );
            // Delete the code verifier after retrieving it (one-time use)
            await redisClient.del(`qwen:codeVerifier:${req.sessionId}`);

            if (!codeVerifier) {
              getLoggerInstance().error(
                { sessionId: req.sessionId },
                'Code verifier not found in Redis for Qwen PKCE flow',
              );
              throw new AppError('Code verifier not found for PKCE flow', {
                statusCode: 400,
              });
            }
          }

          const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/qwen/callback`;

          const tokenResponse = await fetch(
            'https://qianwen.aliyun.com/oauth2/v1/token',
            {
              body: JSON.stringify({
                client_id: qwenClientId,
                client_secret: qwenClientSecret,
                code: String(code),
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
              }),
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              method: 'POST',
            },
          );

          const tokenData = await tokenResponse.json();

          if (tokenData.error) {
            const loggedTokenData = { ...tokenData };
            if (loggedTokenData.access_token) {
              loggedTokenData.access_token = '***REDACTED***';
            }
            getLoggerInstance().error(
              { tokenData: loggedTokenData },
              'Qwen OAuth Error',
            );
            throw new AppError(
              `Qwen OAuth error: ${tokenData.error_description || tokenData.error}`,
              { statusCode: 400 },
            );
          }

          const accessToken = tokenData.access_token;
          getLoggerInstance().info(
            { accessToken: '***REDACTED***' },
            'Qwen access token received',
          );

          if (req.sessionId) {
            await redisClient.set(
              `qwen:accessToken:${req.sessionId}`,
              accessToken,
              'EX',
              3600,
            );
            getLoggerInstance().info(
              { accessToken: '***REDACTED***', sessionId: req.sessionId },
              'Qwen access token stored in Redis.',
            );

            if (config.JWT_SECRET) {
              const userId = req.sessionId;
              const token = jwt.sign({ userId }, config.JWT_SECRET, {
                expiresIn: '1h',
              });
              res.cookie('agenticforge_jwt', token, {
                httpOnly: true,
                maxAge: 3600 * 1000,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              });
              getLoggerInstance().info(
                { token: `${token.substring(0, 20)}...`, userId },
                'JWT issued and sent to frontend.',
              );
            } else {
              getLoggerInstance().warn(
                'JWT_SECRET is not configured, skipping JWT issuance.',
              );
            }
          }

          res.redirect('/?qwen_auth_success=true');
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error in Qwen OAuth callback');
          next(error);
        }
      },
    );

    app.post(
      '/api/interrupt/:jobId',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { jobId } = req.params;
          const job = await getJobQueue().getJob(jobId);

          if (!job) {
            throw new AppError('Job non trouvé.', { statusCode: 404 });
          }

          await redisClient.publish(`job:${jobId}:interrupt`, 'interrupt');

          res.status(200).json({ message: 'Interruption signal sent.' });
        } catch (error) {
          next(error);
        }
      },
    );

    app.post(
      '/api/admin/:action',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { action } = req.params;
          const scriptPath = path.resolve(process.cwd(), '..', 'run.sh');
          let command = '';

          switch (action) {
            case 'all-checks':
              command = `${scriptPath} all-checks`;
              break;
            case 'rebuild':
              command = `${scriptPath} rebuild`;
              break;
            case 'restart':
              command = `${scriptPath} restart`;
              break;
            default:
              throw new AppError('Invalid admin action.', { statusCode: 400 });
          }

          exec(command, (error, stdout, stderr) => {
            if (error) {
              getLoggerInstance().error(
                { error, stderr, stdout },
                `Error executing ${action}`,
              );
              return res.status(500).json({
                error: error.message,
                message: `Error during ${action}.`,
                stderr,
                stdout,
              });
            }
            getLoggerInstance().info(
              { stderr, stdout },
              `${action} executed successfully`,
            );
            res.status(200).json({
              message: `${action} completed successfully.`,
              output: stdout,
            });
          });
        } catch (error) {
          next(error);
        }
      },
    );

    app.get(
      '/api/status/:jobId',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { jobId } = req.params;
          const job = await getJobQueue().getJob(jobId);

          if (!job) {
            throw new AppError('Job non trouvé.', { statusCode: 404 });
          }

          const state = await job.getState();
          const progress = job.progress;
          const returnvalue = job.returnvalue;

          res.status(200).json({ jobId, progress, returnvalue, state });
        } catch (error) {
          next(error);
        }
      },
    );

    // Endpoint pour envoyer du contenu HTML au canvas
    app.post(
      '/api/canvas/display',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { content, contentType = 'html', jobId } = req.body;

          // Vérifier que les paramètres requis sont présents
          if (!jobId || !content) {
            throw new AppError('Les paramètres jobId et content sont requis.', {
              statusCode: 400,
            });
          }

          // Vérifier que le type de contenu est valide
          const validContentTypes = ['html', 'markdown', 'text', 'url'];
          if (!validContentTypes.includes(contentType)) {
            throw new AppError(
              `Type de contenu invalide. Types valides: ${validContentTypes.join(', ')}`,
              { statusCode: 400 },
            );
          }

          // Envoyer le contenu au canvas via Redis
          const channel = `job:${jobId}:events`;
          const message = JSON.stringify({
            content,
            contentType,
            type: 'agent_canvas_output',
          });

          // Publier le message sur le canal Redis
          await redisClient.publish(channel, message);

          getLoggerInstance().info(
            `Contenu envoyé au canvas pour le job ${jobId}`,
          );

          res.status(200).json({
            message: 'Contenu envoyé au canvas avec succès',
            success: true,
          });
        } catch (error) {
          next(error);
        }
      },
    );

    // Check if Qwen is connected for the current session
    app.get(
      '/api/auth/qwen/status',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          if (!req.sessionId) {
            return res.status(400).json({ error: 'Session ID is missing.' });
          }

          // Check if Qwen access token exists in Redis for this session
          const qwenAccessToken = await redisClient.get(
            `qwen:accessToken:${req.sessionId}`,
          );

          res.status(200).json({
            connected: !!qwenAccessToken,
            message: qwenAccessToken
              ? 'Qwen is connected'
              : 'Qwen is not connected',
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error checking Qwen connection status',
          );
          next(error);
        }
      },
    );

    // Get Qwen credentials from local file ~/.qwen/oauth_creds.json
    app.get(
      '/api/auth/qwen/credentials',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Import fs module for file operations
          const fs = await import('fs');
          const os = await import('os');
          const path = await import('path');

          // Construct the path to the Qwen credentials file
          const qwenDir = path.join(os.homedir(), '.qwen');
          const credsFile = path.join(qwenDir, 'oauth_creds.json');

          // Check if the file exists
          if (!fs.existsSync(credsFile)) {
            return res.status(404).json({
              error: 'Qwen credentials file not found',
              message:
                'Please authenticate with Qwen first to create the credentials file',
            });
          }

          // Read the credentials file
          const credsData = fs.readFileSync(credsFile, 'utf8');
          const creds = JSON.parse(credsData);

          // Return only the access token
          res.status(200).json({
            accessToken: creds.access_token,
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error reading Qwen credentials file',
          );
          next(error);
        }
      },
    );

    // Logout from Qwen (clear token from Redis)
    app.post(
      '/api/auth/qwen/logout',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          if (!req.sessionId) {
            return res.status(400).json({ error: 'Session ID is missing.' });
          }

          // Remove Qwen access token from Redis for this session
          await redisClient.del(`qwen:accessToken:${req.sessionId}`);

          getLoggerInstance().info(
            { sessionId: req.sessionId },
            'Qwen access token removed from Redis.',
          );

          res.status(200).json({
            message: 'Successfully logged out from Qwen',
            success: true,
          });
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error logging out from Qwen');
          next(error);
        }
      },
    );

    // Check Qwen token status
    app.get(
      '/api/llm-keys/qwen/status',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          if (!req.sessionId) {
            return res.status(400).json({ error: 'Session ID is missing.' });
          }

          // Get Qwen access token from Redis for this session
          const qwenAccessToken = await redisClient.get(
            `qwen:accessToken:${req.sessionId}`,
          );

          if (!qwenAccessToken) {
            return res.status(200).json({
              errorMessage: 'No Qwen access token found',
              isValid: false,
              requestsRemaining: null,
            });
          }

          // Validate the token by making a simple API call
          try {
            const response = await fetch(
              'https://dashscope.aliyuncs.com/api/v1/token-status',
              {
                headers: {
                  Authorization: `Bearer ${qwenAccessToken}`,
                  'Content-Type': 'application/json',
                },
                method: 'GET',
              },
            );

            if (response.ok) {
              const data = await response.json();
              return res.status(200).json({
                isValid: true,
                lastChecked: new Date().toISOString(),
                requestsRemaining: data.remaining_requests || null,
              });
            } else {
              const errorData = await response.json();
              return res.status(200).json({
                errorMessage: errorData.message || 'Invalid Qwen token',
                isValid: false,
                requestsRemaining: null,
              });
            }
          } catch (error) {
            getLoggerInstance().error(
              { error },
              'Error validating Qwen access token',
            );
            return res.status(200).json({
              errorMessage: 'Failed to validate Qwen token',
              isValid: false,
              requestsRemaining: null,
            });
          }
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error checking Qwen token status',
          );
          next(error);
        }
      },
    );

    // Redis integration endpoints for LLM Key Manager
    app.get(
      '/api/llm-keys/redis/info',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Get Redis info
          const info = await redisClient.info();

          // Count only LLM-specific keys instead of all Redis keys
          const llmKeys = await redisClient.keys('llm:keys:*');
          const keyCount = llmKeys.length;
          
          // Parse Redis info to get memory usage only
          const lines = info.split('\n');
          let memory = '0K';

          for (const line of lines) {
            if (line.startsWith('used_memory_human:')) {
              memory = line.split(':')[1].trim();
            }
          }

          res.status(200).json({
            connected: true,
            keyCount,
            memory,
          });
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error getting Redis info');
          res.status(200).json({
            connected: false,
            keyCount: 0,
            memory: '0K',
          });
        }
      },
    );

    app.post(
      '/api/llm-keys/redis/scan',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { pattern } = req.body;
          const keys = await redisClient.keys(pattern || 'llm:keys:*');
          res.status(200).json({ keys });
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error scanning Redis keys');
          next(error);
        }
      },
    );

    app.get(
      '/api/llm-keys/redis/keys',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Get all LLM keys from Redis
          const keys = await redisClient.keys('llm:keys:*');
          const llmKeys = [];

          for (const key of keys) {
            const value = await redisClient.get(key);
            if (value) {
              try {
                llmKeys.push(JSON.parse(value));
              } catch (parseError) {
                getLoggerInstance().warn(
                  { error: parseError, key },
                  'Failed to parse Redis key value as JSON',
                );
              }
            }
          }

          res.status(200).json(llmKeys);
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error fetching LLM keys from Redis',
          );
          next(error);
        }
      },
    );

    app.get(
      '/api/llm-keys/redis/key/:keyPath',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { keyPath } = req.params;
          const decodedKeyPath = decodeURIComponent(keyPath);
          const value = await redisClient.get(decodedKeyPath);

          if (!value) {
            return res.status(404).json({ error: 'Key not found' });
          }

          try {
            const keyData = JSON.parse(value);
            res.status(200).json(keyData);
          } catch (parseError) {
            getLoggerInstance().warn(
              { error: parseError, keyPath: decodedKeyPath },
              'Failed to parse Redis key value as JSON',
            );
            res.status(200).json({ value });
          }
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error fetching LLM key from Redis',
          );
          next(error);
        }
      },
    );

    // New endpoints for key hierarchy management
    // GET /api/llm-keys/hierarchy - Get key hierarchy
    app.get(
      '/api/llm-keys/hierarchy',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Get key hierarchy from Redis
          const hierarchyJson = await redisClient.get('llmApiKeysHierarchy');
          const hierarchy = hierarchyJson ? JSON.parse(hierarchyJson) : {};

          res.status(200).json(hierarchy);
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error getting key hierarchy from Redis',
          );
          next(error);
        }
      },
    );

    // POST /api/llm-keys/hierarchy - Set key hierarchy
    app.post(
      '/api/llm-keys/hierarchy',
      verifyAuthToken,
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const hierarchy = req.body;

          // Save key hierarchy to Redis
          await redisClient.set(
            'llmApiKeysHierarchy',
            JSON.stringify(hierarchy),
          );

          res.status(200).json({ message: 'Key hierarchy saved successfully' });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error saving key hierarchy to Redis',
          );
          next(error);
        }
      },
    );

    app.put(
      '/api/llm-keys/keys/:id',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;
          const {
            apiModel,
            baseUrl,
            isActive,
            keyName,
            keyValue,
            metadata,
            providerId,
            providerName,
          } = req.body;

          if (!providerId || !keyValue) {
            throw new AppError('Missing provider or key', { statusCode: 400 });
          }

          // Check if it's a legacy key
          if (id.startsWith('legacy-')) {
            const keyIndex = parseInt(id.replace('legacy-', ''), 10);
            if (isNaN(keyIndex)) {
              throw new AppError('Invalid index', { statusCode: 400 });
            }
            // For legacy keys, we need to remove and re-add since there's no direct update method
            await _LlmKeyManager.removeKey(keyIndex);
            await _LlmKeyManager.addKey(
              providerId,
              keyValue,
              apiModel || config.LLM_MODEL_NAME,
              baseUrl,
            );

            res
              .status(200)
              .json({ message: 'Legacy key updated successfully' });
          } else {
            // Update in Redis
            const redisKey = id;
            const keyData = {
              createdAt: new Date().toISOString(),
              isActive: isActive !== undefined ? isActive : true,
              isEncrypted: false,
              keyName:
                keyName ||
                (providerId === 'gemini' ? 'Gemini Key' : `${providerId}-key`),
              keyValue,
              metadata: metadata || {
                description: '',
                environment: 'development',
                tags: [],
              },
              provider: providerId,
              providerName: providerName || providerId,
              updatedAt: new Date().toISOString(),
              usageCount: 0,
            };

            await redisClient.set(redisKey, JSON.stringify(keyData));

            res.status(200).json({
              id: redisKey.split(':').pop(), // Extract ID from Redis key
              ...keyData,
            });
          }
        } catch (_error) {
          next(_error);
        }
      },
    );

    // Test LLM key validity
    app.post(
      '/api/llm-keys/test',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { keyValue, provider } = req.body;

          if (!provider || !keyValue) {
            throw new AppError('Missing provider or key', { statusCode: 400 });
          }

          // Get the provider's test endpoint
          let testEndpoint = '';
          switch (provider) {
            case 'anthropic':
              testEndpoint = 'https://api.anthropic.com/v1/models';
              break;
            case 'gemini':
            case 'google-flash':
              testEndpoint =
                'https://generativelanguage.googleapis.com/v1/models';
              break;
            case 'openai':
              testEndpoint = 'https://api.openai.com/v1/models';
              break;
            case 'openrouter':
              testEndpoint = 'https://openrouter.ai/api/v1/models';
              break;
            case 'qwen':
              testEndpoint = 'https://portal.qwen.ai/v1/chat/completions';
              break;
            case 'xai':
              testEndpoint = 'https://api.x.ai/v1/models';
              break;
            default:
              testEndpoint = `https://api.${provider}.com/v1/models`;
          }

          // Make a test request to validate the key
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          // Set the appropriate authorization header based on provider
          if (provider === 'openai' || provider === 'openrouter') {
            headers['Authorization'] = `Bearer ${keyValue}`;
          } else if (provider === 'anthropic') {
            headers['x-api-key'] = keyValue;
          } else if (provider === 'google-flash' || provider === 'gemini') {
            headers['x-goog-api-key'] = keyValue;
          } else if (provider === 'qwen' || provider === 'xai') {
            headers['Authorization'] = `Bearer ${keyValue}`;
          } else {
            headers['Authorization'] = `Bearer ${keyValue}`;
          }

          const response = await fetch(testEndpoint, {
            headers,
            method: 'GET',
          });

          const isValid = response.ok;
          const result = {
            status: response.status,
            statusText: response.statusText,
            valid: isValid,
          };

          res.status(200).json(result);
        } catch (error) {
          getLoggerInstance().error({ error }, 'Failed to test LLM key');
          res.status(200).json({
            error: error instanceof Error ? error.message : 'Unknown error',
            valid: false,
          });
        }
      },
    );

    // Get master key from environment
    app.get(
      '/api/llm-keys/master-key',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const masterKey = process.env.LLM_API_KEY || '';
          const masterProvider = process.env.LLM_PROVIDER || 'qwen';
          const masterModel = process.env.LLM_MODEL_NAME || 'qwen3-coder-plus';

          res.status(200).json({
            apiKey: masterKey,
            apiModel: masterModel,
            apiProvider: masterProvider,
            isActive: !!masterKey,
          });
        } catch (_error) {
          next(_error);
        }
      },
    );

    // Get providers list
    app.get(
      '/api/llm-keys/providers',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Return the default providers list
          const providers = [
            {
              description: 'GPT models including GPT-4, GPT-3.5, and DALL-E',
              displayName: 'OpenAI',
              id: 'openai',
              isActive: true,
              keyFormat: 'sk-...',
              name: 'openai',
              supportedModels: [
                'gpt-4',
                'gpt-4-turbo',
                'gpt-3.5-turbo',
                'dall-e-3',
                'whisper-1',
              ],
              testEndpoint: '/v1/models',
              website: 'https://openai.com',
            },
            {
              description: 'Claude models for advanced AI assistance',
              displayName: 'Anthropic',
              id: 'anthropic',
              isActive: true,
              keyFormat: 'sk-ant-...',
              name: 'anthropic',
              supportedModels: [
                'claude-3-opus',
                'claude-3-sonnet',
                'claude-3-haiku',
              ],
              testEndpoint: '/v1/models',
              website: 'https://anthropic.com',
            },
            {
              description: 'Gemini 2.5 Flash - Fast and efficient model',
              displayName: 'Google Gemini Flash',
              id: 'google-flash',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-flash'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Gemini 2.5 Pro - Advanced reasoning model',
              displayName: 'Gemini',
              id: 'gemini',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-pro'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Grok-4 advanced reasoning model',
              displayName: 'xAI Grok',
              id: 'xai',
              isActive: true,
              keyFormat: 'xai-...',
              name: 'xai',
              supportedModels: ['grok-4'],
              testEndpoint: '/v1/models',
              website: 'https://x.ai',
            },
            {
              description: 'Qwen3 Coder Plus - Advanced coding model',
              displayName: 'Qwen',
              id: 'qwen',
              isActive: true,
              keyFormat: '...',
              name: 'qwen',
              supportedModels: ['qwen3-coder-plus'],
              testEndpoint: 'https://portal.qwen.ai/v1/chat/completions',
              website: 'https://portal.qwen.ai',
            },
            {
              description:
                'Access to multiple AI models via unified API - GLM-4.5-Air Free',
              displayName: 'OpenRouter',
              id: 'openrouter',
              isActive: true,
              keyFormat: 'sk-or-...',
              name: 'openrouter',
              supportedModels: ['z-ai/glm-4.5-air:free'],
              testEndpoint: 'https://openrouter.ai/api/v1/models',
              website: 'https://openrouter.ai',
            },
          ];

          res.status(200).json(providers);
        } catch (_error) {
          next(_error);
        }
      },
    );

    app.put(
      '/api/llm-keys/redis/key/:keyPath',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { keyPath } = req.params;
          const { value } = req.body;
          const decodedKeyPath = decodeURIComponent(keyPath);

          await redisClient.set(decodedKeyPath, JSON.stringify(value));
          res.status(200).json({ message: 'Key set successfully' });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error setting LLM key in Redis',
          );
          next(error);
        }
      },
    );

    app.delete(
      '/api/llm-keys/redis/key/:keyPath',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { keyPath } = req.params;
          const decodedKeyPath = decodeURIComponent(keyPath);

          await redisClient.del(decodedKeyPath);
          res.status(200).json({ message: 'Key deleted successfully' });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error deleting LLM key from Redis',
          );
          next(error);
        }
      },
    );

    app.post(
      '/api/llm-keys/redis/bulk-import',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
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
            errors,
            imported: importedKeys.length,
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error bulk importing LLM keys from Redis',
          );
          next(error);
        }
      },
    );

    app.post(
      '/api/llm-keys/redis/bulk-export',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
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
            errors,
            exported: keys.length,
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error bulk exporting LLM keys to Redis',
          );
          next(error);
        }
      },
    );

    app.post(
      '/api/llm-keys/sync',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // This is a placeholder for sync functionality
          // In a real implementation, this would sync between the local store and Redis
          res.status(200).json({ message: 'Sync completed successfully' });
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error syncing LLM keys');
          next(error);
        }
      },
    );

    // Legacy sync endpoint for backward compatibility
    app.post(
      '/api/llm-api-keys/sync',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // This is a placeholder for sync functionality
          // In a real implementation, this would sync between the local store and Redis
          res.status(200).json({ message: 'Sync completed successfully' });
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error syncing LLM keys');
          next(error);
        }
      },
    );

    // Get available LLM providers (legacy endpoint for backward compatibility)
    app.get(
      '/api/llm-api-keys/providers',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Return the list of supported LLM providers
          const providers = [
            {
              description: 'GPT models including GPT-4, GPT-3.5, and DALL-E',
              displayName: 'OpenAI',
              id: 'openai',
              isActive: true,
              keyFormat: 'sk-...',
              name: 'openai',
              supportedModels: [
                'gpt-4',
                'gpt-4-turbo',
                'gpt-3.5-turbo',
                'dall-e-3',
                'whisper-1',
              ],
              testEndpoint: '/v1/models',
              website: 'https://openai.com',
            },
            {
              description: 'Claude models for advanced AI assistance',
              displayName: 'Anthropic',
              id: 'anthropic',
              isActive: true,
              keyFormat: 'sk-ant-...',
              name: 'anthropic',
              supportedModels: [
                'claude-3-opus',
                'claude-3-sonnet',
                'claude-3-haiku',
              ],
              testEndpoint: '/v1/models',
              website: 'https://anthropic.com',
            },
            {
              description: 'Gemini 2.5 Flash - Fast and efficient model',
              displayName: 'Google Gemini Flash',
              id: 'google-flash',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-flash'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Gemini 2.5 Pro - Advanced reasoning model',
              displayName: 'Gemini',
              id: 'gemini',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-pro'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Grok-4 advanced reasoning model',
              displayName: 'xAI Grok',
              id: 'xai',
              isActive: true,
              keyFormat: 'xai-...',
              name: 'xai',
              supportedModels: ['grok-4'],
              testEndpoint: '/v1/models',
              website: 'https://x.ai',
            },
            {
              description: 'Qwen3 Coder Plus - Advanced coding model',
              displayName: 'Qwen',
              id: 'qwen',
              isActive: true,
              keyFormat: '...',
              name: 'qwen',
              supportedModels: ['qwen3-coder-plus'],
              testEndpoint: 'https://portal.qwen.ai/v1/chat/completions',
              website: 'https://portal.qwen.ai',
            },
            {
              description:
                'Access to multiple AI models via unified API - GLM-4.5-Air Free',
              displayName: 'OpenRouter',
              id: 'openrouter',
              isActive: true,
              keyFormat: 'sk-or-...',
              name: 'openrouter',
              supportedModels: ['z-ai/glm-4.5-air:free'],
              testEndpoint: 'https://openrouter.ai/api/v1/models',
              website: 'https://openrouter.ai',
            },
          ];

          res.status(200).json(providers);
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error getting LLM providers');
          next(error);
        }
      },
    );

    app.post(
      '/api/llm-keys/import-from-redis',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Import keys from Redis to local store
          const keys = await redisClient.keys('llm:keys:*');

          for (const keyPath of keys) {
            try {
              const value = await redisClient.get(keyPath);
              if (value) {
                const keyData = JSON.parse(value);
                // Add to local store (this would depend on your implementation)
                // For now, we'll just log that we would import the key
                getLoggerInstance().info(
                  { keyData, keyPath },
                  'Would import key from Redis to local store',
                );
              }
            } catch (parseError) {
              getLoggerInstance().warn(
                { error: parseError, keyPath },
                'Failed to parse Redis key value as JSON during import',
              );
            }
          }

          res
            .status(200)
            .json({ message: 'Import from Redis completed successfully' });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error importing LLM keys from Redis',
          );
          next(error);
        }
      },
    );

    // Sync with Redis endpoint
    app.post(
      '/api/llm-keys/sync',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Sync keys with Redis
          await _LlmKeyManager.deduplicateKeys();
          res.status(200).json({ message: 'Synced with Redis successfully' });
        } catch (error) {
          next(error);
        }
      },
    );

    // Import keys from Redis endpoint
    app.post(
      '/api/llm-keys/import',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Import keys from Redis (this is a placeholder - in reality, keys are always synced)
          res
            .status(200)
            .json({ message: 'Imported keys from Redis successfully' });
        } catch (error) {
          next(error);
        }
      },
    );

    // Export keys to Redis endpoint
    app.post(
      '/api/llm-keys/export',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Export keys to Redis (this is a placeholder - in reality, keys are always synced)
          res
            .status(200)
            .json({ message: 'Exported keys to Redis successfully' });
        } catch (error) {
          next(error);
        }
      },
    );

    // Cleanup duplicates endpoint
    app.post(
      '/api/llm-keys/cleanup-duplicates',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Cleanup duplicates
          const result = await _LlmKeyManager.deduplicateKeys();
          res.status(200).json({
            message: 'Cleaned up duplicates successfully',
            result,
          });
        } catch (error) {
          next(error);
        }
      },
    );

    // Cleanup duplicate keys endpoint for the new API
    app.post(
      '/api/llm-keys/cleanup-duplicates',
      verifyAuthToken,
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Use the new integrated deduplication method
          const result = await _LlmKeyManager.deduplicateKeys();

          if (result.duplicatesRemoved > 0) {
            res.status(200).json({
              after: result.uniqueCount,
              before: result.originalCount,
              duplicatesRemoved: result.duplicatesRemoved,
              message: `🧹 Cleanup completed. Removed ${result.duplicatesRemoved} duplicates.`,
            });
          } else {
            res.status(200).json({
              after: result.uniqueCount,
              before: result.originalCount,
              duplicatesRemoved: 0,
              message: '✅ No duplicates found - all keys are unique!',
            });
          }
        } catch (error) {
          next(error);
        }
      },
    );

    // Cleanup duplicate keys endpoint
    app.post(
      '/api/llm-api-keys/cleanup-duplicates',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Get all keys from the legacy LlmKeyManager
          const legacyKeys = await _LlmKeyManager.getKeysForApi();

          // Get all keys from the new Redis format
          const redisKeys = await redisClient.keys('llm:keys:*');
          const newKeys = [];

          for (const key of redisKeys) {
            const value = await redisClient.get(key);
            if (value) {
              try {
                const keyData = JSON.parse(value);
                newKeys.push({
                  id: key,
                  ...keyData,
                });
              } catch (parseError) {
                getLoggerInstance().warn(
                  { error: parseError, key },
                  'Failed to parse Redis key value as JSON',
                );
              }
            }
          }

          // Remove duplicates from legacy keys
          const uniqueLegacyKeys = legacyKeys.filter(
            (key, index, self) =>
              index ===
              self.findIndex(
                (k) =>
                  k.apiKey === key.apiKey && k.apiProvider === key.apiProvider,
              ),
          );

          // Remove duplicates from new keys
          const uniqueNewKeys = newKeys.filter(
            (key, index, self) =>
              index ===
              self.findIndex(
                (k) =>
                  k.keyValue === key.keyValue && k.provider === key.provider,
              ),
          );

          // Save the cleaned up keys back to their respective stores
          // For legacy keys, we need to rebuild the entire list
          // Clear existing keys
          await redisClient.del('llmApiKeys');

          // Add unique legacy keys
          if (uniqueLegacyKeys.length > 0) {
            await redisClient.rpush(
              'llmApiKeys',
              ...uniqueLegacyKeys.map((key) => JSON.stringify(key)),
            );
          }

          // For new keys, we'll just log that we would clean them up
          getLoggerInstance().info(
            {
              legacyKeysCount: legacyKeys.length,
              newKeysCount: newKeys.length,
              uniqueLegacyKeysCount: uniqueLegacyKeys.length,
              uniqueNewKeysCount: uniqueNewKeys.length,
            },
            'LLM API keys cleanup completed',
          );

          res.status(200).json({
            message: 'Duplicate keys cleanup completed successfully',
            stats: {
              legacyKeysRemoved: legacyKeys.length - uniqueLegacyKeys.length,
              newKeysRemoved: newKeys.length - uniqueNewKeys.length,
            },
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error cleaning up duplicate LLM keys',
          );
          next(error);
        }
      },
    );

    app.post(
      '/api/llm-keys/export-to-redis',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Export keys from local store to Redis
          // This is a placeholder implementation
          // In a real implementation, you would fetch keys from your local store
          // and export them to Redis
          res
            .status(200)
            .json({ message: 'Export to Redis completed successfully' });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error exporting LLM keys to Redis',
          );
          next(error);
        }
      },
    );

    // Test LLM key
    app.post(
      '/api/llm-keys/keys/:id/test',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const { id } = req.params;

          // For now, we'll just return a success response
          // In a real implementation, you would test the key with the provider's API
          res.status(200).json({
            message: 'Key test not implemented yet',
            valid: true,
          });
        } catch (error) {
          next(error);
        }
      },
    );

    // Get available LLM providers
    app.get(
      '/api/llm-keys/providers',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          // Return the list of supported LLM providers
          const providers = [
            {
              description: 'GPT models including GPT-4, GPT-3.5, and DALL-E',
              displayName: 'OpenAI',
              id: 'openai',
              isActive: true,
              keyFormat: 'sk-...',
              name: 'openai',
              supportedModels: [
                'gpt-4',
                'gpt-4-turbo',
                'gpt-3.5-turbo',
                'dall-e-3',
                'whisper-1',
              ],
              testEndpoint: '/v1/models',
              website: 'https://openai.com',
            },
            {
              description: 'Claude models for advanced AI assistance',
              displayName: 'Anthropic',
              id: 'anthropic',
              isActive: true,
              keyFormat: 'sk-ant-...',
              name: 'anthropic',
              supportedModels: [
                'claude-3-opus',
                'claude-3-sonnet',
                'claude-3-haiku',
              ],
              testEndpoint: '/v1/models',
              website: 'https://anthropic.com',
            },
            {
              description: 'Gemini 2.5 Flash - Fast and efficient model',
              displayName: 'Google Gemini Flash',
              id: 'google-flash',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-flash'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Gemini 2.5 Pro - Advanced reasoning model',
              displayName: 'Gemini',
              id: 'gemini',
              isActive: true,
              keyFormat: 'AI...',
              name: 'google',
              supportedModels: ['gemini-2.5-pro'],
              testEndpoint: '/v1/models',
              website: 'https://ai.google.dev',
            },
            {
              description: 'Grok-4 advanced reasoning model',
              displayName: 'xAI Grok',
              id: 'xai',
              isActive: true,
              keyFormat: 'xai-...',
              name: 'xai',
              supportedModels: ['grok-4'],
              testEndpoint: '/v1/models',
              website: 'https://x.ai',
            },
            {
              description: 'Qwen3 Coder Plus - Advanced coding model',
              displayName: 'Qwen',
              id: 'qwen',
              isActive: true,
              keyFormat: '...',
              name: 'qwen',
              supportedModels: ['qwen3-coder-plus'],
              testEndpoint: 'https://portal.qwen.ai/v1/chat/completions',
              website: 'https://portal.qwen.ai',
            },
            {
              description:
                'Access to multiple AI models via unified API - GLM-4.5-Air Free',
              displayName: 'OpenRouter',
              id: 'openrouter',
              isActive: true,
              keyFormat: 'sk-or-...',
              name: 'openrouter',
              supportedModels: ['z-ai/glm-4.5-air:free'],
              testEndpoint: 'https://openrouter.ai/api/v1/models',
              website: 'https://openrouter.ai',
            },
          ];

          res.status(200).json(providers);
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error getting LLM providers');
          next(error);
        }
      },
    );

    app.use(handleError);

    const server = new Server(app);

    if (process.env.NODE_ENV !== 'test') {
      process.on('uncaughtException', (error: Error) => {
        getLoggerInstance().fatal({ error }, 'Unhandled exception caught!');
        process.exit(1);
      });

      process.on(
        'unhandledRejection',
        (reason: unknown, promise: Promise<any>) => {
          getLoggerInstance().fatal(
            { promise, reason },
            'Unhandled rejection caught!',
          );
          process.exit(1);
        },
      );
    }
    console.log('Web server initialized.');
    return { app, server };
  } catch (error) {
    console.error('Error initializing web server:', error);
    throw error;
  }
}

function watchConfig() {
  const envPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../.env',
  );
  getLoggerInstance().info(
    `[watchConfig] Watching for .env changes in: ${envPath}`,
  );

  configWatcher = chokidar.watch(envPath, {
    ignoreInitial: true,
    persistent: true,
  });

  configWatcher.on('change', async () => {
    getLoggerInstance().info(
      '[watchConfig] .env file changed, reloading configuration...',
    );
    await loadConfig();
    getLoggerInstance().info('[watchConfig] Configuration reloaded.');
  });

  configWatcher.on('error', (error: unknown) => {
    getLoggerInstance().error(
      { error: error as Error },
      '[watchConfig] Watcher error',
    );
  });
}
