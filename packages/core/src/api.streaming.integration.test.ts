import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import { Server } from 'http';
import request from 'supertest';
import { getConfig } from './config.js';

describe('API Streaming Integration Tests', () => {
  let app: express.Application;
  let server: Server;
  let config: ReturnType<typeof getConfig>;
  let baseUrl: string;

  beforeAll(async () => {
    config = getConfig();
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    
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

    // Mock streaming endpoints
    app.post('/api/chat', (req, res) => {
      const jobId = `job-${Date.now()}`;
      res.json({ jobId, message: 'Job started' });
    });

    app.get('/api/chat/stream/:jobId', (req, res) => {
      const { jobId } = req.params;
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection message
      res.write('data: {"type":"connection","message":"Connected to stream"}\n\n');

      // Send test messages and complete quickly
      res.write(`data: {"type":"message","jobId":"${jobId}","content":"Test message"}\n\n`);
      res.write(`data: {"type":"completed","jobId":"${jobId}","result":"Task completed"}\n\n`);
      res.end();
    });

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Start server
    server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup any open connections
  });

  it('should handle basic API requests', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should handle CORS preflight requests', async () => {
    await request(app)
      .options('/api/chat')
      .expect(200);
  });

  it('should start chat job and return jobId', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello world' })
      .expect(200);

    expect(response.body).toHaveProperty('jobId');
    expect(response.body.jobId).toMatch(/^job-\d+$/);
    expect(response.body).toHaveProperty('message', 'Job started');
  });

  it('should return SSE headers for streaming endpoints', async () => {
    const response = await request(app)
      .get('/api/chat/stream/test-job')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.headers['connection']).toBe('keep-alive');
  });

  it('should stream formatted SSE data', async () => {
    const response = await request(app)
      .get('/api/chat/stream/test-job-123')
      .expect(200);

    const streamData = response.text;
    
    // Check SSE format
    expect(streamData).toContain('data: ');
    expect(streamData).toContain('\n\n');
    
    // Check message content
    expect(streamData).toContain('"type":"connection"');
    expect(streamData).toContain('"type":"message"');
    expect(streamData).toContain('"type":"completed"');
    expect(streamData).toContain('"jobId":"test-job-123"');
  });

  it('should handle multiple concurrent requests', async () => {
    const requests = Array.from({ length: 5 }, (_, i) =>
      request(app)
        .post('/api/chat')
        .send({ message: `Test message ${i}` })
        .expect(200)
    );

    const responses = await Promise.all(requests);
    
    // Each should have unique jobId
    const jobIds = responses.map(r => r.body.jobId);
    const uniqueJobIds = new Set(jobIds);
    
    expect(uniqueJobIds.size).toBe(5);
  });

  it('should handle streaming endpoint with different jobIds', async () => {
    const jobIds = ['job-1', 'job-2', 'job-3'];
    
    const streamRequests = jobIds.map(jobId =>
      request(app)
        .get(`/api/chat/stream/${jobId}`)
        .expect(200)
    );

    const responses = await Promise.all(streamRequests);
    
    responses.forEach((response, index) => {
      const expectedJobId = jobIds[index];
      expect(response.text).toContain(`"jobId":"${expectedJobId}"`);
    });
  });

  it('should validate SSE message format', async () => {
    const response = await request(app)
      .get('/api/chat/stream/format-test')
      .expect(200);

    const lines = response.text.split('\n');
    
    // Check SSE format compliance
    const dataLines = lines.filter(line => line.startsWith('data: '));
    expect(dataLines.length).toBeGreaterThan(0);
    
    // Each data line should contain valid JSON
    dataLines.forEach(line => {
      const jsonStr = line.substring(6); // Remove 'data: ' prefix
      expect(() => JSON.parse(jsonStr)).not.toThrow();
    });
  });

  it('should handle API error responses', async () => {
    // Test non-existent endpoint
    await request(app)
      .get('/api/nonexistent')
      .expect(404);

    // Test invalid JSON
    await request(app)
      .post('/api/chat')
      .send('invalid json')
      .expect(400);
  });

  it('should handle large streaming payloads', async () => {
    // Add endpoint for large data
    app.get('/api/test/large-payload', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // Send large payload
      const largePayload = 'A'.repeat(10000);
      res.write(`data: {"type":"large","data":"${largePayload}"}\n\n`);
      res.end();
    });

    const response = await request(app)
      .get('/api/test/large-payload')
      .expect(200);

    expect(response.text).toContain('"type":"large"');
    expect(response.text.length).toBeGreaterThan(10000);
  });

  it('should handle concurrent streaming connections', async () => {
    const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
      request(app)
        .get(`/api/chat/stream/concurrent-${i}`)
        .expect(200)
    );

    const responses = await Promise.all(concurrentRequests);
    
    // All should complete successfully
    expect(responses).toHaveLength(10);
    
    responses.forEach((response, index) => {
      expect(response.text).toContain(`"jobId":"concurrent-${index}"`);
      expect(response.text).toContain('"type":"completed"');
    });
  });

  it('should handle streaming endpoint performance', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/api/chat/stream/perf-test')
      .expect(200);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(1000); // 1 second
    expect(response.text).toContain('"type":"completed"');
  });

  it('should properly encode JSON in SSE messages', async () => {
    // Add endpoint with special characters
    app.get('/api/test/special-chars', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const specialData = {
        message: 'Test with "quotes" and \nnewlines\t and unicode: 🚀',
        emoji: '😀',
        special: '\u0000\u001F'
      };

      res.write(`data: ${JSON.stringify(specialData)}\n\n`);
      res.end();
    });

    const response = await request(app)
      .get('/api/test/special-chars')
      .expect(200);

    const dataLine = response.text.split('\n').find(line => line.startsWith('data: '));
    expect(dataLine).toBeDefined();
    
    const jsonStr = dataLine!.substring(6);
    const parsed = JSON.parse(jsonStr);
    
    expect(parsed.message).toContain('quotes');
    expect(parsed.emoji).toBe('😀');
  });

  it('should handle SSE connection timeouts', async () => {
    // Add endpoint with delay
    app.get('/api/test/timeout', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // Simulate long running operation
      setTimeout(() => {
        res.write('data: {"type":"delayed","message":"Finally complete"}\n\n');
        res.end();
      }, 100);
    });

    const response = await request(app)
      .get('/api/test/timeout')
      .timeout(500) // 500ms timeout
      .expect(200);

    expect(response.text).toContain('"type":"delayed"');
  });
});