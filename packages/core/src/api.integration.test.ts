import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Application } from 'express';
import { Client as PgClient } from 'pg';
import { Redis } from 'ioredis';
import { Server } from 'http';

import { initializeWebServer } from './webServer.js';
import { getConfig } from './config.js';

describe('API Integration Tests', () => {
  let app: Application;
  let server: Server;
  let pgClient: PgClient;
  let redisClient: Redis;
  const config = getConfig();

  beforeAll(async () => {
    // Initialize test database and Redis connections
    const connectionString = `postgresql://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${config.POSTGRES_HOST}:${config.POSTGRES_PORT}/${config.POSTGRES_DB}`;
    
    pgClient = new PgClient({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });
    await pgClient.connect();

    // Initialize Redis client
    if (config.REDIS_URL) {
      redisClient = new Redis(config.REDIS_URL);
    } else {
      redisClient = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        db: config.REDIS_DB,
      });
    }
    
    // Initialize web server for testing
    const serverInit = await initializeWebServer(pgClient, redisClient);
    app = serverInit.app;
    server = serverInit.server;
  }, 30000);

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (pgClient) {
      await pgClient.end();
    }
    if (redisClient) {
      redisClient.disconnect();
    }
  });

  describe('Health Check', () => {
    it('should return 200 OK for health endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.text).toBe('OK');
    });
  });

  describe('Tools API', () => {
    it('should return available tools', async () => {
      const response = await request(app)
        .get('/api/tools')
        .set('Authorization', config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('name');
      }
    });

    it('should require authorization when AUTH_TOKEN is set', async () => {
      if (!config.AUTH_TOKEN) {
        return; // Skip test if no auth is required
      }

      await request(app)
        .get('/api/tools')
        .expect(401);
    });
  });

  describe('Chat API', () => {
    it('should accept chat messages with required fields', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '')
        .send({
          prompt: 'Hello, this is a test message',
          llmProvider: 'openai',
          llmModelName: 'gpt-3.5-turbo'
        })
        .expect(202);
      
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('traitement en cours');
    });

    it('should reject chat messages without prompt', async () => {
      await request(app)
        .post('/api/chat')
        .set('Authorization', config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '')
        .send({
          llmProvider: 'openai',
          llmModelName: 'gpt-3.5-turbo'
        })
        .expect(400);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/chat')
        .set('Authorization', config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });

  describe('Test Chat API', () => {
    it('should create test sessions with custom names', async () => {
      const testSessionName = 'Integration Test Session';
      
      const response = await request(app)
        .post('/api/test-chat')
        .set('Authorization', config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '')
        .send({
          prompt: 'This is a test message for integration testing',
          sessionName: testSessionName,
          llmProvider: 'openai',
          llmModelName: 'gpt-3.5-turbo'
        })
        .expect(202);
      
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('sessionName');
      expect(response.body.sessionName).toBe(testSessionName);
      expect(response.body.sessionId).toMatch(/^test-/);
    });
  });

  describe('Session Management', () => {
    it('should create and maintain session cookies', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookieHeaders = response.headers['set-cookie'];
      const cookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
      const sessionCookie = cookieArray.find((cookie: string | undefined) => 
        cookie && cookie.includes('agenticforge_session_id')
      );
      expect(sessionCookie).toBeDefined();
    });

    it('should include session ID in response headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.headers['x-session-id']).toBeDefined();
      expect(typeof response.headers['x-session-id']).toBe('string');
    });
  });

  describe('CORS Configuration', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle OPTIONS preflight requests', async () => {
      await request(app)
        .options('/api/chat')
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/non-existent-endpoint')
        .set('Authorization', config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '')
        .expect(404);
    });

    it('should handle unauthorized access gracefully', async () => {
      if (!config.AUTH_TOKEN) {
        return; // Skip test if no auth is required
      }

      const response = await request(app)
        .get('/api/tools')
        .set('Authorization', 'Bearer invalid-key')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Content Type Handling', () => {
    it('should handle application/json content type', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          prompt: 'JSON content type test',
          llmProvider: 'openai',
          llmModelName: 'gpt-3.5-turbo'
        }))
        .expect(202);
      
      expect(response.body).toHaveProperty('jobId');
    });
  });

  describe('Request Size Limits', () => {
    it('should handle reasonable request sizes', async () => {
      const largePrompt = 'A'.repeat(1000); // 1KB prompt
      
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '')
        .send({
          prompt: largePrompt,
          llmProvider: 'openai',
          llmModelName: 'gpt-3.5-turbo'
        })
        .expect(202);
      
      expect(response.body).toHaveProperty('jobId');
    });
  });
});