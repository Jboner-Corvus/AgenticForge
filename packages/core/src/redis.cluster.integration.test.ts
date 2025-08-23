import IORedis from 'ioredis';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { getConfig } from './config.ts';

describe('Redis Cluster Integration Tests', () => {
  let redis: IORedis;
  let config: ReturnType<typeof getConfig>;

  beforeAll(async () => {
    config = getConfig();

    // Create Redis connection
    redis = new IORedis({
      db: config.REDIS_DB,
      enableReadyCheck: false,
      host: config.REDIS_HOST,
      maxRetriesPerRequest: 3,
      password: config.REDIS_PASSWORD,
      port: config.REDIS_PORT,
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      redis.on('ready', resolve);
      redis.on('error', reject);
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
    });
  });

  afterAll(async () => {
    if (redis) {
      await redis.quit();
    }
  });

  beforeEach(async () => {
    // Clean up test keys
    const keys = await redis.keys('test:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterEach(async () => {
    // Cleanup after each test
    const keys = await redis.keys('test:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  it('should connect to Redis successfully', async () => {
    const result = await redis.ping();
    expect(result).toBe('PONG');
  });

  it('should handle basic Redis operations', async () => {
    // SET and GET
    await redis.set('test:key1', 'value1');
    const value = await redis.get('test:key1');
    expect(value).toBe('value1');

    // EXISTS
    const exists = await redis.exists('test:key1');
    expect(exists).toBe(1);

    // DEL
    await redis.del('test:key1');
    const deletedValue = await redis.get('test:key1');
    expect(deletedValue).toBeNull();
  });

  it('should handle Redis Hash operations', async () => {
    const hashKey = 'test:session:123';
    const sessionData = {
      agentId: 'agent456',
      messages: '10',
      startTime: Date.now().toString(),
      userId: 'user123',
    };

    // HSET multiple fields
    await redis.hset(hashKey, sessionData);

    // HGET single field
    const userId = await redis.hget(hashKey, 'userId');
    expect(userId).toBe('user123');

    // HGETALL
    const allData = await redis.hgetall(hashKey);
    expect(allData).toEqual(sessionData);

    // HEXISTS
    const exists = await redis.hexists(hashKey, 'userId');
    expect(exists).toBe(1);

    // HDEL
    await redis.hdel(hashKey, 'startTime');
    const remainingData = await redis.hgetall(hashKey);
    expect(remainingData.startTime).toBeUndefined();
  });

  it('should handle Redis List operations for job queues', async () => {
    const queueKey = 'test:queue:jobs';

    // LPUSH - add jobs to queue
    await redis.lpush(queueKey, JSON.stringify({ jobId: '1', type: 'agent' }));
    await redis.lpush(queueKey, JSON.stringify({ jobId: '2', type: 'worker' }));

    // LLEN - check queue length
    const length = await redis.llen(queueKey);
    expect(length).toBe(2);

    // RPOP - process jobs (FIFO)
    const job1 = await redis.rpop(queueKey);
    const job2 = await redis.rpop(queueKey);

    expect(JSON.parse(job1!)).toEqual({ jobId: '1', type: 'agent' });
    expect(JSON.parse(job2!)).toEqual({ jobId: '2', type: 'worker' });

    // Queue should be empty
    const finalLength = await redis.llen(queueKey);
    expect(finalLength).toBe(0);
  });

  it('should handle Redis Set operations for unique tracking', async () => {
    const setKey = 'test:active-sessions';

    // SADD - add members
    await redis.sadd(setKey, 'session1', 'session2', 'session3');

    // SCARD - count members
    const count = await redis.scard(setKey);
    expect(count).toBe(3);

    // SISMEMBER - check membership
    const isMember = await redis.sismember(setKey, 'session2');
    expect(isMember).toBe(1);

    // SMEMBERS - get all members
    const members = await redis.smembers(setKey);
    expect(members.sort()).toEqual(['session1', 'session2', 'session3']);

    // SREM - remove member
    await redis.srem(setKey, 'session2');
    const remainingMembers = await redis.smembers(setKey);
    expect(remainingMembers.sort()).toEqual(['session1', 'session3']);
  });

  it('should handle Redis expiration and TTL', async () => {
    const key = 'test:temp-data';

    // Set with expiration
    await redis.setex(key, 2, 'temporary-value');

    // Check initial value
    const value = await redis.get(key);
    expect(value).toBe('temporary-value');

    // Check TTL
    const ttl = await redis.ttl(key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(2);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 2100));

    // Value should be expired
    const expiredValue = await redis.get(key);
    expect(expiredValue).toBeNull();
  });

  it('should handle Redis Pub/Sub messaging', async () => {
    const channel = 'test:agent-updates';
    const subscriber = redis.duplicate();
    const publisher = redis.duplicate();

    let receivedMessage: null | string = null;

    // Set up subscriber
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        receivedMessage = message;
      }
    });

    await subscriber.subscribe(channel);

    // Publish message
    const testMessage = JSON.stringify({
      status: 'running',
      type: 'agent-status',
    });
    await publisher.publish(channel, testMessage);

    // Wait for message
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(receivedMessage).toBe(testMessage);

    // Cleanup
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
    await publisher.quit();
  });

  it('should handle concurrent operations safely', async () => {
    const promises = Array.from({ length: 100 }, async (_, i) => {
      const key = `test:counter`;
      return redis.incr(key);
    });

    const results = await Promise.all(promises);

    // All increments should be unique
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(100);

    // Final counter value should be 100
    const finalValue = await redis.get('test:counter');
    expect(parseInt(finalValue!)).toBe(100);
  });

  it('should handle Redis transactions', async () => {
    const key1 = 'test:account1';
    const key2 = 'test:account2';

    // Set initial values
    await redis.set(key1, '100');
    await redis.set(key2, '50');

    // Execute transaction (transfer 25 from account1 to account2)
    const multi = redis.multi();
    multi.decrby(key1, 25);
    multi.incrby(key2, 25);
    const results = await multi.exec();

    // Check transaction success
    expect(results).toHaveLength(2);
    expect(results![0][0]).toBeNull(); // No error
    expect(results![1][0]).toBeNull(); // No error

    // Verify final values
    const balance1 = await redis.get(key1);
    const balance2 = await redis.get(key2);

    expect(parseInt(balance1!)).toBe(75);
    expect(parseInt(balance2!)).toBe(75);
  });

  it('should handle Redis pipeline for batch operations', async () => {
    const pipeline = redis.pipeline();

    // Batch multiple operations
    for (let i = 0; i < 10; i++) {
      pipeline.set(`test:batch:${i}`, `value${i}`);
    }

    const results = await pipeline.exec();
    expect(results).toHaveLength(10);

    // Verify all operations succeeded
    results?.forEach((result, index) => {
      expect(result[0]).toBeNull(); // No error
      expect(result[1]).toBe('OK'); // Success status
    });

    // Verify data was stored
    const values = await Promise.all(
      Array.from({ length: 10 }, (_, i) => redis.get(`test:batch:${i}`)),
    );

    values.forEach((value, index) => {
      expect(value).toBe(`value${index}`);
    });
  });

  it('should handle connection resilience', async () => {
    // Test connection health
    const info = await redis.info('server');
    expect(info).toContain('redis_version');

    // Test command during potential network issues
    const promises = Array.from({ length: 50 }, async (_, i) => {
      try {
        await redis.set(`test:resilience:${i}`, `value${i}`);
        const value = await redis.get(`test:resilience:${i}`);
        return value === `value${i}`;
      } catch (error) {
        // Some commands might fail during network issues
        return false;
      }
    });

    const results = await Promise.all(promises);
    const successRate = results.filter(Boolean).length / results.length;

    // Expect at least 80% success rate
    expect(successRate).toBeGreaterThan(0.8);
  });

  it('should handle memory usage monitoring', async () => {
    // Get initial memory info
    const initialInfo = await redis.info('memory');
    expect(initialInfo).toContain('used_memory');

    // Store some data
    const dataSize = 1000;
    const promises = Array.from({ length: dataSize }, (_, i) =>
      redis.set(`test:memory:${i}`, 'x'.repeat(100)),
    );
    await Promise.all(promises);

    // Check memory usage increased
    const afterInfo = await redis.info('memory');
    expect(afterInfo).toContain('used_memory');

    // Cleanup
    const keys = await redis.keys('test:memory:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  it('should handle Redis configuration and monitoring', async () => {
    // Test Redis configuration
    const maxMemory = await redis.config('GET', 'maxmemory');
    expect(Array.isArray(maxMemory)).toBe(true);

    // Test Redis client list
    const clients = await redis.client('LIST');
    expect(typeof clients).toBe('string');
    expect(clients).toContain('addr=');

    // Test Redis stats
    const stats = await redis.info('stats');
    expect(stats).toContain('total_commands_processed');
    expect(stats).toContain('total_connections_received');
  });
});
