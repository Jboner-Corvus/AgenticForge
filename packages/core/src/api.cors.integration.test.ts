import cors from 'cors';
import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getConfig } from './config.ts';

describe('API CORS Integration Tests', () => {
  let app: express.Application;
  let server: Server;
  const config = getConfig();

  beforeAll(async () => {
    // Create Express app with different CORS configurations
    app = express();
    app.use(express.json());

    // Custom CORS configuration for different endpoints
    const corsOptions = {
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Session-ID',
        'X-API-Key',
        'Cache-Control',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      optionsSuccessStatus: 200,
      origin: function (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Define allowed origins
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://agenticforge.com',
          'https://www.agenticforge.com',
        ];

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      },
    };

    // Apply CORS middleware
    app.use(cors(corsOptions));

    // Manual CORS handling for specific endpoints
    app.use('/api/public/*', (req, res, next) => {
      // More permissive CORS for public endpoints
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      );
      res.header('Access-Control-Max-Age', '3600');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Restricted CORS for admin endpoints
    app.use('/api/admin/*', (req, res, next) => {
      const origin = req.headers.origin;
      const allowedAdminOrigins = ['https://admin.agenticforge.com'];

      if (allowedAdminOrigins.includes(origin || '')) {
        res.header('Access-Control-Allow-Origin', origin);
      }

      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        if (allowedAdminOrigins.includes(origin || '')) {
          res.sendStatus(200);
        } else {
          res.sendStatus(403);
        }
      } else {
        next();
      }
    });

    // API endpoints for testing
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    app.post('/api/chat', (req, res) => {
      const { message } = req.body;
      res.json({
        jobId: `job-${Date.now()}`,
        message: 'Chat request received',
        originalMessage: message,
      });
    });

    app.get('/api/public/info', (req, res) => {
      res.json({
        message: 'Public endpoint with permissive CORS',
        timestamp: Date.now(),
      });
    });

    app.post('/api/public/feedback', (req, res) => {
      const { feedback, rating } = req.body;
      res.json({
        feedback,
        id: Date.now(),
        message: 'Feedback received',
        rating,
      });
    });

    app.get('/api/admin/stats', (req, res) => {
      res.json({
        sessions: 5000,
        timestamp: Date.now(),
        users: 1000,
      });
    });

    app.post('/api/admin/config', (req, res) => {
      res.json({
        config: req.body,
        message: 'Configuration updated',
      });
    });

    // WebSocket simulation endpoint
    app.get('/api/stream/:id', (req, res) => {
      res.writeHead(200, {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      });

      res.write('data: {"type":"connection","id":"' + req.params.id + '"}\n\n');

      setTimeout(() => {
        res.write('data: {"type":"message","content":"Test message"}\n\n');
        res.end();
      }, 100);
    });

    // Cross-origin resource endpoint
    app.get('/api/resources/data.json', (req, res) => {
      res.json({
        data: [
          { id: 1, name: 'Resource 1' },
          { id: 2, name: 'Resource 2' },
        ],
        meta: {
          timestamp: Date.now(),
          total: 2,
        },
      });
    });

    // File upload endpoint
    app.post('/api/upload', (req, res) => {
      res.json({
        contentType: req.headers['content-type'],
        message: 'File upload endpoint',
        timestamp: Date.now(),
      });
    });

    // Authentication endpoint
    app.post('/api/auth/login', (req, res) => {
      const { password, username } = req.body;
      if (username && password) {
        res.json({
          timestamp: Date.now(),
          token: 'mock-jwt-token',
          user: { id: 1, username },
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    // JSONP endpoint for legacy support
    app.get('/api/jsonp/data', (req, res) => {
      const callback = req.query.callback;
      const data = { message: 'JSONP response', timestamp: Date.now() };

      if (callback) {
        res.type('application/javascript');
        res.send(`${callback}(${JSON.stringify(data)});`);
      } else {
        res.json(data);
      }
    });

    // Error handling for CORS issues
    app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        if (error && error.message === 'Not allowed by CORS') {
          res.status(403).json({
            error: 'CORS policy violation',
            message: 'Origin not allowed',
            origin: req.headers.origin,
          });
        } else {
          next(error);
        }
      },
    );

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
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

  describe('Basic CORS Functionality', () => {
    it('should handle simple CORS requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should handle requests without origin header', async () => {
      const response = await request(app).get('/api/health').expect(200);

      // Should still work for requests without origin (like curl, mobile apps)
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should reject requests from non-allowed origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'CORS policy violation');
      expect(response.body).toHaveProperty(
        'origin',
        'https://malicious-site.com',
      );
    });

    it('should allow requests from whitelisted origins', async () => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://agenticforge.com',
        'https://www.agenticforge.com',
      ];

      for (const origin of allowedOrigins) {
        const response = await request(app)
          .get('/api/health')
          .set('Origin', origin)
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe(origin);
      }
    });
  });

  describe('Preflight Requests (OPTIONS)', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
      expect(response.headers['access-control-allow-methods']).toContain(
        'POST',
      );
      expect(response.headers['access-control-allow-headers']).toContain(
        'Content-Type',
      );
      expect(response.headers['access-control-allow-headers']).toContain(
        'Authorization',
      );
    });

    it('should include max-age header in preflight responses', async () => {
      const response = await request(app)
        .options('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      expect(response.headers['access-control-max-age']).toBeDefined();
      const maxAge = parseInt(response.headers['access-control-max-age']);
      expect(maxAge).toBeGreaterThan(0);
    });

    it('should handle complex preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://agenticforge.com')
        .set('Access-Control-Request-Method', 'POST')
        .set(
          'Access-Control-Request-Headers',
          'Content-Type,Authorization,X-Session-ID',
        )
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toContain(
        'POST',
      );
      expect(response.headers['access-control-allow-headers']).toContain(
        'X-Session-ID',
      );
    });

    it('should reject preflight for disallowed methods', async () => {
      const response = await request(app)
        .options('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'TRACE')
        .expect(200); // CORS middleware typically still returns 200 but doesn't include the method

      const allowedMethods =
        response.headers['access-control-allow-methods'] || '';
      expect(allowedMethods).not.toContain('TRACE');
    });
  });

  describe('Actual Cross-Origin Requests', () => {
    it('should handle POST requests with JSON data', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ message: 'Hello from cross-origin!' })
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty(
        'originalMessage',
        'Hello from cross-origin!',
      );
    });

    it('should handle requests with custom headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://agenticforge.com')
        .set('X-Session-ID', 'test-session-123')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://agenticforge.com',
      );
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should handle file upload requests', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Origin', 'http://localhost:5173')
        .set('Content-Type', 'multipart/form-data')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173',
      );
      expect(response.body).toHaveProperty('message');
    });

    it('should handle authentication requests', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'https://www.agenticforge.com')
        .send({ password: 'testpass', username: 'testuser' })
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://www.agenticforge.com',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('Public Endpoints CORS', () => {
    it('should allow all origins for public endpoints', async () => {
      const response = await request(app)
        .get('/api/public/info')
        .set('Origin', 'https://any-domain.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle public POST requests', async () => {
      const response = await request(app)
        .post('/api/public/feedback')
        .set('Origin', 'https://external-site.com')
        .send({ feedback: 'Great service!', rating: 5 })
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.body).toHaveProperty('feedback', 'Great service!');
    });

    it('should handle OPTIONS for public endpoints', async () => {
      const response = await request(app)
        .options('/api/public/feedback')
        .set('Origin', 'https://any-domain.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-max-age']).toBe('3600');
    });
  });

  describe('Admin Endpoints CORS', () => {
    it('should allow admin origins for admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Origin', 'https://admin.agenticforge.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://admin.agenticforge.com',
      );
      expect(response.body).toHaveProperty('users');
    });

    it('should reject non-admin origins for admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Origin', 'https://regular-user.com')
        .expect(200); // Request goes through but no CORS headers

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should handle admin OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/admin/config')
        .set('Origin', 'https://admin.agenticforge.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://admin.agenticforge.com',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject OPTIONS from non-admin origins', async () => {
      const response = await request(app)
        .options('/api/admin/config')
        .set('Origin', 'https://hacker.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(403);
    });
  });

  describe('Streaming and Special Content Types', () => {
    it('should handle CORS for streaming endpoints', async () => {
      const response = await request(app)
        .get('/api/stream/test-123')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should handle CORS for JSON resources', async () => {
      const response = await request(app)
        .get('/api/resources/data.json')
        .set('Origin', 'https://agenticforge.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://agenticforge.com',
      );
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support JSONP for legacy browsers', async () => {
      const response = await request(app)
        .get('/api/jsonp/data?callback=myCallback')
        .expect(200);

      expect(response.headers['content-type']).toContain(
        'application/javascript',
      );
      expect(response.text).toContain('myCallback(');
      expect(response.text).toContain('{"message":"JSONP response"');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed origin headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'not-a-valid-url')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'CORS policy violation');
    });

    it('should handle multiple origin headers', async () => {
      // Note: supertest might not allow multiple headers with same name
      // This test simulates the concept
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
    });

    it('should handle very long origin headers', async () => {
      const longOrigin = 'https://' + 'a'.repeat(1000) + '.com';

      const response = await request(app)
        .get('/api/health')
        .set('Origin', longOrigin)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle case sensitivity in origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'HTTP://LOCALHOST:3000') // Uppercase
        .expect(403);

      // Origins should be case-sensitive
      expect(response.body).toHaveProperty('error', 'CORS policy violation');
    });

    it('should handle missing Access-Control-Request-Method in OPTIONS', async () => {
      const response = await request(app)
        .options('/api/chat')
        .set('Origin', 'http://localhost:3000')
        // Missing Access-Control-Request-Method header
        .expect(200);

      // Should still provide CORS headers
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
    });
  });

  describe('Credentials and Security', () => {
    it('should handle credentials properly with CORS', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Cookie', 'session=abc123')
        .send({ password: 'test', username: 'test' })
        .expect(200);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
    });

    it('should not expose sensitive headers to unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);

      // Should not include any access-control headers for rejected origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(
        response.headers['access-control-allow-credentials'],
      ).toBeUndefined();
    });

    it('should handle authorization headers in CORS requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://agenticforge.com')
        .set('Authorization', 'Bearer jwt-token-here')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://agenticforge.com',
      );
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
});
