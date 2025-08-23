import { Application } from 'express';
import { Server } from 'http';
import { Redis } from 'ioredis';
import { Client as PgClient } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getConfig } from './config.ts';
import { initializeWebServer } from './webServer.ts';

describe('API Streaming Integration Tests', () => {
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
      ssl: connectionString.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    });
    await pgClient.connect();

    // Initialize Redis client
    if (config.REDIS_URL) {
      redisClient = new Redis(config.REDIS_URL);
    } else {
      redisClient = new Redis({
        db: config.REDIS_DB,
        host: config.REDIS_HOST,
        password: config.REDIS_PASSWORD,
        port: config.REDIS_PORT,
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

  it('should handle basic API requests', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.text).toBe('OK');
  });

  it('should handle CORS preflight requests', async () => {
    await request(app).options('/api/chat').expect(200);
  });

  it('should start chat job and return jobId', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .send({
        prompt: 'Hello world',
        sessionId: 'test-streaming-session',
      })
      .expect(202);

    expect(response.body).toHaveProperty('jobId');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('traitement en cours');
  });

  it('should return SSE headers for streaming endpoints', async () => {
    // First create a job
    const jobResponse = await request(app)
      .post('/api/chat')
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .send({
        prompt: 'Test streaming',
        sessionId: 'test-streaming-session-2',
      })
      .expect(202);

    const jobId = jobResponse.body.jobId;

    // Then test the streaming endpoint
    const response = await request(app)
      .get(`/api/chat/stream/${jobId}`)
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.headers['connection']).toBe('keep-alive');
  });

  it('should stream formatted SSE data', async () => {
    // First create a job
    const jobResponse = await request(app)
      .post('/api/chat')
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .send({
        prompt: 'Test SSE streaming format',
        sessionId: 'test-streaming-session-3',
      })
      .expect(202);

    const jobId = jobResponse.body.jobId;

    // Then test the streaming endpoint
    const response = await request(app)
      .get(`/api/chat/stream/${jobId}`)
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .expect(200);

    const streamData = response.text;

    // Check SSE format
    expect(streamData).toContain('data: ');
    expect(streamData).toContain('\n\n');
  });

  it('should handle multiple concurrent requests', async () => {
    const requests = Array.from({ length: 3 }, (_, i) =>
      request(app)
        .post('/api/chat')
        .set(
          'Authorization',
          config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
        )
        .send({
          prompt: `Test message ${i}`,
          sessionId: `concurrent-session-${i}`,
        })
        .expect(202),
    );

    const responses = await Promise.all(requests);

    // Each should have jobId
    const jobIds = responses.map((r) => r.body.jobId);
    expect(jobIds).toHaveLength(3);

    // All jobIds should be present
    jobIds.forEach((jobId) => {
      expect(jobId).toBeDefined();
    });
  });

  it('should handle streaming endpoint with different jobIds', async () => {
    const sessionIds = [
      'stream-session-1',
      'stream-session-2',
      'stream-session-3',
    ];

    // Create jobs for each session
    const jobResponses = await Promise.all(
      sessionIds.map((sessionId) =>
        request(app)
          .post('/api/chat')
          .set(
            'Authorization',
            config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
          )
          .send({
            prompt: `Test for ${sessionId}`,
            sessionId,
          })
          .expect(202),
      ),
    );

    const jobIds = jobResponses.map((response) => response.body.jobId);

    // Test streaming for each jobId
    const streamResponses = await Promise.all(
      jobIds.map((jobId) =>
        request(app)
          .get(`/api/chat/stream/${jobId}`)
          .set(
            'Authorization',
            config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
          )
          .expect(200),
      ),
    );

    // Verify each stream response
    streamResponses.forEach((response, index) => {
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  it('should validate SSE message format', async () => {
    // Create a job
    const jobResponse = await request(app)
      .post('/api/chat')
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .send({
        prompt: 'Test SSE message format validation',
        sessionId: 'format-validation-session',
      })
      .expect(202);

    const jobId = jobResponse.body.jobId;

    // Test the streaming endpoint
    const response = await request(app)
      .get(`/api/chat/stream/${jobId}`)
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .expect(200);

    const lines = response.text.split('\n');

    // Check SSE format compliance
    const dataLines = lines.filter((line) => line.startsWith('data: '));

    // Each data line should contain valid JSON
    dataLines.forEach((line) => {
      if (line.length > 6) {
        // Only check non-empty data lines
        const jsonStr = line.substring(6); // Remove 'data: ' prefix
        if (jsonStr.trim().length > 0) {
          expect(() => JSON.parse(jsonStr)).not.toThrow();
        }
      }
    });
  });

  it('should handle API error responses', async () => {
    // Test non-existent endpoint
    await request(app)
      .get('/api/nonexistent')
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .expect(404);

    // Test invalid JSON
    await request(app)
      .post('/api/chat')
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .set('Content-Type', 'application/json')
      .send('invalid json')
      .expect(400);
  });

  it('should handle large streaming payloads', async () => {
    // Create a job with a request that might generate larger responses
    const jobResponse = await request(app)
      .post('/api/chat')
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .send({
        prompt:
          'Generate a detailed response about web development best practices with examples',
        sessionId: 'large-payload-session',
      })
      .expect(202);

    const jobId = jobResponse.body.jobId;

    // Test the streaming endpoint
    const response = await request(app)
      .get(`/api/chat/stream/${jobId}`)
      .set(
        'Authorization',
        config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
      )
      .expect(200);

    // Response should contain data
    expect(response.text.length).toBeGreaterThan(0);
  });

  it('should handle concurrent streaming connections', async () => {
    const sessionIds = Array.from(
      { length: 5 },
      (_, i) => `concurrent-stream-${i}`,
    );

    // Create jobs for each session
    const jobResponses = await Promise.all(
      sessionIds.map((sessionId) =>
        request(app)
          .post('/api/chat')
          .set(
            'Authorization',
            config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
          )
          .send({
            prompt: `Concurrent test for ${sessionId}`,
            sessionId,
          })
          .expect(202),
      ),
    );

    const jobIds = jobResponses.map((response) => response.body.jobId);

    // Test streaming for all jobIds concurrently
    const streamResponses = await Promise.all(
      jobIds.map((jobId) =>
        request(app)
          .get(`/api/chat/stream/${jobId}`)
          .set(
            'Authorization',
            config.AUTH_TOKEN ? `Bearer ${config.AUTH_TOKEN}` : '',
          )
          .expect(200),
      ),
    );

    // All should complete successfully
    expect(streamResponses).toHaveLength(5);
  });
});
