#!/usr/bin/env node

/**
 * Single External Worker for Agentic Forge
 * 
 * This worker runs outside of Docker containers and connects to Redis
 * using the host network interface.
 */

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config, loadConfig } from './packages/core/src/config';
import { getLogger } from './packages/core/src/logger';
import { initializeWorker } from './packages/core/src/worker';

const logger = getLogger();

async function startExternalWorker() {
  logger.info('🚀 Starting Single External Worker...');
  
  try {
    // Load configuration
    await loadConfig();
    logger.info('✅ Configuration loaded successfully');
    
    // Create Redis connection for external worker
    // Connect to localhost since we're running outside Docker
    const redisConnection = new IORedis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, delaying ${delay}ms`);
        return delay;
      }
    });

    redisConnection.on('connect', () => {
      logger.info('Successfully connected to Redis.');
    });

    redisConnection.on('error', (err) => {
      logger.error({ err }, 'Redis connection error:');
    });

    redisConnection.on('close', () => {
      logger.warn('Redis connection closed.');
    });

    redisConnection.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Initialize the worker with our Redis connection
    const worker = await initializeWorker(redisConnection);
    
    logger.info(`✅ Worker started with concurrency: ${config.WORKER_CONCURRENCY}`);
    
    // Graceful shutdown handling
    const shutdown = async () => {
      logger.info('🛑 Shutting down worker...');
      try {
        await worker.close();
        await redisConnection.quit();
        logger.info('✅ Worker shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during worker shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    logger.info('✅ External worker is now running and waiting for jobs...');
    
  } catch (error) {
    logger.error({ error }, '❌ Failed to start external worker');
    process.exit(1);
  }
}

// Only start if this file is run directly
// Using an async IIFE to handle top-level await properly
(async () => {
  if (import.meta.url === `file://${process.argv[1]}`) {
    await startExternalWorker();
  }
})();

export default startExternalWorker;