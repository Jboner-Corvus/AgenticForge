#!/usr/bin/env node
// Script to test PostgreSQL connection

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testPostgresConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'gforge',
    max: 5, // Limit pool size for testing
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    // Test basic connection
    console.log('🔗 Attempting to connect to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL');
    
    // Test a simple query
    console.log('📝 Running a simple query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query executed successfully');
    console.log('   PostgreSQL version:', result.rows[0].version);
    
    // Check current connections
    console.log('📊 Checking current connections...');
    const connResult = await client.query(`
      SELECT count(*) as connections 
      FROM pg_stat_activity 
      WHERE datname = $1
    `, [process.env.POSTGRES_DB || 'gforge']);
    
    console.log(`   Current connections: ${connResult.rows[0].connections}`);
    
    client.release();
    
    // Test pool end
    console.log('🔚 Closing connection pool...');
    await pool.end();
    console.log('✅ Connection pool closed successfully');
    
    console.log('\n🎉 All PostgreSQL tests passed!');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:');
    console.error('   Error:', (error as Error).message);
    
    if ((error as any).code) {
      console.error('   Error code:', (error as any).code);
    }
    
    // Try to end pool even on error
    try {
      await pool.end();
    } catch (endError) {
      console.error('   Error closing pool:', (endError as Error).message);
    }
    
    return false;
  }
}

// Run the test
testPostgresConnection().catch(console.error);