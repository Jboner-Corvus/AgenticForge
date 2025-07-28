import { Client as PgClient } from 'pg';

import { config, loadConfig } from './config.js';
import logger from './logger.js';
import { jobQueue } from './modules/queue/queue.js';
import { redis } from './modules/redis/redisClient.js';
import { initializeWebServer } from './webServer.js';

async function startServer() {
  loadConfig(); // Load configuration
  const pgClient = new PgClient({
    database: config.POSTGRES_DB,
    host: config.POSTGRES_HOST,
    password: config.POSTGRES_PASSWORD,
    port: config.POSTGRES_PORT,
    user: config.POSTGRES_USER,
  }); // Initialize PostgreSQL client

  try {
    await pgClient.connect();
    logger.info('Connected to PostgreSQL.');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PostgreSQL.');
    process.exit(1);
  }

  const app = await initializeWebServer(redis, jobQueue, pgClient);

  const port = config.PORT || 3001;
  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  logger.fatal({ err }, 'Failed to start web server');
  process.exit(1);
});
