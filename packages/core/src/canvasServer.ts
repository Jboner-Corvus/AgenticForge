import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import puppeteer, { Browser, Page } from 'puppeteer';

export interface CanvasServerOptions {
  port?: number;
  host?: string;
  enableWebGL?: boolean;
  maxConcurrentSessions?: number;
  sessionTimeout?: number; // in milliseconds
}

export interface CanvasSession {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  browser?: Browser;
  page?: Page;
  content?: string;
  contentType?: 'html' | 'url';
  status: 'active' | 'inactive' | 'error';
  error?: string;
}

export class CanvasServer {
  private app: Application;
  private server: HTTPServer | HTTPSServer | null = null;
  private redisClient: Redis;
  private browser: Browser | null = null;
  private sessions: Map<string, CanvasSession> = new Map();
  private options: Required<CanvasServerOptions>;

  constructor(redisClient: Redis, options: CanvasServerOptions = {}) {
    this.redisClient = redisClient;
    this.options = {
      port: options.port || 3004,
      host: options.host || 'localhost',
      enableWebGL: options.enableWebGL || false,
      maxConcurrentSessions: options.maxConcurrentSessions || 10,
      sessionTimeout: options.sessionTimeout || 30 * 60 * 1000, // 30 minutes
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // CORS middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

    // Session validation middleware
    this.app.use('/canvas/:sessionId/*', (req: Request, res: Response, next: NextFunction) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Canvas session not found' });
      }

      if (session.status === 'error') {
        return res.status(400).json({ error: 'Canvas session in error state', details: session.error });
      }

      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        sessions: this.sessions.size,
        maxSessions: this.options.maxConcurrentSessions,
        timestamp: new Date().toISOString()
      });
    });

    // Create new canvas session
    this.app.post('/canvas', async (req: Request, res: Response) => {
      try {
        if (this.sessions.size >= this.options.maxConcurrentSessions) {
          return res.status(429).json({ error: 'Maximum concurrent sessions reached' });
        }

        const { content, contentType = 'html', width = 1024, height = 768 } = req.body;

        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }

        const sessionId = uuidv4();
        const session: CanvasSession = {
          id: sessionId,
          createdAt: new Date(),
          lastActivity: new Date(),
          content,
          contentType,
          status: 'active'
        };

        this.sessions.set(sessionId, session);

        // Initialize browser and page for this session
        await this.initializeSessionCanvas(session, { width, height });

        // Store session info in Redis
        await this.redisClient.setex(
          `canvas:session:${sessionId}`,
          this.options.sessionTimeout / 1000,
          JSON.stringify(session)
        );

        console.log(`[CanvasServer] Created session ${sessionId} with ${contentType} content`);

        res.json({
          sessionId,
          url: `http://${this.options.host}:${this.options.port}/canvas/${sessionId}`,
          status: 'created'
        });
      } catch (error) {
        console.error('[CanvasServer] Error creating session:', error);
        res.status(500).json({ error: 'Failed to create canvas session' });
      }
    });

    // Get session info
    this.app.get('/canvas/:sessionId', async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({
        id: session.id,
        status: session.status,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        contentType: session.contentType,
        hasError: !!session.error
      });
    });

    // Render canvas content
    this.app.get('/canvas/:sessionId/render', async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (!session.page) {
        return res.status(400).json({ error: 'Canvas not initialized' });
      }

      try {
        // Update last activity
        session.lastActivity = new Date();

        // Load content into the page
        if (session.contentType === 'url') {
          if (session.content) {
            await session.page.goto(session.content, { waitUntil: 'networkidle2' });
          }
        } else {
          if (session.content) {
            await session.page.setContent(session.content, { waitUntil: 'networkidle2' });
          }
        }

        // Take screenshot
        const screenshot = await session.page.screenshot({
          fullPage: req.query.fullPage === 'true',
          type: 'png'
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(screenshot);
      } catch (error) {
        console.error(`[CanvasServer] Error rendering session ${sessionId}:`, error);
        session.status = 'error';
        session.error = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Failed to render canvas' });
      }
    });

    // Execute JavaScript in canvas
    this.app.post('/canvas/:sessionId/execute', async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const { javascript } = req.body;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (!session.page) {
        return res.status(400).json({ error: 'Canvas not initialized' });
      }

      try {
        session.lastActivity = new Date();

        const result = await session.page.evaluate(javascript);

        res.json({
          success: true,
          result: typeof result === 'object' ? JSON.stringify(result) : result
        });
      } catch (error) {
        console.error(`[CanvasServer] Error executing JS in session ${sessionId}:`, error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get DOM content
    this.app.get('/canvas/:sessionId/dom', async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (!session.page) {
        return res.status(400).json({ error: 'Canvas not initialized' });
      }

      try {
        session.lastActivity = new Date();

        const domContent = await session.page.content();
        const title = await session.page.title();
        const url = await session.page.url();

        res.json({
          title,
          url,
          content: domContent
        });
      } catch (error) {
        console.error(`[CanvasServer] Error getting DOM content for session ${sessionId}:`, error);
        res.status(500).json({ error: 'Failed to get DOM content' });
      }
    });

    // Close session
    this.app.delete('/canvas/:sessionId', async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      await this.closeSession(sessionId);
      res.json({ message: 'Session closed successfully' });
    });

    // List all active sessions
    this.app.get('/canvas', (req: Request, res: Response) => {
      const activeSessions = Array.from(this.sessions.values()).map(session => ({
        id: session.id,
        status: session.status,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        contentType: session.contentType
      }));

      res.json({
        count: activeSessions.length,
        sessions: activeSessions
      });
    });
  }

  private async initializeSessionCanvas(session: CanvasSession, viewport: { width: number; height: number }): Promise<void> {
    try {
      // Initialize browser if not already done
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        });
      }

      // Create new page
      session.page = await this.browser.newPage();

      // Set viewport
      await session.page.setViewport({
        width: viewport.width,
        height: viewport.height
      });

      // Enable JavaScript execution
      await session.page.setJavaScriptEnabled(true);

      // Set user agent to avoid bot detection
      await session.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      console.log(`[CanvasServer] Initialized canvas for session ${session.id}`);
    } catch (error) {
      console.error(`[CanvasServer] Error initializing canvas for session ${session.id}:`, error);
      session.status = 'error';
      session.error = error instanceof Error ? error.message : 'Failed to initialize canvas';
      throw error;
    }
  }

  private async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      if (session.page) {
        await session.page.close();
      }

      this.sessions.delete(sessionId);
      await this.redisClient.del(`canvas:session:${sessionId}`);

      console.log(`[CanvasServer] Closed session ${sessionId}`);
    } catch (error) {
      console.error(`[CanvasServer] Error closing session ${sessionId}:`, error);
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.options.port, this.options.host, () => {
          console.log(`[CanvasServer] Canvas server started on http://${this.options.host}:${this.options.port}`);
          resolve();
        });

        this.server.on('error', (error: Error) => {
          console.error('[CanvasServer] Server error:', error);
          reject(error);
        });

        // Clean up inactive sessions periodically
        setInterval(() => {
          this.cleanupInactiveSessions();
        }, 60000); // Check every minute
      } catch (error) {
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    // Close all sessions
    for (const sessionId of this.sessions.keys()) {
      await this.closeSession(sessionId);
    }

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    console.log('[CanvasServer] Canvas server stopped');
  }

  private async cleanupInactiveSessions(): Promise<void> {
    const now = new Date();
    const timeout = this.options.sessionTimeout;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > timeout) {
        console.log(`[CanvasServer] Cleaning up inactive session ${sessionId}`);
        await this.closeSession(sessionId);
      }
    }
  }

  public getSession(sessionId: string): CanvasSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getActiveSessions(): CanvasSession[] {
    return Array.from(this.sessions.values());
  }
}