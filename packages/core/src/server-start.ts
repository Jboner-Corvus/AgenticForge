import { Client as PgClient } from 'pg';

import { config, loadConfig } from './config.ts';
import { getLoggerInstance } from './logger.ts';
import { getRedisClientInstance } from './modules/redis/redisClient.ts';
import { initializeWebServer } from './webServer.ts';

async function startServer() {
  await loadConfig(); // Load configuration
  // Initialize logger after config is loaded
  const logger = getLoggerInstance();
  logger.info(`Resolved WORKSPACE_PATH: ${config.WORKSPACE_PATH}`);
  logger.info(`Resolved HOST_PROJECT_PATH: ${config.HOST_PROJECT_PATH}`);
  await new Promise((res) => setTimeout(res, 15000));

  let pgClient: null | PgClient = null;
  let connected = false;
  for (let i = 0; i < 5; i++) {
    try {
      logger.info('PostgreSQL Connection Parameters:');
      logger.info(`  Database: ${config.POSTGRES_DB}`);
      logger.info(`  Host: ${config.POSTGRES_HOST}`);
      logger.info(`  Port: ${config.POSTGRES_PORT}`);
      logger.info(`  User: ${config.POSTGRES_USER}`);
      logger.info(
        `  Password: ${config.POSTGRES_PASSWORD ? '********' : 'undefined'}`,
      );
      pgClient = new PgClient({
        database: config.POSTGRES_DB,
        host: config.POSTGRES_HOST,
        password: config.POSTGRES_PASSWORD,
        port: config.POSTGRES_PORT,
        user: config.POSTGRES_USER,
      });
      await pgClient.connect();
      logger.info('Connected to PostgreSQL.');
      connected = true;
      break;
    } catch (err) {
      logger.warn(
        { err },
        `Failed to connect to PostgreSQL, retrying... (${i + 1}/5)`,
      );
      await new Promise((res) => setTimeout(res, 10000));
    }
  }

  if (!connected || !pgClient) {
    logger.error('Could not connect to PostgreSQL after 5 attempts, exiting.');
    process.exit(1);
  }

  pgClient.on('error', (err) => {
    logger.error({ err }, 'PostgreSQL client error');
  });

  const redisClient = getRedisClientInstance();
  const { server } = await initializeWebServer(pgClient, redisClient);

  const port = config.PORT || 3001;
  server.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });

  process.on('exit', () => {
    pgClient?.end();
    logger.info('PostgreSQL client disconnected.');
  });
}

startServer().catch((err) => {
  getLoggerInstance().fatal({ err }, 'Failed to start web server');
  process.exit(1);
});
