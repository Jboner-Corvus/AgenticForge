import { config, loadConfig } from './config.ts';
import { getLoggerInstance } from './logger.ts';
import { getRedisClientInstance } from './modules/redis/redisClient.ts';
import { getPostgresPool, DatabaseCircuitBreaker, getPostgresMonitor } from './modules/database/index.ts';
import { initializeWebServer } from './webServer.ts';

// Add handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = getLoggerInstance();
  logger.fatal({ promise, reason }, 'Unhandled rejection caught!');
  // Don't exit the process immediately, just log the error
});

// Add handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = getLoggerInstance();
  logger.fatal({ error }, 'Uncaught exception caught!');
  // Don't exit the process immediately, just log the error
});

async function checkServerLock(redisClient: any): Promise<boolean> {
  const lockKey = 'server:singleton:lock';
  const lockTimeout = 60; // 60 seconds
  const processId = `${process.pid}:${Date.now()}`;
  
  try {
    // Try to set lock with expiration
    const result = await redisClient.set(lockKey, processId, 'EX', lockTimeout, 'NX');
    
    if (result === 'OK') {
      getLoggerInstance().info(`✅ Server lock acquired by process ${process.pid}`);
      
      // Refresh lock periodically
      const refreshInterval = setInterval(async () => {
        try {
          const currentLock = await redisClient.get(lockKey);
          if (currentLock === processId) {
            await redisClient.expire(lockKey, lockTimeout);
            getLoggerInstance().debug(`🔄 Server lock refreshed by process ${process.pid}`);
          } else {
            clearInterval(refreshInterval);
            getLoggerInstance().warn(`⚠️ Server lock lost by process ${process.pid}, shutting down`);
            process.exit(0);
          }
        } catch (error) {
          getLoggerInstance().error({ error }, 'Error refreshing server lock');
        }
      }, (lockTimeout / 2) * 1000);
      
      // Clean up on exit
      process.on('SIGTERM', async () => {
        clearInterval(refreshInterval);
        await redisClient.del(lockKey);
        getLoggerInstance().info(`🧹 Server lock released by process ${process.pid}`);
      });
      
      process.on('SIGINT', async () => {
        clearInterval(refreshInterval);
        await redisClient.del(lockKey);
        getLoggerInstance().info(`🧹 Server lock released by process ${process.pid}`);
      });
      
      return true;
    } else {
      const existingLock = await redisClient.get(lockKey);
      getLoggerInstance().warn(`❌ Server already running with lock: ${existingLock}, process ${process.pid} will exit`);
      return false;
    }
  } catch (error) {
    getLoggerInstance().error({ error }, 'Error checking server lock');
    return false;
  }
}

async function startServer() {
  await loadConfig(); // Load configuration
  // Initialize logger after config is loaded
  const logger = getLoggerInstance();
  
  // Check server singleton lock before proceeding
  const redisClient = getRedisClientInstance();
  const canProceed = await checkServerLock(redisClient);
  
  if (!canProceed) {
    logger.info('🚫 [SERVER] Another server is already running, exiting...');
    process.exit(0);
  }
  
  logger.info(`Resolved WORKSPACE_PATH: ${config.WORKSPACE_PATH}`);
  logger.info(`Resolved HOST_PROJECT_PATH: ${config.HOST_PROJECT_PATH}`);

  // Initialize PostgreSQL pool and monitoring
  const poolManager = getPostgresPool();
  const circuitBreaker = new DatabaseCircuitBreaker();
  const monitor = getPostgresMonitor(poolManager);

  logger.info('PostgreSQL Connection Parameters:');
  logger.info(`  Database: ${config.POSTGRES_DB}`);
  logger.info(`  Host: ${config.POSTGRES_HOST}`);
  logger.info(`  Port: ${config.POSTGRES_PORT}`);
  logger.info(`  User: ${config.POSTGRES_USER}`);
  logger.info(`  Password: ${config.POSTGRES_PASSWORD ? '********' : 'undefined'}`);
  logger.info(`  Pool Config: min=${poolManager.getStats().idleCount}, max=20`);

  // Test de connexion avec circuit breaker et retry
  let connected = false;
  for (let i = 0; i < 5; i++) {
    try {
      await circuitBreaker.execute(async () => {
        const client = await poolManager.getClient();
        await client.query('SELECT 1 as connection_test');
        client.release();
      });

      logger.info('PostgreSQL pool initialized successfully');
      connected = true;
      break;
    } catch (err) {
      logger.warn(
        { err },
        `Failed to initialize PostgreSQL pool, retrying... (${i + 1}/5)`,
      );
      await new Promise((res) => setTimeout(res, 10000));
    }
  }

  if (!connected) {
    logger.error('Could not initialize PostgreSQL pool after 5 attempts, exiting.');
    process.exit(1);
  }

  // Log initial health status
  const healthStatus = monitor.getHealthStatus();
  logger.info({ healthStatus }, 'PostgreSQL initial health status');

  // Créer un wrapper compatible pour l'ancienne interface
  const dbWrapper = {
    query: (text: string, params?: any[]) => poolManager.query(text, params),
    // Méthodes de compatibilité pour l'ancienne interface
    connect: async () => {
      const client = await poolManager.getClient();
      return client;
    },
    end: async () => {
      await poolManager.close();
    },
    on: (event: string, handler: Function) => {
      // Gestion basique des événements
      if (event === 'error') {
        // Log errors through circuit breaker
        logger.error('Database wrapper error event');
      }
    }
  };

  const { server } = await initializeWebServer(dbWrapper as any, redisClient);

  const port = config.PORT || 3001;
  server.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });

  process.on('exit', async () => {
    await poolManager.close();
    logger.info('PostgreSQL pool closed.');
  });

  // Gestion propre de l'arrêt
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await poolManager.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await poolManager.close();
    process.exit(0);
  });
}

startServer().catch((err) => {
  getLoggerInstance().fatal({ err }, 'Failed to start web server');
  process.exit(1);
});
