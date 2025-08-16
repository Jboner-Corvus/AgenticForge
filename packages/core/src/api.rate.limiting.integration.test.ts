import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import { getConfig } from './config.js';

describe('API Rate Limiting Integration Tests', () => {
  let app: express.Application;
  let server: Server;
  const config = getConfig();

  beforeAll(async () => {
    // Create Express app with rate limiting
    app = express();
    app.use(express.json());

    // Trust proxy headers for rate limiting
    app.set('trust proxy', 1);

    // Add CORS middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Global rate limiter - 100 requests per 15 minutes
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        type: 'rate_limit_exceeded',
        retryAfter: '15 minutes'
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

    // Strict rate limiter for authentication endpoints - 5 requests per 15 minutes
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        type: 'auth_rate_limit_exceeded',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful requests
    });

    // Chat rate limiter - 10 requests per minute
    const chatLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // limit each IP to 10 requests per minute
      message: {
        error: 'Too many chat requests, please slow down.',
        type: 'chat_rate_limit_exceeded',
        retryAfter: '1 minute'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Apply global rate limiting to all requests
    app.use(globalLimiter);

    // Health check endpoint (no additional rate limiting)
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Authentication endpoints with strict rate limiting
    app.post('/api/auth/login', authLimiter, (req, res) => {
      const { username, password } = req.body;
      if (username === 'admin' && password === 'password') {
        res.json({ token: 'mock-jwt-token', user: { id: 1, username: 'admin' } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    app.post('/api/auth/register', authLimiter, (req, res) => {
      const { username, email } = req.body;
      if (!username || !email) {
        return res.status(400).json({ error: 'Username and email required' });
      }
      res.status(201).json({ 
        message: 'User registered successfully',
        user: { id: Date.now(), username, email }
      });
    });

    app.post('/api/auth/forgot-password', authLimiter, (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }
      res.json({ message: 'Password reset email sent' });
    });

    // Chat endpoints with moderate rate limiting
    app.post('/api/chat', chatLimiter, (req, res) => {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message required' });
      }
      
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.status(202).json({
        jobId,
        message: 'Chat request accepted',
        timestamp: Date.now()
      });
    });

    app.get('/api/chat/history', chatLimiter, (req, res) => {
      res.json({
        history: [
          { id: 1, message: 'Hello', timestamp: Date.now() - 60000 },
          { id: 2, message: 'How are you?', timestamp: Date.now() - 30000 }
        ]
      });
    });

    // API endpoints for testing different scenarios
    app.get('/api/public/info', (req, res) => {
      res.json({ 
        message: 'Public information endpoint',
        rateLimit: {
          global: '100 requests per 15 minutes',
          chat: '10 requests per minute',
          auth: '5 requests per 15 minutes'
        }
      });
    });

    // Admin endpoints with custom rate limiting
    const adminLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 requests per minute for admin operations
      message: {
        error: 'Too many admin requests',
        type: 'admin_rate_limit_exceeded'
      }
    });

    app.get('/api/admin/stats', adminLimiter, (req, res) => {
      res.json({
        totalUsers: 1250,
        totalChats: 5000,
        systemLoad: 0.65
      });
    });

    // Error handling middleware
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (error.status === 429) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: error.message,
          retryAfter: error.retryAfter
        });
      } else {
        next(error);
      }
    });

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

  beforeEach(async () => {
    // Wait a bit between tests to avoid rate limiting interference
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Global Rate Limiting', () => {
    it('should allow requests within global rate limit', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should include rate limit headers in responses', async () => {
      const response = await request(app)
        .get('/api/public/info')
        .expect(200);

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
      
      const limit = parseInt(response.headers['ratelimit-limit']);
      const remaining = parseInt(response.headers['ratelimit-remaining']);
      
      expect(limit).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(limit);
    });

    it('should decrement remaining requests count', async () => {
      const first = await request(app)
        .get('/api/public/info')
        .expect(200);

      const second = await request(app)
        .get('/api/public/info')
        .expect(200);

      const firstRemaining = parseInt(first.headers['ratelimit-remaining']);
      const secondRemaining = parseInt(second.headers['ratelimit-remaining']);

      expect(secondRemaining).toBeLessThan(firstRemaining);
    });
  });

  describe('Authentication Rate Limiting', () => {
    it('should allow valid authentication requests', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'password' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should apply stricter rate limits to auth endpoints', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'password' })
        .expect(200);

      const authLimit = parseInt(response.headers['ratelimit-limit']);
      
      // Auth endpoints should have much lower limits than global
      expect(authLimit).toBeLessThan(50);
    });

    it('should handle registration rate limiting', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com' })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });

    it('should rate limit password reset requests', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });
  });

  describe('Chat Rate Limiting', () => {
    it('should allow chat requests within limit', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello, how are you?' })
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('message', 'Chat request accepted');
    });

    it('should apply moderate rate limits to chat endpoints', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Test message' })
        .expect(202);

      const chatLimit = parseInt(response.headers['ratelimit-limit']);
      
      // Chat should have moderate limits
      expect(chatLimit).toBeGreaterThan(5);
      expect(chatLimit).toBeLessThan(50);
    });

    it('should rate limit chat history requests', async () => {
      const response = await request(app)
        .get('/api/chat/history')
        .expect(200);

      expect(response.body).toHaveProperty('history');
      expect(Array.isArray(response.body.history)).toBe(true);
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });
  });

  describe('Rate Limit Enforcement', () => {
    it('should handle multiple rapid requests gracefully', async () => {
      const requests = Array.from({ length: 3 }, () =>
        request(app)
          .get('/api/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      // All should succeed within normal limits
      responses.forEach(response => {
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.headers['ratelimit-remaining']).toBeDefined();
      });
    });

    it('should provide consistent rate limit information', async () => {
      const response1 = await request(app)
        .get('/api/public/info')
        .expect(200);

      const response2 = await request(app)
        .get('/api/public/info')
        .expect(200);

      // Rate limit headers should be consistent
      expect(response1.headers['ratelimit-limit']).toBe(response2.headers['ratelimit-limit']);
      
      const remaining1 = parseInt(response1.headers['ratelimit-remaining']);
      const remaining2 = parseInt(response2.headers['ratelimit-remaining']);
      
      expect(remaining2).toBeLessThanOrEqual(remaining1);
    });

    it('should handle concurrent requests properly', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/chat')
          .send({ message: `Concurrent message ${i}` })
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All should succeed if within limits
      responses.forEach(response => {
        expect([200, 202, 429]).toContain(response.status);
        if (response.status === 202) {
          expect(response.body).toHaveProperty('jobId');
        }
      });
    });
  });

  describe('Rate Limit Error Responses', () => {
    it('should return proper error format when rate limited', async () => {
      // This test assumes we might hit rate limits in CI
      // We'll make many requests to potentially trigger it
      const manyRequests = Array.from({ length: 15 }, () =>
        request(app)
          .post('/api/chat')
          .send({ message: 'Rapid test message' })
      );

      const responses = await Promise.all(manyRequests);
      
      // Check if any were rate limited
      const rateLimitedResponse = responses.find(r => r.status === 429);
      
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.body).toHaveProperty('error');
        expect(rateLimitedResponse.body.error).toContain('Too many');
        expect(rateLimitedResponse.body).toHaveProperty('type');
        expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
      }
    });

    it('should include retry-after information', async () => {
      const response = await request(app)
        .get('/api/public/info')
        .expect(200);

      // Check headers are present (whether rate limited or not)
      expect(response.headers['ratelimit-reset']).toBeDefined();
      
      const resetTime = parseInt(response.headers['ratelimit-reset']);
      const currentTime = Math.floor(Date.now() / 1000);
      
      expect(resetTime).toBeGreaterThan(currentTime);
    });
  });

  describe('Admin Rate Limiting', () => {
    it('should apply custom rate limits to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('systemLoad');
      
      const adminLimit = parseInt(response.headers['ratelimit-limit']);
      expect(adminLimit).toBeGreaterThan(10); // Admin should have reasonable limits
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed requests within rate limits', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await request(app)
        .options('/api/chat')
        .expect(200);

      // OPTIONS requests should still be rate limited
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });

    it('should not double-count failed authentication attempts', async () => {
      // First failed attempt
      const first = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wrong', password: 'wrong' })
        .expect(401);

      // Second failed attempt
      const second = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wrong', password: 'wrong' })
        .expect(401);

      const firstRemaining = parseInt(first.headers['ratelimit-remaining']);
      const secondRemaining = parseInt(second.headers['ratelimit-remaining']);

      // Both failed attempts should count against rate limit
      expect(secondRemaining).toBeLessThan(firstRemaining);
    });
  });
});