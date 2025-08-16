import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { Pool, PoolClient } from 'pg';
import { getConfig } from './config.js';

describe('PostgreSQL Advanced Integration Tests', () => {
  let pool: Pool;
  let config: ReturnType<typeof getConfig>;

  beforeAll(async () => {
    config = getConfig();
    
    // Create PostgreSQL connection pool
    pool = new Pool({
      host: config.POSTGRES_HOST,
      port: config.POSTGRES_PORT,
      database: config.POSTGRES_DB,
      user: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  beforeEach(async () => {
    // Setup test tables if needed
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_sessions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    // Cleanup test data
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM test_sessions');
    } finally {
      client.release();
    }
  });

  it('should establish connection to PostgreSQL', async () => {
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('now');
    } finally {
      client.release();
    }
  });

  it('should handle concurrent connections properly', async () => {
    const promises = Array.from({ length: 10 }, async (_, i) => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT $1::int as id', [i]);
        return result.rows[0].id;
      } finally {
        client.release();
      }
    });

    const results = await Promise.all(promises);
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should handle transactions correctly', async () => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      
      await client.query(
        'INSERT INTO test_sessions (session_id, data) VALUES ($1, $2)',
        ['test-tx-1', { test: 'transaction' }]
      );

      // Verify data exists within transaction
      const result1 = await client.query(
        'SELECT * FROM test_sessions WHERE session_id = $1',
        ['test-tx-1']
      );
      expect(result1.rows).toHaveLength(1);

      await client.query('ROLLBACK');

      // Verify data doesn't exist after rollback
      const result2 = await client.query(
        'SELECT * FROM test_sessions WHERE session_id = $1',
        ['test-tx-1']
      );
      expect(result2.rows).toHaveLength(0);
    } finally {
      client.release();
    }
  });

  it('should handle JSONB operations efficiently', async () => {
    const client = await pool.connect();

    try {
      const testData = {
        agent: { id: 'agent-1', type: 'assistant' },
        session: { messages: [], metadata: { version: 1 } },
        performance: { startTime: Date.now(), metrics: { cpu: 0.5, memory: 100 } }
      };

      await client.query(
        'INSERT INTO test_sessions (session_id, data) VALUES ($1, $2)',
        ['jsonb-test', testData]
      );

      // Test JSONB path queries
      const result1 = await client.query(
        "SELECT data->'agent'->>'id' as agent_id FROM test_sessions WHERE session_id = $1",
        ['jsonb-test']
      );
      expect(result1.rows[0].agent_id).toBe('agent-1');

      // Test JSONB containment
      const result2 = await client.query(
        "SELECT * FROM test_sessions WHERE data @> $1",
        [JSON.stringify({ agent: { type: 'assistant' } })]
      );
      expect(result2.rows).toHaveLength(1);

      // Test JSONB update
      await client.query(
        "UPDATE test_sessions SET data = jsonb_set(data, '{performance,metrics,memory}', '200') WHERE session_id = $1",
        ['jsonb-test']
      );

      const result3 = await client.query(
        "SELECT data->'performance'->'metrics'->>'memory' as memory FROM test_sessions WHERE session_id = $1",
        ['jsonb-test']
      );
      expect(result3.rows[0].memory).toBe('200');
    } finally {
      client.release();
    }
  });

  it('should handle connection pool exhaustion gracefully', async () => {
    const smallPool = new Pool({
      host: config.POSTGRES_HOST,
      port: config.POSTGRES_PORT,
      database: config.POSTGRES_DB,
      user: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      max: 2, // Very small pool
      connectionTimeoutMillis: 1000,
    });

    try {
      const client1 = await smallPool.connect();
      const client2 = await smallPool.connect();

      // This should timeout since pool is exhausted
      await expect(async () => {
        const client3 = await smallPool.connect();
        client3.release();
      }).rejects.toThrow();

      client1.release();
      client2.release();
    } finally {
      await smallPool.end();
    }
  });

  it('should handle prepared statements efficiently', async () => {
    const client = await pool.connect();

    try {
      // Prepare statement
      await client.query({
        name: 'insert-session',
        text: 'INSERT INTO test_sessions (session_id, data) VALUES ($1, $2)',
        values: []
      });

      // Use prepared statement multiple times
      const promises = Array.from({ length: 5 }, async (_, i) => {
        await client.query({
          name: 'insert-session',
          text: 'INSERT INTO test_sessions (session_id, data) VALUES ($1, $2)',
          values: [`session-${i}`, { index: i }]
        });
      });

      await Promise.all(promises);

      const result = await client.query('SELECT COUNT(*) as count FROM test_sessions');
      expect(parseInt(result.rows[0].count)).toBe(5);
    } finally {
      client.release();
    }
  });

  it('should handle large dataset operations', async () => {
    const client = await pool.connect();

    try {
      // Insert large dataset
      const batchSize = 1000;
      const values = Array.from({ length: batchSize }, (_, i) => 
        `('batch-${i}', '{"data": ${i}}')`
      ).join(',');

      await client.query(`
        INSERT INTO test_sessions (session_id, data) 
        VALUES ${values}
      `);

      // Test pagination
      const pageSize = 100;
      const result = await client.query(
        'SELECT * FROM test_sessions ORDER BY id LIMIT $1 OFFSET $2',
        [pageSize, 0]
      );

      expect(result.rows).toHaveLength(pageSize);

      // Test aggregation
      const countResult = await client.query('SELECT COUNT(*) as total FROM test_sessions');
      expect(parseInt(countResult.rows[0].total)).toBe(batchSize);
    } finally {
      client.release();
    }
  });

  it('should handle connection recovery after network issues', async () => {
    const client = await pool.connect();

    try {
      // Simulate network issue by killing connection
      await client.query('SELECT pg_terminate_backend(pg_backend_pid())').catch(() => {
        // Expected to fail
      });
    } catch (error) {
      // Connection should be marked as unusable
    } finally {
      client.release(true); // Force release
    }

    // Pool should recover and create new connection
    const newClient = await pool.connect();
    try {
      const result = await newClient.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    } finally {
      newClient.release();
    }
  });

  it('should monitor pool statistics', async () => {
    const initialStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    const client = await pool.connect();
    
    // Pool stats should change
    expect(pool.totalCount).toBeGreaterThanOrEqual(initialStats.totalCount);
    expect(pool.idleCount).toBeLessThan(initialStats.idleCount + 1);

    client.release();

    // After release, idle count should increase
    expect(pool.idleCount).toBeGreaterThanOrEqual(initialStats.idleCount);
  });

  it('should handle database schema migrations', async () => {
    const client = await pool.connect();

    try {
      // Create migration table
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if migration exists
      const existingMigration = await client.query(
        'SELECT * FROM migrations WHERE name = $1',
        ['add_test_column']
      );

      if (existingMigration.rows.length === 0) {
        // Run migration
        await client.query('BEGIN');
        
        await client.query(
          'ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS test_column VARCHAR(255)'
        );
        
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          ['add_test_column']
        );
        
        await client.query('COMMIT');
      }

      // Verify migration was applied
      const columns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'test_sessions' AND column_name = 'test_column'
      `);
      
      expect(columns.rows).toHaveLength(1);
    } finally {
      client.release();
    }
  });
});