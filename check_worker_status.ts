import { createClient } from 'redis';
import { Client as PgClient } from 'pg';
import { config } from './packages/core/src/config.ts';

async function checkWorkerStatus() {
  console.log('=== Worker Status Diagnostic ===');
  
  // Check Redis connection
  try {
    const redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });
    
    await redisClient.connect();
    console.log('✅ Redis connection: OK');
    
    // Check if there are jobs in the queue
    const queueLength = await redisClient.llen('tasks');
    console.log(`📋 Task queue length: ${queueLength}`);
    
    await redisClient.disconnect();
  } catch (error) {
    console.error('❌ Redis connection: FAILED', error.message);
  }
  
  // Check PostgreSQL connection
  try {
    const pgClient = new PgClient({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER || 'user',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'gforge'
    });
    
    await pgClient.connect();
    console.log('✅ PostgreSQL connection: OK');
    
    // Check sessions table
    const result = await pgClient.query('SELECT COUNT(*) FROM sessions');
    console.log(`📊 Sessions in database: ${result.rows[0].count}`);
    
    await pgClient.end();
  } catch (error) {
    console.error('❌ PostgreSQL connection: FAILED', error.message);
  }
  
  // Check LLM provider configuration
  console.log('\n=== LLM Configuration ===');
  console.log(`LLM Provider: ${process.env.LLM_PROVIDER || config.LLM_PROVIDER}`);
  console.log(`LLM Model: ${process.env.LLM_MODEL_NAME || config.LLM_MODEL_NAME}`);
  console.log(`API Key configured: ${!!process.env.LLM_API_KEY}`);
  
  console.log('\n=== Recommendations ===');
  console.log('1. Check LLM API key validity');
  console.log('2. Verify network connectivity to LLM provider');
  console.log('3. Check if the LLM model name is correct');
  console.log('4. Consider reducing the complexity of prompts if responses are truncated');
}

checkWorkerStatus().catch(console.error);