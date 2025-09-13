#!/usr/bin/env node
// Script to fix Redis connection for workers running outside Docker containers

import { createClient } from 'redis';
import { config, loadConfig } from './packages/core/src/config.ts';

async function fixRedisConnection() {
  console.log('🔧 Fixing Redis connection configuration...');
  
  // Load the configuration
  await loadConfig();
  
  // Check if we're running in Docker
  const isDocker = process.env.DOCKER === 'true';
  
  console.log('🐋 Running in Docker:', isDocker);
  console.log('📍 Current Redis host:', config.REDIS_HOST);
  
  // If we're not in Docker, we need to connect to the Docker container
  // The Docker container exposes Redis on localhost:6379
  // But inside the container network, Redis is accessible as 'redis'
  if (!isDocker) {
    console.log('🔧 Setting Redis host to localhost for host processes');
    // This should already be set in the .env file
    process.env.REDIS_HOST = 'localhost';
  } else {
    console.log('🔧 Setting Redis host to redis for container processes');
    process.env.REDIS_HOST = 'redis';
  }
  
  // Test the connection
  try {
    const client = createClient({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    
    client.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
    
    console.log('🔗 Attempting to connect to Redis at', process.env.REDIS_HOST + ':' + (process.env.REDIS_PORT || '6379'));
    await client.connect();
    console.log('✅ Successfully connected to Redis');
    await client.disconnect();
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
  }
}

fixRedisConnection().catch(console.error);