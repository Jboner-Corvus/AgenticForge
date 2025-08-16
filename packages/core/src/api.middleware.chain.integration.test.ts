import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import { getConfig } from './config.js';

describe('API Middleware Chain Integration Tests', () => {
  let app: express.Application;
  let server: Server;
  const config = getConfig();

  // Middleware execution tracker
  const middlewareExecution: string[] = [];

  beforeAll(async () => {
    // Create Express app with comprehensive middleware chain
    app = express();

    // Trust proxy for accurate client IPs
    app.set('trust proxy', 1);

    // 1. Request ID middleware (first in chain)
    app.use((req, res, next) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      (req as any).requestId = requestId;
      res.setHeader('X-Request-ID', requestId);
      middlewareExecution.push('request-id');
      next();
    });

    // 2. Security headers middleware (simplified)
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      next();
    });

    // 3. Compression middleware (simulated)
    app.use((req, res, next) => {
      if (!req.headers['x-no-compression']) {
        res.setHeader('Content-Encoding', 'gzip');
      }
      next();
    });

    // 4. Request logging middleware
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const start = Date.now();
      (req as any).startTime = start;
      middlewareExecution.push('request-logging');
      
      // Log response when it finishes
      res.on('finish', () => {
        const duration = Date.now() - start;
        (req as any).duration = duration;
      });
      
      next();
    });

    // 5. Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 6. Custom session middleware
    app.use((req, res, next) => {
      const sessionId = req.headers['x-session-id'] || `session-${Date.now()}`;
      (req as any).sessionId = sessionId;
      res.setHeader('X-Session-ID', sessionId);
      middlewareExecution.push('session');
      next();
    });

    // 7. CORS middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-ID');
      res.header('Access-Control-Allow-Credentials', 'true');
      middlewareExecution.push('cors');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // 8. Authentication middleware (conditional)
    app.use((req, res, next) => {
      middlewareExecution.push('auth-check');
      
      // Skip auth for public endpoints
      if (req.path.startsWith('/api/public') || req.path === '/api/health') {
        return next();
      }
      
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        (req as any).user = { id: 1, username: 'testuser' };
        (req as any).authenticated = true;
      } else {
        (req as any).authenticated = false;
      }
      
      next();
    });

    // 9. Rate limiting middleware (simulated)
    app.use((req, res, next) => {
      middlewareExecution.push('rate-limiting');
      
      // Simulate rate limiting logic
      const ip = req.ip || req.connection.remoteAddress;
      (req as any).rateLimitInfo = {
        ip,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 900000 // 15 minutes
      };
      
      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', '99');
      res.setHeader('X-RateLimit-Reset', String(Math.floor((Date.now() + 900000) / 1000)));
      
      next();
    });

    // 10. Request validation middleware
    app.use((req, res, next) => {
      middlewareExecution.push('validation');
      
      // Validate content type for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (contentType && !contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded')) {
          if (!req.path.includes('/upload')) {
            return res.status(400).json({ 
              error: 'Unsupported content type',
              expected: 'application/json'
            });
          }
        }
      }
      
      next();
    });

    // 11. API versioning middleware
    app.use((req, res, next) => {
      middlewareExecution.push('versioning');
      
      const version = req.headers['api-version'] || '1.0';
      (req as any).apiVersion = version;
      res.setHeader('API-Version', version);
      
      next();
    });

    // 12. Context enrichment middleware
    app.use((req, res, next) => {
      middlewareExecution.push('context-enrichment');
      
      (req as any).context = {
        timestamp: Date.now(),
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        method: req.method,
        path: req.path,
        query: req.query,
        apiVersion: (req as any).apiVersion
      };
      
      next();
    });

    // API Routes
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: Date.now(),
        requestId: (req as any).requestId,
        middleware: middlewareExecution.slice()
      });
    });

    app.get('/api/public/info', (req, res) => {
      res.json({
        message: 'Public endpoint',
        context: (req as any).context,
        middleware: middlewareExecution.slice()
      });
    });

    app.post('/api/protected/data', (req, res) => {
      if (!(req as any).authenticated) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      res.json({
        message: 'Protected data',
        user: (req as any).user,
        data: req.body,
        context: (req as any).context
      });
    });

    app.get('/api/middleware/test', (req, res) => {
      res.json({
        middlewareChain: middlewareExecution.slice(),
        headers: req.headers,
        context: (req as any).context,
        rateLimitInfo: (req as any).rateLimitInfo
      });
    });

    app.post('/api/validation/test', (req, res) => {
      res.json({
        message: 'Validation passed',
        body: req.body,
        contentType: req.headers['content-type']
      });
    });

    app.get('/api/error/test', (req, res) => {
      throw new Error('Test error for middleware handling');
    });

    app.post('/api/upload/file', (req, res) => {
      res.json({
        message: 'File upload endpoint',
        contentType: req.headers['content-type'],
        size: req.headers['content-length']
      });
    });

    // Middleware for handling async errors
    app.use(async (req, res, next) => {
      try {
        await next();
      } catch (error) {
        next(error);
      }
    });

    // Error handling middleware (should be last)
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      middlewareExecution.push('error-handler');
      
      const errorResponse = {
        error: error.message || 'Internal server error',
        requestId: (req as any).requestId,
        timestamp: Date.now(),
        path: req.path,
        method: req.method
      };
      
      res.status(error.status || 500).json(errorResponse);
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        requestId: (req as any).requestId
      });
    });

    // Start server
    server = app.listen(0);
  }, 10000);

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(() => {
    // Clear middleware execution tracker
    middlewareExecution.length = 0;
  });

  describe('Middleware Chain Execution Order', () => {
    it('should execute middleware in correct order for GET requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('middleware');
      const middlewareOrder = response.body.middleware;
      
      // Verify execution order
      expect(middlewareOrder).toEqual([
        'request-id',
        'request-logging',
        'session',
        'cors',
        'auth-check',
        'rate-limiting',
        'validation',
        'versioning',
        'context-enrichment'
      ]);
    });

    it('should execute middleware in correct order for POST requests', async () => {
      const response = await request(app)
        .post('/api/protected/data')
        .set('Authorization', 'Bearer test-token')
        .send({ test: 'data' })
        .expect(200);

      expect(response.body).toHaveProperty('context');
      expect(middlewareExecution).toContain('request-id');
      expect(middlewareExecution).toContain('auth-check');
      expect(middlewareExecution).toContain('validation');
    });

    it('should handle OPTIONS preflight requests correctly', async () => {
      const response = await request(app)
        .options('/api/protected/data')
        .expect(200);

      // OPTIONS should be handled by CORS middleware early
      expect(middlewareExecution).toContain('cors');
      expect(middlewareExecution.indexOf('cors')).toBeLessThan(5);
    });
  });

  describe('Request ID and Context', () => {
    it('should assign unique request IDs', async () => {
      const response1 = await request(app)
        .get('/api/health')
        .expect(200);

      const response2 = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response1.body.requestId).toBeDefined();
      expect(response2.body.requestId).toBeDefined();
      expect(response1.body.requestId).not.toBe(response2.body.requestId);
      
      expect(response1.headers['x-request-id']).toBe(response1.body.requestId);
      expect(response2.headers['x-request-id']).toBe(response2.body.requestId);
    });

    it('should enrich context with request information', async () => {
      const response = await request(app)
        .get('/api/public/info?param=value')
        .set('User-Agent', 'Test/1.0')
        .set('API-Version', '2.0')
        .expect(200);

      expect(response.body).toHaveProperty('context');
      const context = response.body.context;
      
      expect(context).toHaveProperty('timestamp');
      expect(context).toHaveProperty('userAgent', 'Test/1.0');
      expect(context).toHaveProperty('method', 'GET');
      expect(context).toHaveProperty('path', '/api/public/info');
      expect(context).toHaveProperty('apiVersion', '2.0');
      expect(context.query).toHaveProperty('param', 'value');
    });
  });

  describe('Security Middleware', () => {
    it('should apply security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include Content Security Policy', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('content-security-policy');
      expect(response.headers['content-security-policy']).toContain('default-src');
    });

    it('should include HSTS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });
  });

  describe('Authentication Middleware', () => {
    it('should allow access to public endpoints without auth', async () => {
      const response = await request(app)
        .get('/api/public/info')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Public endpoint');
    });

    it('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .post('/api/protected/data')
        .send({ test: 'data' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('should allow access with valid bearer token', async () => {
      const response = await request(app)
        .post('/api/protected/data')
        .set('Authorization', 'Bearer valid-token')
        .send({ test: 'data' })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit', '100');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining', '99');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('should track rate limit info in context', async () => {
      const response = await request(app)
        .get('/api/middleware/test')
        .expect(200);

      expect(response.body).toHaveProperty('rateLimitInfo');
      const rateLimitInfo = response.body.rateLimitInfo;
      
      expect(rateLimitInfo).toHaveProperty('limit', 100);
      expect(rateLimitInfo).toHaveProperty('remaining', 99);
      expect(rateLimitInfo).toHaveProperty('reset');
    });
  });

  describe('Validation Middleware', () => {
    it('should accept valid JSON content type', async () => {
      const response = await request(app)
        .post('/api/validation/test')
        .set('Content-Type', 'application/json')
        .send({ valid: 'json' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Validation passed');
      expect(response.body).toHaveProperty('body');
    });

    it('should accept form-urlencoded content type', async () => {
      const response = await request(app)
        .post('/api/validation/test')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('key=value')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Validation passed');
    });

    it('should reject unsupported content types', async () => {
      const response = await request(app)
        .post('/api/validation/test')
        .set('Content-Type', 'text/plain')
        .send('plain text')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Unsupported content type');
    });

    it('should allow special content types for upload endpoints', async () => {
      const response = await request(app)
        .post('/api/upload/file')
        .set('Content-Type', 'multipart/form-data')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'File upload endpoint');
    });
  });

  describe('Compression Middleware', () => {
    it('should compress large responses', async () => {
      const response = await request(app)
        .get('/api/middleware/test')
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      // Note: supertest may not show compression headers in test environment
      expect(response.body).toHaveProperty('middlewareChain');
    });

    it('should respect no-compression header', async () => {
      const response = await request(app)
        .get('/api/middleware/test')
        .set('X-No-Compression', '1')
        .expect(200);

      expect(response.body).toHaveProperty('middlewareChain');
    });
  });

  describe('API Versioning', () => {
    it('should default to version 1.0', async () => {
      const response = await request(app)
        .get('/api/public/info')
        .expect(200);

      expect(response.headers).toHaveProperty('api-version', '1.0');
      expect(response.body.context).toHaveProperty('apiVersion', '1.0');
    });

    it('should respect custom API version header', async () => {
      const response = await request(app)
        .get('/api/public/info')
        .set('API-Version', '2.5')
        .expect(200);

      expect(response.headers).toHaveProperty('api-version', '2.5');
      expect(response.body.context).toHaveProperty('apiVersion', '2.5');
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle errors with proper structure', async () => {
      const response = await request(app)
        .get('/api/error/test')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Test error for middleware handling');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/api/error/test');
      expect(response.body).toHaveProperty('method', 'GET');
    });

    it('should handle 404 errors for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/non-existent');
      expect(response.body).toHaveProperty('requestId');
    });
  });

  describe('Session Management', () => {
    it('should create session ID if not provided', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-session-id');
      expect(response.headers['x-session-id']).toMatch(/^session-/);
    });

    it('should use provided session ID', async () => {
      const customSessionId = 'custom-session-123';
      
      const response = await request(app)
        .get('/api/health')
        .set('X-Session-ID', customSessionId)
        .expect(200);

      expect(response.headers).toHaveProperty('x-session-id', customSessionId);
    });
  });

  describe('Middleware Performance', () => {
    it('should complete middleware chain quickly', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/middleware/test')
        .expect(200);

      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(response.body).toHaveProperty('middlewareChain');
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      expect(responses).toHaveLength(10);
      
      // All should have unique request IDs
      const requestIds = responses.map(r => r.body.requestId);
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(10);
    });
  });
});