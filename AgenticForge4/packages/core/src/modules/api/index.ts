// FICHIER : src/server.ts
import '../../tracing.js'; // Initialize OpenTelemetry
import { Client as PgClient } from 'pg';

import logger from '../../logger.js';
import { jobQueue } from '../../modules/queue/queue.js';
import { redis } from '../../modules/redis/redisClient.js';
import { initializeWebServer } from '../../webServer.js';

async function startApplication() {
  logger.info("Démarrage de l'application AgenticForge...");

  const pgClient = new PgClient({
    connectionString: process.env.DATABASE_URL,
  });
  await pgClient.connect();
  logger.info('Connected to PostgreSQL.');

  try {
    // Démarrer le serveur web
    logger.info('Démarrage du serveur web...');
    await initializeWebServer(redis, jobQueue, pgClient);
    logger.info('Serveur web AgenticForge démarré.');
  } catch (error) {
    logger.error(
      { error },
      "Erreur lors de l'initialisation de l'application.",
    );
    throw error; // Rethrow to be caught by the final catch block
  }
}

startApplication().catch((error) => {
  logger.error(error, "Erreur critique lors du démarrage de l'application.");
  process.exit(1);
});
