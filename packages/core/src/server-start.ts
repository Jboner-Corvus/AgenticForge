import { Client as PgClient } from 'pg';

import { config, loadConfig } from './config.js';
import { getLoggerInstance } from './logger.js';
import { jobQueue } from './modules/queue/queue.js';
import { initializeWebServer } from './webServer.js';

async function startServer() {
  await loadConfig(); // Load configuration
  await new Promise((res) => setTimeout(res, 15000));

  let pgClient: null | PgClient = null;
  let connected = false;
  for (let i = 0; i < 5; i++) {
    try {
      pgClient = new PgClient({
        database: config.POSTGRES_DB,
        host: config.POSTGRES_HOST,
        password: config.POSTGRES_PASSWORD,
        port: config.POSTGRES_PORT,
        user: config.POSTGRES_USER,
      });
      await pgClient.connect();
      getLoggerInstance().info('Connected to PostgreSQL.');
      connected = true;
      break;
    } catch (err) {
      getLoggerInstance().warn(
        { err },
        `Failed to connect to PostgreSQL, retrying... (${i + 1}/5)`,
      );
      await new Promise((res) => setTimeout(res, 10000));
    }
  }

  if (!connected || !pgClient) {
    getLoggerInstance().error(
      'Could not connect to PostgreSQL after 5 attempts, exiting.',
    );
    process.exit(1);
  }

  pgClient.on('error', (err) => {
    getLoggerInstance().error({ err }, 'PostgreSQL client error');
  });

  const { server } = await initializeWebServer(jobQueue, pgClient);

  const port = config.PORT || 3001;
  server.listen(port, () => {
    getLoggerInstance().info(`Server listening on port ${port}`);
  });

  process.on('exit', () => {
    pgClient?.end();
    getLoggerInstance().info('PostgreSQL client disconnected.');
  });
}

startServer().catch((err) => {
  getLoggerInstance().fatal({ err }, 'Failed to start web server');
  process.exit(1);
});
