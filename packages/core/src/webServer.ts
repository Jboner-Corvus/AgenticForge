import { exec } from 'child_process';
import chokidar from 'chokidar';
import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import { createHash, randomBytes } from 'crypto';
import { Server } from 'http';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import path from 'path';
import { Client as PgClient } from 'pg';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { getConfig, loadConfig } from './config.js';
import { getLoggerInstance } from './logger.js';
import { getJobQueue } from './modules/queue/queue.js';
const config = getConfig();
import { LlmKeyManager as _LlmKeyManager } from './modules/llm/LlmKeyManager.js';
import { SessionManager } from './modules/session/sessionManager.js';
import { Message, SessionData } from './types.js';
import { AppError, handleError } from './utils/errorUtils.js';
import { getTools } from './utils/toolLoader.js';

export let configWatcher: import('chokidar').FSWatcher | null = null;

export async function initializeWebServer(
  pgClient: PgClient,
  redisClient: Redis,
): Promise<{ app: Application; server: Server }> {
  console.log('Initializing web server...');
  try {
    const jobQueue = getJobQueue();

    const app = express();
    const sessionManager = new SessionManager(pgClient);
    app.use(express.json());
    app.use(express.static(path.join(process.cwd(), 'packages', 'ui', 'dist')));
    app.use(cookieParser());
    
    // Add CORS middleware for all routes
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    app.use(
      (
        req: express.Request,
        _res: express.Response,
        _next: express.NextFunction,
      ) => {
        (req as any).sessionManager = sessionManager;
        _next();
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
        
        if (
          req.path === '/api/health' ||
          req.path.startsWith('/api/auth/github') ||
          req.path.startsWith('/api/auth/qwen')
        ) {
          return next();
        }

        const apiKey = req.headers.authorization;
        getLoggerInstance().debug(
          { apiKey: apiKey ? `${apiKey.substring(0, 20)}...` : 'undefined' },
          'Checking authorization header',
        );
        
        if (config.AUTH_API_KEY && apiKey !== `Bearer ${config.AUTH_API_KEY}`) {
          getLoggerInstance().warn(
            { providedKey: apiKey, requiredKey: `Bearer ${config.AUTH_API_KEY.substring(0, 10)}...` },
            'Unauthorized access attempt',
          );
          return res.status(401).json({ error: 'Unauthorized' });
        }
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

    app.get(
      '/api/chat/stream/:jobId',
      async (
        req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        const { jobId } = req.params;

        res.writeHead(200, {
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Content-Type': 'text/event-stream',
        });

        const subscriber = redisClient.duplicate();
        const channel = `job:${jobId}:events`;

        await subscriber.subscribe(channel);
        getLoggerInstance().info(`[SSE] Subscribed to ${channel} for SSE. Client connected.`);

        subscriber.on('message', (channel: string, message: string) => {
          getLoggerInstance().info(
            { channel, message },
            '[SSE] Received message from Redis channel - sending to client',
          );
          res.write('data: ' + message + '\n\n');
        });

        // Send initial heartbeat immediately
        res.write(`data: {"type":"heartbeat","timestamp":${Date.now()}}\n\n`);
        getLoggerInstance().info(`[SSE] Initial heartbeat sent to client`);

        const heartbeatInterval = setInterval(() => {
          res.write(`data: {"type":"heartbeat","timestamp":${Date.now()}}\n\n`);
          getLoggerInstance().info(`[SSE] Heartbeat sent to client`);
        }, 10000);

        req.on('close', () => {
          getLoggerInstance().info(
            `Client disconnected from SSE for job ${jobId}. Unsubscribing.`, 
          );
          getLoggerInstance().debug(
            `Attempting to unsubscribe from channel: ${channel}`,
          );
          clearInterval(heartbeatInterval);
          subscriber.unsubscribe(channel);
          subscriber.quit();
          getLoggerInstance().debug(
            `Unsubscribed and quit for channel: ${channel}`,
          );
        });
      },
    );

    app.post(
      '/api/session',
      async (req: express.Request, res: express.Response) => {
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
          res.status(500).json({ error: 'Failed to manage session.' });
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
            throw new AppError('Missing session ID or provider name',
              {
                statusCode: 400,
              },
            );
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
          const sessionsCreated =
            (await redisClient.get('leaderboard:sessionsCreated')) || '0';
          const tokensSaved =
            (await redisClient.get('leaderboard:tokensSaved')) || '0';
          const successfulRuns =
            (await redisClient.get('leaderboard:successfulRuns')) || '0';

          res.status(200).json({
            apiKeysAdded: 0,
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
          // This is mock data. In a real application, you would fetch this from a database.
          const leaderboardData = [
            { id: 'key-1', provider: 'OpenAI', keyMask: 'sk-a...123', requests: { count: 4500, limit: 5000 }, tokens: { count: 1800000, limit: 2000000 }, rank: 1 },
            { id: 'key-2', provider: 'Anthropic', keyMask: 'sk-b...456', requests: { count: 3200, limit: 10000 }, tokens: { count: 950000, limit: 1000000 }, rank: 2 },
            { id: 'key-3', provider: 'OpenRouter', keyMask: 'sk-c...789', requests: { count: 8800, limit: 10000 }, tokens: { count: 750000, limit: 1000000 }, rank: 3 },
            { id: 'key-4', provider: 'OpenAI', keyMask: 'sk-d...012', requests: { count: 1200, limit: 5000 }, tokens: { count: 300000, limit: 2000000 }, rank: 4 },
            { id: 'key-5', provider: 'Google Gemini', keyMask: 'sk-e...345', requests: { count: 500, limit: 1000 }, tokens: { count: 400000, limit: 500000 }, rank: 5 },
          ];
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
          await _LlmKeyManager.addKey(
            provider,
            key,
            model || config.LLM_MODEL_NAME,
            baseUrl,
          );
          res.status(200).json({ message: 'LLM API key added successfully.' });
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
          res.status(200).json({ message: 'LLM API key removed successfully.' });
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

          res.status(200).json({ message: 'LLM API key updated successfully.' });
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

    app.get('/api/auth/github', (req: express.Request, res: express.Response) => {
      const githubClientId = config.GITHUB_CLIENT_ID;
      if (!githubClientId) {
        return res
          .status(500)
          .json({ error: 'GitHub Client ID not configured.' });
      }
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;
      res.redirect(githubAuthUrl);
    });

    app.get(
      '/api/auth/github/callback',
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        try {
          const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
          const githubClientId = config.GITHUB_CLIENT_ID;
          const githubClientSecret = config.GITHUB_CLIENT_SECRET;

          getLoggerInstance().info(
            { code: code ? `${String(code).substring(0, 10)}...` : 'undefined' },
            'GitHub OAuth callback received',
          );

          if (!code || !githubClientId || !githubClientSecret) {
            getLoggerInstance().error(
              { code, githubClientId: githubClientId ? '***REDACTED***' : 'undefined', githubClientSecret: githubClientSecret ? '***REDACTED***' : 'undefined' },
              'Missing code or GitHub credentials',
            );
            throw new AppError('Missing code or GitHub credentials',
              {
                statusCode: 400,
              },
            );
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
                { userId, token: `${token.substring(0, 20)}...` },
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
          const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
          const qwenClientId = config.QWEN_CLIENT_ID;
          const qwenClientSecret = config.QWEN_CLIENT_SECRET;

          getLoggerInstance().info(
            { code: code ? `${String(code).substring(0, 10)}...` : 'undefined' },
            'Qwen OAuth callback received',
          );

          if (!code || !qwenClientId || !qwenClientSecret) {
            getLoggerInstance().error(
              { code, qwenClientId: qwenClientId ? '***REDACTED***' : 'undefined', qwenClientSecret: qwenClientSecret ? '***REDACTED***' : 'undefined' },
              'Missing code or Qwen credentials',
            );
            throw new AppError('Missing code or Qwen credentials',
              {
                statusCode: 400,
              },
            );
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
              throw new AppError('Code verifier not found for PKCE flow',
                {
                  statusCode: 400,
                },
              );
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
                { userId, token: `${token.substring(0, 20)}...` },
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
          getLoggerInstance().error(
            { error },
            'Error in Qwen OAuth callback',
          );
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
          const { jobId, content, contentType = 'html' } = req.body;
          
          // Vérifier que les paramètres requis sont présents
          if (!jobId || !content) {
            throw new AppError('Les paramètres jobId et content sont requis.', { statusCode: 400 });
          }
          
          // Vérifier que le type de contenu est valide
          const validContentTypes = ['html', 'markdown', 'text', 'url'];
          if (!validContentTypes.includes(contentType)) {
            throw new AppError(`Type de contenu invalide. Types valides: ${validContentTypes.join(', ')}`, { statusCode: 400 });
          }
          
          // Envoyer le contenu au canvas via Redis
          const channel = `job:${jobId}:events`;
          const message = JSON.stringify({
            content,
            contentType,
            type: 'agent_canvas_output'
          });
          
          // Publier le message sur le canal Redis
          await redisClient.publish(channel, message);
          
          getLoggerInstance().info(`Contenu envoyé au canvas pour le job ${jobId}`);
          
          res.status(200).json({ 
            success: true, 
            message: 'Contenu envoyé au canvas avec succès' 
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
              message: 'Please authenticate with Qwen first to create the credentials file',
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
            success: true,
            message: 'Successfully logged out from Qwen',
          });
        } catch (error) {
          getLoggerInstance().error(
            { error },
            'Error logging out from Qwen',
          );
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
